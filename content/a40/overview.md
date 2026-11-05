---
title: "Build Log"
date: 2026-01-15
status: in-progress
epic: project
kind: log
tags: [overview, planning]
---

This is my working log for the A40 build: a 1950 Austin A40 Devon body on a custom ladder frame, with a narrowed Mazda NA Miata front suspension, a narrowed NA Miata independent rear with a Mazda RX-8 diff and custom half-shafts, an SR20DET on a CD009 or Z32 gearbox, and Miata disc brakes on a 4x100 bolt pattern all round. How the body attaches to the frame (welded, rubber-mounted or a mix) is still open.

> Headline numbers (mass, track, wheelbase, tyres, drivetrain) live in [build constants](./build-constants). If another post disagrees, the constants page wins. Task status lives on the roadmap.

## Changes to the plan

| Date | Change | Detail |
|---|---|---|
| Oct 2026 | Rear: Ford 9" four-link live axle → narrowed Miata NA IRS + RX-8 diff + custom half-shafts. Rear track stays {{rear_track}}. | [rear suspension](./rear-suspension) |
| Earlier | Gearbox: OEM SR20 5-speed rejected (weak 3rd gear); CD009 or Z32, whichever clean unit turns up first. | roadmap: Decide Transmission |

## Reading order

1. [Teardown](./teardown): what came off the original car.
2. [Front suspension options](./suspension-options): why a custom frame and not a Mustang II splice.
3. [Motor selection](./motor-selection): why the SR20DET.
4. [Steering](./steering): narrowed Miata rack; manual steering or a Prius EPAS column (open).
5. [Dimensions, tyre choice and narrowing](./narrowing-analysis): front track and how far to narrow the donor.
6. [Donor geometry dimensions](./donor-geometry-dimensions): measured donor pickup points.
7. [Geometry design reference](./geometry-design-reference): roll centre, scrub, motion ratio, what narrowing changes.
8. [Suspension tuning reference](./suspension-tuning): wheel rates, anti-roll bars, dampers, alignment.
9. [Rear suspension](./rear-suspension): narrowed Miata IRS, RX-8 diff, half-shafts, driveshaft angles.
10. [Frame jig](./frame-jig).
11. [Ladder frame design](./frame-design), then the [design overview](./design-overview) (integration and clearance checks), then [design finalization and cut list](./design-finalization).
12. [Wiring overview](./wiring-overview): Haltech Nexus S2 and the harness decisions.
13. [Digital dash](./digital-dash): Godot dash on a Pi over CAN.
14. [EPAS CAN gateway](./epas-can-gateway): the same Pi as a dual-bus gateway so the Prius column gets speed-sensitive assist (only if EPAS is chosen).

## By system

| System | Posts |
|---|---|
| Reference | [build constants](./build-constants) |
| Front suspension | [options](./suspension-options) → [narrowing](./narrowing-analysis) → [donor dimensions](./donor-geometry-dimensions) → [geometry reference](./geometry-design-reference) → [tuning](./suspension-tuning) |
| Rear suspension and driveline | [rear suspension](./rear-suspension) |
| Steering | [steering](./steering) |
| Frame | [jig](./frame-jig) → [frame design](./frame-design) → [design overview](./design-overview) → [design finalization](./design-finalization) |
| Engine | [motor selection](./motor-selection) |
| Electrical | [wiring overview](./wiring-overview) · [digital dash](./digital-dash) · [EPAS CAN gateway](./epas-can-gateway) |
