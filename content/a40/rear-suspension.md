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
| Rear track | 1340 mm | locked (body) |
| Hub face from centreline | 708 mm (670 half-track + ET38) | locked |
| Narrowing per side | ~42–47 mm (see below) | measure donor |
| Diff | Mazda RX-8 rear diff | decided |
| Final drive | ~4.44 stock RX-8 6-speed | verify on the unit; ratio open |
| Half-shafts | custom length, RX-8 diff flanges to Miata hubs | to order |
| Rear sprung corner mass | ~181 kg | working |
| Rear wheel rate target | 16.1 N/mm (1.5 Hz), range 12–21 N/mm | working |
| Rear motion ratio | Miata rear, not yet measured | measure donor |
| Rear spring | 16.1 / MR²: 38 / 29 / 22 N/mm at MR 0.65 / 0.75 / 0.85 | pick once MR is measured |
| Rear roll centre | not yet modelled; assume 80–150 mm | model/measure |

**Narrowing amount.** Narrowing per side = stock hub-face distance from centreline − 708 mm. If the donor's 1420 mm rear track is quoted at ET40, that's 750 − 708 = **42 mm**. If it's at ET45, 755 − 708 = **47 mm**. Measure hub face to hub face on the donor subframe before cutting anything; don't trust the published track.

## Why the change

- An independent rear rides and grips better on real roads than a live axle, and the unsprung mass drops from a ~100+ kg axle to ~33 kg per corner.
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
- **Diagonal split + two proportioning valves** (one in each circuit's rear line, set identically). A diagonal split also wants near-zero or negative scrub radius so a single-circuit failure doesn't pull the car; the build's front scrub is ≈ +0.5 mm.

Miata rears are sized for a ~1000 kg car closer to 50/50; the A40 is ~950 kg at ~55/45, so expect to dial rear pressure down at shakedown.

## Diff and final drive

- **Why RX-8:** the NA Miata diff isn't suited to a 300+ whp SR20DET. The RX-8 unit is a common upgrade for high-power Miata-based builds. Weigh it when it arrives and add it to the [mass table](./build-constants).
- **Ratio:** the stock RX-8 6-speed final drive is about 4.44 (verify on the unit). Engine speed at 100 km/h on 205/65R15 (2.034 m circumference):

| Final drive | 5th (1.000) | 6th (CD009, 0.794) |
|---|---|---|
| 4.44 | 3640 rpm | 2890 rpm |
| 4.10 | 3360 rpm | 2670 rpm |
| 3.91 | 3200 rpm | 2540 rpm |

With the CD009's 6th, 4.44 cruises reasonably. With a 5-speed it would be busy on the highway. Ratio swaps for this diff family exist (verify which fit the RX-8 case before buying).

- **LSD:** RX-8s came with a torque-sensing (Torsen-type) LSD on some trims (verify on the unit). It biases torque but sends almost nothing when one wheel is unloaded. Fine for the street. A clutch-type LSD is the upgrade if it turns out to be a limitation.

## Driveshaft and U-joint angles

The engine and gearbox sit **3° down at the rear** (tail-down). The diff pinion is set parallel, 3° nose-up. The shaft drops 3.5" over its 37" length, so it runs at 5.4° and each U-joint sees 5.4 − 3.0 = **2.4°**. The angles are equal and opposite, in the same plane and non-zero, which cancels the speed fluctuation. Because the diff is chassis-mounted, these angles stay the same through suspension travel.

<figure class="wide" style="margin:1rem 0">
  <img src="/assets/projects/a40-austin/blog/plots/driveshaft_angles.png" alt="Driveshaft angle layout side view showing transmission, driveshaft, and pinion angles with U-joint operating angles" style="width:100%" />
  <figcaption>Driveshaft side view: gearbox output 3° tail-down, shaft 5.4° down to the rear (3.5" drop over 37" centre to centre), RX-8 pinion 3° nose-up, parallel to the gearbox. Both U-joints run at 2.4°. The diff is chassis-mounted, so this holds through suspension travel.</figcaption>
</figure>

U-joint life is roughly inversely proportional to operating angle (manufacturers rate it at 3° and 3000 rpm), so 2.4° is in the long-life range. Phase the yokes in line.

<figure class="wide" style="margin:1rem 0">
  <img src="/assets/projects/a40-austin/blog/plots/ujoint_life.png" alt="U-joint life expectancy vs operating angle chart" style="width:100%" />
  <figcaption>U-joint life vs operating angle at rated load and 3000 rpm (life ∝ 1/angle, 5000 h at the 3° rating). The build's 2.4° joints sit at ~6240 h, in the ideal 1–3° band; doubling to 6° would halve life to 2500 h.</figcaption>
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
4. Design the diff mounts and set pinion angle (3° nose-up, parallel to the gearbox).
5. Order half-shafts to measured length and plunge.
6. Decide the brake split.
7. Measure and order the driveshaft.
