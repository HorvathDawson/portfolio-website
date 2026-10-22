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

/**
 * Where each recording goes: the screen openings' corners (top-left,
 * top-right, bottom-right, bottom-left) as fractions of each drawing, with a
 * few pixels of bezel left inside the screen's outline (a warped image's edge
 * blurs by about a pixel, which would otherwise touch the line). The monitor's
 * opening was measured from desktop-outline.svg and desktop-colored.svg; the
 * phone's is the screen line from scripts/make_device_art.py.
 */
const MONITOR_SCREEN: [number, number][] = [[0.2579, 0.1281], [0.8669, 0.0425], [0.8697, 0.6323], [0.2483, 0.6187]];
const PHONE_SCREEN: [number, number][] = [[0.2628, 0.4634], [0.6213, 0.4396], [0.6372, 0.8356], [0.2787, 0.8241]];

/** A screen recording of canifishthis.ca (scripts/record-demos.mjs), filling a warped screen. */
const Recording: React.FC<{ view: 'desktop' | 'mobile' }> = ({ view }) => (
  // An <img> (rather than a CSS background) so the animation is lazy-loaded
  <AnimatedImage
    src={`${ART}/${view}-demo.webp`}
    loading="lazy"
    decoding="async"
    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
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
    phoneScreen.style.transform = computeWarpMatrix(pw, h, PHONE_SCREEN.map(([x, y]) => [x * pw, y * h]));
    const w = width * MONITOR_SHARE;
    screen.style.transform = computeWarpMatrix(w, h, MONITOR_SCREEN.map(([x, y]) => [x * w, y * h]));
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
          {/* Recording of canifishthis.ca, warped onto the monitor */}
          <div
            ref={screenRef}
            className="splash-layer computer-screen"
            style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transformOrigin: '0 0', zIndex: 2147483647 }}
          >
            <Recording view="desktop" />
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${(1 - MONITOR_SHARE) * 100}%` }}>
          <ArtLayer layer="foreground" src={`${ART}/phone-stand-colored.svg`} style={{ zIndex: 3 }} />
          <ArtLayer layer="background" src={`${ART}/phone-stand-outline.svg`} style={{ zIndex: 1 }} />
          <div
            ref={phoneScreenRef}
            className="splash-layer computer-screen"
            style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', transformOrigin: '0 0', zIndex: 2147483647 }}
          >
            {/* Rounded like the phone's screen (the warp maps this box onto it) */}
            <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '13% / 6%' }}>
              <Recording view="mobile" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
