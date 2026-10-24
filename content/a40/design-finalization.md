---
title: "Design Finalization & Materials"
date: 2026-03-05
status: planning
epic: design
kind: log
tags: [frame, planning, materials]
---

The last design pass before buying metal: cut list, material spec, and the order the frame goes together on the [jig](./frame-jig). It follows [frame design](./frame-design) and the [design overview](./design-overview) clearance checks. Numbers come from [build constants](./build-constants).

## Done means

A signed-off cut list I can order from. The cut list **is** the BOM. Each line has:

- material grade and section (tube OD or rectangle size, wall thickness)
- cut length including weld and mitre allowance
- quantity
- CAD callout number for the cut/notch profile

## Inputs that must be locked first

| Input | Status |
|---|---|
| SA V2 outputs: front roll centre, camber curve, motion ratio at the chosen shock angle, anti-dive/squat, ARB stiffness split | in progress, see the [geometry reference](./geometry-design-reference) |
| Front donor pickups confirmed against the actual donor, not only the scan (everything marked "verify") | in progress |
| Rear donor measured: hub-face half-width (sets the ~{{rear_narrowing_lo:raw}}–{{rear_narrowing_hi}}/side narrowing), every inboard pickup incl. toe links, rear motion ratio | to do, see [rear suspension](./rear-suspension) |
| Rear pickups built into the frame vs a narrowed Miata rear subframe | open |
| RX-8 diff on hand, for the mount design | to buy |
| Gearbox: CD009 or Z32. The tunnel fits either; only the crossmember position moves with case length. | decided: either, whichever turns up first |
| Body mounting: welded, rubber or hybrid. Sets weld tabs vs bushing pockets. | open |
| Rear fenders: widened by shrinking, no tubs | decided |

## Materials

| Part | Spec |
|---|---|
| Main rails | Rectangular mild-steel tube (A500 or A513). Size waits on the SA V2 loads and a check of the UCA mount. |
| Crossmembers | Round DOM or rectangular A500/A513, depending on packaging. Round where bend access matters (around the tunnel). |
| Suspension brackets and diff mounts | Thick mild-steel plate, gusseted into the rails, with turned-steel or DOM tube inserts at each pivot ([geometry reference](./geometry-design-reference#structural-loads-and-compliance)). Not 4130: on mild-steel rails it adds cost and weld-procedure risk and gains nothing. |
| Shock towers | Plate, tied into the firewall crossmember and the UCA mount. No bolted joints in the main load path. |
| Body mount tabs | Positions from the stock body mounts; type (weld-in stud, threaded boss, bushing pocket) waits on the body-mounting decision. |

## Engine, gearbox and diff mounting

- Frame pads for the **stock SR20 engine mounts**; no custom engine mounts.
- Gearbox crossmember bolt-in, sized for the CD009 envelope; a Z32 only moves its position.
- Engine/gearbox **{{engine_angle}} down at the rear (tail-down)**; RX-8 pinion set parallel ({{pinion_angle}} nose-up). Shaft angle {{shaft_angle}}, both joints {{ujoint_front}}. Detail in [rear suspension](./rear-suspension#driveshaft-and-u-joint-angles).

## Build sequence

1. Sign off the cut list and order metal.
2. Cut and notch tubes to the CAD callouts.
3. Set the rails in the jig and tack them.
4. Fit and tack the crossmembers. Check the frame diagonals and flatness before going on.
5. Locate the brackets with the real parts bolted in: front arms and knuckles, rear arms, toe links and uprights, RX-8 diff, rack. Measure from centreline to each pickup and check left-right symmetry (pickups ±1 mm, UCA inner mounts ±0.5 mm), then tack.
6. Weld out **on the jig**: short stitched passes, alternating left/right and top/bottom so the heat is balanced; let it cool between passes. Re-check the pickups and diagonals after each stage.
7. Scan the finished frame and compare it to CAD before it comes off the jig.

Photos, the actual cut list and any differences between CAD and metal go in this post as they happen.
