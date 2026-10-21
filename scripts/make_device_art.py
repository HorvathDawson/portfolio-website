"""Draw the line art for the spare project cards (a desktop with a phone beside
it, a tablet on a stand and a TV on a wall) and the phone beside the Can I
Fish This? monitor.

Each drawing is written as single-colour paths, back to front, which is what
make_svg.py expects. Then make_svg.py turns each into the white outline (shown
at rest) and the gradient version (shown on hover):

    python scripts/make_device_art.py
    # writes public/assets/projects/devices/{desktop-phone,tablet,tv}-{outline,colored}.svg

make_svg.py's own white version would show edges that sit behind other
parts, so the outline is drawn here instead, with hidden lines removed.

The screen rectangles printed at the end are what DeviceDisplay.tsx uses to
place the screen content.
"""

import math
import os
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union

W, H = 420, 330
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "projects", "devices")
LINE = 3.2  # main outlines
FINE = 1.8  # details


def num(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def pts_path(points, closed=True):
    d = "M " + " L ".join(f"{num(x)},{num(y)}" for x, y in points)
    return d + (" Z" if closed else "")


def rrect_points(x, y, w, h, r, steps=6):
    """Points around a rounded rectangle, clockwise from the top-left corner."""
    r = min(r, w / 2, h / 2)
    corners = [
        (x + w - r, y + r, -90),
        (x + w - r, y + h - r, 0),
        (x + r, y + h - r, 90),
        (x + r, y + r, 180),
    ]
    pts = []
    for cx, cy, start in corners:
        for i in range(steps + 1):
            a = math.radians(start + 90 * i / steps)
            pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def ellipse_points(cx, cy, rx, ry, steps=48, a0=0, a1=360):
    return [
        (cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / steps)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / steps)))
        for i in range(steps + 1)
    ]


def quad_map(quad):
    """Map unit-square (u, v) onto a quadrilateral [tl, tr, br, bl] (bilinear)."""
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = quad

    def f(u, v):
        top = (x0 + (x1 - x0) * u, y0 + (y1 - y0) * u)
        bot = (x3 + (x2 - x3) * u, y3 + (y2 - y3) * u)
        return (top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v)

    return f


def rotate(points, cx, cy, deg):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return [(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for x, y in points]


class Drawing:
    def __init__(self, width=W, height=H):
        self.width, self.height = width, height
        self.paths = []

    def shape(self, points, width=LINE, closed=True):
        ring = list(points) + [points[0]] if closed else list(points)
        self.paths.append((pts_path(points, closed), width, closed, ring))

    def line(self, points, width=FINE):
        # A perfectly straight horizontal or vertical line has a zero-size
        # bounding box, which hides it under make_svg.py's gradient.
        (x0, y0), (x1, y1) = points[0], points[-1]
        if len(points) == 2 and (x0 == x1 or y0 == y1):
            points = [points[0], ((x0 + x1) / 2 + 0.05, (y0 + y1) / 2 + 0.05), points[1]]
        self.shape(points, width, closed=False)

    def svg(self):
        """Every shape, back to front: the source for make_svg.py."""
        return wrap((path_el(d, w, "#000") for d, w, _, _ in self.paths), self.width, self.height)

    def outline_svg(self):
        """White lines with the parts hidden behind later shapes removed."""
        els = []
        for i, (_, w, _, pts) in enumerate(self.paths):
            front = [Polygon(p) for _, _, closed, p in self.paths[i + 1 :] if closed]
            line = LineString(pts)
            if front:
                line = line.difference(unary_union(front))
            for part in getattr(line, "geoms", [line]):
                if not part.is_empty and part.length > 0.5:
                    els.append(path_el(pts_path(list(part.coords), closed=False), w, "#fff"))
        return wrap(els, self.width, self.height)


def path_el(d, width, colour):
    return f'  <path d="{d}" fill="none" stroke="{colour}" stroke-width="{num(width)}" stroke-linejoin="round" stroke-linecap="round" />'


def wrap(els, width=W, height=H):
    body = "\n".join(els)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}">\n{body}\n</svg>\n'


def keyboard(d, quad, cols=14):
    """A keyboard in perspective, with rows of keys and a space bar."""
    d.shape(quad)
    f = quad_map(quad)
    rows = 4
    for r in range(rows):
        v0, v1 = 0.12 + r * 0.2, 0.12 + r * 0.2 + 0.15
        c = 0
        while c < cols:
            span = cols // 2 - 1 if (r == rows - 1 and c == cols // 3) else 1
            u0 = 0.04 + c * (0.92 / cols)
            u1 = u0 + span * (0.92 / cols) - 0.012
            d.shape([f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)], 1.2)
            c += span


