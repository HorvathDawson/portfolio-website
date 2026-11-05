---
id: A40-007
title: Shared constants file (YAML → Python → JSON → posts)
status: done
owner: constants agent
reviewer: independent reviewer agent (2026-10-24, did not implement)
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
Independent reviewer, 2026-10-24. Working tree at 6d0da56 (clean). Scratch work in a copy of the repo (node_modules symlinked); nothing in the real repo changed except tickets/.

**Commands (real repo, all exit 0):** `npm run build` (check-constants → tsc → roadmap check → vite build, built in 4.5 s); `npm run lint`; `npm run check-constants` ("736 placeholders in 18 posts resolve", "generated constants are up to date"); `python3 scripts/a40_constants.py --test` ("ok: 17 self-tests"); `node scripts/check-roadmap-plan.mjs` (0 FAIL lines).

**Read:** content/a40/constants.yaml (header explains entry format, how to add a constant in 4 steps, modifiers, tables; every entry has value/unit/status/note) and scripts/a40_constants.py (`derive()`, `derive_geometry()`, input-hash guard on the geometry results, `--check`/`--test`).

**Hand recomputation vs src/blog/a40-constants.generated.json** (independent Python, not importing the module; all equal to float precision):
| Value | Hand | JSON text |
|---|---|---|
| front_track 2·(1420/2+40−95−38) | 1234 | 1234 mm |
| tyre_od 15·25.4+2·205·0.65 / Miata 14·25.4+2·185·0.60 | 647.5 / 577.6 | 647.5 / 577.6 mm |
| corner masses (950·0.55−60)/2, (950·0.45−66)/2; sprung 950−60−66 | 231.25 / 180.75 / 824 | 231 / 181 / 824 kg |
| kw_front/rear (2πf)²m | 17.894 / 16.055 | 17.9 / 16.1 N/mm |
| kw_front_lo (1.2 Hz) / kw_rear_hi (1.7 Hz) | 13.15 / 20.62 | 13 / 21 |
| spring_front 17.894/0.679594² ; lb/in ÷0.17513 | 38.74 ; 221.2 | 38.7 N/mm ; 221 lb/in |
| spring_rear_mid 16.055/0.75² | 28.54 | 28.5 |
| roll stiffness 17.894·1.23²/2, 16.055·1.34²/2 | 13.54 / 14.41 | 13.5 / 14.4 (28.0) |
| roll angle, rear RC 100: h_RA 139.03+0.45·(100−139.03)=121.47, arm 0.4535 m, φ = 824·0.8·9.81·0.4535/(27950−824·9.81·0.4535) | 0.1208 rad = 6.92° | 6.9° |
| roll angle at RC 150 / 80 (same formula) | 6.53° / 7.08° | 6.5 / 7.1° |
| ARB to add, 3° at RC 100: 2933/0.05236+3666−27950 | 31.7 | 31.7 |
| critical damping 2√(k·m) | 4.068 / 3.407 kN·s/m | 4.1 / 3.4; at damper 4.068/0.6796² = 8.81 → 8.8 |
| rpm at 100 km/h, wheel 819.3 rpm (π·0.6475 m) ×4.44×{1, 0.794, 0.759}; ×4.10×0.794 | 3638 / 2888 / 2761; 2667 | 3640 / 2890 / 2760; 2670 |
| shaft atan(3.5/37); joints −3° | 5.404° / 2.404° | 5.4° / 2.4° |
| rear hub face 670+38; narrowing 750−708, 755−708 | 708; 42 / 47 | 708; 42 / 47 |
| tyre poke (1230+205−1365)/2; Ackermann atan(710/2265) | 35; 17.404° | 35 mm; 17.40° |
| lateral transfer 950·0.8·9.81·h/T: Miata 0.46/1.42, A40 0.575/1.23 | 2415 / 3485 N (+44%) | 2415 / 3485 N (+44%) |

**Sensitivity (scratch copy):** `wheel_et` 38 → 40. `npm run check-constants` then failed (exit 1: "a40-constants.generated.json is stale"). `npm run constants` + `npm run build` passed. Rendered every content/a40 post through `parsePost()` (vite `ssrLoadModule`) before and after: 10 posts changed (build-constants 10 lines, geometry-design-reference 22, donor-geometry-dimensions 11, narrowing-analysis 7, suspension-tuning 5, rear-suspension 4, frame-design 2, design-overview 1, design-finalization 1, steering 1): track 1234→1230, rear hub face 708→710, rear narrowing 42–47→40–45, half-track 617→615, MR 0.680→0.681, spring 38.7→38.6, RC 139.0→138.8, scrub +0.6→−1.4 mm, ET labels. Full plot run (61 s): 11 PNGs changed (ackermann_topview, arb_sizing, jacking, motion_ratio, motion_ratio_vs_angle, rc_combined, rc_migration_a40/miata, rc_tire_comparison, ride_frequency, roll_vs_cg). Reverting to 38 and rerunning: all 23 plots, the JSON and a40_geometry_results.json byte-identical to the repo. Caveat: a few prose numbers in narrowing-analysis are still literals and did not follow the change (+74, "2 mm difference", "~35 mm further inboard", "ET45 = −7 mm/side"); that is placeholder coverage, tracked as a failed check in A40-008, not a pipeline fault. Roll stiffness uses the nominal 1230 mm track by design (documented in the YAML note), so it only moves in 10 mm track steps.

**Unknown placeholder (scratch copy):** `{{bogus_track}}` appended to rear-suspension.md → `npm run build` exit 1, "content/a40/rear-suspension.md: unknown constant {{bogus_track}} (content/a40/constants.yaml)". `{{Front_Track}}` → exit 1, "malformed placeholder {{Front_Track}}". No `{{` left in any rendered post.

**Plot script:** `from a40_constants import C`; grep for 1234/1230/655/647.5/577.6/950/575/17.9/16.1/231/181/0.68/4.44 in scripts/plot_geometry_reference.py finds only the docstring, comments and label x-positions (1420 in the rack-narrowing zone labels). Only scripts/plot_geometry_reference.py needs the constants (the other a40-*.py scripts are dash/splash/wiring).

Result: all five boxes pass.
