---
title: "Rear Suspension, Diff & Driveshaft"
date: 2026-03-26
status: in-progress
epic: fabrication
kind: log
tags: [suspension, rear, miata, rx-8, driveshaft]
---

**Decision (October 2026): the rear is a narrowed Mazda NA Miata independent rear, with an RX-8 differential and custom half-shafts.** This replaces the earlier Ford 9" and four-link plan. The 9" on hand is now surplus.

Same idea as the front: keep the Miata geometry and move every inboard pickup towards the centreline by the same amount. Lateral translation leaves the side-view geometry (anti-squat, anti-lift, toe curve) exactly as Mazda designed it. It only changes track, roll centre height and roll stiffness, which the [suspension tuning](./suspension-tuning) and [geometry reference](./geometry-design-reference) posts cover.

## Numbers

| Item | Value | Status |
|---|---|---|
| Rear track | {{rear_track}} | locked (body) |
| Hub face from centreline | {{rear_hub_face}} ({{rear_half_track:raw}} half-track + ET{{wheel_et:raw}}) | locked |
| Narrowing per side | ~{{rear_narrowing_lo:raw}}–{{rear_narrowing_hi}} (see below) | measure donor |
| Diff | Mazda RX-8 rear diff | decided |
| Final drive | ~{{final_drive}} stock RX-8 6-speed | verify on the unit; ratio open |
| Half-shafts | custom length, RX-8 diff flanges to Miata hubs | to order |
| Rear sprung corner mass | ~{{corner_mass_rear}} | working |
| Rear wheel rate target | {{kw_rear}} ({{ride_freq_rear}}), range {{kw_rear_lo:raw}}–{{kw_rear_hi}} | working |
| Rear motion ratio | Miata rear, not yet measured | measure donor |
| Rear spring | {{kw_rear:raw}} / MR²: {{spring_rear_lo:raw:0}} / {{spring_rear_mid:raw:0}} / {{spring_rear_hi:0}} at MR {{rear_mr_lo}} / {{rear_mr_mid}} / {{rear_mr_hi}} | pick once MR is measured |
| Rear roll centre | not yet modelled; assume {{rear_rc_lo:raw}}–{{rear_rc_hi}} | model/measure |

**Narrowing amount.** Narrowing per side = stock hub-face distance from centreline − {{rear_hub_face}}. If the donor's {{rear_track_miata}} rear track is quoted at ET{{rear_et_miata_lo:raw}}, that's {{rear_hub_face_miata_lo:raw}} − {{rear_hub_face:raw}} = **{{rear_narrowing_lo}}**. If it's at ET{{rear_et_miata_hi:raw}}, {{rear_hub_face_miata_hi:raw}} − {{rear_hub_face:raw}} = **{{rear_narrowing_hi}}**. Measure hub face to hub face on the donor subframe before cutting anything; don't trust the published track.

## Why the change

- An independent rear rides and grips better on real roads than a live axle, and the unsprung mass drops from a ~100+ kg axle to ~{{unsprung_rear}} per corner.
- The diff is mounted to the chassis, so pinion angle and U-joint angles no longer change with suspension travel.
- Miata rear brakes, hubs and parking brake come with the uprights. No custom caliper brackets, and front and rear share the 4x100 wheels.
- The same narrowing method and the same tools as the front.

## Build plan

1. **Measure the donor.** Hub-face width, every inboard pickup (UCA, LCA, toe link, shock top) relative to the subframe centreline, and shock/spring travel vs wheel travel (that gives the rear motion ratio).
2. **Decide subframe strategy.** Either section the NA subframe (cut and shorten each side by the narrowing amount) or build the rear pickups into the new frame. Either way, every inboard pickup moves inboard by the same amount, toe links included, so the toe curve (bump steer) is unchanged.
3. **Diff mounting.** The RX-8 diff doesn't bolt into an NA subframe. Design custom front and rear diff mounts, centred on the car's centreline, with the pinion set to the driveshaft angle below.
4. **Half-shafts.** With the diff mounted and the pickups set, measure flange-to-hub length at ride height, full bump and full droop. Order custom shafts with the plunge range covering all three. The shaft maker needs the RX-8 diff output flange spec and the Miata hub spline spec.
5. **Rear brakes.** Miata NA rear calipers and rotors on the Miata uprights. The NA rear caliper has a built-in cable-operated parking brake; route the cables with gentle bends and the equalizer reachable from underneath.
6. **Corner and square.** Check thrust angle and toe on an alignment rig. Rear toe and camber are adjustable on Miata rear arms.

## Brakes: one open decision

The system decisions so far are manual brakes (no booster) and a dual circuit. A **diagonal (X) split has no rear circuit**, so a single rear proportioning valve can't work with it. Pick one:

- **Front/rear split + one adjustable rear valve.** Simplest, common on kit cars. Recommended unless there's a reason for X.
- **Diagonal split + two proportioning valves** (one in each circuit's rear line, set identically). A diagonal split also wants near-zero or negative scrub radius so a single-circuit failure doesn't pull the car; the build's front scrub is ≈ {{scrub}}.

Miata rears are sized for a ~1000 kg car closer to 50/50; the A40 is ~{{operating_mass}} at ~{{front_weight_fraction:raw}}/{{rear_weight_fraction:raw}}, so expect to dial rear pressure down at shakedown.

## Diff and final drive

- **Why RX-8:** the NA Miata diff isn't suited to a 300+ whp SR20DET. The RX-8 unit is a common upgrade for high-power Miata-based builds. Weigh it when it arrives and add it to the [mass table](./build-constants).
- **Ratio:** the stock RX-8 6-speed final drive is about {{final_drive}} (verify on the unit). Engine speed at {{reference_speed}} on {{tyre_size}} ({{tyre_circumference}} circumference):

| Final drive | 5th ({{gear_5th}}) | 6th (CD009, {{gear_6th}}) |
|---|---|---|
| {{final_drive}} | {{rpm_fd_5th}} | {{rpm_fd_6th}} |
| {{final_drive_alt1}} | {{rpm_alt1_5th}} | {{rpm_alt1_6th}} |
| {{final_drive_alt2}} | {{rpm_alt2_5th}} | {{rpm_alt2_6th}} |

With the CD009's 6th, {{final_drive}} cruises reasonably. With a 5-speed it would be busy on the highway. Ratio swaps for this diff family exist (verify which fit the RX-8 case before buying).

- **LSD:** RX-8s came with a torque-sensing (Torsen-type) LSD on some trims (verify on the unit). It biases torque but sends almost nothing when one wheel is unloaded. Fine for the street. A clutch-type LSD is the upgrade if it turns out to be a limitation.

## Driveshaft and U-joint angles

The engine and gearbox sit **{{engine_angle}} down at the rear** (tail-down). The diff pinion is set parallel, {{pinion_angle}} nose-up. The shaft drops {{shaft_drop}} over its {{shaft_length}} length, so it runs at {{shaft_angle}} and each U-joint sees {{shaft_angle:raw}} − {{engine_angle:raw:1}} = **{{ujoint_front}}**. The angles are equal and opposite, in the same plane and non-zero, which cancels the speed fluctuation. Because the diff is chassis-mounted, these angles stay the same through suspension travel.

<figure class="wide" style="margin:1rem 0">
  <img src="/assets/projects/a40-austin/blog/plots/driveshaft_angles.png" alt="Driveshaft angle layout side view showing transmission, driveshaft, and pinion angles with U-joint operating angles" style="width:100%" />
  <figcaption>Driveshaft side view: gearbox output {{engine_angle}} tail-down, shaft {{shaft_angle}} down to the rear ({{shaft_drop}} drop over {{shaft_length}} centre to centre), RX-8 pinion {{pinion_angle}} nose-up, parallel to the gearbox. Both U-joints run at {{ujoint_front}}. The diff is chassis-mounted, so this holds through suspension travel.</figcaption>
</figure>

U-joint life is roughly inversely proportional to operating angle (manufacturers rate it at 3° and 3000 rpm), so {{ujoint_front}} is in the long-life range. Phase the yokes in line.

<figure class="wide" style="margin:1rem 0">
  <img src="/assets/projects/a40-austin/blog/plots/ujoint_life.png" alt="U-joint life expectancy vs operating angle chart" style="width:100%" />
  <figcaption>U-joint life vs operating angle at rated load and 3000 rpm (life ∝ 1/angle, 5000 h at the 3° rating). The build's {{ujoint_front}} joints sit at ~6240 h, in the ideal 1–3° band; doubling to 6° would halve life to 2500 h.</figcaption>
</figure>

**Ordering the driveshaft** (once the engine, gearbox and diff are in their final positions on the jig):

1. Measure installed length at ride height, centre to centre of the joints.
2. Give the shop the gearbox output yoke spec (CD009) and the RX-8 pinion flange spec.
3. 1330-series joints are typical at this power; tube size (3" × .065–.083") is the shop's critical-speed call, and they balance it.
4. The slip yoke only has to cover engine movement and tolerance now, not axle travel.

## What's left

1. Measure the donor rear: hub-face width, pickups, motion ratio.
2. Decide: section the subframe or build pickups into the frame.
3. Buy and weigh the RX-8 diff; confirm its ratio and LSD type.
4. Design the diff mounts and set pinion angle ({{pinion_angle}} nose-up, parallel to the gearbox).
5. Order half-shafts to measured length and plunge.
6. Decide the brake split.
7. Measure and order the driveshaft.