def leaves(d, x, y, sizes):
    """A spray of leaves fanning up from (x, y)."""
    for angle, length in sizes:
        tip = (x + length * math.sin(math.radians(angle)), y - length * math.cos(math.radians(angle)))
        mid = ((x + tip[0]) / 2, (y + tip[1]) / 2)
        nx, ny = (tip[1] - y) / length * length * 0.16, -(tip[0] - x) / length * length * 0.16
        d.shape([(x, y), (mid[0] + nx, mid[1] + ny), tip, (mid[0] - nx, mid[1] - ny)], FINE)


def desktop_phone():
    """A desktop monitor with a phone on a dock beside it: a site and its mobile version."""
    d = Drawing()
    # Monitor stand, then the monitor: back edge for depth, then the front
    d.shape([(140, 186), (176, 186), (183, 250), (133, 250)])
    d.shape(rrect_points(96, 246, 124, 11, 5.5))
    d.shape(rrect_points(26, 14, 276, 178, 12))
    d.shape(rrect_points(20, 8, 276, 178, 12))
    monitor = (32, 20, 252, 144)
    d.shape(rrect_points(*monitor, 4), FINE)
    d.shape(ellipse_points(158, 176, 2.4, 2.4, 12), FINE)
    keyboard(d, [(60, 278), (252, 278), (272, 316), (40, 316)], cols=12)
    # Phone dock: arm and base behind the phone, cradle lip in front
    d.shape([(330, 262), (364, 262), (374, 286), (320, 286)])
    d.shape(rrect_points(298, 282, 98, 12, 6))
    d.shape(rrect_points(316, 119, 70, 146, 13))
    d.shape(rrect_points(312, 116, 70, 146, 13))
    phone = (317, 121, 60, 128)
    d.shape(rrect_points(*phone, 9), FINE)
    d.shape(rrect_points(336, 126, 22, 6, 3), FINE)
    d.shape(rrect_points(304, 254, 86, 14, 5))
    return d, [monitor, phone]


def phone_stand():
    """A phone on a desk stand, turned a little to the left like the Can I Fish
    This? monitor drawing it sits beside (same height and units as that art)."""
    d = Drawing(120, 295)
    # Stand: back leg, base plate
    d.shape([(64, 214), (72, 210), (100, 266), (92, 268)])
    d.shape([(6, 262), (102, 260), (106, 271), (2, 274)])
    # Phone: its edge (seen on the right, for depth), then the face
    d.shape([(23, 139), (84, 128), (86, 257), (25, 253)])
    body = [(18, 141), (79, 130), (81, 259), (20, 255)]
    d.shape(body)
    f = quad_map(body)
    screen = [f(0.09, 0.07), f(0.91, 0.07), f(0.91, 0.93), f(0.09, 0.93)]
    d.shape(screen, FINE)
    d.shape([f(0.38, 0.025), f(0.62, 0.025), f(0.62, 0.045), f(0.38, 0.045)], FINE)
    # Cradle lip in front of the phone's foot
    d.shape([(12, 249), (88, 253), (88, 263), (12, 259)])
    return d, [screen]


def tv():
    """A TV on the wall over a low cabinet with a soundbar, books and a plant."""
    d = Drawing()
    # TV: back edge for depth, then the front
    d.shape(rrect_points(45, 16, 340, 190, 6))
    d.shape(rrect_points(40, 12, 340, 190, 6))
    screen = (48, 20, 324, 172)
    d.shape(rrect_points(*screen, 2), FINE)
    d.shape(ellipse_points(210, 197, 2.2, 2.2, 12), FINE)
    # Cable down the wall to the cabinet
    d.line([(296, 206), (299, 226), (293, 244), (296, 262)])
    # Cabinet: legs, body with three doors, top
    for x in (74, 338):
        d.shape([(x, 306), (x + 9, 306), (x + 7, 322), (x + 2, 322)])
    d.shape(rrect_points(58, 270, 304, 40, 4))
    for x in (159, 261):
        d.line([(x, 274), (x, 306)])
    for x in (147, 171, 249, 273):
        d.shape(rrect_points(x - 2, 284, 4, 12, 2), FINE)
    d.shape(rrect_points(50, 262, 320, 10, 3))
    # Soundbar
    d.shape(rrect_points(140, 248, 140, 13, 6.5))
    for i in range(9):
        d.shape(ellipse_points(170 + i * 10, 254.5, 1.4, 1.4, 10), 1.2)
    # Books
    d.shape(rrect_points(68, 252, 50, 9, 2))
    d.shape(rrect_points(73, 243, 42, 9, 2))
    d.shape(rrect_points(70, 234, 46, 9, 2))
    # Plant
    leaves(d, 332, 236, ((-40, 34), (-15, 42), (12, 39), (36, 32)))
    d.shape([(318, 236), (346, 236), (342, 262), (322, 262)])
    return d, [screen]


