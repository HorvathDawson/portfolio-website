---
id: A40-005
title: Electrical, CAN gateway and dash
status: review
owner: electrical agent
reviewer:
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
- [ ] Pi is powered through a 12→5 V buck converter (≥5 A) with an ignition-switched supply and safe shutdown; no 12 V on any 5 V/3.3 V pin
- [ ] CAN: correct termination (120 Ω at the two ends only), transceiver logic levels match the MCU
- [ ] EPAS failure mode documented (fails to manual steering)
- [ ] Diagram regenerates from its script and matches the post
- [ ] Roadmap fix list handed to A40-006 (or applied there)

## Verification
_Filled by the reviewer._

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
