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
// waterbody to look up, default "Harrison Lake").
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const URL = process.env.DEMO_URL ?? 'https://canifishthis.ca/';
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
  await page.mouse.move(x, y, { steps: 25 });
  await pause(page, 250);
  await page.mouse.down();
  await page.mouse.up();
}

/** The scripted visit. Returns seconds from the start of the video where the loaded site first shows. */
async function visit(page, touch, started) {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page
    .getByText(/loading waterbody data/i)
    .waitFor({ state: 'hidden', timeout: 90_000 })
    .catch(() => console.warn('  no loading message seen; carrying on'));
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
  const loaded = (Date.now() - started) / 1000;
  if (!touch) await page.mouse.move(page.viewportSize().width * 0.55, page.viewportSize().height * 0.6);
  await pause(page, 1500);

  // Look the waterbody up and open it.
  const box = page.getByPlaceholder(/search/i).first();
  await point(page, box, touch);
  await box.pressSequentially(SEARCH, { delay: 90 });
  await pause(page, 900);
  const result = page.locator('[role="option"], li, button, a').filter({ hasText: new RegExp(SEARCH, 'i') }).first();
  await result.waitFor({ state: 'visible', timeout: 15_000 });
  await point(page, result, touch);
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
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
  return loaded;
}

function encode(video, start, { name, outWidth }) {
  const out = path.join(OUT, `${name}-demo.webp`);
  const still = path.join(OUT, `${name}-demo-still.webp`);
  const scale = `fps=12,scale=${outWidth}:-2:flags=lanczos`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', String(start), '-i', video, '-vf', scale, '-c:v', 'libwebp_anim', '-quality', '62', '-compression_level', '6', '-loop', '0', out]);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-sseof', '-0.4', '-i', video, '-vf', `scale=${outWidth}:-2:flags=lanczos`, '-frames:v', '1', '-c:v', 'libwebp', '-quality', '85', still]);
  console.log(`  wrote ${path.relative(process.cwd(), out)} and its still`);
}

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
    });
    await context.addInitScript(POINTER(view.touch));
    const page = await context.newPage();
    const started = Date.now();
    const loaded = await visit(page, view.touch, started);
    const video = await page.video().path();
    await context.close(); // finishes writing the video
    // Keep a moment of the loaded map before the action; drop the blank start.
    encode(video, Math.max(0, loaded - 0.3), view);
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
