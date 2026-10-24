---
title: "Motor Selection"
date: 2023-09-08
status: complete
epic: research
kind: log
tags: [motor, sr20det]
---

Going with an SR20DET. The other motor I seriously considered was the KA24DE (Nissan, same era). Honda K-series was on the list briefly, but the objections are packaging and the RWD conversion: it needs a RWD gearbox adapter and custom mounts, and none of that comes in a box.

> **Update (Oct 2026):** the gearbox plan changed. The SR20's own 5-speed is rejected (its 3rd gear is weak behind real boost); the plan is a CD009 or Z32 on an adapter, whichever clean unit turns up first. The 5-speed point below is kept as the original reasoning. See the roadmap's Decide: Transmission.

Why the SR20DET:

- **Factory turbo.** ~200–220 hp stock; the bottom end takes well more than that with supporting mods. Target is ~300 whp, with injectors and fuel sized for ~350 whp headroom.
- **Came with a 5-speed manual.** (Superseded, see the update above.)
- **Aftermarket.** ECUs, turbo kits, intercoolers and standalone management are all available and well documented from decades in Silvias and 240SXs.
- **Compact.** Fits the A40 engine bay with room for exhaust routing.

It runs a standalone ECU (Haltech Nexus S2, see [wiring overview](./wiring-overview)) from day one: no splicing into a Nissan body harness.

## Planned work before install

1. Basic rebuild: gaskets throughout, inspect the bores (hone or bore as needed), new head and main bolts.
2. Valve-guide / oil-squirter mod: listed as "dual guide valve mod" in my old notes. **Verify** what this actually is and whether this head needs it before buying parts.
3. Wideband O2 bung welded into the downpipe.
4. Silicone coolant hoses in place of all rubber lines.
5. Standalone ECU and custom engine harness.
6. Throttle: the SR20DET is cable throttle stock. Planned conversion to drive-by-wire, controlled by the Nexus S2.

Cooling is a custom aluminium radiator in the stock location. The A40's grille opening is small, so plan on a slim electric fan behind it.
