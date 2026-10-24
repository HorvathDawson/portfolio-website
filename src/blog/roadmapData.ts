/* ============================================================
   A40 Build — Roadmap data
   ------------------------------------------------------------
   Pure DAG of build tasks with hard/soft dependencies. The
   shape is layout-agnostic: the current swim-lane view is one
   way to render it; an auto-DAG view (e.g. dagre) can consume
   the same `tasks` + `edges` later with no data migration.

   Conventions:
   - `id`        stable kebab-case key, prefixed `t-`
   - `epic`      must match an epic id in the roadmap car's car.json
   - `posts`     blog post slugs (post slug = filename minus
                 leading `\d+-` prefix). 0..N per task.
   - `order`     optional manual depth override (otherwise
                 depth is computed from the dependency graph).

   Glossary (acronyms & shorthand used in titles / notes):
     A40            1950 Austin A40 Devon — the donor body (separate chassis)
     SR20DET        Nissan 2.0 L turbo I4 — the swap engine
     CD009          Nissan 350Z 6-speed manual transmission
     Z32            Nissan 300ZX TT 5-speed manual transmission
     S13/S14/S15    Nissan Silvia chassis generations
     NA / Mk1 NA    First-gen Mazda Miata (NA6/NA8)
     IRS            Independent rear suspension (narrowed NA Miata rear)
     RX-8 diff      Mazda RX-8 rear differential (chassis-mounted)
     EPAS           Electric Power-Assist Steering
     DBW            Drive-by-wire (electronic throttle; planned
                    conversion — the SR20DET is cable throttle stock)
     ECU            Engine Control Unit
     CAN            Controller-Area-Network bus
     LSD            Limited-slip differential
     ARB            Anti-roll bar (sway bar)
     RC             Roll Centre
     IC             Instant Centre (suspension)
                    NB: in cooling context "IC" = intercooler
     FMIC           Front-Mount Intercooler
     MR             Motion Ratio (spring/damper to wheel)
     H-point        Driver hip joint reference point
     bump-steer     Toe change with suspension travel
     pinion angle   Diff pinion shaft angle vs driveshaft
     half-shaft     Drive axle from diff output flange to rear hub
     coilover       Combined coil spring + damper unit
     narrowing      Moving every inboard pickup inboard by the same
                    amount to reduce track (front 95 mm/side,
                    rear ~42–47 mm/side)
     tubbing        Enlarging wheel-wells for wider tyres
     T3 / T4        Garrett turbo flange sizes
     AHP            Accelerator Heel Point (driver-packaging datum)
     anti-dive /    Side-view geometry percentages (no acronym;
     anti-squat     unchanged by lateral narrowing)
   ============================================================ */

import { postSlugs, roadmapCar, type Epic } from './cars';
import type { Status } from './frontmatter';
import { k, raw } from './a40Constants';

const epics = roadmapCar.epics;

export type TaskId = string;

/** Distinguishes hands-on work from things that need to be ordered or decided. */
export type TaskKind = 'task' | 'purchase' | 'decision';

export interface RoadmapTask {
  id: TaskId;
  title: string;
  summary?: string;
  status: Status;
  epic: Epic['id'];
  /** Defaults to 'task'. Use 'purchase' for items to buy. */
  kind?: TaskKind;
  /** Blog post slugs (any number, may be empty for future work). */
  posts?: string[];
  /** Manual horizontal-position hint within a lane. */
  order?: number;
  /** Bullet-list of sub-items / what's involved. */
  notes?: string[];
  /** For decision tasks: the chosen outcome (shown when status is 'decided' or 'complete'). */
  decision?: string;
  /** When set, this task can be figured out during the build — doesn't need
   *  to block other work. Value is the rationale shown in the tooltip. */
  deferrable?: string;
}

export interface RoadmapEdge {
  from: TaskId;
  to: TaskId;
  /** `hard` = must complete first. `soft` = needed eventually but
   *  the dependent task can make meaningful progress without it. */
  kind: 'hard' | 'soft';
  /** Optional tooltip text, e.g. "needed for finalization". */
  label?: string;
}

export interface Roadmap {
  tasks: RoadmapTask[];
  edges: RoadmapEdge[];
}

/* ── Seed roadmap ─────────────────────────────────── */

