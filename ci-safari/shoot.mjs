// Temporary: render the laptop lid in WebKit (Safari's engine) at fixed angles and while scrolling.
import { webkit, devices } from 'playwright';
import { mkdirSync, readFileSync } from 'node:fs';
const out = 'ci-safari/shots'; mkdirSync(out, { recursive: true });
const bundle = readFileSync('ci-safari/lid-bundle.js', 'utf8');
const browser = await webkit.launch();
for (const [name, opts] of [['desktop', { viewport: { width: 1400, height: 900 } }], ['iphone', devices['iPhone 13']]]) {
  const ctx = await browser.newContext(opts); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:4400/', { waitUntil: 'networkidle' });
  await p.addScriptTag({ content: bundle });
  const card = p.locator('.project-card', { hasText: 'Self Driving Car' }).first();
  await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const bb = await card.boundingBox(); if (name === 'desktop') { await p.mouse.move(bb.x + 8, bb.y + 8); await p.waitForTimeout(800); }
  for (const a of [90, 80, 70, 45, 0]) {
    await card.locator('[data-scroll]').first().evaluate((e, a) => { e.style.transform = LID.lidTransform(e, a); }, a);
    await p.waitForTimeout(300);
    await card.screenshot({ path: `${out}/${name}-angle-${a}.png` });
  }
  // The real scroll animation, with the card below centre and then centred.
  for (const f of [0.75, 0.4, 0]) {
    const top = await card.evaluate((e) => e.getBoundingClientRect().top + scrollY + e.offsetHeight / 2);
    await p.evaluate(([t, f]) => scrollTo(0, t - innerHeight / 2 - f * innerHeight / 2), [top, f]); await p.waitForTimeout(800);
    await p.screenshot({ path: `${out}/${name}-scroll-${f}.png` });
  }
  console.log(name, 'errors', JSON.stringify(errs)); await ctx.close();
}
await browser.close();
