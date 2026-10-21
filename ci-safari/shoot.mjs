// Temporary: render the laptop lid and device cards in WebKit (Safari's engine).
import { webkit, devices } from 'playwright';
import { mkdirSync } from 'node:fs';
const out = 'ci-safari/shots'; mkdirSync(out, { recursive: true });
const browser = await webkit.launch();
const base = 'http://localhost:4400/';
const lid = (a) => `translateY(-110%) perspective(1100px) translateY(110%) rotateX(-${a}deg)`;
for (const [name, opts] of [['desktop', { viewport: { width: 1400, height: 900 } }], ['iphone', devices['iPhone 13']]]) {
  const ctx = await browser.newContext(opts); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(base + '?drafts', { waitUntil: 'networkidle' });
  const card = p.locator('.project-card', { hasText: 'Self Driving Car' }).first();
  await card.scrollIntoViewIfNeeded(); await p.waitForTimeout(800);
  const bb = await card.boundingBox(); if (name === 'desktop') { await p.mouse.move(bb.x + 8, bb.y + 8); await p.waitForTimeout(800); }
  for (const a of [90, 75, 60, 35, 0]) {
    await card.locator('[data-scroll]').first().evaluate((e, t) => { e.style.transition = 'none'; e.style.transform = t; }, lid(a));
    await p.waitForTimeout(300);
    await card.screenshot({ path: `${out}/${name}-laptop-${a}.png` });
  }
  // Real scroll: card below centre, then centred
  for (const f of [0.9, 0.5, 0]) {
    const top = await card.evaluate((e) => e.getBoundingClientRect().top + scrollY + e.offsetHeight / 2);
    await p.evaluate(([t, f]) => scrollTo(0, t - innerHeight / 2 - f * innerHeight / 2), [top, f]); await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/${name}-scroll-${f}.png` });
  }
  for (const t of ['Can I Fish This?', 'Next Web Project', 'Next Tablet Project', 'Next Big-Screen Project', '1950 A40 Austin']) {
    const c = p.locator('.project-card', { hasText: t }).first(); await c.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
    if (name === 'desktop') { const b = await c.boundingBox(); await p.mouse.move(b.x + 8, b.y + 8); await p.waitForTimeout(900); }
    await c.screenshot({ path: `${out}/${name}-card-${t.replace(/\W+/g, '-')}.png` });
  }
  console.log(name, 'errors', JSON.stringify(errs)); await ctx.close();
}
await browser.close();
