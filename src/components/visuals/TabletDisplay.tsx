import React from 'react';
import { LayeredArt } from './LayeredArt';

export const TabletDisplay: React.FC = () => (
  <LayeredArt
    width={720}
    height={1040}
    layers={[
      { layer: 'foreground', src: '/assets/resume/colored.webp' },
      { layer: 'background', src: '/assets/resume/outline.webp' },
    ]}
  >
    {/* Resume page, laid flat onto the tablet screen */}
    <div
      className="splash-layer"
      style={{
        opacity: 0,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotateX(54deg) rotate(44.9deg)',
        aspectRatio: '1 / 1.4142',
        width: '50.6%',
        height: 'auto',
        zIndex: 2147483647,
      }}
    >
      <img
        src="/assets/resume/resume.webp"
        alt=""
        loading="lazy"
        decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {/* Purple tint over the page */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--purple)', opacity: 0.5 }} />
    </div>
  </LayeredArt>
);
