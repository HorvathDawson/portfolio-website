import React from 'react';

/**
 * Card art is drawn as stacked layers that ProjectCard cross-fades on hover:
 * `background` (line art) is shown at rest, `foreground` (coloured art) and
 * `splash` (glow, screens) are shown on hover. On stacked layouts CSS forces
 * the hover state on.
 */
type ArtLayerKind = 'background' | 'foreground' | 'splash';

interface ArtLayerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  layer: ArtLayerKind;
}

const restOpacity: Record<ArtLayerKind, number> = {
  background: 1,
  foreground: 0,
  splash: 0,
};

export const ArtLayer: React.FC<ArtLayerProps> = ({ layer, alt = '', style, className, ...img }) => (
  <img
    alt={alt}
    className={[`${layer}-layer`, className].filter(Boolean).join(' ')}
    loading="lazy"
    decoding="async"
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      opacity: restOpacity[layer],
      ...style,
    }}
    {...img}
  />
);
