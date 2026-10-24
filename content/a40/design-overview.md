---
title: "Design Overview"
date: 2026-04-12
status: in-progress
epic: design
kind: reference
tags: [design, cad, clearance, planning, integration]
---

The integration view: one line per system, then the clearance problems I have to solve in CAD before any metal is cut. Numbers come from [build constants](./build-constants); detail lives in the linked posts.

## Systems

| System | Plan | Detail |
|---|---|---|
| Frame | Custom ladder: two main rails plus crossmembers, built around the suspension and drivetrain pickups. Body mount positions measured off the original A40 frame. | [frame design](./frame-design) · [finalization](./design-finalization) · [jig](./frame-jig) |
| Front suspension | Narrowed Miata NA double wishbone, inboard pickups moved {{front_narrowing}} per side (LCA {{lca_pivot}}, UCA {{uca_pivot:0}} from centreline). | [narrowing](./narrowing-analysis) · [geometry](./geometry-design-reference) · [tuning](./suspension-tuning) |
| Rear suspension | Narrowed Miata NA IRS, every inboard pickup moved ~{{rear_narrowing_lo:raw}}–{{rear_narrowing_hi}} per side (measure the donor) for the locked {{rear_track}} track. RX-8 diff on custom chassis mounts, custom half-shafts. | [rear suspension](./rear-suspension) |
| Engine + gearbox | SR20DET on a CD009 or Z32 (OEM 5-speed rejected). Tunnel sized to the CD009. Engine/gearbox {{engine_angle}} down at the rear (tail-down), RX-8 pinion parallel. | [motor selection](./motor-selection) |
| Driveshaft | One-piece, {{shaft_drop}} drop over {{shaft_length}}: shaft {{shaft_angle}}, both U-joints {{ujoint_front}}. The diff is sprung, so the angles don't change with travel. | [rear suspension](./rear-suspension#driveshaft-and-u-joint-angles) |
| Steering | Narrowed Miata NA rack ({{rack_narrowing}} total), manual steering or a Prius Gen 4 (2016–2022) EPAS column on a Pi CAN gateway (open). | [steering](./steering) |
| Body | Original A40 shell, laser-scanned (done). Mount style (welded / rubber / hybrid) still open. | this post |
| Electronics | Haltech Nexus S2; Godot digital dash on a Pi behind the original bezel. | [wiring](./wiring-overview) · [dash](./digital-dash) |

| Ancillary | Plan |
|---|---|
| Radiator | Custom aluminium, stock location, electric fan (small grille). |
| Intercooler | FMIC, ahead of or below the radiator depending on grille fit. |
| Shock mounts | Front towers part of the frame. Rear coilovers from the Miata rear corners to frame-side towers. |
| Fuel tank | Stock location under the boot floor if it clears the half-shafts, diff and exhaust; custom cell otherwise. |
| Shifter | Remote. In CAD the native CD009 lever lands behind my hip. Linkage style (solid rod vs short-throw kit) TBD. |

## Clearance checks

| Issue | Constraint | Approach |
|---|---|---|
| Engine + gearbox length | Long package for a {{wheelbase}} wheelbase. The biggest packaging constraint. | Firewall, tunnel and floor drawn around the bellhousing. Remote shifter. |
| Oil pan vs steering rack | Sump hangs below the block near the rack and tie rods. | Overlay engine + rack in CAD at mounting height; baffled or modified sump if needed. |
| Pedal box | Firewall close to the front axle. Manual brakes (locked). | Three candidates: engine-bay side, underfloor, or bulkhead-recessed. The SR20DET is cable throttle stock; I'm planning a DBW conversion, so only a wiring path is needed. |
| Shock selection | No single kit covers both ends; the front tower geometry locks early. | Options: a Miata coilover kit at both ends (possible now the rear is Miata too), monotubes in custom sleeves, or full custom (QA1, Viking). Decide before the frame is final. |
| Exhaust | 3" downpipe, ~90–100 mm envelope with hangers and shielding. | Routed: driver side between cylinders 3 and 4, under the pedal box, along the driver-side rail. Clears the crossmembers, no notches (see below). Re-check against the half-shafts and diff. |
| Charge piping | Turbo (driver side) → across the front → IC → back to the intake (passenger side). | Silicone couplers, clamp clearance budgeted in CAD. |
| Radiator airflow | Small grille, FMIC ahead of the radiator. | Largest core the opening allows, shrouded electric fan. |
| Driveshaft | Runs in the tunnel; angles fixed because the diff is sprung. | Tunnel sized for the shaft plus engine movement and vibration margin. Safety loop at a crossmember. |
| Half-shafts + diff | New with the IRS: the diff and inner half-shafts sit between the rear rails. | Check half-shaft sweep through full bump/droop against rails, crossmembers, exhaust, fuel tank and brake/parking-brake lines. |
| Steering lock | Expect {{lock_loss_lo:raw}}–{{lock_loss_hi}} less lock than the Miata. Tyre-to-body clearance sets it, not the rack: the wider tyres sit further out and further in than the stock A40 tyres in the same wells ([steering](./steering#lock-and-turning-circle)). Turning circle grows from ~{{turning_circle_miata}} (Miata) to roughly {{turning_circle_lo:raw:0}}–{{turning_circle_hi:0}}. | Steering stops are mandatory. Check tie rods against rail, LCA and brackets at full lock. |
| Tyre fitment | Front tyres sit ~{{tyre_poke}}/side further out than stock, and the inner edge further inboard. Main fitment risk. | Check full lock + full bump against the scanned body and the shock bodies. |
| Body-to-frame | Mount style still open. Panels must clear tyres, arms and shocks at full travel and roll. | Check against the body scan. |
| Brake lines | Four discs, braided flex at each corner, hard lines on the rails. | Rear flex runs frame → upright; it must take full droop without tension and full bump without kinking. |
| Wiring | Nexus S2 standalone; engine harness through a bulkhead connector, body harness along the rails. | Away from exhaust and moving parts; dedicated frame ground bus. |

### Downpipe routing

![SR20DET assembly with forward top-mount turbo and downpipe routing down the driver side between cylinders 3 and 4](/assets/projects/a40-austin/blog/reference/sr20-downpipe-routing.png)

Forward top-mount manifold, turbo high and ahead of the head. The downpipe drops on the driver side between cylinders 3 and 4, runs under the pedal box and along the driver-side frame rail to a single rear exit. The path clears every crossmember, so none need relief notches.
