---
id: A40-004
title: Build constants and suspension tuning posts
status: review
owner: Claude
reviewer:
blocked_by: A40-001 (final MR, RC and roll numbers)
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
