---
id: A40-008
title: Replace hard-coded numbers with constants
status: done
owner: constants agent
reviewer: independent reviewer agent (2026-10-24, did not implement)
blocked_by: A40-007
---

## Files
All of content/a40/*.md, scripts/plot_geometry_reference.py, scripts/a40-*.py, src/blog/roadmapData.ts

## Acceptance criteria
- [x] Every number listed in constants.yaml is a placeholder in the posts (grep for the literal values returns only the YAML, generated JSON, and historical log entries where the old value is the point)
- [x] Rendered posts read the same as before apart from intended corrections (diff the rendered text)
- [x] Plots regenerate identically or with intended changes only

## Implementer notes (constants agent, 2026-10-24)
- 727 placeholders across 11 posts (build-constants, suspension-tuning, geometry-design-reference, narrowing-analysis, donor-geometry-dimensions, rear-suspension, steering, design-overview, frame-design, design-finalization, overview). build-constants' four tables are `{{table:…}}` blocks generated from the `tables:` section of constants.yaml; its CG mass table uses placeholders for fuel, driver, corner and total masses. Electrical posts, teardown, frame-jig, motor-selection and suspension-options have no constants.
- roadmapData.ts: 31 strings now use `k()` / `raw()` from a40Constants.ts (track, hub faces, narrowing, rack, ET, tyre, MR, wheel rates, springs, stroke, masses, roll, final drive, driveshaft angles, axle load, one edge label). Task ids, edges and statuses unchanged; the evaluated `roadmap` object is identical to the pre-change one (JSON dump diffed: no difference). `node scripts/check-roadmap-plan.mjs`: 0 FAIL.
- Rendered-text check: every content/a40 post rendered before and after through `parsePost()` (marked + KaTeX + heading ids), HTML→text, diffed. 12 posts identical. Changes only in build-constants, donor-geometry-dimensions, geometry-design-reference, narrowing-analysis, rear-suspension, suspension-tuning, and every changed number is one of the corrections listed in A40-007 (OD 577.6, exact masses, 105–112 stroke, 0.691, rear RC status, legend text).
- Plots: with the two input corrections temporarily reverted, the regenerated plots are visually identical to the pre-work commit f649f8c. The 4 that still differ at pixel level (arb_sizing, ride_frequency, roll_vs_cg, rc_tire_comparison) show the same curves and labels; the differences are anti-aliasing from floating-point noise, plus the legend reading "577.0 mm OD" instead of "577 mm OD". With the corrections in place: arb_sizing, roll_vs_cg ("sprung mass 824 kg"), ride_frequency, jacking, rc_combined, rc_construction, rc_tire_comparison (577.6 mm OD), rc_migration_a40/miata move slightly. All other plots are pixel-identical.
- Literals left on purpose (not constants, or the old value is the point): scanned donor coordinates and forum-CAD columns; the ET25/30/38/45 sweep table and the 175–205 width rows in narrowing-analysis; Δ columns (+85, −188, −240, 1605 mm) in the donor/A40 comparison table; rack 225/260 mm for hypothetical tyre widths; RC migration extents (±68/±203 mm, 41–286/38–321 mm), which are drawn inside the migration plot and not exported; U-joint life 6240 h (plot label); "old 0.62–0.63 / 175 mm / 17°" history; roadmap line 44 (glossary comment), the t-buy-wheels purchase record ("+38 offset") and "Within 2 mm of stock" in the track decision.

## Verification
Independent reviewer, 2026-10-24 (working tree 6d0da56, clean).

- **Box 1 (placeholders) FAIL, see Failed checks.** Scripted grep: every numeric constant/derived value (raw text) matched against the literal numbers left in content/a40/*.md after stripping `{{…}}`: 226 hits, nearly all coincidental (electrical posts, scanned donor coordinates, mass-table ranges, the ET25–45 sweep table, Δ columns, dates, list numbers). Legitimate per the implementer notes: ET sweep table and 175–205 rows (narrowing-analysis:65-70), Δ columns, scanned coordinates, RC migration extents (±69, 41–286), U-joint 6240 h, roadmapData.ts:45 glossary comment ("rear ~42–47 mm/side"), "old 0.62–0.63". Not legitimate: the dependent prose numbers in narrowing-analysis:72 and :80 below. The ET 38→40 sensitivity run (A40-007 Verification) confirms they go stale: the post then reads "At the exact 1230 mm track the table gives +74 (35 mm/side …)".
- **Box 2 (rendered text) pass.** Rendered every content/a40 post at f649f8c (pre-work) and 715dd0b (this ticket's commit) with each commit's own `parsePost()` via vite `ssrLoadModule`, HTML→text, word diff. 12 posts identical; 6 changed (build-constants, donor-geometry-dimensions, geometry-design-reference, narrowing-analysis, rear-suspension, suspension-tuning), and every changed token is a listed correction: 106→105–112 stroke, 139.2→139.0, 300.25→299.95 (+34.95), +0.5→+0.6 scrub, +15.8→+15.7, 22.6%/≈930→22.5%/≈920 N, roll axis 122/113→121/112, ARB 31.8/23.8/17.8→31.7/23.7/17.7, 33.0/18.7→32.9/18.6, 30→29, 0.692→0.691, rear RC status model→measure, plus the new legend sentence.
- **Box 3 (plots) pass.** Regenerated all plots in a scratch copy (`python3 scripts/plot_geometry_reference.py`, exit 0, 61 s): all 23 PNGs, scripts/a40_geometry_results.json and the generated JSON byte-identical to the committed files. Spot-checked ride_frequency.png (231/181 kg corners, 17.9 @ 1.4 Hz, spring 38.7 N/mm (221 lb/in) at MR 0.680, rear 38/29/22 at MR 0.65/0.75/0.85, 1.2–1.6 Hz band), arb_sizing.png (28.0 kN·m/rad springs; 32/24/18 at 3/3.5/4°; band RC 80–150; CG 525/625; 19–28 mm bars at IR 1.71) and roll_vs_cg.png (6.1/6.9/7.8° at CG 525/575/625; +24 kN·m/rad puts 575 mm at 3.5°; "sprung mass 824 kg") against their captions in suspension-tuning and geometry-design-reference: all match.
- roadmapData.ts: `k()`/`raw()` used; `node scripts/check-roadmap-plan.mjs` 0 FAIL; build passes.

### Failed checks
1. content/a40/narrowing-analysis.md:72 has ET- and track-dependent literals: "+70 mm", "the table gives +74", "the 2 mm difference", "~35 mm further *inboard*". Fix: add derived values in `derive()` in scripts/a40_constants.py, after `tyre_inner_edge`:
   `put("tyre_outer_gain", oo - a40_out, "mm", "working", "Nominal outer-to-outer minus stock A40.", decimals=0, signed=True)`,
   `put("tyre_outer_gain_exact", t + i["tyre_width"] - a40_out, "mm", "working", decimals=0, signed=True)`,
   `put("tyre_poke_rounding", (t - tn) / 2, "mm", "working", decimals=0)`,
   `put("tyre_inner_shift", (i["a40_stock_track"] - i["a40_stock_tyre_width"]) / 2 - (ht - i["tyre_width"] / 2), "mm", "working", decimals=0)`;
   then write `stock: {{tyre_outer_gain}}, {{tyre_poke}}/side`, `the table gives {{tyre_outer_gain_exact:raw}}`, `the {{tyre_poke_rounding}} difference`, `reaches ~{{tyre_inner_shift}} further *inboard*`. Run `npm run constants`, `npm run check-constants`, and re-run the ET 38→40 test in a scratch copy (should read +70 / 35 / 0 mm / 37 at ET40).
2. content/a40/narrowing-analysis.md:80 "higher ET (ET45 = −7 mm/side …), narrower tyre (195 = −5 mm/side)" is relative to ET38/205. Fix: make it independent of the inputs, e.g. "higher ET (each extra mm of ET moves the tyre 1 mm inboard; check caliper clearance), narrower tyre (each 10 mm narrower brings the outer edge in 5 mm/side)".
3. (minor) content/a40/geometry-design-reference.md:109 img alt "Body roll at 0.8 g" → "Body roll at {{lateral_accel}}".

## Fixes after review (constants agent, 2026-10-24)
Working tree, not committed.

1. **narrowing-analysis:72 dependent literals** → new derived values in `derive()` (scripts/a40_constants.py, after `tyre_inner_edge`): `tyre_outer_gain` (oo − stock outer, signed), `tyre_outer_gain_exact` (exact track, signed), `tyre_poke_rounding` (|t − tn| / 2), `tyre_inner_shift` (stock inner edge − new inner edge). The post now reads `stock: {{tyre_outer_gain}}, {{tyre_poke}}/side`, `the table gives {{tyre_outer_gain_exact:raw}}`, `the {{tyre_poke_rounding}}/side difference`, `~{{tyre_inner_shift}} further *inboard*`. New self-test: "+70 (+74 exact), rounding 2, inner shift 35" (18 self-tests now).
2. **narrowing-analysis:80** → input-independent wording: "higher ET (each extra mm of ET moves the tyre 1 mm inboard per side; check caliper clearance), narrower tyre (each 10 mm narrower brings the outer edge in 5 mm per side)".
3. **geometry-design-reference:109** img alt → "Body roll at {{lateral_accel}} vs CG height…" (renders "0.8 g").
4. (from A40-009 optional note) UCA bracket position: new derived `uca_cant_half` (6.2 mm), `uca_pivot_front` (279 mm), `uca_pivot_rear` (267 mm) in `derive_geometry()` from `uca_pivot` and `uca_cant_offset`. narrowing-analysis step 3 now says 273 mm is the pivot-line midpoint, front pivot 279 / rear 267, "do not build both brackets at 273"; frame-design "Front inner pivots" row and design-overview front-suspension row say "pivot-line midpoint, front/rear ±6.2 mm with the plan cant".

**ET 38→40 sensitivity re-run** (scratch copy, node_modules symlinked, `wheel_et: 40`, full plot run exit 0, rendered through `parsePost()`): narrowing-analysis reads "+70 mm, 35 mm/side … exact 1230 mm track the table gives +70 (35 mm/side: outer edge 717.5 vs 682.5) … the 0 mm/side difference … ~37 mm further inboard (inner edge 512.5 vs 549.5)". Self-consistent (717.5 − 682.5 = 35, 549.5 − 512.5 = 37). The real repo still has ET 38 (+70 / +74 / 2 / 35, as before).

**Commands (real repo, all exit 0):** `npm run constants`; `python3 scripts/plot_geometry_reference.py` (only lca_plan.png and uca_plan.png changed, from the A40-009 label fixes); `npm run check-constants` (752 placeholders, 18 posts); `python3 scripts/a40_constants.py --test` (18 ok); `node scripts/check-roadmap-plan.mjs` (0 FAIL); `npm run lint`; `npm run build`. Rendered-post link check: 156 links, 0 broken; no `{{` left in rendered text.

### Re-check of the fixes (2026-10-24)
Re-check, independent reviewer (did not implement the fixes), 2026-10-24, on 80c37a3 + A40-010 working tree: 
- Fix 1: scripts/a40_constants.py `derive()` has `tyre_outer_gain`, `tyre_outer_gain_exact`, `tyre_poke_rounding`, `tyre_inner_shift`, plus a self-test (+70/+74/2/35). narrowing-analysis:72 uses them. Rendered text: "1230 + 205 = 1435 mm vs 1232 + 133 = 1365 mm stock: +70 mm, 35 mm/side … exact 1234 mm track the table gives +74 (37 mm/side: outer edge 719.5 vs 682.5 mm) … the 2 mm/side difference … ~35 mm further inboard (inner edge 514.5 vs 549.5 mm)". Hand-checked: 1234+205−1365 = 74, 719.5−682.5 = 37, (1234−1230)/2 = 2, 549.5−514.5 = 35. (ET40 run not repeated; the derivations are input-driven and the self-test covers ET38.)
- Fix 2: narrowing-analysis:80 now reads "each extra mm of ET moves the tyre 1 mm inboard per side … each 10 mm narrower brings the outer edge in 5 mm per side": input-independent.
- Fix 3: roll_vs_cg alt renders "Body roll at 0.8 g vs CG height…".
- Extra (UCA brackets): `uca_cant_half`/`uca_pivot_front`/`uca_pivot_rear` derived; narrowing-analysis step 3, frame-design and design-overview render "273 mm … pivot-line midpoint … ±6.2 mm … 279/267 mm".
- Commands: `npm run check-constants` (752 placeholders, 18 posts, generated up to date), `python3 scripts/a40_constants.py --test` (18 ok), `node scripts/check-roadmap-plan.mjs` (0 FAIL), `npm run build`, `npm run lint`: all exit 0. No `{{` in any rendered post (20 posts). Plot regeneration (A40-010): only rc_migration_* changed (A40-010's dpi change); JSON outputs byte-identical.
**Pass; status done.**
