---
id: A40-009
title: Independent cross-post consistency review
status: in-progress
owner: consistency-review agent (2026-10-24)
reviewer: independent reviewer agent (2026-10-24, did not edit any A40 file)
blocked_by: A40-001 … A40-008
---

## Why
Each fix agent saw only its own files. Someone needs to read the whole build log as the owner will use it.

## Acceptance criteria
- [ ] Every A40 post read end to end; any number that disagrees with constants.yaml listed and fixed
- [x] Physics spot-checks redone by hand: ride frequency, roll angle, LLTD, damping, rpm table, U-joint angles, track/ET, tyre OD
- [x] No mention of Ford 9", four-link, live-axle coilovers or 950 mm spring base except as history
- [x] No pronoun or name errors; first-person voice kept in log posts
- [x] Each post opens with decisions/numbers, procedures as numbered steps, no duplicated tables (links instead)
- [x] Plot fixes: `lca_plan.png` "ARB link" and "Coilover" labels don't overlap; `uca_plan.png` / `pickups_3view.png` draw the UCA axis with its real plan cant (captions updated to match)
- [x] Smaller review notes from A40-004/005 tickets resolved

## Implementer notes (consistency-review agent, 2026-10-24)

Read every post in content/a40 rendered through the site's own `parsePost()` / `substitutePostBody()` (vite SSR, script in the agent scratchpad), against constants.yaml, A40-000 and the later owner decisions (A40-005/A40-012): Miata IRS + RX-8 + custom half-shafts; assist open (manual or Prius Gen 4 EPAS, every fault fails to manual); dash Pi + display on DCDC-USB V(out) at 5 V; battery probably in the boot; gearbox CD009 or Z32. Not committed.

