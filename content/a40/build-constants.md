---
title: "Build Constants Reference"
date: 2026-02-15
status: in-progress
epic: design
kind: reference
tags: [reference, constants, geometry, mass]
---

The headline numbers for the build, in one place. Other posts use these. If a post disagrees with this page, the post is out of date.

**Status:** **locked** = committed, drives other dimensions. **working** = best current estimate, will change with measurement. **target** = design intent. **measure** = waiting on a measurement of the donor or the car. **open** = not decided.

The tables are generated from [`content/a40/constants.yaml`](https://github.com/HorvathDawson/portfolio-website/blob/master/content/a40/constants.yaml), the same file the other posts, the plots and the roadmap read their numbers from. To change a number, change it there.

## Vehicle

{{table:vehicle}}

## Track, wheels, tyres

{{table:wheels}}

## Suspension

{{table:suspension}}

## Drivetrain

{{table:drivetrain}}

---

## Refining the CG height from CAD

Weight transfer scales directly with CG height and roll grows faster than linearly with it, so this number is worth tightening. Compute it bottom-up as $h_{CG} = \sum m_i z_i / \sum m_i$ with every item at its mounted position.

| Item | Mass (kg, est.) | Notes |
|---|---|---|
| Engine (SR20DET, dressed) | 150–185 | Largest single mass, low and forward. Weigh or use service data. |
| Transmission (CD009) | 50–70 | Low, in the tunnel. |
| Body shell (stripped, painted) | 200–260 | Biggest effect on CG **height**. ±10 mm in its centroid moves the whole-car CG ~2–3 mm. Use the scan's volume centroid. |
| Ladder frame | 70–110 | Low. Take the centroid from the frame CAD. |
| Fuel (full) | ~{{fuel_mass:raw}} | Assumes a stock-size ~30–35 L tank; update if the tank changes. Model full and empty. |
| Driver | {{driver_mass:raw}} | Add a passenger for a second case. |
| Rear suspension: RX-8 diff | ~30 (weigh it) | Sprung; on the chassis. |
| Rear suspension: subframe, arms, uprights, brakes, wheels | ~85–95 | Two ~{{unsprung_rear}} corners plus subframe/arms. |
| Half-shafts | ~8–12 | |
| Front corners (×2) | ~{{unsprung_front:raw}} each | Wheel, tyre, hub, brake, half the arms. |
| Battery | 15–20 | Moving it from the bay to the boot shifts F/R balance ~1–2%. |
| Seats (×2) | 12–18 each | |
| Radiator + coolant | 8–12 | |
| Exhaust | 12–18 | |
| Driveshaft | 8–12 | |
| Miscellaneous (wiring, lines, trim, glass, bumpers, lights) | 30–50 | Lump at the body centroid. |

Mid values sum to ~{{operating_mass}} with the driver and a full tank.

**Workflow:** place each item in the CAD assembly, assign its mass (measured where possible), read the assembly's mass properties, then repeat with the tank empty and with a passenger to bracket the range.