export const roadmap: Roadmap = {
  tasks: [
    /* ─────────── Epic: project ─────────── */
    {
      id: 't-overview',
      title: 'Project Overview',
      epic: 'project',
      status: 'in-progress',
      posts: ['overview'],
      summary: 'High-level vision, goals, and constraints for the build.',
    },
    {
      id: 't-teardown',
      title: 'Teardown',
      epic: 'project',
      status: 'complete',
      posts: ['teardown'],
      summary: 'Strip body, document chassis, capture as-built measurements.',
      notes: ['Body off frame', 'Catalog hardware', 'Reference photos'],
    },

    /* ─────────── Epic: research ─────────── */
    {
      id: 't-susp-research',
      title: 'Suspension Research',
      epic: 'research',
      status: 'complete',
      posts: ['suspension-options'],
      summary: 'Survey of front and rear suspension architectures; donor selection (Miata NA front). The rear plan was revised in Oct 2026 — see t-decide-rear-suspension.',
    },
    {
      id: 't-steering-research',
      title: 'Decide: Steering Donors (Rack + EPAS Column)',
      epic: 'research',
      kind: 'decision',
      status: 'decided',
      decision: `Rack: Miata NA (manual or depowered, ${k('rack_narrowing')} narrowed). Assist is now an open choice (see t-decide-steering-assist): manual steering, or a Toyota Prius Gen 4 (2016–2022) column-mount EPAS, driven by the dash Pi acting as a dual-bus CAN gateway (Haltech → Toyota frames) for speed-sensitive assist. The column has a hard-wired IG wake; what it does without frames (fixed assist, reduced assist or a DTC latched until key cycle) is to be bench-tested.`,
      posts: ['steering', 'epas-can-gateway'],
      summary: 'Lock the rack donor and the EPAS column donor (if assist is used). Output: parts list, dual-bus gateway architecture, and a bench-tested loss-of-frames plan.',
      notes: [
        `Rack: Miata NA, depowered (Flyin' Miata method), narrowed by ${k('rack_narrowing')} total (${k('front_narrowing')} per side) to match the front-track delta`,
        'Column: Toyota Prius Gen 4 (2016–2022). openpilot supports all of these, and opendbc decodes their powertrain CAN in one DBC (toyota_nodsu_pt_generated), so the speed (0xB4) and rpm (0x1C4) frames, scaling and checksum are known. Which frames the column needs: confirm with a donor log and on the bench',
        'Control strategy: dash Pi rebroadcasts Haltech RPM + speed as Toyota 0x1C4 + 0xB4 frames — see t-decide-epas-control',
        'Loss of frames: column behaviour unknown (fixed assist / reduced / no assist / latched DTC) — bench-test; gateway policy on stale Haltech data is hold last speed then ramp toward low assist, never toward 0',
        'Reject: hydraulic, electro-hydraulic pump, $1500+ kits',
        'Collapsible column is non-negotiable',
      ],
    },
    {
      id: 't-motor-research',
      title: 'Motor Selection',
      epic: 'research',
      status: 'complete',
      posts: ['motor-selection'],
      summary: 'Powertrain choice — SR20DET — mounting and clearance constraints.',
    },
    {
      id: 't-decide-trans',
      title: 'Decide: Transmission',
      epic: 'research',
      kind: 'decision',
      status: 'decided',
      decision: 'Either CD009 (350Z/G35 6-spd) or Z32 (300ZX TT 5-spd) — final pick comes down to whichever clean unit shows up first at the right price. Both sidestep the weak SR20 3rd gear and both fit the existing tunnel. The OEM SR20 5-spd is rejected.',
      deferrable: 'Final CD009-vs-Z32 pick is a purchase-availability call. Tunnel + crossmember accept either, so the choice doesn’t gate frame welding.',
      summary: 'Picking between two finalists: CD009 (350Z/G35 6-spd) or Z32 (300ZX TT 5-spd). Both are similar overall size, both have a forward shifter-access plate that moves the lever ~6–10″ ahead of stock, and both sidestep the well-known weak 3rd gear of the SR20 OEM 5-spd. The trans tunnel is already sized for the larger of the two and the crossmember is bolt-in, so the choice does not gate frame welding — only the shifter location, floor pan cutout, and adapter spec.',
      notes: [
        'Why not the SR20 OEM 5-spd: its 3rd gear is famously weak behind any meaningful boost — the whole reason for going to a stronger box.',
        'Finalists (similar physical size, both with forward shifter access):',
        '  • CD009 (350Z/G35 6-spd) — 6 gears, strongest of the realistic options. Requires SR20 → CD009 adapter (Driftworks Superfly S15 flywheel plan).',
        '  • Z32 (300ZX TT) 5-spd — 5 gears, ~330 lb-ft rating. Needs an SR-to-Z32 adapter plate. Cheaper than CD009.',
        'Decision driver: cost + availability of a clean unit vs. value of the 6th gear. Both fit the existing tunnel.',
        'Shifter: in the design-overview CAD the native CD009 lever lands behind the driver\'s hip, so plan on a remote shifter; confirm at trans mock-up (t-decide-shifter)',
        'Parked options: RB25 5-spd (similar size, but adapter ecosystem is weaker than the two finalists), S15 6-spd OEM (rare/expensive in NA), R154 (no good forward shifter option), T56 Magnum (overkill).',
        'Tunnel is sized for CD009; Z32 fits with extra clearance — no rework either way',
        'Trans crossmember is bolt-in / removable: not a frame-weld dependency',
        'Open downstream impacts of the choice: shifter location (t-decide-shifter), floor pan cutout, clutch hydraulics (t-buy-clutch-hyd), driveshaft length (t-buy-driveshaft), final-drive ratio target (t-decide-final-drive)',
      ],
    },
    {
      id: 't-decide-rear-suspension',
      title: 'Decide: Rear Suspension + Diff',
      epic: 'research',
      status: 'decided',
      kind: 'decision',
      posts: ['rear-suspension'],
      summary: 'Rear suspension architecture and diff. Revised Oct 2026: the Ford 9″ / Welder Series four-link live axle is dropped for a narrowed Mazda NA Miata IRS with a Mazda RX-8 diff and custom half-shafts.',
      decision: `Narrowed Mazda NA Miata IRS (double wishbone, Miata rear geometry kept: every inboard pickup — toe links included — translated inboard by the same amount, like the front) + Mazda RX-8 rear diff on custom mounts + custom-length half-shafts. Rear track stays ${k('rear_track')}.`,
      notes: [
        `Narrowing per side = measured stock rear hub-face half-width − ${k('rear_hub_face')} (${raw('rear_hub_face')} = ${raw('rear_half_track')} half-track + ${raw('wheel_et')} ET): ≈${k('rear_narrowing_lo')} if the donor ${k('rear_track_miata')} rear track is at ET${raw('rear_et_miata_lo')}, ≈${k('rear_narrowing_hi')} at ET${raw('rear_et_miata_hi')} — measure the donor (t-measure-donor-rear)`,
        'Diff: RX-8 unit — stronger than the NA Miata diff, which is not suited to a 300+ whp SR20DET. Not a bolt-in to the NA subframe: needs custom diff mounts',
        'Diff is chassis-mounted (sprung): driveshaft and pinion angles no longer change with suspension travel',
        'Half-shafts: custom length, RX-8 output flanges to Miata rear hubs',
        'Rear brakes: Miata rear calipers/rotors on the Miata uprights — no custom caliper brackets; NA rear caliper has an integrated cable parking brake',
        'Open (CAD): rear pickups built into the frame like the front, or a cut-and-narrowed Miata rear subframe bolted to it',
        'Rear ARB is now a normal tuning part (independent at both ends)',
        'Ford 9″ housing on hand is surplus',
      ],
    },
    {
      id: 't-scan-rear',
      title: '3D Scan: Rear',
      epic: 'research',
      status: 'complete',
      summary: 'Rear bodywork scanned to validate clearances and rear track width budget.',
    },
    {
      id: 't-scan-front',
      title: '3D Scan: Front',
      epic: 'research',
      status: 'complete',
      summary: 'Front bodywork scanned. Outputs: verified fender clearances for the front-track decision and grille-opening dims for the cooling stack.',
    },
    {
      id: 't-miata-measurements',
      title: 'Donor Miata Measurements (Online + Reference)',
      epic: 'research',
      status: 'complete',
      summary: 'Initial LCA/UCA inner pivots, BJ centers, rack mounts, and hub face dimensions pulled from forum-published Miata reference drawings and photo-CAD. Superseded by the donor subframe scan (t-scan-donor-miata) after the forum CAD produced an 11.5° caster — UCA pickups and LCA inner-pivot width were wrong in the forum data. LCA arm geometry (fa span, BJ offset, z rise) was correct and is retained.',
      notes: [
        'Source: aggregated online references for NA Miata front geometry',
        'Outputs: pivot coords, BJ centers, rack mounts, hub face (initial pass)',
        'Superseded by donor scan: UCA pickups + LCA width corrected; LCA arm geometry retained',
      ],
    },
    {
      id: 't-scan-donor-miata',
      title: '3D Scan: Donor Miata Front Subframe',
      epic: 'research',
      status: 'complete',
      summary: 'Einstar 2 scan of the donor front subframe in the shop. The forum-published pickup-point CAD we had been driving SA V2 on yielded an absurd 11.5° static caster — clearly wrong, triggered the scan as a sanity check. Scan invalidated the forum CAD: UCA inner-pivot positions were off, and the LCA inner-pivot width (lca_from_cl) was wrong. LCA arm geometry (fa span, BJ offset) is unchanged. Downstream: SUSP constants in scripts/plot_geometry_reference.py are updated with the scanned numbers (lca_from_cl 329.5 mm, scanned UCA pickups).',
      notes: [
        'Trigger: forum-CAD pickup points produced 11.5° static caster — implausible for a street-car Miata (~5° expected)',
        'Tool: Einstar 2',
        'Findings: UCA pickups wrong, LCA inner-pivot width wrong',
        'Unchanged: LCA arm geometry (lca_fa_span, lca_bj_fa, lca_z_rise)',
        'Done: SUSP constants updated in scripts/plot_geometry_reference.py',
        'Narrowed front pivots: LCA 234.5 mm, UCA 273 mm from CL (UCA inner pivot 38.5 mm outboard of the LCA pivot)',
      ],
    },
    {
      id: 't-measure-donor-rear',
      title: 'Measure Donor Miata Rear',
      epic: 'narrowing',
      status: 'planning',
      summary: 'Measure (or scan) the donor NA rear before the rear pickups are drawn: stock rear hub-face half-width (sets the narrowing amount), every inboard pickup incl. toe links, and the rear motion ratio.',
      notes: [
        `Narrowing per side = stock hub-face half-width − ${k('rear_hub_face')}`,
        'Rear MR: spring/shock travel vs wheel travel on the donor (currently TBD)',
        'Rear RC: model the narrowed geometry; assume ~80–150 mm until then',
        'Also confirm the donor baseline rear track (1420 mm assumed) and its wheel offset',
      ],
    },

    /* ─────────── Epic: narrowing (geometry, tires, shocks) ─────────── */
    {
      id: 't-decide-tire-front',
      title: 'Decide: Front Tire Size',
      epic: 'narrowing',
      kind: 'decision',
      status: 'decided',
      decision: '205/65 R15. Final widening of the front track may revisit at scan-time, but the tire size itself is locked.',
      summary: '205/65 R15 locked. Final track-width widening (if any) is a separate decision (t-decide-track-front).',
    },
    {
      id: 't-decide-tire-rear',
      title: 'Decide: Rear Tire Size',
      epic: 'narrowing',
      kind: 'decision',
      status: 'decided',
      decision: '205/65 R15. Tubbing call may add fitment headroom, but tire size itself is locked.',
      summary: '205/65 R15 locked. Tubbing/fender choice (t-decide-tubbing) only affects fitment headroom, not tire size.',
    },
    {
      id: 't-decide-track-front',
      title: 'Decide: Front Track Width',
      epic: 'narrowing',
      kind: 'decision',
      status: 'decided',
      decision: `Front track locked at ${k('front_track_nominal')} (${k('front_narrowing')} narrowing per side, off a scanned ${k('front_track_miata')} donor track). Within 2 mm of stock A40 front track and the chosen ${k('tyre_size')} ET+${raw('wheel_et')} wheel/tire fits inside the scanned fender envelope.`,
      summary: `${k('front_track_nominal')} locked — drives the front pickup-point coordinates and the Miata rack narrowing. One open caveat: slight tire-to-body interference at simultaneous full steering lock + full bump; tracked as a mock-up check, not a track-width change.`,
      posts: ['narrowing-analysis'],
      notes: [
        `${k('front_track_nominal')} front track locked for downstream design`,
        'Validated against scanned fender geometry (t-scan-front)',
        'Caveat: minor interference at full lock + full compression — to be confirmed at mock-up and likely absorbed by a steering-lock stop rather than re-narrowing the track',
      ],
    },
    {
      id: 't-decide-track-rear',
      title: 'Decide: Rear Track Width',
      epic: 'narrowing',
      kind: 'decision',
      status: 'decided',
      decision: `Rear track ${k('rear_track')} (tyre CL to tyre CL) on the on-hand ET${raw('wheel_et')} 15″ wheels and ${k('tyre_size')} tyres. With the narrowed Miata IRS this puts each rear hub face ${k('rear_hub_face')} from the car centreline (${raw('rear_half_track')} half-track + ${raw('wheel_et')} ET).`,
      summary: `Rear track locked at ${k('rear_track')} from the rear scan + ET${raw('wheel_et')} wheels. Sets the rear hub-face position and therefore the IRS narrowing amount and half-shaft length.`,
      posts: ['rear-suspension'],
      notes: [
        `Rear track (tyre CL–CL): ${k('rear_track')} (locked)`,
        `Hub face: ${k('rear_hub_face')} from CL`,
        `Narrowing per side = measured stock rear hub-face half-width − ${k('rear_hub_face')} (≈${k('rear_narrowing_lo')} at ET${raw('rear_et_miata_lo')}, ≈${k('rear_narrowing_hi')} at ET${raw('rear_et_miata_hi')} donor baseline) — see t-measure-donor-rear`,
        `Wheel offset: ET${raw('wheel_et')} (already purchased — see t-buy-wheels)`,
        'Confirmed against rear-scan body width with the widened rear fenders',
      ],
    },
    {
      id: 't-narrowing-analysis',
      title: 'Narrowing & Geometry Analysis',
      epic: 'narrowing',
      status: 'in-progress',
      posts: ['narrowing-analysis', 'geometry-design-reference'],
      summary: `Front: track, tyre, ${k('front_narrowing')}/side narrowing and ${k('rack_narrowing')} rack cut locked. Still open: verify the donor baseline track (1405 published vs ${raw('front_track_miata')} used) by measuring hub-face width, and set the rear narrowing amount from t-measure-donor-rear. Suspension-geometry validation (RC, camber, Ackermann, MR sweeps) lives in t-sa-v2.`,
    },
    {
      id: 't-sa-v2',
      title: 'SA V2 Output Pack: RC, Camber, Ackermann, MR + Tuning Targets',
      epic: 'narrowing',
      status: 'in-progress',
      posts: ['geometry-design-reference', 'suspension-tuning'],
      summary: 'Run SA V2 with donor-verified pickup coords. Done = numbers in hand for: front RC height + migration cloud, camber curve, anti-dive/squat, Ackermann error vs lock, motion ratio, ARB stiffness split, plus the on-paper tuning targets (ride frequency, wheel rate, damper-stroke envelope) that feed coilover + ARB purchasing. Covers the narrowed Miata rear too. NOT track tuning — corner weights / damper clicks / ride height live post-build under t-alignment.',
      notes: [
        'Tool runs but inputs are mix of real + placeholder estimates',
        'Main blocker: time',
        'Inputs: scanned donor pickup points from t-scan-donor-miata (forum-CAD numbers superseded — UCA pickups + LCA width were wrong)',
        'CG strategy: CAD-aggregate from per-component mass + CoG (body, SR20, trans, etc.) — accept higher error band',
        'Done = each row of the SA V2 expected-outputs table in the geometry design reference has a number',
        'Tuning-targets sub-output (was t-susp-tuning): ride frequency front/rear, motion ratio, wheel rate, damper stroke envelope, anti-dive, anti-squat — these are what coilover + ARB orders quote against',
        'Blocks frame finalization, coilover spec, and ARB sizing',
        'Done: SUSP constants in scripts/plot_geometry_reference.py carry the scanned UCA pickups + lca_from_cl',
        `Front MR ≈ ${k('front_mr', '2')} (wheel moves about the front-view instant centre; the old 0.621/0.63 treated the contact patch as fixed to the LCA) — verify by perturbing the script four-bar`,
        'Rear: model the narrowed Miata rear for RC (assume 80–150 mm until then); rear MR from t-measure-donor-rear',
        `Spring targets as wheel rates: front ${k('kw_front')} (${k('ride_freq_front')}), rear ${k('kw_rear')} (${k('ride_freq_rear')}); spring = wheel rate ÷ MR²`,
      ],
    },
    {
      id: 't-decide-shocks-front',
      title: 'Decide: Front Coilover Build (Length, Stroke, Valving)',
      epic: 'narrowing',
      kind: 'decision',
      status: 'planning',
      summary: 'Pick approach: Bilstein/QA1 inserts in Miata-geometry sleeves vs. full-custom build vs. Miata kit + custom rears. Output: vendor + part numbers + ordered length and stroke.',
      notes: [
        'Frame CAD currently uses placeholder shock dims — must reconcile before frame finalization',
        'Working idea: Bilstein Miata-fit coilover front (~5" stroke target)',
        `Stroke = wheel travel × MR: ~${raw('stroke_for_stock_travel_lo')}–${k('stroke_for_stock_travel_hi')} total at MR ≈ ${k('front_mr', '2')} (${raw('miata_wheel_travel_lo')}–${k('miata_wheel_travel_hi')} wheel travel)`,
        `Spring ≈ ${k('spring_front', '0')} (~${k('spring_front_lbin', 'r10')}) for ${k('kw_front')} wheel rate at MR ${k('front_mr', '2')}`,
        'Constraint: front clearance with UCA horseshoe',
        'Front + rear dynamics should match (ideally double-eyelet ends both ends)',
        'Vendors: Bilstein / Ridetech / Fox — monotube preferred, steel body OK',
        'Single-adjustable (rebound)',
        'Budget: ~$700 CAD per corner max',
      ],
    },
    {
      id: 't-decide-shocks-rear',
      title: 'Decide: Rear Coilover Build (Length, Stroke, Valving)',
      epic: 'narrowing',
      kind: 'decision',
      status: 'planning',
      summary: 'Pick rear shocks. Output: vendor + part numbers, ordered length + stroke, mount-end specs.',
      notes: [
        'Rear is the narrowed Miata IRS: coilover from the Miata rear corner (stock lower mount) to a frame-side tower (Miata-fit coilover is a candidate)',
        `Rear MR: TBD — measure on the donor (t-measure-donor-rear); spring = ${k('kw_rear')} wheel rate ÷ MR²`,
        'Critical damping at the wheel ≈ 3.4 kN·s/m rear (4.1 front); ride ζ 0.3–0.4, roll ζ 0.4–0.5 — adjustable dampers',
        'Unsprung ~33 kg per rear corner (diff, subframe and inner half-shaft are sprung)',
        'Match front damping character so F/R dynamics align',
        'Vendors: Bilstein / Ridetech / Fox — monotube preferred',
        'Single-adjustable (rebound)',
        'Budget: ~$700 CAD per corner max',
      ],
    },

    /* ─────────── Epic: design (CAD, decisions, subsystem layout) ─────────── */
    {
      id: 't-design-overview',
      title: 'Basic CAD Mockup',
      epic: 'design',
      status: 'in-progress',
      posts: ['design-overview'],
      summary: 'Rough CAD assembly tying body (scanned), frame, drivetrain, and suspension together. Re-opened Oct 2026 to swap the Ford 9″ / four-link for the narrowed Miata IRS + RX-8 diff (pickups, diff mounts, half-shaft clearance).',
    },
    {
      id: 't-decide-tubbing',
      title: 'Decide: Tub vs Widen Fenders',
      epic: 'design',
      kind: 'decision',
      status: 'decided',
      decision: 'Widen the rear fenders. Plan: shrink the metal along the bend on the inside of the fender lip to pull the existing flare/fender outward. No cut-and-add panel — the original sheetmetal stays continuous. Preserves rear-seat width (stock ~40″ at the wheelhouse pinch) and avoids the cabin/floor surgery a tub would require.',
      summary: 'Decided on widening via shrink-and-pull rather than tubbing. Method keeps the original outer panel intact and reshapes the existing flare outward — no welded-in widening strip, no inner-wheelhouse rework, full stock interior width preserved.',
      notes: [
        'Method: shrink the inner bend of the fender lip (shrinker / hammer-and-dolly / heat-shrink) to pull the existing flare outward without cutting in new metal.',
        'Arch opening is allowed to migrate upward as the fender radius pulls outward instead of downward — i.e. the lip ends up higher and wider, not lower and wider. Removes the need to stretch the outer crown to compensate, which is what would otherwise be required for a > ~¾″ pull. Side benefit: a touch more tire-to-arch clearance at full bump.',
        'No interior loss — rear hip width stays at stock ~20″/person (vs ~17.5″ if tubbed).',
        'Outer body skin reshapes rather than gets seamed — single continuous panel = no blend line to hide, paint is the only finishing concern.',
        'Mock the target flare profile in tape/foam before committing the metalwork; small adjustments are easy in foam, hard in steel. Tape the new arch line at the higher position too so the visual proportion is checked, not just the width gain.',
        'Tubbing rejected: 5″ total intrusion would drop the 2-person rear seat from snug-but-OK to shoulders-touching.',
        'Bolt-on flares rejected: read as "modified" on a 1950 saloon.',
        'Drives: rear track + tire spec (now bounded by how far the flare can be pulled before the metal cracks or looks wrong, not by inner wheelhouse).',
      ],
    },
    {
      id: 't-decide-engine-placement',
      title: 'Engine Placement CAD',
      epic: 'design',
      kind: 'task',
      status: 'complete',
      summary: 'Engine position locked in CAD with mount geometry. Engine itself does not move regardless of trans choice — only the trans tunnel and crossmember location move with t-decide-trans.',
      notes: [
        'Engine in shop; CAD-mocked but not yet physically test-fit (frame not built)',
        'Engine sits as low as possible with radiator clearance and pedal-box room',
        'Engine/trans sit 3° down at the rear (tail-down); RX-8 pinion set parallel',
        'Trans mount NOT finalized — moves with t-decide-trans',
        'If CD009 wins: bigger tunnel + crossmember mount nodes shift back',
      ],
    },
    {
      id: 't-exhaust-routing',
      title: 'Exhaust / Downpipe Routing',
      epic: 'design',
      status: 'complete',
      posts: ['design-overview'],
      summary: '3D path locked for 3″ downpipe → mid → single rear exit. Forward top-mount turbo drops the downpipe down the driver side between cylinders 3 and 4, under the pedal box, then along the frame rail to the rear exit. Crossmembers unaffected.',
      notes: [
        '3″ committed (single exit out the back)',
        'Forward top-mount turbo + driver-side downpipe drop between cyl 3/4 (see design-overview reference image)',
        'Routes under the pedal box, then along the driver-side frame rail',
        'No crossmember relief notches required — path clears existing crossmembers',
        'Clearance to steering rack and column shaft verified',
        'Re-check against the RX-8 diff and half-shafts (rear changed to IRS, Oct 2026)',
      ],
    },
    {
      id: 't-decide-steering-route',
      title: 'Steering Column Routing CAD',
      epic: 'design',
      kind: 'task',
      status: 'complete',
      summary: 'Path from column to rack around exhaust/downpipe with U-joint angles and clearance — routed and locked in CAD.',
    },
    {
      id: 't-decide-firewall',
      title: 'Firewall Setback Study',
      epic: 'design',
      kind: 'task',
      status: 'planning',
      summary: 'CAD study output: chosen firewall plane location (mm aft of front axle CL), with verified clearance to bellhousing/CD009, pedal-box envelope, steering passthrough, and HVAC core.',
      notes: [
        'Anchor: derived from multiple constraints (engine + pedals + steering + dash)',
        'Passthroughs to plan: steering shaft, wiring grommets',
        'Master cylinders mount cabin-side; reservoirs pass through to engine bay',
        'Heater: planning electric (no heater-core passthrough needed)',
        'Throttle: planned DBW conversion (stock SR20DET is cable) — no cable passthrough (see t-buy-dbw-pedal)',
        'Nothing actually blocks starting this — just needs the time',
      ],
    },
    {
      id: 't-firewall-design',
      title: 'Firewall CAD',
      epic: 'design',
      status: 'planning',
      summary: 'Detailed firewall geometry: pedal box passthrough, steering passthrough, heat shielding allowances.',
    },
    {
      id: 't-decide-pedal',
      title: 'Decide: Pedal-Box Placement',
      epic: 'design',
      kind: 'decision',
      status: 'planning',
      summary: 'Pick one: engine-bay-side hanging, underfloor, or dash-recessed bulkhead-mount. CAD study against engine + exhaust intrusion picks the winner.',
      deferrable: 'Final pedal-box detailing (t-pedal-box-design) can land after frame is built; envelope must be reserved upfront.',
    },
    {
      id: 't-pedal-box-design',
      title: 'Pedal Box CAD',
      epic: 'design',
      status: 'planning',
      deferrable: 'Detailed pedal-box CAD can be done after frame is built; only the envelope needs to be reserved early.',
      summary: 'Hanging vs floor-mount; clutch + brake master geometry.',
    },
    {
      id: 't-decide-seat-position',
      title: 'Driver H-Point CAD Layout',
      epic: 'design',
      kind: 'task',
      status: 'planning',
      summary: 'Output: driver H-point coordinates in CAD. Strategy: push H-point as far rearward as possible without killing rear-seat usability — buys room to push firewall forward. Validated physically with blocking before locking seat-mount node positions.',
      notes: [
        'Driver target: just me + helmet (with headrest for safety)',
        'Seat: between OEM and racing — not yet sourced (must accommodate helmet)',
        'Push H-point rearward → enables firewall-forward → more pedal-box / engine room (constrained by rear-seat usability)',
        'Mounting: sub-floor on frame seat-mount tubes; body-to-frame attachment still open (t-decide-body-mounting)',
        'Sightline: tall A40 dash not expected to be a problem',
        'Hard prereq for firewall-setback finalization (t-decide-firewall) and frame seat-mount nodes',
        '— Procedure (SAE J826 / J1100 derived) —',
        'Step 1: Measure own femur (greater trochanter → lateral knee) and shin (knee → lateral malleolus); use these instead of percentile tables',
        'Step 2: Target angles — torso 22–25° from vertical, hip 95–100°, knee 120–135°, ankle 87–95°',
        'Step 3: In CAD on vehicle CL plane, anchor at AHP (Accelerator Heel Point); build shin → knee → thigh → H-point → torso → eye point chain',
        'Step 4: Slide manikin rearward until rear-seat H-point clearance ≈ 600 mm (rearmost feasible)',
        'Step 5: Check four hard walls — pedal envelope (front), firewall/bellhousing (torso front), rear-seat usability (rear), roof + helmet stack (top)',
        'Step 6: Vision check — down-vision line over A40 dash bezel must hit road ≤ 4 m ahead of bumper; up-vision ≥ 7° above horizontal',
        'Step 7: Free-outputs from locked H-point — steering wheel center ~400 mm fwd / ~180 mm above H-point at 20–30° tilt; shifter knob within 300 mm arc of shoulder',
        'Step 8: Physical blocking — tape AHP on floor, stack foam/2×4s to H-point height, plywood seatback at torso angle, sit 10 min, adjust ±25 mm',
        'Step 9: Feed physical deltas back into CAD and lock H-point (x, z) coords',
      ],
    },
    {
      id: 't-decide-shifter',
      title: 'Decide: Native vs Remote Shifter',
      epic: 'design',
      kind: 'decision',
      status: 'planning',
      deferrable: 'Can be settled once the trans is physically mocked up; reserve tunnel space upfront.',
      summary: 'Native shifter vs remote linkage. Driven by engine placement and transmission choice. In the design-overview CAD the native CD009 lever lands behind the driver\'s hip, so a remote shifter is expected.',
      posts: ['design-overview'],
    },
    {
      id: 't-shifter-design',
      title: 'Shifter Linkage CAD',
      epic: 'design',
      status: 'planning',
      summary: 'If remote, design the linkage / cable run to the chosen shifter location.',
    },
    {
      id: 't-cooling-design',
      title: 'Radiator + IC + Fan Layout CAD',
      epic: 'design',
      status: 'planning',
      summary: 'Output: rad + IC core sized to grille opening (from scan), fan + shroud spec, frame mount nodes, hose / IC-pipe routing envelope, separate oil-cooler location.',
      notes: [
        'Power target: ~300 whp; injectors/fuel sized for ~350 whp headroom (1000-1100 cc/min, E85-capable; boost TBD)',
        'Rad: Mishimoto X-Line for 1992–2000 Civic (likely half-core variant)',
        'IC: FMIC, lower half in front of rad',
        'Separate oil cooler — location TBD',
        'Grille opening dims now available from t-scan-front',
        'Slim electric fan required for small A40 grille',
      ],
    },
    {
      id: 't-intake-piping-design',
      title: 'Intake / IC Piping CAD',
      epic: 'design',
      status: 'planning',
      summary: 'Charge pipe routing from turbo → IC → throttle body.',
    },
    {
      id: 't-decide-brake-system',
      title: 'Brake Hydraulic Spec (Master, Pedal Ratio, Split, Bias)',
      epic: 'design',
      kind: 'task',
      status: 'planning',
      deferrable: 'Manual-brake decision is locked. The bore + pedal-ratio + split + bias calc only needs to be done before t-buy-brake-master and t-pedal-box-design, both of which are well downstream of frame welding.',
      summary: 'Output: master bore + pedal ratio (calc), circuit split, proportioning-valve count + PN, F/R bias target. Manual brakes already locked. Open decision: the brake split.',
      notes: [
        `Sized to ~${k('operating_mass')} operating mass, ~${raw('front_weight_fraction')}/${raw('rear_weight_fraction')} F/R (estimate)`,
        'F=PA worksheet: caliper piston area F+R, line pressure target, driver foot force → pedal ratio + master bore + pedal travel at peak braking',
        'Master bore: leaning ~7/8" (small) — needs the F=PA + line-pressure calc to confirm',
        'Pedal ratio: starting from 5.5:1 (typical for manual brake) — pedal box should allow adjustability (multi-hole pivot)',
        'OPEN — split: a diagonal (X) split has no "rear circuit", so one rear proportioning valve cannot work. Options: (a) front/rear split + one adjustable rear valve (simplest), or (b) X-split with two valves set identically',
        'Prop valve: leaning Tilton — PN and count follow the split',
        'Calipers: Miata NA on all four corners; rears ride on the Miata rear uprights (no custom brackets) and include the integrated cable parking brake',
        'Rotor: 231 mm solid baseline',
        'Adjustable rear proportioning required; bias set at shakedown',
      ],
    },
    {
      id: 't-frame-design',
      title: 'Ladder Frame Design',
      epic: 'design',
      status: 'in-progress',
      posts: ['frame-design'],
      summary: 'Tube sizing, node layout, motor mounts, suspension pickups. Done = design is build-ready, all major clearances and gotchas checked.',
      notes: [
        'Current state: mostly real geometry with a few open numbers',
        'Initial design lock first, then a separate finalization pass (t-design-finalization)',
        'Trigger to flip complete: build-ready — all major clearances + gotchas checked',
        'No formal BOM — cut list will be the authoritative output',
        'Cut list waits on: SA V2 outputs, donor rear measurements (t-measure-donor-rear), body-mounting decision. Trans (CD009 or Z32) and fenders (widen, no tubs) are decided',
        'Engine mounts: frame includes pads for stock SR20 mounts (no custom-mount fab task)',
      ],
    },
    {
      id: 't-steering-rack-design',
      title: 'Steering Rack Narrowing CAD',
      epic: 'design',
      status: 'planning',
      posts: ['steering'],
      summary: 'Cut and re-weld the donor rack to match the narrowed track.',
    },
    {
      id: 't-design-finalization',
      title: 'Design Finalization & Cut List',
      epic: 'design',
      status: 'planning',
      posts: ['design-finalization'],
      summary: 'Final pass after SA V2 + donor front scan + donor rear measurements land. Output: cut list ready to order metal from. No separate BOM.',
      notes: [
        'Done = cut list signed off, ready for t-buy-metal',
        'Inputs that must be locked first: SA V2 outputs, donor front scan confirmed, donor rear measured, rear pickup approach (frame vs narrowed subframe), RX-8 diff on hand for mount design',
      ],
    },
    {
      id: 't-digital-dash-design',
      title: 'Digital Dash Architecture',
      epic: 'design',
      status: 'complete',
      posts: ['digital-dash'],
      summary: 'Architecture locked: Pi 5 (4GB) + Active Cooler + Freenove M.2 NVMe + PiCAN FD Duo Isolated HAT + Waveshare 12.3″ portrait-DSI behind the original A40 bezel, Godot/GDScript UI consuming the Haltech Nexus S2 CAN broadcast, Mini-Box DCDC-USB (V(out) jumpered to 5 V) for the Pi + display supply and graceful ignition-off shutdown (Automotive-mode timing preset: OFFDELAY 1 min / HARDOFF 1 min). The architecture is done; the digital-dash post stays in-progress because it also logs the hardware and software build (t-dash-hardware, t-dash-software).',
    },
    {
      id: 't-dash-hardware',
      title: 'Dash Hardware Assembly',
      epic: 'fabrication',
      status: 'in-progress',
      posts: ['digital-dash'],
      summary: 'Phase 1 bench stack (Pi 5 + Freenove NVMe + Waveshare DSI on the 27W USB-C PSU) verified, then Phase 2 swap to the PiCAN FD Duo Isolated HAT + Mini-Box DCDC-USB for the automotive 12V / ignition-shutdown chain. The FD Duo is non-SMPS: DCDC-USB V(out) jumpered to 5 V (~33 W, under the 40 W forced-air limit) powers the Pi USB-C and the display directly (one feed each); the HAT takes logic power from the Pi header only.',
      notes: [
        'Phase 1: Pi 5 / NVMe / DSI screen running off bench PSU — proves OS + screen + boot',
        'Phase 2: drop USB-C, add PiCAN FD Duo Isolated HAT; DCDC-USB V(out) jumpered to 5 V (default is 12 V: measure with a meter before connecting the Pi) → Pi USB-C (short 18 AWG, ≥5.0 V at the Pi under load) + display 5 V (its only feed); fallback if undervoltage: 12 V out + 5.1 V / 5 A buck; nothing from the 12 V side goes into the isolated HAT; usb_max_current_enable=1; DCDC-USB also handles the graceful shutdown on ign-off (OFFDELAY 1 min / HARDOFF 1 min preset)',
        'Dual CAN bringup (can0 Haltech @ 1 Mbps, can1 Toyota EPAS @ 500 kbps) tracked separately as t-dash-fdduo-swap',
        'Hardware must be done before any UI testing on real CAN frames',
      ],
    },
    {
      id: 't-dash-software',
      title: 'Dash UI / Software',
      epic: 'design',
      status: 'in-progress',
      posts: ['digital-dash'],
      summary: 'Godot/GDScript dashboard app on the Pi 5: layout (survival data peripheral, driving data center, admin right), CAN frame parsing, render loop. Built as a Godot 2D scene exported to dash_app.arm64 with Sway autoboot. Can be developed against synthetic / replayed CAN data before a real ECU is on hand.',
      notes: [
        'Priority order: coolant temp, oil pressure, AFR, MAP, tach, speed, oil temp, fuel level, battery V, IAT',
        'Slot layout (left to right): oil pressure + battery V, coolant + oil temp, tach + km/h + gear, boost + AFR, fuel + IAT',
        'Bench-testable against pre-recorded Haltech logs replayed on vcan0 or the FD Duo in loopback',
      ],
    },
    {
      id: 't-dash-haltech-integration',
      title: 'Dash ↔ Haltech CAN Integration',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Wire the FD Duo can0 channel to the Haltech CAN bus, decode the live broadcast, and validate every gauge against a running ECU. Friend\'s Haltech can be used as a temporary signal source while the A40\'s own ECU is still in a box.',
      deferrable: 'Initial decode/validation can happen against a friend\'s Haltech bench-side; final integration waits on the car\'s own ECU + harness.',
      notes: [
        'Requires hardware (FD Duo + Pi) and dash UI both functional',
        'Goal: every priority signal verified end-to-end on a live ECU before this is called done',
        'Hard prereq on ECU choice (locks CAN broadcast spec)',
      ],
    },
    {
      id: 't-dash-bezel-scan',
      title: 'Scan A40 Dash Bezel',
      epic: 'design',
      status: 'complete',
      summary: 'Einstar 2 scan of the A40 dash bezel opening + surrounding mount surfaces, used to size the dash display in CAD (and the digital-dash blog renders) so the shroud and screen mounts fit the real bezel directly.',
    },
    {
      id: 't-dash-shroud',
      title: '3D-Print Dash Shroud',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Design and 3D-print the shroud that connects the Waveshare 12.3" screen + Pi stack to the original A40 dash bezel opening. Includes screen-mount features and clearance for the DSI ribbon and FD Duo stack.',
      notes: [
        'Active area target ≥ 10.5" × 3.5" to fill the bezel cleanly',
        'Mount geometry pulled directly from the bezel scan',
      ],
    },

    /* ─────────── Epic: fabrication (purchases + builds) ─────────── */
    {
      id: 't-frame-jig',
      title: 'Frame Jig Build',
      epic: 'fabrication',
      status: 'complete',
      posts: ['frame-jig'],
      summary: 'Welding fixture to build the frame on. Re-check flatness (string line / laser / straightedge) and diagonals (within 1–2 mm) before the frame rails go on.',
    },
    {
      id: 't-jig-reference-points',
      title: 'Transfer Pickup Points to Jig',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Transfer CAD pickup-point coordinates onto the physical jig using plumb bob + tape from datum, then verify with Einstar 2 laser scan before tacking.',
      notes: [
        'Datum: vehicle centerline + front lower-LCA pivot point (subject to change)',
        'Method: plumb bob + tape for layout, scan-verify before tack',
        'Tolerance (geometry reference): ±1 mm on suspension pickups, ±0.5 mm on UCA inner mounts, ±5 mm on body / non-critical nodes; left-right symmetry matters more than absolute position',
        'Re-scan after final weld to capture distortion; compare deltas to CAD',
        'Hard nodes to hit: front LCA + UCA pivots, upper shock mounts, rack mounts, rear IRS pickups (incl. toe links), RX-8 diff mounts',
      ],
    },

    /* Purchases — frame */
    {
      id: 't-buy-metal',
      title: 'Buy: Frame Steel',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Order the tubing, plate, and bar stock from the design BOM.',
    },
    {
      id: 't-buy-mandrel-tubes',
      title: 'Buy: Mandrel-Bent Tubes',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Send bend specs to the mandrel shop for the curved chassis sections.',
    },

    /* Purchases — engine systems */
    {
      id: 't-buy-exhaust-manifold',
      title: 'Buy: Exhaust Manifold',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Tubular T3-flange manifold matched to the chosen turbo and downpipe routing.',
    },
    {
      id: 't-buy-radiator',
      title: 'Buy: Radiator',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'All-aluminum crossflow radiator sized for the ~300 whp target and the A40 grille opening.',
    },
    {
      id: 't-buy-intercooler',
      title: 'Buy: Intercooler',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Front-mount intercooler core sized to SR20DET airflow at target boost. Final size pinned by the cooling-stack physical fit.',
    },
    {
      id: 't-buy-intake-piping',
      title: 'Buy: Charge Piping',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Aluminum elbows, couplers, clamps from the IC piping layout.',
    },
    {
      id: 't-buy-exhaust-system',
      title: 'Buy: Exhaust System',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Downpipe, mid-pipe, muffler — sized to the routed path.',
    },
    {
      id: 't-buy-ecu',
      title: 'Buy: ECU',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Haltech Nexus S2 (all-in-one ECU + PDM + wideband + DBW control; verify S2 output count/current and internal wideband) — decided in t-decide-ecu.',
      posts: ['wiring-overview'],
    },

    /* Purchases — driveline */
    {
      id: 't-buy-driveshaft',
      title: 'Buy: Driveshaft',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: `Custom one-piece driveshaft cut/balanced to final length. The shop needs the trans output yoke spec and the RX-8 pinion flange spec. Design angles: shaft ${k('shaft_angle')} (${raw('shaft_drop')}″ drop over ${raw('shaft_length')}″), both U-joints ${k('ujoint_front')}, constant through travel (sprung diff).`,
    },
    {
      id: 't-buy-miata-rear',
      title: 'Buy: Miata NA Rear Suspension',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Donor NA rear: subframe (for measurement / possible narrowing), upper + lower arms, toe links, uprights with hubs. Rear calipers/rotors are already on hand (t-buy-calipers).',
    },
    {
      id: 't-buy-rx8-diff',
      title: 'Buy: Mazda RX-8 Rear Diff',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: `RX-8 rear diff — stronger than the NA unit, which is not suited to a 300+ whp SR20DET. Stock final drive ~${k('final_drive')} on 6-speed cars; verify the ratio and LSD type on the unit bought. Weigh it for the CG table (~30 kg class).`,
    },
    {
      id: 't-buy-half-shafts',
      title: 'Buy: Custom Half-Shafts',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Custom drive axles made to length: RX-8 diff output flanges to the Miata rear hubs. Length measured on the jig once the narrowed pickups and diff mounts are fixed.',
    },
    {
      id: 't-rear-irs-fab',
      title: 'Fab Narrowed Rear Pickups + RX-8 Diff Mounts',
      epic: 'fabrication',
      status: 'planning',
      summary: `Build the rear IRS mounting on the frame: every Miata rear inboard pickup (toe links included) translated inboard by the measured narrowing (~${raw('rear_narrowing_lo')}–${k('rear_narrowing_hi')}/side) to land the ${k('rear_track')} track, plus custom RX-8 diff mounts with the pinion set parallel to the trans.`,
      notes: [
        'Open in CAD: pickups built into the frame (like the front) vs a cut-and-narrowed Miata rear subframe bolted to it',
        'Fit with the real arms, uprights and diff in place on the jig; check left-right symmetry before welding',
        'Check half-shaft clearance to frame, exhaust and fuel tank through full travel',
        'Tolerance: ±1 mm on pickups',
      ],
    },

    /* Purchases — chassis interior */
    {
      id: 't-buy-shocks-front',
      title: 'Buy: Front Shocks',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Coilovers / shocks sized to front spring rate + motion ratio output by the suspension tuning pass.',
    },
    {
      id: 't-buy-shocks-rear',
      title: 'Buy: Rear Shocks',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Coilovers / shocks sized to rear spring rate + motion ratio output by the suspension tuning pass.',
    },
    {
      id: 't-buy-epas',
      title: 'Buy: EPAS Unit',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Toyota Prius Gen 4 (2016–2022) column-mount EPAS assembly — column + integrated controller. All years use the same opendbc powertrain DBC (toyota_nodsu_pt_generated); still confirm the column part number and log a donor car if possible.',
      deferrable: 'Only needed if EPAS is chosen (t-decide-steering-assist). Manual steering skips it.',
    },
    {
      id: 't-buy-steering-column',
      title: 'Buy: Steering Column',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Replacement column + U-joints + collapsible shaft sized to the EPAS-to-rack path. Length depends on quick-release decision.',
    },
    {
      id: 't-buy-seats',
      title: 'Buy: Seats',
      epic: 'fabrication',
      status: 'complete',
      kind: 'purchase',
      summary: 'Purchased: MR2 seats. Compact, supportive bucket-style, compatible with belt anchor geometry and the planned H-point.',
    },

    /* Purchases — brakes */
    {
      id: 't-buy-brake-master',
      title: 'Buy: Brake Master Cylinder',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Master cylinder bore sized by the pedal-ratio + bore calc against caliper piston area and pedal travel target.',
    },
    {
      id: 't-buy-brake-lines',
      title: 'Buy: Brake Lines & Fittings',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Hard line (3/16" cunifer or stainless), AN flex hoses for axle + caliper drops, fittings, P-clips, flare tool consumables. Routing follows frame rails away from heat sources.',
      notes: [
        'Hard line: cunifer preferred over stainless for ease of bending and corrosion resistance',
        'Flex hoses at each caliper (frame → front knuckles, frame → rear uprights)',
        'Run layout follows the split decision in t-decide-brake-system (F/R split or X-split)',
      ],
    },
    {
      id: 't-buy-calipers',
      title: 'Buy: Calipers & Rotors',
      epic: 'fabrication',
      status: 'complete',
      kind: 'purchase',
      summary: 'Purchased: Miata calipers and rotors (4-corner baseline).',
    },
    {
      id: 't-buy-prop-valve',
      title: 'Buy: Adjustable Proportioning Valve',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Inline adjustable proportioning valve(s) (Wilwood/Tilton). Count follows the split decision: one on the rear circuit (F/R split) or two set identically (X-split).',
    },

    /* Builds */
    {
      id: 't-frame-build',
      title: 'Frame Fabrication',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Cut, fit, and weld the ladder frame on the jig: rails, then crossmembers, then brackets located with the real parts bolted in; weld out on the jig with alternating stitched passes, re-checking pickups and diagonals as it goes (sequence in design-finalization).',
      posts: ['design-finalization'],
    },
    {
      id: 't-firewall-build',
      title: 'Firewall Fabrication',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Form and weld the custom firewall to the frame.',
    },
    {
      id: 't-floor-panels',
      title: 'Floor Panels',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Cabin floor pans, transmission tunnel.',
    },
    {
      id: 't-wheelwell-fab',
      title: 'Tubs / Fender Widening',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Inner wheel tubs (if tubbing) or widened fenders (if not).',
    },
    {
      id: 't-body-mount',
      title: 'Body Mounting',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Body mounts, panel gaps, hood/door alignment on the new frame.',
    },
    {
      id: 't-bodywork',
      title: 'Panel Fit & Gap Prep',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Final panel fitment, gap setting, prep for paint. Includes the rocker rust patch identified at teardown.',
    },
    {
      id: 't-engine-install',
      title: 'Engine & Driveline Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Drop SR20 in, fit driveshaft, exhaust routing.',
    },
    {
      id: 't-cooling-install',
      title: 'Cooling Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mount radiator + intercooler, run hoses.',
    },
    {
      id: 't-intake-install',
      title: 'Intake / IC Piping Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Install intercooler, charge pipes, intake, and BOV — bracket and clamp the routed path from the IC fit task.',
    },
    {
      id: 't-exhaust-install',
      title: 'Exhaust Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Hang downpipe, mid-pipe, muffler on the routed path. Wideband O2 bung already welded at engine prep.',
    },
    {
      id: 't-driveline-install',
      title: 'Driveline Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'RX-8 diff on its mounts, half-shafts, driveshaft.',
    },
    {
      id: 't-brake-lines-fab',
      title: 'Brake Line Routing & Fab',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Bend, flare, and route hard lines along the frame rails per the chosen split (t-decide-brake-system). Mount the adjustable proportioning valve(s) where they can be reached for adjustment. Mount tabs / P-clips welded to the frame during frame fab.',
      notes: [
        'Two hard-line circuits from the master — layout set by the F/R vs X-split decision',
        'Valve(s) inline upstream of the rear flex hoses',
        'Flex hoses bridge frame → each caliper; rear flex must take full droop without tension and full bump without kinking',
        'Keep lines off the exhaust + downpipe; heat shielding where unavoidable',
      ],
    },
    {
      id: 't-brake-install',
      title: 'Brake System Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mount master cylinder, install hard lines + flex hoses + adjustable prop valve(s) (per t-brake-lines-fab), bolt on calipers (rears on the Miata uprights, no brackets), bench-bleed the master, full-system bleed.',
    },
    {
      id: 't-wiring',
      title: 'Engine Wiring Harness',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Engine + chassis harness, power distribution, grounds. Decided: built from scratch with Wiring Specialties connectors, self-terminated and self-loomed in DR-25 (see t-decide-harness-strategy).',
      posts: ['wiring-overview'],
      notes: [
        'Pinout & branch map — single one-page diagram of every Nexus branch',
        'Connector BOM from Wiring Specialties (EV14 injectors, smart coils, Bosch sensors, DBW TB + pedal, LSU 4.9, bulkhead)',
        'Engine-side sub-harnesses: injectors, coils, sensors',
        'Trunk + firewall bulkhead pass-through',
        'Looming: DR-25 + Raychem SCL boots, P-clip support, 90° branches',
        'Bench power-up: PDM channels with test loads before sensors go on (starter solenoid goes through a relay, not a PDM channel)',
      ],
    },
    {
      id: 't-engine-startup',
      title: 'Engine First-Start',
      epic: 'fabrication',
      status: 'planning',
      summary: 'All systems-go check-list: fuel, cooling, intake, exhaust, wiring, brakes, ECU map.',
      notes: [
        'Fuel pressure ≥ spec',
        'Coolant filled + bled',
        'Oil priming',
        'ECU base map loaded',
        'Brakes bled, parking brake holds',
        'All grounds verified',
        'First crank no-spark sanity check',
      ],
    },

    /* ─────────── Epic: finishing (post-running) ─────────── */
    {
      id: 't-non-engine-wiring',
      title: 'Body Wiring',
      epic: 'finishing',
      status: 'planning',
      summary: 'Lights, switches, electric windows, accessories.',
    },
    {
      id: 't-door-panels',
      title: 'Custom Door Panels',
      epic: 'finishing',
      status: 'planning',
      deferrable: 'Cosmetic; runs in parallel with reupholstery after first drive.',
      summary: 'Custom interior door cards — material, mounting, integration with electric window switches.',
    },
    {
      id: 't-reupholstery',
      title: 'Reupholstery',
      epic: 'finishing',
      status: 'planning',
      deferrable: 'Pure cosmetic finishing — happens after the car drives.',
      summary: 'Seat covers, headliner, carpet.',
    },
    {
      id: 't-sound-dampening',
      title: 'Sound Dampening',
      epic: 'finishing',
      status: 'planning',
      deferrable: 'Adds NVH polish; can be applied any time after bodywork.',
      summary: 'Butyl mat + closed-cell foam on floors, firewall, doors, roof, trunk for cabin NVH.',
    },
    {
      id: 't-heat-shielding',
      title: 'Heat Shielding',
      epic: 'finishing',
      status: 'planning',
      summary: 'Firewall, floor, transmission tunnel heat barriers.',
    },

    /* ─────────── Fuel system ─────────── */
    {
      id: 't-fuel-design',
      title: 'Fuel System Design',
      epic: 'design',
      status: 'planning',
      deferrable: 'Tank choice (stock vs custom cell) only needs to be resolved once exhaust routing is finalized in CAD. Pump architecture is decided (external Aeromotive 340 + surge tank — t-decide-fuel-architecture). Nothing here gates frame welding.',
      summary: 'Likely reuse stock A40 tank under boot floor, but possible clearance conflict with the driver-side SR20 downpipe routing may force a custom fuel cell. Pump architecture decided: external Aeromotive 340 + surge tank (see t-decide-fuel-architecture). Output: surge-tank location, line routing, filter, regulator, vent. Fuel system sized for ~350 whp headroom over the ~300 whp target.',
      notes: [
        'Tank: stock A40 in stock location is the default — but downpipe routing (driver side, under pedal box, along driver-side frame rail) may interfere. Confirm clearance against exhaust CAD before committing.',
        'Fallback: custom fuel cell sized to fit around the locked exhaust path (and/or relocated forward of the rear axle for CG).',
        'Pump: decided — external Aeromotive 340 (on hand) fed from a surge tank (see t-decide-fuel-architecture)',
        'Check half-shaft and diff clearance to the tank / surge tank (rear is now IRS)',
        'Hard-line routing along frame, away from exhaust',
        'Safety bias: high-quality fittings, fire sleeve, no rubber in cabin, vent routed away from cockpit',
      ],
    },
    {
      id: 't-prep-fuel-tank',
      title: 'Prep Stock A40 Fuel Tank',
      epic: 'fabrication',
      status: 'planning',
      kind: 'task',
      summary: 'Reusing stock A40 tank — inspect, clean, seal, pressure-test before reinstall.',
      notes: ['Internal cleaning + seal coating', 'Sender / pickup compatibility with EFI fuel pressure', 'Add bulkhead fittings for surge-tank feed/return + vent'],
    },
    {
      id: 't-buy-fuel-pump',
      title: 'Buy: Fuel Pump',
      epic: 'fabrication',
      status: 'complete',
      kind: 'purchase',
      summary: 'Aeromotive 340 already on hand. Surge tank is bought with the fuel lines (t-buy-fuel-lines).',
    },
    {
      id: 't-buy-fuel-lines',
      title: 'Buy: Fuel Lines & Fittings',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Surge tank, AN line, hard line, filter, regulator, fittings.',
    },
    {
      id: 't-fuel-install',
      title: 'Fuel System Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mount tank, surge tank and pump, run hard + flex lines, plumb regulator and filter.',
    },

    /* ─────────── Charging / battery / kill switch ─────────── */
    {
      id: 't-charging-design',
      title: 'Charging & Battery Plan',
      epic: 'design',
      status: 'planning',
      summary: 'Full electrical-system plan downstream of the battery-location decision: alternator wiring (charge cable size, regulator), fuse + relay panel layout, kill-switch routing, cable runs from the chosen battery location. Battery location itself is the separate t-decide-battery-location decision.',
    },
    {
      id: 't-buy-battery',
      title: 'Buy: Battery & Mount',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Lightweight AGM/Li battery + tray sized to the chosen battery location (probably the boot, not final).',
    },
    {
      id: 't-buy-kill-switch',
      title: 'Buy: Kill Switch',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Master cut-off (battery + alt-disconnect lug) — required for safe storage and inspection.',
    },

    /* ─────────── Dash install ─────────── */
    {
      id: 't-dash-install',
      title: 'Digital Dash Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mount the printed shroud + screen + Pi stack into the A40 dash, splice into the harness 12V / ignition / CAN feed.',
    },

    /* ─────────── EPAS CAN gateway (dual-bus, Pi-driven) ─────────── */
    {
      id: 't-buy-can-hat-duo',
      title: 'Buy: PiCAN FD Duo Isolated HAT',
      epic: 'fabrication',
      status: 'complete',
      kind: 'purchase',
      summary: 'Purchased: PiCAN FD Duo Isolated (non-SMPS) from Copperhill. Two galvanically-isolated CAN channels: can0 (Haltech, 1 Mbps) + can1 (Toyota Prius column, 500 kbps). Pi gets 5 V directly from the Mini-Box DCDC-USB, V(out) jumpered to 5 V.',
      posts: ['epas-can-gateway'],
      deferrable: 'Only needed if EPAS is chosen (t-decide-steering-assist). Manual steering skips it.',
    },
    {
      id: 't-dash-fdduo-swap',
      title: 'Dash Hardware: Dual CAN Bringup',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Bring up both CAN channels on the PiCAN FD Duo Isolated: device-tree overlays for the two MCP251xFD controllers on SPI0 CS0 / CS1, can0 @ 1 Mbps for the Haltech side, can1 @ 500 kbps for the Toyota EPAS side. Validate with loopback + a recorded Haltech log.',
      posts: ['epas-can-gateway'],
      notes: [
        'Overlays: mcp251xfd on spi0-0 (CS0 → can0, interrupt 25) and spi0-1 (CS1 → can1, interrupt 24) — see the digital-dash provisioning script',
        'Validate: `ip -details link show can0 / can1` reports correct bitrates and ERROR-ACTIVE',
        'Pi power topology: HAT does NOT feed Pi over GPIO — 5 V comes from the DCDC-USB V(out), jumpered to 5 V',
        'CAN: restart-ms via networkd RestartSec on can0 + can1; can0 HAT terminator off (Haltech bus already has two); can1 120 Ω at each end (~60 Ω measured)',
      ],
      deferrable: 'Only needed if EPAS is chosen (t-decide-steering-assist). Manual steering skips it.',
    },
    {
      id: 't-epas-gateway-software',
      title: 'EPAS CAN Gateway Service',
      epic: 'design',
      status: 'planning',
      posts: ['epas-can-gateway'],
      summary: 'Lightweight C/Python systemd service translating Haltech → Toyota frames. Reads RPM (Haltech 0x360, bytes 0-1) and speed (Haltech 0x370, bytes 0-1) on can0; writes Toyota 0x1C4 ENGINE_RPM (bytes 0-1, signed, 0.78125 rpm/bit, + ENGINE_RUNNING) and 0xB4 SPEED (bytes 5-6, 0.01 km/h/bit) on can1, per the opendbc Gen 4 Prius DBC; send rates from a Prius log (verify). 0xB4 carries the opendbc toyota_checksum in the last byte; 0x1C4 has none. Runs outside the Godot dash app so a UI crash never costs power steering.',
      notes: [
        'Separate systemd unit, Restart=always, StartLimitIntervalSec=0, WatchdogSec + sd_notify, hardware watchdog (RuntimeWatchdogSec), early-boot start',
        'Loss policy: stale Haltech speed → hold last speed, then ramp toward high-speed/low assist (never toward 0); rate-limit speed changes',
        'Speed conversion: decode Haltech 0x370 to km/h, then Toyota raw = km/h ÷ 0.01 (DBC scale 0.01 kph, bytes 5–6)',
        'Checksum (only frames that define CHECKSUM): ((id>>8) + (id&0xFF) + DLC + bytes 0..DLC-2) & 0xFF',
        'No UI dependency — logs to journald only',
        'Bench-developable against recorded Haltech logs replayed on vcan0',
      ],
      deferrable: 'Only needed if EPAS is chosen (t-decide-steering-assist). Manual steering skips it.',
    },
    {
      id: 't-epas-gateway-bench',
      title: 'EPAS Gateway Bench Validation',
      epic: 'fabrication',
      status: 'planning',
      posts: ['epas-can-gateway'],
      summary: 'Bench rig: FD Duo on Pi, recorded Haltech log replayed on can0, Prius column wired to can1 with 12 V supply. Confirm column wakes on its hard-wired IG input, confirm assist scales with spoofed speed by hand-loading the torque sensor. Pass criterion: assist character matches what the column does in a real Prius across the speed range.',
      notes: [
        'Requires t-buy-epas (column on hand), t-buy-can-hat-duo, t-dash-fdduo-swap, t-epas-gateway-software',
        'Loss tests: pull can0 / can1 and kill the gateway at different simulated speeds; record what the column actually does (fixed assist / reduced / no assist / DTC until key cycle)',
        'Measure termination on both buses (~60 Ω)',
      ],
      deferrable: 'Only needed if EPAS is chosen (t-decide-steering-assist). Manual steering skips it.',
    },

    /* ─────────── Paint ─────────── */
    {
      id: 't-paint',
      title: 'Paint',
      epic: 'finishing',
      status: 'planning',
      summary: 'Strip → bodywork → high-build primer → block sand → sealer → base → clear. Body fully fitted and tagged-off before strip.',
    },
    {
      id: 't-final-reassembly',
      title: 'Final Reassembly',
      epic: 'finishing',
      status: 'planning',
      summary: 'Refit body, glass, trim, lights after paint.',
    },

    /* ─────────── HVAC ─────────── */
    {
      id: 't-hvac-design',
      title: 'HVAC / Heater Design',
      epic: 'design',
      status: 'planning',
      deferrable: 'Can land mid-build as long as the firewall reserves space for the heater core passthrough (or none, if electric).',
      summary: 'Heater core (and optional A/C) packaging, defrost ducting. Required for any street use.',
      notes: [
        'Current consideration: electric heater + AC system for packaging / firewall simplicity (no coolant tap)',
        'If electric wins: no heater-core passthrough needed, simplifies firewall study',
      ],
    },
    {
      id: 't-buy-hvac',
      title: 'Buy: HVAC Components',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Heater core, blower, ducts, controls.',
    },
    {
      id: 't-hvac-install',
      title: 'HVAC Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mount heater/blower box behind dash, run ducts, wire controls. Defrost ducting required for street use.',
    },

    /* ─────────── Shakedown ─────────── */
    {
      id: 't-alignment',
      title: 'Alignment & Corner Balance',
      epic: 'finishing',
      status: 'planning',
      summary: 'Set toe/camber/caster to spec; corner-balance with driver weight.',
    },

    /* ─────────── Steering rack chain ─────────── */
    {
      id: 't-buy-steering-rack',
      title: 'Buy: Steering Rack',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Donor rack-and-pinion (Miata or similar) before narrowing.',
    },
    {
      id: 't-narrow-steering-rack',
      title: 'Narrow Steering Rack',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Cut, shorten, and re-weld the donor rack to match narrowed track.',
    },
    {
      id: 't-steering-wheel-adapt',
      title: 'Adapt OEM Steering Wheel to Column',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Reuse the OEM A40 steering wheel; fabricate/source a hub adapter to mate it to whatever column shaft is chosen. Possibly add a quick-release.',
      notes: [
        'Keeps OEM look; wheel is already on the car',
        'Hub adapter spec depends on column shaft (spline / DD / taper) — hard prereq on column purchase',
        'Quick-release optional: helps ingress/egress and steals room for a fixed-back seat / harness; adds a tolerance stack-up',
        'If quick-release: confirm clocking + horn-wire slip ring before locking column length',
      ],
    },
    {
      id: 't-steering-install',
      title: 'Steering Rack Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mount the rack, column, U-joints, and wheel; bump-steer check.',
    },

    /* ─────────── Front suspension hardware ─────────── */
    {
      id: 't-buy-control-arms',
      title: 'Buy: Control Arms / A-Arms',
      epic: 'fabrication',
      status: 'complete',
      kind: 'purchase',
      summary: 'Purchased: OEM Miata control arms. May upgrade to aftermarket later if geometry analysis calls for it, but not required for v1.',
    },
    {
      id: 't-buy-hubs-spindles',
      title: 'Buy: Hubs & Spindles',
      epic: 'fabrication',
      status: 'complete',
      kind: 'purchase',
      summary: 'Purchased: OEM Miata knuckles (with hubs/bearings) and front subframe.',
    },
    {
      id: 't-suspension-install-front',
      title: 'Front Suspension Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Bolt up control arms, uprights, hubs, and front shocks to the frame.',
    },
    {
      id: 't-suspension-install-rear',
      title: 'Rear Suspension Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Bolt up the narrowed Miata rear (arms, toe links, uprights, hubs, brakes), half-shafts and rear coilovers to the frame.',
    },

    /* ─────────── Engine + clutch hardware ─────────── */
    {
      id: 't-buy-engine',
      title: 'Buy: Engine (SR20DET)',
      epic: 'fabrication',
      status: 'complete',
      kind: 'purchase',
      summary: 'The SR20DET itself. Sourced from JDM importer.',
    },
    {
      id: 't-buy-clutch',
      title: 'Buy: Clutch Kit',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Disc, pressure plate, throwout bearing, pilot bearing.',
    },
    {
      id: 't-buy-clutch-hyd',
      title: 'Buy: Clutch Hydraulics',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Clutch master + slave + line.',
    },
    {
      id: 't-clutch-install',
      title: 'Clutch & Hydraulics Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Pre-engine clutch assembly + bleed clutch hydraulic line after pedal box install.',
    },

    /* ─────────── Brake decisions + parking brake ─────────── */
    {
      id: 't-decide-power-brakes',
      title: 'Decide: Manual vs Power Brakes',
      epic: 'design',
      kind: 'decision',
      status: 'decided',
      decision: 'Manual — cleaner engine bay, more linear pedal response.',
      summary: 'Run a brake booster or stay manual? Drives master sizing and pedal ratio.',
    },
    {
      id: 't-decide-ebrake',
      title: 'Decide: E-Brake Style',
      epic: 'design',
      kind: 'decision',
      status: 'decided',
      decision: 'Cable handbrake into the integrated parking-brake mechanism of the Miata NA rear calipers (not drum-in-hat; no second caliper).',
      summary: 'Comes with the rear-suspension change: the NA rear calipers already carry a cable parking brake. Remaining work is the handle location and cable routing.',
    },
    {
      id: 't-buy-ebrake',
      title: 'Buy: Parking Brake',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Handle + cables to the NA rear calipers\' integrated parking brake.',
    },
    {
      id: 't-ebrake-install',
      title: 'Parking Brake Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mount handle, route cables to the NA rear calipers, set holding adjustment.',
    },

    /* ─────────── Seat hardware ─────────── */
    {
      id: 't-buy-harnesses',
      title: 'Buy: 3-Point Seat Belts',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: '3-point retractable lap+shoulder belts (street-legal, inspection-required). Universal hot-rod kit (Wesco / Juliano’s / Securon) sized to the chosen seats and the frame anchor geometry.',
      notes: [
        '3-point locked — 4-point harnesses dropped (require a harness bar, conflict with no-cage decision)',
        'Retractable type for street use',
        'Need 3 anchor points per side: outboard floor (lap), inboard floor (lap+buckle), upper B-pillar / rear bulkhead (shoulder)',
      ],
    },
    {
      id: 't-seats-install',
      title: 'Seats & 3-Point Belt Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mount seats, sliders, and 3-point belt anchors to the frame. Anchor tabs welded to frame nodes during frame fab; belts installed once seats are in.',
      notes: [
        'Outboard lap and shoulder anchors take the full crash load — reinforced frame tabs, not sheet metal',
        'Shoulder anchor height: ~250-300 mm above the seated shoulder for correct belt angle',
        'Verify belt geometry with the actual seat in place before final-welding any tabs',
      ],
    },

    /* ─────────── Shock + EPAS install ─────────── */
    {
      id: 't-epas-install',
      title: 'EPAS Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Fit the EPAS unit and column, integrate harness.',
      deferrable: 'Only needed if EPAS is chosen (t-decide-steering-assist). Manual steering skips it.',
    },

    /* ─────────── Transmission mount ─────────── */
    {
      id: 't-trans-crossmember',
      title: 'Transmission Crossmember Fab',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Bolt-in crossmember and trans mount tied into the frame at the right node. The trans drops out from below without lifting the body or cutting the frame (driveshaft out first).',
    },

    /* ─────────── Cooling extras ─────────── */
    {
      id: 't-buy-cooling-fans',
      title: 'Buy: Cooling Fans & Shroud',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Electric fan(s) + shroud sized to the chosen radiator core. Fan size pinned by the cooling-stack fit task.',
    },
    {
      id: 't-buy-coolant-hoses',
      title: 'Buy: Coolant Hoses',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Silicone coolant hose set sized to the radiator + engine coolant outlets and routed clearance from exhaust.',
    },
    {
      id: 't-buy-oil-cooler',
      title: 'Buy: Oil Cooler & Lines',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Oil cooler core + sandwich plate adapter + AN lines. Sized to sustained-load temps for the SR20.',
    },

    /* ─────────── Engine ancillaries ─────────── */
    {
      id: 't-buy-catch-can',
      title: 'Buy: PCV / Catch Can',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Crankcase ventilation and oil-air separator with breather lines.',
    },
    {
      id: 't-buy-dbw-pedal',
      title: 'Buy: DBW Throttle Pedal + Sensor',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Drive-by-wire pedal + APS (Bosch-style) and Haltech wiring for the planned DBW conversion (the SR20DET is cable throttle stock).',
    },

    /* ─────────── Wheels & tires ─────────── */
    {
      id: 't-buy-wheels',
      title: 'Buy: Wheels',
      epic: 'fabrication',
      status: 'complete',
      kind: 'purchase',
      summary: 'Purchased: 15" wheels at +38 offset (for 205/65 R15). Room to move to ~+45 in or ~+30 out once track is final.',
    },
    {
      id: 't-buy-tires',
      title: 'Buy: Tires',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: '205/65 R15 starting point.',
    },

    /* ─────────── Anti-roll bars ─────────── */
    {
      id: 't-decide-arb',
      title: 'Decide: ARB Sizing & Mount Provisions',
      epic: 'design',
      kind: 'decision',
      status: 'planning',
      summary: 'Size the bars to the roll-stiffness target, then pick arm length and end-link attachment. Weld mount provisions front and rear; the rear bar is final-sized at the rolling-chassis roll-balance test.',
      notes: [
        `Springs-only roll at ${k('lateral_accel')} ≈ ${raw('roll_springs_rc_hi')}–${k('roll_springs_rc_lo', '0')} (rear RC ${raw('rear_rc_hi')}–${k('rear_rc_lo')}); spring roll stiffness ≈ ${k('roll_stiffness_total', '0')} total (${raw('roll_stiffness_front')} front / ${raw('roll_stiffness_rear')} rear)`,
        'For 3–4° the bars must add ~15.5–33 kN·m/rad (≈24 kN·m/rad for 3.5° at rear RC 100 mm)',
        'Bar diameter: TBD from that target; solid bar; stiffness scales with D⁴',
        'LLTD: start ~3–5% above the front static weight fraction',
        'Rear: IRS at both ends, so a rear ARB is a normal tuning part — provisions now, bar sized at the roll-balance test',
      ],
    },
    {
      id: 't-buy-arb',
      title: 'Buy: Anti-Roll Bars',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Front bar (solid; diameter from t-decide-arb-front) + end-link hardware. Rear bar sized at the rolling-chassis roll-balance test.',
    },

    /* ─────────── Exterior lighting ─────────── */
    {
      id: 't-buy-lighting',
      title: 'Buy: Exterior Lighting',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Headlights, tail lights, signals, side markers.',
    },
    {
      id: 't-lighting-install',
      title: 'Exterior Lighting Install',
      epic: 'finishing',
      status: 'planning',
      summary: 'Mount lights, route harness, aim headlights.',
    },

    /* ─────────── Glass & weatherstripping ─────────── */
    {
      id: 't-buy-glass-seals',
      title: 'Buy: Glass & Weatherstripping',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Window seals, door seals, replacement glass as needed.',
    },

    /* ─────────── Wipers / washers / mirrors ─────────── */
    {
      id: 't-buy-wipers',
      title: 'Buy: Wipers, Washers, Mirrors',
      epic: 'fabrication',
      status: 'planning',
      kind: 'purchase',
      summary: 'Street-legal wiper assembly, washer pump/jets, mirrors.',
    },
    {
      id: 't-wipers-install',
      title: 'Wipers / Mirrors Install',
      epic: 'finishing',
      status: 'planning',
      summary: 'Mount wiper assembly + washer pump/jets, fit mirrors. Required for inspection.',
    },

    /* ─────────── Audit additions: prep, validation, paperwork ─────────── */
    {
      id: 't-engine-prep',
      title: 'SR20 Pre-Install Refresh',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Pre-install bench work on the SR20DET: gasket refresh, bore inspection, head/main bolts, valve-guide / oil-squirter work (verify what the mod is before ordering parts), wideband O2 bung in the downpipe, silicone coolant hose set.',
      notes: [
        'Compression + leakdown',
        'Gaskets + valve cover refresh',
        'Wideband O2 bung welded in downpipe',
        'Silicone coolant hose set',
      ],
    },
    {
      id: 't-decide-final-drive',
      title: 'Decide: Final Drive Ratio + LSD',
      epic: 'research',
      kind: 'decision',
      status: 'planning',
      summary: `RX-8 diff: stock final drive ~${k('final_drive')} on the 6-speed car (verify on the unit bought). Ratio swaps exist; NC MX-5 ratios reportedly share the case (verify). Pick the ratio for the chosen trans gearing and the ~300 whp target, and confirm the LSD.`,
      deferrable: 'A ratio change is a diff rebuild on the bench; it does not block the diff mounts or half-shafts (verify any swap keeps the same output flanges).',
      notes: [
        `Start point: stock RX-8 ~${k('final_drive')} (verify)`,
        'Candidates: RX-8 / NC MX-5 ratios that fit the case — verify fitment',
        'Revisit if inside-rear wheelspin is observed at shakedown',
      ],
    },
    {
      id: 't-pinion-angle-setup',
      title: 'Pinion Angle Setup on Jig',
      epic: 'fabrication',
      status: 'planning',
      summary: `On the jig, set the engine/trans ${k('engine_angle')} tail-down and the RX-8 pinion parallel to it (${k('pinion_angle')} nose-up): shaft ${k('shaft_angle')} (${raw('shaft_drop')}″ over ${raw('shaft_length')}″), both U-joints ${k('ujoint_front')}. The diff is sprung, so these angles hold through suspension travel. Done before the driveshaft is measured.`,
    },
    {
      id: 't-bump-steer-check',
      title: 'Bump-Steer Validation',
      epic: 'fabrication',
      status: 'planning',
      summary: 'On the rolling chassis at ride height, sweep wheel through full bump/droop and measure toe change. Adjust rack height (slotted mount, \u00b115 mm) until bump-steer is within target.',
    },
    {
      id: 't-driveshaft-loop',
      title: 'Driveshaft Safety Loop Fab',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Hoop welded to a frame crossmember surrounding the driveshaft to retain it if a U-joint fails. Standard practice for RWD; common inspection requirement.',
    },
    {
      id: 't-engine-tune',
      title: 'Initial ECU Tune / Dyno',
      epic: 'finishing',
      status: 'planning',
      summary: 'Base map \u2192 idle \u2192 part-throttle \u2192 boost ramp on a dyno. Output: drivable map and a logged WOT pull at the chosen turbo target.',
    },
    {
      id: 't-registration',
      title: 'Inspection / Registration',
      epic: 'finishing',
      status: 'planning',
      summary: 'VIN inspection, weight slip, emissions/safety inspection per local jurisdiction; plates.',
    },

    /* ─────────── Added decisions (architectural) ─────────── */
    {
      id: 't-decide-turbo',
      title: 'Decide: Turbo + Manifold Architecture',
      epic: 'design',
      kind: 'decision',
      status: 'decided',
      decision: 'Forward-mounted top-mount manifold. Routes the downpipe down past cylinders 3/4 on the driver side, keeping it clear of the firewall and steering shaft and giving the cleanest path under the floor.',
      summary: 'Pick turbo (likely re-using one on hand), manifold flange (T3/T4), scroll arch, wastegate style, mount position. Strategy: work from envelope down — manifold geometry should minimize firewall hack-out, then exhaust + IC piping fall out of that.',
      notes: [
        'Forward top-mount manifold chosen — turbo sits high and forward, downpipe drops on the driver side between cyl 3/4',
        'Keeps the downpipe out of the firewall / steering shaft zone',
        'Turbo: probably one I already have — inspect/spec soon',
        'Flange / scroll / wastegate spec still to confirm against the on-hand turbo',
        'Drives: t-buy-exhaust-manifold, t-exhaust-routing, t-decide-firewall (passthroughs), t-cooling-design (charge-air load)',
      ],
    },
    {
      id: 't-decide-cage',
      title: 'Decide: Roll-Cage / Harness Bar',
      epic: 'design',
      kind: 'decision',
      status: 'decided',
      decision: 'No cage initially. Frame to include provisions so a cage can be added later. (Body-to-frame attachment is a separate open decision — t-decide-body-mounting.)',
      summary: 'Full cage vs harness bar vs none. Affects frame nodes, seat H-point, and harness mounting.',
    },
    {
      id: 't-decide-body-mounting',
      title: 'Decide: Body-to-Frame Attachment',
      epic: 'design',
      kind: 'decision',
      status: 'planning',
      deferrable: 'Frame rails can accept welded, rubber, or hybrid body mounts. Real decision can wait until body trial-fit.',
      summary: 'Welded (body and frame as one structure) vs traditional rubber body mounts vs hybrid. Drives NVH, frame stiffness, paint sequencing, and t-body-mount scope. Deferrable — the actual decision can wait until trial-fit since frame rails can accept either approach.',
      notes: [
        'Leaning welded for stiffness',
        'NVH trade-off: welded = more vibration into cabin',
        'Still open — traditional rubber mounts and hybrid both viable',
      ],
    },
    {
      id: 't-decide-harness-strategy',
      title: 'Decide: Wiring Harness Strategy',
      epic: 'design',
      kind: 'decision',
      status: 'decided',
      decision: 'Build from scratch — Wiring Specialties connectors, self-terminated and self-loomed.',
      summary: 'Scratch-built vs chassis-specific harness vs PDM. Drives engine + body wiring scope and timeline.',
    },
    {
      id: 't-decide-ac-scope',
      title: 'Decide: AC Scope',
      epic: 'design',
      kind: 'decision',
      status: 'decided',
      decision: 'Full AC system in scope — compressor, condenser, evaporator.',
      summary: 'In or out, and how much packaging real-estate it takes from the front-end / dash.',
      notes: ['Condenser fights for grille airflow with rad + IC — input to t-cooling-design'],
    },
    {
      id: 't-decide-battery-location',
      title: 'Decide: Battery Location',
      epic: 'design',
      kind: 'decision',
      status: 'planning',
      deferrable: 'Location only needs to be locked before frame welds set the tray mount tabs (soft) and before t-charging-design starts. Battery is out of the engine bay either way; probably the boot (not final), and current cable sizing assumes the boot. Boot vs under-floor vs footwell can be confirmed once the rear floor + fuel-tank layout is finalised.',
      summary: 'Single decision: where the battery physically lives. Out of engine bay for the shaved look — probably the boot (not final; cable sizing assumes the boot), under-floor or passenger footwell still possible. Output feeds t-charging-design (cable runs, fuse-panel placement, kill-switch routing).',
      notes: [
        'Drives: kill-switch routing, cable spec/length, frame mount tab location',
        'Boot mount: longer cables, more voltage drop, easier access',
        'Scope distinction: this task = location only. Alternator wiring, fuse panel, charging logic = t-charging-design.',
      ],
    },
    {
      id: 't-decide-ecu',
      title: 'Decide: ECU',
      epic: 'design',
      kind: 'decision',
      status: 'decided',
      decision: 'Haltech Nexus S2 (ECU + PDM + wideband + DBW control in one unit; verify S2 output count/current and internal wideband).',
      summary: 'ECU platform — drives wiring strategy, dash CAN integration, and tuning workflow.',
    },

    /* ─────────── Added fabrication tasks ─────────── */
    {
      id: 't-pedal-box-install',
      title: 'Pedal Box Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mount fabricated pedal box assembly to firewall. Required before brake / clutch hydraulic install.',
    },
    {
      id: 't-shifter-install',
      title: 'Shifter Install',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mount shifter to floor / tunnel; route linkage or cable to trans.',
    },
    {
      id: 't-fuel-leak-test',
      title: 'Fuel System Leak / Pressure Test',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Pressurize fuel system to spec and hold; check every fitting before first crank.',
    },
    {
      id: 't-horn-install',
      title: 'Horn Install',
      epic: 'fabrication',
      status: 'planning',
      kind: 'task',
      summary: 'Horn + relay + wiring. Required for inspection.',
    },

    /* ─── Body / rust prep (added after audit) ─── */
    {
      id: 't-media-blast-body',
      title: 'Media-Blast Body Shell',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Strip the bare body shell down to clean metal so rust extent is visible and patch panels weld to sound steel.',
      notes: [
        'Soda or fine-media blast to avoid heat distortion of thin panels',
        'Mask or remove glass/seals/trim before',
        'Immediate epoxy primer over bare metal to avoid flash rust',
      ],
    },
    {
      id: 't-rough-clean-body',
      title: 'Rough Clean Body (Needle Scale + Pressure Wash)',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Knock loose scale, undercoat, surface rust, and decades of grime off the bare shell with a needle scaler + pressure wash before media blasting. Pre-clean so the blaster does less work and the rust map is visible early.',
      notes: [
        'Needle scaler on undercarriage, wheel wells, frame rails — anywhere flaky undercoat or scale builds up',
        'Hot pressure wash + degreaser for oil, wax, and seam-sealer residue',
        'Dry the shell fully before storage; surface rust will flash overnight on bare wet steel',
        'Output: a first-pass rust map informing t-rust-repair-body scope before t-media-blast-body',
      ],
    },
    {
      id: 't-rust-repair-body',
      title: 'Rust Repair (Floors, Sills, A-Pillars)',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Cut and patch rust through-holes everywhere an A40 Devon body typically rots — floors, sills, A-pillar bases, dogleg, boot floor, inner fenders. Beyond the single rocker patch noted at teardown.',
      notes: [
        'Floors (driver + passenger)',
        'Sills (rocker assemblies)',
        'A-pillar bases',
        'Dogleg behind rear wheel',
        'Boot/trunk floor',
        'Inner fender / wheelhouse seams',
      ],
    },
    {
      id: 't-frame-coatings',
      title: 'Frame Coatings (Inside + Out)',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Coat the welded frame BEFORE the engine drops in. Once components are mounted you cannot reach the rails or suspension pickups.',
      notes: [
        'Outside: epoxy primer + 2K urethane or powder coat',
        'Inside: cavity wax / Eastwood Internal Frame Coating sprayed through drilled drain holes',
        'Drain holes drilled at the frame jig stage so they can be sealed cleanly later',
        'Suspension pickups masked at threads only',
      ],
    },
    {
      id: 't-seam-sealer-undercoat',
      title: 'Seam Sealer + Underbody Coat',
      epic: 'finishing',
      status: 'planning',
      summary: 'Brushable seam sealer in floor pans / wheel wells / trunk seams, then chip-guard / underbody coat after paint, before final reassembly.',
    },
    {
      id: 't-cavity-wax',
      title: 'Body Cavity Wax (Post-Paint)',
      epic: 'finishing',
      status: 'planning',
      summary: 'Spray wax (Waxoyl / Wurth HHS) into all enclosed body cavities — sills, A-pillars, rear quarters — through factory drain holes. Done after paint cures, before final reassembly.',
    },

    /* ─── Integration / fitment-check nodes (added after audit) ─── */
    {
      id: 't-engine-mockup-on-frame',
      title: 'Engine + Trans Physical Mockup on Frame',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Drop the SR20 + trans onto the welded frame on mock mounts BEFORE coatings or harness work. Verify CAD predictions: tunnel fit, steering shaft path, exhaust envelope, motor mount geometry.',
      notes: [
        'Mock motor mounts (cardboard / scrap) acceptable; production mounts come later',
        'Catches the things t-decide-engine-placement could not, since that task is CAD-only',
        'Outputs: any frame deltas to address, locked motor-mount-pad spec',
      ],
    },
    {
      id: 't-frame-postweld-scan',
      title: 'Frame Post-Weld Scan vs CAD',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Re-scan the frame after final welds to capture distortion vs CAD. Feeds suspension install and any pickup-point shimming.',
      notes: [
        'Tool: Einstar 2',
        'Output: delta map of pickup points',
        'If deltas are within tolerance (±1 mm pickups, ±0.5 mm UCA inner mounts), no rework',
      ],
    },
    {
      id: 't-body-trial-fit',
      title: 'Body Shell Trial-Fit on Frame',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Bolt the bare shell to the welded frame BEFORE bodywork begins. Reveals real fit issues (panel gaps, mount alignment, firewall clearance) while metal is still easy to modify.',
    },
    {
      id: 't-harness-routing-review',
      title: 'Harness Routing Review',
      epic: 'design',
      status: 'planning',
      summary: 'Single review pass reconciling engine harness, body harness, dash CAN tap, DBW, ECU, charging, kill switch — all the things that converge on the cabin front. Outputs the master routing plan + grommet/passthrough list before final wiring.',
    },
    {
      id: 't-cooling-stack-fit',
      title: 'Cooling Stack Physical Fit',
      epic: 'fabrication',
      status: 'planning',
      summary: 'Mock the radiator + intercooler + (optional) AC condenser into the actual A40 grille opening with the body on the frame. Validates the CAD packaging in t-cooling-design before final hose / fan / shroud purchases.',
    },

    /* ─── Promoted from notes (added after audit) ─── */
    {
      id: 't-decide-fuel-architecture',
      title: 'Decide: Fuel System Architecture',
      epic: 'design',
      kind: 'decision',
      status: 'decided',
      decision: 'External Aeromotive 340 + surge tank — the pump is already on hand and drives the choice.',
      summary: 'In-tank conversion vs external pump + surge tank. Locked to external + surge because the Aeromotive 340 is already purchased. Gates fuel-line + tank-prep scope.',
    },
    {
      id: 't-decide-steering-assist',
      title: 'Decide: Manual Steering or EPAS',
      epic: 'design',
      kind: 'decision',
      status: 'planning',
      posts: ['steering'],
      summary: `The car is light: about ${k('axle_load_front', 'r10')} on the front axle (${k('operating_mass')} at ${raw('front_weight_fraction')}/${raw('rear_weight_fraction')}), about the same as an NA Miata, which was sold with a manual rack. Manual steering drops the EPAS column, the CAN gateway, its bench tests and a safety-critical failure mode. EPAS stays an add-on if parking effort is too high.`,
      notes: [
        'Manual: Miata NA manual rack (or depowered), any collapsible column; nothing electrical in the steering',
        'Heavier than a stock Miata at parking speed: wider 205/65R15 tyres and more caster (target 4–5.5°). Estimate by feel before deciding: drive or push a manual-rack NA Miata on 205-width tyres',
        'Wheel size is the main tuning knob for effort: a 14–15 in (350–380 mm) wheel instead of a small aftermarket one',
        'EPAS: Prius Gen 4 column + Pi gateway (t-decide-epas-control). Keep the column mounting and dash space able to take it later',
        'Decide before buying the column (t-buy-steering-column)',
      ],
    },
    {
      id: 't-decide-epas-control',
      title: 'Decide: EPAS Control Strategy (if EPAS)',
      epic: 'research',
      kind: 'decision',
      status: 'decided',
      decision: 'Dual-bus CAN gateway on the dash Pi: rebroadcast Haltech RPM + speed as Toyota 0x1C4 + 0xB4 frames so the Prius column delivers speed-sensitive assist. The column has a hard-wired IG wake; its behaviour without frames (fixed assist, reduced assist or latched DTC) is to be bench-tested.',
      posts: ['epas-can-gateway'],
      summary: 'Failsafe-mode column EPAS (default, simple) vs ECU-controlled assist over CAN. Chosen: gateway. Implementation lives outside the Godot dash app as a separate systemd service for safety isolation.',
      notes: [
        'Gateway runs as its own systemd service — NOT inside the Godot dash app (UI crash != lose power steering)',
        'Hardware: PiCAN FD Duo Isolated (non-SMPS) HAT replacing the single-channel PiCAN3',
        'Toyota frames (opendbc, Gen 4 Prius): 0x1C4 ENGINE_RPM (0.78125 rpm/bit, no checksum) + 0xB4 SPEED (raw = km/h ÷ 0.01, toyota_checksum in the last byte); rates from a Prius log (verify); confirm on the bench that the column needs no other frames',
        'Failure mode: unknown until bench-tested (possible latched DTC); speed source must be a wheel/driveshaft sensor, not GPS; dual-CAN MCU gateway is the upgrade path',
      ],
    },
    {
      id: 't-decide-quick-release',
      title: 'Decide: Steering Wheel Quick-Release',
      epic: 'research',
      kind: 'decision',
      status: 'planning',
      deferrable: 'Affects only column length + horn-wire strategy. Decide before t-buy-steering-column finalizes.',
      summary: 'Whether to add a quick-release between the steering column and the OEM wheel. Affects column length, horn slip-ring strategy, and ingress/egress geometry.',
    },
    {
      id: 't-decide-arb-front',
      title: 'Decide: Front Anti-Roll Bar Spec',
      epic: 'narrowing',
      kind: 'decision',
      status: 'in-progress',
      summary: 'Front ARB is needed: springs alone give ≈6.5–7° of roll at 0.8 g, and the bars must add ~15.5–33 kN·m/rad to reach 3–4° (see t-decide-arb). Lock diameter + mount geometry now so the frame ships with usable provisions.',
      notes: [
        'Solid bar; diameter TBD from the roll-stiffness target',
        'Mount provisions: bracket tabs welded to frame at front cross-tube',
      ],
    },
  ],

  edges: [
    /* ── Scans feed track / tire / tubbing decisions ── */
    { from: 't-scan-rear',          to: 't-decide-tire-rear',     kind: 'hard' },
    { from: 't-scan-rear',          to: 't-decide-track-rear',    kind: 'hard' },
    { from: 't-scan-rear',          to: 't-decide-tubbing',       kind: 'hard' },
    { from: 't-decide-tubbing',     to: 't-decide-tire-rear',     kind: 'hard', label: 'Fender choice sets max rear tire width.' },
    { from: 't-scan-front',         to: 't-decide-tire-front',    kind: 'hard' },
    { from: 't-scan-front',         to: 't-decide-track-front',   kind: 'hard' },
    { from: 't-decide-tire-rear',   to: 't-decide-track-rear',    kind: 'hard' },
    { from: 't-decide-tire-front',  to: 't-decide-track-front',   kind: 'hard' },
    { from: 't-decide-tubbing',     to: 't-decide-track-rear',    kind: 'hard', label: 'Aesthetic body call sets rear track envelope.' },

    /* Track widths + research feed geometry analysis */
    { from: 't-susp-research',      to: 't-narrowing-analysis',   kind: 'hard' },
    { from: 't-decide-track-front', to: 't-narrowing-analysis',   kind: 'hard' },
    { from: 't-decide-track-rear',  to: 't-narrowing-analysis',   kind: 'hard' },
    { from: 't-narrowing-analysis', to: 't-sa-v2',                kind: 'hard' },
    { from: 't-miata-measurements', to: 't-sa-v2',                kind: 'hard', label: 'Pivot/BJ/rack coords.' },
    { from: 't-scan-donor-miata',   to: 't-sa-v2',                kind: 'hard', label: 'Scanned pickup coords supersede forum CAD.' },
    { from: 't-scan-donor-miata',   to: 't-narrowing-analysis',   kind: 'soft' },
    { from: 't-sa-v2',              to: 't-decide-shocks-front',  kind: 'hard' },
    { from: 't-sa-v2',              to: 't-decide-shocks-rear',   kind: 'hard' },

    /* Rear suspension decision → donor measurements → pickups, diff mounts, half-shafts */
    { from: 't-decide-track-rear',  to: 't-decide-rear-suspension', kind: 'hard' },
    { from: 't-susp-research',      to: 't-decide-rear-suspension', kind: 'soft' },
    { from: 't-decide-rear-suspension', to: 't-buy-miata-rear',     kind: 'hard' },
    { from: 't-decide-rear-suspension', to: 't-buy-rx8-diff',       kind: 'hard' },
    { from: 't-buy-miata-rear',     to: 't-measure-donor-rear',     kind: 'hard' },
    { from: 't-measure-donor-rear', to: 't-sa-v2',                  kind: 'soft', label: 'Rear MR + pickups for the rear model.' },
    { from: 't-measure-donor-rear', to: 't-design-finalization',    kind: 'hard', label: 'Rear pickup coordinates for the cut list.' },
    { from: 't-decide-rear-suspension', to: 't-frame-design',       kind: 'hard', label: 'Rear pickups + diff mounts live in the frame.' },
    { from: 't-buy-wheels',         to: 't-frame-build',           kind: 'hard', label: 'Wheels needed for chassis mockup at ride height.' },
    { from: 't-buy-tires',          to: 't-frame-build',           kind: 'hard', label: 'Tires needed for chassis mockup at ride height.' },
    { from: 't-frame-build',        to: 't-rear-irs-fab',          kind: 'hard', label: 'Brackets go on after the crossmembers.' },
    { from: 't-measure-donor-rear', to: 't-rear-irs-fab',          kind: 'hard', label: `Narrowing amount = hub-face half-width − ${k('rear_hub_face')}.` },
    { from: 't-buy-miata-rear',     to: 't-rear-irs-fab',          kind: 'hard', label: 'Real arms + uprights fitted on the jig.' },
    { from: 't-buy-rx8-diff',       to: 't-rear-irs-fab',          kind: 'hard', label: 'Diff mounts fitted to the real case.' },
    { from: 't-rear-irs-fab',       to: 't-buy-half-shafts',       kind: 'hard', label: 'Half-shaft length measured on the jig.' },
    { from: 't-buy-rx8-diff',       to: 't-buy-half-shafts',       kind: 'hard', label: 'RX-8 output flange spec.' },

    /* Shocks must land before frame design finalizes */
    { from: 't-decide-shocks-front', to: 't-frame-design',        kind: 'hard', label: 'Shock body length sets pickup geometry.' },
    { from: 't-decide-shocks-rear',  to: 't-frame-design',        kind: 'hard', label: 'Shock body length sets pickup geometry.' },
    { from: 't-decide-shocks-front', to: 't-buy-shocks-front',    kind: 'hard' },
    { from: 't-decide-shocks-rear',  to: 't-buy-shocks-rear',     kind: 'hard' },

    /* Engine placement — feeds nearly the whole cabin */
    { from: 't-motor-research',     to: 't-decide-engine-placement', kind: 'hard' },
    { from: 't-design-overview',    to: 't-decide-engine-placement', kind: 'soft' },
    { from: 't-decide-engine-placement', to: 't-exhaust-routing',  kind: 'hard' },
    { from: 't-decide-engine-placement', to: 't-decide-firewall',  kind: 'hard' },
    { from: 't-decide-engine-placement', to: 't-decide-pedal',     kind: 'hard' },
    { from: 't-decide-engine-placement', to: 't-decide-shifter',   kind: 'hard' },
    { from: 't-decide-engine-placement', to: 't-cooling-design',   kind: 'hard' },
    { from: 't-decide-engine-placement', to: 't-intake-piping-design', kind: 'hard' },
    { from: 't-decide-engine-placement', to: 't-frame-design',     kind: 'hard', label: 'Motor mount geometry.' },
    { from: 't-decide-trans',       to: 't-decide-firewall',       kind: 'hard', label: 'Bellhousing length sets firewall plane.' },
    { from: 't-decide-firewall',    to: 't-decide-pedal',          kind: 'soft', label: 'Firewall plane bounds pedal-box envelope.' },

    /* Exhaust routing into other constraints */
    { from: 't-exhaust-routing',    to: 't-decide-pedal',          kind: 'hard' },
    { from: 't-exhaust-routing',    to: 't-decide-steering-route', kind: 'hard' },
    { from: 't-exhaust-routing',    to: 't-decide-seat-position',  kind: 'hard' },
    { from: 't-exhaust-routing',    to: 't-buy-exhaust-system',    kind: 'hard' },
    { from: 't-decide-engine-placement', to: 't-buy-exhaust-manifold', kind: 'hard' },

    /* Firewall + pedals + seat chain */
    { from: 't-decide-firewall',    to: 't-firewall-design',       kind: 'hard' },
    { from: 't-decide-pedal',       to: 't-pedal-box-design',      kind: 'hard' },
    { from: 't-decide-pedal',       to: 't-decide-seat-position',  kind: 'hard' },
    { from: 't-decide-firewall',    to: 't-decide-seat-position',  kind: 'hard' },
    { from: 't-firewall-design',    to: 't-frame-design',          kind: 'soft' },
    { from: 't-pedal-box-design',   to: 't-frame-design',          kind: 'soft' },
    { from: 't-decide-seat-position', to: 't-buy-seats',           kind: 'hard' },
    { from: 't-decide-seat-position', to: 't-frame-design',        kind: 'soft', label: 'Seat mounts on the frame.' },
    { from: 't-buy-seats',          to: 't-design-finalization',   kind: 'hard', label: 'Seats needed for mockup before frame design is locked.' },
    { from: 't-buy-steering-column', to: 't-design-finalization',  kind: 'soft', label: 'Column dimensions inform packaging; hard requirement is steering install after frame-build.' },

    /* Steering routing + EPAS + column purchase */
    { from: 't-steering-research',  to: 't-decide-steering-route', kind: 'hard' },
    { from: 't-decide-firewall',    to: 't-decide-steering-route', kind: 'soft' },
    { from: 't-decide-steering-route', to: 't-steering-rack-design', kind: 'hard' },
    { from: 't-steering-research',  to: 't-buy-steering-column',   kind: 'hard' },
    { from: 't-steering-research',  to: 't-buy-epas',              kind: 'hard' },
    { from: 't-decide-steering-route', to: 't-buy-steering-column', kind: 'hard' },
    { from: 't-steering-rack-design', to: 't-frame-design',        kind: 'soft' },

    /* Transmission + shifter */
    { from: 't-motor-research',     to: 't-decide-trans',          kind: 'hard' },
    { from: 't-decide-trans',       to: 't-decide-shifter',        kind: 'hard' },
    { from: 't-decide-shifter',     to: 't-shifter-design',        kind: 'hard' },
    { from: 't-decide-trans',       to: 't-buy-driveshaft',        kind: 'hard' },
    { from: 't-buy-rx8-diff',       to: 't-buy-driveshaft',        kind: 'hard', label: 'RX-8 pinion flange spec.' },
    { from: 't-decide-engine-placement', to: 't-buy-driveshaft',   kind: 'hard' },

    /* Cooling / intake purchases follow their designs */
    { from: 't-cooling-design',     to: 't-buy-radiator',          kind: 'hard' },
    { from: 't-cooling-design',     to: 't-buy-intercooler',       kind: 'hard' },
    { from: 't-cooling-design',     to: 't-intake-piping-design',  kind: 'hard', label: 'IC and rad fight for airflow.' },
    { from: 't-intake-piping-design', to: 't-buy-intake-piping',   kind: 'hard' },
    { from: 't-cooling-design',     to: 't-frame-design',          kind: 'soft', label: 'Rad mounting points.' },

    /* Brake system */
    { from: 't-decide-brake-system', to: 't-buy-brake-master',     kind: 'hard' },
    { from: 't-decide-brake-system', to: 't-buy-brake-lines',      kind: 'hard' },
    { from: 't-decide-brake-system', to: 't-buy-calipers',         kind: 'hard' },
    { from: 't-decide-brake-system', to: 't-pedal-box-design',     kind: 'soft', label: 'Pedal ratio matches master sizing.' },

    /* ECU + dash → wiring */
    { from: 't-motor-research',     to: 't-buy-ecu',               kind: 'hard' },
    { from: 't-buy-ecu',            to: 't-wiring',                kind: 'hard' },
    { from: 't-digital-dash-design', to: 't-wiring',               kind: 'soft', label: 'Dash CAN tap + 12V/ign feed in harness plan.' },

    /* Teardown feeds CAD */
    { from: 't-teardown',           to: 't-design-overview',       kind: 'hard' },
    { from: 't-teardown',           to: 't-frame-design',          kind: 'soft', label: 'As-built measurements feed the CAD.' },

    /* Frame design → finalization → build */
    { from: 't-frame-design',       to: 't-design-finalization',   kind: 'hard' },
    { from: 't-sa-v2',              to: 't-design-finalization',   kind: 'hard' },
    { from: 't-decide-tubbing',     to: 't-frame-design',          kind: 'soft', label: 'Tub width informs rear rail spacing.' },
    { from: 't-design-finalization', to: 't-buy-metal',            kind: 'hard' },
    { from: 't-frame-design',       to: 't-buy-mandrel-tubes',     kind: 'hard' },
    { from: 't-frame-design',       to: 't-jig-reference-points',  kind: 'hard' },
    { from: 't-frame-jig',          to: 't-jig-reference-points',  kind: 'hard' },
    { from: 't-jig-reference-points', to: 't-frame-build',         kind: 'hard' },
    { from: 't-buy-metal',          to: 't-frame-build',           kind: 'hard' },
    { from: 't-buy-mandrel-tubes',  to: 't-frame-build',           kind: 'hard' },
    { from: 't-design-finalization', to: 't-frame-build',          kind: 'hard' },

    /* Frame → bodywork chain */
    { from: 't-frame-build',        to: 't-firewall-build',        kind: 'hard' },
    { from: 't-firewall-design',    to: 't-firewall-build',        kind: 'hard' },
    { from: 't-frame-build',        to: 't-floor-panels',          kind: 'hard' },
    { from: 't-firewall-build',     to: 't-floor-panels',          kind: 'hard' },
    { from: 't-decide-seat-position', to: 't-floor-panels',        kind: 'soft' },
    { from: 't-decide-tubbing',     to: 't-wheelwell-fab',         kind: 'hard' },
    { from: 't-frame-build',        to: 't-wheelwell-fab',         kind: 'hard' },
    { from: 't-frame-build',        to: 't-body-mount',            kind: 'hard' },
    { from: 't-wheelwell-fab',      to: 't-bodywork',              kind: 'hard' },
    { from: 't-body-mount',         to: 't-bodywork',              kind: 'hard' },

    /* Frame → drivetrain / engine install chain */
    { from: 't-frame-build',        to: 't-engine-install',        kind: 'hard' },
    { from: 't-firewall-build',     to: 't-engine-install',        kind: 'soft' },
    { from: 't-rear-irs-fab',       to: 't-driveline-install',     kind: 'hard' },
    { from: 't-buy-half-shafts',    to: 't-driveline-install',     kind: 'hard' },
    { from: 't-buy-driveshaft',     to: 't-driveline-install',     kind: 'hard' },
    { from: 't-engine-install',     to: 't-driveline-install',     kind: 'hard' },

    /* Engine systems install */
    { from: 't-engine-install',     to: 't-cooling-install',       kind: 'hard' },
    { from: 't-buy-radiator',       to: 't-cooling-install',       kind: 'hard' },
    { from: 't-buy-intercooler',    to: 't-cooling-install',       kind: 'hard' },
    { from: 't-engine-install',     to: 't-intake-install',        kind: 'hard' },
    { from: 't-buy-intake-piping',  to: 't-intake-install',        kind: 'hard' },
    { from: 't-engine-install',     to: 't-exhaust-install',       kind: 'hard' },
    { from: 't-buy-exhaust-manifold', to: 't-exhaust-install',     kind: 'hard' },
    { from: 't-buy-exhaust-system', to: 't-exhaust-install',       kind: 'hard' },
    { from: 't-engine-install',     to: 't-wiring',                kind: 'hard' },
    { from: 't-engine-install',     to: 't-fuel-install',          kind: 'soft', label: 'Rail flex-line connection.' },

    /* Brake install */
    { from: 't-frame-build',        to: 't-brake-install',         kind: 'hard' },
    { from: 't-firewall-build',     to: 't-brake-install',         kind: 'hard', label: 'Masters mount on firewall.' },
    { from: 't-buy-brake-master',   to: 't-brake-install',         kind: 'hard' },
    { from: 't-buy-brake-lines',    to: 't-brake-install',         kind: 'hard' },
    { from: 't-buy-brake-lines',    to: 't-brake-lines-fab',       kind: 'hard' },
    { from: 't-buy-prop-valve',     to: 't-brake-lines-fab',       kind: 'hard' },
    { from: 't-frame-build',        to: 't-brake-lines-fab',       kind: 'hard', label: 'Lines route along frame rails.' },
    { from: 't-brake-lines-fab',    to: 't-brake-install',         kind: 'hard' },
    { from: 't-buy-calipers',       to: 't-brake-install',         kind: 'hard' },
    { from: 't-pedal-box-design',   to: 't-brake-install',         kind: 'soft' },

    /* First-start gating */
    { from: 't-cooling-install',    to: 't-engine-startup',        kind: 'hard' },
    { from: 't-intake-install',     to: 't-engine-startup',        kind: 'hard' },
    { from: 't-exhaust-install',    to: 't-engine-startup',        kind: 'hard' },
    { from: 't-wiring',             to: 't-engine-startup',        kind: 'hard' },
    { from: 't-brake-install',      to: 't-engine-startup',        kind: 'hard' },
    { from: 't-driveline-install',  to: 't-engine-startup',        kind: 'hard' },

    /* Finishing — strictly post-startup, runs in parallel */
    { from: 't-engine-startup',     to: 't-non-engine-wiring',     kind: 'soft' },
    { from: 't-bodywork',           to: 't-non-engine-wiring',     kind: 'soft' },
    { from: 't-bodywork',           to: 't-door-panels',           kind: 'hard' },
    { from: 't-bodywork',           to: 't-sound-dampening',       kind: 'soft' },
    { from: 't-firewall-build',     to: 't-heat-shielding',        kind: 'hard' },
    { from: 't-exhaust-install',    to: 't-heat-shielding',        kind: 'hard' },

    /* Fuel system */
    { from: 't-motor-research',     to: 't-fuel-design',           kind: 'hard' },
    { from: 't-design-overview',    to: 't-fuel-design',           kind: 'soft' },
    { from: 't-fuel-design',        to: 't-prep-fuel-tank',        kind: 'hard' },
    { from: 't-fuel-design',        to: 't-buy-fuel-pump',         kind: 'soft' },
    { from: 't-fuel-design',        to: 't-buy-fuel-lines',        kind: 'hard' },
    { from: 't-fuel-design',        to: 't-frame-design',          kind: 'soft', label: 'Tank location may need frame mounts.' },
    { from: 't-frame-build',        to: 't-fuel-install',          kind: 'hard' },
    { from: 't-prep-fuel-tank',     to: 't-fuel-install',          kind: 'hard' },
    { from: 't-buy-fuel-pump',      to: 't-fuel-install',          kind: 'hard' },
    { from: 't-buy-fuel-lines',     to: 't-fuel-install',          kind: 'hard' },
    { from: 't-fuel-install',       to: 't-engine-startup',        kind: 'hard' },

    /* Charging / battery */
    { from: 't-design-overview',    to: 't-charging-design',       kind: 'soft' },
    { from: 't-charging-design',    to: 't-buy-battery',           kind: 'hard' },
    { from: 't-charging-design',    to: 't-buy-kill-switch',       kind: 'hard' },
    { from: 't-charging-design',    to: 't-wiring',                kind: 'hard' },
    { from: 't-buy-battery',        to: 't-wiring',                kind: 'hard' },
    { from: 't-buy-kill-switch',    to: 't-wiring',                kind: 'soft' },
    { from: 't-buy-battery',        to: 't-engine-startup',        kind: 'hard' },
    { from: 't-buy-kill-switch',    to: 't-engine-startup',        kind: 'hard' },

    /* Dash chain: hardware + software → CAN integration → install */
    { from: 't-digital-dash-design', to: 't-dash-hardware',         kind: 'soft' },
    { from: 't-digital-dash-design', to: 't-dash-software',         kind: 'soft' },
    { from: 't-dash-hardware',       to: 't-dash-haltech-integration', kind: 'hard' },
    { from: 't-dash-software',       to: 't-dash-haltech-integration', kind: 'hard' },
    { from: 't-decide-ecu',          to: 't-dash-haltech-integration', kind: 'hard', label: 'CAN broadcast spec set by ECU choice.' },
    { from: 't-buy-ecu',             to: 't-dash-haltech-integration', kind: 'soft', label: 'Friend\'s Haltech can stand in temporarily.' },
    { from: 't-dash-bezel-scan',     to: 't-dash-shroud',           kind: 'hard' },
    { from: 't-dash-hardware',       to: 't-dash-shroud',           kind: 'soft', label: 'Shroud envelopes the real Pi/screen stack.' },
    { from: 't-dash-haltech-integration', to: 't-dash-install',     kind: 'hard' },
    { from: 't-dash-shroud',         to: 't-dash-install',          kind: 'hard' },
    { from: 't-frame-build',        to: 't-dash-install',          kind: 'hard' },
    { from: 't-firewall-build',     to: 't-dash-install',          kind: 'soft' },
    { from: 't-wiring',             to: 't-dash-install',          kind: 'hard' },
    { from: 't-dash-install',       to: 't-engine-startup',        kind: 'soft' },

    /* EPAS CAN gateway chain (dual-bus Pi). */
    { from: 't-decide-epas-control', to: 't-buy-can-hat-duo',      kind: 'hard' },
    { from: 't-decide-epas-control', to: 't-epas-gateway-software', kind: 'hard' },
    { from: 't-buy-can-hat-duo',    to: 't-dash-fdduo-swap',       kind: 'hard' },
    { from: 't-dash-hardware',      to: 't-dash-fdduo-swap',       kind: 'hard', label: 'Dual-CAN bringup runs on the Phase 2 hardware stack.' },
    { from: 't-dash-fdduo-swap',    to: 't-epas-gateway-bench',    kind: 'hard' },
    { from: 't-epas-gateway-software', to: 't-epas-gateway-bench', kind: 'hard' },
    { from: 't-buy-epas',           to: 't-epas-gateway-bench',    kind: 'hard', label: 'Column needs to be on the bench for assist validation.' },
    { from: 't-decide-ecu',         to: 't-epas-gateway-software', kind: 'hard', label: 'Haltech CAN broadcast spec defines the input frames.' },
    { from: 't-epas-gateway-bench', to: 't-epas-install',          kind: 'hard', label: 'Gateway must be bench-validated before in-car install.' },
    { from: 't-dash-fdduo-swap',    to: 't-dash-install',          kind: 'soft', label: 'FD Duo swap can land before or after dash physical install.' },

    /* Paint */
    { from: 't-bodywork',           to: 't-paint',                 kind: 'hard' },
    { from: 't-paint',              to: 't-final-reassembly',      kind: 'hard' },
    { from: 't-final-reassembly',   to: 't-reupholstery',          kind: 'soft' },
    { from: 't-final-reassembly',   to: 't-door-panels',           kind: 'soft' },

    /* HVAC */
    { from: 't-decide-firewall',    to: 't-hvac-design',           kind: 'hard' },
    { from: 't-decide-engine-placement', to: 't-hvac-design',      kind: 'soft' },
    { from: 't-hvac-design',        to: 't-buy-hvac',              kind: 'hard' },
    { from: 't-hvac-design',        to: 't-firewall-design',       kind: 'soft', label: 'Heater core passthrough.' },
    { from: 't-firewall-build',     to: 't-hvac-install',          kind: 'hard' },
    { from: 't-buy-hvac',           to: 't-hvac-install',          kind: 'hard' },
    { from: 't-cooling-install',    to: 't-hvac-install',          kind: 'soft', label: 'Heater core taps cooling system.' },

    /* Shakedown */
    { from: 't-engine-startup',     to: 't-alignment',             kind: 'hard' },
    { from: 't-driveline-install',  to: 't-alignment',             kind: 'hard' },

    /* Steering rack chain */
    { from: 't-steering-research',  to: 't-buy-steering-rack',     kind: 'hard' },
    { from: 't-buy-steering-rack',  to: 't-narrow-steering-rack',  kind: 'hard' },
    { from: 't-steering-rack-design', to: 't-narrow-steering-rack', kind: 'hard' },
    { from: 't-decide-track-front', to: 't-narrow-steering-rack',  kind: 'hard', label: 'Front-track delta sets cut length.' },
    { from: 't-narrow-steering-rack', to: 't-steering-install',    kind: 'hard' },
    { from: 't-buy-steering-column', to: 't-steering-install',     kind: 'hard' },
    { from: 't-buy-steering-column', to: 't-steering-wheel-adapt', kind: 'hard', label: 'Column shaft spec sets hub adapter.' },
    { from: 't-steering-wheel-adapt', to: 't-steering-install',     kind: 'hard' },
    { from: 't-decide-steering-route', to: 't-steering-install',   kind: 'hard' },
    { from: 't-frame-build',        to: 't-steering-install',      kind: 'hard' },
    { from: 't-steering-install',   to: 't-engine-startup',        kind: 'soft', label: 'Need to drive it.' },

    /* EPAS install (when applicable) */
    { from: 't-buy-epas',           to: 't-epas-install',          kind: 'hard' },
    { from: 't-frame-build',        to: 't-epas-install',          kind: 'hard' },
    { from: 't-wiring',             to: 't-epas-install',          kind: 'soft' },
    { from: 't-epas-install',       to: 't-steering-install',      kind: 'soft' },

    /* Front suspension hardware */
    { from: 't-sa-v2',              to: 't-buy-control-arms',      kind: 'hard', label: 'Geometry locks arm length / pivot.' },
    { from: 't-sa-v2',              to: 't-buy-hubs-spindles',     kind: 'hard', label: 'Geometry locks spindle/hub spec.' },
    { from: 't-buy-control-arms',   to: 't-suspension-install-front', kind: 'hard' },
    { from: 't-buy-hubs-spindles',  to: 't-suspension-install-front', kind: 'hard' },
    { from: 't-buy-shocks-front',   to: 't-suspension-install-front', kind: 'hard' },
    { from: 't-frame-build',        to: 't-suspension-install-front', kind: 'hard' },

    /* Rear suspension hardware */
    { from: 't-buy-shocks-rear',    to: 't-suspension-install-rear', kind: 'hard' },
    { from: 't-rear-irs-fab',       to: 't-suspension-install-rear', kind: 'hard' },
    { from: 't-buy-half-shafts',    to: 't-suspension-install-rear', kind: 'hard' },
    { from: 't-frame-build',        to: 't-suspension-install-rear', kind: 'hard' },

    { from: 't-suspension-install-front', to: 't-alignment',       kind: 'hard' },
    { from: 't-suspension-install-rear',  to: 't-alignment',       kind: 'hard' },
    { from: 't-suspension-install-front', to: 't-engine-startup',  kind: 'soft', label: 'Has to roll.' },
    { from: 't-suspension-install-rear',  to: 't-engine-startup',  kind: 'soft', label: 'Has to roll.' },

    /* Engine + clutch hardware */
    { from: 't-motor-research',     to: 't-buy-engine',            kind: 'hard' },
    { from: 't-buy-engine',         to: 't-engine-install',        kind: 'hard' },
    { from: 't-decide-trans',       to: 't-buy-clutch',            kind: 'hard' },
    { from: 't-decide-trans',       to: 't-buy-clutch-hyd',        kind: 'hard' },
    { from: 't-buy-clutch',         to: 't-engine-install',        kind: 'hard' },
    { from: 't-buy-clutch-hyd',     to: 't-clutch-install',        kind: 'hard' },
    { from: 't-pedal-box-design',   to: 't-clutch-install',        kind: 'soft' },
    { from: 't-engine-install',     to: 't-clutch-install',        kind: 'hard' },
    { from: 't-clutch-install',     to: 't-engine-startup',        kind: 'soft' },

    /* Brake decisions feed brake design */
    { from: 't-decide-power-brakes', to: 't-decide-brake-system',  kind: 'hard', label: 'Booster vs manual sizes the master.' },
    { from: 't-decide-ebrake',      to: 't-decide-brake-system',   kind: 'soft', label: 'Rear calipers carry the parking brake.' },
    { from: 't-decide-power-brakes', to: 't-pedal-box-design',     kind: 'soft', label: 'Booster vs manual sets pedal ratio.' },

    /* E-brake chain */
    { from: 't-decide-ebrake',      to: 't-buy-ebrake',            kind: 'hard' },
    { from: 't-buy-ebrake',         to: 't-ebrake-install',        kind: 'hard' },
    { from: 't-frame-build',        to: 't-ebrake-install',        kind: 'hard' },
    { from: 't-ebrake-install',     to: 't-alignment',             kind: 'soft' },

    /* Seats install */
    { from: 't-buy-seats',          to: 't-seats-install',         kind: 'hard' },
    { from: 't-buy-harnesses',      to: 't-seats-install',         kind: 'hard' },
    { from: 't-frame-build',        to: 't-seats-install',         kind: 'hard' },
    { from: 't-seats-install',      to: 't-engine-startup',        kind: 'soft', label: 'Driver has to sit in it.' },

    /* Transmission feeds frame + tunnel */
    { from: 't-decide-trans',       to: 't-frame-design',          kind: 'soft', label: 'Tunnel sized for CD009 envelope; either trans fits without frame rework.' },
    { from: 't-shifter-design',     to: 't-floor-panels',          kind: 'soft' },
    { from: 't-buy-engine',         to: 't-decide-engine-placement', kind: 'soft', label: 'Physical mockup informs CAD.' },

    /* Trans crossmember */
    { from: 't-frame-build',        to: 't-trans-crossmember',     kind: 'hard' },
    { from: 't-decide-trans',       to: 't-trans-crossmember',     kind: 'hard' },
    { from: 't-decide-engine-placement', to: 't-trans-crossmember', kind: 'hard' },
    { from: 't-trans-crossmember',  to: 't-engine-install',        kind: 'hard' },

    /* Cooling extras */
    { from: 't-cooling-design',     to: 't-buy-cooling-fans',      kind: 'hard' },
    { from: 't-cooling-design',     to: 't-buy-coolant-hoses',     kind: 'hard' },
    { from: 't-cooling-design',     to: 't-buy-oil-cooler',        kind: 'hard' },
    { from: 't-buy-cooling-fans',   to: 't-cooling-install',       kind: 'hard' },
    { from: 't-buy-coolant-hoses',  to: 't-cooling-install',       kind: 'hard' },
    { from: 't-buy-oil-cooler',     to: 't-cooling-install',       kind: 'hard' },

    /* Catch can + throttle */
    { from: 't-decide-engine-placement', to: 't-buy-catch-can',    kind: 'hard' },
    { from: 't-buy-catch-can',      to: 't-engine-install',        kind: 'soft' },
    { from: 't-decide-pedal',       to: 't-buy-dbw-pedal',         kind: 'hard' },
    { from: 't-buy-dbw-pedal',      to: 't-engine-install',        kind: 'soft' },

    /* Wheels & tires */
    { from: 't-decide-tire-front',  to: 't-buy-tires',             kind: 'hard' },
    { from: 't-decide-tire-rear',   to: 't-buy-tires',             kind: 'hard' },
    { from: 't-decide-track-front', to: 't-buy-wheels',            kind: 'hard' },
    { from: 't-decide-track-rear',  to: 't-buy-wheels',            kind: 'hard' },
    { from: 't-narrowing-analysis', to: 't-buy-wheels',            kind: 'hard', label: 'Offset/backspacing.' },
    { from: 't-buy-wheels',         to: 't-suspension-install-front', kind: 'hard' },
    { from: 't-buy-wheels',         to: 't-suspension-install-rear',  kind: 'hard' },
    { from: 't-buy-tires',          to: 't-alignment',             kind: 'hard' },

    /* Anti-roll bars */
    { from: 't-sa-v2',              to: 't-decide-arb',            kind: 'hard' },
    { from: 't-decide-arb',         to: 't-frame-design',          kind: 'soft', label: 'ARB mount nodes.' },
    { from: 't-decide-arb',         to: 't-buy-arb',               kind: 'hard' },
    { from: 't-buy-arb',            to: 't-suspension-install-front', kind: 'hard' },
    { from: 't-buy-arb',            to: 't-suspension-install-rear',  kind: 'hard' },

    /* Exterior lighting */
    { from: 't-charging-design',    to: 't-buy-lighting',          kind: 'soft' },
    { from: 't-buy-lighting',       to: 't-lighting-install',      kind: 'hard' },
    { from: 't-non-engine-wiring',  to: 't-lighting-install',      kind: 'hard' },
    { from: 't-final-reassembly',   to: 't-lighting-install',      kind: 'soft' },

    /* Glass & weatherstripping */
    { from: 't-buy-glass-seals',    to: 't-final-reassembly',      kind: 'hard' },
    { from: 't-bodywork',           to: 't-buy-glass-seals',       kind: 'soft' },

    /* Wipers / mirrors */
    { from: 't-buy-wipers',         to: 't-wipers-install',        kind: 'hard' },
    { from: 't-non-engine-wiring',  to: 't-wipers-install',        kind: 'hard' },
    { from: 't-final-reassembly',   to: 't-wipers-install',        kind: 'soft' },

    /* Proportioning valve */
    { from: 't-decide-brake-system', to: 't-buy-prop-valve',       kind: 'hard' },
    { from: 't-buy-prop-valve',     to: 't-brake-install',         kind: 'hard' },

    /* SR20 prep */
    { from: 't-buy-engine',         to: 't-engine-prep',           kind: 'hard' },
    { from: 't-engine-prep',        to: 't-engine-install',        kind: 'hard' },

    /* Final drive (ratio + LSD) */
    { from: 't-decide-trans',       to: 't-decide-final-drive',    kind: 'hard', label: 'Trans gearing sets ratio target.' },
    { from: 't-buy-rx8-diff',       to: 't-decide-final-drive',    kind: 'soft', label: 'Verify the ratio on the unit bought.' },
    { from: 't-decide-final-drive', to: 't-driveline-install',     kind: 'hard' },

    /* Pinion angle setup → driveshaft measurement */
    { from: 't-frame-build',        to: 't-pinion-angle-setup',    kind: 'hard' },
    { from: 't-rear-irs-fab',       to: 't-pinion-angle-setup',    kind: 'hard', label: 'Diff mounts set the pinion angle.' },
    { from: 't-engine-mockup-on-frame', to: 't-pinion-angle-setup', kind: 'hard', label: 'Engine/trans at 3° tail-down.' },
    { from: 't-pinion-angle-setup', to: 't-buy-driveshaft',        kind: 'hard', label: 'Length measured after pinion is set.' },

    /* Bump-steer validation */
    { from: 't-steering-install',   to: 't-bump-steer-check',      kind: 'hard' },
    { from: 't-suspension-install-front', to: 't-bump-steer-check', kind: 'hard' },
    { from: 't-bump-steer-check',   to: 't-alignment',             kind: 'hard' },

    /* Driveshaft safety loop */
    { from: 't-frame-build',        to: 't-driveshaft-loop',       kind: 'hard' },
    { from: 't-driveshaft-loop',    to: 't-driveline-install',     kind: 'hard' },

    /* Initial tune */
    { from: 't-engine-startup',     to: 't-engine-tune',           kind: 'hard' },
    { from: 't-engine-tune',        to: 't-alignment',             kind: 'soft', label: 'Need running engine for corner-balance.' },

    /* Registration */
    { from: 't-final-reassembly',   to: 't-registration',          kind: 'hard' },
    { from: 't-alignment',          to: 't-registration',          kind: 'hard' },
    { from: 't-engine-tune',        to: 't-registration',          kind: 'hard' },
    { from: 't-driveshaft-loop',    to: 't-registration',          kind: 'soft' },
    { from: 't-lighting-install',   to: 't-registration',          kind: 'hard' },
    { from: 't-wipers-install',     to: 't-registration',          kind: 'hard' },

    /* Turbo decision → manifold + exhaust + cooling + firewall */
    { from: 't-decide-engine-placement', to: 't-decide-turbo',     kind: 'soft' },
    { from: 't-decide-turbo',       to: 't-buy-exhaust-manifold',  kind: 'hard' },
    { from: 't-decide-turbo',       to: 't-exhaust-routing',       kind: 'hard', label: 'Turbo outlet sets DP path.' },
    { from: 't-decide-turbo',       to: 't-cooling-design',        kind: 'soft', label: 'Charge-air heat load.' },
    { from: 't-decide-turbo',       to: 't-decide-firewall',       kind: 'soft', label: 'Manifold reach informs firewall cuts.' },
    { from: 't-decide-turbo',       to: 't-intake-piping-design',  kind: 'hard' },

    /* Body / cage / NVH decisions */
    { from: 't-decide-cage',        to: 't-frame-design',          kind: 'soft', label: 'Cage mount provisions.' },
    { from: 't-decide-cage',        to: 't-buy-harnesses',         kind: 'soft' },
    { from: 't-decide-body-mounting', to: 't-frame-design',        kind: 'hard', label: 'Welded vs rubber changes rail geometry.' },
    { from: 't-decide-body-mounting', to: 't-body-mount',          kind: 'hard' },

    /* Harness strategy */
    { from: 't-decide-harness-strategy', to: 't-wiring',           kind: 'hard' },
    { from: 't-decide-harness-strategy', to: 't-non-engine-wiring', kind: 'hard' },

    /* AC scope */
    { from: 't-decide-ac-scope',    to: 't-hvac-design',           kind: 'hard' },
    { from: 't-decide-ac-scope',    to: 't-cooling-design',        kind: 'soft', label: 'Condenser fights for grille airflow.' },

    /* Battery location */
    { from: 't-decide-battery-location', to: 't-charging-design',  kind: 'hard' },
    { from: 't-decide-battery-location', to: 't-buy-battery',      kind: 'soft', label: 'Location drives cable spec.' },
    { from: 't-decide-battery-location', to: 't-frame-design',     kind: 'soft', label: 'Battery tray mount tabs.' },

    /* ECU */
    { from: 't-decide-ecu',         to: 't-buy-ecu',               kind: 'hard' },
    { from: 't-decide-ecu',         to: 't-decide-harness-strategy', kind: 'soft' },

    /* Pedal box install */
    { from: 't-firewall-build',     to: 't-pedal-box-install',     kind: 'hard' },
    { from: 't-pedal-box-design',   to: 't-pedal-box-install',     kind: 'hard' },
    { from: 't-pedal-box-install',  to: 't-brake-install',         kind: 'hard' },
    { from: 't-pedal-box-install',  to: 't-clutch-install',        kind: 'hard' },

    /* Shifter install */
    { from: 't-shifter-design',     to: 't-shifter-install',       kind: 'hard' },
    { from: 't-trans-crossmember',  to: 't-shifter-install',       kind: 'hard' },
    { from: 't-shifter-install',    to: 't-engine-startup',        kind: 'soft', label: 'Need to select gears.' },

    /* Fuel leak test */
    { from: 't-fuel-install',       to: 't-fuel-leak-test',        kind: 'hard' },
    { from: 't-fuel-leak-test',     to: 't-engine-startup',        kind: 'hard', label: 'Pressure-hold before first crank.' },

    /* Horn install */
    { from: 't-non-engine-wiring',  to: 't-horn-install',          kind: 'hard' },
    { from: 't-horn-install',       to: 't-registration',          kind: 'hard' },

    /* ── Body / rust prep (added after audit) ── */
    { from: 't-teardown',           to: 't-rough-clean-body',      kind: 'hard' },
    { from: 't-rough-clean-body',   to: 't-media-blast-body',      kind: 'hard' },
    { from: 't-media-blast-body',   to: 't-rust-repair-body',      kind: 'hard' },
    { from: 't-rust-repair-body',   to: 't-bodywork',              kind: 'hard' },

    /* Frame coatings sit between frame-build and engine drop. */
    { from: 't-frame-build',        to: 't-frame-coatings',        kind: 'hard' },
    { from: 't-frame-coatings',     to: 't-engine-install',        kind: 'hard', label: 'Coat frame BEFORE engine drops in.' },

    /* Post-paint corrosion protection feeds final reassembly. */
    { from: 't-paint',              to: 't-seam-sealer-undercoat', kind: 'hard' },
    { from: 't-paint',              to: 't-cavity-wax',            kind: 'hard' },
    { from: 't-seam-sealer-undercoat', to: 't-final-reassembly',   kind: 'hard' },
    { from: 't-cavity-wax',         to: 't-final-reassembly',      kind: 'hard' },

    /* ── Integration / fitment-check nodes (added after audit) ── */
    { from: 't-frame-build',        to: 't-engine-mockup-on-frame', kind: 'hard' },
    { from: 't-buy-engine',         to: 't-engine-mockup-on-frame', kind: 'hard' },
    { from: 't-engine-mockup-on-frame', to: 't-engine-install',     kind: 'hard' },
    { from: 't-engine-mockup-on-frame', to: 't-trans-crossmember',  kind: 'hard', label: 'Crossmember welds against the trans in its real position.' },

    { from: 't-frame-build',        to: 't-frame-postweld-scan',    kind: 'hard' },
    { from: 't-frame-postweld-scan', to: 't-suspension-install-front', kind: 'soft' },
    { from: 't-frame-postweld-scan', to: 't-suspension-install-rear',  kind: 'soft' },

    { from: 't-body-mount',         to: 't-body-trial-fit',         kind: 'hard' },
    { from: 't-body-trial-fit',     to: 't-bodywork',               kind: 'hard' },

    { from: 't-decide-ecu',         to: 't-harness-routing-review', kind: 'soft' },
    { from: 't-firewall-build',     to: 't-harness-routing-review', kind: 'hard' },
    { from: 't-harness-routing-review', to: 't-wiring',             kind: 'hard' },

    { from: 't-cooling-design',     to: 't-cooling-stack-fit',      kind: 'hard' },
    { from: 't-body-trial-fit',     to: 't-cooling-stack-fit',      kind: 'soft', label: 'Real grille opening is the source of truth.' },
    { from: 't-cooling-stack-fit',  to: 't-buy-cooling-fans',       kind: 'soft' },
    { from: 't-cooling-stack-fit',  to: 't-cooling-install',        kind: 'hard' },

    /* ── Promoted from notes (added after audit) ── */
    /* Fuel architecture decision drives plumbing scope. */
    { from: 't-decide-fuel-architecture', to: 't-fuel-design',      kind: 'hard' },
    { from: 't-decide-fuel-architecture', to: 't-buy-fuel-lines',   kind: 'hard' },
    { from: 't-decide-fuel-architecture', to: 't-prep-fuel-tank',   kind: 'hard' },

    /* EPAS control strategy decision drives ECU/harness scope. */
    { from: 't-steering-research',  to: 't-decide-steering-assist', kind: 'hard' },
    { from: 't-decide-steering-assist', to: 't-decide-epas-control', kind: 'hard', label: 'Only if EPAS is chosen.' },
    { from: 't-decide-steering-assist', to: 't-buy-steering-column', kind: 'hard', label: 'Manual or EPAS sets which column to buy.' },
    { from: 't-decide-steering-assist', to: 't-buy-epas',            kind: 'hard' },
    { from: 't-decide-epas-control', to: 't-buy-steering-column',   kind: 'hard' },
    { from: 't-decide-epas-control', to: 't-decide-ecu',            kind: 'soft' },

    /* Quick-release decision drives column length. */
    { from: 't-steering-research',  to: 't-decide-quick-release',   kind: 'soft' },
    { from: 't-decide-quick-release', to: 't-buy-steering-column',  kind: 'hard' },
    { from: 't-decide-quick-release', to: 't-steering-wheel-adapt', kind: 'hard' },

    /* Front ARB now its own decision (rear stays in t-decide-arb). */
    { from: 't-sa-v2',              to: 't-decide-arb-front',       kind: 'soft' },
    { from: 't-decide-arb-front',   to: 't-frame-design',           kind: 'soft', label: 'Front ARB mount tabs welded to frame.' },
    { from: 't-decide-arb-front',   to: 't-buy-arb',                kind: 'hard' },

    /* Brake hydraulic spec gates master purchase + pedal box. */
  ],
};

/* ── Helpers ──────────────────────────────────────── */

const taskMap = new Map(roadmap.tasks.map((t) => [t.id, t]));

export function getTask(id: TaskId): RoadmapTask | undefined {
  return taskMap.get(id);
}

export function incomingEdges(id: TaskId): RoadmapEdge[] {
  return roadmap.edges.filter((e) => e.to === id);
}

export function outgoingEdges(id: TaskId): RoadmapEdge[] {
  return roadmap.edges.filter((e) => e.from === id);
}

/* ── Bottleneck ranking ───────────────────────────────
   For each task, compute a score that combines:
     • how many incomplete tasks it transitively gates via hard edges, and
     • how soon those tasks land in the build (their topological depth).

   A purchase that gates a near-term task (low depth) is more urgent than
   one that only gates a far-future task, even if the count is similar.

   score(t) = sum over incomplete hard descendants v of 100 / (1 + depth(v))

   `bottleneckCount` is exposed separately for tooltips.
   ──────────────────────────────────────────────────── */

// Topological depth over the full graph (longest path from any root).
const fullDepth: Map<TaskId, number> = (() => {
  const depth = new Map<TaskId, number>();
  const indeg = new Map<TaskId, number>();
  const adj = new Map<TaskId, TaskId[]>();
  for (const t of roadmap.tasks) {
    indeg.set(t.id, 0);
    adj.set(t.id, []);
    depth.set(t.id, 0);
  }
  for (const e of roadmap.edges) {
    if (!indeg.has(e.from) || !indeg.has(e.to)) continue;
    adj.get(e.from)!.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  const q: TaskId[] = [];
  for (const [id, n] of indeg) if (n === 0) q.push(id);
  while (q.length > 0) {
    const u = q.shift()!;
    const du = depth.get(u) ?? 0;
    for (const v of adj.get(u) ?? []) {
      depth.set(v, Math.max(depth.get(v) ?? 0, du + 1));
      indeg.set(v, (indeg.get(v) ?? 0) - 1);
      if ((indeg.get(v) ?? 0) === 0) q.push(v);
    }
  }
  return depth;
})();

const hardSucc = new Map<TaskId, TaskId[]>();
for (const t of roadmap.tasks) hardSucc.set(t.id, []);
for (const e of roadmap.edges) {
  if (e.kind === 'hard' && hardSucc.has(e.from) && taskMap.has(e.to)) {
    hardSucc.get(e.from)!.push(e.to);
  }
}

/** Raw count of hard incomplete descendants. */
export const bottleneckCount: Map<TaskId, number> = new Map();
/** Urgency-weighted score (see header). */
export const bottleneckScores: Map<TaskId, number> = new Map();

for (const t of roadmap.tasks) {
  if (t.status === 'complete' || t.status === 'decided') {
    bottleneckCount.set(t.id, 0);
    bottleneckScores.set(t.id, 0);
    continue;
  }
  const seen = new Set<TaskId>();
  const queue: TaskId[] = [t.id];
  let score = 0;
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const v of hardSucc.get(u) ?? []) {
      if (seen.has(v)) continue;
      const vt = taskMap.get(v);
      if (!vt) continue;
      seen.add(v);
      if (vt.status !== 'complete' && vt.status !== 'decided') {
        const d = fullDepth.get(v) ?? 0;
        // Weight: closer-to-the-root tasks are more urgent.
        score += 100 / (1 + d);
        queue.push(v);
      }
    }
  }
  bottleneckCount.set(t.id, seen.size);
  bottleneckScores.set(t.id, Math.round(score));
}

