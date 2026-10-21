// Records the "Can I Fish This?" card's screen recordings from the live site,
// one for the desktop monitor and one for the phone, so they can be refreshed
// whenever canifishthis.ca changes:
//
//   npm install --no-save playwright && npx playwright install chromium
//   node scripts/record-demos.mjs
//
// Needs ffmpeg with libwebp. The GitHub Action in .github/workflows/record-demos.yml
// runs this and commits the results. Each run writes, in
// public/assets/projects/bc-fishing-regulations/:
//   desktop-demo.webp, mobile-demo.webp          animated, looping
//   desktop-demo-still.webp, mobile-demo-still.webp   last frame, for reduced motion
//
// Environment: DEMO_URL (default https://canifishthis.ca/), DEMO_SEARCH (the
// waterbody to look up, default "Harrison Lake"), and DEMO_HEADER, an optional
// "Name: value" header sent with every request. canifishthis.ca sits behind
// Cloudflare's bot check, which stops browsers on GitHub's servers; a WAF rule
// that skips the check for requests carrying this secret header lets the
// recorder in (see README.md).
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const URL = process.env.DEMO_URL ?? 'https://canifishthis.ca/';
const HEADER = process.env.DEMO_HEADER?.match(/^\s*([^:\s]+)\s*:\s*(.+?)\s*$/);
const SEARCH = process.env.DEMO_SEARCH ?? 'Harrison Lake';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'projects', 'bc-fishing-regulations');

// Viewports match the screens in the desktop-and-phone drawing
// (src/components/visuals/DeviceDisplay.tsx): 1.75:1 and about 0.47:1.
const VIEWS = [
  { name: 'desktop', viewport: { width: 1400, height: 800 }, outWidth: 960, touch: false },
  { name: 'mobile', viewport: { width: 390, height: 832 }, outWidth: 300, touch: true },
];

/** A visible cursor (desktop) or tap ripple (phone), since recordings don't show the pointer. */
const POINTER = (touch) => `
  addEventListener('DOMContentLoaded', () => {
    const dot = document.createElement('div');
    Object.assign(dot.style, {
      position: 'fixed', zIndex: 2147483647, pointerEvents: 'none', left: '-100px', top: '-100px',
      width: '${touch ? 44 : 22}px', height: '${touch ? 44 : 22}px', margin: '${touch ? -22 : -11}px 0 0 ${touch ? -22 : -11}px',
      borderRadius: '50%', background: 'rgba(112, 56, 207, 0.35)', border: '2px solid rgba(112, 56, 207, 0.9)',
      transition: 'transform 0.15s, opacity 0.3s', opacity: '${touch ? 0 : 1}',
    });
    document.body.appendChild(dot);
    const move = (e) => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; };
    addEventListener('pointermove', move, true);
    addEventListener('pointerdown', (e) => { move(e); dot.style.opacity = '1'; dot.style.transform = 'scale(0.7)'; }, true);
    addEventListener('pointerup', () => { dot.style.transform = 'scale(1)'; ${touch ? "setTimeout(() => (dot.style.opacity = '0'), 400);" : ''} }, true);
  });`;

const pause = (page, ms) => page.waitForTimeout(ms);

/** Glide the mouse to an element and click it, so the cursor's path shows in the recording. */
async function point(page, locator, touch) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('target not visible');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  if (touch) return locator.tap();
  // Few steps: on a busy machine each one waits for the map to repaint.
  await page.mouse.move(x, y, { steps: 8 });
  await pause(page, 250);
  await page.mouse.down();
  await page.mouse.up();
}

