---
title: "EPAS CAN Gateway"
date: 2026-05-18
status: in-progress
epic: design
kind: reference
tags: [electronics, can-bus, epas, steering, raspberry-pi, safety]
---

The steering is a Gen 3 Prius EPAS column (see the [steering post](./steering)). With no CAN traffic it runs a single fixed assist level. A level light enough for parking is too light and nervous at highway speed, and a level that suits the highway is heavy in a parking lot. To get speed-sensitive assist, the column has to see the Prius frames it expects. The dash Pi reads the Haltech broadcast and re-sends speed and rpm in Toyota format on a second, isolated bus.

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

Source: [opendbc](https://github.com/commaai/opendbc), comma.ai's community DBC files. Find the Toyota powertrain DBC that defines `BO_ 180 SPEED` and `BO_ 452 ENGINE_RPM`. The excerpt below is illustrative, so copy the real lines from the file before coding:

```text
BO_ 180 SPEED: 8 XXX
 SG_ SPEED : 47|16@0+ (0.01,0) [0|250] "kph" XXX
 SG_ CHECKSUM : 63|8@0+ (1,0) [0|255] "" XXX
```

(DBC has no `;` comments. Notes go in `CM_` lines.)

| Toyota frame | Signal | Scale | From Haltech | Conversion |
|---|---|---|---|---|
| **0xB4** (180) SPEED | bytes 5-6, big-endian | 0.01 km/h/bit | 0x370 bytes 0-1, vehicle speed, 0.1 km/h/bit (**verify** in the Haltech CAN protocol doc) | `raw = kmh / 0.01` = **Haltech raw × 10**. No mph step. |
| **0x1C4** (452) ENGINE_RPM | 16 bits | likely **0.78125 rpm/bit** (**verify** in opendbc before coding) | 0x360 bytes 0-1, 1 rpm/bit | `raw = rpm / 0.78125` |

Send rates: match what the DBC or a real Prius log shows (**verify**; the earlier notes said 0xB4 at 20 Hz and 0x1C4 at 50 Hz).

**Checksum.** It's a plain additive sum, not a rolling counter, and **only frames whose DBC defines a `CHECKSUM` signal have one**. 0xB4 does. Check 0x1C4 in the DBC. Where present it's the last byte:

```text
checksum = ((ID >> 8) + (ID & 0xFF) + DLC + byte0 + ... + byte[DLC-2]) & 0xFF
```

Search the opendbc source for `toyota_checksum` to cross-check. A wrong checksum gets the frame ignored.

**Other columns.** For other columns the workflow is the same:
1. Find the donor's powertrain DBC in opendbc.
2. Find which frames the EPS listens for (speed and rpm are the usual pair, and some also want ignition or brake).
3. Read off the byte positions, scales and checksum.
4. Confirm the bus bitrate.

Gen 3 Prius (2010-2015) columns *probably* share these IDs. **Verify** on the bench with the actual column's part number before relying on it.

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
| Hardware (PiCAN FD Duo Isolated, DCDC-USB + 5 V buck, Pi 5) | On hand / specified |
| Frame IDs and scaling | Drafted above. Verify against opendbc and the bench. |
| Code | Not written |
| Bench rig | Not built |
| In car | Not done |

**Bench test plan:**
1. FD Duo on the Pi, with a replayed Haltech log on `can0`.
2. The column on `can1` with its own 12 V supply, motor fuse and IG wake.
3. Measure the termination on both buses.
4. Check that assist changes with the spoofed speed (turn the input shaft by hand and feel the effort).
5. Run the loss tests from item 4 above.
