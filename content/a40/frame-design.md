---
title: "Ladder Frame Design"
date: 2026-02-20
status: in-progress
epic: design
kind: log
tags: [frame, cad, fabrication]
---

The frame is a ladder (two main rails plus crossmembers) designed from scratch in CAD around the suspension and drivetrain mounting points, instead of splicing modern subframes into the original A40 chassis. Why a custom frame at all is in [front suspension options](./suspension-options). Numbers come from [build constants](./build-constants).

## Inputs

| Input | Value | Source |
|---|---|---|
| Wheelbase | 2350 mm (locked, stock A40) | [constants](./build-constants) |
| Front track | ~1230 mm: hub face 655 mm from CL (95 mm/side narrowing) | [narrowing](./narrowing-analysis) |
| Rear track | 1340 mm: hub face 708 mm from CL | [rear suspension](./rear-suspension) |
| Front inner pivots | LCA 234.5 mm, UCA 273 mm from CL; fore/aft spacing and heights kept from the donor | [donor dimensions](./donor-geometry-dimensions) |
| Rear inner pivots | Every Miata rear inboard pickup (toe links included) moved inboard by ~42–47 mm/side (measure the donor) | [rear suspension](./rear-suspension) |
| Diff | RX-8, on custom frame mounts, pinion parallel to the gearbox | [rear suspension](./rear-suspension) |
| Engine + gearbox | SR20DET, CD009 or Z32; tunnel sized to the CD009; 3° tail-down | [motor selection](./motor-selection) |
| Steering rack | Narrowed Miata rack, mount with at least ±15 mm vertical adjustment (bump steer) | [steering](./steering) |
| Body mounts | Measured off the original A40 frame. Welded / rubber / hybrid still open, so the rails must accept either. | [teardown](./teardown) |

## Layout

The two rails run full length, parallel and at constant height through the centre section so the body sits flat. Crossmembers, front to back:

1. **Front:** behind the bumper; radiator support and front body mounts.
2. **Front suspension:** carries the LCA and UCA pickup brackets and the base of the shock towers.
3. **Firewall:** structural box tying into the shock towers; carries the upper steering column mount.
4. **Gearbox:** bolt-in and removable. The gearbox drops out from below without lifting the body or cutting the frame (the driveshaft has to come out first).
5. **Mid floor:** body support and torsional stiffness.
6. **Rear suspension:** carries the narrowed Miata rear pickups (or a narrowed Miata rear subframe, whichever CAD settles on) and the RX-8 diff mounts.
7. **Rear:** behind the rear suspension; rear body mounts and bumper.

The rear rails have to leave room for the diff and for the half-shafts through full bump and droop, and for the rear coilover towers.

Shock towers are part of the frame, not bolted plates. The front towers tie into both the UCA mount and the firewall crossmember, so the UCA load path and the shock load path share one structure instead of splitting through a bolted joint.

## Loads

From the [geometry reference](./geometry-design-reference): peak weight transfer at 0.8 g is ~43% higher than the donor Miata, mostly because the CG is higher (~575 mm vs ~460 mm). That loads the UCA mount, the shock tower tops and the rear pickups hardest. Rail and crossmember sizes go in the cut list in [design finalization](./design-finalization).

## Still open

| Item | What it affects |
|---|---|
| Body mounting (welded / rubber / hybrid) | Weld tabs vs bushing pockets at each body mount. |
| Rear pickups: built into the frame vs narrowed Miata subframe | Rear crossmember layout. Needs the donor rear measured first. |
| Front shock tower position | Shock angle. Front motion ratio is ≈0.68 (see the [geometry reference](./geometry-design-reference)); confirm once the shock and stroke are chosen. |
| Rear shock towers | Rear motion ratio, to be measured on the donor. |
| Gearbox (CD009 vs Z32) | Only the crossmember position and shifter hole; the tunnel fits either. |

Body-to-frame clearance is checked against the laser scan of the shell. The [design overview](./design-overview) has the cross-system clearance list.
