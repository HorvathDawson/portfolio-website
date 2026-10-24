---
title: "Dimensions, Tire Choice & Narrowing"
date: 2026-02-15
status: in-progress
epic: narrowing
kind: tutorial
tags: [suspension, geometry, analysis, miata, research]
---

How much the Miata front suspension narrows, what wheel and tyre go on the corner, and where that puts the tyre relative to the A40 body. Geometry consequences (roll centre, camber, scrub, anti-dive) are in the [geometry design reference](./geometry-design-reference); donor coordinates are in [donor geometry dimensions](./donor-geometry-dimensions).

## Decisions

| Item | Value | Status |
|---|---|---|
| Front narrowing | **95 mm per side** | locked |
| Hub face from CL | 750 → **655 mm** | locked (this is the dimension to build to) |
| Wheel / tyre | 15×6 **ET38**, 4×100, **205/65R15** (OD 647.5 mm) | chosen |
| Front track | 2 × (655 − 38) = **1234 mm** ("~1230 mm") | derived from hub face + ET |
| Rack narrowing | 190 mm total | see [steering](./steering) |

Lock the pickups and hub-face position, not the track number: track falls out of whatever ET goes on the hub.

The donor baseline (1420 mm track at ET40 → hub face 750 mm from CL) is the scanned/reconciled figure; published NA figures range 1405-1425 mm. **Measure the donor hub-face-to-hub-face width** before cutting anything.

---

## Inputs

| | A40 Devon | Miata NA | Δ (A40 − Miata) |
|---|---|---|---|
| Wheelbase | 2350 mm | 2265 mm | +85 mm |
| Front track | 1232 mm | 1420 mm | −188 mm |
| Stock tyre | 5.25-16 (133 × 646 mm) | 185/60R14 (185 × 578 mm) | width −52 mm, OD +68 mm |
| Stock outer-to-outer | 1232 + 133 = **1365 mm** | 1420 + 185 = **1605 mm** | −240 mm |
| Stock wheel | 16 in steel, no offset | 14×6 ET40 | — |
| Bolt pattern | 4-stud | 4×100 | converting to 4×100 |
| Mass | build: ~875 kg curb, ~950 kg with driver and fuel ([build constants](./build-constants)) | — | — |

