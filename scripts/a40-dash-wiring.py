"""
A40 Austin: digital dash + EPAS gateway power/CAN wiring (WireViz).

Emits a YAML harness description and renders it with WireViz to SVG + PNG in
public/assets/projects/a40-austin/blog/dash/dash-wiring.{svg,png}.

Power architecture (matches content/a40/digital-dash.md):
  * Constant +12 V (5 A fuse at the source, 18-14 AWG) -> Mini-Box DCDC-USB V(in).
    Ignition-switched sense -> DCDC-USB IGN. V(in) must be CONSTANT, not switched,
    or the delayed shutdown cannot work.
  * DCDC-USB: one regulated output, V(out), jumpered to 12 V. Automotive mode,
    timing preset OFFDELAY 1 min + HARDOFF 1 min. Its mini-USB port is a
    configuration interface only (not a power output). Vaux is unused.
  * V(out) 12 V -> dedicated automotive 12->5.1 V / 5 A buck. The buck feeds the
    Pi 5 USB-C input and, on a separate pair, the Waveshare display's 5 V input.
    The display has exactly one feed (the buck), never the Pi GPIO 5 V pins as well.
    Pi config: usb_max_current_enable=1 in config.txt, or PSU_MAX_CURRENT=5000 in
    the bootloader EEPROM (a non-PD buck is otherwise treated as a 3 A supply).
  * PiCAN FD Duo Isolated (non-SMPS) sits on the GPIO header and takes its logic
    power from the Pi. Its bus side is isolated: no external 12 V or vehicle ground
    goes to the HAT except each bus's own CAN ground reference.
  * can0: Haltech Nexus S2, 1 Mbit/s. The bus is already terminated at both ends,
    so the HAT terminator on ch0 stays OFF (measure ~60 ohm across CAN_H/L).
  * can1: Prius Gen 3 EPAS column, 500 kbit/s. 120 ohm at the HAT (ch1 jumper ON)
    and 120 ohm at the column end (measure ~60 ohm with power off).
  * DCDC-USB PSW -> Pi 5 J2 power-button header: on key-off (after OFFDELAY) the
    pulse starts a clean OS shutdown; HARDOFF cuts power 1 min later.

Run (needs `pip install wireviz` and Graphviz `dot` on PATH):
  python3 scripts/a40-dash-wiring.py
"""
from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "assets" / "projects" / "a40-austin" / "blog" / "dash"
OUT_DIR.mkdir(parents=True, exist_ok=True)

