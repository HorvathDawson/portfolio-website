import React, { useEffect, useRef } from 'react';
import { parallaxLayers } from '../data/content';
import { onScrollMotion } from '../utils/scrollFrame';

// CONFIGURATION
const MAX_PARALLAX_LAG = 0.85;

const sortedLayers = [...parallaxLayers].sort((a, b) => {
  const depthA = Number(a.id.replace(/\D/g, ''));
  const depthB = Number(b.id.replace(/\D/g, ''));
  return depthA - depthB;
});

const maxDepthIndex = sortedLayers.length - 1;

// Back layers move slower than the foreground; the foreground (last) layer is static.
const layerSpeeds = sortedLayers.map((_, index) =>
  index === maxDepthIndex ? 0 : (1 - index / maxDepthIndex) * MAX_PARALLAX_LAG
);

// --- STYLES ---

const outerWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  overflow: 'hidden',
  zIndex: 0,
  backgroundImage: 'url("/assets/header/foreground-tile.webp")',
  backgroundRepeat: 'repeat',
  backgroundPosition: 'center',
};

const innerHeaderStyle: React.CSSProperties = {
  position: 'relative',
  width: 'auto',
  height: 'auto',
};

const imgStyle: React.CSSProperties = {
  display: 'block',
  maxHeight: '100vh',
  maxWidth: '100%',
  width: 'auto',
  height: 'auto',
  objectFit: 'cover',
};

export const ParallaxHeader: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Only runs on frames where the page scrolled, and only while the header
    // is near the viewport (instead of a permanent rAF loop).
    return onScrollMotion(
      container,
      () => {
        const scrollY = window.scrollY;
        layerRefs.current.forEach((layer, index) => {
          const speed = layerSpeeds[index];
          if (layer && speed !== 0) {
            layer.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`;
          }
        });
      },
      () => layerRefs.current.forEach((layer) => { if (layer) layer.style.transform = ''; }),
    );
  }, []);

  return (
    <div className="parallax-header-container" ref={containerRef} style={outerWrapperStyle}>
      <div style={innerHeaderStyle}>
        {/* Sky layer: day/night colour cycle (see .parallax-sky in App.css) */}
        <div className="parallax-sky" />

        {sortedLayers.map((layer, index) => {
          const isForeground = index === maxDepthIndex;

          const layerStyle: React.CSSProperties = {
            position: isForeground ? 'relative' : 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: index,
            willChange: isForeground ? undefined : 'transform',
            pointerEvents: 'none',
          };

          return (
            <div
              key={layer.id}
              ref={(el) => {
                layerRefs.current[index] = el;
              }}
              style={layerStyle}
            >
              <img src={layer.src} alt="" style={imgStyle} decoding="async" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ParallaxHeader;
