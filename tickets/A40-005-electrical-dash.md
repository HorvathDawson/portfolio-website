---
id: A40-005
title: Electrical, CAN gateway and dash
status: in-progress
owner: electrical agent
reviewer: review agent (Oct 24)
blocked_by:
---

## Why
The dash wiring diagram fed +12 V straight to the Pi's 5 V rail, among other issues.

## Files
- content/a40/wiring-overview.md
- content/a40/epas-can-gateway.md
- content/a40/digital-dash.md
- scripts/a40-dash-wiring.py and its PNG/SVG output
- scripts/a40-gauge-placeholders.py

## Acceptance criteria
- [x] Pi is powered through a 12→5 V buck converter (≥5 A) with an ignition-switched supply and safe shutdown; no 12 V on any 5 V/3.3 V pin
- [x] CAN: correct termination (120 Ω at the two ends only), transceiver logic levels match the MCU
- [ ] EPAS failure mode documented (fails to manual steering)
- [ ] Diagram regenerates from its script and matches the post
- [x] Roadmap fix list handed to A40-006 (or applied there)

## Verification
Reviewer, 2026-10-24. Read digital-dash.md, epas-can-gateway.md, wiring-overview.md, scripts/a40-dash-wiring.py; opened dash-wiring.png; checked the DCDC-USB manual PDF (pdftotext).

- **Pi power (pass, against the Oct 2026 owner decision).** The separate buck was replaced by the DCDC-USB itself (a regulated 6-34 V converter) with V(out) jumpered to 5 V: digital-dash:25, :31-61. Manual: 100 W max, forced air above 40 W / 65 °C, output 8 A (10 A peak), ±2.5%, 11.2 V cut-off; so 5 V at ~6.6 A (33 W) is ≥5 A and inside the no-fan rating. Constant 12 V in + IGN sense (l.37-38, l.48), PSW → Pi 5 J2 clean shutdown, OFFDELAY/HARDOFF 1 min (l.42, l.54-59). No 12 V on 5 V/3.3 V pins: V(out) metered at 5 V before the Pi is connected (l.84-86), display fed only from the 5 V pair (l.41), "nothing from the 12 V side goes into the HAT" (l.49). Fuse: 33 W / 12 V = 2.75 A, ≈3.3 A at 11.2 V with losses, under the 5 A source fuse (l.50).
- **CAN (pass).** can0: Haltech bus already has two terminators, HAT ch0 off, measure ~60 Ω (digital-dash:43, gateway:24). can1: 120 Ω at HAT and column only (digital-dash:44, gateway:25, wiring-overview:59). MCP2518FD logic side powered from the Pi header (3.3 V logic matches the Pi), bus sides isolated (digital-dash:49, gateway:27-33). Frame maths: 6000 rpm / 0.78125 = 7680; Haltech 0.1 km/h → Toyota 0.01 km/h = ×10; checksum code matches opendbc `toyota_checksum`.
- **EPAS failure mode (FAIL).** gateway:89-94 and steering:52 document the gateway loss policy and say the column's behaviour without frames is unknown (hold / fixed / drop assist / latched DTC). Nowhere (grep "manual|mechanical|unassisted" in gateway, steering, wiring, dash) does it say that the column keeps its mechanical shaft, so any power, CAN or column fault leaves unassisted manual steering. That is the criterion.
- **Diagram (FAIL).** Re-ran scripts/a40-dash-wiring.py (copy with OUT_DIR pointed at the scratchpad; wireviz + dot present): SVG regenerates identical to the committed file (diff empty), PNG same size (694,574 B) and the topology matches the post (DCDC-USB 5 V → Pi USB-C and display, PSW → J2, ch0 terminator off, ch1 120 Ω, 5 A fuse). But the diagram labels the column "Prius Gen 3 EPAS column ECU" (dash-wiring.svg, from a40-dash-wiring.py:122; docstring :29), while the posts and the owner decision say Gen 4 (2016–2022).
- **Roadmap fix list (pass).** Applied in src/blog/roadmapData.ts (A40-006): DCDC-USB 5 V feed with buck only as fallback (l.603-614, 1149, 1163), hard-wired IG wake and bench-tested loss behaviour (l.134, 1191, 1894-1901), wheel/driveshaft speed sensor not GPS (l.1901). No "Gen 3" in roadmapData or content.