YAML = r"""
metadata:
  title: A40 Austin - Digital Dash + EPAS Gateway Wiring
  description: |
    Constant 12 V (5 A fuse) + ignition sense into the DCDC-USB (automotive mode,
    OFFDELAY 1 min + HARDOFF 1 min). V(out) 12 V feeds a 5.1 V / 5 A buck for
    the Pi 5 and the display. PiCAN FD Duo Isolated: can0 Haltech 1 Mbit/s,
    can1 Prius EPAS 500 kbit/s.

options:
  bgcolor: WH
  color_mode: full
  fontname: Helvetica

connectors:
  VEH:
    type: Vehicle feeds
    subtype: fuse box + chassis ground stud
    pinlabels:
      - +12 V CONSTANT (5 A fuse at source)
      - IGN switched (fused)
      - Chassis GND
    bgcolor: '#ffe5e5'
    notes: Battery, master switch and fuse box upstream (see wiring overview)
  DCDC_IN:
    type: Mini-Box DCDC-USB input
    subtype: Mini-Fit Jr, 6-34 V, 10 A fuse on board
    pinlabels: [V(in), GND, IGN]
    bgcolor: '#fff3d6'
    notes: Automotive mode. Timing preset OFFDELAY 1 min + HARDOFF 1 min. Mini-USB port = config only, not power. Vaux unused.
  DCDC_OUT:
    type: Mini-Box DCDC-USB output
    subtype: Mini-Fit Jr, V(out) jumpered to 12 V
    pinlabels: [V(out) 12 V, GND]
    bgcolor: '#fff3d6'
  DCDC_PSW:
    type: Mini-Box DCDC-USB PSW header
    subtype: soft on/off pulse
    pinlabels: [PSW 1, PSW 2]
    bgcolor: '#fff3d6'
    notes: Pulses after OFFDELAY; power cut HARDOFF later
  BUCK:
    type: Automotive buck 12 V → 5.1 V / 5 A
    subtype: potted, terminal output (part TBD)
    pinlabels: [VIN 12 V, GND, 5.1 V OUT, GND OUT]
    bgcolor: '#fff3d6'
    notes: Only 5 V source in the system. Feeds the Pi and the display.
  PI:
    type: Raspberry Pi 5
    subtype: 4 GB
    pinlabels:
      - USB-C VBUS
      - USB-C GND
      - J2 PWR_BUT
      - J2 GND
      - DSI (CAM/DISP 1)
      - PCIe FPC
      - 40-pin GPIO header
    notes: config.txt usb_max_current_enable=1 (or EEPROM PSU_MAX_CURRENT=5000)
    bgcolor: '#e3f0ff'
  HAT:
    type: PiCAN FD Duo Isolated (non-SMPS)
    subtype: 2x MCP2518FD on SPI0 CE0/CE1, isolated bus side
    pinlabels:
      - 40-pin header
      - ch0 CAN_H
      - ch0 CAN_L
      - ch0 GND (iso)
      - ch1 CAN_H
      - ch1 CAN_L
      - ch1 GND (iso)
    notes: can0 IRQ GPIO25, can1 IRQ GPIO24 (verify). ch0 120R OFF, ch1 120R ON. No 12 V into the HAT.
    bgcolor: '#e3f0ff'
  ECU:
    type: Haltech Nexus S2 CAN
    subtype: can0, 1 Mbit/s
    pinlabels: [CAN_H, CAN_L, CAN GND / signal GND]
    notes: Bus already has 2 terminators. Do not add a third (measure ~60 ohm).
  EPAS:
    type: Prius Gen 3 EPAS column ECU
    subtype: can1, 500 kbit/s
    pinlabels: [CAN_H, CAN_L, GND]
    notes: 120 ohm at this end unless the ECU has one (measure). Motor feed + IG wake wired separately.
  DISP:
    type: Waveshare 12.3-DSI-TOUCH-A
    subtype: 1920x720, 5 V ≥ 1 A
    pinlabels: [DSI in, 5 V, GND]
  NVME:
    type: NVMe SSD
    subtype: M.2 via Freenove adapter
    pinlabels: [PCIe]

cables:
  W_FEED:
    category: bundle
    gauge: 18 AWG
    length: 1.5
    colors: [RD, WH, BK]
    notes: 18-14 AWG fine on a 5 A fuse. IGN is a sense line (any gauge).
  W_12V:
    category: bundle
    gauge: 18 AWG
    length: 0.2
    colors: [YE, BK]
  W_PSW:
    category: bundle
    gauge: 24 AWG
    length: 0.25
    colors: [BU, BK]
    notes: Soft-shutdown pulse. Verify which PSW pin is the switched side.
  W_PI5V:
    category: bundle
    gauge: 20 AWG
    length: 0.2
    colors: [RD, BK]
    notes: USB-C pigtail, rated 5 A
  W_DISP5V:
    category: bundle
    gauge: 22 AWG
    length: 0.3
    colors: [OG, BK]
    notes: The display's only power feed
  W_CAN0:
    category: bundle
    gauge: 22 AWG
    length: 1.0
    colors: [GN, YE, BK]
    notes: Twisted pair + CAN ground. Short stub off the Haltech bus.
  W_CAN1:
    category: bundle
    gauge: 22 AWG
    length: 1.5
    colors: [GN, WH, BK]
    notes: Twisted pair + ground, ~1-1.5 m, 120 ohm each end
  W_HDR:
    category: bundle
    length: 0.02
    colors: [GY]
    notes: HAT stacked on the GPIO header (logic power + SPI)
  W_DSI:
    category: bundle
    length: 0.3
    colors: [VT]
    notes: 22-pin DSI FFC ribbon
  W_PCIE:
    category: bundle
    length: 0.1
    colors: [VT]
    notes: PCIe FPC ribbon

connections:
  - - VEH: [1, 3, 2]
    - W_FEED: [1, 3, 2]
    - DCDC_IN: [1, 2, 3]

  - - DCDC_OUT: [1, 2]
    - W_12V: [1, 2]
    - BUCK: [1, 2]

  - - BUCK: [3, 4]
    - W_PI5V: [1, 2]
    - PI: [1, 2]

  - - BUCK: [3, 4]
    - W_DISP5V: [1, 2]
    - DISP: [2, 3]

  - - DCDC_PSW: [1, 2]
    - W_PSW: [1, 2]
    - PI: [3, 4]

  - - PI: [7]
    - W_HDR: [1]
    - HAT: [1]

  - - HAT: [2, 3, 4]
    - W_CAN0: [1, 2, 3]
    - ECU: [1, 2, 3]

  - - HAT: [5, 6, 7]
    - W_CAN1: [1, 2, 3]
    - EPAS: [1, 2, 3]

  - - PI: [5]
    - W_DSI: [1]
    - DISP: [1]

  - - PI: [6]
    - W_PCIE: [1]
    - NVME: [1]
"""


def main() -> None:
    if shutil.which("wireviz") is None:
        raise SystemExit("wireviz CLI not found in PATH (pip install wireviz; needs Graphviz).")

    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        yml = tmp_path / "dash-wiring.yml"
        yml.write_text(YAML.lstrip())
        subprocess.run(
            [
                "wireviz",
                "-f", "sp",  # SVG + PNG
                "-o", str(OUT_DIR),
                "-O", "dash-wiring",
                str(yml),
            ],
            check=True,
        )

    for ext in ("svg", "png"):
        f = OUT_DIR / f"dash-wiring.{ext}"
        print("wrote", f, f"({f.stat().st_size:,} B)")


if __name__ == "__main__":
    main()
