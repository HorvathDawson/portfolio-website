import React, { useState } from 'react';
import { LayeredArt } from '../components/visuals/LayeredArt';
import type { Car } from './cars';

/**
 * A car's outline + coloured art pair (the project-card layers). The
 * outline shows at rest; the parent cross-fades to the coloured layer in CSS
 * (see garage.css). If the art hasn't been drawn yet, a labelled placeholder
 * takes its place.
 */
export const CarArt: React.FC<{ car: Car }> = ({ car }) => {
  const [missing, setMissing] = useState(false);
  if (missing) {
    return (
      <div className="garage-art garage-art--missing" aria-hidden="true">
        <span>{car.model}</span>
        <small>art coming soon</small>
      </div>
    );
  }
  return (
    <LayeredArt
      className="garage-art"
      width={car.art.width}
      height={car.art.height}
      aria-hidden="true"
      layers={[
        { layer: 'foreground', src: car.art.colored },
        { layer: 'background', src: car.art.outline, onError: () => setMissing(true) },
      ]}
    />
  );
};

/** Small outline thumbnail for the car switcher. */
export const CarThumb: React.FC<{ car: Car }> = ({ car }) => {
  const [missing, setMissing] = useState(false);
  return missing ? (
    <span className="car-thumb car-thumb--missing" aria-hidden="true">{car.model}</span>
  ) : (
    <img className="car-thumb" src={car.art.outline} alt="" onError={() => setMissing(true)} />
  );
};
