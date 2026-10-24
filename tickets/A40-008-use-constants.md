---
id: A40-008
title: Replace hard-coded numbers with constants
status: review
owner: constants agent
reviewer:
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
_Filled by the reviewer._
