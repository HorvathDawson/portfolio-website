---
title: "Build Constants Reference"
date: 2026-02-15
status: in-progress
epic: design
kind: reference
tags: [reference, constants, geometry, mass]
---

The headline numbers for the build, in one place. Other posts use these. If a post disagrees with this page, the post is out of date.

**Status:** **locked** = committed, drives other dimensions. **working** = best current estimate, will change with measurement. **target** = design intent. **open** = not decided.

## Vehicle

| Parameter | Value | Status | Notes |
|---|---|---|---|
| Operating mass (driver + full tank) | ~950 kg | working | Sum of the mass table below. |
| Curb mass (no driver) | ~875 kg | working | |
| Weight distribution F/R | ~55/45 | working | Estimate; corner-weigh once rolling. |
| Unsprung mass per corner | ~30 kg front, ~33 kg rear | working | Miata corner + 205/65R15 + half the arms; rear adds half a half-shaft. |
| Sprung mass | ~825 kg | working | Operating mass minus unsprung. Diff and rear subframe are sprung. |
| Sprung corner mass | ~231 kg front, ~181 kg rear | working | Drives spring rates. |
| CG height | 575 mm ±50 | working | Miata 460 mm + ~115 mm for the taller body and seating. Refine from CAD (below). |
| Wheelbase | 2350 mm | locked | Stock A40 Devon. |

## Track, wheels, tyres

| Parameter | Value | Status | Notes |
|---|---|---|---|
| Front narrowing | 95 mm per side | locked | Hub face moves from 750 to 655 mm from centreline. Rack cut 190 mm total. |
| Front track | ~1230 mm (1234 at ET38) | locked | Track = 2 × (hub face − ET). Stock A40 is 1232 mm. Donor baseline (1405 published vs 1420 used) is unverified: measure the donor hub faces. |
| Rear track | 1340 mm | locked | Narrowed Miata rear, hub face 708 mm from centreline. |
| Rear narrowing | ~42–47 mm per side | measure | Stock rear hub-face distance − 708 mm. See [rear suspension](./rear-suspension). |
| Tyre | 205/65R15, OD 647.5 mm | locked | Same front and rear. |
| Wheel | 15", 4x100, ET38 | locked | On hand. Miata donor baseline is ET40. |
| Tyre outer-to-outer (front) | ~1435 mm | working | 1230 + 205. Stock A40 is 1232 + 133 = 1365 mm, so the tyres sit **~35 mm/side** further out than stock (37 at the exact 1234 mm track). Main fitment risk; check against the body scan. See [narrowing analysis](./narrowing-analysis). |

## Suspension

| Parameter | Value | Status | Notes |
|---|---|---|---|
| Front | Narrowed Miata NA double wishbone | locked | Narrowed pivots: LCA 234.5 mm, UCA 273 mm from centreline. |
| Rear | Narrowed Miata NA independent rear | decided | Replaces the Ford 9" / four-link plan (Oct 2026). |
| Front motion ratio | 0.680 | working | 80° shock (0.690 vertical), from the front-view instant centre. See the [geometry reference](./geometry-design-reference). |
| Rear motion ratio | TBD | measure | Measure on the donor. Rear spring = 16.1 / MR²: 38 / 29 / 22 N/mm at MR 0.65 / 0.75 / 0.85. |
| Wheel rate target, front | 17.9 N/mm (1.4 Hz), range 13–23 | working | Spring rate = wheel rate ÷ MR² = ≈39 N/mm (38.7, ~220 lb/in) at MR 0.680. |
| Wheel rate target, rear | 16.1 N/mm (1.5 Hz), range 12–21 | working | Rear ~0.1 Hz above front. |
| Front wheel travel | 83 mm bump / 103 mm droop | working | 127 mm stroke, 45% in bump (assumed). Stock Miata travel needs a ~106–112 mm stroke. |
| Front roll centre | 139.2 mm | working | Kinematic, static ride height (Miata 142.4). |
| Rear roll centre | 80–150 mm assumed | model | Narrowed Miata rear; model or measure. |
| Spring roll stiffness | 13.5 F + 14.4 R = 28.0 kN·m/rad | working | $K_w T^2/2$. |
| Springs-only roll at 0.8 g | 6.5 / 6.9 / 7.1° | working | At rear RC 150 / 100 / 80 mm. Anti-roll bars must add 15.5–33 kN·m/rad for 3–4° (23.8 for 3.5° at rear RC 100). See [suspension tuning](./suspension-tuning). |

## Drivetrain

| Parameter | Value | Status | Notes |
|---|---|---|---|
| Engine | SR20DET | locked | Mounted 3° down at the rear (tail-down). |
| Transmission | CD009 or Z32 (Nissan 6-/5-speed) | decided shortlist | OEM 5-speed rejected. Remote shifter expected. See the roadmap. |
| Differential | Mazda RX-8 rear diff | decided | Custom mounts. Final drive ~4.44 stock (verify); ratio open. |
| Half-shafts | Custom length | to order | RX-8 flanges to Miata hubs. |
| Driveshaft | One-piece, 1330 joints | to order | 5.4° shaft angle, 2.4° per joint, pinion parallel to the gearbox. |

---

## Refining the CG height from CAD

Weight transfer scales directly with CG height and roll grows faster than linearly with it, so this number is worth tightening. Compute it bottom-up as $h_{CG} = \sum m_i z_i / \sum m_i$ with every item at its mounted position.

| Item | Mass (kg, est.) | Notes |
|---|---|---|
| Engine (SR20DET, dressed) | 150–185 | Largest single mass, low and forward. Weigh or use service data. |
| Transmission (CD009) | 50–70 | Low, in the tunnel. |
| Body shell (stripped, painted) | 200–260 | Biggest effect on CG **height**. ±10 mm in its centroid moves the whole-car CG ~2–3 mm. Use the scan's volume centroid. |
| Ladder frame | 70–110 | Low. Take the centroid from the frame CAD. |
| Fuel (full) | ~25 | Assumes a stock-size ~30–35 L tank; update if the tank changes. Model full and empty. |
| Driver | 75 | Add a passenger for a second case. |
| Rear suspension: RX-8 diff | ~30 (weigh it) | Sprung; on the chassis. |
| Rear suspension: subframe, arms, uprights, brakes, wheels | ~85–95 | Two ~33 kg corners plus subframe/arms. |
| Half-shafts | ~8–12 | |
| Front corners (×2) | ~30 each | Wheel, tyre, hub, brake, half the arms. |
| Battery | 15–20 | Moving it from the bay to the boot shifts F/R balance ~1–2%. |
| Seats (×2) | 12–18 each | |
| Radiator + coolant | 8–12 | |
| Exhaust | 12–18 | |
| Driveshaft | 8–12 | |
| Miscellaneous (wiring, lines, trim, glass, bumpers, lights) | 30–50 | Lump at the body centroid. |

Mid values sum to ~950 kg with the driver and a full tank.

**Workflow:** place each item in the CAD assembly, assign its mass (measured where possible), read the assembly's mass properties, then repeat with the tank empty and with a passenger to bracket the range.
