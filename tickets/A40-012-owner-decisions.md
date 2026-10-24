---
id: A40-012
title: Owner measurements and decisions
status: blocked
owner: Dawson
reviewer:
blocked_by: parts in hand
---

## Why
These can't be settled from the desk. Each answer goes into the constants file (A40-007) with status `locked` and a note saying how it was measured; every post and plot updates from there.

## Decisions
- [ ] **Steering assist: manual or Prius Gen 4 EPAS.** Drive a manual-rack NA Miata on 205-width tyres and park it. If it's acceptable with a 14–15 in wheel, go manual. Decide before buying the column (roadmap `t-decide-steering-assist`).
- [ ] **Brake split.** Front/rear + one adjustable rear valve (simplest), or diagonal + two valves set identically. Recommendation: front/rear.
- [ ] **Final drive and LSD.** Read the ratio tag on the RX-8 diff if present. Otherwise mark the pinion flange and both output flanges, turn both outputs together exactly one turn, and count pinion turns: that's the ratio (e.g. ~4.44). LSD check: turn one output flange with the other free. An open diff turns the free flange the opposite way with little effort; a Torsen resists and drags it.
- [ ] **Transmission:** CD009 or Z32 (availability call).
- [ ] **Battery location:** probably the boot. Confirms cable sizing.
- [ ] **Default roadmap view:** Next up, Tree or Map.

## Measurements
- [ ] **Front donor hub-face width.** With the subframe level, measure hub face to hub face at hub height (tape across, or plumb bob from each hub face to the floor and measure between marks). Half of it minus 655 mm = the front narrowing per side (planned 95). Settles the 1405 vs 1420 mm baseline.
- [ ] **Rear donor hub-face width.** Same method on the rear. Half of it − 708 mm = rear narrowing per side (expected 42–47).
- [ ] **Rear motion ratio.** Spring out, shock off or loose. Jack the hub through its travel in 10 mm steps; at each step record wheel-centre height and shock eye-to-eye length. MR = Δshock / Δwheel (average over ±30 mm of ride height).
- [ ] **Rear pickup coordinates** (for the rear roll centre): every inboard and outboard joint centre, x/y/z from the subframe centreline and a floor datum. A tape, a square and a plumb bob are enough; scanning is better.
- [ ] **Unsprung mass.** Weigh one complete front corner and one rear corner (hub, upright, brake, wheel+tyre) on a bathroom scale; add half the arms and, at the rear, half the half-shaft.
- [ ] **RX-8 diff mass** (bathroom scale).
- [ ] **Fuel tank capacity** (fill from empty with a measured can, or measure it).
- [ ] **Corner weights** once rolling (four scales or a shop's corner-weight set): replaces the 55/45 estimate.

## Prepared for the owner (not blocked)
- [x] Gauge art regenerated (done in the build container with bundled fonts: Jost for Futura, DejaVu Sans Mono for Menlo; no Mac needed any more).

## Verification
Each value entered in the constants file with how it was measured in its `note`.
