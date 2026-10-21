"""Trace white line art (a transparent PNG/WebP, like a card's outline.webp)
into an SVG of filled paths, then run make_svg.py on it for the white outline
and gradient versions used by the project cards.

    python scripts/trace_outline.py public/assets/projects/a40-austin/outline.webp
    # writes outline.svg and colored.svg next to the input, cropped to the drawing

With --photo the input is a cut-out photo instead (transparent background):
its edges are found first, turning it into a line sketch, and the gradient
version is filled with the photo's own silhouette. --crop x0,y0,x1,y1 keeps
part of the image, and --out sets the output folder.

    python scripts/trace_outline.py --photo public/assets/projects/competition-robot/colored.webp

Needs: pip install potracer pillow numpy svgpathtools opencv-python-headless
"""

import argparse
import os
import subprocess
import sys
import tempfile

import xml.etree.ElementTree as ET

import numpy as np
import potrace
from PIL import Image

BG_COLOR = "#361c7d"  # make_svg.py's fill under the lines


def load(path, crop):
    img = np.asarray(Image.open(path).convert("RGBA"))
    if crop:
        x0, y0, x1, y1 = crop
        img = img[y0:y1, x0:x1]
    return img


def line_ink(img, threshold):
    """White line art: a pixel is ink when it is both opaque and light."""
    rgba = img.astype(np.float32)
    return (rgba[..., 3] / 255) * (rgba[..., :3].mean(axis=2)) > threshold


def photo_ink(img):
    """A cut-out photo turned into a line sketch: its edges plus its silhouette."""
    import cv2

    scale = 2  # edges come out finer when found on an enlarged photo
    grey = cv2.cvtColor(np.ascontiguousarray(img[..., :3]), cv2.COLOR_RGB2GRAY)
    grey = cv2.resize(grey, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
    alpha = cv2.resize(img[..., 3], None, fx=scale, fy=scale) > 128
    smooth = cv2.bilateralFilter(grey, 11, 50, 50)
    edges = cv2.Canny(smooth, 55, 130)
    edges[~cv2.erode(alpha.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)] = 0
    outline = cv2.Canny(alpha.astype(np.uint8) * 255, 50, 150)
    ink = cv2.dilate(edges, np.ones((3, 3), np.uint8)) | cv2.dilate(outline, np.ones((5, 5), np.uint8))
    return ink > 0, alpha, scale


def trace_paths(mask, turdsize, scale=1):
    # potracer traces the False pixels.
    plist = potrace.Bitmap(~mask).trace(turdsize=turdsize, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0, opticurve=True)
    k = 1 / scale

    def pt(p):
        return f"{p.x * k:.1f},{p.y * k:.1f}"

    parts = []
    for curve in plist:
        d = [f"M{pt(curve.start_point)}"]
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{pt(seg.c)}L{pt(seg.end_point)}")
            else:
                d.append(f"C{pt(seg.c1)} {pt(seg.c2)} {pt(seg.end_point)}")
        d.append("Z")
        parts.append("".join(d))
    return parts


def fill_with_silhouette(colored, silhouette):
    """Swap make_svg.py's fills (which close every outer outline) for the
    photo's real silhouette, which keeps gaps like the inside of a loop open."""
    ET.register_namespace("", "http://www.w3.org/2000/svg")
    tree = ET.parse(colored)
    root = tree.getroot()
    for parent in list(root.iter()):
        for child in list(parent):
            if child.get("fill") == BG_COLOR:
                parent.remove(child)
    fill = ET.Element("{http://www.w3.org/2000/svg}path", {"d": silhouette, "fill": BG_COLOR, "fill-rule": "evenodd"})
    defs_end = max(i for i, c in enumerate(root) if c.tag.endswith("defs")) + 1
    root.insert(defs_end, fill)
    tree.write(colored, xml_declaration=True, encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("input")
    parser.add_argument("--threshold", type=float, default=110, help="line art: how light a pixel must be to count")
    parser.add_argument("--photo", action="store_true", help="the input is a cut-out photo, not line art")
    parser.add_argument("--crop", help="x0,y0,x1,y1 in input pixels")
    parser.add_argument("--out", help="output folder (default: next to the input)")
    args = parser.parse_args()

    img = load(args.input, [int(v) for v in args.crop.split(",")] if args.crop else None)
    silhouette = None
    if args.photo:
        ink, alpha, scale = photo_ink(img)
        parts = trace_paths(ink, turdsize=60, scale=scale)
        silhouette = " ".join(trace_paths(alpha, turdsize=200, scale=scale))
    else:
        ink, scale = line_ink(img, args.threshold), 1
        parts = trace_paths(ink, turdsize=6)

    # Crop to the drawing, with a little room for the line width.
    ys, xs = np.nonzero(ink)
    pad = 6
    x0, y0 = max(xs.min() / scale - pad, 0), max(ys.min() / scale - pad, 0)
    x1, y1 = xs.max() / scale + pad, ys.max() / scale + pad
    x0, y0, x1, y1 = (round(v) for v in (x0, y0, x1, y1))
    out_dir = os.path.abspath(args.out or os.path.dirname(args.input))
    os.makedirs(out_dir, exist_ok=True)
    # All shapes in one path, so make_svg.py fills only the outer outlines.
    path_el = f'  <path d="{" ".join(parts)}" fill="#000" fill-rule="evenodd" />'
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1 - x0} {y1 - y0}">\n{path_el}\n</svg>\n'
    make_svg = os.path.join(os.path.dirname(__file__), "make_svg.py")
    with tempfile.TemporaryDirectory() as tmp:
        src = os.path.join(tmp, "art.svg")
        with open(src, "w") as fh:
            fh.write(svg)
        subprocess.run([sys.executable, make_svg, src], check=True, stdout=subprocess.DEVNULL)
        os.replace(os.path.join(tmp, "art_background.svg"), os.path.join(out_dir, "outline.svg"))
        os.replace(os.path.join(tmp, "art_foreground.svg"), os.path.join(out_dir, "colored.svg"))
    if silhouette:
        fill_with_silhouette(os.path.join(out_dir, "colored.svg"), silhouette)
    print(f"traced {len(parts)} shapes into {out_dir}/outline.svg and colored.svg, {x1 - x0}x{y1 - y0}")


if __name__ == "__main__":
    main()