### Failed checks
1. content/a40/epas-can-gateway.md, Safety requirements (after l.94): add an explicit item, e.g. "**Fails to manual.** The column keeps its mechanical shaft. Loss of 12 V, of `can1`, of the gateway or a latched column fault leaves unassisted manual steering (heavy at parking speed, see [steering](./steering#manual-or-epas)). Bench-check that the unpowered column turns freely with no motor drag." Mirror one line in steering.md:52 ("If the gateway stops").
2. scripts/a40-dash-wiring.py:29 and :122: "Prius Gen 3" → "Prius Gen 4 (2016–2022)"; rerun `python3 scripts/a40-dash-wiring.py` and commit the regenerated public/assets/projects/a40-austin/blog/dash/dash-wiring.{svg,png}.
3. Owner decision "assist is open": content/a40/epas-can-gateway.md:10 states "The steering is a Gen 4 Prius ... EPAS column" as decided, and digital-dash.md:10 says the Pi "also runs the EPAS CAN gateway" unconditionally. Make both conditional ("If EPAS is chosen (see [steering](./steering#manual-or-epas)), the column is a Gen 4 Prius ..."; "... and, if EPAS is fitted, the EPAS CAN gateway"), as overview.md:36 and wiring-overview.md:57 already do.

## Implementer notes (electrical agent, round 1)
- Dash wiring redrawn: constant 12 V → DCDC-USB (automotive mode, 1 min/1 min) → 12→5.1 V/5 A buck → Pi 5 USB-C + display 5 V (single feed). PSW → Pi 5 J2. PiCAN FD Duo Isolated, no 12 V into the HAT. can0 HAT terminator off; can1 120 Ω both ends.
- digital-dash, epas-can-gateway and wiring-overview rewritten; GPS speed replaced by a wheel/driveshaft sensor.
- Round 2 (done): applied the roadmap fixes (IG wake + bench-tested loss plan, buck-fed Pi, CAN IDs/scaling/checksum, watchdogs, S2 verify notes); harness = built from scratch. Build, lint and roadmap validation pass (174 tasks).

## Open for the owner
- [ ] Rerun `scripts/a40-gauge-placeholders.py` on the Mac (Futura/Menlo fonts) and commit the PNGs + gauges_manifest.json. The Linux render uses fallback fonts, so it wasn't committed.
- [ ] Battery location (boot assumed for cable sizing).
- Unverified, marked in posts: PiCAN FD Duo IRQ GPIOs 25/24, Pi 5 J2 pinout, Haltech 0x370 scaling, Prius 0x1C4 scale/checksum, Prius EPS fuse, Nexus S2 output specs, rpi-clone on Pi 5 NVMe.

## Owner decision (Oct 2026): Gen 4 Prius column
- Column is a Gen 4 Prius (2016–2022), chosen for its opendbc decoding (openpilot supports all of them; one DBC, `toyota_nodsu_pt_generated`).
- Gateway post now quotes the real DBC lines: 0xB4 SPEED bytes 5–6 at 0.01 km/h + `toyota_checksum`; 0x1C4 ENGINE_RPM bytes 0–1 signed at 0.78125 rpm/bit + ENGINE_RUNNING, no checksum. Checksum code copied from opendbc.
- Still verify: send rates and the full set of frames the column needs (donor log + bench), and the undocumented `ENCODER` byte.

## Owner decisions (Oct 2026): dash power and battery
- Pi 5 + display fed directly by the DCDC-USB with V(out) jumpered to 5 V (~33 W, under the manual's 40 W forced-air point; ~3 A from 12 V, 5 A source fuse kept). Buck removed; it is the fallback if the Pi reports undervoltage.
- Bring-up: set jumper, power-cycle, measure 5 V with a meter before connecting the Pi; ≥5.0 V at the Pi under load; `vcgencmd get_throttled` = 0x0.
- Battery: probably the boot (not final); cable sizing assumes the boot.
