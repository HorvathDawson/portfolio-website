---
title: "Steering"
date: 2024-04-01
status: in-progress
epic: design
kind: reference
tags: [steering, safety, fabrication]
---

The stock A40 steering is unassisted, and the column is a solid shaft pointed at your chest. Both change.

## Decisions

| Item | Choice | Status |
|---|---|---|
| Assist | Toyota Prius Gen 3 (2010-2015) column-mount EPAS | chosen |
| Assist control | Pi CAN gateway for speed-sensitive assist; failsafe mode as fallback | see [EPAS CAN gateway](./epas-can-gateway) |
| Column | Collapsible (the Prius column), adapted to the A40 dash | required |
| Rack | Miata NA manual (or depowered) rack, **narrowed 190 mm total (7.5", 95 mm per side)** | locked with the 95 mm/side suspension narrowing |
| Steering arms | Stock Miata knuckle arms | keep, pending linkage solve |
| Steering stops | Adjustable hard stops | **mandatory** |

---

## EPAS

### Why the Prius column

Cheapest and simplest path. The motor and torque sensor sit on the column, so it does not care which rack is underneath, and there are no pumps, lines or fluid. Junkyard columns are cheap (forum reports $35-50 at U-Pull yards; verify). Any Gen 3 year should share the same CAN frames (verify on the donor).

### How it is powered and controlled

1. **Power:** fused 12 V and ground with heavy-gauge cable.
2. **Wake:** the column's IG wake line is **hard-wired to switched ignition**. Do not rely on the gateway to wake it.
3. **Assist curve:** the Pi gateway sends the two Toyota frames the column expects (`0x1C4` engine RPM, `0xB4` vehicle speed). With these the column gives speed-sensitive assist. Frame IDs, checksums and the safety reasoning are in the [EPAS CAN gateway](./epas-can-gateway) post.
4. **Fallback:** if the gateway stops, the column drops to its internal failsafe (fixed assist). That is the worst case and it is acceptable.

**Engine-off assist is not promised.** The column only starts assisting once it sees RPM > 0 on CAN, so with the engine off (pushing the car around the shop) it may give no assist. Confirm on the bench rig what the column does with ignition on, engine off, and decide then.

### Options I ruled out

| Option | Why not |
|---|---|
| Saturn Vue column | Common donor, usually run with an aftermarket controller for adjustable assist. Different connector from the Prius (forum reports the same terminal sizes; verify). |
| Kia Soul column | Reported to work in default mode with no controller. Forum tips: heavy power/ground cables, replace the motor's rubber coupling. Fewer write-ups than the Prius. |
| Electro-hydraulic pump (MR2 Spyder, Volvo S40/V50) | A separate system: an electric pump driving a conventional hydraulic rack. Still has lines and fluid; some pumps (especially Volvo) are low-flow. |
| Aftermarket kit (EPAS Performance, via Silver Sport Transmissions) | Adjustable controller, universal mounting, but around $1,500+ (verify). Defeats the junkyard budget. |

---

## Rack narrowing

The rack is narrowed by exactly the suspension narrowing (95 mm per side, **190 mm / 7.5" total**) so the tie-rod inner joints stay on the same line as the control-arm pivots and bump steer is preserved. (The old 175 mm figure came from the 1405 mm donor-track baseline.) Stock NA housing length is ~578 mm (verify on the rack).

190 mm sits in the "moderate" zone of builder data from [LocostUSA](https://www.locostusa.com/forums/viewtopic.php?t=2773): routine < 6" (152 mm), moderate 6-8", practical limit ~10-11".

### Procedure

The usual route keeps the toothed section of the bar untouched:

1. Measure and record the stock rack: housing length, bar length, travel lock-to-lock, inner tie-rod thread.
2. Mark the pinion centre and keep the toothed section and its full travel intact.
3. Decide where the 190 mm comes from. 95 mm off each end keeps the pinion where it was relative to the car centreline; 190 mm off one end moves the pinion 95 mm sideways (check column routing first).
4. Shorten the **non-toothed end(s)** of the bar and re-cut the tie-rod thread (drill and tap, or turn and thread) to match the inner tie-rod joint.
5. Shorten the housing by the same amount at the same end(s). Weld or sleeve it in a V-block fixture so it stays straight.
6. If any welding is near the bar, clamp a copper heat sink along it. A warped bar binds.
7. Re-check travel lock-to-lock and smoothness through the full stroke before fitting.

Machining a new bar from billet is the fallback if the stock bar cannot be shortened cleanly; it is not the default.

<figure>
  <img src="/assets/projects/a40-austin/blog/plots/rack_narrowing.png" alt="Rack narrowing required vs front track width with difficulty zones" />
  <figcaption>Rack narrowing vs front track, with difficulty zones from LocostUSA builder data. Narrowing equals the change in hub-face spacing from the donor; at 95 mm per side that is 190 mm total, in the moderate zone.</figcaption>
</figure>

---

## Ackermann

The stock Miata steering arms point at the Miata rear axle: knuckle angle atan(710 / 2265) = **17.40°**. On the A40 (half-track 617 mm, wheelbase 2350 mm) the same arms converge ahead of the rear axle, so the car has slightly more Ackermann than ideal.

In the approximate model the excess is about 0.5° at 15° of lock and **about 1° at 20°** (autocross slalom, ~6.5 m radius). That is marginal: comparable to compliance steer, still well below tyre slip angles (4°+). I am keeping the stock arms for now.

The plot uses a **virtual-wheelbase approximation**, not a real linkage solve. Once the steering arm is scanned (it is still an estimate in [donor geometry dimensions](./donor-geometry-dimensions)), solve the actual rack/tie-rod/arm linkage in SA V2 at the chosen rack position and re-check this before committing to the rack mount.

<figure class="wide">
  <img src="/assets/projects/a40-austin/blog/plots/ackermann.png" alt="Ackermann error vs steering angle with driving scenarios and turn radii" />
  <figcaption>Stock Miata knuckle arms (17.40°) on the A40 (track ~1230 mm, wheelbase 2350 mm), approximate virtual-wheelbase model. Top: excess Ackermann vs steering lock, with driving scenarios and turn radii. Bottom: at autocross angles (15-20°) the excess runs from ~0.5° to ~1.0°, around compliance-steer level and well below tyre slip angles. A linkage solve with the scanned steering arm is still needed.</figcaption>
</figure>

### Rack position

- Moving the rack 10-15 mm fore-aft changes Ackermann noticeably. Use this before considering custom arms.
- Keep the inner tie-rod angle within 10-12° of horizontal to avoid binding and wear.
- Build at least ±15 mm of vertical rack adjustment for bump steer (see [geometry design reference](./geometry-design-reference)).

---

## Lock and turning circle

Body clearance, not the rack, limits lock. Expect to lose **12-18° of lock** compared with the Miata (the tyre sits further out and further in than the stock A40 tyre; see [narrowing analysis](./narrowing-analysis)).

| | Turning circle (diameter) |
|---|---|
| Miata NA | ~9.4 m |
| A40 build, estimate | **~16-25 m** |

That is a real drivability cost (three-point turns, parking). Steering stops are **mandatory**: set them on the jig where the tyre clears the scanned body at full lock and full bump, with margin. Then measure the actual turning circle.

---

## References

- [GRM - Junkyard Electric Power Steering Assist](https://grassrootsmotorsports.com/forum/grm/have-we-talked-about-the-junkyard-electric-power-steering-assist-stuff/257657/page1/) - Prius, Vue, Kia Soul and electro-hydraulic installs.
- [ChevyHardcore - Add Electronic Power Steering To Your Classic](https://www.chevyhardcore.com/news/add-electronic-power-steering-to-your-classic/) - EPAS Performance kit and column-mount EPS on vintage cars.
- [Vintage Mustang - Rack and Pinion Plus EPAS Options](https://www.vintage-mustang.com/threads/rack-and-pinion-plus-epas-options.1183512/) - aftermarket rack plus EPAS on classic platforms.
- [LocostUSA - Rack shortening thread](https://www.locostusa.com/forums/viewtopic.php?t=2773) - shortening process, pitfalls and builder data on shortening ranges.
