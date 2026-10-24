---
title: "Narrowing: Geometry Design Reference"
date: 2026-02-16
status: in-progress
epic: narrowing
kind: reference
tags: [suspension, geometry, analysis, fabrication]
---

What changes at vehicle level when the Miata suspension is narrowed into the A40, and what that means for the frame. Front: NA Miata double wishbone, every pickup moved **{{front_narrowing}}/side** inboard. Rear: **narrowed NA Miata IRS** at a {{rear_track}} track with an RX-8 diff (see [rear suspension](./rear-suspension)). Spring, bar and damper selection live in [suspension tuning](./suspension-tuning); donor dimensions in [donor geometry dimensions](./donor-geometry-dimensions); fitment in [narrowing analysis](./narrowing-analysis). Vehicle numbers (mass, CG, tracks) come from [build constants](./build-constants).

> Every number and plot here comes from [`scripts/plot_geometry_reference.py`](https://github.com/HorvathDawson/portfolio-website/blob/master/scripts/plot_geometry_reference.py). Running it prints a summary of all the values quoted below. All inputs are working values; the "verify" items are what moves them.

## Inputs

| | Miata donor | A40 build |
|---|---:|---:|
| Hub face from CL | {{front_hub_face_miata}} | {{front_hub_face}} (locked) |
| Wheel / tyre | ET{{et_miata:raw}}, {{tyre_size_miata}} ({{tyre_od_miata}} OD) | ET{{wheel_et:raw}}, {{tyre_size}} ({{tyre_od}} OD) |
| Front track | {{front_track_miata}} | {{front_track}} exact, **~{{front_track_nominal:raw}} nominal** |
| Hub centre height | {{hub_z_miata}} | {{hub_z}} (+{{hub_z_delta:raw}}) |
| LCA / UCA inner pivot from CL | {{lca_pivot_miata:raw}} / {{uca_pivot_miata:0}} | {{lca_pivot:raw}} / {{uca_pivot:0}} |
| Wheelbase | {{wheelbase_miata}} | {{wheelbase}} |

Rear track, CG height and masses: see [build constants](./build-constants). Lock the pivot and hub-face positions, not the derived track. The donor's {{front_track_miata}} track is unverified (published 1405-1425): measure the donor hub-face width. Vehicle-level ratios below use the nominal {{front_track_nominal}}.

## Results at a glance

| Item | Value | What to do |
|---|---|---|
| Track | {{track_narrower_pct}} narrower | - |
| Spring roll stiffness, same wheel rate | ×{{roll_stiffness_ratio}} (**−{{roll_stiffness_drop_pct}}**) | make it up with bars, not springs |
| Lateral weight transfer, same CG | ×{{wt_ratio}} (**+{{wt_increase_track_pct}}**) | heavier brackets, inspect joints |
| Front kinematic RC | **{{rc_front:0}}** (Miata {{rc_miata:raw:0}}) | verify pivot heights on the donor |
| Front motion ratio | **{{front_mr:2}}** at an {{shock_angle}} shock ({{front_mr_vertical:2}} vertical) | spring = wheel rate / {{front_mr:2}}² |
| Front wheel travel ({{shock_stroke}} stroke) | {{travel_bump}} bump / {{travel_droop}} droop | confirm after the shock is chosen |
| Springs-only roll at {{lateral_accel}} | **{{roll_springs_rc_hi:raw}}-{{roll_springs_rc_lo}}** | ARBs are required |
| ARB stiffness needed for {{roll_target_lo:raw}}-{{roll_target_hi}} | **{{arb_add_min:raw}}–{{arb_add_max:0}}** (≈{{arb_add_rc_nom_nom:raw:0}} for {{roll_target_nom}}) | front and rear bars, see tuning |
| Scrub / trail | {{scrub}} / {{trail}} | nothing; trail rises with the taller tyre |
| Caster | {{caster}} scanned | target **{{caster_target_lo:raw}}-{{caster_target_hi}}** |

## What narrowing does not change

Because the whole linkage translates inboard as a unit, the local four-bar is identical to the donor, provided every inner pivot sits exactly {{front_narrowing}} inboard of its scanned position (±1 mm):

- **Camber curve vs wheel travel**, KPI ({{kpi}}), and caster ({{caster}}). Camber gain per degree of *body roll* scales with track (×{{camber_per_roll_ratio}}) because a degree of roll moves the wheel less.
- **Side-view geometry**: anti-dive and anti-squat geometry are preserved; the percentages shift slightly with the longer wheelbase ({{wheelbase:raw}} vs {{wheelbase_miata:raw}}). Recheck at final ride height.
- **Bump steer**, if the rack is narrowed by the same amount as the track ({{rack_narrowing}} total) and keeps its height. Same rule at the rear: translate the toe links with everything else.

What does change: roll centre, roll stiffness, weight transfer, and (from the taller tyre) scrub and trail.

## Front roll centre

**Static RC is {{rc_front}} on the build vs {{rc_miata}} on the stock Miata.** Two effects nearly cancel:

| Step | RC | Change |
|---|---:|---:|
| Stock Miata ({{front_track_miata}}, {{tyre_od_miata}} tyre) | {{rc_miata}} | - |
| A40 pickups, Miata tyre and ET{{et_miata:raw}} | {{rc_a40_miata_tyre}} | **{{rc_delta_narrowing}}** (narrowing) |
| A40 build, {{tyre_od}} tyre, ET{{wheel_et:raw}} | {{rc_front}} | **{{rc_delta_tyre}}** (tyre lifts the linkage {{hub_z_delta:0}}) |

The taller tyre is not a few-mm effect: on the custom frame the pickups move up with the hub, so the IC rises {{hub_z_delta:0}} while the contact patch stays on the ground. $h_{RC} = IC_y \cdot CP_x / (CP_x - IC_x)$: narrowing scales $CP_x$ by 0.87, the tyre scales $IC_y$ by 1.13.

| | Miata | A40 |
|---|---:|---:|
| Front-view IC | {{ic_inboard_miata}} inboard of CP, {{ic_height_miata}} up | {{ic_inboard}} inboard, {{ic_height}} up |
| Swing-arm length / half-track | {{fvsa_ratio_miata}} | {{fvsa_ratio}} |
| Jacking ratio $h_{RC}/(T/2)$ | {{jacking_pct_miata}} | {{jacking_pct}} (≈{{jacking_force_front:r10}} front axle at {{lateral_accel}}) |

<figure class="wide">
  <img src="/assets/projects/a40-austin/blog/plots/rc_combined.png" alt="Front view roll centre construction, stock Miata vs A40 build" />
  <figcaption>Front-view RC construction: stock Miata ({{front_track_miata}}, {{tyre_size_miata}} ET{{et_miata:raw}}) vs the A40 build ({{front_track}}, {{tyre_size}} ET{{wheel_et:raw}}). The IC sits past the centreline on the far side for both.</figcaption>
</figure>

**Migration.** Sweeping body heave and roll across the full wheel travel ({{travel_bump:raw}}/{{travel_droop}}), the A40 RC stays within ±68 mm laterally (Miata ±203 mm) and 41-286 mm vertically (Miata 38-321 mm). The longer swing arm relative to the half-track makes the A40 behave more like a long swing axle: steadier balance through curbs and asymmetric inputs.

<figure class="wide">
  <img src="/assets/projects/a40-austin/blog/plots/rc_migration_a40.png" alt="RC migration cloud for the A40 build across the heave and roll envelope" />
  <figcaption>A40 RC migration. Each dot is one admissible (heave, roll) body pose with both wheels inside the travel limits; markers show the extreme cases. The donor equivalent (rc_migration_miata.png) spreads three times wider laterally.</figcaption>
</figure>

**Verify:** the RC is dominated by the inner pivot heights (LCA pivot 25 mm above the LBJ, UCA pivot 23.75 mm below the UBJ, both from the scan). A 5 mm error there moves the RC about 10 mm. Check on the donor before welding.

## Roll stiffness, weight transfer and roll

Spring roll stiffness per axle: $K_\phi = K_w T^2/2$ (wheel rate $K_w$). With the suggested wheel rates ({{kw_front}} front at {{ride_freq_front}}, {{kw_rear}} rear at {{ride_freq_rear}}):

| | Front ({{front_track_nominal:raw}}) | Rear ({{rear_track:raw}}) | Total |
|---|---:|---:|---:|
| Spring roll stiffness | {{roll_stiffness_front:raw}} | {{roll_stiffness_rear:raw}} | **{{roll_stiffness_total}}** |

Lateral weight transfer at {{lateral_accel}} ({{operating_mass}}): Miata at CG {{cg_height_miata}} {{wt_miata}}, A40 at CG {{cg_height}} **{{wt_a40}} (+{{wt_increase_pct}})**: +{{wt_increase_track_pct:0}} from track, the rest from CG height.

Steady-state roll, with the gravity term:

$$\phi = \frac{m_s a_y (h_{CG} - h_{RA})}{K_{\phi} - m_s g (h_{CG} - h_{RA})}$$

$h_{RA}$ is the roll-axis height under the CG: front RC + {{rear_weight_fraction}} of (rear RC − front RC). The rear RC is unknown until the narrowed Miata rear is measured, so it is carried as {{rear_rc_lo:raw}}-{{rear_rc_hi}}.

| Rear RC | Roll axis at CG | Springs-only roll | ARB to add for {{roll_target_lo}} / {{roll_target_nom}} / {{roll_target_hi}} |
|---:|---:|---:|---:|
| {{rear_rc_hi}} | {{roll_axis_rc_hi}} | {{roll_springs_rc_hi}} | {{arb_add_rc_hi_lo:raw}} / {{arb_add_rc_hi_nom:raw}} / {{arb_add_rc_hi_hi}} |
| {{rear_rc_nom}} | {{roll_axis_rc_nom}} | {{roll_springs_rc_nom}} | {{arb_add_rc_nom_lo:raw}} / {{arb_add_rc_nom_nom:raw}} / {{arb_add_rc_nom_hi:raw}} |
| {{rear_rc_lo}} | {{roll_axis_rc_lo}} | {{roll_springs_rc_lo}} | {{arb_add_rc_lo_lo:raw}} / {{arb_add_rc_lo_nom:raw}} / {{arb_add_rc_lo_hi:raw}} |

CG uncertainty matters as much as the rear RC: at {{cg_height_low:raw}} / {{cg_height_high}}, springs-only roll is {{roll_springs_cg_low}} / {{roll_springs_cg_high}} and the ARB need for {{roll_target_nom}} is {{arb_add_cg_low:raw}} / {{arb_add_cg_high}}.

<figure>
  <img src="/assets/projects/a40-austin/blog/plots/roll_vs_cg.png" alt="Body roll at 0.8 g vs CG height for springs only and added ARB stiffness" />
  <figcaption>Roll at {{lateral_accel}} vs CG height. Lines at rear RC {{rear_rc_nom}}, bands span rear RC {{rear_rc_lo:raw}}-{{rear_rc_hi}}. About {{arb_add_rc_nom_nom:0}} of bar stiffness puts the estimated CG at {{roll_target_nom}}.</figcaption>
</figure>

**What to do:**
1. Provide ARB mounts (bushing pads, end-link clearance through full travel) on **both** axles. The rear is independent now, so a rear bar is a normal tuning part.
2. Don't fix bar diameters until the CG is measured on the rolling chassis and the rear RC is known. As a scale: at the assumed installation ratio a 25 mm front bar alone gives about {{bar_k_25:0}}. Bar sizing and the LLTD split (start {{lltd_offset_lo:raw}}-{{lltd_offset_hi}} above the {{front_weight_fraction}} front weight fraction) are in [suspension tuning](./suspension-tuning).
3. Without bars, {{roll_springs_rc_nom:0}} of roll puts the outside tyre into positive camber and it loses grip. ARBs are not optional.

## Rear: narrowed Miata IRS

Same rule as the front: translate every inboard pickup (arms, toe links, diff) inboard by the same amount, about {{rear_narrowing_lo:raw}}-{{rear_narrowing_hi}}/side (measured stock rear hub-face half-width minus {{rear_hub_face}}). Side-view geometry and bump steer carry over. What is not known yet, and how to get it:

| Unknown | Used here | How to pin it down |
|---|---|---|
| Rear RC | {{rear_rc_lo:raw}}-{{rear_rc_hi}} range | measure the donor rear pickups, model the narrowed rear like the front |
| Rear MR | not needed for roll (wheel rates used) | measure on the donor: shock travel vs wheel travel |
| Rear spring | {{kw_rear}} wheel rate | spring = {{kw_rear:raw}} / MR²: {{spring_rear_lo:raw:0}} / {{spring_rear_mid:raw:0}} / {{spring_rear_hi:0}} at MR {{rear_mr_lo}} / {{rear_mr_mid}} / {{rear_mr_hi}} |

Diff, half-shafts, driveshaft and brakes are in [rear suspension](./rear-suspension).

## Front motion ratio, springs and travel

**MR = {{front_mr:2}} at an {{shock_angle}} shock angle ({{front_mr_vertical:2}} vertical).** The old 0.62-0.63 treated the wheel as if it were bolted to the LCA. It isn't: the knuckle rotates about the front-view instant centre, so the wheel moves less per degree of LCA rotation than the LCA tip would. Perturbing the script's four-bar gives an effective wheel-side lever of {{mr_lever}} (not {{mr_lever_old:raw}}):

$$MR = \frac{{{lca_coilover_lever:raw}} \cdot \sin\alpha}{{{mr_lever:raw}}}, \qquad \text{spring} = \frac{K_w}{MR^2}$$

| Shock angle α | 65° | 75° | 80° | 85° | 90° |
|---|---:|---:|---:|---:|---:|
| MR | {{front_mr_65}} | {{front_mr_75}} | {{front_mr}} | {{front_mr_85}} | {{front_mr_vertical}} |

Front wheel rate {{kw_front}} ({{ride_freq_front}} on a {{corner_mass_front}} corner) → **spring ≈ {{spring_front:0}} (~{{spring_front_lbin:r10}})** at MR {{front_mr:2}}. Specify springs as wheel rates; the conversion is the only place MR enters. A ±15 mm wheel-offset change moves MR by about 1%.

<figure>
  <img src="/assets/projects/a40-austin/blog/plots/motion_ratio_vs_angle.png" alt="Front motion ratio vs shock angle, four-bar based, with the old LCA-pivot value for reference" />
  <figcaption>MR at ride height vs shock angle at the lower mount, from the four-bar. Dotted: the old LCA-pivot lever (wrong). Pick the shock-tower position inside the 65-85° band.</figcaption>
</figure>

**Travel.** With a 5" ({{shock_stroke}}) stroke and {{shock_bump_fraction}} of it in bump at ride height (assumed, about the stock Miata split), the wheel gets **{{travel_bump}} bump / {{travel_droop}} droop**. Keeping the stock Miata wheel travel (70-75 mm bump, 85-90 mm droop) instead needs about {{stroke_for_stock_travel_lo:raw}}-{{stroke_for_stock_travel_hi}} of stroke at MR {{front_mr:2}}. MR stays within {{front_mr_travel_lo}}-{{front_mr_travel_hi}} across the travel at {{shock_angle}}.

<figure>
  <img src="/assets/projects/a40-austin/blog/plots/motion_ratio.png" alt="Front motion ratio through wheel travel for three shock angles" />
  <figcaption>MR through travel for 70°, 80° and 90° shocks ({{shock_length_ride}} eye-to-eye at ride assumed). At 80° it is nearly constant; travel limits come from the {{shock_stroke}} stroke.</figcaption>
</figure>

**Travel budget.** {{roll_target_nom}} of roll moves the outside front wheel {{roll_travel_wheel}}. A 20 mm road input amplifies to 26-30 mm at ζ ≈ {{damping_ride_lo}}-{{damping_ride_hi}}. Together that is 64-68 mm of the {{travel_bump}} bump, before the bump stop takes its share. Size the bump stops to that and make them engage at similar points front and rear, or the balance changes abruptly mid-corner.

The shock tower must fit between the rails, clear the engine and carry about 5 kN in bump. Treat it as a frame-design constraint.

## Scrub, trail, caster

From the scanned knuckle (LBJ 84.25 mm inboard of the hub face and 86 mm below hub centre; UBJ 132 mm inboard and 137.75 mm above): **KPI {{kpi}}, caster {{caster}}.** Baseline is the Miata on ET{{et_miata:raw}}.

| | Miata (ET{{et_miata:raw}}, {{tyre_od_miata}}) | A40 (ET{{wheel_et:raw}}, {{tyre_od}}) |
|---|---:|---:|
| Scrub radius | {{scrub_miata}} | **{{scrub}}** |
| Mechanical trail | {{trail_miata}} | **{{trail}}** |

$\Delta \text{scrub} = \Delta ET - \Delta h \tan(KPI) = +2 - {{hub_z_delta:raw}} \times {{kpi_tan}} = {{scrub_delta:raw}}$ mm. $\Delta \text{trail} = \Delta h \tan(\text{caster}) = {{trail_delta:raw}}$ mm.

Near-zero scrub means little kickback and stable braking, with slightly lighter self-centring; the extra trail adds some of that back. No action needed.

**Caster:** 5-7° is not reachable from {{caster}} with ±2° of adjustment. Target **{{caster_target_lo:raw}}-{{caster_target_hi}}** and build the adjustment so it centres there.

## Steering consequences

Details in [steering](./steering). From the geometry:

- **Rack:** narrowed {{rack_narrowing}} total ({{rack_narrowing_in}}), same as the track change.
- **Ackermann:** the Miata arms point at atan({{half_track_miata:raw}}/{{wheelbase_miata:raw}}) = **{{ackermann_knuckle}}**, so on the A40 they converge ahead of the rear axle: about {{ackermann_excess_15:1}} excess at 15° of lock, {{ackermann_excess_20:0}} at 20°.
- **Lock:** body clearance costs {{lock_loss_lo:raw}}-{{lock_loss_hi}} of lock. From the Miata's ~{{lock_miata}} ({{turning_circle_miata}} turning circle) that leaves {{lock_left_hi:raw}}-{{lock_left_lo}}, a **{{turning_circle_lo:raw:0}}-{{turning_circle_hi:0}} turning circle**. Steering stops are mandatory.

## Structural loads and compliance

Control arm and bracket loads rise with the +{{wt_increase_pct}} lateral weight transfer (narrower track and higher CG). Use turned steel or DOM inserts in the brackets, gusset the upper arm mounts and triangulate them into the frame tubes, and inspect wheel bearing preload at shakedown.

Rubber bushings stay (street car), but the higher lateral load means more compliance steer. Stock NA ball joints are fine for street with an annual inspection; for track use, rebuildable joints (QA1, FK, Aurora, Howe).

## Fitment, fabrication and alignment

**Clearance checks** (mock up with real arms on the tacked frame):
1. Tyre to body and frame at **full lock and full bump together**. The {{tyre_width:raw}}s sit ~{{tyre_poke}}/side further out and further in than the stock A40 tyres; this is the main fitment risk ([narrowing analysis](./narrowing-analysis)).
2. Lower arm vs frame rail at full bump and full lock.
3. Coilover spring body to rail at full bump.
4. Rack housing to engine ({{rack_narrowing}} narrower rack sits closer).
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
- Caster: slotted UCA mounts fore-aft, centred on {{caster_target_lo:raw}}-{{caster_target_hi}}, ±2°.
- Toe: tie-rod ends.
- Bump steer: rack mount with ±15 mm of height adjustment (8 mm minimum).

## Still to do

1. Measure the donor: front and rear hub-face widths, inner pivot heights, rear pickups.
2. Model the narrowed rear; replace the {{rear_rc_lo:raw}}-{{rear_rc_hi}} rear RC range with a number.
3. Pick the shock and stroke; lock the shock-tower angle (sets MR).
4. Measure CG on the rolling chassis, then size bars ([suspension tuning](./suspension-tuning)).
5. Re-run anti-dive and anti-squat at the A40 wheelbase and ride height.
