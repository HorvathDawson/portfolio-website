import React from 'react';
import { REDUCED_MOTION_QUERY } from '../../utils/reducedMotion';

/**
 * An animated WebP that swaps to its static `*-still.webp` (written by
 * scripts/make-stills.py) when the visitor prefers reduced motion.
 * `display: contents` keeps <picture> out of layout, so the <img> sizes and
 * positions exactly as it would on its own.
 */
export const AnimatedImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement> & { src: string }> = ({ src, alt = '', ...img }) => (
  <picture style={{ display: 'contents' }}>
    <source media={REDUCED_MOTION_QUERY} srcSet={src.replace(/\.webp$/, '-still.webp')} />
    <img src={src} alt={alt} {...img} />
  </picture>
);
