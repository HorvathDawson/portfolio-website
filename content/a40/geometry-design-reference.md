---
title: "Narrowing: Geometry Design Reference"
date: 2026-02-16
status: in-progress
epic: narrowing
kind: reference
tags: [suspension, geometry, analysis, fabrication]
---

What changes at vehicle level when the Miata suspension is narrowed into the A40, and what that means for the frame. Front: NA Miata double wishbone, every pickup moved **95 mm/side** inboard. Rear: **narrowed NA Miata IRS** at a 1340 mm track with an RX-8 diff (see [rear suspension](./rear-suspension)). Spring, bar and damper selection live in [suspension tuning](./suspension-tuning); donor dimensions in [donor geometry dimensions](./donor-geometry-dimensions); fitment in [narrowing analysis](./narrowing-analysis).

> Every number and plot here comes from [`scripts/plot_geometry_reference.py`](https://github.com/HorvathDawson/portfolio-website/blob/main/scripts/plot_geometry_reference.py). Running it prints a summary of all the values quoted below. All inputs are working values; the "verify" items are what moves them.

## Inputs

| | Miata donor | A40 build |
|---|---:|---:|
| Hub face from CL | 750 mm | 655 mm (locked) |
| Wheel / tyre | ET40, 185/60R14 (577 mm OD) | ET38, 205/65R15 (647.5 mm OD) |
| Front track | 1420 mm | 1234 mm exact, **~1230 nominal** |
| Rear track | - | 1340 mm (locked) |
| Hub centre height | 265 mm | 300.25 mm (+35.25) |
| LCA / UCA inner pivot from CL | 329.5 / 368 mm | 234.5 / 273 mm |
| Wheelbase | 2265 mm | 2350 mm |
| CG height | ~460 mm | 575 ± 50 mm |
| Sprung mass / corners | - | ~825 kg; 231 kg F, 181 kg R (55/45) |

Lock the pivot and hub-face positions, not the derived track. The donor's 1420 mm track is unverified (published 1405-1425): measure the donor hub-face width. Vehicle-level ratios below use the nominal 1230 mm.

## Results at a glance

| Item | Value | What to do |
|---|---|---|
| Track | 13.4% narrower | - |
| Spring roll stiffness, same wheel rate | ×0.750 (**−25%**) | make it up with bars, not springs |
| Lateral weight transfer, same CG | ×1.154 (**+15.4%**) | heavier brackets, inspect joints |
| Front kinematic RC | **139 mm** (Miata 142) | verify pivot heights on the donor |
| Front motion ratio | **0.68** at an 80° shock (0.69 vertical) | spring = wheel rate / 0.68² |
| Front wheel travel (127 mm stroke) | 83 mm bump / 103 mm droop | confirm after the shock is chosen |
| Springs-only roll at 0.8 g | **6.5-7.1°** | ARBs are required |
| ARB stiffness needed for 3-4° | **16-33 kN·m/rad** (≈24 for 3.5°) | front and rear bars, see tuning |
| Scrub / trail | +0.5 mm / 9.8 mm | nothing; trail rises with the taller tyre |
| Caster | 3.62° scanned | target **4-5.5°** |

## What narrowing does not change

Because the whole linkage translates inboard as a unit, the local four-bar is identical to the donor, provided every inner pivot sits exactly 95 mm inboard of its scanned position (±1 mm):

- **Camber curve vs wheel travel**, KPI (12.05°), and caster (3.62°). Camber gain per degree of *body roll* scales with track (×0.866) because a degree of roll moves the wheel less.
- **Side-view geometry**: anti-dive and anti-squat geometry are preserved; the percentages shift slightly with the longer wheelbase (2350 vs 2265). Recheck at final ride height.
- **Bump steer**, if the rack is narrowed by the same amount as the track (190 mm total) and keeps its height. Same rule at the rear: translate the toe links with everything else.

What does change: roll centre, roll stiffness, weight transfer, and (from the taller tyre) scrub and trail.

## Front roll centre

**Static RC is 139.2 mm on the build vs 142.4 mm on the stock Miata.** Two effects nearly cancel:

| Step | RC | Change |
|---|---:|---:|
| Stock Miata (1420 mm, 577 mm tyre) | 142.4 mm | - |
| A40 pickups, Miata tyre and ET40 | 123.3 mm | **−19.1 mm** (narrowing) |
| A40 build, 647.5 mm tyre, ET38 | 139.2 mm | **+15.8 mm** (tyre lifts the linkage 35 mm) |

The taller tyre is not a few-mm effect: on the custom frame the pickups move up with the hub, so the IC rises 35 mm while the contact patch stays on the ground. $h_{RC} = IC_y \cdot CP_x / (CP_x - IC_x)$: narrowing scales $CP_x$ by 0.87, the tyre scales $IC_y$ by 1.13.

| | Miata | A40 |
|---|---:|---:|
| Front-view IC | 1392 mm inboard of CP, 279 mm up | 1394 mm inboard, 314 mm up |
| Swing-arm length / half-track | 1.96 | 2.26 |
| Jacking ratio $h_{RC}/(T/2)$ | 20.1% | 22.6% (≈930 N front axle at 0.8 g) |

<figure class="wide">
  <img src="/assets/projects/a40-austin/blog/plots/rc_combined.png" alt="Front view roll centre construction, stock Miata vs A40 build" />
  <figcaption>Front-view RC construction: stock Miata (1420 mm, 185/60R14 ET40) vs the A40 build (1234 mm, 205/65R15 ET38). The IC sits past the centreline on the far side for both.</figcaption>
</figure>

**Migration.** Sweeping body heave and roll across the full wheel travel (83/103 mm), the A40 RC stays within ±68 mm laterally (Miata ±203 mm) and 41-286 mm vertically (Miata 38-321 mm). The longer swing arm relative to the half-track makes the A40 behave more like a long swing axle: steadier balance through curbs and asymmetric inputs.

<figure class="wide">
  <img src="/assets/projects/a40-austin/blog/plots/rc_migration_a40.png" alt="RC migration cloud for the A40 build across the heave and roll envelope" />
  <figcaption>A40 RC migration. Each dot is one admissible (heave, roll) body pose with both wheels inside the travel limits; markers show the extreme cases. The donor equivalent (rc_migration_miata.png) spreads three times wider laterally.</figcaption>
</figure>

**Verify:** the RC is dominated by the inner pivot heights (LCA pivot 25 mm above the LBJ, UCA pivot 23.75 mm below the UBJ, both from the scan). A 5 mm error there moves the RC about 10 mm. Check on the donor before welding.

## Roll stiffness, weight transfer and roll

Spring roll stiffness per axle: $K_\phi = K_w T^2/2$ (wheel rate $K_w$). With the suggested wheel rates (17.9 N/mm front at 1.4 Hz, 16.1 N/mm rear at 1.5 Hz):

| | Front (1230) | Rear (1340) | Total |
|---|---:|---:|---:|
| Spring roll stiffness | 13.5 | 14.4 | **28.0 kN·m/rad** |

Lateral weight transfer at 0.8 g (950 kg): Miata at CG 460 mm 2415 N, A40 at CG 575 mm **3485 N (+44%)**: +15% from track, the rest from CG height.

Steady-state roll, with the gravity term:

$$\phi = \frac{m_s a_y (h_{CG} - h_{RA})}{K_{\phi} - m_s g (h_{CG} - h_{RA})}$$

$h_{RA}$ is the roll-axis height under the CG: front RC + 45% of (rear RC − front RC). The rear RC is unknown until the narrowed Miata rear is measured, so it is carried as 80-150 mm.

| Rear RC | Roll axis at CG | Springs-only roll | ARB to add for 3° / 3.5° / 4° |
|---:|---:|---:|---:|
| 150 mm | 144 mm | 6.5° | 28.8 / 21.2 / 15.5 kN·m/rad |
| 100 mm | 122 mm | 6.9° | 31.8 / 23.8 / 17.8 |
| 80 mm | 113 mm | 7.1° | 33.0 / 24.8 / 18.7 |

CG uncertainty matters as much as the rear RC: at 525 / 625 mm, springs-only roll is 6.1° / 7.8° and the ARB need for 3.5° is 18 / 30 kN·m/rad.

<figure>
  <img src="/assets/projects/a40-austin/blog/plots/roll_vs_cg.png" alt="Body roll at 0.8 g vs CG height for springs only and added ARB stiffness" />
  <figcaption>Roll at 0.8 g vs CG height. Lines at rear RC 100 mm, bands span rear RC 80-150 mm. About 24 kN·m/rad of bar stiffness puts the estimated CG at 3.5°.</figcaption>
</figure>

**What to do:**
1. Provide ARB mounts (bushing pads, end-link clearance through full travel) on **both** axles. The rear is independent now, so a rear bar is a normal tuning part.
2. Don't fix bar diameters until the CG is measured on the rolling chassis and the rear RC is known. As a scale: at the assumed installation ratio a 25 mm front bar alone gives about 22 kN·m/rad. Bar sizing and the LLTD split (start 3-5% above the 55% front weight fraction) are in [suspension tuning](./suspension-tuning).
3. Without bars, 7° of roll puts the outside tyre into positive camber and it loses grip. ARBs are not optional.

## Rear: narrowed Miata IRS

Same rule as the front: translate every inboard pickup (arms, toe links, diff) inboard by the same amount, about 42-47 mm/side (measured stock rear hub-face half-width minus 708 mm). Side-view geometry and bump steer carry over. What is not known yet, and how to get it:

| Unknown | Used here | How to pin it down |
|---|---|---|
| Rear RC | 80-150 mm range | measure the donor rear pickups, model the narrowed rear like the front |
| Rear MR | not needed for roll (wheel rates used) | measure on the donor: shock travel vs wheel travel |
| Rear spring | 16.1 N/mm wheel rate | spring = 16.1 / MR²: 38 / 29 / 22 N/mm at MR 0.65 / 0.75 / 0.85 |

Diff, half-shafts, driveshaft and brakes are in [rear suspension](./rear-suspension).

## Front motion ratio, springs and travel

**MR = 0.68 at an 80° shock angle (0.69 vertical).** The old 0.62-0.63 treated the wheel as if it were bolted to the LCA. It isn't: the knuckle rotates about the front-view instant centre, so the wheel moves less per degree of LCA rotation than the LCA tip would. Perturbing the script's four-bar gives an effective wheel-side lever of 347.8 mm (not 380.5):

$$MR = \frac{240 \cdot \sin\alpha}{347.8}, \qquad \text{spring} = \frac{K_w}{MR^2}$$

| Shock angle α | 65° | 75° | 80° | 85° | 90° |
|---|---:|---:|---:|---:|---:|
| MR | 0.625 | 0.667 | 0.680 | 0.687 | 0.690 |

Front wheel rate 17.9 N/mm (1.4 Hz on a 231 kg corner) → **spring ≈ 39 N/mm (~220 lb/in)** at MR 0.68. Specify springs as wheel rates; the conversion is the only place MR enters. A ±15 mm wheel-offset change moves MR by about 1%.

<figure>
  <img src="/assets/projects/a40-austin/blog/plots/motion_ratio_vs_angle.png" alt="Front motion ratio vs shock angle, four-bar based, with the old LCA-pivot value for reference" />
  <figcaption>MR at ride height vs shock angle at the lower mount, from the four-bar. Dotted: the old LCA-pivot lever (wrong). Pick the shock-tower position inside the 65-85° band.</figcaption>
</figure>

**Travel.** With a 5" (127 mm) stroke and 45% of it in bump at ride height (assumed, about the stock Miata split), the wheel gets **83 mm bump / 103 mm droop**. Keeping the stock Miata wheel travel (70-75 mm bump, 85-90 mm droop) instead needs about 106-112 mm of stroke at MR 0.68. MR stays within 0.678-0.692 across the travel at 80°.

<figure>
  <img src="/assets/projects/a40-austin/blog/plots/motion_ratio.png" alt="Front motion ratio through wheel travel for three shock angles" />
  <figcaption>MR through travel for 70°, 80° and 90° shocks (330 mm eye-to-eye at ride assumed). At 80° it is nearly constant; travel limits come from the 127 mm stroke.</figcaption>
</figure>

**Travel budget.** 3.5° of roll moves the outside front wheel 38 mm. A 20 mm road input amplifies to 26-30 mm at ζ ≈ 0.3-0.4. Together that is 64-68 mm of the 83 mm bump, before the bump stop takes its share. Size the bump stops to that and make them engage at similar points front and rear, or the balance changes abruptly mid-corner.

The shock tower must fit between the rails, clear the engine and carry about 5 kN in bump. Treat it as a frame-design constraint.

## Scrub, trail, caster

From the scanned knuckle (LBJ 84.25 mm inboard of the hub face and 86 mm below hub centre; UBJ 132 mm inboard and 137.75 mm above): **KPI 12.05°, caster 3.62°.** Baseline is the Miata on ET40.

| | Miata (ET40, 577 mm) | A40 (ET38, 647.5 mm) |
|---|---:|---:|
| Scrub radius | +6.05 mm | **+0.5 mm** |
| Mechanical trail | 7.57 mm | **9.8 mm** |

$\Delta \text{scrub} = \Delta ET - \Delta h \tan(KPI) = +2 - 35.25 \times 0.213 = -5.5$ mm. $\Delta \text{trail} = \Delta h \tan(\text{caster}) = +2.2$ mm.

Near-zero scrub means little kickback and stable braking, with slightly lighter self-centring; the extra trail adds some of that back. No action needed.

**Caster:** 5-7° is not reachable from 3.62° with ±2° of adjustment. Target **4-5.5°** and build the adjustment so it centres there.

## Steering consequences

Details in [steering](./steering). From the geometry:

- **Rack:** narrowed 190 mm total (7.5"), same as the track change.
- **Ackermann:** the Miata arms point at atan(710/2265) = **17.40°**, so on the A40 they converge ahead of the rear axle: about 0.5° excess at 15° of lock, 1° at 20°.
- **Lock:** body clearance costs 12-18° of lock. From the Miata's ~29° (9.4 m turning circle) that leaves 11-17°, a **16-25 m turning circle**. Steering stops are mandatory.

## Structural loads and compliance

Control arm and bracket loads rise with the +44% lateral weight transfer (narrower track and higher CG). Use turned steel or DOM inserts in the brackets, gusset the upper arm mounts and triangulate them into the frame tubes, and inspect wheel bearing preload at shakedown.

Rubber bushings stay (street car), but the higher lateral load means more compliance steer. Stock NA ball joints are fine for street with an annual inspection; for track use, rebuildable joints (QA1, FK, Aurora, Howe).

## Fitment, fabrication and alignment

**Clearance checks** (mock up with real arms on the tacked frame):
1. Tyre to body and frame at **full lock and full bump together**. The 205s sit ~35 mm/side further out and further in than the stock A40 tyres; this is the main fitment risk ([narrowing analysis](./narrowing-analysis)).
2. Lower arm vs frame rail at full bump and full lock.
3. Coilover spring body to rail at full bump.
4. Rack housing to engine (190 mm narrower rack sits closer).
5. Steering shaft: second U-joint or different intermediate shaft; check for binding at full lock.
6. Exhaust: the lower arms occupy the stock path. Plan custom headers before final pickups.
7. Brake lines: all custom.

**Tolerances:** pickups ±1 mm, UCA inner mounts ±0.5 mm. Left-right symmetry matters more than absolute position.

**Process:**
1. Tack all mounts and bolt in arms and knuckles on the jig.
2. Measure each pickup from centreline; check left-right symmetry.
3. Check camber with a straight bar through both hub bores and a digital level.
4. Check caster from the fore-aft offset of the ball joints at a known ride height.
5. Full weld.

**Alignment provisions:**
- Camber: shims or eccentrics at the UCA inner mounts, ±2°.
- Caster: slotted UCA mounts fore-aft, centred on 4-5.5°, ±2°.
- Toe: tie-rod ends.
- Bump steer: rack mount with ±15 mm of height adjustment (8 mm minimum).

## Still to do

1. Measure the donor: front and rear hub-face widths, inner pivot heights, rear pickups.
2. Model the narrowed rear; replace the 80-150 mm rear RC range with a number.
3. Pick the shock and stroke; lock the shock-tower angle (sets MR).
4. Measure CG on the rolling chassis, then size bars ([suspension tuning](./suspension-tuning)).
5. Re-run anti-dive and anti-squat at the A40 wheelbase and ride height.