A40 numbers from [automobile-catalog](https://www.automobile-catalog.com/car/1950/1767110/austin_a40_deluxe_devon.html) and [classiccarportraits](https://www.classiccarportraits.co.uk/pages/Austin_A40_Devon_4752.htm).

---

## Wheel and tyre

Same size all four corners, steel wheel so the original A40 hubcaps fit.

| Path | Tyre | OD | Trade-off |
|---|---|---|---|
| **Match A40 stock height (chosen)** | 205/65R15 | 647.5 mm | Period ride height. The whole corner rises with the tyre on the custom frame, so camber curve and KPI are preserved. Scrub and trail change slightly (below). |
| Stay near Miata stock | 185/60R15 | 603 mm | Closer to factory; car sits low and the wheels look small in the fenders. |

---

## Fitment: where the tyre sits vs stock

The hub face is fixed at 655 mm from CL. Everything else follows:

$$\text{wheel CL} = 655 - \text{ET} \qquad T = 2(655 - \text{ET}) \qquad \text{outer-to-outer} = T + w_{tyre}$$

Track **does** depend on ET. Each 10 mm less ET moves each tyre 10 mm outboard (outer-to-outer +20 mm).

Outer-to-outer minus stock A40 (1365 mm). Per-side figure is half this. Positive = further out than the stock tyres.

| Tyre width | ET25 (T 1260) | ET30 (T 1250) | ET38 (T 1234) | ET45 (T 1220) |
|---|---|---|---|---|
| 175 mm | +70 | +60 | +44 | +30 |
| 185 mm | +80 | +70 | +54 | +40 |
| 195 mm | +90 | +80 | +64 | +50 |
| **205 mm (chosen)** | +100 | +90 | **+74** | +60 |

**Tyre poke: ~35 mm per side outside the stock A40 tyres.** Outer-to-outer is 1230 + 205 = **1435 mm** vs 1232 + 133 = 1365 mm stock: +70 mm, 35 mm/side. This is the figure used across the build posts. At the exact 1234 mm track the table gives +74 (37 mm/side: outer edge 719.5 mm from CL vs 682.5 mm stock); the 2 mm difference is inside the ET and donor-track uncertainty. The tyre also reaches ~35 mm further *inboard* than the stock tyre (inner edge 514.5 vs 549.5 mm). The earlier version of this table showed ~10 mm/side; every cell carried a +25 mm error. Nothing in the 95 mm narrowing gets the outer edge back to stock: no ET in the table brings a 205 under +60.

This is the main fitment risk. Check against the scanned body envelope:

1. Place the tyre (205 × 647.5 mm, wheel CL 617 mm from CL) in the scan at ride height. Measure sidewall-to-fender-lip and tread-to-arch clearance. Budget: 25-50 mm per side.
2. Sweep full bump with wheels straight. Watch the outer shoulder against the fender lip.
3. Sweep full lock at ride height. Watch the inner shoulder against the inner arch and frame rail (the tyre now reaches further inboard).
4. Combine full lock + full bump (see caveat below).
5. If it does not fit, in order of preference: higher ET (ET45 = −7 mm/side, check caliper clearance), narrower tyre (195 = −5 mm/side), small fender flare or lip roll. More narrowing would move the rack, pickups and RC and is the last resort.

---

## Scanned donor geometry: what it changes

Coordinates are in [donor geometry dimensions](./donor-geometry-dimensions). Points that drive fabrication:

| Item | Stock (from CL) | Narrowed (from CL) | Note |
|---|---|---|---|
| Hub face | 750 mm | **655 mm** | build reference plane |
| LCA inner pivots (both) | 329.5 mm | **234.5 mm** | 322.5 mm fore-aft c-to-c |
| UCA inner pivots | 368 mm | **273 mm** | 38.5 mm **outboard** of the LCA pivots (normal short-long-arm layout) |

- **Arm-length ratio 1.34 : 1** (LCA 336.25 mm, UCA 250 mm, lateral). Closer to equal than the ~1.9 : 1 often assumed, so camber gain per mm of bump is modest. Static negative camber comes from alignment shims, not the camber curve.
- **UCA bushing axis is tilted and canted.** Side view: front pivot 13.56 mm higher than rear over 220 mm (≈3.5° nose-up). Plan: the axis is not parallel to the car centreline. The brackets must reproduce both rotations, not just the pivot centres.
- **Scrub and trail on the A40 package** (scanned knuckle, ET40 → ET38, hub ~35 mm higher):

| | Miata stock (185/60R14, ET40) | A40 (205/65R15, ET38) |
|---|---|---|
| Scrub radius | +6.05 mm | **≈ +0.5 mm** (near zero) |
| Mechanical trail (3.62° caster) | 7.57 mm | **≈ 9.8 mm** |

Near-zero scrub means less kickback and less self-centring under braking; the extra trail adds a little on-centre feel. Derivation in the [geometry design reference](./geometry-design-reference).

### Fabrication notes

1. Build to the hub face (655 mm from CL), not to "track". The scanned LBJ/UBJ offsets are measured from the hub-face plane and do not change with narrowing.
2. LCA brackets: both pivots at 234.5 mm from CL, 322.5 mm apart fore-aft.
3. UCA brackets: 273 mm from CL (38.5 mm outboard of the LCA pivots). Check clearance to the SR20 valve cover, exhaust manifold side and inner fender before committing.
4. Fixture the UCA brackets off the actual arm with a bar through the bushing axis so the 3.5° tilt and plan cant are captured. ±1 mm on pivot centres is necessary but not sufficient: orientation errors matter as much.

---

## Full-lock and full-bump caveat

The earlier sweep found the inner front corner of the tyre touching the inner arch by a few mm at simultaneous full lock + full bump. That sweep used the wrong tyre position (the +25 mm table error), so **redo it** against the scanned envelope with the corrected tyre position (step 4 above).

Expected handling, in order of preference:

1. **Steering stops.** Mandatory anyway (see [steering](./steering)); set them where the tyre clears with margin.
2. **Bump-stop progression** to limit usable travel at full lock.
3. **Local inner-arch trimming** at the contact point.

Decide on the jig with the real knuckle and tyre swept against the body. The 95 mm narrowing does not change over a few mm in the worst-case corner.
