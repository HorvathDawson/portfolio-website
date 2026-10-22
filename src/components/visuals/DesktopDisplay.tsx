import React, { useCallback, useRef } from 'react';
import { AnimatedImage } from './AnimatedImage';
import { ArtLayer } from './ArtLayer';
import { useContainFit } from '../../utils/useContainFit';

const ART = '/assets/projects/bc-fishing-regulations';

/** The monitor drawing and the phone beside it share a height (294.66 units). */
const MONITOR_WIDTH = 354.24;
const PHONE_WIDTH = 120;
const ART_HEIGHT = 294.66;
const ASPECT = (MONITOR_WIDTH + PHONE_WIDTH) / ART_HEIGHT;
const MONITOR_SHARE = MONITOR_WIDTH / (MONITOR_WIDTH + PHONE_WIDTH);

type Quad = [number, number][];

/**
 * Each screen's opening, inside its outline: corners (top-left, top-right,
 * bottom-right, bottom-left) as fractions of its drawing. The monitor's was
 * measured from desktop-outline.svg and desktop-colored.svg; the phone's is
 * the inner edge of the screen line drawn by scripts/make_device_art.py.
 */
const MONITOR_OPENING: Quad = [[0.2479, 0.1161], [0.8769, 0.0305], [0.8797, 0.6443], [0.2383, 0.6307]];
const PHONE_OPENING: Quad = [[0.2448, 0.4514], [0.6393, 0.4276], [0.6552, 0.8476], [0.2607, 0.8361]];

/** Move each corner towards (negative: away from) the middle by dx, dy. */
function inset(quad: Quad, dx: number, dy: number): Quad {
  const cx = quad.reduce((t, [x]) => t + x, 0) / 4;
  const cy = quad.reduce((t, [, y]) => t + y, 0) / 4;
  return quad.map(([x, y]) => [x + Math.sign(cx - x) * dx, y + Math.sign(cy - y) * dy]);
}

/**
 * A CSS clip-path polygon for a quad (fractions of a box of the given aspect),
 * its corners rounded by `radius` (in the same units as the box's width).
 */
function clipPolygon(quad: Quad, aspect: number, radius = 0): string {
  const pts: Quad = [];
  quad.forEach(([x, y], i) => {
    if (!radius) return void pts.push([x, y]);
    // Round the corner with a quadratic curve between points `radius` along each edge.
    const towards = ([tx, ty]: [number, number]): [number, number] => {
      const ux = (tx - x) * aspect;
      const uy = ty - y;
      const len = Math.hypot(ux, uy);
      return [x + (ux / len) * (radius / aspect), y + (uy / len) * radius];
    };
    const a = towards(quad[(i + 3) % 4]);
    const b = towards(quad[(i + 1) % 4]);
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      pts.push([(1 - t) ** 2 * a[0] + 2 * t * (1 - t) * x + t * t * b[0], (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * y + t * t * b[1]]);
    }
  });
  return `polygon(${pts.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(', ')})`;
}

/*
 * Each recording is warped onto a quad a little larger than its screen, then
 * clipped to the screen opening less a couple of pixels. The clip, not the
 * warp, sets the edge: crisp, and always inside the outline however the
 * browser rounds the warp.
 */
const MONITOR_WARP = inset(MONITOR_OPENING, -0.006, -0.007);
const MONITOR_CLIP = clipPolygon(inset(MONITOR_OPENING, 0.006, 0.007), MONITOR_WIDTH / ART_HEIGHT);
const PHONE_WARP = inset(PHONE_OPENING, -0.012, -0.005);
const PHONE_CLIP = clipPolygon(inset(PHONE_OPENING, 0.012, 0.005), PHONE_WIDTH / ART_HEIGHT, 0.022);

/**
 * A screen recording of canifishthis.ca (scripts/record-demos.mjs), filling a
 * warped screen. It's shown whole (never cropped, which would cut off the
 * site's side panel); the recordings are made in the screens' proportions.
 */