### Disagreements found and fixed
| # | Where | Was | Now |
|---|---|---|---|
| 1 | rear-suspension rpm table + text | "5th (1.000)" column read as a 5-speed; "With a 5-speed it would be busy on the highway" (wrong for the Z32, whose 5th is an overdrive) | Columns CD009 5th / CD009 6th / Z32 5th; new input `gear_z32_top` 0.759 (published, verify) → `rpm_*_z32_top` (2760 at 4.44). Text: either box cruises at 2760–2890 rpm |
| 2 | rear-suspension driveshaft step 2 | yoke spec "(CD009)" | "(CD009 or Z32, whichever is fitted)" |
| 3 | rear-suspension Numbers table | repeated corner mass / wheel rate / spring rows from tuning + build-constants | rows dropped, link to [suspension tuning](./suspension-tuning#springs) |
| 4 | suspension-tuning camber | "~1.7–2.6° positive" at 3–4° roll (unsourced) | four-bar solve: `camber_roll_lo/hi` = 1.4–1.8° (new `camber_in_roll()` in the geometry script; linear check 0.559·φ = 1.7–2.2°) |
| 5 | geometry-design-reference travel budget | 20 mm input → "26-30 mm", total "64-68 mm" (no formula reproduces it) | 1/(2ζ) at ζ 0.3–0.4 → 25–33 mm, total 63–71 mm, from new input `road_input` and derived `travel_road_*`, `travel_budget_*` |
| 6 | geometry-design-reference RC migration | ±68 mm | ±69 mm (what the script prints; literal, not exported) |
| 7 | suspension-tuning caster | "matters if the steering stays manual" | manual feels it; optional EPAS covers it; link to steering#manual-or-epas |
| 8 | design-overview Steering lock row | blamed "the steeper tie-rod angle" as well as clearance | tyre-to-body clearance sets it, not the rack (matches steering.md); link to steering#lock-and-turning-circle |
| 9 | digital-dash Art status + "Generate gauge assets (Mac)" | "predate the script… rerun on the Mac", macOS fonts | regenerated with bundled fonts (scripts/fonts: Jost Medium, DejaVu Sans Mono), runs anywhere; preview caption "current art"; bezel fit-check marked as previous art revision. OS flashing/splash keep "(Mac)" (splash generator still uses macOS fonts) |
| 10 | digital-dash BOM + wiring table, wiring-overview EPAS rows/branch list | `can1`, IG wake, EPAS CAN unconditional | marked "if EPAS" |
| 11 | build-constants mass table | Transmission "(CD009)"; battery "moving it from the bay to the boot" | "(CD009 or Z32)"; "probably in the boot (not final)"; CAD workflow as numbered steps |
| 12 | design-finalization | crossmember "sized for the CD009" only | "; a Z32 only moves its position" |
| 13 | narrowing-analysis, donor-geometry captions | UCA plan cant unquantified; uca_plan / pickups_3view captions said "drawn parallel to the CL" | `uca_plan_cant` 3.2°, `uca_cant_offset` 12.4 mm, plotted and quoted (see plot notes) |
| 14 | scripts/plot_geometry_reference.py docstring | Miata OD 577 mm | 577.6 mm. No "577"/"578" tyre OD left in posts (steering's "~578 mm" is the rack housing length) |
| 15 | roadmapData.ts (text only) | t-decide-engine-placement note "If CD009 wins: bigger tunnel…"; column purchase "sized to the EPAS-to-rack path"; steering-donor / EPAS-control decisions silent on failure mode | tunnel already fits either box; column = Prius if EPAS, else manual; "any fault fails to manual (mechanical shaft)" added to three items |

Already correct, checked: frame-design weight transfer reads ~44% (= wt_increase_pct); scrub +0.6 everywhere (exact 577.6 OD); 240.5/290.5, 175 mm rack, 646 mm OD, "nose-down", "Gen 3": 0 hits. Ford 9" / four-link / live axle appear only as marked history (overview change log, rear-suspension decision + "why the change", suspension-options update, build-constants Rear row, roadmap revision summaries); 950 mm spring base and live-axle coilovers: 0 hits. Pronouns: no he/she/owner/name errors; log posts (teardown, frame-jig, suspension-options, motor-selection, overview) keep first person.

Not changed (judgement): suspension-tuning "Quick reference" and geometry "Results at a glance" stay; they summarise their own post (front/rear setup values, what-to-do column) rather than copy the build-constants tables. Springs-only LLTD works out ≈53.5% (hand, below), so the 58–60% start needs a front-biased bar split; the tuning post already says "~22–25 mm front plus a rear bar", left as is.

### Plot fixes (scripts/plot_geometry_reference.py, plots regenerated, ~60 s, exit 0; only lca_plan, uca_plan, pickups_3view changed)
- `lca_plan.png`: mount labels take per-mount offsets; "ARB link" sits up and inboard (right-aligned), "Coilover" up and outboard. Opened: no overlap.
- UCA plan cant, new `uca_plan_cant()`: the scan has the UBJ 14.15 mm aft of the LBJ (`ubj_from_hub` vs `lbj_from_hub`), the pivot pair is centred fore-aft on the LBJ (`lca_bj_fa ± uca_fa`), and the arm is symmetric (±110 mm along the axis). A symmetric arm keeps the UBJ on the perpendicular bisector of its pivots, so the axis is square to the UBJ→midpoint line: atan(14.15/250) = 3.24°, front pivot 12.4 mm outboard of the rear. Front-view pivot midpoint unchanged (368 mm), so no kinematic result changed. **Caveat for the owner:** the scan stores one lateral (382 mm) for both UCA pivots; the cant is inferred from that reconciliation, not measured directly. Posts and captions say so and say "verify on the donor".
- `uca_plan.png`: pivots at (+124 / −96 mm fore-aft of the BJ), bushings drawn along the canted axis, dotted CL-parallel reference, "220 mm along axis", cant note. `pickups_3view.png` plan panel: canted UCA axis and bushings on both sides, UCA-F (374.2, +134.8) / UCA-R (361.8, −84.8), cant note. Captions in donor-geometry-dimensions updated (both), narrowing-analysis quotes the cant.
- New geometry results: camber_roll_lo/hi, uca_plan_cant, uca_cant_offset. New inputs: gear_z32_top, road_input. `npm run constants` + full plot run; self-tests 17/17.

### Hand spot-checks (calculator, against the rendered posts)
| Check | Hand calculation | Posts / constants | Result |
|---|---|---|---|
| Sprung corners | (950·0.55 − 2·30)/2 = 231.25; (950·0.45 − 2·33)/2 = 180.75 kg | 231 / 181 kg | pass |
| Ride frequency | f = √(Kw/m)/2π: √(17900/231.25)/2π = 1.400 Hz; √(16100/180.75)/2π = 1.502 Hz | 1.4 / 1.5 Hz | pass |
| Front spring | 17.9 / 0.680² = 38.71 N/mm = 221 lb/in (÷0.1751) | 38.7 N/mm, 221 (~220) lb/in | pass |
| Roll stiffness | 17900·1.23²/2 = 13.54; 16100·1.34²/2 = 14.45; Σ 28.0 kN·m/rad | 13.5 + 14.4 = 28.0 | pass |
| Roll angle (rear RC 100) | h_RA = 139.0 + 0.45·(100 − 139.0) = 121.5 mm; arm 0.4535 m; M = 824·0.8·9.81·0.4535 = 2932 N·m; gravity 824·9.81·0.4535 = 3666; φ = 2932/(27995 − 3666) = 0.1205 rad = 6.91° | 6.9° (6.5 / 7.1 at RC 150 / 80) | pass |
| ARB for 3.5° | 2932/0.06109 + 3666 − 27995 = 23.7 kN·m/rad | 23.7 (≈24) | pass |
| LLTD | target 55 + 3…5 = 58–60 %. Springs only (elastic split by Kφ + geometric via RC 139/100 + unsprung): ΔWf/(ΔWf+ΔWr) ≈ 53.5 % | 58–60 % start | pass (bars must bias front) |
| Damping | 2√(17900·231.25) = 4069 → 4.1; 2√(16100·180.75) = 3412 → 3.4 kN·s/m; at damper 4.07/0.68² = 8.8 | 4.1 / 3.4 / 8.8 | pass |
| RPM table | π·0.6475 = 2.034 m; 100 km/h → 819.3 wheel rpm. 4.44: 3638 / 2888 / 2761; 4.10: 3359 / 2667 / 2550; 3.91: 3204 / 2544 / 2432 (CD009 5th / CD009 6th / Z32 5th) | 3640/2890/2760, 3360/2670/2550, 3200/2540/2430 | pass |
| U-joint angles | atan(3.5/37) = 5.40°; 5.40 − 3 = 2.40° both joints; life 5000·3/2.404 = 6240 h | 5.4°, 2.4°, ~6240 h | pass |
| Track / ET | 2·(655 − 38) = 1234 (~1230); rear hub face 670 + 38 = 708; narrowing 750 − 708 = 42, 755 − 708 = 47 | 1234 / ~1230, 708, 42–47 | pass |
| Tyre OD | 15·25.4 + 2·205·0.65 = 647.5; Miata 14·25.4 + 2·185·0.60 = 577.6 | 647.5 / 577.6 | pass |
| Tyre poke | (1230 + 205 − 1365)/2 = 35 mm/side (37 at 1234) | 35 (37) | pass |
| Scrub / trail | 6.05 − 34.95·tan12.05° + 2 = 0.59; 7.57 + 34.95·tan3.62° = 9.78 | +0.6 / 9.8 mm | pass |
| Camber in roll | linear: (1 − 615/1394)·φ = 0.559·φ → 1.7–2.2° at 3–4°; four-bar solve 1.41 / 1.82° | 1.4–1.8° (was 1.7–2.6) | fixed |
| Travel budget | 615·tan3.5° = 37.6 mm; 20/(2·0.4) = 25, 20/(2·0.3) = 33.3 → 63–71 mm | 63–71 mm (was 64–68) | fixed |
| UCA cant | atan(14.15/250) = 3.24°; 2·110·sin3.24° = 12.4 mm | 3.2°, 12.4 mm | new |

### Commands run (all exit 0)
- `python3 scripts/plot_geometry_reference.py` (plots + results), `npm run constants`, `python3 scripts/a40_constants.py --test` (17 ok)
- `npm run check-constants`: 736 placeholders in 18 posts resolve; generated constants up to date
- `node scripts/check-roadmap-plan.mjs`: 0 FAIL
- `npm run build`: passes; `npm run lint`: passes
- Link check over every rendered post (`./slug`, `./slug#anchor`, `#anchor`, `/assets` src/href): 156 checked, 0 broken (new anchors: steering#lock-and-turning-circle, steering#manual-or-epas, suspension-tuning#springs, narrowing-analysis#scanned-donor-geometry-what-it-changes)

Files touched: content/a40/{constants.yaml, build-constants, design-finalization, design-overview, digital-dash, donor-geometry-dimensions, geometry-design-reference, narrowing-analysis, rear-suspension, suspension-tuning, wiring-overview}.md, scripts/plot_geometry_reference.py, scripts/a40_constants.py, scripts/a40_geometry_results.json, src/blog/a40-constants.generated.json, src/blog/roadmapData.ts (text only), plots lca_plan / uca_plan / pickups_3view.png.

## Verification
Independent reviewer, 2026-10-24 (working tree 6d0da56, clean). Rendered all 18 content/a40 posts through the site's `parsePost()` (vite `ssrLoadModule`), converted to text and read them; also diffed the render at 715dd0b against now to see exactly what this ticket changed.

**Passes**
- Commands: `npm run build`, `npm run lint`, `npm run check-constants` (736 placeholders, 18 posts), `python3 scripts/a40_constants.py --test` (17 ok), `node scripts/check-roadmap-plan.mjs` (0 FAIL): all exit 0.
- Physics spot-checks redone independently (numbers in the A40-007 Verification table): ride frequency/wheel rates, roll angle 6.5/6.9/7.1°, ARB 31.7/23.7/17.7, damping 4.1/3.4 (8.8 at the damper), rpm table 3640/2890/2760 etc., U-joints 5.4°/2.4°, track 1234 and rear hub face 708, tyre OD 647.5/577.6, weight transfer +44%. Travel budget: 615·tan 3.5° = 37.6 mm; 20/(2·0.4) = 25, 20/(2·0.3) = 33.3 → 63–71 mm (JSON travel_budget_lo/hi 62.6/70.9). UCA cant: atan(14.15/250) = 3.24°, 2·110·sin 3.24° = 12.4 mm. LLTD start 58–60%. All match the posts.
- Stale decisions: Ford 9"/four-link/live axle only as history (overview change log, rear-suspension intro and "Why the change", suspension-options update, build-constants Rear row note); "950 mm" spring base, "nose-down", "Gen 3", 240.5/290.5, 646 mm OD: 0 hits (646 only as the stock A40 crossply). EPAS optional everywhere (steering decisions table "Open", gateway "If power assist is chosen", dash/wiring "if EPAS", fails-to-manual stated in steering and gateway). DCDC-USB V(out) jumpered to 5 V feeding Pi + display, buck only as fallback (digital-dash, gateway hardware list). Gearbox "CD009 or Z32" in overview, design-overview, frame-design, design-finalization, build-constants, rear-suspension; Z32 5th 0.759 marked verify. Battery "probably the boot (not final)" in build-constants and wiring-overview; design-overview battery row agrees (boot floor or custom cell).
- No pronoun/name errors (grep he/she/his/her/owner/Dawson/Claude: 0 hits in rendered text); log posts keep first person.
- Links/images: 126 internal links (post slugs, #anchors, /assets) resolved against rendered heading ids and public/: 0 broken; all 30 image srcs exist. No `{{` / `}}` in any rendered post.
- A40-004/005 review notes: suspension-tuning caster text now conditional on manual vs EPAS; epas-can-gateway:10 and digital-dash:10 conditional on EPAS; gateway states every fault fails to manual; "Gen 3" 0 hits in scripts/a40-dash-wiring.py, content/a40, plots and roadmapData.ts.
- Plots: lca_plan.png opened, "ARB link" and "Coilover" labels clear of each other and of the markers. uca_plan.png draws the axis canted 3.2° with pivots at +124/−96 mm (arm lengths 271/271.5 mm, so the arm is symmetric about the BJ as stated), dotted CL-parallel reference; caption numbers match (3.2°, 12.4 mm, +124/−96, 38.5 mm).

**Fails**: see below. The rpm table broken by fix #1 is visible to the owner on the rear-suspension page.

### Failed checks
1. content/a40/rear-suspension.md:62: the rpm table's separator row has 3 cells for a 4-column header (`|---|---|---|`), so marked does not build a table and the page shows the raw pipes ("| Final drive | CD009 5th (1.000) | …" then "|---|---|---|"). Fix: change line 62 to `|---|---|---|---|`. Re-render rear-suspension and confirm a `<table>` with 4 columns.
2. (wording) content/a40/donor-geometry-dimensions.md:127 uca_plan caption: "both pivots 110 mm from the BJ along the bushing axis" is wrong (they are ~271 mm from the BJ). Fix: "both pivots 110 mm either side of the pivot-line midpoint, along the bushing axis (220 mm c-to-c)".
3. Dependent literals in narrowing-analysis:72/:80 (+74, 2 mm, ~35 mm inboard, ET45 −7) are tracked in A40-008 Failed checks; fix them there.

Optional, not blocking: lca_plan.png "−25 mm rear" and "−348 mm rear" dimension labels sit on top of their arrows, and uca_plan.png's "Rear pivot" label is half under the bushing rectangle; narrowing-analysis "UCA brackets: 273 mm from CL" could add "(pivot-line midpoint; front pivot +6.2, rear −6.2 mm with the 3.2° cant)" so nobody builds both brackets at 273.
