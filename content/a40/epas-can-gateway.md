---
title: "EPAS CAN Gateway"
date: 2026-05-18
status: in-progress
epic: design
kind: reference
tags: [electronics, can-bus, epas, steering, raspberry-pi, safety]
---

The steering is a **Gen 4 Prius (2016–2022)** EPAS column (see the [steering post](./steering)), chosen because comma.ai's openpilot drives this car, so its CAN messages are decoded in [opendbc](https://github.com/commaai/opendbc). With no CAN traffic it runs a single fixed assist level. A level light enough for parking is too light and nervous at highway speed, and a level that suits the highway is heavy in a parking lot. To get speed-sensitive assist, the column has to see the Prius frames it expects. The dash Pi reads the Haltech broadcast and re-sends speed and rpm in Toyota format on a second, isolated bus.

The dash is a UI and the gateway is part of the steering, so they share a Pi and a power supply but nothing else.

| | Dash | Gateway |
|---|---|---|
| Failure mode | Black screen | Change in steering assist |
| Stack | Godot, sway, Plymouth | Small C/Python service, systemd, SocketCAN |
| Buses | `can0` read-only | `can0` in, `can1` out |

## Architecture

| Bus | Bitrate | Node(s) | Pi role | Termination |
|---|---|---|---|---|
| `can0` | 1 Mbit/s | Haltech Nexus S2 (+ any Haltech devices) | Listen: rpm (0x360), vehicle speed (0x370) | The Haltech bus already has two terminators. **Don't add a third**: HAT ch0 jumper off, ~60 Ω measured across CAN_H/L with power off. |
| `can1` | 500 kbit/s | Prius EPAS column only | Transmit: 0x1C4 rpm, 0xB4 speed | 120 Ω at the HAT (ch1 jumper on) **and** 120 Ω at the column, unless its ECU already has one. Measure: ~60 Ω total with power off. |

Hardware: a **PiCAN FD Duo Isolated (non-SMPS)**, with two MCP2518FD controllers on SPI0 CE0/CE1, each channel galvanically isolated. Power and the wiring diagram are in the [digital dash post](./digital-dash).

**Why isolation.** A non-isolated transceiver tolerates a few volts of common-mode offset, so a few hundred mV of ground difference won't damage it. Isolation is there for these reasons:
- It stops ground-loop current and alternator/motor noise between the Pi supply, the Haltech ground and the column ground.
- It keeps a wiring fault on one bus from reaching the Pi or the other bus.

This only works if each isolated side is referenced to its own bus. Never wire the DCDC 12 V or the Pi supply ground into the HAT's bus-side terminals, because that bypasses the isolation.

## Frame translation

**Source: opendbc.** openpilot maps every Gen 4 Prius (2016, 2017–20, 2021–22, and the Prime) to `toyota_nodsu_pt_generated.dbc`. It is generated from `opendbc/dbc/generator/toyota/_toyota_2017.dbc` (where these two messages live) plus `toyota_nodsu_pt.dbc`. The lines below are copied from `_toyota_2017.dbc` (Oct 2026). Re-check them against the current file before coding.

```text
BO_ 180 SPEED: 8 XXX
 SG_ ENCODER : 39|8@0+ (1,0) [0|255] "" XXX
 SG_ SPEED : 47|16@0+ (0.01,0) [0|250] "km/h" XXX
 SG_ CHECKSUM : 63|8@0+ (1,0) [0|255] "" XXX

BO_ 452 ENGINE_RPM: 8 CGW
 SG_ RPM : 7|16@0- (0.78125,0) [0|0] "rpm" SCS
 SG_ ENGINE_RUNNING : 27|1@0+ (1,0) [0|1] "" XXX
```

`@0` is Motorola (big-endian), so start bit 47 means bytes 5–6 and start bit 7 means bytes 0–1. `-` means signed.

| Toyota frame | Signal | Scale | From Haltech | Conversion |
|---|---|---|---|---|
| **0xB4** (180) SPEED | bytes 5–6, unsigned, big-endian | 0.01 km/h/bit | 0x370 bytes 0–1, vehicle speed, 0.1 km/h/bit (**verify** in the Haltech CAN protocol doc) | `raw = km/h / 0.01` = **Haltech raw × 10**. No mph step. |
| **0x1C4** (452) ENGINE_RPM | bytes 0–1, signed, big-endian | 0.78125 rpm/bit | 0x360 bytes 0–1, 1 rpm/bit | `raw = rpm / 0.78125` (so 6000 rpm → 7680) |
| 0x1C4 ENGINE_RUNNING | byte 3, bit 3 | 1 = running | rpm > ~300 | Set it when the engine runs; the column may read it. |

