---
id: A40-001
title: Geometry script, plots and reference post
status: in-progress
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
