---
id: A40-010
title: Build, lint, links and visual check
status: done
owner: build-check agent (2026-10-24)
reviewer: build-check agent; asset cleanup to be eyeballed in the A40-011 PR review
blocked_by: A40-009
---

## Files
- public/assets/projects/a40-austin/blog/** (asset cleanup)
- scripts/plot_geometry_reference.py (rc_migration dpi), scripts/a40-dash-wiring.py (SVG only)

## Acceptance criteria
- [x] `npm run build` passes
- [x] `npm run lint` passes (no new warnings in touched files)
- [x] Every internal `./slug` and `#heading` link in content/a40 resolves (script check)
- [x] Every image referenced in content/a40 exists under public/
- [x] Screenshots of the A40 roadmap, rear-suspension, suspension-tuning and geometry-reference pages at desktop and phone width: tables don't overflow, maths renders, figures load
- [x] sitemap includes rear-suspension and not rear-axle / four-link-rear
- [x] Unreferenced public/ assets for the garage removed; oversized referenced images ≤ 1600 px wide

## Verification
2026-10-24, working tree on 80c37a3 (not committed).

**Asset cleanup.** Grepped every file under public/ by basename across src/, content/, index.html, vite.config.ts, vite.plugins.ts, scripts/, worker/, wrangler.jsonc, public/_redirects; the DCDC manual by full path.
- `git rm`: `blog/dash/PICAN3_UGA_10.pdf` (10,491,779 B, old board), `blog/dash/dash-wiring.png` (696,912 B; the post uses dash-wiring.svg), `blog/Tech-01-Motion-ratios-4.pdf` (243,306 B), `blog/reference/PWR-DCDC-USB-manual.pdf` (391,645 B; byte-identical duplicate, digital-dash links the `blog/dash/` copy, which stays).
- `scripts/a40-dash-wiring.py`: WireViz `-f sp` → `-f s` (SVG only) and docstring, so a re-run does not bring the PNG back. Not re-run (wireviz output unchanged otherwise).
- `reference/sr20-downpipe-routing.png` 2547×3296 → 1600×2071 (Lanczos, PNG, alpha kept): 5,226,254 → 2,371,479 B. Displayed at 780 px (design-overview).
- `reference/upper-control-arm.png` (960×563, already ≤ 2× its 520 px display): lossless re-save with optimize: 1,018,364 → 779,836 B.
- `plots/rc_migration_{a40,miata}.png` 2724×1975 → 1580×1145: `save()` takes a `dpi` argument and `_plot_rc_migration_panel` saves at dpi=145 (other plots still 250). Full `python3 scripts/plot_geometry_reference.py` (exit 0, 64 s): only these two PNGs changed; scripts/a40_geometry_results.json and src/blog/a40-constants.generated.json byte-identical; no post text or constant changed. 638,032 → 325,035 and 711,140 → 359,546 B. Labels readable in the post (`desk-el-geometry-design-reference-rcmig.png`).
- **Total: 19,417,432 → 3,835,896 B, 15.6 MB saved (public/ 42 MB → 27 MB).** `npm run check-constants` exit 0 (752 placeholders, generated up to date).
- Left alone (outside the garage, may be built dynamically from names, e.g. `*-1500.webp`, `*-still.webp`): resume.pdf, opensim2real/source/*.gif, opensim2real leg/glow PNGs, electric-skateboard skateboard.svg (1.1 MB) and motor-bracket.jpg, buell section-view.png (850 KB), devices/*.svg, header/layer-*-1500.webp, fume/self-driving `*-still.webp`. Basename grep finds no reference; worth a separate portfolio ticket. `plots/rc_migration_miata.png` is not used by any post but is script output, kept.

**Build/lint.** `npm run build` exit 0 (check-constants, tsc, check-roadmap-plan, vite; no warnings). `npm run lint` exit 0, no warnings (only the baseline-browser-mapping "data is old" notice).

**Links/images** (Playwright on the built site, all 20 posts from the sitemap): 237 internal links (./slug, #heading, /garage/…, /assets/…) checked against the target page's element ids and public/: 0 broken. All 31 `/assets/` refs in content/ (30 images, 1 PDF) served with 200 and an image/pdf type; after scrolling, every `<img>` on the checked pages has naturalWidth > 0. No `{{` in any rendered post.

**Sitemap** (dist/sitemap.xml): /garage, /garage/a40, /garage/autozam, /garage/a40/roadmap, all 18 a40 posts (incl. rear-suspension) and both autozam posts; no /a40, rear-axle or four-link-rear.

**Screenshots** (`vite preview --port 5205`, chromium.launch(), 1440×900 and 390×844 isMobile/hasTouch; `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/final/`): /, /garage, /garage/a40, rear-suspension, geometry-design-reference, suspension-tuning, build-constants, roadmap Next up / Tree / Map, /garage/autozam, autozam/car-facts, a40/no-such-post, plus element shots (`*-el-*.png`) of tables, maths and figures. On every page: documentElement and body scrollWidth = viewport width (390 / 1440); no table, maths, figure or pre extends past the viewport outside its own scroll box; 0 console errors, 0 page errors, 0 failed requests; one h1. KaTeX: 11 on geometry-design-reference, 5 suspension-tuning, 2 build-constants, 0 `.katex-error`. Rear-suspension rpm table renders 4 columns × 3 rows (scrolls inside its box at 390). Home page: the A40 card links to `/garage`. Looked at the shots: tables, maths, figures and the roadmap views render correctly; the phone car-page h1 title looks the same as before.

Ticket re-checks done in the same pass: GAR-005, GAR-006, A40-008, A40-009 all pass (see each ticket).