`ENCODER` in 0xB4 is undocumented. Copy what a real Prius log shows, or leave it at 0 and see whether the column cares.

**Checksum.** 0xB4 has a `CHECKSUM` signal in the last byte; 0x1C4 doesn't, so send it without one. opendbc's `toyota_checksum` (`opendbc/car/toyota/toyotacan.py`) is:

```python
def toyota_checksum(address, d):  # d = the 8 data bytes
    s = len(d)                    # DLC
    while address:                # 0xB4 → +0xB4
        s += address & 0xFF
        address >>= 8
    s += sum(d[:-1])              # bytes 0..DLC-2
    return s & 0xFF               # goes in the last byte
```

It's a plain sum, not a rolling counter. A wrong checksum gets the frame ignored.

**Send rates.** Not in the DBC. Log a running Gen 4 Prius (a cheap USB-CAN adapter on the OBD port's powertrain pins, or a comma/panda device) and match its rates. Expect tens of Hz. **Verify.**

**What the column needs.** Speed and rpm are the usual pair, but **verify which frames the Gen 4 column listens for** before trusting the gateway:
1. Log a donor car with the column connected and note every frame on its bus.
2. On the bench, feed only 0xB4 + 0x1C4 and check the assist changes and no fault sets.
3. If it faults, add frames from the log one at a time (wheel speeds 0xAA and gateway/VSC frames are the likely candidates).

**Reading the column back.** The column broadcasts `EPS_STATUS` (0x262, in `toyota_nodsu_pt.dbc`) and `STEER_TORQUE_SENSOR` (0x260). Log both on `can1`: a changing driver torque confirms the column is alive, and the EPS state fields show a fault before you feel it. Use the `VAL_` lines in the DBC for the state meanings.

## Safety requirements

These come before writing any code.

1. **IG wake is hard-wired.** A Prius steers with the engine stopped, so the column wakes on its ignition (IG) input, not on rpm > 0. Feed it from an ignition-switched fused circuit ([wiring overview](./wiring-overview)).
2. **Speed source is a wheel or driveshaft speed sensor** into the Nexus (→ 0x370). GPS is not acceptable. A GPS dropout reads 0 km/h, which gives parking-level assist at speed.
3. **Loss policy (gateway side):**
   - If the Haltech speed is stale (for example more than 200 ms), **hold the last speed**.
   - If it stays stale, **ramp toward a high-speed, low-assist value**.
   - **Never ramp toward 0.**
   - Rate-limit the speed sent to the column to what the car can physically do (for example 1 g, about 35 km/h per second).
4. **Column behaviour when frames stop is unknown.** It may hold, fall back to fixed assist, drop assist, or **latch a DTC until a key cycle**. Bench-test pulling `can1` and `can0` at different simulated speeds before the car moves.
5. **Keep the service alive:**
   - `restart-ms` (or the networkd `RestartSec`) on `can0` and `can1`, so bus-off recovers on its own.
   - systemd unit with `Restart=always`, `RestartSec=200ms`, `StartLimitIntervalSec=0` (never gives up), and `WatchdogSec=` with `sd_notify` from the main loop.
   - Hardware watchdog: `RuntimeWatchdogSec=` in `/etc/systemd/system.conf`, so a hung kernel reboots.
   - Start early in boot: depend only on the CAN interfaces, not on the dash, network-online or the user session.
6. **Stronger design to keep in mind:** a small dual-CAN microcontroller (for example a Teensy 4.x or an STM32 with two CAN controllers) boots in milliseconds and has no OS to hang. The Pi gateway is the prototype, and the MCU is the upgrade path if the bench tests show slow boot or a latched DTC.

## Status

| Item | State |
|---|---|
| Architecture (dual bus, isolated HAT) | Locked |
| Hardware (PiCAN FD Duo Isolated, DCDC-USB with V(out) jumpered to 5 V, Pi 5) | On hand / specified |
| Frame IDs, scaling, checksum | From opendbc (Gen 4 Prius). Send rates and the full frame set: verify with a donor log and the bench. |
| Code | Not written |
| Bench rig | Not built |
| In car | Not done |

**Bench test plan:**
1. FD Duo on the Pi, with a replayed Haltech log on `can0`.
2. The column on `can1` with its own 12 V supply, motor fuse and IG wake.
3. Measure the termination on both buses.
4. Check that assist changes with the spoofed speed (turn the input shaft by hand and feel the effort).
5. Run the loss tests from item 4 above.