/** The scripted visit. Returns seconds from the start of the video where the recording should begin. */
async function visit(page, touch, started) {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  // Cloudflare's bot check ("Just a moment...") never lets an automated browser through on its own.
  await page.waitForTimeout(3000);
  if (/just a moment/i.test(await page.title())) {
    throw new Error(
      `${URL} answered with Cloudflare's bot check. Add a WAF rule that skips it for requests with a secret header, ` +
        'and set that header as DEMO_HEADER ("Name: value"; in GitHub, the DEMO_HEADER repository secret). Or run this script on your own computer.',
    );
  }
  // Wait out the loading screen: it may take a moment to appear, then a while to go.
  const loading = page.getByText(/loading waterbody data/i);
  await loading.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  await loading.waitFor({ state: 'hidden', timeout: 120_000 });
  const box = page
    .locator('input[type="search"], input[placeholder*="search" i], [role="searchbox"], [role="combobox"], input[aria-label*="search" i]')
    .first();
  await box.waitFor({ state: 'visible', timeout: 30_000 });
  if (!touch) await page.mouse.move(page.viewportSize().width * 0.55, page.viewportSize().height * 0.6);
  await pause(page, 2500); // let the first map tiles draw
  // Start the recording on the loaded map, a moment before the search.
  const begin = (Date.now() - started) / 1000 - 1.2;

  // Look the waterbody up and open it.
  await point(page, box, touch);
  await box.pressSequentially(SEARCH, { delay: 90 });
  await pause(page, 900);
  const result = page.locator('[role="option"], li, button, a').filter({ hasText: new RegExp(SEARCH, 'i') }).first();
  await result.waitFor({ state: 'visible', timeout: 15_000 });
  await point(page, result, touch);
  // On a phone the first tap can just highlight the row; tap again, then try Enter.
  for (const retry of [() => point(page, result, touch), () => box.press('Enter')]) {
    if (!(await result.isVisible({ timeout: 1500 }).catch(() => false))) break;
    await pause(page, 1500);
    if (await result.isVisible().catch(() => false)) await retry().catch(() => {});
  }
  await pause(page, 3500);

  // Scroll the regulations a little so the panel reads as live.
  const panel = page.getByText(/regulations/i).first();
  if (!touch && (await panel.isVisible().catch(() => false))) {
    const b = await panel.boundingBox();
    if (b) {
      await page.mouse.move(b.x + b.width / 2, b.y + 120, { steps: 15 });
      for (let i = 0; i < 6; i++) {
        await page.mouse.wheel(0, 70);
        await pause(page, 120);
      }
    }
  }
  await pause(page, 2500);
  return begin;
}

/** Longest recording kept, in seconds, so the files stay small. */
const MAX_SECONDS = 20;

function encode(video, start, { name, outWidth }) {
  const out = path.join(OUT, `${name}-demo.webp`);
  const still = path.join(OUT, `${name}-demo-still.webp`);
  const scale = `fps=10,scale=${outWidth}:-2:flags=lanczos`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(start), '-t', String(MAX_SECONDS), '-i', video, '-vf', scale, '-c:v', 'libwebp_anim', '-quality', '55', '-compression_level', '6', '-loop', '0', out]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-sseof', '-0.4', '-i', video, '-vf', `scale=${outWidth}:-2:flags=lanczos`, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', still]);
  console.log(`  wrote ${path.relative(process.cwd(), out)} and its still`);
}

/** What the page looks like when a step fails, so the script can be fixed without seeing the site. */
async function describe(page, name) {
  const dir = path.join(process.cwd(), 'record-demos-debug');
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${name}.png`) }).catch(() => {});
  const info = await page
    .evaluate(() => ({
      url: location.href,
      title: document.title,
      inputs: [...document.querySelectorAll('input, textarea, [role="searchbox"], [role="combobox"], [contenteditable="true"]')].map((e) =>
        [e.tagName, e.getAttribute('type'), e.getAttribute('placeholder'), e.getAttribute('aria-label'), e.getAttribute('role')].join(' | '),
      ),
      text: document.body?.innerText.slice(0, 1500),
    }))
    .catch((err) => ({ error: String(err) }));
  console.error(`--- ${name}: what the page shows ---\n${JSON.stringify(info, null, 2)}`);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const tmp = mkdtempSync(path.join(tmpdir(), 'demos-'));
try {
  for (const view of VIEWS) {
    console.log(`${view.name}: recording ${URL}`);
    const context = await browser.newContext({
      viewport: view.viewport,
      isMobile: view.touch,
      hasTouch: view.touch,
      deviceScaleFactor: 1,
      recordVideo: { dir: tmp, size: view.viewport },
      extraHTTPHeaders: HEADER ? { [HEADER[1]]: HEADER[2] } : undefined,
    });
    await context.addInitScript(POINTER(view.touch));
    const page = await context.newPage();
    const started = Date.now();
    let begin;
    try {
      begin = await visit(page, view.touch, started);
    } catch (err) {
      await describe(page, view.name);
      throw err;
    }
    const video = await page.video().path();
    await context.close(); // finishes writing the video
    encode(video, Math.max(0, begin), view);
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
