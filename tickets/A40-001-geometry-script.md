---
id: A40-001
title: Geometry script, plots and reference post
status: review
owner: geometry agent
reviewer:
blocked_by:
---

## Why
The motion ratio treated the contact patch as fixed to the LCA (0.62 instead of ~0.68), the roll maths used the wrong roll centre, and the rear was modelled as a live axle.

## Files
- scripts/plot_geometry_reference.py
- content/a40/geometry-design-reference.md
- public/assets/projects/a40-austin/blog/plots/*.png

## Acceptance criteria
- [ ] Front MR is computed about the front-view instant centre and lands ~0.68 (confirmed by perturbing the four-bar numerically)
- [ ] Roll maths uses the kinematic front RC (~139 mm) and a rear RC band (80–150 mm), not 39/45 mm
- [ ] Rear is modelled as narrowed Miata IRS; no live-axle, four-link or Ford 9" code paths remain
- [ ] Springs-only roll at 0.8 g reads ~6.5–7°; required bar stiffness 16–33 kN·m/rad
- [ ] Ackermann error at 20° checked: plot (~1.0°) vs hand calc (0.48°) reconciled, and the post states the right one
- [ ] Every plot regenerates from `python scripts/plot_geometry_reference.py` with no errors
- [ ] Every figure caption in the post matches what the plot shows
- [ ] Post is shorter than before and links to build-constants instead of repeating tables

## Verification
_Filled by the reviewer._

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
