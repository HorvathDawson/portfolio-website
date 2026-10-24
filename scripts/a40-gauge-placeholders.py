"""Generate the Austin A40 restomod digital-twin dash asset kit.

Outputs (all PNG, transparent backgrounds where applicable, written to
``public/assets/projects/a40-austin/blog/dash/gauges/``):

  Slot layout, left to right (matches content/a40/digital-dash.md):
    1 far left    pill_oil_pressure.png Oil pressure 0-100 psi (red 0-15 psi
                                        low-pressure band) + digital battery V.
    2 inner left  pill_coolant_temp.png Coolant 40-130 °C (blue 40-60, red
                                        110-130) + digital oil temp.
    3 centre      center_tach.png       0-9000 rpm tach (red from 7500) with
                                        recessed digital km/h and gear windows.
    4 inner right pill_boost.png        Boost -15..+30 psi gauge pressure, one
                                        linear psi scale (blue vacuum side, red
                                        25-30 psi) + digital AFR.
    5 far right   pill_fuel.png         Fuel E..F (amber below 10 %) + digital
                                        intake air temp (IAT).

  Needles:
    - needle_long.png       Long tapered black needle for the center tach.
    - needle_short.png      Shorter needle for the side pill gauges.

  Preview / integration:
    - dashboard_preview.png All five gauges with demo values, for checking
                            proportions before importing into Godot.
    - dashboard_panel.png   Same, placed on the scanned bezel (dashscan.dxf).
    - gauges_manifest.json  Pivots, sweeps, value->angle formulas, digital
                            window anchors and panel placement for Godot.

Godot rotation: Node2D.rotation_degrees is clockwise-positive with the
unrotated needle sprite pointing up, so godot_rot = 90 - math_angle.
  Tach:                 godot_rot = -135 + 270 * (rpm / 9000)
  Pills, side='right':  godot_rot =  108 -  66 * t     (t = (v-min)/(max-min))
  Pills, side='left':   godot_rot = -108 +  66 * t

Fonts are macOS system fonts (Futura, Menlo); on other systems PIL falls back
to its default font, so regenerate the published PNGs on the Mac.

All gauges share a "vintage parchment" aesthetic (warm cream face, soft
charcoal ink, faded chrome bezel rings, classic Futura-style numerals).
"""

from __future__ import annotations

import json
import math
import os
from typing import Callable, Sequence
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# Output configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, os.pardir))
OUT_DIR = os.path.join(
    REPO_ROOT, "public", "assets", "projects", "a40-austin", "blog", "dash", "gauges"
)
DASH_DIR = os.path.join(
    REPO_ROOT, "public", "assets", "projects", "a40-austin", "blog", "dash"
)
BEZEL_DXF_PATH = os.path.join(DASH_DIR, "dashscan.dxf")
SSAA = 2  # super-sampling factor for anti-aliasing

# ---------------------------------------------------------------------------
# Target display panel (Waveshare 12.3" 1920x720 DSI)
# ---------------------------------------------------------------------------
# Real-world pixel pitch derived from diagonal geometry:
#   diag_px = sqrt(1920^2 + 720^2) = 2050.56 px
#   px_per_inch = diag_px / 12.3  = 166.71 px/in
#   mm_per_px   = 25.4 / px_per_inch ≈ 0.15236 mm/px
#   panel size  ≈ 292.55 mm × 109.71 mm
PANEL_DIAGONAL_IN = 12.3
PANEL_W_PX = 1920
PANEL_H_PX = 720
PANEL_DIAG_PX = math.hypot(PANEL_W_PX, PANEL_H_PX)
PANEL_PX_PER_IN = PANEL_DIAG_PX / PANEL_DIAGONAL_IN
PANEL_MM_PER_PX = 25.4 / PANEL_PX_PER_IN
PANEL_W_MM = PANEL_W_PX * PANEL_MM_PER_PX
PANEL_H_MM = PANEL_H_PX * PANEL_MM_PER_PX
PANEL_SSAA = 2  # super-sample the panel render

# ---------------------------------------------------------------------------
# Panel-layout transforms (mm-space, DXF coords with +y up)
# ---------------------------------------------------------------------------
# Each gauge is positioned by (cx_mm, cy_mm) in the DXF coordinate space and
# scaled so its rendered height matches `target_h_mm`. Outside/inside pills
# share a single x-offset and are placed symmetrically about x=0.

# Center tach (slot 3)
# CENTER_TACH_TARGET_H_MM is the parchment-fill height. The tick face occupies
# 76% of that (see face_w/face_h in render_center_tach), so a value of 95 mm
# yields a ~72 mm tick face plus ~11 mm of parchment buffer on each side that
# extends past the DXF bezel outline.
CENTER_TACH_OFFSET_MM = (0.0, 0.0)
CENTER_TACH_TARGET_H_MM = 95.0

# Inside pills (slots 2 & 4: coolant, boost) — placed at ±x, same y
# Pivot on each inside pill points TOWARD the center tach, so shifting
# "toward the pivot" pulls the pill inward (toward x=0).
INSIDE_PILL_OFFSET_X_MM = 73.0
INSIDE_PILL_OFFSET_Y_MM = 0.0
INSIDE_PILL_TARGET_H_MM = 58.2  # 68.5 * 0.85 (≈ 15% smaller)
INSIDE_PILL_SHIFT_TOWARD_PIVOT_MM = 0.0  # +mm = move toward pivot (inward)

# Outside pills (slots 1 & 5: oil, fuel) — placed at ±x, same y
# Pivot on each outside pill points AWAY from center, so shifting "toward
# the pivot" pushes the pill outward (away from x=0).
OUTSIDE_PILL_OFFSET_X_MM = 121.0
OUTSIDE_PILL_OFFSET_Y_MM = 0.0
OUTSIDE_PILL_TARGET_H_MM = 58.2
OUTSIDE_PILL_SHIFT_TOWARD_PIVOT_MM = 0.0  # +mm = move toward pivot (outward)

# ---------------------------------------------------------------------------
# Shared aesthetic (the Restomod Style Guide)
# ---------------------------------------------------------------------------

PARCHMENT = (242, 239, 233, 255)        # #F2EFE9
PARCHMENT_EDGE = (224, 218, 200, 255)
INK = (45, 40, 35, 255)                  # warm charcoal, not pure black
INK_SOFT = (90, 82, 72, 255)
INK_FAINT = (140, 128, 110, 255)
CHROME_OUTER = (70, 65, 58, 255)
CHROME_MID = (185, 180, 168, 255)
CHROME_INNER = (45, 40, 36, 255)
REDLINE = (172, 30, 28, 255)
WARN_AMBER = (200, 130, 30, 255)
COOL_BLUE = (60, 90, 140, 255)
DIGITAL_BG = (28, 24, 20, 255)           # recessed window background
DIGITAL_INK = (235, 220, 190, 255)       # warm "tritium" amber-cream
SHADOW = (0, 0, 0, 90)


# ---------------------------------------------------------------------------
# Geometry helpers
# ---------------------------------------------------------------------------

def polar(cx: float, cy: float, r: float, angle_deg: float) -> tuple[float, float]:
    """Math-convention polar -> screen pixel (PIL y-down)."""
    a = math.radians(angle_deg)
    return cx + r * math.cos(a), cy - r * math.sin(a)


def fill_rounded_rect(d: ImageDraw.ImageDraw, cx: float, cy: float,
                      w: float, h: float, r: float, fill) -> None:
    r = max(0.0, min(r, min(w, h) / 2))
    d.rounded_rectangle((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2),
                        radius=r, fill=fill)


def stadium_inner_radius(theta_deg: float, w: float, h: float,
                         margin: float = 0.0, *, vertical: bool = False) -> float:
    """Distance from center to inner edge of a stadium along ray theta.

    Horizontal stadium: rounded ends on left/right (radius = h/2).
    Vertical stadium:   rounded ends on top/bottom (radius = w/2).
    """
    if vertical:
        # Swap roles: a vertical stadium of (w, h) is a horizontal one of
        # (h, w) seen with x and y swapped, i.e. theta -> 90 - theta.
        return stadium_inner_radius(90 - theta_deg, h, w, margin)

    half_h = h / 2
    half_w = w / 2
    flat_half = max(0.0, half_w - half_h)

    a = math.radians(theta_deg)
    dx = math.cos(a)
    dy = -math.sin(a)

    candidates: list[float] = []
    if dy != 0:
        for y_edge in (-half_h, half_h):
            t = y_edge / dy
            if t > 0:
                x = t * dx
                if -flat_half <= x <= flat_half:
                    candidates.append(t)
    for sign in (-1, 1):
        cx0 = sign * flat_half
        B = -2 * dx * cx0
        C = cx0 * cx0 - half_h * half_h
        disc = B * B - 4 * C  # A = 1
        if disc < 0:
            continue
        sq = math.sqrt(disc)
        for t in ((-B + sq) / 2, (-B - sq) / 2):
            if t > 0:
                x = t * dx
                if (sign > 0 and x >= flat_half - 1e-6) or \
                   (sign < 0 and x <= -flat_half + 1e-6):
                    candidates.append(t)
    if not candidates:
        return half_h - margin
    return min(candidates) - margin


def rounded_square_inner_radius(theta_deg: float, w: float, h: float,
                                corner_r: float, margin: float = 0.0) -> float:
    """Distance to the inner edge of a rounded rectangle along ray theta.

    Solves intersection with the 4 straight edges and 4 corner quarter-
    circles, returns the smallest positive distance.
    """
    half_w = w / 2
    half_h = h / 2
    a = math.radians(theta_deg)
    dx = math.cos(a)
    dy = -math.sin(a)

    candidates: list[float] = []
    flat_x_half = half_w - corner_r
    flat_y_half = half_h - corner_r

    # Top / bottom flat edges (y = ±half_h, |x| <= flat_x_half).
    if dy != 0:
        for y_edge in (-half_h, half_h):
            t = y_edge / dy
            if t > 0:
                x = t * dx
                if -flat_x_half <= x <= flat_x_half:
                    candidates.append(t)
    # Left / right flat edges (x = ±half_w, |y| <= flat_y_half).
    if dx != 0:
        for x_edge in (-half_w, half_w):
            t = x_edge / dx
            if t > 0:
                y = t * dy
                if -flat_y_half <= y <= flat_y_half:
                    candidates.append(t)
    # Four corner quarter-circles.
    for sx in (-1, 1):
        for sy in (-1, 1):
            cx0 = sx * flat_x_half
            cy0 = sy * flat_y_half
            B = -2 * (dx * cx0 + dy * cy0)
            C = cx0 * cx0 + cy0 * cy0 - corner_r * corner_r
            disc = B * B - 4 * C
            if disc < 0:
                continue
            sq = math.sqrt(disc)
            for t in ((-B + sq) / 2, (-B - sq) / 2):
                if t > 0:
                    x = t * dx
                    y = t * dy
                    # Must be in the corner quadrant.
                    if ((sx > 0 and x >= flat_x_half - 1e-6) or
                            (sx < 0 and x <= -flat_x_half + 1e-6)) and \
                       ((sy > 0 and y >= flat_y_half - 1e-6) or
                            (sy < 0 and y <= -flat_y_half + 1e-6)):
                        candidates.append(t)

    if not candidates:
        return min(half_w, half_h) - margin
    return min(candidates) - margin


# ---------------------------------------------------------------------------
# "Barrel" shape: rectangle whose left/right edges are arcs of a large-radius
# circle (slightly bulging outward). Top/bottom edges remain straight. Used
# for both the center tach and the side pills (rotated 90° conceptually:
# wide & short for center, narrow & tall for pills).
# ---------------------------------------------------------------------------

