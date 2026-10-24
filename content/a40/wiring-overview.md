---
title: "Wiring & ECU Overview"
date: 2026-05-11
status: planning
epic: fabrication
kind: log
tags: [electronics, wiring, ecu, haltech, harness]
---

This is the starting point for the engine harness: the ECU choice, the decisions that set the connector and wire list, and the power budget for the big loads. The dash and the EPAS gateway have their own posts ([digital dash](./digital-dash), [EPAS CAN gateway](./epas-can-gateway)). This one covers everything upstream of CAN.

## Decisions so far

| Item | Decision | Status |
|---|---|---|
| ECU | Haltech Nexus S2 | Chosen |
| Throttle | Drive-by-wire (Z33/350Z-style TB + pedal) | Chosen |
| Air metering | Speed density: MAP + added IAT, MAF deleted | Chosen |
| MAP | Nexus internal 3.5 bar abs (about 36 psi of boost at sea level) | Chosen; external MAP only if the target goes past that |
| Injectors | 1000-1100 cc/min high-impedance EV14-style (keeps E85 open) | Size chosen, part not picked |
| Coils | Smart coils: LS truck (4-pin) or R35 GT-R | Open |
| Wideband | Bosch LSU 4.9 on the Nexus wideband controller | Chosen (verify the S2 has the internal WB) |
| Harness | Built from scratch: Wiring Specialties connectors, self-terminated, self-loomed | Decided |
| Battery | Probably the boot (not final) | Cable sizing below assumes the boot. Under-floor / footwell still possible |

### Why the Nexus S2

- ECU plus power outputs in one sealed box, so fewer external relays and fuses. **Verify** the S2's output count and per-channel current against the Haltech spec sheet before assigning loads.
- Native CAN broadcast for the dash and the gateway. Godot can't read SocketCAN by itself, so the dash needs a GDExtension or a small sidecar process. That's a dash-side job, not a harness one ([digital dash](./digital-dash)).
- DBW pedal and throttle body handled natively, with no external module.
- The Elite 2500 was the alternative, but it needs a separate fuse/relay block and harness.

### Injector sizing

Power target is ~300 whp, with fuel and injectors sized for ~350 whp of headroom. Roughly 350 whp needs about **790 cc/min on petrol** and **about 1000-1100 cc/min on E85** (about 80 % duty, base pressure 3 bar; **verify** with the final pump and regulator). The earlier 550 cc/min was too small for either. Plan: 1000-1100 cc/min EV14-style, USCAR/EV14 connectors.

### Air metering

With the MAF gone, the stock air-temperature reading goes too, so the **IAT is an added sensor** (2-pin, in the charge pipe or manifold). That means one more branch and one less connector (the MAF).

### Coils

- **LS truck coils are 4-pin**: B+, power ground, signal ground, trigger.
- R35 coils are 3-pin (**verify** the pinout on the part bought).
- Either way the Nexus sends a logic-level trigger, so there's no igniter module and no high-current coil wiring through the cabin.

## Power budget for the big loads

These set the wire gauge, the fuses and which loads get a relay instead of an ECU output.

