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
| Front narrowing | **{{front_narrowing:raw}} mm per side** | locked |
| Hub face from CL | {{front_hub_face_miata:raw}} → **{{front_hub_face}}** | locked (this is the dimension to build to) |
| Wheel / tyre | 15×6 **ET{{wheel_et:raw}}**, 4×100, **{{tyre_size}}** (OD {{tyre_od}}) | chosen |
| Front track | 2 × ({{front_hub_face:raw}} − {{wheel_et:raw}}) = **{{front_track}}** ("~{{front_track_nominal}}") | derived from hub face + ET |
| Rack narrowing | {{rack_narrowing}} total | see [steering](./steering) |

Lock the pickups and hub-face position, not the track number: track falls out of whatever ET goes on the hub.

The donor baseline ({{front_track_miata}} track at ET{{et_miata:raw}} → hub face {{front_hub_face_miata}} from CL) is the scanned/reconciled figure; published NA figures range 1405-1425 mm. **Measure the donor hub-face-to-hub-face width** before cutting anything.

---

## Inputs

| | A40 Devon | Miata NA | Δ (A40 − Miata) |
|---|---|---|---|
| Wheelbase | {{wheelbase}} | {{wheelbase_miata}} | +85 mm |
| Front track | {{a40_stock_track}} | {{front_track_miata}} | −188 mm |
| Stock tyre | 5.25-16 ({{a40_stock_tyre_width:raw}} × 646 mm) | {{tyre_size_miata}} ({{tyre_width_miata:raw}} × {{tyre_od_miata}}) | width −52 mm, OD +68 mm |
| Stock outer-to-outer | {{a40_stock_track:raw}} + {{a40_stock_tyre_width:raw}} = **{{a40_stock_outer}}** | {{front_track_miata:raw}} + {{tyre_width_miata:raw}} = **1605 mm** | −240 mm |
| Stock wheel | 16 in steel, no offset | 14×6 ET{{et_miata:raw}} | — |
| Bolt pattern | 4-stud | 4×100 | converting to 4×100 |
| Mass | build: ~{{curb_mass}} curb, ~{{operating_mass}} with driver and fuel ([build constants](./build-constants)) | — | — |