def _barrel_arc_geometry(h: float, bulge: float) -> tuple[float, float]:
    """Return (R, cx_offset) for one side arc of a barrel.

    The arc has chord = h (vertical for L/R bulges) and sagitta = bulge.
    R = bulge/2 + h^2 / (8 * bulge).  cx_offset is how far the arc's center
    sits horizontally INSIDE the bounding rectangle's edge (x = ±w/2).
    """
    if bulge <= 0:
        return float("inf"), 0.0
    R = bulge / 2.0 + (h * h) / (8.0 * bulge)
    # Arc center for the right edge sits at x = w/2 + bulge - R (negative
    # if R > bulge, which is the usual case). cx_offset = R - bulge.
    return R, R - bulge


def fill_barrel(d: ImageDraw.ImageDraw, cx: float, cy: float,
                w: float, h: float, bulge: float, fill,
                samples_per_arc: int = 60) -> None:
    """Fill a barrel shape (rectangle + L/R outward arcs)."""
    if bulge <= 0:
        d.rectangle((cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), fill=fill)
        return
    R, off = _barrel_arc_geometry(h, bulge)
    pts: list[tuple[float, float]] = []
    # Top edge (left -> right)
    pts.append((cx - w / 2, cy - h / 2))
    pts.append((cx + w / 2, cy - h / 2))
    # Right arc: sweep from top corner outward to (cx + w/2 + bulge, cy)
    # then back to bottom corner. Arc center at (cx + w/2 - off, cy).
    arc_cx = cx + w / 2 - off
    # Angle from arc center to top corner: corner at (cx + w/2, cy - h/2)
    # vector = (off, -h/2). atan2(-(-h/2), off) — but we work in math angles.
    a_top = math.atan2(-(- h / 2), w / 2 - (w / 2 - off))  # = atan2(h/2, off)
    # We sweep CCW around arc center from -a_top to +a_top through 0 (which
    # is the rightmost point of the arc). a_top is the angle ABOVE x-axis;
    # top corner is BELOW center? No — y = cy - h/2 means above (PIL y-down).
    a_top = math.atan2(h / 2, off)
    for i in range(1, samples_per_arc):
        # Go from top corner (-a_top) through 0 to bottom corner (+a_top)
        t = -a_top + (i / samples_per_arc) * (2 * a_top)
        pts.append((arc_cx + R * math.cos(t), cy + R * math.sin(t)))
    # Bottom edge (right -> left)
    pts.append((cx + w / 2, cy + h / 2))
    pts.append((cx - w / 2, cy + h / 2))
    # Left arc: sweep from bottom-left corner through leftmost point to
    # top-left corner. Arc center at (cx - w/2 + off, cy).
    arc_cx = cx - w / 2 + off
    for i in range(1, samples_per_arc):
        t = math.pi - a_top + (i / samples_per_arc) * (2 * a_top)
        # We want to start at bottom-left corner and sweep to top-left,
        # i.e. from angle = pi - a_top (bottom-left, y +h/2) to pi + a_top
        # (top-left, y -h/2). atan2(sin, cos) -> sin negative is up.
        # Actually corner positions:
        #   bottom-left = (cx - w/2, cy + h/2). vec from arc center:
        #     (-off, h/2). angle = atan2(h/2, -off) = pi - a_top.
        #   top-left    = (cx - w/2, cy - h/2). vec = (-off, -h/2).
        #     angle = atan2(-h/2, -off) = -(pi - a_top) = a_top - pi
        #             == pi + a_top (mod 2*pi).
        # So we sweep from (pi - a_top) to (pi + a_top), going through pi.
        pts.append((arc_cx + R * math.cos(t), cy + R * math.sin(t)))
    d.polygon(pts, fill=fill)


def barrel_inner_radius(theta_deg: float, w: float, h: float,
                        bulge: float, margin: float = 0.0) -> float:
    """Distance from center along ray theta to inner edge of a barrel."""
    if bulge <= 0:
        # Plain rectangle.
        return rect_inner_radius(theta_deg, w, h) - margin
    R, off = _barrel_arc_geometry(h, bulge)
    half_w = w / 2
    half_h = h / 2

    a = math.radians(theta_deg)
    dx = math.cos(a)
    dy = -math.sin(a)

    candidates: list[float] = []
    # Top/bottom horizontal edges (y = ±half_h, |x| <= half_w)
    if dy != 0:
        for y_edge in (-half_h, half_h):
            t = y_edge / dy
            if t > 0:
                x = t * dx
                if -half_w <= x <= half_w:
                    candidates.append(t)
    # Left/right arcs centered at (±(half_w - off), 0) with radius R.
    for sign in (-1, 1):
        cx0 = sign * (half_w - off)
        B = -2 * dx * cx0
        C = cx0 * cx0 - R * R
        disc = B * B - 4 * C
        if disc < 0:
            continue
        sq = math.sqrt(disc)
        for t in ((-B + sq) / 2, (-B - sq) / 2):
            if t > 0:
                x = t * dx
                # Must be on the bulge side (|x| > half_w roughly, allowing
                # tiny tolerance for the corners).
                if (sign > 0 and x >= half_w - 1e-3) or \
                   (sign < 0 and x <= -half_w + 1e-3):
                    candidates.append(t)
    if not candidates:
        return min(half_w + bulge, half_h) - margin
    return min(candidates) - margin


def rect_inner_radius(theta_deg: float, w: float, h: float,
                      margin: float = 0.0) -> float:
    a = math.radians(theta_deg)
    dx = math.cos(a)
    dy = -math.sin(a)
    candidates = []
    if dy != 0:
        for y_edge in (-h / 2, h / 2):
            t = y_edge / dy
            if t > 0 and abs(t * dx) <= w / 2:
                candidates.append(t)
    if dx != 0:
        for x_edge in (-w / 2, w / 2):
            t = x_edge / dx
            if t > 0 and abs(t * dy) <= h / 2:
                candidates.append(t)
    return (min(candidates) if candidates else min(w, h) / 2) - margin


# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def load_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        # Closest to Gill Sans / Futura on macOS.
        "/System/Library/Fonts/Supplemental/Futura.ttc",
        "/System/Library/Fonts/Supplemental/GillSans.ttc",
        "/System/Library/Fonts/HelveticaNeue.ttc",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def load_mono_font(size: int) -> ImageFont.FreeTypeFont:
    """For digital readouts -- use a slightly mechanical-looking mono."""
    candidates = [
        "/System/Library/Fonts/Menlo.ttc",
        "/System/Library/Fonts/Courier.ttc",
        "/System/Library/Fonts/Monaco.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return load_font(size)


def text_size(draw: ImageDraw.ImageDraw, text: str, font) -> tuple[float, float]:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[2] - bbox[0], bbox[3] - bbox[1]


def draw_text_centered(d: ImageDraw.ImageDraw, xy, text, font, fill) -> None:
    bbox = d.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    d.text((xy[0] - w / 2 - bbox[0], xy[1] - h / 2 - bbox[1]),
           text, font=font, fill=fill)


def thick_line(d: ImageDraw.ImageDraw, p1, p2, width: int, fill) -> None:
    d.line((p1[0], p1[1], p2[0], p2[1]), fill=fill, width=int(width))
    r = width / 2
    d.ellipse((p1[0] - r, p1[1] - r, p1[0] + r, p1[1] + r), fill=fill)
    d.ellipse((p2[0] - r, p2[1] - r, p2[0] + r, p2[1] + r), fill=fill)


def render_rotated_text(text: str, font, fill, *, angle: float = 90,
                        sub_text: str = "", sub_font=None,
                        sub_fill=None) -> Image.Image:
    """Render text into a transparent image, rotated by `angle` degrees.

    angle=90 reads bottom-to-top; angle=-90 reads top-to-bottom.
    If `sub_text` is provided it is rendered as a second line **directly
    under** the main text (in horizontal reading order) before the whole
    block is rotated, so the rotated result reads "title / sub" stacked
    along a single column.
    """
    bbox = font.getbbox(text)
    tw = max(1, bbox[2] - bbox[0])
    th = max(1, bbox[3] - bbox[1])

    sub_bbox = None
    if sub_text:
        sub_bbox = sub_font.getbbox(sub_text)
        sw = max(1, sub_bbox[2] - sub_bbox[0])
        sh = max(1, sub_bbox[3] - sub_bbox[1])
        gap = max(2, int(th * 0.15))
        block_w = max(tw, sw)
        block_h = th + gap + sh
    else:
        block_w, block_h = tw, th
        sw = sh = gap = 0

    pad = max(4, int(max(block_w, block_h) * 0.10))
    layer = Image.new("RGBA", (block_w + 2 * pad, block_h + 2 * pad), (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    # Main title: horizontally centered in the block
    main_x = pad + (block_w - tw) / 2 - bbox[0]
    main_y = pad - bbox[1]
    ld.text((main_x, main_y), text, font=font, fill=fill)
    if sub_text:
        sub_x = pad + (block_w - sw) / 2 - sub_bbox[0]
        sub_y = pad + th + gap - sub_bbox[1]
        ld.text((sub_x, sub_y), sub_text, font=sub_font, fill=sub_fill)
    return layer.rotate(angle, resample=Image.BICUBIC, expand=True)


def paste_centered(base: Image.Image, layer: Image.Image, xy) -> None:
    rw, rh = layer.size
    base.alpha_composite(layer, (int(xy[0] - rw / 2), int(xy[1] - rh / 2)))


def draw_recessed_window(d: ImageDraw.ImageDraw, cx, cy, w, h, *,
                         radius: float | None = None) -> None:
    """Inner-shadow rounded box that reads as a cutout in the parchment."""
    if radius is None:
        radius = h * 0.18
    # Outer dark frame
    fill_rounded_rect(d, cx, cy, w + h * 0.08, h + h * 0.08,
                      radius + h * 0.04, (20, 18, 16, 200))
    # Inset highlight (very faint, mimics machined edge)
    fill_rounded_rect(d, cx, cy, w + h * 0.04, h + h * 0.04,
                      radius + h * 0.02, (60, 55, 48, 255))
    # Recessed surface
    fill_rounded_rect(d, cx, cy, w, h, radius, DIGITAL_BG)


# ---------------------------------------------------------------------------
# Center tach (rounded square, slightly narrower than tall)
# ---------------------------------------------------------------------------

CENTER_W = 1200
CENTER_H = 1320  # slightly taller than wide
CENTER_BULGE = 32  # left/right edge bulge in px (large radius, subtle)
CENTER_RPM_MIN = 0
CENTER_RPM_MAX = 9000
CENTER_RPM_REDLINE = 7500
CENTER_SWEEP_START = 225.0  # 0 RPM at lower-left
CENTER_SWEEP_TOTAL = 270.0  # CW through top to lower-right


def render_center_tach() -> Image.Image:
    W, H = CENTER_W * SSAA, CENTER_H * SSAA
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = W / 2, H / 2

    # No chrome bezel rings — the DXF panel outline now serves as the
    # visible bezel. Fill the entire image with parchment.
    base_bulge = CENTER_BULGE * SSAA
    fill_barrel(d, cx, cy, W, H, base_bulge, PARCHMENT)

    # ---- mm-anchored tick envelope ---------------------------------------
    # The center tach reads against a 4-arc rounded-rect envelope:
    #   inner bbox 65 × 70 mm (sweep endpoints = corners ±32.5, ±35)
    #   outer bbox 74 × 80 mm (sweep apex points)
    # Four partial-ellipse arcs, each spanning between two adjacent inner-
    # box corners and bulging out to the outer-box edge midpoint:
    #   top:    center (0, +3.739),   a_h=70,     a_v=43.739    (apex y=+40 in math y-up)
    #   bottom: center (0, -3.739),   a_h=70,     a_v=43.739    (apex y=-40)
    #   right:  center (-20.168, 0),  a_h=57.168, a_v=90        (apex x=+37)
    #   left:   center (+20.168, 0),  a_h=57.168, a_v=90        (apex x=-37)
    # All in math (y-up) mm convention with origin at canvas center.
    #
    # Canvas is sized so the full canvas height = CENTER_TACH_TARGET_H_MM (95 mm),
    # which leaves a parchment margin around the 80-mm-tall envelope.
    px_per_mm = H / CENTER_TACH_TARGET_H_MM

    def mm_len(mm: float) -> float:
        return mm * px_per_mm

    # Inner-box corner angle (degrees, math): atan2(35, 32.5).
    CORNER_DEG = math.degrees(math.atan2(35.0, 32.5))   # ≈ 47.10°

    def outer_r_mm(theta_deg: float) -> float:
        """Distance from canvas center to the 4-arc envelope at given math angle."""
        deg = ((theta_deg + 180.0) % 360.0) - 180.0   # normalize to (-180, 180]
        if -CORNER_DEG <= deg <= CORNER_DEG:
            xc_mm, yc_mm, ah, av = -20.168, 0.0, 57.168, 90.0     # right arc
        elif CORNER_DEG <= deg <= 180.0 - CORNER_DEG:
            xc_mm, yc_mm, ah, av = 0.0, -3.739, 70.0, 43.739      # top arc (math y-up)
        elif deg >= 180.0 - CORNER_DEG or deg <= -(180.0 - CORNER_DEG):
            xc_mm, yc_mm, ah, av = 20.168, 0.0, 57.168, 90.0      # left arc
        else:
            xc_mm, yc_mm, ah, av = 0.0, 3.739, 70.0, 43.739       # bottom arc
        a = math.radians(theta_deg)
        c, s_ = math.cos(a), math.sin(a)
        # Ray (t·c, t·s) ∩ ellipse ((x-xc)/ah)² + ((y-yc)/av)² = 1
        A = (c / ah) ** 2 + (s_ / av) ** 2
        B = xc_mm * c / (ah * ah) + yc_mm * s_ / (av * av)
        C = (xc_mm / ah) ** 2 + (yc_mm / av) ** 2 - 1.0
        disc = B * B - A * C
        if disc < 0:
            return 0.0
        return (B + math.sqrt(disc)) / A   # mm

    def outer_r_px(theta_deg: float) -> float:
        return mm_len(outer_r_mm(theta_deg))

    def value_to_angle(rpm: float) -> float:
        t = (rpm - CENTER_RPM_MIN) / (CENTER_RPM_MAX - CENTER_RPM_MIN)
        return CENTER_SWEEP_START - t * CENTER_SWEEP_TOTAL

    # Tick dims in mm (consistent with pill gauges, scaled up for center).
    minor_len_mm, mid_len_mm, major_len_mm = 2.0, 3.5, 5.5
    minor_w = max(2, int(mm_len(0.4)))
    mid_w   = max(3, int(mm_len(0.7)))
    major_w = max(5, int(mm_len(1.1)))

    def tick_pts(rpm: float, length_mm: float):
        a = value_to_angle(rpm)
        outer_r = outer_r_px(a)
        return (polar(cx, cy, outer_r, a),
                polar(cx, cy, outer_r - mm_len(length_mm), a))

    # Redline band: dense thick red ticks tracing the outer edge.
    redline_outer_inset_mm = 0.4
    redline_len_mm = 5.0
    redline_w = max(6, int(mm_len(1.5)))
    for i in range(81):
        rpm = CENTER_RPM_REDLINE + (i / 80) * (CENTER_RPM_MAX - CENTER_RPM_REDLINE)
        a = value_to_angle(rpm)
        outer_r = outer_r_px(a) - mm_len(redline_outer_inset_mm)
        inner_r = outer_r - mm_len(redline_len_mm)
        thick_line(d, polar(cx, cy, outer_r, a), polar(cx, cy, inner_r, a),
                   redline_w, REDLINE)

    # Minor ticks every 100, mid every 500, major every 1000.
    for rpm in range(CENTER_RPM_MIN, CENTER_RPM_MAX + 1, 100):
        if rpm % 500 == 0:
            continue
        p1, p2 = tick_pts(rpm, minor_len_mm)
        thick_line(d, p1, p2, minor_w, INK_SOFT)
    for rpm in range(CENTER_RPM_MIN, CENTER_RPM_MAX + 1, 500):
        if rpm % 1000 == 0:
            continue
        col = REDLINE if rpm >= CENTER_RPM_REDLINE else INK
        p1, p2 = tick_pts(rpm, mid_len_mm)
        thick_line(d, p1, p2, mid_w, col)
    for rpm in range(CENTER_RPM_MIN, CENTER_RPM_MAX + 1, 1000):
        col = REDLINE if rpm >= CENTER_RPM_REDLINE else INK
        p1, p2 = tick_pts(rpm, major_len_mm)
        thick_line(d, p1, p2, major_w, col)

    # Numerals 0..9 — placed inside the major ticks.
    num_font_mm = 4.5
    num_inset_mm = major_len_mm + 3.5
    num_font = load_font(int(mm_len(num_font_mm)))
    for rpm in range(CENTER_RPM_MIN, CENTER_RPM_MAX + 1, 1000):
        a = value_to_angle(rpm)
        r = outer_r_px(a) - mm_len(num_inset_mm)
        x, y = polar(cx, cy, r, a)
        col = REDLINE if rpm >= CENTER_RPM_REDLINE else INK
        draw_text_centered(d, (x, y), str(rpm // 1000), num_font, col)

    # Brand legend - above the hub but below the 4/5 numerals at the top
    # of the sweep, so nothing overlaps the ticks or numerals.
    brand_font = load_font(int(H * 0.034))
    legend_font = load_font(int(H * 0.024))
    draw_text_centered(d, (cx, cy - H * 0.190),
                       "TACHOMETER", brand_font, INK)
    draw_text_centered(d, (cx, cy - H * 0.150),
                       "x 1000  RPM", legend_font, INK_SOFT)

    # Recessed digital cutouts: top = MPH (taller now so the live readout
    # has more vertical room), bottom = gear. Both render with their
    # static label only — the live value is painted by Godot at runtime.
    # Top MPH window
    mph_w, mph_h = W * 0.40, H * 0.150
    mph_cx, mph_cy = cx, cy + H * 0.175
    draw_recessed_window(d, mph_cx, mph_cy, mph_w, mph_h)
    mph_font_px = int(mph_h * 0.48)
    mph_label_font_px = int(H * 0.024)
    mph_value_anchor_y = mph_cy - mph_h * 0.10
    mph_label_anchor_y = mph_cy + mph_h * 0.36
    mph_label_font = load_font(mph_label_font_px)
    draw_text_centered(d, (mph_cx, mph_label_anchor_y),
                       "KM/H", mph_label_font, DIGITAL_INK)

    # Bottom gear window (smaller square)
    gear_w, gear_h = H * 0.110, H * 0.110
    gear_cx, gear_cy = cx, cy + H * 0.330
    draw_recessed_window(d, gear_cx, gear_cy, gear_w, gear_h,
                         radius=gear_h * 0.18)
    gear_font_px = int(gear_h * 0.70)
    gear_value_anchor_y = gear_cy - gear_h * 0.05
    gear_label_anchor_y = gear_cy + gear_h * 0.42
    draw_text_centered(d, (gear_cx, gear_label_anchor_y),
                       "GEAR", mph_label_font, DIGITAL_INK)

    # Center hub cap (needle pivots here)
    hub_r = H * 0.040
    d.ellipse((cx - hub_r, cy - hub_r, cx + hub_r, cy + hub_r),
              fill=(30, 26, 22, 255))
    d.ellipse((cx - hub_r * 0.55, cy - hub_r * 0.55,
               cx + hub_r * 0.55, cy + hub_r * 0.55),
              fill=(85, 78, 66, 255))

    out = img.resize((CENTER_W, CENTER_H), Image.LANCZOS)

    manifest = {
        "kind": "center_tach",
        "image_size": [CENTER_W, CENTER_H],
        "title": "TACHOMETER",
        "sub_title": "x 1000  RPM",
        "value": {
            "min": CENTER_RPM_MIN,
            "max": CENTER_RPM_MAX,
            "redline": CENTER_RPM_REDLINE,
            "major_step": 1000,
            "mid_step": 500,
            "minor_step": 100,
        },
        "needle": {
            "pivot": [cx / SSAA, cy / SSAA],
            "sweep_start_math_deg": CENTER_SWEEP_START,
            "sweep_total_deg": CENTER_SWEEP_TOTAL,
            "value_to_math_angle_deg": (
                f"{CENTER_SWEEP_START} - (rpm - {CENTER_RPM_MIN}) / "
                f"({CENTER_RPM_MAX} - {CENTER_RPM_MIN}) * {CENTER_SWEEP_TOTAL}"
            ),
            "godot_rotation_deg_cw_from_up": (
                f"rot = 90 - math_angle = {90 - CENTER_SWEEP_START:g} + "
                f"(rpm / {CENTER_RPM_MAX}) * {CENTER_SWEEP_TOTAL:g}"
            ),
            "sprite": "needle_long.png",
        },
        "digital": {
            "speed": {
                "label": "KM/H",
                "window": {
                    "cx": mph_cx / W, "cy": mph_cy / H,
                    "w": mph_w / W,  "h": mph_h / H,
                },
                "value_anchor": {
                    "cx": mph_cx / W, "cy": mph_value_anchor_y / H,
                    "font": "mono",
                    "font_px_at_native_h": int(mph_font_px / SSAA),
                    "color": DIGITAL_INK[:3],
                    "align": "center",
                },
                "label_anchor": {
                    "cx": mph_cx / W, "cy": mph_label_anchor_y / H,
                    "font": "sans",
                    "font_px_at_native_h": int(mph_label_font_px / SSAA),
                    "color": DIGITAL_INK[:3],
                    "align": "center",
                },
            },
            "gear": {
                "label": "GEAR",
                "window": {
                    "cx": gear_cx / W, "cy": gear_cy / H,
                    "w": gear_w / W,  "h": gear_h / H,
                },
                "value_anchor": {
                    "cx": gear_cx / W, "cy": gear_value_anchor_y / H,
                    "font": "sans",
                    "font_px_at_native_h": int(gear_font_px / SSAA),
                    "color": DIGITAL_INK[:3],
                    "align": "center",
                },
                "label_anchor": {
                    "cx": gear_cx / W, "cy": gear_label_anchor_y / H,
                    "font": "sans",
                    "font_px_at_native_h": int(mph_label_font_px / SSAA),
                    "color": DIGITAL_INK[:3],
                    "align": "center",
                },
            },
        },
    }
    return out, manifest


# ---------------------------------------------------------------------------
# Vertical pill side gauge (parameterised)
# ---------------------------------------------------------------------------

# Pill outer dimensions. The pills are intentionally SHORTER than the
# center tach so they read as secondary instruments.
PILL_W = 520
PILL_H = 900

# Pivot is offset toward one edge; the dial (ticks + numerals + sweep)
# lives on the opposite side. Numbers therefore appear on either the left
# or right side of the gauge.
PILL_PIVOT_INSET_FRAC = 0.04      # pivot inset from the chosen edge (small = pivot at very edge, dial sweeps across most of the gauge)
PILL_SWEEP_TOP_DEG = 48.0         # angular reach above horizontal (toward title)
PILL_SWEEP_BOTTOM_DEG = 18.0      # angular reach below horizontal (toward digital window)
PILL_BULGE = 22                   # left/right edge bulge in px (subtle)


def render_pill_gauge(*,
                      title: str,
                      sub_title: str,
                      value_min: float,
                      value_max: float,
                      major_step: float,
                      mid_step: float | None,
                      minor_step: float | None,
                      label_formatter: Callable[[float], str],
                      warn_start: float | None = None,
                      warn_end: float | None = None,
                      warn_color=REDLINE,
                      cool_start: float | None = None,
                      cool_end: float | None = None,
                      digital_label: str = "",
                      digital_value: str = "",
                      side: str = "right",
                      outline: dict | None = None,
                      ) -> Image.Image:
    """Render a side pill gauge.

    The needle pivots from one inner edge ("inset" from `side`'s OPPOSITE
    edge — i.e. with ``side="right"`` the pivot sits near the LEFT edge so
    the dial fills the right half). The needle sweeps along the dial side
    only, going from value_min at the bottom of that side to value_max at
    the top. Title sits in the top end-cap, digital readout in the bottom
    end-cap.
    """
    W, H = PILL_W * SSAA, PILL_H * SSAA
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx_geom, cy_geom = W / 2, H / 2

    # No chrome bezel rings — the DXF panel outline now serves as the
    # visible bezel. Fill the entire image with parchment.
    base_bulge = PILL_BULGE * SSAA
    fill_barrel(d, cx_geom, cy_geom, W, H, base_bulge, PARCHMENT)

    # ====================================================================
    # All layout below is expressed in millimeters in a pivot-anchored
    # frame:
    #   origin = needle pivot
    #   +x     = dial direction (toward the cap-box outer edge)
    #   +y     = math up (PIL y-down is handled by the helpers)
    #
    # Bezel-hole geometry (from Onshape sketch):
    #   cap ellipse  : a = 30 mm (x), b = 48.79 mm (y), centered at pivot
    #   cap-box      : x ∈ [7, 30],   y ∈ [-19.5, +19.5]   (23×39 mm)
    #   connector lines (hidden in the pill's other half) at y = ±19.5 mm
    # ====================================================================
    CAP_AX_MM = 30.0
    CAP_BY_MM = 48.79
    CAP_BOX_W_MM = 23.0
    CAP_BOX_H_MM = 39.0
    CAP_BOX_INNER_X_MM = CAP_AX_MM - CAP_BOX_W_MM   # 7.0
    CAP_BOX_OUTER_X_MM = CAP_AX_MM                  # 30.0
    CAP_BOX_HALF_H_MM = CAP_BOX_H_MM / 2            # 19.5

    # Canvas scale: fit the 30 mm dial reach + a small margin into the
    # canvas width, and the cap-box height into the canvas height.
    face_margin_mm = 1.5
    px_per_mm = min((W / 2 - face_margin_mm) / CAP_AX_MM,
                    (H / 2 - face_margin_mm) / CAP_BOX_HALF_H_MM)

    # `cap_dir` = sign multiplier converting "+x in mm" into pixel space.
    # side="right" → dial faces +x (right). side="left" → dial faces -x.
    cap_dir = +1 if side == "right" else -1

    pivot_y = H / 2
    pivot_x = W / 2 - cap_dir * CAP_AX_MM / 2 * px_per_mm
    # Center the cap-box in the canvas: pivot at (-cap_dir * a/2, 0) mm
    # offset from canvas center, so the cap-box (centered at +cap_dir*18.5 mm
    # from pivot) ends up centered horizontally on the canvas.

    if side == "right":
        sweep_start = -PILL_SWEEP_BOTTOM_DEG
        sweep_end = +PILL_SWEEP_TOP_DEG
    else:
        sweep_start = 180.0 + PILL_SWEEP_BOTTOM_DEG
        sweep_end = 180.0 - PILL_SWEEP_TOP_DEG

    def mm_to_px(mx: float, my: float) -> tuple[float, float]:
        """Pivot-anchored mm (math y-up) → canvas pixel (PIL y-down)."""
        return (pivot_x + cap_dir * mx * px_per_mm,
                pivot_y - my * px_per_mm)

    def mm_len(mm: float) -> float:
        return mm * px_per_mm

    # Cap-envelope distance from pivot at angle θ (in pivot-frame degrees).
    # Within the cap-box height (|y| ≤ 19.5 mm) the envelope is the cap
    # ellipse; outside that height it clips to the connector lines.
    a_mm = CAP_AX_MM
    b_mm = CAP_BY_MM
    half_h_mm = CAP_BOX_HALF_H_MM

    def outer_r_mm(ang_deg: float) -> float:
        a = math.radians(ang_deg)
        c, s = math.cos(a), math.sin(a)
        denom = math.sqrt((b_mm * c) ** 2 + (a_mm * s) ** 2)
        if denom < 1e-9:
            return a_mm
        r_ellipse = (a_mm * b_mm) / denom
        r_connector = half_h_mm / abs(s) if abs(s) > 1e-6 else math.inf
        return min(r_ellipse, r_connector)

    def outer_r_at(ang_deg: float) -> float:
        # Convert from canvas-frame angle to pivot-frame angle when
        # side="left" (dial sweeps around 180°): the magnitude is the
        # same because cos²/sin² are symmetric under θ → 180°−θ.
        return outer_r_mm(ang_deg) * px_per_mm

    reach = a_mm * px_per_mm  # for legacy fallbacks

    # Tick lengths (in mm), so they scale with px_per_mm.
    minor_len = mm_len(1.5)
    mid_len   = mm_len(2.5)
    major_len = mm_len(4.0)
    minor_w = max(2, int(mm_len(0.30)))
    mid_w   = max(3, int(mm_len(0.55)))
    major_w = max(5, int(mm_len(0.85)))

    def value_to_angle(v: float) -> float:
        t = (v - value_min) / (value_max - value_min)
        return sweep_start + t * (sweep_end - sweep_start)

    def tick_pts(v: float, length: float):
        a = value_to_angle(v)
        r_outer = outer_r_at(a)
        return polar(pivot_x, pivot_y, r_outer, a), \
               polar(pivot_x, pivot_y, r_outer - length, a)

    # Coloured arc bands (warn / cool) — dense thick ticks on the outer rim.
    for zone_start, zone_end, zone_color in (
        (warn_start, warn_end, warn_color),
        (cool_start, cool_end, COOL_BLUE),
    ):
        if zone_start is None or zone_end is None:
            continue
        steps = 60
        for i in range(steps + 1):
            v = zone_start + (i / steps) * (zone_end - zone_start)
            a = value_to_angle(v)
            r_outer = outer_r_at(a)
            band_outer = r_outer + mm_len(0.30)
            band_inner = r_outer - mm_len(1.0)
            thick_line(d, polar(pivot_x, pivot_y, band_outer, a),
                       polar(pivot_x, pivot_y, band_inner, a),
                       max(6, int(mm_len(0.5))), zone_color)

    def frange(lo: float, hi: float, step: float):
        n = int(round((hi - lo) / step))
        for i in range(n + 1):
            yield lo + i * step

    if minor_step:
        for v in frange(value_min, value_max, minor_step):
            if mid_step and abs((v - value_min) % mid_step) < 1e-6:
                continue
            if abs((v - value_min) % major_step) < 1e-6:
                continue
            p1, p2 = tick_pts(v, minor_len)
            thick_line(d, p1, p2, minor_w, INK_SOFT)
    if mid_step:
        for v in frange(value_min, value_max, mid_step):
            if abs((v - value_min) % major_step) < 1e-6:
                continue
            in_warn = (warn_start is not None and warn_end is not None
                       and warn_start <= v <= warn_end)
            col = warn_color if in_warn else INK
            p1, p2 = tick_pts(v, mid_len)
            thick_line(d, p1, p2, mid_w, col)
    for v in frange(value_min, value_max, major_step):
        in_warn = (warn_start is not None and warn_end is not None
                   and warn_start <= v <= warn_end)
        col = warn_color if in_warn else INK
        p1, p2 = tick_pts(v, major_len)
        thick_line(d, p1, p2, major_w, col)

    # Numerals — inside the major-tick inner edge with extra mm gap.
    num_font = load_font(int(mm_len(3.0)))
    num_inset = major_len + mm_len(2.5)
    for v in frange(value_min, value_max, major_step):
        a = value_to_angle(v)
        x, y = polar(pivot_x, pivot_y, outer_r_at(a) - num_inset, a)
        in_warn = (warn_start is not None and warn_end is not None
                   and warn_start <= v <= warn_end)
        col = warn_color if in_warn else INK
        draw_text_centered(d, (x, y), label_formatter(v), num_font, col)

    # ---- Title (vertical, anchored in cap-box) ----
    # Centered horizontally on the cap-box (18.5 mm from pivot in dial
    # direction) and centered vertically on the cap-box (y=0).
    title_font_mm = 4.5
    sub_font_mm = 2.8
    title_font = load_font(int(mm_len(title_font_mm)))
    sub_font = load_font(int(mm_len(sub_font_mm))) if sub_title else None
    title_layer = render_rotated_text(
        title, title_font, INK, angle=90,
        sub_text=sub_title, sub_font=sub_font, sub_fill=INK_SOFT,
    )
    title_x, title_y = mm_to_px(13.0, 0.0)
    paste_centered(img, title_layer, (title_x, title_y))

    # ---- Recessed digital readout (anchored in cap-box) ----
    digital_meta: dict | None = None
    if digital_label or digital_value:
        win_w_mm = 19.0   # < 23 mm cap-box width
        win_h_mm = 7.5
        # Window center: horizontally on cap-box center (18.5 mm), tucked
        # against the bbox bottom (0.3 mm margin from y = -19.5 mm).
        win_cx_mm = 18.5
        win_cy_mm = -CAP_BOX_HALF_H_MM + win_h_mm / 2 + 0.3

        win_cx, win_cy = mm_to_px(win_cx_mm, win_cy_mm)
        win_w = mm_len(win_w_mm)
        win_h = mm_len(win_h_mm)

        draw_recessed_window(d, win_cx, win_cy, win_w, win_h,
                             radius=win_h * 0.20)
        val_font_px = int(win_h * 0.70)
        val_font = load_mono_font(val_font_px)
        val_anchor_y = win_cy - win_h * 0.18
        if digital_value:
            draw_text_centered(d, (win_cx, val_anchor_y),
                               digital_value, val_font, DIGITAL_INK)
        label_font_px = int(win_h * 0.32)
        label_anchor_y = win_cy + win_h * 0.30
        if digital_label:
            label_font = load_font(label_font_px)
            draw_text_centered(d, (win_cx, label_anchor_y),
                               digital_label, label_font, DIGITAL_INK)
        digital_meta = {
            "label": digital_label,
            "window": {
                "cx": win_cx / W, "cy": win_cy / H,
                "w": win_w / W, "h": win_h / H,
            },
            "value_anchor": {
                "cx": win_cx / W, "cy": val_anchor_y / H,
                "font": "mono",
                "font_px_at_native_h": int(val_font_px / SSAA),
                "color": DIGITAL_INK[:3],
                "align": "center",
            },
            "label_anchor": {
                "cx": win_cx / W, "cy": label_anchor_y / H,
                "font": "sans",
                "font_px_at_native_h": int(label_font_px / SSAA),
                "color": DIGITAL_INK[:3],
                "align": "center",
            },
        }

    # Pivot hub — ~1.5 mm radius.
    hub_r = mm_len(1.5)
    d.ellipse((pivot_x - hub_r, pivot_y - hub_r,
               pivot_x + hub_r, pivot_y + hub_r),
              fill=(30, 26, 22, 255))
    d.ellipse((pivot_x - hub_r * 0.55, pivot_y - hub_r * 0.55,
               pivot_x + hub_r * 0.55, pivot_y + hub_r * 0.55),
              fill=(85, 78, 66, 255))

    out = img.resize((PILL_W, PILL_H), Image.LANCZOS)

    # Build manifest: everything Godot needs to drive the live gauge.
    manifest = {
        "kind": "pill",
        "image_size": [PILL_W, PILL_H],
        "canvas_px_per_mm": px_per_mm / SSAA,  # at final (post-resize) pill resolution
        "side": side,
        "title": title,
        "sub_title": sub_title,
        "value": {
            "min": value_min,
            "max": value_max,
            "major_step": major_step,
            "mid_step": mid_step,
            "minor_step": minor_step,
            "warn_start": warn_start,
            "warn_end": warn_end,
            "cool_start": cool_start,
            "cool_end": cool_end,
        },
        "needle": {
            "pivot": [pivot_x / SSAA, pivot_y / SSAA],
            "sweep_top_deg": PILL_SWEEP_TOP_DEG,
            "sweep_bottom_deg": PILL_SWEEP_BOTTOM_DEG,
            "sweep_start_math_deg": sweep_start,
            "sweep_end_math_deg": sweep_end,
            "value_to_math_angle_deg": (
                f"{sweep_start} + (v - {value_min}) / "
                f"({value_max} - {value_min}) * "
                f"({sweep_end} - {sweep_start})"
            ),
            "godot_rotation_deg_cw_from_up": (
                f"rot = 90 - math_angle = {90 - sweep_start:g} "
                f"{'-' if sweep_end > sweep_start else '+'} "
                f"{abs(sweep_end - sweep_start):g} * t  "
                f"(t = (v - min) / (max - min))"
            ),
            "sprite": "needle_short.png",
        },
        "title_anchor": {
            "cx": title_x / W,
            "cy": title_y / H,
            "rotation_deg": 90,
            "font": "sans",
            "font_px_at_native_h": int(W * 0.115 / SSAA),
            "sub_font_px_at_native_h": int(W * 0.072 / SSAA),
            "color": INK[:3],
            "sub_color": INK_SOFT[:3],
            "align": "center",
        },
        "digital": digital_meta,
    }
    return out, manifest


# ---------------------------------------------------------------------------
# Needles
# ---------------------------------------------------------------------------

def render_needle(out_w: int, out_h: int) -> Image.Image:
    W, H = out_w * SSAA, out_h * SSAA
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx = W / 2
    pivot_y = H * 0.78
    pointer_len = pivot_y * 0.96
    tail_len = (H - pivot_y) * 0.85
    base_half = W * 0.22
    tip_half = W * 0.05
    tail_half = W * 0.10
    pt_y = pivot_y - pointer_len
    tl_y = pivot_y + tail_len

    # Drop shadow
    so = max(2, int(W * 0.015))
    d.polygon([
        (cx - tip_half + so, pt_y + so),
        (cx + tip_half + so, pt_y + so),
        (cx + base_half + so, pivot_y + so),
        (cx + tail_half + so, tl_y + so),
        (cx - tail_half + so, tl_y + so),
        (cx - base_half + so, pivot_y + so),
    ], fill=(0, 0, 0, 70))
    # Body
    d.polygon([
        (cx - tip_half, pt_y),
        (cx + tip_half, pt_y),
        (cx + base_half, pivot_y),
        (cx + tail_half, tl_y),
        (cx - tail_half, tl_y),
        (cx - base_half, pivot_y),
    ], fill=(20, 18, 16, 255))
    # Highlight stripe
    hl_t = max(1, int(tip_half * 0.35))
    hl_b = max(2, int(base_half * 0.18))
    d.polygon([
        (cx - hl_t, pt_y + (pivot_y - pt_y) * 0.05),
        (cx + hl_t, pt_y + (pivot_y - pt_y) * 0.05),
        (cx + hl_b, pivot_y - (pivot_y - pt_y) * 0.02),
        (cx - hl_b, pivot_y - (pivot_y - pt_y) * 0.02),
    ], fill=(70, 64, 56, 220))
    # Hub
    hub_r = W * 0.32
    d.ellipse((cx - hub_r, pivot_y - hub_r, cx + hub_r, pivot_y + hub_r),
              fill=(35, 30, 26, 255))
    d.ellipse((cx - hub_r * 0.55, pivot_y - hub_r * 0.55,
               cx + hub_r * 0.55, pivot_y + hub_r * 0.55),
              fill=(110, 100, 88, 255))
    d.ellipse((cx - hub_r * 0.22, pivot_y - hub_r * 0.22,
               cx + hub_r * 0.22, pivot_y + hub_r * 0.22),
              fill=(20, 18, 16, 255))

    return img.resize((out_w, out_h), Image.LANCZOS)


# ---------------------------------------------------------------------------
# Composite preview
# ---------------------------------------------------------------------------

# Demo values used by the preview composite to drive both needle angles
# and the live digital readouts. Same data Godot would feed in at runtime.
PREVIEW_DEMO_VALUES = {
    "center":  {"primary": 4000, "speed": "105",    "gear": "3"},
    "oil":     {"primary": 55,   "value": "13.8 V"},   # 55 PSI; 13.8 V battery
    "coolant": {"primary": 85,   "value": "99°C"},     # 85 °C; oil temp 99 °C
    "boost":   {"primary": 2.5,  "value": "11.5"},     # 2.5 PSI; AFR 11.5
    "fuel":    {"primary": 0.62, "value": "38°C"},     # 62 % fuel; IAT 38 °C
}

PREVIEW_ORDER = ["oil", "coolant", "center", "boost", "fuel"]


def _value_to_math_angle(spec: dict, v: float) -> float:
    """Compute math-convention needle angle from a manifest gauge spec."""
    vmin = spec["value"]["min"]
    vmax = spec["value"]["max"]
    t = (v - vmin) / (vmax - vmin)
    n = spec["needle"]
    if spec["kind"] == "center_tach":
        return n["sweep_start_math_deg"] - t * n["sweep_total_deg"]
    return n["sweep_start_math_deg"] + t * (
        n["sweep_end_math_deg"] - n["sweep_start_math_deg"])


def _paste_rotated_needle(bg: Image.Image, needle: Image.Image,
                          ox: int, oy: int, pivot_native, math_angle: float) -> None:
    """Paste a needle sprite onto `bg` so its pivot lands at
    (ox+pivot_native[0], oy+pivot_native[1]) and points to `math_angle`."""
    nw, nh = needle.size
    npivot = (nw / 2, nh * 0.78)
    diag = int(math.ceil(2 * math.hypot(
        max(npivot[0], nw - npivot[0]),
        max(npivot[1], nh - npivot[1]),
    ))) + 4
    padded = Image.new("RGBA", (diag, diag), (0, 0, 0, 0))
    padded.paste(needle,
                 (int(round(diag / 2 - npivot[0])),
                  int(round(diag / 2 - npivot[1]))),
                 needle)
    rotated = padded.rotate(math_angle - 90, resample=Image.BICUBIC)
    gx = ox + int(pivot_native[0]) - diag // 2
    gy = oy + int(pivot_native[1]) - diag // 2
    bg.alpha_composite(rotated, (gx, gy))


def _draw_digital_value(bg: Image.Image, ox: int, oy: int, W: int, H: int,
                        digital_spec: dict, value_text: str) -> None:
    """Render the live digital value into the recessed window using the
    anchor + font info in the manifest."""
    if not value_text:
        return
    anchor = digital_spec["value_anchor"]
    cx_px = ox + anchor["cx"] * W
    cy_px = oy + anchor["cy"] * H
    font_px = int(anchor["font_px_at_native_h"])
    if anchor["font"] == "mono":
        font = load_mono_font(font_px)
    else:
        font = load_font(font_px)
    color = tuple(anchor["color"]) + (255,)
    d = ImageDraw.Draw(bg)
    draw_text_centered(d, (cx_px, cy_px), value_text, font, color)


# ---------------------------------------------------------------------------
# DXF bezel scan loader
# ---------------------------------------------------------------------------

def load_bezel_dxf(path: str) -> dict:
    """Read the Onshape bezel DXF and return geometry in mm.

    Each pill gauge slot is built from 2 elliptical arcs (rounded ends,
    major axis vertical, |major|≈51.25 mm) joined by 4 horizontal line
    segments. The center slot is built from 4 elliptical arcs.

    Each pill record carries `outline_segments_mm` (list of segments in
    pill-local mm, recentered on the pill centroid, +y up) so the gauge
    renderer can raycast against the actual bezel-hole outline.
    """
    try:
        import ezdxf
    except ImportError as e:
        raise RuntimeError(
            "ezdxf not installed; run `pip install ezdxf` in the a40-gauge env"
        ) from e

    doc = ezdxf.readfile(path)
    msp = doc.modelspace()
    entities = list(msp)

    xs: list[float] = []
    ys: list[float] = []
    ellipses: list[dict] = []
    raw_lines: list = []
    for e in entities:
        t = e.dxftype()
        if t == "ELLIPSE":
            c = e.dxf.center
            ma = e.dxf.major_axis
            ratio = e.dxf.ratio
            major = math.hypot(ma.x, ma.y)
            minor = major * ratio
            angle = math.degrees(math.atan2(ma.y, ma.x))
            ellipses.append({
                "cx": c.x, "cy": c.y,
                "major": major, "minor": minor,
                "angle": angle,
                "axis_vertical": abs(ma.y) > abs(ma.x),
                "entity": e,
            })
            half_x = abs(ma.x) + abs(ma.y) * ratio
            half_y = abs(ma.y) + abs(ma.x) * ratio
            xs += [c.x - half_x, c.x + half_x]
            ys += [c.y - half_y, c.y + half_y]
        elif t == "LINE":
            xs += [e.dxf.start.x, e.dxf.end.x]
            ys += [e.dxf.start.y, e.dxf.end.y]
            raw_lines.append(e)
        elif t == "ARC":
            xs += [e.dxf.center.x - e.dxf.radius, e.dxf.center.x + e.dxf.radius]
            ys += [e.dxf.center.y - e.dxf.radius, e.dxf.center.y + e.dxf.radius]

    bounds = (min(xs), min(ys), max(xs), max(ys))

    pill_ells = sorted(
        [e for e in ellipses if 50 <= e["major"] <= 55],
        key=lambda e: e["cx"],
    )
    center_ells = [e for e in ellipses if e["major"] >= 65]

    def _flatten(ent) -> list[tuple[float, float]]:
        return [(p.x, p.y) for p in ent.flattening(distance=0.15)]

    def _polyline_to_segments(pts, cx0, cy0):
        return [((pts[i][0] - cx0, pts[i][1] - cy0),
                 (pts[i + 1][0] - cx0, pts[i + 1][1] - cy0))
                for i in range(len(pts) - 1)]

    pills: list[dict] = []
    for i in range(0, len(pill_ells) - 1, 2):
        a, b = pill_ells[i], pill_ells[i + 1]
        cx = (a["cx"] + b["cx"]) / 2.0
        cy = (a["cy"] + b["cy"]) / 2.0

        outline_segments: list = []
        all_pts: list[tuple[float, float]] = []
        for ell in (a, b):
            arc_pts = _flatten(ell["entity"])
            outline_segments += _polyline_to_segments(arc_pts, cx, cy)
            all_pts += arc_pts

        # Find the 4 saddle-connector lines for this pill: midpoint inside
        # the pair's x-range and within ~|major| of the pair's cy.
        x_lo = min(a["cx"], b["cx"]) - max(a["minor"], b["minor"])
        x_hi = max(a["cx"], b["cx"]) + max(a["minor"], b["minor"])
        y_lim = max(a["major"], b["major"])
        saddle_xs: list[float] = []
        for ln in raw_lines:
            mx = (ln.dxf.start.x + ln.dxf.end.x) / 2
            my = (ln.dxf.start.y + ln.dxf.end.y) / 2
            if x_lo <= mx <= x_hi and abs(my - cy) <= y_lim:
                outline_segments.append((
                    (ln.dxf.start.x - cx, ln.dxf.start.y - cy),
                    (ln.dxf.end.x - cx,   ln.dxf.end.y - cy),
                ))
                all_pts += [(ln.dxf.start.x, ln.dxf.start.y),
                            (ln.dxf.end.x, ln.dxf.end.y)]
                saddle_xs += [ln.dxf.start.x - cx, ln.dxf.end.x - cx]

        xs_p = [p[0] for p in all_pts]
        ys_p = [p[1] for p in all_pts]
        outline_w_mm = max(xs_p) - min(xs_p)
        outline_h_mm = max(ys_p) - min(ys_p)

        # Saddle bounds: where the horizontal connectors meet the caps.
        # Used by the gauge renderer to place the dial pivot at the inner
        # saddle vertex so the tick arc curves along the cap.
        if saddle_xs:
            saddle_x_min_mm = min(saddle_xs)  # left cap inner corner
            saddle_x_max_mm = max(saddle_xs)  # right cap inner corner
        else:
            saddle_x_min_mm = -outline_w_mm * 0.05
            saddle_x_max_mm = +outline_w_mm * 0.05

        # Legacy bbox-style w/h kept for the panel composite layout.
        w_mm = abs(b["cx"] - a["cx"]) + max(a["minor"], b["minor"]) * 2
        h_mm = max(a["major"], b["major"]) * 2
        pills.append({
            "kind": "pill",
            "cx_mm": cx, "cy_mm": cy,
            "w_mm": w_mm, "h_mm": h_mm,
            "outline_w_mm": outline_w_mm,
            "outline_h_mm": outline_h_mm,
            "outline_segments_mm": outline_segments,
            "saddle_x_min_mm": saddle_x_min_mm,
            "saddle_x_max_mm": saddle_x_max_mm,
        })

    center_slot = None
    if center_ells:
        cx0 = sum(e["cx"] for e in center_ells) / len(center_ells)
        cy0 = sum(e["cy"] for e in center_ells) / len(center_ells)
        w_mm = 2 * max(
            abs(e["cx"] - cx0) +
            (e["minor"] if e["axis_vertical"] else e["major"])
            for e in center_ells)
        h_mm = 2 * max(
            abs(e["cy"] - cy0) +
            (e["major"] if e["axis_vertical"] else e["minor"])
            for e in center_ells)
        center_slot = {"kind": "center", "cx_mm": cx0, "cy_mm": cy0,
                       "w_mm": w_mm, "h_mm": h_mm}

    holes: list[dict] = list(pills)
    if center_slot is not None:
        holes.append(center_slot)
    holes.sort(key=lambda h: h["cx_mm"])
    for slot, h in zip(("oil", "coolant", "center", "boost", "fuel"), holes):
        h["slot"] = slot

    return {
        "bounds": bounds,
        "entities": entities,
        "ellipses": ellipses,
        "holes": holes,
    }


# ---------------------------------------------------------------------------
# Panel-accurate composite (1920x720 @ 12.3" with bezel overlay)
# ---------------------------------------------------------------------------

def render_panel_with_bezel(images: dict[str, Image.Image],
                            manifest: dict,
                            long_needle: Image.Image,
                            short_needle: Image.Image,
                            dxf: dict,
                            demo_values: dict | None = None,
                            *,
                            bg_color: tuple[int, int, int, int] = (16, 13, 11, 255),
                            apply_bezel_mask: bool = False,
                            draw_bezel_outline: bool = True,
                            draw_dxf_overlay: bool = False) -> Image.Image:
    """Render gauges + DXF bezel outline at the real-world pixel pitch of
    the Waveshare 12.3" 1920x720 panel.

    Approach: gauges are laid out in a simple horizontal row (PREVIEW_ORDER)
    centered on the panel, scaled so each pill's native height matches a
    chosen physical height in mm. The DXF is drawn on top at 1:1 mm scale,
    centered on the panel origin (assumes the DXF is centered on its own
    origin in CAD — if not, we re-center on its bounding-box midpoint).
    Once the outline is visible the gauges can be moved manually to fit.
    """
    if demo_values is None:
        demo_values = PREVIEW_DEMO_VALUES

    s = PANEL_SSAA
    W = PANEL_W_PX * s
    H = PANEL_H_PX * s
    px_per_mm = (1.0 / PANEL_MM_PER_PX) * s

    img = Image.new("RGBA", (W, H), bg_color)

    panel_cx_px = W / 2
    panel_cy_px = H / 2

    def mm_to_px(x_mm: float, y_mm: float) -> tuple[float, float]:
        # DXF is assumed centered on its own (0, 0); flip y for PIL.
        return (panel_cx_px + x_mm * px_per_mm,
                panel_cy_px - y_mm * px_per_mm)

    # --- Per-slot placement (constants in mm, symmetric about x=0) -------
    # (cx_mm, cy_mm, target_h_mm) per gauge slot in DXF coords (+y up).
    # Outside pill pivot direction: away from center (sign(x) outward).
    # Inside  pill pivot direction: toward center  (sign(-x) inward).
    out_shift = OUTSIDE_PILL_SHIFT_TOWARD_PIVOT_MM
    in_shift = INSIDE_PILL_SHIFT_TOWARD_PIVOT_MM
    placement_mm: dict[str, tuple[float, float, float]] = {
        "oil":     (-(OUTSIDE_PILL_OFFSET_X_MM + out_shift),
                    OUTSIDE_PILL_OFFSET_Y_MM, OUTSIDE_PILL_TARGET_H_MM),
        "coolant": (-(INSIDE_PILL_OFFSET_X_MM - in_shift),
                    INSIDE_PILL_OFFSET_Y_MM, INSIDE_PILL_TARGET_H_MM),
        "center":  (CENTER_TACH_OFFSET_MM[0],  CENTER_TACH_OFFSET_MM[1],
                    CENTER_TACH_TARGET_H_MM),
        "boost":   (+(INSIDE_PILL_OFFSET_X_MM - in_shift),
                    INSIDE_PILL_OFFSET_Y_MM, INSIDE_PILL_TARGET_H_MM),
        "fuel":    (+(OUTSIDE_PILL_OFFSET_X_MM + out_shift),
                    OUTSIDE_PILL_OFFSET_Y_MM, OUTSIDE_PILL_TARGET_H_MM),
    }

    needles_by_sprite = {
        "needle_long.png": long_needle,
        "needle_short.png": short_needle,
    }
    gauges = manifest["gauges"]
    placed: list[dict] = []

    # Pivot-anchor table for pill gauges. The needle pivot in panel mm
    # sits at the cap-ellipse center, which is 18.5 mm OPPOSITE to the
    # bulge direction from the bezel-hole bbox center.
    # Bulge direction (cap_dx_sign): outer pills bulge inward toward the
    # center tach; inner pills bulge outward away from it.
    pill_pivot_panel_mm: dict[str, tuple[float, float]] = {
        "oil":     (-121.0 - (+1) * 18.5, 0.0),  # bulge inward (+1) → pivot outward
        "coolant": (-73.0  - (-1) * 18.5, 0.0),  # bulge outward (-1) → pivot inward
        "boost":   (+73.0  - (+1) * 18.5, 0.0),
        "fuel":    (+121.0 - (-1) * 18.5, 0.0),
    }

    for slot in PREVIEW_ORDER:
        spec = gauges[slot]
        cx_mm, cy_mm, target_h_mm = placement_mm[slot]
        nw, nh = spec["image_size"]

        if spec["kind"] == "pill" and slot in pill_pivot_panel_mm:
            # 1:1 scale: 1 canvas mm = 1 panel mm. The pill canvas is
            # placed so its INTERNAL pivot pixel lands at the cap-ellipse
            # center on the panel.
            canvas_px_per_mm = spec.get("canvas_px_per_mm", nh / target_h_mm)
            scale = (1.0 / PANEL_MM_PER_PX) / canvas_px_per_mm
            scale *= s  # account for panel SSAA factor
            target_w = max(1, int(round(nw * scale)))
            target_h = max(1, int(round(nh * scale)))
            gauge_resized = images[slot].resize((target_w, target_h), Image.LANCZOS)
            pivot_native = spec["needle"]["pivot"]
            pivot_scaled_x = pivot_native[0] * scale
            pivot_scaled_y = pivot_native[1] * scale
            pivot_panel_mm_x, pivot_panel_mm_y = pill_pivot_panel_mm[slot]
            pivot_panel_px_x, pivot_panel_px_y = mm_to_px(
                pivot_panel_mm_x, pivot_panel_mm_y)
            ox = int(round(pivot_panel_px_x - pivot_scaled_x))
            oy = int(round(pivot_panel_px_y - pivot_scaled_y))
        else:
            target_h_px = target_h_mm * px_per_mm
            scale = target_h_px / nh
            target_w = max(1, int(round(nw * scale)))
            target_h = max(1, int(round(target_h_px)))
            gauge_resized = images[slot].resize((target_w, target_h), Image.LANCZOS)
            cx_px, cy_px = mm_to_px(cx_mm, cy_mm)
            ox = int(round(cx_px - target_w / 2))
            oy = int(round(cy_px - target_h / 2))

        img.paste(gauge_resized, (ox, oy), gauge_resized)

        vals = demo_values.get(slot, {})
        primary = vals.get("primary")
        if primary is not None:
            math_angle = _value_to_math_angle(spec, primary)
            needle = needles_by_sprite[spec["needle"]["sprite"]]
            n_w = max(1, int(round(needle.width * scale)))
            n_h = max(1, int(round(needle.height * scale)))
            needle_scaled = needle.resize((n_w, n_h), Image.LANCZOS)
            pivot_native = spec["needle"]["pivot"]
            pivot_scaled = (pivot_native[0] * scale, pivot_native[1] * scale)
            _paste_rotated_needle(img, needle_scaled, ox, oy,
                                  pivot_scaled, math_angle)

        digital = spec.get("digital")
        if digital:
            if spec["kind"] == "center_tach":
                _draw_digital_value(img, ox, oy, target_w, target_h,
                                    digital["speed"], vals.get("speed", ""))
                _draw_digital_value(img, ox, oy, target_w, target_h,
                                    digital["gear"], vals.get("gear", ""))
            else:
                _draw_digital_value(img, ox, oy, target_w, target_h, digital,
                                    vals.get("value", ""))

        placed.append({
            "slot": slot,
            "center_mm": [cx_mm, cy_mm],
            "target_h_mm": target_h_mm,
            "gauge_px": {"x": ox, "y": oy, "w": target_w, "h": target_h,
                         "scale_native_to_panel": scale},
        })

    # --- Bezel-hole envelope: mask outside with bg, draw outline --------
    # Closed polygons for each visible bezel hole (4 pills + center tach),
    # built parametrically from the same shapes used for ticks.
    BEZEL_OUTLINE = (10, 8, 6, 255)
    bezel_outline_w = max(2, int(round(s * 1.6)))

    def _arc_pts(xc_mm, yc_mm, ah, av, t0, t1, steps=96):
        out = []
        for i in range(steps + 1):
            t = t0 + (t1 - t0) * (i / steps)
            out.append(mm_to_px(xc_mm + ah * math.cos(t),
                                yc_mm + av * math.sin(t)))
        return out

    def _pill_envelope(slot: str):
        """Symmetric pill envelope: rectangle 23×39 mm with a cap-ellipse
        rounding tucked into BOTH the inner-edge and outer-edge corners.
        The two caps share the same a=30, b=48.79 mm ellipse parameters,
        each centered 18.5 mm offset along the bulge axis from the bbox
        center so the cap tip lands exactly on the bbox edge (±11.5 mm)
        and the cap-edge corners land 9.0 mm in from the tip on the
        top/bottom edges (y=±19.5 mm)."""
        cap_cx_mm = {"oil": -121.0, "coolant": -73.0,
                     "boost": +73.0, "fuel": +121.0}[slot]
        bulge_sign = {"oil": +1, "coolant": -1,
                      "boost": +1, "fuel": -1}[slot]
        a, b = 30.0, 48.79
        half_h, half_w = 19.5, 11.5
        t_corner = math.asin(half_h / b)
        x_corner = a * math.cos(t_corner)            # ≈ 27.5
        x_corner_offset = x_corner - 18.5            # ≈ 9.0 (from bbox center)
        # Local axes: +x = bulge_sign * panel_x; +y = math y-up.
        pts_local: list[tuple[float, float]] = []
        # Top edge from inner-cap corner to outer-cap corner.
        pts_local.append((-x_corner_offset, +half_h))
        pts_local.append((+x_corner_offset, +half_h))
        # Outer cap: ellipse centered at local (-18.5, 0); sweep top→tip→bot.
        for i in range(33):
            t = +t_corner - 2 * t_corner * (i / 32)
            pts_local.append((-18.5 + a * math.cos(t), b * math.sin(t)))
        # Bottom edge right→left.
        pts_local.append((-x_corner_offset, -half_h))
        # Inner cap: ellipse centered at local (+18.5, 0); sweep bot→tip→top.
        # At t = π+t_corner: local x = 18.5 + a*cos(π+t_corner) = 18.5 - x_corner = -9.0.
        # At t = π:          local x = 18.5 - a = -11.5 (inner bbox edge tip).
        # At t = π-t_corner: local x = -9.0 (top corner).
        for i in range(33):
            t = (math.pi + t_corner) - 2 * t_corner * (i / 32)
            pts_local.append((18.5 + a * math.cos(t), b * math.sin(t)))
        # Close.
        pts_local.append((-x_corner_offset, +half_h))
        return [mm_to_px(cap_cx_mm + bulge_sign * lx, ly)
                for (lx, ly) in pts_local]

    def _tach_envelope():
        # Reuse the same 4-arc parameters validated for the debug overlay.
        pts: list[tuple[float, float]] = []
        # Top arc
        t_left_top = math.atan2(-38.739 / 43.739, -32.5 / 70.0)
        t_end_top = math.atan2(-38.739 / 43.739, 32.5 / 70.0)
        pts.extend(_arc_pts(0.0, 3.739, 70.0, 43.739,
                            t_left_top, t_end_top))
        # Right arc
        t_top_right = math.atan2(-35.0 / 90.0,
                                 (32.5 - (-20.168)) / 57.168)
        t_bot_right = math.atan2(35.0 / 90.0,
                                 (32.5 - (-20.168)) / 57.168)
        pts.extend(_arc_pts(-20.168, 0.0, 57.168, 90.0,
                            t_top_right, t_bot_right))
        # Bottom arc
        t_right_bot = math.atan2(38.739 / 43.739, 32.5 / 70.0)
        t_left_bot = math.atan2(38.739 / 43.739, -32.5 / 70.0)
        pts.extend(_arc_pts(0.0, -3.739, 70.0, 43.739,
                            t_right_bot, t_left_bot))
        # Left arc
        t_bot_left = math.atan2(35.0 / 90.0,
                                (-32.5 - 20.168) / 57.168)
        half_span_left = math.pi - t_bot_left
        pts.extend(_arc_pts(20.168, 0.0, 57.168, 90.0,
                            math.pi - half_span_left,
                            math.pi + half_span_left))
        return pts

    if apply_bezel_mask or draw_bezel_outline:
        envelopes = [_pill_envelope(s)
                     for s in ("oil", "coolant", "boost", "fuel")]
        envelopes.append(_tach_envelope())

        if apply_bezel_mask:
            # bg overlay with transparent holes punched out for each envelope.
            bg_layer = Image.new("RGBA", (W, H), bg_color)
            hole_mask = Image.new("L", (W, H), 255)
            hm = ImageDraw.Draw(hole_mask)
            for poly in envelopes:
                hm.polygon(poly, fill=0)
            bg_layer.putalpha(hole_mask)
            img = Image.alpha_composite(img, bg_layer)

        if draw_bezel_outline:
            outline_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            ol = ImageDraw.Draw(outline_layer)
            for poly in envelopes:
                ol.line(poly, fill=BEZEL_OUTLINE, width=bezel_outline_w,
                        joint="curve")
            img = Image.alpha_composite(img, outline_layer)

    # --- Bezel DXF outline overlay (only when explicitly requested) -----
    _DEBUG_BEZEL_OVERLAY = draw_dxf_overlay
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    if _DEBUG_BEZEL_OVERLAY:
        bezel_color = (255, 80, 80, 255)
        bezel_halo = (0, 0, 0, 220)
        line_w = max(1, int(round(8 * s)))
        halo_w = line_w + max(2, int(round(4 * s)))
        od = ImageDraw.Draw(overlay)

        def stroke_pair(draw_fn):
            draw_fn(bezel_halo, halo_w)
            draw_fn(bezel_color, line_w)

        for e in dxf["entities"]:
            t = e.dxftype()
            if t == "LINE":
                x1, y1 = mm_to_px(e.dxf.start.x, e.dxf.start.y)
                x2, y2 = mm_to_px(e.dxf.end.x, e.dxf.end.y)
                stroke_pair(lambda c, w: od.line([(x1, y1), (x2, y2)],
                                                 fill=c, width=w))
            elif t == "ARC":
                cx_px, cy_px = mm_to_px(e.dxf.center.x, e.dxf.center.y)
                r_px = e.dxf.radius * px_per_mm
                bbox = [cx_px - r_px, cy_px - r_px,
                        cx_px + r_px, cy_px + r_px]
                sa = -e.dxf.end_angle
                ea = -e.dxf.start_angle
                stroke_pair(lambda c, w: od.arc(bbox, start=sa, end=ea,
                                                fill=c, width=w))
            elif t == "ELLIPSE":
                ma = e.dxf.major_axis
                ratio = e.dxf.ratio
                major_mm = math.hypot(ma.x, ma.y)
                minor_mm = major_mm * ratio
                major_angle_dxf = math.atan2(ma.y, ma.x)
                cx_mm = e.dxf.center.x
                cy_mm = e.dxf.center.y
                start_p = float(e.dxf.start_param)
                end_p = float(e.dxf.end_param)
                if end_p < start_p:
                    end_p += 2 * math.pi
                seg_count = max(16, int(round((end_p - start_p)
                                              / (2 * math.pi) * 96)))
                cos_a = math.cos(major_angle_dxf)
                sin_a = math.sin(major_angle_dxf)
                pts: list[tuple[float, float]] = []
                for i in range(seg_count + 1):
                    p = start_p + (end_p - start_p) * (i / seg_count)
                    lx = major_mm * math.cos(p)
                    ly = minor_mm * math.sin(p)
                    wx = cx_mm + lx * cos_a - ly * sin_a
                    wy = cy_mm + lx * sin_a + ly * cos_a
                    pts.append(mm_to_px(wx, wy))
                stroke_pair(lambda c, w: od.line(pts, fill=c, width=w,
                                                 joint="curve"))

    img = Image.alpha_composite(img, overlay)

    if s != 1:
        img = img.resize((PANEL_W_PX, PANEL_H_PX), Image.LANCZOS)

    img.info["panel_placement"] = placed
    return img


def render_preview(images: dict[str, Image.Image],
                   manifest: dict,
                   long_needle: Image.Image,
                   short_needle: Image.Image,
                   dxf: dict,
                   demo_values: dict | None = None) -> Image.Image:
    """Preview = panel render with a brown wood background and the
    parametric bezel-hole mask so anything outside the gauge openings
    is solid wood. Uses the exact same mm-anchored placement as
    `render_panel_with_bezel`, so the gauge sizes match the panel."""
    return render_panel_with_bezel(
        images, manifest, long_needle, short_needle, dxf,
        demo_values=demo_values,
        bg_color=(78, 52, 32, 255),
        apply_bezel_mask=True,
        draw_dxf_overlay=False,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def ensure_out_dir() -> str:
    os.makedirs(OUT_DIR, exist_ok=True)
    return OUT_DIR


def main() -> None:
    out_dir = ensure_out_dir()
    print("Generating Austin A40 restomod dash kit...")
    print(f"  Output dir : {out_dir}")

    saved: dict[str, Image.Image] = {}
    manifests: dict[str, dict] = {}

    # --- Pre-load DXF so pill renders can use the actual bezel outline ---
    pill_outlines: dict[str, dict] = {}
    early_dxf = None
    if os.path.exists(BEZEL_DXF_PATH):
        try:
            early_dxf = load_bezel_dxf(BEZEL_DXF_PATH)
            for hole in early_dxf["holes"]:
                if hole["kind"] == "pill":
                    pill_outlines[hole["slot"]] = {
                        "segments_mm": hole["outline_segments_mm"],
                        "w_mm": hole["outline_w_mm"],
                        "h_mm": hole["outline_h_mm"],
                        "saddle_x_min_mm": hole["saddle_x_min_mm"],
                        "saddle_x_max_mm": hole["saddle_x_max_mm"],
                    }
        except Exception as exc:
            print(f"  ! pill outline preload failed: {exc}")

    # --- Center tach ---
    center, manifests["center"] = render_center_tach()
    p = os.path.join(out_dir, "center_tach.png")
    center.save(p, optimize=True)
    saved["center"] = center
    print(f"  -> center_tach.png      ({center.width}x{center.height})")

    # --- Slot 1: Oil pressure + battery volts digital ---
    # Low pressure is what kills the engine, so the red band is at the
    # bottom (0-15 psi). The live warning in Godot / Haltech protection is
    # rpm-dependent (rule of thumb ~10 psi per 1000 rpm; verify against the
    # engine's measured baseline), not a fixed number.
    oil, manifests["oil"] = render_pill_gauge(
        title="OIL",
        sub_title="PSI",
        value_min=0, value_max=100,
        major_step=20, mid_step=10, minor_step=5,
        label_formatter=lambda v: str(int(round(v))),
        warn_start=0, warn_end=15, warn_color=REDLINE,  # low pressure
        digital_label="BATTERY", digital_value="",
        side="right",  # far-left slot: faces IN (dial on right half)
        outline=pill_outlines.get("oil"),
    )
    p = os.path.join(out_dir, "pill_oil_pressure.png")
    oil.save(p, optimize=True)
    saved["oil"] = oil
    print(f"  -> pill_oil_pressure.png ({oil.width}x{oil.height})")

    # --- Slot 2: Coolant Temp + oil temp digital ---
    coolant, manifests["coolant"] = render_pill_gauge(
        title="WATER",
        sub_title="°C",
        value_min=40, value_max=130,
        major_step=20, mid_step=10, minor_step=None,
        label_formatter=lambda v: str(int(round(v))),
        warn_start=110, warn_end=130, warn_color=REDLINE,
        cool_start=40, cool_end=60,
        digital_label="OIL TEMP", digital_value="",
        side="left",  # inner-left slot: faces OUT (dial on left half)
        outline=pill_outlines.get("coolant"),
    )
    p = os.path.join(out_dir, "pill_coolant_temp.png")
    coolant.save(p, optimize=True)
    saved["coolant"] = coolant
    print(f"  -> pill_coolant_temp.png ({coolant.width}x{coolant.height})")

    # --- Slot 4: Boost (-15 .. +30 psi gauge) + AFR digital ---
    # One linear psi scale (no inHg/psi mix): needle value = MAP_kPa_abs /
    # 6.895 - baro_psi. Red band 25-30 psi sits above the expected ~18-22 psi
    # target for ~350 whp; move it to the Haltech overboost cut once the
    # turbo and boost target are chosen (verify).
    boost, manifests["boost"] = render_pill_gauge(
        title="BOOST",
        sub_title="PSI",
        value_min=-15, value_max=30,
        major_step=15, mid_step=5, minor_step=1,
        label_formatter=lambda v: f"{int(round(v)):+d}".replace("+0", "0"),
        warn_start=25, warn_end=30, warn_color=REDLINE,
        cool_start=-15, cool_end=0,  # vacuum side
        digital_label="AFR", digital_value="",
        side="right",  # inner-right slot: faces OUT (dial on right half)
        outline=pill_outlines.get("boost"),
    )
    p = os.path.join(out_dir, "pill_boost.png")
    boost.save(p, optimize=True)
    saved["boost"] = boost
    print(f"  -> pill_boost.png        ({boost.width}x{boost.height})")

    # --- Slot 5: Fuel + intake air temp (IAT) digital ---
    # Fuel uses 0..1 scaled with E, 1/4, 1/2, 3/4, F labels.
    fuel_labels = {0.0: "E", 0.25: "¼", 0.5: "½", 0.75: "¾", 1.0: "F"}

    def fuel_label(v: float) -> str:
        # Snap to nearest known label.
        k = min(fuel_labels.keys(), key=lambda kk: abs(kk - v))
        return fuel_labels[k]

    fuel, manifests["fuel"] = render_pill_gauge(
        title="FUEL",
        sub_title="",
        value_min=0.0, value_max=1.0,
        major_step=0.25, mid_step=0.125, minor_step=0.0625,
        label_formatter=fuel_label,
        warn_start=0.0, warn_end=0.10, warn_color=WARN_AMBER,
        digital_label="IAT", digital_value="",
        side="left",  # far-right slot: faces IN (dial on left half)
        outline=pill_outlines.get("fuel"),
    )
    p = os.path.join(out_dir, "pill_fuel.png")
    fuel.save(p, optimize=True)
    saved["fuel"] = fuel
    print(f"  -> pill_fuel.png         ({fuel.width}x{fuel.height})")

    # --- Needles ---
    # Center tach: pointer must reach to the inside of the major-tick
    # numerals. Pointer length = H * 0.78 * 0.96 ≈ H * 0.749. Target
    # ≈ 540 px (just past the inner end of the major numerals).
    long_needle = render_needle(80, 720)
    p = os.path.join(out_dir, "needle_long.png")
    long_needle.save(p, optimize=True)
    print(f"  -> needle_long.png       ({long_needle.width}x{long_needle.height})")

    # Side pill: pointer should reach just inside the cap-box outer edge
    # (CAP_BOX_OUTER_X_MM = 30 mm from pivot). Native px is sized so that
    # after panel composite scaling (~0.758×) the rendered pointer length
    # (0.78 pivot × 0.96 of pointer span) equals ~27 mm on the panel.
    #   pointer_mm = h_native × 0.758 × PANEL_MM_PER_PX × (0.78 × 0.96)
    #              ≈ h_native × 0.0865
    # → h_native ≈ 27 / 0.0865 ≈ 312 px; width keeps the original 0.105 ratio.
    short_needle = render_needle(33, 312)
    p = os.path.join(out_dir, "needle_short.png")
    short_needle.save(p, optimize=True)
    print(f"  -> needle_short.png      ({short_needle.width}x{short_needle.height})")

    # --- Manifest (everything Godot needs to drive a live cluster) ---
    long_needle_pivot = (long_needle.width // 2, int(long_needle.height * 0.78))
    short_needle_pivot = (short_needle.width // 2, int(short_needle.height * 0.78))

    # --- Bezel scan (real-world geometry from Onshape DXF) ---
    bezel_block: dict | None = None
    dxf = None
    if os.path.exists(BEZEL_DXF_PATH):
        try:
            dxf = load_bezel_dxf(BEZEL_DXF_PATH)
            xmin, ymin, xmax, ymax = dxf["bounds"]
            bezel_block = {
                "source_file": os.path.relpath(BEZEL_DXF_PATH, REPO_ROOT),
                "units": "mm",
                "bounds_mm": {
                    "xmin": xmin, "ymin": ymin, "xmax": xmax, "ymax": ymax,
                    "width": xmax - xmin, "height": ymax - ymin,
                },
                "holes": dxf["holes"],
            }
        except Exception as exc:
            print(f"  ! bezel DXF load failed: {exc}")

    full_manifest = {
        "version": 2,
        "coordinate_space": (
            "All cx/cy/w/h values inside `gauges` are normalized 0..1 over "
            "the gauge's own image (top-left origin). image_size gives the "
            "native pixel size. Pivot coordinates are absolute pixels in the "
            "native image. font_px_at_native_h is the pixel font size used "
            "at native image height; scale linearly if you resize the gauge."
        ),
        "palette": {
            "parchment": list(PARCHMENT[:3]),
            "ink": list(INK[:3]),
            "ink_soft": list(INK_SOFT[:3]),
            "ink_faint": list(INK_FAINT[:3]),
            "redline": list(REDLINE[:3]),
            "warn_amber": list(WARN_AMBER[:3]),
            "cool_blue": list(COOL_BLUE[:3]),
            "digital_bg": list(DIGITAL_BG[:3]),
            "digital_ink": list(DIGITAL_INK[:3]),
        },
        "fonts": {
            "sans": {
                "candidates": [
                    "Futura.ttc", "GillSans.ttc", "HelveticaNeue.ttc",
                    "Helvetica.ttc", "Arial.ttf",
                ],
                "use_for": "titles, numerals, labels",
            },
            "mono": {
                "candidates": ["Menlo.ttc", "Courier.ttc", "Monaco.ttf"],
                "use_for": "live digital readouts (km/h, voltage, AFR, oil temp, IAT)",
            },
        },
        "needles": {
            "long": {
                "sprite": "needle_long.png",
                "size": [long_needle.width, long_needle.height],
                "pivot": list(long_needle_pivot),
                "use_for": ["center"],
            },
            "short": {
                "sprite": "needle_short.png",
                "size": [short_needle.width, short_needle.height],
                "pivot": list(short_needle_pivot),
                "use_for": ["oil", "coolant", "boost", "fuel"],
            },
        },
        "rotation_convention": (
            "math_angle is CCW-positive, 0° points right (PIL y-down). "
            "Godot 2D Node2D.rotation_degrees is CW-positive with 0 pointing "
            "right; convert via godot_rot = -(math_angle - 90) so that "
            "math_angle=90 (up) corresponds to godot_rot=0."
        ),
        "gauges": {
            "center":  manifests["center"],
            "oil":     manifests["oil"],
            "coolant": manifests["coolant"],
            "boost":   manifests["boost"],
            "fuel":    manifests["fuel"],
        },
        "panel": {
            "model": "Waveshare 12.3-inch DSI 1920x720",
            "diagonal_in": PANEL_DIAGONAL_IN,
            "size_px": [PANEL_W_PX, PANEL_H_PX],
            "size_mm": [round(PANEL_W_MM, 3), round(PANEL_H_MM, 3)],
            "mm_per_px": round(PANEL_MM_PER_PX, 6),
            "px_per_mm": round(1.0 / PANEL_MM_PER_PX, 6),
        },
    }
    if bezel_block is not None:
        full_manifest["bezel"] = bezel_block
    manifest_path = os.path.join(out_dir, "gauges_manifest.json")
    with open(manifest_path, "w") as f:
        json.dump(full_manifest, f, indent=2, default=str)
    print(f"  -> gauges_manifest.json  (full Godot integration spec)")

    # --- Preview composite (driven entirely by the manifest + demo values) ---
    preview = render_preview(saved, full_manifest, long_needle, short_needle, dxf)
    p = os.path.join(out_dir, "dashboard_preview.png")
    preview.save(p, optimize=True)
    print(f"  -> dashboard_preview.png ({preview.width}x{preview.height})")

    # --- Panel-accurate composite with bezel scan overlay ---
    if dxf is not None:
        panel_img = render_panel_with_bezel(
            saved, full_manifest, long_needle, short_needle, dxf,
        )
        placed = panel_img.info.get("panel_placement", [])
        p = os.path.join(out_dir, "dashboard_panel.png")
        panel_img.save(p, optimize=True)
        print(f"  -> dashboard_panel.png   ({panel_img.width}x{panel_img.height}) "
              f"@ {PANEL_MM_PER_PX:.4f} mm/px (12.3\" 1920x720)")
        # Persist gauge placement on the panel back into the manifest
        if placed and "bezel" in full_manifest:
            full_manifest["bezel"]["gauge_placement_panel_px"] = placed
            with open(manifest_path, "w") as f:
                json.dump(full_manifest, f, indent=2, default=str)

    # --- Godot integration notes (all numbers read back from the manifest) ---
    print()
    print("Godot integration (godot_rot is clockwise-positive, 0 = needle up):")
    c = manifests["center"]
    lp = full_manifest["needles"]["long"]["pivot"]
    sp = full_manifest["needles"]["short"]["pivot"]
    print("  Center tach (center_tach.png):")
    print(f"    - size            : {CENTER_W}x{CENTER_H}")
    print(f"    - dial pivot      : ({c['needle']['pivot'][0]:g}, {c['needle']['pivot'][1]:g}) px")
    print(f"    - rotation        : rot_deg = {90 - CENTER_SWEEP_START:g} + "
          f"{CENTER_SWEEP_TOTAL:g} * (rpm/{CENTER_RPM_MAX})")
    print(f"    - needle          : needle_long.png, hinge ({lp[0]}, {lp[1]}) "
          f"-> Offset ({-lp[0]}, {-lp[1]})")
    print()
    print("  Pill gauges (pill_*.png):")
    print(f"    - size            : {PILL_W}x{PILL_H}")
    for slot in ("oil", "coolant", "boost", "fuel"):
        g = manifests[slot]
        n = g["needle"]
        v = g["value"]
        a0, a1 = n["sweep_start_math_deg"], n["sweep_end_math_deg"]
        print(f"    - {slot:<8}: side={g['side']:<5} pivot "
              f"({n['pivot'][0]:g}, {n['pivot'][1]:g}) px, "
              f"rot_deg = {90 - a0:g} {'-' if a1 > a0 else '+'} {abs(a1 - a0):g} * t, "
              f"t = (v - min) / (max - min), range {v['min']:g}..{v['max']:g}")
    print(f"    - needle          : needle_short.png, hinge ({sp[0]}, {sp[1]}) "
          f"-> Offset ({-sp[0]}, {-sp[1]})")
    if dxf is not None and "bezel" in full_manifest:
        print()
        print("  Panel placement on the 1920x720 screen (top-left px, uniform scale):")
        for pl in full_manifest["bezel"].get("gauge_placement_panel_px", []):
            gp = pl["gauge_px"]
            print(f"    - {pl['slot']:<8}: position ({gp['x'] / PANEL_SSAA:g}, "
                  f"{gp['y'] / PANEL_SSAA:g}), scale "
                  f"{gp['scale_native_to_panel'] / PANEL_SSAA:.3f}")
    print()
    print("Done.")


if __name__ == "__main__":
    main()
