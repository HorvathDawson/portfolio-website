---
id: A40-004
title: Build constants and suspension tuning posts
status: review
owner: Claude
reviewer:
blocked_by:
---

## Files
- content/a40/build-constants.md
- content/a40/suspension-tuning.md
- content/a40/suspension-options.md

## Acceptance criteria
- [ ] Mass: operating ~950 kg, curb ~875 kg, sprung ~825 kg, corners 231/181 kg; mass table mid values sum to ~950
- [ ] Wheel rates 17.9/16.1 N/mm; front spring ≈39 N/mm (~220 lb/in) at MR 0.68
- [ ] Spring roll stiffness 13.5 + 14.4 kN·m/rad (check: K = Kw·T²/2 with T = 1.234 and 1.340 m)
- [ ] Critical damping 4.1/3.4 kN·s/m (check: 2√(Kw·m))
- [ ] LLTD start 3–5% above front static fraction
- [ ] Numbers match A40-001's final output; any change propagated here
- [ ] Mustang II correction (4×108) present in suspension-options

## Verification
_Filled by the reviewer._

## Implementer notes (reconcile agent)
- Numbers aligned with the geometry script summary: MR 0.680, front spring 38.7 N/mm, rear 38/29/22 N/mm at MR 0.65/0.75/0.85, travel 83/103 mm, roll 6.5/6.9/7.1°, bars 15.5–33 kN·m/rad, roll stiffness 28.0.
- Captions fixed: ride_frequency (x-axis is wheel rate), arb_sizing (stiffness to add, front bar alone at IR 1.71), rack_narrowing, ackermann (0.54/1.04/1.71° at 15/20/25°), driveshaft, ujoint_life.
- Tyre poke ~35 mm/side everywhere; narrowing-analysis explains the 37 mm exact-track figure.
- Open: lca_plan.png labels overlap ("ARB link"/"Coilover"); uca_plan/pickups_3view draw the UCA axis parallel to the centreline (captions say so). Needs a script fix.
