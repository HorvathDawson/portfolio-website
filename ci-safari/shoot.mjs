// Temporary: render the laptop lid and device cards in WebKit (Safari's engine).
import { webkit, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
const out = 'ci-safari/shots'; mkdirSync(out, { recursive: true });
const browser = await webkit.launch();
const base = 'http://localhost:4400/';
const lid = (a) => `translateY(-110%) perspective(1100px) translateY(110%) rotateX(-${a}deg)`;
for (const [name, opts] of [['desktop', { viewport: { width: 1400, height: 900 } }]]) {
  const ctx = await browser.newContext(opts); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(base + '?drafts', { waitUntil: 'networkidle' });
  const card = p.locator('.project-card', { hasText: 'Self Driving Car' }).first();
  await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const bb = await card.boundingBox(); if (name === 'desktop') { await p.mouse.move(bb.x + 8, bb.y + 8); await p.waitForTimeout(800); }
  const variants = {
    // A: perspective on the parent (what master has)
    A: { parent: true, t: (a) => `rotateX(-${a}deg)` },
    // B: perspective in the lid's transform, vanishing point shifted up
    B: { parent: false, t: lid },
    // C: same, shift written the other way round
    C: { parent: false, t: (a) => `translateY(110%) perspective(1100px) translateY(-110%) rotateX(-${a}deg)` },
  };
  for (const [v, { parent, t }] of Object.entries(variants)) {
    await card.locator('[data-scroll]').first().evaluate((e, parent) => {
      const par = e.parentElement;
      par.style.perspective = parent ? '1100px' : '';
      par.style.perspectiveOrigin = parent ? '50% -40%' : '';
    }, parent);
    for (const a of [90, 75, 45, 0]) {
      await card.locator('[data-scroll]').first().evaluate((e, tr) => { e.style.transition = 'none'; e.style.transform = tr; }, t(a));
      await p.waitForTimeout(300);
      await card.screenshot({ path: `${out}/${name}-${v}-${a}.png` });
    }
  }
  console.log(name, 'errors', JSON.stringify(errs)); await ctx.close();
}
await browser.close();