/** Maximum bottleneck score across purchase tasks — used to scale UI tiers. */
export const maxPurchaseBottleneck: number = (() => {
  let m = 0;
  for (const t of roadmap.tasks) {
    const k = t.kind ?? (t.id.startsWith('t-decide-') ? 'decision' : 'task');
    if (k !== 'purchase') continue;
    const s = bottleneckScores.get(t.id) ?? 0;
    if (s > m) m = s;
  }
  return m;
})();

/** Tier 0 = none, 1 = low, 2 = mid, 3 = high. Computed against purchase max. */
export function bottleneckTier(id: TaskId): 0 | 1 | 2 | 3 {
  const s = bottleneckScores.get(id) ?? 0;
  if (s <= 0 || maxPurchaseBottleneck <= 0) return 0;
  const r = s / maxPurchaseBottleneck;
  if (r >= 0.66) return 3;
  if (r >= 0.33) return 2;
  return 1;
}

/* ── Purchase priority ranking ─────────────────────────
   Purchases ranked 1..N where 1 = buy first. Sorted by
   bottleneckScores DESC (= most-urgent first). Ties get
   the same rank (standard competition ranking: 1, 2, 2, 4).
   Already-complete purchases get rank 0 (not shown).

   Tiebreak inside identical scores: shallower-depth task
   first (closer to the root → needed sooner in the build).
   ──────────────────────────────────────────────────── */