A40 numbers from [automobile-catalog](https://www.automobile-catalog.com/car/1950/1767110/austin_a40_deluxe_devon.html) and [classiccarportraits](https://www.classiccarportraits.co.uk/pages/Austin_A40_Devon_4752.htm).

---

## Wheel and tyre

Same size all four corners, steel wheel so the original A40 hubcaps fit.

| Path | Tyre | OD | Trade-off |
|---|---|---|---|
| **Match A40 stock height (chosen)** | {{tyre_size}} | {{tyre_od}} | Period ride height. The whole corner rises with the tyre on the custom frame, so camber curve and KPI are preserved. Scrub and trail change slightly (below). |
| Stay near Miata stock | 185/60R15 | 603 mm | Closer to factory; car sits low and the wheels look small in the fenders. |

---

## Fitment: where the tyre sits vs stock

The hub face is fixed at {{front_hub_face}} from CL. Everything else follows:

$$\text{wheel CL} = {{front_hub_face:raw}} - \text{ET} \qquad T = 2({{front_hub_face:raw}} - \text{ET}) \qquad \text{outer-to-outer} = T + w_{tyre}$$

Track **does** depend on ET. Each 10 mm less ET moves each tyre 10 mm outboard (outer-to-outer +20 mm).

Outer-to-outer minus stock A40 ({{a40_stock_outer}}). Per-side figure is half this. Positive = further out than the stock tyres.

| Tyre width | ET25 (T 1260) | ET30 (T 1250) | ET38 (T 1234) | ET45 (T 1220) |
|---|---|---|---|---|
| 175 mm | +70 | +60 | +44 | +30 |
| 185 mm | +80 | +70 | +54 | +40 |
| 195 mm | +90 | +80 | +64 | +50 |
| **205 mm (chosen)** | +100 | +90 | **+74** | +60 |

**Tyre poke: ~{{tyre_poke:raw}} mm per side outside the stock A40 tyres.** Outer-to-outer is {{front_track_nominal:raw}} + {{tyre_width:raw}} = **{{tyre_outer_front}}** vs {{a40_stock_track:raw}} + {{a40_stock_tyre_width:raw}} = {{a40_stock_outer}} stock: {{tyre_outer_gain}}, {{tyre_poke}}/side. This is the figure used across the build posts. At the exact {{front_track}} track the table gives {{tyre_outer_gain_exact:raw}} ({{tyre_poke_exact}}/side: outer edge {{tyre_outer_edge}} from CL vs {{a40_stock_outer_edge}} stock); the {{tyre_poke_rounding}}/side difference is inside the ET and donor-track uncertainty. The tyre also reaches ~{{tyre_inner_shift}} further *inboard* than the stock tyre (inner edge {{tyre_inner_edge:raw}} vs {{a40_stock_inner_edge}}). The earlier version of this table showed ~10 mm/side; every cell carried a +25 mm error. Nothing in the {{front_narrowing}} narrowing gets the outer edge back to stock: no ET in the table brings a 205 under +60.

This is the main fitment risk. Check against the scanned body envelope:

1. Place the tyre ({{tyre_width:raw}} × {{tyre_od}}, wheel CL {{front_half_track}} from CL) in the scan at ride height. Measure sidewall-to-fender-lip and tread-to-arch clearance. Budget: 25-50 mm per side.
2. Sweep full bump with wheels straight. Watch the outer shoulder against the fender lip.
3. Sweep full lock at ride height. Watch the inner shoulder against the inner arch and frame rail (the tyre now reaches further inboard).
4. Combine full lock + full bump (see caveat below).
5. If it does not fit, in order of preference: higher ET (each extra mm of ET moves the tyre 1 mm inboard per side; check caliper clearance), narrower tyre (each 10 mm narrower brings the outer edge in 5 mm per side), small fender flare or lip roll. More narrowing would move the rack, pickups and RC and is the last resort.

---

## Scanned donor geometry: what it changes

Coordinates are in [donor geometry dimensions](./donor-geometry-dimensions). Points that drive fabrication:

| Item | Stock (from CL) | Narrowed (from CL) | Note |
|---|---|---|---|
| Hub face | {{front_hub_face_miata}} | **{{front_hub_face}}** | build reference plane |
| LCA inner pivots (both) | {{lca_pivot_miata}} | **{{lca_pivot}}** | 322.5 mm fore-aft c-to-c |
| UCA inner pivots | {{uca_pivot_miata:0}} | **{{uca_pivot:0}}** | {{uca_lca_offset}} **outboard** of the LCA pivots (normal short-long-arm layout) |

- **Arm-length ratio 1.34 : 1** (LCA 336.25 mm, UCA 250 mm, lateral). Closer to equal than the ~1.9 : 1 often assumed, so camber gain per mm of bump is modest. Static negative camber comes from alignment shims, not the camber curve.
- **UCA bushing axis is tilted and canted.** Side view: front pivot 13.56 mm higher than rear over 220 mm (≈3.5° nose-up). Plan: the axis is canted **{{uca_plan_cant}}** to the car centreline, front pivot {{uca_cant_offset}} outboard of the rear. That cant is inferred, not measured directly: the arm is symmetric about the UBJ, and the scanned UBJ sits 14.15 mm aft of the pivot pair's midpoint, so the axis has to be square to that line (atan(14.15 / 250)). **Verify** it on the donor subframe. The brackets must reproduce both rotations, not just the pivot centres.
- **Scrub and trail on the A40 package** (scanned knuckle, ET{{et_miata:raw}} → ET{{wheel_et:raw}}, hub ~{{hub_z_delta:0}} higher):

| | Miata stock ({{tyre_size_miata}}, ET{{et_miata:raw}}) | A40 ({{tyre_size}}, ET{{wheel_et:raw}}) |
|---|---|---|
| Scrub radius | {{scrub_miata}} | **≈ {{scrub}}** (near zero) |
| Mechanical trail ({{caster}} caster) | {{trail_miata}} | **≈ {{trail}}** |

Near-zero scrub means less kickback and less self-centring under braking; the extra trail adds a little on-centre feel. Derivation in the [geometry design reference](./geometry-design-reference).

### Fabrication notes

1. Build to the hub face ({{front_hub_face}} from CL), not to "track". The scanned LBJ/UBJ offsets are measured from the hub-face plane and do not change with narrowing.
2. LCA brackets: both pivots at {{lca_pivot}} from CL, 322.5 mm apart fore-aft.
3. UCA brackets: {{uca_pivot:0}} from CL to the pivot-line midpoint ({{uca_lca_offset}} outboard of the LCA pivots). With the {{uca_plan_cant}} plan cant the front pivot sits {{uca_cant_half}} outboard of that ({{uca_pivot_front}}) and the rear pivot {{uca_cant_half}} inboard ({{uca_pivot_rear}}); do not build both brackets at {{uca_pivot:raw:0}}. Check clearance to the SR20 valve cover, exhaust manifold side and inner fender before committing.
4. Fixture the UCA brackets off the actual arm with a bar through the bushing axis so the 3.5° tilt and the {{uca_plan_cant}} plan cant are captured. ±1 mm on pivot centres is necessary but not sufficient: orientation errors matter as much.

---

## Full-lock and full-bump caveat

The earlier sweep found the inner front corner of the tyre touching the inner arch by a few mm at simultaneous full lock + full bump. That sweep used the wrong tyre position (the +25 mm table error), so **redo it** against the scanned envelope with the corrected tyre position (step 4 above).

Expected handling, in order of preference:

1. **Steering stops.** Mandatory anyway (see [steering](./steering)); set them where the tyre clears with margin.
2. **Bump-stop progression** to limit usable travel at full lock.
3. **Local inner-arch trimming** at the contact point.

Decide on the jig with the real knuckle and tyre swept against the body. The {{front_narrowing}} narrowing does not change over a few mm in the worst-case corner.
