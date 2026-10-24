---
id: A40-003
title: Rear suspension post (Miata IRS, RX-8 diff)
status: done
owner: Claude
reviewer: review agent (Oct 24)
blocked_by:
---

## Why
Owner decision: the rear is a narrowed Miata NA IRS with an RX-8 diff and custom half-shafts. Replaces the Ford 9" / four-link plan.

## Files
- content/a40/rear-suspension.md (renamed from rear-axle.md)
- content/a40/four-link-rear.md (deleted)

## Acceptance criteria
- [x] Rear track 1340 mm, hub face 708 mm, narrowing 42–47 mm/side with the measure-the-donor rule
- [x] Engine 3° tail-down; pinion parallel; shaft 5.4°; 2.4° per joint
- [x] Final-drive rpm table recomputed from 2.034 m circumference (spot-check: 4.44, 6th 0.794, 100 km/h → ~2890 rpm)
- [x] Brake split shown as an open decision; X-split needs two valves
- [x] RX-8 LSD type and ratio marked "verify on the unit"
- [x] No link anywhere in the site still points to `rear-axle` or `four-link-rear`

## Verification
Reviewer, 2026-10-24. Read rear-suspension.md in full; opened driveshaft_angles.png and ujoint_life.png.

- **Track / hub face / narrowing (pass).** rear-suspension:18-20, :30: 1340 mm, hub face 708 = 670 + 38, 750 − 708 = 42 (ET40) / 755 − 708 = 47 (ET45), "measure hub face to hub face on the donor". Same in build-constants:33-34, frame-design, design-overview.
- **Driveline angles (pass).** rear-suspension:74, :78: 3° tail-down, pinion parallel (3° nose-up), atan(3.5/37) = 5.40°, joints 5.4 − 3.0 = 2.4°. driveshaft_angles.png legend: trans 3° tail-down, shaft 5.4°, pinion 3° nose-up parallel, both joints 2.4°, 37" c-c, 3.5" drop. No "nose-down" left in content (grep).
- **RPM table (pass).** π·647.5 = 2034 mm. 100 km/h = 27.78 m/s / 2.034 = 13.66 rev/s = 819.4 wheel rpm. 4.44 → 3638 / ×0.794 = 2889; 4.10 → 3359 / 2667; 3.91 → 3204 / 2544. Table l.62-66 reads 3640/2890, 3360/2670, 3200/2540: all match to rounding.
- **Brake split (pass).** l.48-53: open decision; F/R split + one valve, or X split + two valves set identically; notes X wants ~zero scrub (build ≈ +0.5 mm).
- **LSD / ratio verify (pass).** l.22 "verify on the unit; ratio open", l.60, l.70 "(verify on the unit)", l.99.
- **No stale links (pass).** `grep -rn "rear-axle\|four-link-rear"` over the repo (excluding node_modules, dist, .git, tickets): 0 hits; neither file exists in content/a40. Roadmap `posts:` slugs all resolve to files (scripted check). Link checker over content/a40 (marked + the blogData heading renderer): 151 links/images, 0 broken.
- ujoint_life.png: 2.4° → 6240 h label; 5000·3/2.4 = 6250 h (curve point at the plotted angle), caption says ~6240 h; 6° → 2500 h. Fine.
