import React from 'react';
import { ArtLayer } from './ArtLayer';

export type LayerSpec = React.ComponentProps<typeof ArtLayer>;

interface LayeredArtProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Design-canvas size in px; the art scales down to fit the card. */
  width: number;
  height: number;
  layers?: LayerSpec[];
}

/** A fixed-size art canvas, shrunk to fit the card media frame, holding stacked ArtLayers. */
export const LayeredArt: React.FC<LayeredArtProps> = ({ width, height, layers = [], children, ...outer }) => (
  <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} {...outer}>
    <div style={{ width, height, maxWidth: '100%', maxHeight: '100%', position: 'relative' }}>
      {layers.map((l) => <ArtLayer key={l.src} {...l} />)}
      {children}
    </div>
  </div>
);