const Recording: React.FC<{ view: 'desktop' | 'mobile' }> = ({ view }) => (
  // An <img> (rather than a CSS background) so the animation is lazy-loaded
  <AnimatedImage
    src={`${ART}/${view}-demo.webp`}
    loading="lazy"
    decoding="async"
    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill' }}
  />
);

/**
 * Compute a CSS matrix3d that maps a w×h rectangle to an arbitrary quadrilateral.
 * Corners: [topLeft, topRight, bottomRight, bottomLeft] as pixel coords.
 * transformOrigin must be set to '0 0' on the element.
 */
function computeWarpMatrix(
  w: number, h: number,
  [[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: [number, number][]
): string {
  const ddx1 = x1 - x2;
  const ddx2 = x3 - x2;
  const sx = x0 - x1 + x2 - x3;
  const ddy1 = y1 - y2;
  const ddy2 = y3 - y2;
  const sy = y0 - y1 + y2 - y3;

  const det = ddx1 * ddy2 - ddy1 * ddx2;
  const g = (sx * ddy2 - sy * ddx2) / det;
  const ph = (ddx1 * sy - ddy1 * sx) / det;

  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + ph * x3;
  const c = x0;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + ph * y3;
  const f = y0;

  // CSS matrix3d (column-major), with source pre-scaled by 1/w, 1/h
  return `matrix3d(${a/w},${d/w},0,${g/w},${b/h},${e/h},0,${ph/h},0,0,1,0,${c},${f},0,1)`;
}

/**
 * Can I Fish This?: the monitor (turned a little to the left) and a phone on a
 * stand beside it, each playing a recording of the site warped onto its screen.
 */
export const DesktopDisplay: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const phoneScreenRef = useRef<HTMLDivElement>(null);

  // Warp each recording onto its (angled) screen outline.
  const warpScreen = useCallback((width: number, h: number) => {
    const screen = screenRef.current;
    const phoneScreen = phoneScreenRef.current;
    if (!screen || !phoneScreen) return;
    const pw = width * (1 - MONITOR_SHARE);
    phoneScreen.style.transform = computeWarpMatrix(pw, h, PHONE_WARP.map(([x, y]) => [x * pw, y * h]));
    const w = width * MONITOR_SHARE;
    screen.style.transform = computeWarpMatrix(w, h, MONITOR_WARP.map(([x, y]) => [x * w, y * h]));
  }, []);

  useContainFit(containerRef, contentRef, ASPECT, warpScreen);

  return (
    <div
      ref={containerRef}
      data-scroll
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible'
      }}
    >
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          aspectRatio: `${MONITOR_WIDTH + PHONE_WIDTH} / ${ART_HEIGHT}`,
          overflow: 'visible'
        }}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${MONITOR_SHARE * 100}%` }}>
          <ArtLayer layer="foreground" src={`${ART}/desktop-colored.svg`} style={{ zIndex: 3 }} />
          <ArtLayer layer="background" src={`${ART}/desktop-outline.svg`} style={{ zIndex: 1 }} />
          {/* Recording of canifishthis.ca, warped onto the monitor and clipped to its screen */}
          <div className="splash-layer computer-screen" style={{ opacity: 0, position: 'absolute', inset: 0, clipPath: MONITOR_CLIP, zIndex: 2147483647 }}>
            <div ref={screenRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transformOrigin: '0 0' }}>
              <Recording view="desktop" />
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${(1 - MONITOR_SHARE) * 100}%` }}>
          <ArtLayer layer="foreground" src={`${ART}/phone-stand-colored.svg`} style={{ zIndex: 3 }} />
          <ArtLayer layer="background" src={`${ART}/phone-stand-outline.svg`} style={{ zIndex: 1 }} />
          <div className="splash-layer computer-screen" style={{ opacity: 0, position: 'absolute', inset: 0, clipPath: PHONE_CLIP, zIndex: 2147483647 }}>
            <div ref={phoneScreenRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transformOrigin: '0 0' }}>
              <Recording view="mobile" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
