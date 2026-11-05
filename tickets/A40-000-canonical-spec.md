---
id: A40-000
title: Canonical numbers and decisions
status: done
owner: Claude
reviewer: Dawson
blocked_by:
---

## Why
Single agreed set of decisions and numbers that every other ticket checks against. Superseded by `content/a40/constants.yaml` once A40-007 is done; after that, change numbers there, not here.

## Verification
Synthesised from five independent physics/logic reviews (Oct 2026) plus the owner's decisions: Miata IRS rear, 1340 mm rear track, RX-8 diff, custom half-shafts.

---

The owner uses this build log as the working documentation for the build. Every post must
agree with this spec. Where a value is uncertain, say so and say how to measure it; never invent a number.

## Decisions (from the owner, 2026-10-24)

- **Rear suspension is now a narrowed Mazda NA Miata IRS** (double wishbone, the Miata rear geometry
  kept: every inboard pickup is translated inboard by the same amount, exactly like the front).
  The Ford 9", the Welder Series 318500 four-link, the live-axle coilovers and the 950 mm rear spring
  base are all GONE. The Ford 9" on hand is now surplus.
- **Rear track stays 1340 mm (locked)**: the Miata rear is narrowed about 42-47 mm per side.
  Exact amount = measured stock rear hub-face half-width minus 708 mm (708 = 670 half-track + 38 ET).
  42 mm if the donor's 1420 mm rear track is at ET40, 47 mm if at ET45. Measure the donor.
- **Differential: Mazda RX-8 rear diff** (stronger than the NA Miata unit, which is not suited to a
  300+ whp SR20DET). Needs custom diff mounts on the rear subframe/frame (it is not a bolt-in to the
  NA subframe). Stock RX-8 final drive about 4.44 on the 6-speed car (verify on the unit bought).
  Final drive is an open decision (ratio swaps exist; NC MX-5 ratios share the case - verify).
- **Custom drive axles (half-shafts) made to length** for the narrowed rear and RX-8 diff output flanges.
- The diff is chassis-mounted (sprung), so the driveshaft/pinion angle no longer changes with suspension
  travel. Engine/trans sit **3° down at the rear (tail-down)**; diff pinion set parallel (3° nose-up),
  driveshaft 5.4° (3.5" over 37"), both U-joints 2.4°, constant through travel. (The old text said
  "3° nose-down" - that is wrong; nose-down would give 8.4° at the front joint.) Driveshaft shop needs
  the trans output yoke spec and the RX-8 pinion flange spec.
- Rear brakes: the Miata rear calipers/rotors come with the Miata uprights - no custom caliper brackets.
  The NA rear caliper already has an integrated cable parking brake (it is NOT drum-in-hat).
- Brake split: a diagonal (X) split has no "rear circuit", so one rear proportioning valve cannot work.
  Open decision for the owner: front/rear split + one adjustable rear valve (simplest), or X-split with
  two valves set identically. Flag it; do not decide.

## Mass and corner loads (all "working")

- Operating mass (driver + full tank) ~950 kg; curb without driver ~875 kg. (The old "curb 950 kg"
  label was wrong: the mass table only reaches ~950 with a driver.)
- Fuel: stock-size tank about 30-35 L ≈ 25 kg (old 45-55 kg implied a 60-74 L tank). Verify tank.
- Weight distribution ~55/45 F/R (estimate; corner-weigh when rolling).
- Unsprung per corner ~30 kg front, ~33 kg rear (Miata corner + 205/65R15 + half arms; rear adds half
  the half-shaft). Diff, subframe and inner half-shaft are sprung.
- Sprung mass ~825 kg. Sprung corner mass: front ~231 kg, rear ~181 kg.
- CG height 575 ±50 mm (working). Body-centroid sensitivity: ±10 mm body → ~2-3 mm whole-car CG.
- Rear axle line item in the CG table is replaced by: RX-8 diff (weigh it; ~30 kg class, verify),
  rear subframe + arms + uprights + brakes + wheels (~2×33 kg corners plus subframe), half-shafts.

## Geometry (front unchanged in concept; numbers corrected)

- Wheelbase 2350 mm (locked). Front narrowing 95 mm/side (locked) - the hub face moves from 750 to
  655 mm from centreline. Track = 2 × (hub-face distance − ET): with ET38 that is 1234 mm, i.e.
  "~1230 mm". Lock the pickups/hub-face position, not the derived track. Note the Miata donor baseline
  track (1405 vs 1420 published/scanned) is unverified: measure the donor hub-face width.
