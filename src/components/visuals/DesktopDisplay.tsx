import React, { useCallback, useRef } from 'react';
import { AnimatedImage } from './AnimatedImage';
import { ArtLayer } from './ArtLayer';
import { useContainFit } from '../../utils/useContainFit';

const ART = '/assets/projects/bc-fishing-regulations';
const ASPECT = 354.24 / 294.66;

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

export const DesktopDisplay: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);

  // Warp the screen recording onto the monitor's (angled) screen outline.
  const warpScreen = useCallback((w: number, h: number) => {
    const screen = screenRef.current;
    if (!screen) return;
    screen.style.transform = computeWarpMatrix(w, h, [
      [w * 0.01, h * 0.18], // top-left
      [w * 0.97, h * 0.05], // top-right (narrower, so the monitor faces left)
      [w * 0.99, h * 0.92], // bottom-right
      [w * 0, h * 0.85],    // bottom-left
    ]);
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
          aspectRatio: '354.24 / 294.66',
          overflow: 'visible'
        }}
      >
        <ArtLayer layer="foreground" src={`${ART}/desktop-colored.svg`} style={{ zIndex: 3 }} />
        <ArtLayer layer="background" src={`${ART}/desktop-outline.svg`} style={{ zIndex: 1 }} />
        {/* Demo recording of canifishthis.ca, warped onto the monitor */}
        <div
          ref={screenRef}
          className="splash-layer computer-screen"
          style={{
            opacity: 0,
            position: 'absolute',
            top: '-5.5%',
            left: '24%',
            width: '70%',
            height: '75%',
            transformOrigin: '0 0',
            zIndex: 2147483647
          }}
        >
          {/* An <img> (rather than a CSS background) so the animation is lazy-loaded */}
          <AnimatedImage
            src={`${ART}/website-demo.webp`}
            loading="lazy"
            decoding="async"
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill' }}
          />
        </div>
      </div>
    </div>
  );
};
