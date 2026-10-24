"""Autozam line art: automatic silhouette + wheels, hand-placed detail lines (photo px)."""
import cv2, numpy as np
from scipy.ndimage import gaussian_filter1d
S = 3
alpha = cv2.imread('alpha3x.png', 0); H, W = alpha.shape
# straight bottoms instead of the floor shadow under the air dam and sills
_yy, _xx = np.mgrid[0:H, 0:W] / S
_tyres = (((_xx - 452) / 68) ** 2 + ((_yy - 447) / 69) ** 2 < 1) | (((_xx - 742) / 50) ** 2 + ((_yy - 428) / 62) ** 2 < 1)
alpha[((_yy > 478) & (_xx > 200) & (_xx < 452)) & ~_tyres] = 0
alpha[((_yy > 470) & (_xx > 452) & (_xx < 742)) & ~_tyres] = 0
src = cv2.imread('cutout.png', cv2.IMREAD_UNCHANGED)
img = cv2.resize(src[..., :3], None, fx=S, fy=S, interpolation=cv2.INTER_CUBIC)
out = np.zeros_like(alpha)

def catmull(pts, closed, n=12):
    p = np.array(pts, np.float32)
    if closed: p = np.vstack([p[-1], p, p[0], p[1]])
    else: p = np.vstack([p[0], p, p[-1]])
    res = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for t in np.linspace(0, 1, n, endpoint=False):
            t2, t3 = t * t, t * t * t
            res.append(0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    if not closed: res.append(p[-2])
    return np.array(res)

def line(pts, closed=False, w=6, smooth=True):
    q = catmull(pts, closed) if smooth and len(pts) > 2 else np.array(pts, np.float32)
    cv2.polylines(out, [(q * S).round().astype(np.int32)], closed, 255, thickness=w, lineType=cv2.LINE_AA)

def ellipse(c, ax, ang=0, w=6):
    cv2.ellipse(out, (int(c[0] * S), int(c[1] * S)), (int(ax[0] * S), int(ax[1] * S)), ang, 0, 360, 255, w, cv2.LINE_AA)

# 1. silhouette (automatic, smoothed)
cs, _ = cv2.findContours(alpha, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
for c in cs:
    p = c[:, 0, :].astype(np.float32)
    p[:, 0] = gaussian_filter1d(p[:, 0], 6, mode='wrap'); p[:, 1] = gaussian_filter1d(p[:, 1], 6, mode='wrap')
    cv2.polylines(out, [p.round().astype(np.int32)], True, 255, thickness=10, lineType=cv2.LINE_AA)

# 2. wheels (automatic: grey-level bands inside the rims)
flat = cv2.pyrMeanShiftFiltering(img, 12, 24)
g = cv2.cvtColor(flat, cv2.COLOR_BGR2GRAY) // 64
yy, xx = np.mgrid[0:H, 0:W]
for (cx, cy, r) in []:
    m = ((xx - cx * S) ** 2 + (yy - cy * S) ** 2) < (r * S) ** 2
    e = np.zeros_like(alpha); e[:, 1:] |= (g[:, 1:] != g[:, :-1]); e[1:, :] |= (g[1:, :] != g[:-1, :])
    e = (e * 255) & (m.astype(np.uint8) * 255)
    cnts, _ = cv2.findContours(cv2.dilate(e, np.ones((3, 3), np.uint8)), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    for c in cnts:
        if cv2.arcLength(c, True) < 60 * S / 3 * 3: continue
        p = c[:, 0, :].astype(np.float32)
        p[:, 0] = gaussian_filter1d(p[:, 0], 3, mode='wrap'); p[:, 1] = gaussian_filter1d(p[:, 1], 3, mode='wrap')
        cv2.polylines(out, [p.round().astype(np.int32)], True, 255, thickness=5, lineType=cv2.LINE_AA)
ellipse((452, 446), (44, 56), 0, 6)   # front rim edge
ellipse((450, 448), (7, 9), 0, 5)
import math
for k in range(5):
    a = math.radians(-90 + 72 * k)
    line([(450 + 9 * math.cos(a), 448 + 11 * math.sin(a)), (452 + 38 * math.cos(a), 446 + 49 * math.sin(a))], w=7, smooth=False)
ellipse((745, 430), (26, 43), 0, 6)   # rear rim edge
ellipse((745, 430), (5, 8), 0, 5)
import math
for k in range(5):
    a = math.radians(-90 + 72 * k)
    line([(745 + 6 * math.cos(a), 430 + 9 * math.sin(a)), (745 + 22 * math.cos(a), 430 + 37 * math.sin(a))], w=6, smooth=False)

# 3. hand-placed detail
# windshield
line([(315, 327), (360, 290), (405, 264), (457, 260), (490, 290), (514, 331), (420, 327)], closed=True)
# near door opening
line([(457, 260), (632, 261), (655, 290), (668, 320), (675, 355), (676, 417), (522, 417), (520, 332)], closed=False)
# seat back
# near raised door: outline, window, mirror, strut
line([(477, 115), (560, 113), (672, 122), (664, 133), (640, 141), (612, 168), (592, 208), (577, 258)])
line([(477, 115), (483, 140), (491, 200), (497, 258)])
line([(502, 143), (604, 152), (576, 182), (507, 182)], closed=True)
line([(487, 110), (485, 96), (493, 89), (501, 93), (500, 105), (494, 113)], closed=True, w=5)
line([(449, 197), (449, 256)], w=5, smooth=False); line([(574, 197), (577, 257)], w=5, smooth=False)
# far raised door: blade, mirror
line([(487, 158), (380, 150), (276, 141), (271, 148), (290, 165), (400, 172), (487, 181)])
line([(352, 142), (361, 124)], w=5, smooth=False)
line([(360, 124), (367, 107), (377, 108), (376, 121), (366, 128)], closed=True, w=5)
# bonnet scoop
line([(265, 350), (277, 342), (311, 342), (307, 350), (277, 357)], closed=True)
# headlights
ellipse((194, 385), (13, 12), -20, 6); line([(180, 378), (190, 370), (210, 368)], w=5)
ellipse((326, 392), (19, 16), -10, 6)
line([(298, 395), (306, 376), (330, 371), (348, 375), (350, 398), (338, 409), (310, 410)], closed=True, w=5)
# bumper: top crease, indicators, plate frame, lower lip
line([(149, 414), (230, 415), (330, 417), (392, 418)])
line([(149, 419), (170, 420), (170, 432), (149, 431)], closed=True, w=5, smooth=False)
line([(295, 426), (338, 427), (338, 440), (295, 439)], closed=True, w=5, smooth=False)
line([(194, 425), (244, 426), (244, 466), (194, 465)], closed=True, w=5, smooth=False)
line([(158, 468), (260, 474), (390, 478)])
# front wheel arch + side marker
line([(394, 417), (410, 392), (432, 376), (460, 370), (484, 376), (500, 390)])
ellipse((510, 388), (4, 5), 0, 5)
# sill
line([(501, 468), (600, 468), (697, 468)])
# rear: vents, wing, deck, filler, arch
for i, y in enumerate([352, 360, 368, 376, 384]):
    line([(683, y + 1), (707, y - 1)], w=5, smooth=False)
line([(676, 287), (720, 288), (767, 291), (770, 298), (736, 296), (690, 294)], closed=True)
line([(735, 296), (737, 324)], w=6, smooth=False)
line([(680, 318), (730, 323), (772, 329)])
ellipse((726, 339), (6, 6), 0, 5)
line([(705, 381), (730, 366), (763, 368), (776, 385)])

n, lab, st, _ = cv2.connectedComponentsWithStats((out > 127).astype(np.uint8))
for i in range(1, n):
    if st[i, cv2.CC_STAT_AREA] < 300: out[lab == i] = 0
rgba = np.zeros((H, W, 4), np.uint8); rgba[..., :3] = 255; rgba[..., 3] = out
cv2.imwrite('lines_rgba.png', rgba)
# overlay check on the photo
ov = cv2.resize(img, None, fx=1, fy=1); ov = (ov * 0.45).astype(np.uint8); ov[out > 127] = (0, 255, 255)
cv2.imwrite('overlay.png', cv2.resize(ov, None, fx=1/2, fy=1/2)[100:800, 250:1300])
small = cv2.resize(out, None, fx=1/S, fy=1/S, interpolation=cv2.INTER_AREA)
prev = np.full(small.shape + (3,), (48, 21, 27), np.uint8); prev[small > 60] = (255, 255, 255)
cv2.imwrite('lines_prev.png', prev[60:540, 120:800])