- Rack narrowing = 190 mm total (7.5"), not 175 (175 came from the old 1405 mm baseline).
- Tire 205/65R15, OD 647.5 mm (not 646). Wheel ET38, 4x100.
- Fitment: outer-to-outer front ≈ 1230 + 205 = 1435 mm vs stock A40 1365 mm → tyres sit ~35 mm/side
  further out than the stock tyres (the old table said ~10 mm/side; it carried a +25 mm error).
  Inner tyre edge is also further inboard than stock → full-lock/full-bump clearance must be checked
  on the scanned body. Flag this as the main fitment risk.
- UCA inner pivot is 38.5 mm OUTBOARD of the LCA pivot (368 vs 329.5 mm from CL, stock) - normal
  short-long-arm layout. Narrowed pivots: LCA 234.5 mm, UCA 273 mm from CL (frame-design said
  240.5/290.5 - wrong).
- Front motion ratio: wheel moves about the front-view instant centre, so MR ≈ 0.68-0.69 (not 0.621/
  0.63, which treated the contact patch as fixed to the LCA). Verify by perturbing the script's
  four-bar; use the corrected value everywhere.
- Rear motion ratio: Miata rear - measure on the donor (spring/shock travel vs wheel travel). TBD.
- Specify springs as WHEEL RATES (independent of MR), then spring = wheel rate / MR².
  Front wheel rate 13-23 N/mm for 1.2-1.6 Hz; suggested 17.9 N/mm (1.4 Hz) → ~39 N/mm (~220 lb/in)
  spring at MR 0.68. Rear wheel rate 12-21 N/mm for 1.3-1.7 Hz; suggested 16.1 N/mm (1.5 Hz, 0.1 Hz
  above front). Rear spring = 16.1 / MR_rear².
  Correct reason for rear ≥ front: the rear hits a bump later; slightly higher rear frequency lets it
  catch up so the body heaves flat instead of pitching.
- Front kinematic roll centre (script, A40 build, static): ~139 mm (Miata stock ~142 mm). The old
  39/45 mm numbers in the roll maths were wrong. Rear RC: Miata rear geometry, narrowed → measure/model;
  assume ~80-150 mm until then.
- Spring roll stiffness (wheel rates above, K = Kw·T²/2): front ~13.5, rear ~14.4, total ~28 kN·m/rad.
- Springs-only roll at 0.8 g ≈ 6.5-7.1° (rear RC 150-80 mm). For 3-4° the bars must add about
  16-33 kN·m/rad (≈24 kN·m/rad for 3.5° at rear RC 100 mm). Old "17°" and "38-55 kN·m/rad" are wrong.
  Both axles now have independent suspension, so a rear ARB is a normal tuning part (the old
  "a live axle acts like an anti-roll bar" claim was wrong anyway).
- LLTD target: start ~3-5% above the front static weight fraction (not 1-3%).
- Damping: critical damping at the wheel ≈ 4.1 kN·s/m front, 3.4 kN·s/m rear (2√(k·m)); ride ζ 0.3-0.4,
  roll ζ 0.4-0.5. Adjustable dampers.
- Lateral narrowing preserves side-view geometry (anti-dive, anti-squat) exactly; it changes RC and
  roll stiffness. Translate toe links and every rear pickup by the same amount to keep bump steer.
- Scrub: with scanned knuckle and ET40→ET38 + taller tyre, scrub ≈ +0.5 mm (near zero), not "stock".
- Trail with the taller tyre ≈ 9.8 mm (not unchanged 7.57).
- Caster: scanned 3.62°; the 5-7° target is not reachable with ±2° of adjustment → realistic target
  4-5.5°.
- Ackermann knuckle angle atan(710/2265) = 17.40°.
- Lock loss: 12-18 degrees of steering lock (not mm). Turning circle grows from ~9.4 m (Miata) to
  roughly 16-25 m diameter - a real drivability issue; steering stops are mandatory.

## Out of scope for content changes (just keep consistent)
Engine SR20DET, trans CD009 leaning (OEM 5-speed fallback per build-constants; roadmap may say
CD009/Z32 - follow the newest decision but keep posts consistent), Haltech Nexus S2.

## Style for every rewritten post
Write for a builder using it as reference documentation: decisions and numbers first, short
paragraphs, procedures as numbered steps, tables for numbers, "verify/measure" where uncertain,
no repetition between posts (link instead), no hype. Keep the author's first-person voice where it's
a log entry. Shorter is better; keep figures only if they still match the numbers.
