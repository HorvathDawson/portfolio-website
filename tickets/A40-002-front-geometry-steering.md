---
id: A40-002
title: Front narrowing, donor geometry and steering posts
status: done
owner: front geometry agent
reviewer: review agent (Oct 24)
blocked_by:
---

## Why
Wrong pickup positions (240.5/290.5 mm), rack cut (175 mm), tyre OD (646 mm), fitment (+10 mm/side) and steering lock units.

## Files
- content/a40/narrowing-analysis.md
- content/a40/donor-geometry-dimensions.md
- content/a40/steering.md

## Acceptance criteria
- [x] Narrowed pivots LCA 234.5 mm, UCA 273 mm from centreline
- [x] Rack cut 190 mm total
- [x] Track 2 × (655 − 38) = 1234 mm (~1230) at ET38; hub face 655 mm
- [x] Tyre 205/65R15 OD 647.5 mm
- [x] Tyre poke stated consistently (agent got 37 mm/side vs spec 35); one number, with its derivation
- [x] Scrub ≈ +0.5 mm, trail ≈ 9.8 mm, caster target 4–5.5°, Ackermann 17.40°
- [x] Lock loss given in degrees (12–18°), turning circle 16–25 m, steering stops called out
- [x] Donor baseline track (1405 vs 1420) flagged as "measure the donor"

## Notes
Agent reported: poke 37 mm/side, scrub +0.59 mm, Miata stock tyre OD ~578 mm.

## Verification
Reviewer, 2026-10-24. Read narrowing-analysis.md, donor-geometry-dimensions.md, steering.md in full; opened ackermann.png and rack_narrowing.png.

- **Pivots (pass).** narrowing-analysis:91-92 and :108-109 LCA 234.5 / UCA 273 mm; donor-geometry-dimensions:74, :87 (329.5−95, 368−95). grep for 240.5 / 290.5 in content/a40 and roadmapData.ts: 0 hits.
- **Rack (pass).** steering:19, :69, :89; narrowing-analysis:20: 190 mm (7.5"). Only "175" left is the explained old figure at steering:69 and the 175 mm tyre-width row (narrowing-analysis:67). rack_narrowing.png marks build 190 mm (7.5"), OO 1400 → 225 mm, OO 1365 → 260 mm; hand 1420−1195 = 225, 1420−1160 = 260.
- **Track / hub face (pass).** narrowing-analysis:17-19, donor:12, :47-48: hub face 655, 2 × (655 − 38) = 1234 (~1230).
- **Tyre OD (pass).** 15·25.4 + 2·205·0.65 = 381 + 266.5 = 647.5 mm; narrowing-analysis:18, :50; donor:50.
- **Tyre poke (pass).** narrowing-analysis:72 gives one headline, ~35 mm/side (1230 + 205 = 1435 vs 1232 + 133 = 1365 → +70 → 35), and explains the 37 mm exact-track figure (1234: outer edge 617 + 102.5 = 719.5 vs 616 + 66.5 = 682.5). Table l.65-70 rechecked: ET25/30/38/45 → T 1260/1250/1234/1220, 205-wide cells +100/+90/+74/+60. Same ~35 mm/side in build-constants:37, geometry-design-reference:193, design-overview, rack_narrowing.png.
- **Scrub / trail / caster / Ackermann (pass).** Hand: kingpin slope (665.75−618)/223.75 = 0.2134; ground point 665.75 + 179·0.2134 = 703.95 → Miata scrub 6.05; A40 6.05 − 35.25·0.2134 + 2 = 0.53 mm; trail 7.57 + 35.25·tan3.62° = 9.80 mm. Posts: narrowing-analysis:100-101, donor:65-67 (≈ +0.5 / 9.8). Caster target 4–5.5° at steering:30 and geometry/tuning. Ackermann atan(710/2265) = 17.40° at steering:96, :104.
- **Lock (pass).** steering:117-124: 12-18° lost, 16-25 m, stops mandatory (also narrowing-analysis:120). Hand: 2.35/sin(16.8°) = 8.13 m radius → 16.3 m; 2.35/sin(10.8°) = 12.54 → 25.1 m; Miata 2.265/sin(28.8°) = 4.70 → 9.4 m.
- **Donor baseline (pass).** narrowing-analysis:24, donor:45 (published 1405-1425, measure hub face to hub face, expect ~1500 = 2·750).

Non-blocking (for A40-009): Miata tyre OD given as 578 (narrowing-analysis:34), 577.6 (donor:49), 577 (script / geometry post). Hand: 355.6 + 222 = 577.6.
