"""Draw the line art for the spare project cards: a desktop computer, a tablet
on a stand and a phone.

Each drawing is written as single-colour paths, back to front, which is what
make_svg.py expects. Then make_svg.py turns each into the white outline (shown
at rest) and the gradient version (shown on hover):

    python scripts/make_device_art.py
    # writes public/assets/projects/upcoming/{computer,tablet,phone}-{outline,colored}.svg

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

from shapely.geometry import LineString, Polygon
from shapely.ops import unary_union

W, H = 420, 330
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "projects", "upcoming")
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
    def __init__(self):
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
        return wrap(path_el(d, w, "#000") for d, w, _, _ in self.paths)

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
        return wrap(els)


def path_el(d, width, colour):
    return f'  <path d="{d}" fill="none" stroke="{colour}" stroke-width="{num(width)}" stroke-linejoin="round" stroke-linecap="round" />'


def wrap(els):
    body = "\n".join(els)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}">\n{body}\n</svg>\n'


def computer():
    d = Drawing()
    # Mug with steam, behind the monitor's left edge
    d.shape(rrect_points(14, 228, 40, 54, 6))
    d.line(ellipse_points(56, 255, 12, 13, 24, -80, 80), LINE)
    for x in (24, 34, 44):
        d.line([(x + 3 * math.sin(t / 3), 218 - t * 1.6) for t in range(0, 22)])
    # Stand behind the monitor
    d.shape([(190, 190), (230, 190), (238, 262), (182, 262)])
    d.shape(rrect_points(146, 258, 128, 11, 5.5))
    # Monitor: back edge for depth, then the front
    d.shape(rrect_points(68, 14, 300, 192, 12))
    d.shape(rrect_points(62, 8, 300, 192, 12))
    screen = (74, 20, 276, 156)
    d.shape(rrect_points(*screen, 4), FINE)
    d.shape(ellipse_points(212, 189, 2.4, 2.4, 12), FINE)
    # Keyboard in perspective, with rows of keys
    quad = [(92, 286), (322, 286), (346, 320), (68, 320)]
    d.shape(quad)
    f = quad_map(quad)
    cols, rows = 14, 4
    for r in range(rows):
        v0, v1 = 0.12 + r * 0.2, 0.12 + r * 0.2 + 0.15
        c = 0
        while c < cols:
            span = 6 if (r == rows - 1 and c == 4) else 1
            u0 = 0.04 + c * (0.92 / cols)
            u1 = u0 + span * (0.92 / cols) - 0.012
            d.shape([f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)], 1.2)
            c += span
    # Mouse and its cable
    d.line([(378, 268), (380, 250), (372, 236), (380, 222)], FINE)
    d.shape(ellipse_points(380, 296, 15, 24))
    d.line([(365, 290), (395, 290)])
    d.line([(380, 272), (380, 290)])
    return d, screen


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
    for angle, length in ((-38, 52), (-14, 64), (10, 58), (34, 48)):
        tip = (54 + length * math.sin(math.radians(angle)), 262 - length * math.cos(math.radians(angle)))
        mid = ((54 + tip[0]) / 2, (262 + tip[1]) / 2)
        nx, ny = (tip[1] - 262) / length * 9, -(tip[0] - 54) / length * 9
        d.shape([(54, 262), (mid[0] + nx, mid[1] + ny), tip, (mid[0] - nx, mid[1] - ny)], FINE)
    d.shape([(30, 262), (78, 262), (72, 306), (36, 306)])
    d.shape(rrect_points(26, 256, 56, 10, 3))
    return d, screen


PHONE_ANGLE = -10


def phone():
    d = Drawing()
    cx, cy = 196, 160
    # Earbuds case beside the phone
    case = rrect_points(312, 222, 70, 62, 22)
    d.shape(case)
    d.line([(313, 246), (381, 246)])
    d.shape(ellipse_points(347, 262, 2.4, 2.4, 12), FINE)
    pw, ph = 140, 280
    x, y = cx - pw / 2, cy - ph / 2
    rot = lambda pts: rotate(pts, cx, cy, PHONE_ANGLE)  # noqa: E731
    # Side buttons, then the back edge, then the front
    d.shape(rot(rrect_points(x + pw + 3, y + 70, 7, 46, 3)), FINE)
    d.shape(rot(rrect_points(x - 4, y + 62, 6, 26, 3)), FINE)
    d.shape(rot(rrect_points(x - 4, y + 96, 6, 26, 3)), FINE)
    d.shape(rot(rrect_points(x + 6, y + 5, pw, ph, 26)))
    d.shape(rot(rrect_points(x, y, pw, ph, 26)))
    inset = 8
    screen = (x + inset, y + inset, pw - 2 * inset, ph - 2 * inset)
    d.shape(rot(rrect_points(*screen, 19)), FINE)
    d.shape(rot(rrect_points(cx - 22, y + 16, 44, 12, 6)), FINE)
    return d, screen


def main():
    os.makedirs(OUT, exist_ok=True)
    make_svg = os.path.join(os.path.dirname(__file__), "make_svg.py")
    with tempfile.TemporaryDirectory() as tmp:
        for name, draw in (("computer", computer), ("tablet", tablet), ("phone", phone)):
            drawing, (sx, sy, sw, sh) = draw()
            src = os.path.join(tmp, f"{name}.svg")
            with open(src, "w") as fh:
                fh.write(drawing.svg())
            subprocess.run([sys.executable, make_svg, src], check=True, stdout=subprocess.DEVNULL)
            with open(os.path.join(OUT, f"{name}-outline.svg"), "w") as fh:
                fh.write(drawing.outline_svg())
            os.replace(os.path.join(tmp, f"{name}_foreground.svg"), os.path.join(OUT, f"{name}-colored.svg"))
            print(
                f"{name}: screen left {sx / W:.2%} top {sy / H:.2%} width {sw / W:.2%} height {sh / H:.2%}"
            )


if __name__ == "__main__":
    main()