def tablet():
    d = Drawing()
    # Stand: base and the two arms that hold the tablet up
    d.shape(rrect_points(96, 300, 200, 13, 6.5))
    d.shape([(132, 236), (148, 236), (136, 302), (118, 302)])
    d.shape([(244, 236), (260, 236), (274, 302), (256, 302)])
    # Tablet (portrait): back edge, then the front, then the cradle lip
    d.shape(rrect_points(112, 16, 176, 262, 18))
    d.shape(rrect_points(106, 10, 176, 262, 18))
    screen = (118, 26, 152, 230)
    d.shape(rrect_points(*screen, 6), FINE)
    d.shape(ellipse_points(194, 18, 2.2, 2.2, 12), FINE)
    d.shape(rrect_points(98, 262, 192, 16, 6))
    # Stylus leaning against the stand
    body = rrect_points(290, 248, 112, 8, 4)
    d.shape(rotate(body, 346, 252, -62))
    d.shape(rotate([(290, 248.5), (276, 252), (290, 255.5)], 346, 252, -62), FINE)
    d.line(rotate([(384, 248), (384, 256)], 346, 252, -62))
    # Small plant on the left
    leaves(d, 54, 262, ((-38, 52), (-14, 64), (10, 58), (34, 48)))
    d.shape([(30, 262), (78, 262), (72, 306), (36, 306)])
    d.shape(rrect_points(26, 256, 56, 10, 3))
    return d, [screen]


def laptop_lid_back():
    """The back of the self-driving-car laptop's lid, seen when it is closed or
    nearly so. Same size as public/assets/projects/self-driving-car/computer-*.svg.
    Drawn upside down: the page's perspective warp mirrors the lid vertically
    once it tips past edge-on, which turns it the right way up."""
    d = Drawing(476, 309)
    d.shape(rrect_points(2, 2, 472, 305, 24), 2.4)
    d.shape(rrect_points(14, 14, 448, 281, 16), 1.2)
    circle_logo = ellipse_points(238, 154, 24, 24, 40)
    d.shape(circle_logo, 2.4)
    d.line([(226, 154), (236, 144), (252, 164)], 2.4)
    return d


def export(drawing, out_dir, name):
    """Write <name>-outline.svg and, through make_svg.py, <name>-colored.svg."""
    os.makedirs(out_dir, exist_ok=True)
    make_svg = os.path.join(os.path.dirname(os.path.abspath(__file__)), "make_svg.py")
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, f"{name}.svg")
        with open(src, "w") as fh:
            fh.write(drawing.svg())
        subprocess.run([sys.executable, make_svg, src], check=True, stdout=subprocess.DEVNULL)
        with open(os.path.join(out_dir, f"{name}-outline.svg"), "w") as fh:
            fh.write(drawing.outline_svg())
        colored = os.path.join(out_dir, f"{name}-colored.svg")
        os.replace(os.path.join(tmp, f"{name}_foreground.svg"), colored)
        unfill_open_lines(colored)


def unfill_open_lines(path):
    """make_svg.py puts a filled copy under every path; drop it under open lines
    (cables, tubing, steam), where it would fill the curve like a sail."""
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    tree = ET.parse(path)
    for parent in tree.getroot().iter():
        children = list(parent)
        for under, line in zip(children, children[1:]):
            d = line.get("d") or ""
            if under.get("fill") == "#361c7d" and line.tag.endswith("path") and not d.rstrip().endswith("Z"):
                parent.remove(under)
    tree.write(path, xml_declaration=True, encoding="utf-8")


def main():
    for name, draw in (("desktop-phone", desktop_phone), ("tablet", tablet), ("tv", tv)):
        drawing, screens = draw()
        export(drawing, OUT, name)
        for sx, sy, sw, sh in screens:
            print(f"{name}: screen left {sx / W:.2%} top {sy / H:.2%} width {sw / W:.2%} height {sh / H:.2%}")
    export(laptop_lid_back(), os.path.join(OUT, "..", "self-driving-car"), "lid-back")
    phone, (screen,) = phone_stand()
    export(phone, os.path.join(OUT, "..", "bc-fishing-regulations"), "phone-stand")
    corners = ", ".join(f"[{x / phone.width:.4f}, {y / phone.height:.4f}]" for x, y in screen)
    print(f"bc-fishing-regulations: phone-stand screen corners {corners}")
    print("self-driving-car: lid-back")


if __name__ == "__main__":
    main()
