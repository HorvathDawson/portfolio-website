---
id: A40-001
title: Geometry script, plots and reference post
status: in-progress
owner: geometry agent
reviewer: review agent (Oct 24)
blocked_by:
---

## Why
The motion ratio treated the contact patch as fixed to the LCA (0.62 instead of ~0.68), the roll maths used the wrong roll centre, and the rear was modelled as a live axle.

## Files
- scripts/plot_geometry_reference.py
- content/a40/geometry-design-reference.md
- public/assets/projects/a40-austin/blog/plots/*.png

## Acceptance criteria
- [x] Front MR is computed about the front-view instant centre and lands ~0.68 (confirmed by perturbing the four-bar numerically)
- [x] Roll maths uses the kinematic front RC (~139 mm) and a rear RC band (80–150 mm), not 39/45 mm
- [x] Rear is modelled as narrowed Miata IRS; no live-axle, four-link or Ford 9" code paths remain
- [x] Springs-only roll at 0.8 g reads ~6.5–7°; required bar stiffness 16–33 kN·m/rad
- [x] Ackermann error at 20° checked: plot (~1.0°) vs hand calc (0.48°) reconciled, and the post states the right one
- [x] Every plot regenerates from `python scripts/plot_geometry_reference.py` with no errors
- [x] Every figure caption in the post matches what the plot shows
- [ ] Post is shorter than before and links to build-constants instead of repeating tables

## Verification
Reviewer, 2026-10-24. Against A40-000 + owner notes.

- **MR (pass).** `front_mr()` (script ~l.1163) perturbs the four-bar via `_solve_state` (hub z vs LCA angle). Re-ran it independently with eps 1e-3 and 1e-2: 0.6901 vertical both, 0.6796 at 80°; closed form 0.6796, d_eff 347.8 mm. Hand: 240/347.8 = 0.690; ×sin80 = 0.680. Old 240·sin80/380.5 = 0.621. Post l.135-141 table 0.625/0.667/0.680/0.687/0.690 matches motion_ratio_vs_angle.png labels.
- **RC in roll maths (pass).** `roll_axis_height()` defaults to `H_RC_A40` = 139.16 mm (l.433), rear RC carried as 80/100/150 (l.109-111). Hand: h_RA = 139.2 + 0.45·(100−139.2) = 121.6 mm (post l.106 says 122).
- **Rear model (pass).** grep for live/four-link/Ford/9in/panhard/318500/beam in the script: only "solid bar"/"solid_capstyle" hits. Rear is T_REAR 1340 + RC band + MR cases 0.65/0.75/0.85; driveshaft plot is sprung-diff (constant angles).
- **Roll / bars (pass).** Hand at rear RC 100: arm 0.4534 m, m·a·arm = 825·0.8·9.81·0.4534 = 2935 N·m, gravity term 3669; K = 17874·1.23²/2 + 16078·1.34²/2 = 13.52k + 14.43k = 27.96k → φ = 2935/(27960−3669) = 0.1207 rad = 6.91°. ARB for 3.5°: 2935/0.06109 + 3669 − 27960 = 23.7k. Script prints 6.53/6.93/7.09° and 15.5–33.0 kN·m/rad; post l.40-41, l.103-109 match.
- **Ackermann (pass).** `_ideal_inside` with virtual WB 615/tan(17.404°) = 1962 mm: excess 0.54° at 15°, 1.04° at 20° (my hand calc: 0.55 / 1.04). The 0.48° figure was low; post l.181 says ~0.5° at 15° and 1° at 20°; steering.md l.98/104 agrees (0.54/1.04/1.71). ackermann.png shows 0.54/1.04/1.71.
- **Regeneration (pass).** `python3 scripts/plot_geometry_reference.py`: exit 0, 23 PNGs saved, summary printed; `git status` showed no PNG change afterwards (committed plots = regenerated plots). Summary values (RC 139.2/142.4, IC 1394/314, jacking 22.6%, LCA/UCA 234.5/273, MR 0.690/0.680, spring 38.7 N/mm, travel 83/103, K 13.5+14.4=28.0, ccrit 4.1/3.4, scrub 0.53, trail 9.80, Ackermann 17.40°, rack 190, WT 3485 N +44%, turning circle 16.3/25.1 m) all match the post.
- **Captions (pass).** Opened rc_combined, rc_migration_a40, roll_vs_cg, motion_ratio_vs_angle, motion_ratio. Captions l.75, 82, 113, 147, 154 match what is drawn (RC 142.4/139.2; ±68 vs ±203 mm migration; 6.1/6.9/7.8° markers, +16/24/33 lines; 65-85° band, dotted old lever; 70/80/90° curves, droop −103 / bump +83, 80° MR 0.678-0.692 in travel).
- **Shorter + links to build-constants (FAIL).** Shorter: yes, 552 lines (4d2d8cf) → 440 (b7cccbd) → 222 now. But the post has no link to `./build-constants` anywhere (grep: 0 hits), and the "Inputs" table l.16-26 repeats build-constants values (rear track, CG 575 ± 50, sprung mass/corners) instead of linking.

### Failed checks
- content/a40/geometry-design-reference.md:10 (or :28): add a link to [build constants](./build-constants) as the source of the headline numbers.
- content/a40/geometry-design-reference.md:21,25,26: drop the rows that only repeat build-constants (Rear track, CG height, Sprung mass / corners), or replace them with "see build constants"; keep the Miata-vs-A40 comparison rows the script actually uses.

Non-blocking (for A40-009): Miata 185/60R14 OD is 577 (script, this post l.19), 577.6 (donor-geometry-dimensions:49) and 578 (narrowing-analysis:34); 355.6 + 2·185·0.6 = 577.6. Pick one.

## Implementer notes (geometry agent)
- MR from four-bar perturbation: 0.690 vertical, 0.680 at an 80° shock (A40, ET38). Effective lever 347.8 mm.
- Front RC 139.2 mm (Miata 142.4); rear RC carried as 80/100/150 mm, rear MR as 0.65/0.75/0.85 cases.
- Springs-only roll 6.5/6.9/7.1° at rear RC 150/100/80; bars add 15.5–33 kN·m/rad (23.8 for 3.5° at RC 100).
- Front spring 38.7 N/mm (221 lb/in); rear 38/29/22 N/mm at rear MR 0.65/0.75/0.85.
- Front travel 83 bump / 103 droop with 127 mm stroke (45% bump split assumed); stock Miata travel needs ~106–112 mm stroke.
- Lateral transfer +44%; jacking 20.1% → 22.6%; scrub +0.53 mm; trail 9.80 mm; turning circle ~16.3–25.1 m.
- Bar-diameter results are indicative: installation ratio back-calculated from an unsourced stock-bar figure.
- Post: 440 → 222 lines. Ackermann reconciled in script (labels computed).
- Follow-ups for other posts: donor-geometry-dimensions travel (141/60, MR 0.62), captions of arb_sizing, ride_frequency, ackermann, rack_narrowing, driveshaft_angles, ujoint_life.
- Unused plots still generated: rc_construction, rc_tire_comparison, rc_migration_miata, track_effects, weight_transfer, jacking, ackermann_topview, ackermann_turn.
