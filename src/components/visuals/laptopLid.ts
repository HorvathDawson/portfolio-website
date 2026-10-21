/**
 * The laptop lid's pose for an opening angle (0 = upright, 90 = closed on the
 * keyboard), seen from a little above.
 *
 * Rather than CSS 3D (perspective, preserve-3d, backface-visibility), which
 * Safari renders differently and which makes it stack by depth instead of
 * z-index, the lid's on-screen shape is worked out here and applied as a flat
 * perspective warp (a 2D homography in matrix3d form). Past edge-on the
 * screen side would show mirrored, so the lid switches to its back side
 * (the `is-back` class) instead.
 */

/** Camera distance, as in CSS `perspective`. */
const CAMERA = 1100;
/** Vanishing point, as a fraction of the lid element's height above its top. */
const VANISH = 0.1;

type Point = [number, number];

/** CSS matrix3d mapping a w×h box onto a quadrilateral [top-left, top-right, bottom-right, bottom-left]. */
function warp(w: number, h: number, [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: Point[]): string {
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const sx = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const sy = y0 - y1 + y2 - y3;
  const det = dx1 * dy2 - dy1 * dx2;
  const g = (sx * dy2 - sy * dx2) / det;
  const k = (dx1 * sy - dy1 * sx) / det;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + k * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + k * y3;
  return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`;
}

/**
 * Transform for the lid element (`transform-origin: 0 0`). Also marks which
 * side of the lid faces the viewer.
 */
export function lidTransform(lid: HTMLElement, closed: number): string {
  const w = lid.offsetWidth;
  const h = lid.offsetHeight;
  if (!w || !h) return '';
  const angle = (closed * Math.PI) / 180;
  const vx = w / 2;
  const vy = -VANISH * h;
  // Rotate a point of the lid about the hinge (its bottom edge) towards the viewer, then project it.
  const project = (x: number, y: number): Point => {
    const fromHinge = h - y;
    const py = h - fromHinge * Math.cos(angle);
    const pz = fromHinge * Math.sin(angle);
    const s = CAMERA / (CAMERA - pz);
    return [vx + (x - vx) * s, vy + (py - vy) * s];
  };
  const quad = [project(0, 0), project(w, 0), project(w, h), project(0, h)];
  // Once the top edge drops below the hinge as drawn, we're looking at the lid's back.
  const back = quad[0][1] > h;
  lid.classList.toggle('is-back', back);
  return warp(w, h, quad);
}
