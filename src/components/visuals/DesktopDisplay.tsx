import React, { useRef, useEffect } from 'react';

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

export interface DesktopDisplayProps {
  className?: string;
  forceHover?: boolean;
}

export const DesktopDisplay: React.FC<DesktopDisplayProps> = ({
  className = '',
  forceHover
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const effectiveForceHover = forceHover ?? false;

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const updateSize = () => {
      if (!container || !content) return;
      const parent = container.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const parentWidth = parentRect.width;
      const parentHeight = parentRect.height;
      if (parentWidth === 0 || parentHeight === 0) return;

      const targetAspectRatio = 354.24 / 294.66;
      const parentAspectRatio = parentWidth / parentHeight;
      let width, height;

      if (parentAspectRatio > targetAspectRatio) {
        height = parentHeight;
        width = height * targetAspectRatio;
      } else {
        width = parentWidth;
        height = width / targetAspectRatio;
      }
      content.style.width = `${width}px`;
      content.style.height = `${height}px`;

      // Update screen warp transform based on actual rendered size
      const screenEl = screenRef.current;
      if (screenEl) {
        const sw = width;
        const sh = height;

        // Destination corners: [topLeft, topRight, bottomRight, bottomLeft]
        // Defined as pixel coords within the screen div's own space.
        // Adjust these to match the monitor's screen shape in the SVG.
        const dst: [number, number][] = [
          [sw * 0.01, sh * 0.18],    // top-left
          [sw * 0.97, sh * 0.05],            // top-right (narrower → facing left)
          [sw * 0.99, sh * 0.92],    // bottom-right
          [sw * 0, sh *0.85],                   // bottom-left (anchor)
        ];

        screenEl.style.transform = computeWarpMatrix(sw, sh, dst);
      }
    };

    // ResizeObserver also fires once on observe, so this sets the initial size.
    const observer = new ResizeObserver(updateSize);
    if (container.parentElement) observer.observe(container.parentElement);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      data-desktop-display
      className={className}
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
        <img
          src="/assets/projects/bc-fishing-regulations/desktop-colored.svg"
          alt=""
          className="foreground-layer"
          loading="lazy"
          style={{
            opacity: effectiveForceHover ? 1 : 0,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            zIndex: 3
          }}
        />
        <img
          src="/assets/projects/bc-fishing-regulations/desktop-outline.svg"
          alt=""
          className="background-layer"
          loading="lazy"
          style={{
            opacity: effectiveForceHover ? 0 : 1,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            zIndex: 1
          }}
        />
        {/* Screen area: demo recording of canifishthis.ca, warped onto the monitor */}
        <div
          ref={screenRef}
          className="splash-layer computer-screen"
          style={{
            opacity: effectiveForceHover ? 1 : 0,
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
          <img
            src="/assets/projects/bc-fishing-regulations/website-demo.webp"
            alt=""
            loading="lazy"
            decoding="async"
            style={{ display: 'block', width: '100%', height: '100%', objectFit: 'fill' }}
          />
        </div>
      </div>
    </div>
  );
};