const purchaseRankMap = new Map<TaskId, number>();
(() => {
  const purchases = roadmap.tasks
    .filter((t) => {
      const k = t.kind ?? (t.id.startsWith('t-decide-') ? 'decision' : 'task');
      return k === 'purchase';
    })
    .filter((t) => t.status !== 'complete' && t.status !== 'decided')
    .filter((t) => (bottleneckCount.get(t.id) ?? 0) > 0)
    .map((t) => ({
      id: t.id,
      score: bottleneckScores.get(t.id) ?? 0,
      depth: fullDepth.get(t.id) ?? 0,
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.depth - b.depth;
    });

  // Competition ranking: same score → same rank, next distinct score skips.
  let lastScore = Infinity;
  let lastRank = 0;
  for (let i = 0; i < purchases.length; i++) {
    const p = purchases[i];
    if (p.score !== lastScore) {
      lastRank = i + 1;
      lastScore = p.score;
    }
    purchaseRankMap.set(p.id, lastRank);
  }
})();

/** Buy-order rank for a purchase task. 1 = buy first. 0 = not ranked. */
export function purchaseRank(id: TaskId): number {
  return purchaseRankMap.get(id) ?? 0;
}

/* ── Top blockers ─────────────────────────────────────
   "Top N" tasks that are CURRENTLY ACTIONABLE (all hard
   incoming deps complete/decided) AND gate the most/soonest
   downstream work. These are the "what should I do next"
   highlights — surfaced in the UI with a vivid border.

   Selection:
     1. status not complete/decided
     2. all hard upstream deps are complete/decided
     3. bottleneckCount > 0  (must actually block something)
     4. not marked `deferrable` (those can be figured out
        during the build — they don't belong in "do next")
     5. sort by bottleneckScores desc, take top N

   Tiebreak: prefer decision > task > purchase (decisions
   unblock thinking before they unblock fab).
   ──────────────────────────────────────────────────── */

const TOP_BLOCKER_N = 5;

const incomingByTask = new Map<TaskId, RoadmapEdge[]>();
for (const t of roadmap.tasks) incomingByTask.set(t.id, []);
for (const e of roadmap.edges) {
  if (incomingByTask.has(e.to)) incomingByTask.get(e.to)!.push(e);
}

function isActionable(t: RoadmapTask): boolean {
  if (t.status === 'complete' || t.status === 'decided') return false;
  for (const e of incomingByTask.get(t.id) ?? []) {
    if (e.kind !== 'hard') continue;
    const up = taskMap.get(e.from);
    if (!up) continue;
    if (up.status !== 'complete' && up.status !== 'decided') return false;
  }
  return true;
}

function kindRank(t: RoadmapTask): number {
  const k = t.kind ?? (t.id.startsWith('t-decide-') ? 'decision' : 'task');
  if (k === 'decision') return 0;
  if (k === 'purchase') return 2;
  return 1;
}

const topBlockerList: RoadmapTask[] = roadmap.tasks
  .filter(isActionable)
  .filter((t) => (bottleneckCount.get(t.id) ?? 0) > 0)
  .filter((t) => !t.deferrable)
  .sort((a, b) => {
    const ds = (bottleneckScores.get(b.id) ?? 0) - (bottleneckScores.get(a.id) ?? 0);
    if (ds !== 0) return ds;
    return kindRank(a) - kindRank(b);
  })
  .slice(0, TOP_BLOCKER_N);

/** Ordered list of top-N actionable blockers (rank 1 = most blocking). */
export const topBlockerIds: TaskId[] = topBlockerList.map((t) => t.id);

const topBlockerRankMap = new Map<TaskId, number>(
  topBlockerList.map((t, i) => [t.id, i + 1]),
);

/** 1-indexed rank if the task is a top blocker, else 0. */
export function topBlockerRank(id: TaskId): number {
  return topBlockerRankMap.get(id) ?? 0;
}

/* ── Validation (runs at import) ──────────────────── */

function validateRoadmap(): void {
  const errors: string[] = [];
  const taskIds = new Set(roadmap.tasks.map((t) => t.id));
  const epicIds = new Set(epics.map((e) => e.id));
  const slugSet = new Set(postSlugs(roadmapCar.id));

  // Duplicate IDs
  if (taskIds.size !== roadmap.tasks.length) {
    const seen = new Set<string>();
    for (const t of roadmap.tasks) {
      if (seen.has(t.id)) errors.push(`Duplicate task id: ${t.id}`);
      seen.add(t.id);
    }
  }

  // Per-task validation
  for (const t of roadmap.tasks) {
    if (!epicIds.has(t.epic)) {
      errors.push(`Task "${t.id}" references unknown epic "${t.epic}".`);
    }
    for (const slug of t.posts ?? []) {
      if (!slugSet.has(slug)) {
        errors.push(`Task "${t.id}" references unknown post slug "${slug}".`);
      }
    }
  }

  // Edge endpoint validation
  for (const e of roadmap.edges) {
    if (!taskIds.has(e.from)) errors.push(`Edge from unknown task "${e.from}".`);
    if (!taskIds.has(e.to)) errors.push(`Edge to unknown task "${e.to}".`);
    if (e.from === e.to) errors.push(`Self-loop on task "${e.from}".`);
  }

  // Purchases must never be sinks: a purchase is only meaningful if some
  // downstream install/use task consumes it.
  const sources = new Set(roadmap.edges.map((e) => e.from));
  for (const t of roadmap.tasks) {
    if (t.kind === 'purchase' && !sources.has(t.id)) {
      errors.push(`Purchase "${t.id}" is a leaf node (no downstream install/use task).`);
    }
  }

  // Cycle detection (DFS)
  const adj = new Map<TaskId, TaskId[]>();
  for (const t of roadmap.tasks) adj.set(t.id, []);
  for (const e of roadmap.edges) {
    if (taskIds.has(e.from) && taskIds.has(e.to)) {
      adj.get(e.from)!.push(e.to);
    }
  }
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<TaskId, number>();
  for (const id of taskIds) color.set(id, WHITE);
  const cycle: TaskId[] = [];
  function dfs(u: TaskId, path: TaskId[]): boolean {
    color.set(u, GRAY);
    path.push(u);
    for (const v of adj.get(u) ?? []) {
      if (color.get(v) === GRAY) {
        const start = path.indexOf(v);
        cycle.push(...path.slice(start), v);
        return true;
      }
      if (color.get(v) === WHITE && dfs(v, path)) return true;
    }
    path.pop();
    color.set(u, BLACK);
    return false;
  }
  for (const id of taskIds) {
    if (color.get(id) === WHITE && dfs(id, [])) {
      errors.push(`Cycle detected: ${cycle.join(' -> ')}`);
      break;
    }
  }

  if (errors.length > 0) {
    throw new Error(`[roadmapData] Validation failed:\n  - ${errors.join('\n  - ')}`);
  }
}

validateRoadmap();