| Load | Feed | Wire | Notes |
|---|---|---|---|
| Battery + to starter / main bus (assumes the battery in the boot, about 4 m; not final, resize if it moves) | Main fuse or breaker **within ~300 mm of the battery** | 4 AWG (6 AWG minimum) | Matching ground: battery - to chassis in the boot, plus engine-to-chassis strap of the same size. About 4 m each way, so don't undersize it. Master switch on this run. |
| Starter solenoid | **Relay** (ECU or ignition switch drives the coil) | 12 AWG to solenoid | The solenoid pull-in current is too high for an ECU output. Not a PDM channel. |
| Fuel pump (external Aeromotive 340 + surge tank) | Relay or a high-current output, own fuse | 10-12 AWG | Size for the pump at full voltage and pressure (**verify** the pump's current draw). Lift pump for the surge tank is a separate small branch if used. |
| Radiator fans (2, staged) | Relay or high-current outputs | Sized to fuse | Start-up inrush is several times the running current. Size fuses and relays for the inrush, or soft-start with PWM. |
| EPAS column motor (if EPAS) | **Own fuse at the battery, ~50-80 A** (**verify** against the donor Prius fuse box rating) | Sized to that fuse (about 8 AWG class for a few metres; verify) | Heavy chassis ground at the column. Not through the ECU. |
| EPAS IG wake (if EPAS) | Ignition-switched, small fuse | 18-20 AWG | Hard-wired. The column has to wake with the engine stopped, the same as in a Prius. See [EPAS CAN gateway](./epas-can-gateway). |
| EPAS CAN (`can1`, if EPAS) | From the dash Pi | 22 AWG twisted pair + ground, about 1-1.5 m | 120 Ω at each end. Separate from the Haltech bus. |
| Dash Pi + display | Constant +12 V, 5 A fuse, plus ignition sense, into the DCDC-USB (V(out) jumpered to 5 V, ~33 W, ~3 A from 12 V) | 18-14 AWG | Detail in the [digital dash](./digital-dash) wiring section. |

## Branch list

Each branch is a connector and a run of wire to budget for in the bulkhead.

- **Engine management:** crank trigger (CAS or wheel + sensor, decide when the front cover is off), cam trigger, coolant temp, IAT (added), MAP (internal), knock (1-2, depending on channel allocation), 4 injectors, 4 coils, DBW TB (6-pin) and pedal (6-pin, the pedal run goes through the bulkhead).
- **Pressures (3-pin ratiometric, 5 V / signal / ground):** oil pressure (0-150 psi transducer such as AEM 30-2130-150, **not** the OEM switch, teed at the block boss) and fuel pressure (rail).
- **Wideband:** LSU 4.9, 6-pin Bosch connector. Mounting rules are in the dash post.
- **Power:** fuel pump, 2 fans, starter relay, ignition/crank signal, EPAS motor + IG wake (only if EPAS is fitted).
- **Gearbox:** reverse light, neutral safety switch.
- **Dash adds** (signals the stock SR20 doesn't have):

| Signal | Sensor | Wiring |
|---|---|---|
| Oil temp | 1/8 NPT thermistor (Haltech part, **verify** P/N) | 2-pin, pan bung or filter sandwich plate |
| Fuel level | A40 sender if it survives the tank rebuild (**verify** its resistance range), else a custom resistive sender | 2-pin to a Nexus analog input, curve set in the ECU |
| Vehicle speed | **Wheel or driveshaft speed sensor** (Hall, 3-pin) into the Nexus | Required, not optional: the speedo needs it, the EPAS gateway (if fitted) uses it for assist, and GPS drops out (see the gateway post) |
| Gear | Calculated from speed/rpm against the gear ratios | None |

Coolant temp, IAT, MAP, battery voltage, rpm, TPS and AFR reach the dash over CAN with no extra wiring.

## Harness build

**Decided: built from scratch**, pin by pin against the Nexus pinout, with Wiring Specialties connectors, self-terminated and self-loomed. The Haltech universal harness (pre-terminated ECU connector) was the alternative and was rejected.

**Connectors:** kitted connectors from Wiring Specialties, covering EV14 injectors (×4), coils (×4, type follows the coil choice), sensors (CTS, IAT, oil/fuel pressure), DBW TB + pedal and LSU 4.9. Bulkhead: Deutsch Autosport or similar (open).

**Looming:**

1. TXL/Tefzel wire, DR-25 heat-shrink on every trunk run.
2. Raychem SCL adhesive boots at every branch and backshell.
3. Branches leave the trunk at 90°, kept short, P-clipped to the trunk.
4. One sealed bulkhead connector on the firewall.
5. Heat-shrink labels at every terminal end.

## Next

1. Pinout and branch map: the Nexus pinout reduced to a one-page diagram.
2. Connector BOM.
3. Engine-side sub-harness build.
4. Trunk and bulkhead.
5. First power-up: ECU on the bench, outputs checked with test loads, sensors added one at a time.
