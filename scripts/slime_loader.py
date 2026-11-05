"""
Procedural slime-mould loading icon.

Grows a Physarum-like vein network over a 3D sphere using a space-colonisation
algorithm (branches seek scattered "food" points on the surface), adds a few
anastomoses so it forms a network rather than a pure tree, sizes veins with a
pipe model (thickness ~ sqrt of downstream tips), projects to 2D, and writes an
animated SVG: veins grow out from the seed, hold, then retract back to it.

    python slime_loader.py            -> slime_loader.svg
    python slime_loader.py --seed 3   -> a different mould

The site's loader (public/assets/loader/) is made with:

    python scripts/slime_loader.py --food 450 --out public/assets/loader/slime.svg
    python scripts/slime_loader.py --food 450 --static --out public/assets/loader/slime-static.svg

Colours follow the site: a purple sphere (#7038cf / #361c7d) with gold veins
(--gold, #f3de40). --static draws the fully grown network with no animation,
for prefers-reduced-motion.
"""
import argparse
import math
import numpy as np

# ---------------- parameters ----------------
SIZE = 240          # svg viewBox size (px)
R = 92              # sphere radius on screen
N_FOOD = 900       # attractor points on the sphere
STEP = 0.042        # growth step (sphere radius = 1)
INFLUENCE = 0.26    # how far food can "smell"
KILL = 0.055        # food is eaten when a vein gets this close
JITTER = 0.55       # wandering noise on growth direction
MAX_NODES = 4500
CYCLE = 4.2         # seconds per loop
GROW, HOLD, RETRACT = 0.55, 0.08, 0.30   # fractions of the cycle
TILT = (0.35, -0.5) # camera tilt (x, y rotation, radians)


def unit(v):
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def value_noise_sphere(p, rng, k=7):
    """Cheap smooth density field on the sphere: sum of random gaussian blobs."""
    centres = unit(rng.normal(size=(k, 3)))
    w = rng.uniform(0.4, 1.0, k)
    d = p @ centres.T
    return (np.exp((d - 1) * 4.0) * w).sum(1)


def grow(rng):
    # food: clustered, so the mould forms dense patches and sparse highways
    cand = unit(rng.normal(size=(N_FOOD * 4, 3)))
    dens = value_noise_sphere(cand, rng)
    keep = rng.random(len(cand)) < (0.15 + dens / dens.max())
    food = cand[keep][:N_FOOD]
    alive = np.ones(len(food), bool)

    # seed sits slightly up-left of centre as seen by the camera
    seed = unrotate(unit(np.array([-0.35, 0.3, 0.89])))
    nodes, parent, birth = [seed], [-1], [0]

    it = 0
    while alive.any() and len(nodes) < MAX_NODES and it < 600:
        it += 1
        P = np.asarray(nodes)
        idx = np.flatnonzero(alive)
        F = food[idx]
        d = np.linalg.norm(F[:, None, :] - P[None, :, :], axis=2)
        nearest, dist = d.argmin(1), d.min(1)
        smell = dist < INFLUENCE
        if not smell.any():
            break

        pulls = {}
        for f, n in zip(F[smell], nearest[smell]):
            pulls.setdefault(n, []).append(f - P[n])
        for n, vecs in pulls.items():
            v = unit(np.asarray(vecs)).sum(0)
            if np.linalg.norm(v) < 1e-6:
                continue
            v = v / np.linalg.norm(v) + rng.normal(scale=JITTER, size=3)
            p = P[n]
            v -= p * (v @ p)                  # keep it tangent to the surface
            v /= np.linalg.norm(v)
            nodes.append(unit(p + v * STEP))
            parent.append(n)
            birth.append(it)

        P = np.asarray(nodes)
        d = np.linalg.norm(food[idx][:, None, :] - P[None, :, :], axis=2).min(1)
        alive[idx[d < KILL]] = False

    return np.asarray(nodes), np.asarray(parent), np.asarray(birth, float)


