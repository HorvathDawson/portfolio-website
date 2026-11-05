---
id: A40-004
title: Build constants and suspension tuning posts
status: done
owner: Claude
reviewer: review agent (Oct 24)
blocked_by:
---

## Files
- content/a40/build-constants.md
- content/a40/suspension-tuning.md
- content/a40/suspension-options.md

## Acceptance criteria
- [x] Mass: operating ~950 kg, curb ~875 kg, sprung ~825 kg, corners 231/181 kg; mass table mid values sum to ~950
- [x] Wheel rates 17.9/16.1 N/mm; front spring ≈39 N/mm (~220 lb/in) at MR 0.68
- [x] Spring roll stiffness 13.5 + 14.4 kN·m/rad (check: K = Kw·T²/2 with T = 1.234 and 1.340 m)
- [x] Critical damping 4.1/3.4 kN·s/m (check: 2√(Kw·m))
- [x] LLTD start 3–5% above front static fraction
- [x] Numbers match A40-001's final output; any change propagated here
- [x] Mustang II correction (4×108) present in suspension-options

## Verification
Reviewer, 2026-10-24. Read build-constants.md, suspension-tuning.md, suspension-options.md; opened ride_frequency.png, arb_sizing.png.

- **Mass (pass).** build-constants:18-23: 950 / 875 / 825 kg, corners 231/181. Hand: 950 − 2·30 − 2·33 = 824; (522.5 − 60)/2 = 231.3; (427.5 − 66)/2 = 180.8. Mass table l.73-88 mid values: 167.5 + 60 + 230 + 90 + 25 + 75 + 30 + 90 + 10 + 60 + 17.5 + 30 + 10 + 15 + 10 + 40 = 960 kg (~950, within 1%).
- **Wheel rates / spring (pass).** (2π·1.4)²·231 = 17.87 N/mm; (2π·1.5)²·181 = 16.08 N/mm; f = (1/2π)√(17874/231) = 1.40 Hz. 17.9/0.680² = 38.7 N/mm = 221 lb/in (÷0.1751). tuning:20-22, :46; build-constants:47-48.
- **Roll stiffness (pass, note).** Kw·T²/2: front 17874·1.230²/2 = 13.52 kN·m/rad, rear 16078·1.340²/2 = 14.43, total 27.96 → 13.5 + 14.4 = 28.0 as posted (tuning:23, :57; build-constants:52). With the exact T = 1.234 m the front is 13.61 (total 28.06): the posts deliberately use the nominal 1230 mm track for vehicle-level numbers (geometry-design-reference:28); 0.7% difference, within the "~" of A40-000.
- **Critical damping (pass).** 2√(17874·231) = 4064 → 4.1 kN·s/m; 2√(16078·181) = 3412 → 3.4. tuning:25, :80. At the damper 4.06/0.680² = 8.8 (tuning:81) correct.
- **LLTD (pass).** tuning:68: 3–5% above front static fraction, ~58–60% for 55/45.
- **Matches A40-001 output (pass).** Compared with the script summary: MR 0.680/0.690, spring 38.7, rear 38/29/22 at MR 0.65/0.75/0.85, travel 83/103, roll 6.5/6.9/7.1°, bars 15.5–33 (23.8 at 3.5°), CG ±50 → 18/30, front bar 22 mm 13.5 / 25 mm 22.5, IR 1.71. Roll arm 575 − 144 = 431 / 575 − 113 = 462 (tuning:57 "~430–460"). arb_sizing.png 32/24/18 at 3/3.5/4° and ride_frequency.png markers match their captions.
- **Mustang II (pass).** suspension-options:10: "Mustang II four-lug pattern is 4×108, not 4×100".

### Follow-up found outside the boxes (not blocking this ticket)
- content/a40/suspension-tuning.md:94: "the EPAS covers the extra effort" contradicts the owner decision that assist is open (manual or Prius Gen 4 EPAS). Change to e.g. "With manual steering this adds parking effort (see [steering](./steering#manual-or-epas)); with EPAS the column covers it."
- content/a40/frame-design.md (Loads section): "~43% higher" weight transfer; the script gives 3485/2415 = +44% (geometry post says +44%). Change to ~44%.

## Implementer notes (reconcile agent)
- Numbers aligned with the geometry script summary: MR 0.680, front spring 38.7 N/mm, rear 38/29/22 N/mm at MR 0.65/0.75/0.85, travel 83/103 mm, roll 6.5/6.9/7.1°, bars 15.5–33 kN·m/rad, roll stiffness 28.0.
- Captions fixed: ride_frequency (x-axis is wheel rate), arb_sizing (stiffness to add, front bar alone at IR 1.71), rack_narrowing, ackermann (0.54/1.04/1.71° at 15/20/25°), driveshaft, ujoint_life.
- Tyre poke ~35 mm/side everywhere; narrowing-analysis explains the 37 mm exact-track figure.
- Open: lca_plan.png labels overlap ("ARB link"/"Coilover"); uca_plan/pickups_3view draw the UCA axis parallel to the centreline (captions say so). Needs a script fix.
