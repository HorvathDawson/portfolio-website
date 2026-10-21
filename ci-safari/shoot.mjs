// Temporary: render the laptop lid in WebKit (Safari's engine) at fixed angles and while scrolling.
import { webkit, devices } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
const out = 'ci-safari/shots'; mkdirSync(out, { recursive: true });
const bundle = readFileSync('ci-safari/lid-bundle.js', 'utf8');
const browser = await webkit.launch();
for (const [name, opts] of [['desktop', { viewport: { width: 1400, height: 900 } }], ['iphone', devices['iPhone 13']]]) {
  // Fixed angles: reduced motion stops the page's own scroll animation from overwriting them.
  const still = await browser.newContext({ ...opts, reducedMotion: 'reduce' });
  const q = await still.newPage();
  await q.goto('http://localhost:4400/', { waitUntil: 'networkidle' });
  await q.addScriptTag({ content: bundle });
  const sc = q.locator('.project-card', { hasText: 'Self Driving Car' }).first();
  await sc.scrollIntoViewIfNeeded(); await q.waitForTimeout(800);
  const sb = await sc.boundingBox(); if (name === 'desktop') { await q.mouse.move(sb.x + 8, sb.y + 8); await q.waitForTimeout(800); }
  const clip = await sc.boundingBox();
  for (const a of [90, 80, 70, 45, 0]) {
    const info = await sc.locator('[data-scroll]').first().evaluate((e, a) => { e.style.transform = LID.lidTransform(e, a); return [e.offsetWidth, e.offsetHeight, e.className, e.style.transform]; }, a);
    await q.waitForTimeout(300);
    console.log(name, a, JSON.stringify(info));
    await q.screenshot({ path: `${out}/${name}-angle-${a}.png`, clip });
  }
  await still.close();

  const ctx = await browser.newContext(opts); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:4400/', { waitUntil: 'networkidle' });
  const card = p.locator('.project-card', { hasText: 'Self Driving Car' }).first();
  // The real scroll animation, with the card below centre and then centred.
  for (const f of [0.9, 0.75, 0.55, 0.4, 0.2, 0]) {
    const top = await card.evaluate((e) => e.getBoundingClientRect().top + scrollY + e.offsetHeight / 2);
    await p.evaluate(([t, f]) => scrollTo(0, t - innerHeight / 2 - f * innerHeight / 2), [top, f]); await p.waitForTimeout(800);
    await p.screenshot({ path: `${out}/${name}-scroll-${f}.png` });
  }
  console.log(name, 'errors', JSON.stringify(errs)); await ctx.close();
}
await browser.close();