def anastomoses(nodes, parent, birth, rng):
    """Fuse some tips into nearby veins -> loops, like a real plasmodium."""
    n = len(nodes)
    child_count = np.bincount(parent[parent >= 0], minlength=n)
    tips = np.flatnonzero(child_count == 0)
    links = []
    for t in tips:
        if rng.random() > 0.55:
            continue
        anc, a = set(), t
        for _ in range(14):
            anc.add(a)
            a = parent[a]
            if a < 0:
                break
        d = np.linalg.norm(nodes - nodes[t], axis=1)
        d[list(anc)] = 9
        j = d.argmin()
        if d[j] < STEP * 2.6:
            links.append((t, j))
    return links


def thickness(parent):
    n = len(parent)
    tips = np.ones(n)
    for i in range(n - 1, 0, -1):            # children always come after parents
        tips[parent[i]] += tips[i]
    return np.minimum(0.45 + 0.9 * np.log1p(tips) ** 1.15, 6.5)


def rotate(p):
    ax, ay = TILT
    rx = np.array([[1, 0, 0], [0, math.cos(ax), -math.sin(ax)], [0, math.sin(ax), math.cos(ax)]])
    ry = np.array([[math.cos(ay), 0, math.sin(ay)], [0, 1, 0], [-math.sin(ay), 0, math.cos(ay)]])
    return p @ (ry @ rx).T


def unrotate(v):
    ax, ay = TILT
    rx = np.array([[1, 0, 0], [0, math.cos(ax), -math.sin(ax)], [0, math.sin(ax), math.cos(ax)]])
    ry = np.array([[math.cos(ay), 0, math.sin(ay)], [0, 1, 0], [-math.sin(ay), 0, math.cos(ay)]])
    return (ry @ rx).T @ v


def chains(parent):
    n = len(parent)
    kids = [[] for _ in range(n)]
    for i in range(1, n):
        kids[parent[i]].append(i)
    out = []
    starts = [0] + [i for i in range(n) if len(kids[i]) > 1]
    for s in starts:
        for c in kids[s]:
            ch = [s, c]
            while len(kids[ch[-1]]) == 1:
                ch.append(kids[ch[-1]][0])
            out.append(ch)
    return out


def split_by_side(idx, z):
    """Break a chain wherever it crosses the visible horizon."""
    pieces, cur = [], [idx[0]]
    for a, b in zip(idx, idx[1:]):
        cur.append(b)
        if (z[a] >= 0) != (z[b] >= 0):
            pieces.append(cur)
            cur = [b]
    if len(cur) > 1:
        pieces.append(cur)
    return pieces


def smooth_path(pts):
    """Catmull-Rom through the points, as cubic Béziers."""
    if len(pts) == 2:
        (x0, y0), (x1, y1) = pts
        return f"M{x0:.1f} {y0:.1f}L{x1:.1f} {y1:.1f}"
    p = np.vstack([pts[0], pts, pts[-1]])
    d = f"M{p[1][0]:.1f} {p[1][1]:.1f}"
    for i in range(1, len(p) - 2):
        c1 = p[i] + (p[i + 1] - p[i - 1]) / 6
        c2 = p[i + 1] - (p[i + 2] - p[i]) / 6
        d += f"C{c1[0]:.1f} {c1[1]:.1f} {c2[0]:.1f} {c2[1]:.1f} {p[i+1][0]:.1f} {p[i+1][1]:.1f}"
    return d


def timing(b0, b1, bmax):
    f0, f1 = b0 / bmax, max(b1 / bmax, b0 / bmax + 0.004)
    gs, ge = f0 * GROW, f1 * GROW
    rs = GROW + HOLD + (1 - f1) * RETRACT
    re = GROW + HOLD + (1 - f0) * RETRACT
    kt = [0, gs, ge, rs, re, 1]
    kt = [min(max(k, 0), 1) for k in kt]
    for i in range(1, len(kt)):              # keyTimes must not go backwards
        kt[i] = max(kt[i], kt[i - 1])
    return ";".join(f"{k:.4f}" for k in kt)


def vein_colour(z):
    # dim amber at the limb -> the site's gold facing the viewer
    t = (z + 1) / 2
    lo, hi = np.array([150, 112, 24]), np.array([243, 222, 64])
    r, g, b = (lo + (hi - lo) * t).astype(int)
    return f"#{r:02x}{g:02x}{b:02x}"


