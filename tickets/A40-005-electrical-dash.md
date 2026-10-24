---
id: A40-005
title: Electrical, CAN gateway and dash
status: in-progress
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
