---
title: "Digital Dash"
date: 2026-04-16
status: in-progress
epic: fabrication
kind: tutorial
tags: [electronics, dash, raspberry-pi, haltech, can-bus]
---

The original A40 cluster is coming out. In its place, a Raspberry Pi 5 behind the original bezel runs a Godot dashboard that reads the Haltech Nexus S2 CAN broadcast. If EPAS is fitted, the same Pi also runs the [EPAS CAN gateway](./epas-can-gateway). Sensor wiring is covered in the [wiring overview](./wiring-overview).

<figure>
  <img src="/assets/projects/a40-austin/blog/dash/dash-reference.jpeg" alt="A40 Austin Devon dash bezel with dimension reference" />
  <figcaption>A40 dash bezel opening. The 12.3" panel's active area (at least 10.5" × 3.5") has to fill it behind the original trim ring.</figcaption>
</figure>

## Bill of materials

| Component | Part | Notes |
|---|---|---|
| ECU | Haltech Nexus S2 | CAN broadcast source (`can0`, 1 Mbit/s) |
| Computer | Raspberry Pi 5, **4 GB** | Official Active Cooler is required: it throttles fast in a closed dash pod |
| Storage | Freenove M.2 adapter V2 + Crucial 256 GB NVMe | Boots from NVMe |
| CAN | [PiCAN FD Duo Isolated (non-SMPS)](https://copperhilltech.com/pican-fd-duo-board-with-real-time-clock-for-raspberry-pi/) | `can0` Haltech 1 Mbit/s, `can1` Prius EPAS 500 kbit/s. Two isolated channels on SPI0 CE0/CE1 |
| Power manager / 5 V supply | Mini-Box DCDC-USB | Ignition-aware shutdown, V(out) jumpered to **5 V** (default is 12 V). Only 5 V source: Pi + display ([manual](/assets/projects/a40-austin/blog/dash/PWR-DCDC-USB-manual.pdf)) |
| Display | [Waveshare 12.3-DSI-TOUCH-A](https://www.waveshare.com/wiki/12.3-DSI-TOUCH-A), 1920×720 | DSI ribbon; 5 V ≥ 1 A input |
| Bench PSU | Official Pi 5 27 W USB-C | Desk testing only |

## Power and CAN wiring

The DCDC-USB has **one** regulated output, V(out), which is set by jumper (12 V, 5 V and others). It also has an unregulated switched **Vaux** (unused). Its mini-USB port is a **configuration interface, not a power output**. V(out) is jumpered to **5 V** and feeds both the Pi 5 and the display directly.

Power budget at 5 V: Pi 5 at 5 A (25 W) + display ~1-1.5 A (~5-7.5 W) ≈ **33 W**. The manual rates the DCDC-USB at 100 W max (limited by its 10 A input fuse), with forced air needed above 40 W, so 33 W is inside the no-fan rating. Regulation is ±2.5%, so the output can sit as low as ~4.9 V, which is why the 5 V leads are short and heavy.

| Run | From → to | Wire / fuse |
|---|---|---|
| Supply | Fuse box **constant** +12 V → DCDC-USB V(in) | **5 A fuse at the source**, 18-14 AWG |
| Ignition sense | Ignition-switched fused circuit → DCDC-USB IGN | Sense line, any gauge |
| Ground | DCDC-USB GND → chassis stud | Same gauge as the supply |
| Pi | DCDC-USB V(out) 5 V → Pi 5 USB-C (pigtail rated for 5 A) | 18 AWG, ≤30 cm |
| Display | DCDC-USB V(out) 5 V → display 5 V/GND (separate pair) | 18-20 AWG, short. **This is the display's only feed.** Not also from the Pi GPIO 5 V pins, and not 12 V. |
| Shutdown | DCDC-USB PSW → Pi 5 **J2** power-button header | 2-wire, verify polarity |
| `can0` | HAT ch0 → Haltech CAN (H, L, CAN ground) | Twisted pair. HAT terminator **off** (the bus already has two) |
| `can1` | HAT ch1 → Prius column (H, L, ground) | Twisted pair, ~1-1.5 m, 120 Ω **at each end** |

Rules:

- **V(in) must be constant 12 V.** If V(in) is ignition-switched, power vanishes with the key and there's no delayed shutdown.
- **Nothing from the 12 V side goes into the HAT.** The FD Duo's logic side is powered from the Pi header. Its bus sides are isolated and referenced only to their own bus.
- **Fuse check:** 33 W at 5 V is about 3 A drawn from 12 V (≈3.3 A at 11.2 V with conversion losses). The 5 A source fuse covers that with margin, and the board's own 10 A fuse is never the limit. The 5 A fuse stays.
- **Ventilation:** 33 W is under the 40 W forced-air threshold, but mount the DCDC-USB where air can move (open side of the dash, not sealed in a pocket behind it). The manual also requires forced air if the unit runs above 65 °C.
- The Pi sees the DCDC-USB as a non-PD supply, so set `usb_max_current_enable=1` in `config.txt` or `PSU_MAX_CURRENT=5000` in the bootloader EEPROM (provisioning step below). Without it, USB is capped at 600 mA and the Pi warns about the supply.

**Shutdown timing.** DCDC-USB in **Automotive mode**, timing preset **OFFDELAY 1 min + HARDOFF 1 min**:
1. Key off.
2. 1 min later, PSW pulses J2 and the Pi starts a clean shutdown (logind handles the power key).
3. 1 min after the pulse, the DCDC-USB cuts power.

A short key-off (a fuel stop) inside the first minute doesn't reboot the dash. Below 11.2 V the DCDC-USB cuts power early to protect the battery. **Bench-test the key-on pulse:** if it arrives after the Pi has already booted and shuts it down, ignore the power key for the first ~30 s after boot.

**Fallback:** if the Pi still reports undervoltage (`vcgencmd get_throttled` non-zero, or the low-voltage warning) with short heavy leads, jumper V(out) back to 12 V and add an automotive 12 → 5.1 V / 5 A buck for the Pi and display.

<figure class="wide">
  <img src="/assets/projects/a40-austin/blog/dash/dash-wiring.svg" alt="Dash wiring: constant 12 V with 5 A fuse and ignition sense into the Mini-Box DCDC-USB, its V(out) jumpered to 5 V feeding the Raspberry Pi 5 USB-C and, on a separate pair, the Waveshare display, PSW to the Pi 5 J2 header, PiCAN FD Duo Isolated with can0 to the Haltech Nexus S2 and can1 to the Prius EPAS column" />
  <figcaption>Dash + gateway wiring. Source: <a href="https://github.com/HorvathDawson/portfolio-website/blob/master/scripts/a40-dash-wiring.py">scripts/a40-dash-wiring.py</a> (WireViz).</figcaption>
</figure>

## Hardware assembly

**Phase 1: bench** (official PSU)

1. Fit the NVMe to the Freenove adapter.
2. Fit the Active Cooler (pads on the SoC + PMIC, spring pins, fan lead to the 4-pin JST).
3. Stack the Pi on the adapter with the standoffs. Check that the cooler clears the PCIe ribbon.
4. Connect the PCIe FPC ribbon. Contacts usually face inward, but check the Freenove manual. Seat it flush before closing the latch.
5. Connect the DSI ribbon to the Pi's CAM/DISP 1 connector (verify which one on the board silk).
6. Power the display. On the bench it's fine to use Waveshare's GPIO-pin cable (5 V/GND). In the car it moves to the DCDC-USB 5 V output, so it has one feed only.
7. Power on with the 27 W PSU.

**Phase 2: car**

1. Seat the FD Duo Isolated on the GPIO header.
2. Wire the power and CAN runs from the table above.
3. Set the DCDC-USB jumpers: Automotive mode, **V(out) 5 V** (the default is 12 V), OFFDELAY 1 min / HARDOFF 1 min. Power-cycle the DCDC-USB after changing jumpers so the setting takes effect.
4. **Before connecting the Pi, measure V(out) with a meter: it must read ~5 V.** 12 V on the Pi's 5 V input kills it.
5. Connect the Pi and display, run it under load (e.g. `stress-ng --cpu 4` with the dash up) and measure at the Pi end of the lead: **≥5.0 V**. Check `vcgencmd get_throttled` reports `0x0`. If not, shorten/thicken the leads or use the fallback above.
6. With everything powered off, measure CAN_H-CAN_L on each bus: ~60 Ω.

## Flash the OS (Mac)

1. Raspberry Pi Imager → **Raspberry Pi OS Lite (64-bit, Bookworm)**.
2. OS customisation: hostname `dash`, user `sr20`, Wi-Fi (set the **country code**, or the Wi-Fi stays disabled), SSH on.
3. Flash a microSD, boot, and wait ~90 s.

## Provisioning script (Mac → Pi)

This sets up the overlays, CAN with automatic bus-off restart, a persistent `vcan0` for mock data, and the 5 A supply flag. Bookworm uses NetworkManager and ships without `ifupdown`, so `/etc/network/interfaces.d` is ignored. The CAN interfaces are configured with systemd-networkd instead (NetworkManager leaves CAN alone).

```bash
#!/bin/bash
# setup_dash.sh: run on the Mac
PI="sr20@dash.local"

cat << 'EOF' > payload.sh
#!/bin/bash
set -e
sudo apt-get update
sudo apt-get -y install can-utils

# Overlays: DSI panel, NVMe, PiCAN FD Duo (SPI0 CE0 = can0 IRQ GPIO25, CE1 = can1 IRQ GPIO24, verify)
CFG=/boot/firmware/config.txt
sudo cp $CFG $CFG.bak
for line in \
  'dtoverlay=vc4-kms-dsi-waveshare-panel-v2,12_3_inch_a_4lane' \
  'dtparam=pciex1' \
  'dtparam=nvme' \
  'dtparam=spi=on' \
  'dtoverlay=mcp251xfd,spi0-0,interrupt=25' \
  'dtoverlay=mcp251xfd,spi0-1,interrupt=24' \
  'usb_max_current_enable=1'
do
  sudo grep -qxF "$line" $CFG || echo "$line" | sudo tee -a $CFG
done

# CAN via systemd-networkd: bitrate + automatic restart after bus-off
sudo tee /etc/systemd/network/80-can0.network > /dev/null << 'NET'
[Match]
Name=can0
[CAN]
BitRate=1000000
RestartSec=100ms
NET
sudo tee /etc/systemd/network/80-can1.network > /dev/null << 'NET'
[Match]
Name=can1
[CAN]
BitRate=500000
RestartSec=100ms
NET

# vcan0 for mock data (equivalent of: ip link add dev vcan0 type vcan)
sudo tee /etc/systemd/network/80-vcan0.netdev > /dev/null << 'NET'
[NetDev]
Name=vcan0
Kind=vcan
NET
sudo tee /etc/systemd/network/80-vcan0.network > /dev/null << 'NET'
[Match]
Name=vcan0
NET

sudo systemctl enable systemd-networkd
sudo reboot
EOF

scp payload.sh $PI:~/payload.sh
ssh -t $PI "chmod +x payload.sh && ./payload.sh"
rm payload.sh
```

After the reboot, check:

```bash
ip -details link show can0          # bitrate 1000000, restart-ms 100
ip -details link show can1          # bitrate 500000, restart-ms 100
candump can0                        # Haltech frames once connected
```

For a one-off `vcan0` without the networkd files: `sudo modprobe vcan && sudo ip link add dev vcan0 type vcan && sudo ip link set vcan0 up`.

`PSU_MAX_CURRENT=5000` (set with `sudo rpi-eeprom-config --edit`) does the same job as `usb_max_current_enable=1` from the EEPROM side. One of the two is enough.

## Move the OS to NVMe

**Never `dd` the running SD card**: it's a mounted, changing filesystem and the copy can come out corrupt. Use one of these instead:

- **Clone the live system safely** with `rpi-clone`, which rsyncs a mounted root (use a fork that supports the Pi 5 and NVMe, for example geerlingguy/rpi-clone, **verify** it's current): `sudo rpi-clone nvme0n1`.
- **Or flash the NVMe directly** from the Mac (Imager + USB-M.2 adapter), then rerun the provisioning script.

Then:

1. `sudo raspi-config` → Advanced → Boot Order → NVMe/USB.
2. Shut down.
3. Remove the SD card.
4. Boot.

## Screen check (framebuffer)

Lite has no desktop, so write pixels straight to the framebuffer:

```bash
cat /dev/urandom > /dev/fb0   # colour snow
cat /dev/zero    > /dev/fb0   # back to black
```

`No space left on device` is the expected result: the stream filled the framebuffer.

## UI framework: Godot

The target is an OEM-style cluster at 60 FPS, with eased needles, a key-on sweep, glow on warnings and shaded bezels. I compared two stacks:

- **Qt/QML:** the industry standard, but custom shaders and animation are a steep learning curve for one person.
- **Godot:** a 2D engine where Tweens, AnimationPlayer, glow and particles are each one node, GDScript is close to Python, and the cluster can run on the Mac with mocked data.

Godot it is. One gap: **Godot has no SocketCAN API.** The options:

- A **GDExtension** (C++) that reads `can0`.
- A **sidecar** (for example python-can) that decodes the Haltech frames and sends values to Godot over UDP (`PacketPeerUDP`).

The sidecar is simpler, and it can be tested against `vcan0` without Godot. Either way the dash only reads, and steering-related traffic stays in the separate [gateway service](./epas-can-gateway).

## Gauge layout

The bezel has five openings: a large centre hole and two equal small holes on each side. The small ones are **composite gauges**: an analog dial plus a digital window. This table matches what the generator script draws:

| Slot | Bezel hole | Analog | Digital window | Bands |
|---|---|---|---|---|
| 1 | Far left | Oil pressure, 0-100 psi | Battery V | **Red 0-15 psi** (low pressure is what kills the engine) |
| 2 | Inner left | Coolant, 40-130 °C | Oil temp | Blue 40-60, red 110-130 |
| 3 | Centre | Tach, 0-9000 rpm | km/h + gear | Red from 7500 |
| 4 | Inner right | Boost, −15 to +30 psi | AFR (wideband) | Blue vacuum, red 25-30 psi |
| 5 | Far right | Fuel, E-F | **IAT** | Amber below 10 % |

Warning icons sit as an overlay above the gauges: indicators, high beam, CEL, low oil pressure, overheat and high IAT.

**Oil pressure warning.** Use an rpm-dependent threshold, not a fixed number. The rule of thumb is about 10 psi per 1000 rpm. Set the curve from this engine's measured warm baseline and mirror it in the Haltech engine protection.

**Boost scale.** The scale is linear psi gauge pressure, with no inHg/psi mix: `psi = MAP_kPa_abs / 6.895 − baro_psi` (baro from the ECU, or 14.7). The red band sits above the expected ~18-22 psi target for ~350 whp. Move it to the Haltech overboost cut once the turbo and target are chosen (verify).

**Wideband (LSU 4.9) mounting:**
- Post-turbo, pre-cat.
- Tip down, **at least 10° above horizontal**, so condensate can't pool on the element.
- Exhaust gas at the sensor within the LSU 4.9 limit (**about 930 °C**).
- Heater powered whenever the engine runs.

## Generate gauge assets (Mac)

[scripts/a40-gauge-placeholders.py](https://github.com/HorvathDawson/portfolio-website/blob/master/scripts/a40-gauge-placeholders.py) draws the dial faces, the needles, a preview and `gauges_manifest.json` (pivots, sweeps, formulas, window anchors, panel placement), and prints the Godot numbers below.

```bash
pip install pillow ezdxf
python3 scripts/a40-gauge-placeholders.py
# → public/assets/projects/a40-austin/blog/dash/gauges/
```

Run it on the Mac. It uses macOS fonts (Futura, Menlo), and other systems fall back to a default font.

> **Art status:** the images below predate the script's latest changes: the oil band moved to the low end, the boost scale is now −15 to +30 psi, and slot 5's window changed from ODO to IAT. Rerun on the Mac and commit the new PNGs and manifest.

<figure class="wide">
  <img src="/assets/projects/a40-austin/blog/dash/gauges/dashboard_preview.png" alt="Mockup of the A40 digital cluster: centre tach flanked by four pill gauges" />
  <figcaption>Cluster mockup with demo values (previous art revision).</figcaption>
</figure>

<figure>
  <img src="/assets/projects/a40-austin/blog/dash/dash-gauge-layout.jpg" alt="Generated cluster artwork overlaid on the scanned A40 dash bezel for fit-check" />
  <figcaption>Fit-check: generated artwork on the scanned bezel mesh.</figcaption>
</figure>

## Build the UI in Godot

**Project settings:** 1920×720, Window mode **Windowed** (Exclusive Fullscreen gives a black screen under the Pi's Wayland driver, and sway removes the borders instead), V-Sync on, Stretch `canvas_items` / `keep`.

**Per gauge scene** (Node2D root):

1. Add a `Background` Sprite2D with **Centered** off, at position (0, 0).
2. Add a `Needle` Sprite2D as a child of the root, with **Centered** off. Set its **Offset** to minus the needle hinge and its **Position** to the dial pivot:

| Gauge | Image | Dial pivot (Needle position) | Needle sprite | Offset |
|---|---|---|---|---|
| Tach | center_tach.png 1200×1320 | (600, 660) | needle_long.png | (−40, −561) |
| Oil, Boost (side = right) | pill_*.png 520×900 | (130.4, 450) | needle_short.png | (−16, −243) |
| Coolant, Fuel (side = left) | pill_*.png 520×900 | (389.6, 450) | needle_short.png | (−16, −243) |

3. Drive `Needle.rotation_degrees` (clockwise-positive, 0 = needle pointing up), where `t = (v − min) / (max − min)`:
   - Tach: `-135 + 270 * (rpm / 9000)`
   - Oil, Boost: `108 - 66 * t`
   - Coolant, Fuel: `-108 + 66 * t`
4. Save each gauge as its own `.tscn`.

**Main scene:** instance the five gauge scenes and place them at the positions the script prints. These are the top-left corners on the 1920×720 screen:

| Gauge | Position | Scale |
|---|---|---|
| Oil | (−54.5, 18) | 0.760 |
| Coolant | (306.5, 18) | 0.760 |
| Tach | (676.5, 48) | 0.472 |
| Boost | (1218.5, 18) | 0.760 |
| Fuel | (1579.5, 18) | 0.760 |

**Export:**
1. Linux preset, arm64.
2. **Uncheck Export With Debug** (this removes the `(DEBUG)` title text and the overhead).
3. Save as `dash_app.arm64`.

## Sway + autostart

1. Copy the app across and install sway:

```bash
scp ~/Desktop/dash_app.arm64 sr20@dash.local:~
ssh sr20@dash.local
sudo apt-get install -y sway
sudo usermod -aG video,render,input,tty sr20
```

2. Create `~/.config/sway/config`:

```text
output * transform 270          # portrait-native panel → landscape
seat * hide_cursor 1
default_border none
default_floating_border none
smart_borders on
exec /home/sr20/dash_app.arm64 --display-driver wayland
```

3. Create `/etc/systemd/system/dash.service`:

```ini
[Unit]
Description=SR20 Digital Dash
After=systemd-user-sessions.service systemd-logind.service
Conflicts=getty@tty1.service

[Service]
User=sr20
PAMName=login
TTYPath=/dev/tty1
StandardInput=tty
Environment="WLR_LIBINPUT_NO_DEVICES=1"
ExecStartPre=-/usr/bin/plymouth quit
ExecStart=/usr/bin/sway
Restart=always
RestartSec=1

[Install]
WantedBy=multi-user.target
```

`plymouth quit` releases the framebuffer to sway. The `-` prefix ignores the exit code if Plymouth has already gone.

4. `sudo systemctl daemon-reload && sudo systemctl enable --now dash.service`

## Silent boot with the A40 splash

**1. Generate the splash (Mac).** [scripts/a40-splash-generator.py](https://github.com/HorvathDawson/portfolio-website/blob/master/scripts/a40-splash-generator.py) writes two files:

- `scripts/output/a40-dash/a40-boot-splash-portrait.png` (720×1920, pre-rotated for Plymouth)
- the 1920×720 blog copy below

```bash
python3 scripts/a40-splash-generator.py      # --rotate 270 if it boots upside down
```

<figure>
  <img src="/assets/projects/a40-austin/blog/dash/a40-boot-splash-landscape.png" alt="Generated Austin A40 boot splash crest with diagonal band and gold lettering" />
  <figcaption>Boot splash (landscape copy; the Pi gets the pre-rotated portrait file).</figcaption>
</figure>

**2. Quiet the kernel.** In `/boot/firmware/cmdline.txt` (it must stay **one line**), change `console=tty1` to `console=tty3`, then append:

```text
quiet splash plymouth.ignore-serial-consoles loglevel=0 logo.nologo vt.global_cursor_default=0
```

**3. Install Plymouth and the splash:**

```bash
sudo apt-get install -y plymouth plymouth-themes pix-plym-splash
# from the Mac: scp scripts/output/a40-dash/a40-boot-splash-portrait.png sr20@dash.local:~
sudo cp /usr/share/plymouth/themes/pix/splash.png /usr/share/plymouth/themes/pix/splash.png.bak   # first time
sudo cp ~/a40-boot-splash-portrait.png /usr/share/plymouth/themes/pix/splash.png
sudo plymouth-set-default-theme -R pix     # 1-2 min
sudo reboot
```

Expected boot: black → A40 crest → Plymouth quits → sway → Godot needle sweep. To change the splash later, repeat step 3 with the new portrait PNG.