def render(nodes, parent, birth, links, static=False):
    P = rotate(nodes)
    c = SIZE / 2
    xy = np.c_[c + R * P[:, 0], c - R * P[:, 1]]
    z = P[:, 2]
    w = thickness(parent)
    bmax = birth.max()

    back, front, blobs = [], [], []

    def emit(idx, width):
        for piece in split_by_side(idx, z):
            zm = z[piece].mean()
            kt = timing(birth[piece[0]], birth[piece[-1]], bmax)
            fore = 0.35 + 0.65 * math.sqrt(max(zm, 0))       # foreshortening
            sw = width * (fore if zm >= 0 else 0.7)
            if static:
                el = f'<path d="{smooth_path(xy[piece])}" stroke="{vein_colour(zm)}" stroke-width="{sw:.2f}"/>'
            else:
                el = (f'<path d="{smooth_path(xy[piece])}" stroke="{vein_colour(zm)}" '
                      f'stroke-width="{sw:.2f}" pathLength="1" stroke-dasharray="1 2" stroke-dashoffset="0">'
                      f'<animate attributeName="stroke-dashoffset" values="1;1;0;0;1;1" keyTimes="{kt}" '
                      f'dur="{CYCLE}s" repeatCount="indefinite"/></path>')
            (front if zm >= 0 else back).append(el)

    for ch in chains(parent):
        emit(ch, w[ch[1]])
    for a, b in links:
        emit([a, b], 0.9)

    # small swollen "feeding" tips on the visible side
    rng_blob = np.random.default_rng(1)
    kids = np.bincount(parent[parent >= 0], minlength=len(parent))
    for t in np.flatnonzero(kids == 0):
        if z[t] < 0.2 or rng_blob.random() > 0.35:
            continue
        f = birth[t] / bmax
        on = f * GROW
        off = GROW + HOLD + (1 - f) * RETRACT
        kt = f"0;{on:.4f};{min(on+0.03, off):.4f};{off:.4f};{min(off+0.03,1):.4f};1"
        if static:
            blobs.append(f'<circle cx="{xy[t][0]:.1f}" cy="{xy[t][1]:.1f}" r="{1.0 + 1.4*z[t]:.2f}" fill="#f8e88a"/>')
            continue
        blobs.append(
            f'<circle cx="{xy[t][0]:.1f}" cy="{xy[t][1]:.1f}" r="{1.0 + 1.4*z[t]:.2f}" fill="#f8e88a" opacity="1">'
            f'<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="{kt}" '
            f'dur="{CYCLE}s" repeatCount="indefinite"/></circle>')

    seed = xy[0]
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {SIZE} {SIZE}" width="{SIZE}" height="{SIZE}" role="img" aria-label="Loading">
<defs>
<radialGradient id="ball" cx="38%" cy="32%" r="75%">
<stop offset="0" stop-color="#9a6be6"/><stop offset=".55" stop-color="#5a2fb4"/><stop offset="1" stop-color="#241052"/>
</radialGradient>
</defs>
<g fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".55">{''.join(back)}</g>
<circle cx="{c}" cy="{c}" r="{R}" fill="url(#ball)" opacity=".86"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">{''.join(front)}</g>
{''.join(blobs)}
<circle cx="{seed[0]:.1f}" cy="{seed[1]:.1f}" r="3.2" fill="#f3de40"/>
</svg>"""


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--out", default="slime_loader.svg")
    ap.add_argument("--food", type=int, default=N_FOOD, help="attractor points (fewer = lighter file)")
    ap.add_argument("--static", action="store_true", help="fully grown, no animation")
    a = ap.parse_args()
    N_FOOD = a.food
    rng = np.random.default_rng(a.seed)
    nodes, parent, birth = grow(rng)
    links = anastomoses(nodes, parent, birth, rng)
    svg = render(nodes, parent, birth, links, static=a.static)
    open(a.out, "w").write(svg)
    print(f"{len(nodes)} nodes, {len(links)} loops, {int(birth.max())} growth steps, "
          f"{len(svg)/1024:.0f} KB -> {a.out}")
