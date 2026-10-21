import React, { useEffect, useRef, useState } from 'react';
import { HEADER_SIZES, headerSrcSet, parallaxLayers } from '../data/content';
import { onScrollMotion } from '../utils/scrollFrame';
import { Paraglider } from './ideas/Paraglider';
import { showIdeas } from '../utils/ideas';

const MAX_PARALLAX_LAG = 0.85;

/** Reveal anyway if the layers take longer than this to decode. */
const REVEAL_TIMEOUT_MS = 4000;

const lastLayer = parallaxLayers.length - 1;

// Back layers move slower than the foreground; the foreground (last) layer is static.
const speedAt = (depth: number) => (depth >= lastLayer ? 0 : (1 - depth / lastLayer) * MAX_PARALLAX_LAG);
const layerSpeeds = parallaxLayers.map((_, index) => speedAt(index));

/** The paraglider (?ideas) flies between layers 1 (the big mountain) and 2. */
const GLIDER_DEPTH = 1.5;

/*
 * The frame is sized by CSS (3:2, see .parallax-frame) and shows a blurred
 * placeholder of the whole scene until every layer has decoded; then the
 * layers fade in together. If that takes too long the layers are revealed
 * early, still over the placeholder, so missing layers never leave a hole.
 * index.html renders the same empty frame before the app loads, so the
 * placeholder is on screen from the first paint.
 */
type LoadState = 'loading' | 'revealed' | 'complete';

export const ParallaxHeader: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imgRefs = useRef<(HTMLImageElement | null)[]>([]);
  const gliderRef = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [ideas] = useState(showIdeas);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => setLoadState((s) => (s === 'loading' ? 'revealed' : s)), REVEAL_TIMEOUT_MS);

    // decode() also waits for the download; a failed layer shouldn't block the rest.
    Promise.all(imgRefs.current.map((img) => img?.decode().catch(() => {}))).then(() => {
      if (cancelled) return;
      clearTimeout(timer);
      setLoadState('complete');
    });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

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
        if (gliderRef.current) gliderRef.current.style.transform = `translate3d(0, ${scrollY * speedAt(GLIDER_DEPTH)}px, 0)`;
      },
      () => [...layerRefs.current, gliderRef.current].forEach((layer) => { if (layer) layer.style.transform = ''; }),
    );
  }, []);

  return (
    <div className="parallax-header" ref={containerRef}>
      <div
        className={[
          'parallax-frame',
          loadState !== 'loading' && 'is-revealed',
          loadState === 'complete' && 'is-complete',
        ].filter(Boolean).join(' ')}
      >
        {/* Sky layer: day/night colour cycle (see .parallax-sky in App.css) */}
        <div className="parallax-sky" />

        {parallaxLayers.map((src, index) => (
          <div
            key={src}
            ref={(el) => {
              layerRefs.current[index] = el;
            }}
            className="parallax-layer"
            style={{ zIndex: index * 10, willChange: layerSpeeds[index] ? 'transform' : undefined }}
          >
            <img
              ref={(el) => {
                imgRefs.current[index] = el;
              }}
              src={src}
              srcSet={headerSrcSet(src)}
              sizes={HEADER_SIZES}
              alt=""
              fetchPriority="high"
            />
          </div>
        ))}

        {ideas && (
          <div ref={gliderRef} className="parallax-layer" style={{ zIndex: GLIDER_DEPTH * 10, willChange: 'transform' }}>
            <Paraglider />
          </div>
        )}
      </div>
      <span className="sr-only" role="status" aria-live="polite">
        {loadState === 'complete' ? 'Content loaded' : 'Loading portfolio…'}
      </span>
    </div>
  );
};
