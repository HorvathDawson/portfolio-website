---
id: A40-007
title: Shared constants file (YAML → Python → JSON → posts)
status: review
owner: constants agent
reviewer:
blocked_by: A40-001, A40-004
---

## Why
Numbers are typed by hand into a dozen posts and scripts and drift apart. One file should drive all of them.

## Design
- `content/a40/constants.yaml`: inputs only (masses, track, wheelbase, ET, tyre size, MR, target frequencies, CG, RC band…). Each entry has `value`, `unit`, `status` (locked/working/target/open/measure) and `note`.
- `scripts/a40_constants.py`: loads the YAML, computes derived values (track from hub face and ET, tyre OD, corner masses, wheel and spring rates, roll stiffness, roll angle, critical damping, rpm table…), writes `src/blog/a40-constants.generated.json`. Importable from the plot scripts: `from a40_constants import C`.
- Posts use `{{name}}` (formatted value with unit) or `{{name:raw}}`. `blogData.ts` substitutes at load. An unknown placeholder throws, so the build fails.
- The build-constants tables are generated from the YAML (a `{{table:vehicle}}`-style block), so that page can't disagree with the file.
- roadmapData.ts reads the JSON instead of literals.
- `npm run build` runs the Python step first, or the generated JSON is committed and a check fails if it's stale.

## Acceptance criteria
- [x] Changing one input (e.g. ET) and rebuilding changes every dependent number in posts and plots
- [x] Unknown `{{placeholder}}` fails `npm run build` with the post and name in the error
- [x] Derived values match A40-000 (unit tests in Python: track 1234, OD 647.5, corners 231/181, roll stiffness 13.5/14.4, damping 4.1/3.4)
- [x] Plot scripts import the constants; no duplicated literals for the same quantities
- [x] README section in the YAML header explains how to add a constant

## Implementer notes (constants agent, 2026-10-24)
Pipeline: `content/a40/constants.yaml` (inputs, 90 entries: value/unit/status/note) → `scripts/a40_constants.py` (`derive()` computes track from hub face and ET, tyre OD and circumference, curb/sprung/corner masses, wheel rates and bands, rear springs per MR case, roll stiffness K = Kw·T²/2, critical damping, LLTD start, rpm table at 100 km/h, shaft/U-joint angles, rear hub face and narrowing, fitment edges, Ackermann knuckle angle; `derive_geometry()` adds the MR-dependent ones: front spring, lb/in, damping at the damper, stroke for stock travel, roll arm) + `scripts/a40_geometry_results.json` (87 kinematic results written by `plot_geometry_reference.py`: RC/IC/jacking, pivots, MR at 65–90°, travel, roll angles and ARB adds per rear RC and CG, bar stiffness, KPI/caster/scrub/trail, Ackermann excess, weight transfer, turning circles) → `src/blog/a40-constants.generated.json` (committed; value, unit, text, raw, status, kind, note + the build-constants tables).

- Geometry results carry a hash of the input values; `a40_constants.py` refuses to write if they were computed from other inputs.
- `npm run constants` = `python3 scripts/plot_geometry_reference.py --results-only` (~1 s, no plots; writes results + JSON). Without the flag it also redraws all plots (~65 s).
- Staleness: the JSON stores a hash of the YAML, `a40_constants.py` and the geometry results. `node scripts/check-constants.mjs` (first step of `npm run build`) recomputes it in Node, then pushes every `{{…}}` in content/a40 through the site's own substitution code and loads roadmapData.ts. `npm run check-constants` also runs `python3 scripts/a40_constants.py --check` (byte-for-byte regeneration). pyyaml 6.0.3 was available; no npm dependencies added.
- Placeholders: `{{name}}` (value + unit), `{{name:raw}}`, `{{name:N}}` (N decimals), `{{name:rN}}` (round to N), combinable; `{{table:vehicle|wheels|suspension|drivetrain}}`. Formatting is half-up with a U+2212 minus, identical in Python (`format_number`) and TS (`formatNumber`).
- Substitution hook: `substitutePostBody(car, slug, body)` in `src/blog/a40Constants.ts`, called from `parsePost()` in `src/blog/blogData.ts` (rendered posts) and from `searchDoc()` in `vite.plugins.ts` (search index), so both see the same text; other cars pass through unchanged.
- Self-tests (`python3 scripts/a40_constants.py --test`, also run on every write): 17 checks of the formulas fed with the A40-000 inputs (track 1234 / nominal 1230, hub face 655, OD 647.5, corners 231/181, curb 875 / sprung ~825, wheel rates 17.9/16.1, roll stiffness 13.5/14.4/28.0, damping 4.1/3.4, rpm 2890 in 6th at 4.44 and 3640/3360/3200 in 5th, rear hub face 708 and narrowing 42/47, rack 190, shaft 5.4 / joints 2.4, Ackermann 17.40, poke 35/37, rounding). They test the formulas, so changing an input in the YAML does not trip them.
- Sensitivity check: ET 38 → 40 in the YAML made `check-constants` fail as stale; after regenerating, 10 posts changed (track 1234→1230, half-track 617→615, rear hub face 708→710, rear narrowing 42–47→40–45, scrub +0.6→−1.4 mm, tyre edges, ET labels…) and 11 plots changed. Reverted; plots and renders came back identical to the ET38 state.
- Unknown placeholder: `{{bogus_track}}` and `{{front_track:xx}}` appended to steering.md → `npm run build` exits 1 with `content/a40/steering.md: unknown constant {{bogus_track}}` and `unknown modifier :xx in {{front_track}}`.
- Plot script: every build input comes from `C` (tracks, ET, hub faces, tyre ODs/sizes, wheelbases, masses, CG ± tol, rear RC band, rear MR cases, ride frequencies and bands, roll targets, lateral g, shock angle/stroke/bump split/length, ARB IR and length, driveshaft angles); labels that printed literals (CG 575/525/625, 3–4°, 1.2–1.6 Hz, 1365/+35 mm, tyre sizes) are now formatted from them. Only the scanned donor geometry (SUSP) and plot styling remain local.

Intended corrections that changed rendered numbers (both resolve review notes from A40-001/002):
1. Miata tyre OD is now derived from 185/60R14 = 577.6 mm (script used 577.0 while the posts said 577.6): hub height 300.25→299.95 (+34.95), front RC 139.2→139.0, jacking 22.6→22.5% (≈930→≈920 N), RC tyre effect +15.8→+15.7, scrub +0.53→+0.59 (posts "+0.5"→"+0.6"), roll axis 122/113→121/112.
2. Masses are derived exactly (sprung 824, corners 231.25/180.75 instead of hand-rounded 825/231/181): ARB adds 31.8/23.8/17.8→31.7/23.7/17.7, 33.0/18.7→32.9/18.6, CG-625 ARB need 30→29, rear springs 38.1/28.6/22.3→38.0/28.5/22.2 (shown 38/29/22, unchanged).
3. "~106–112 mm stroke" → 105–112 (155–165 mm × 0.680; the roadmap already said 105–112). MR in travel 0.678–0.692 → 0.678–0.691 (now measured inside the 83/103 mm travel).
4. build-constants: rear RC status "model" → "measure" (status now comes from the constant); legend gains "measure" and a line saying the tables are generated from constants.yaml.

## Verification
_Filled by the reviewer._
