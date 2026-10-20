import React from 'react';
import { ArtLayer } from './ArtLayer';

const ART = '/assets/projects/fume-extractor';

export const FumeExtractorArm: React.FC = () => (
  <div
    className="fume-extractor-arm"
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
      style={{
        width: 'auto',
        height: '100%',
        aspectRatio: '317 / 327',
        position: 'relative',
        maxWidth: '100%',
        maxHeight: '100%',
      }}
    >
      <ArtLayer layer="foreground" src={`${ART}/arm-colored.webp`} alt="Fume extractor arm" style={{ zIndex: 5 }} />
      <ArtLayer layer="background" src={`${ART}/arm-outline.webp`} alt="Fume extractor arm outline" style={{ zIndex: 4 }} />
      <ArtLayer layer="splash" src={`${ART}/glow.webp`} alt="Fume extractor glow" style={{ zIndex: 4 }} />
      <ArtLayer
        layer="splash"
        src={`${ART}/fumes.webp`}
        animated
        alt="Fume animation"
        style={{
          position: 'relative',
          width: '20%',
          height: '20%',
          minHeight: 0,
          top: '65%',
          left: '90%',
          transform: 'translate(-50%, -50%) rotate(80deg)',
          zIndex: 6
        }}
      />
    </div>
  </div>
);
