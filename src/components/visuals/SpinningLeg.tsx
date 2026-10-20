import React from 'react';
import bodySprite from '/assets/projects/opensim2real/leg-colored-spritesheet.webp';
import edgeSprite from '/assets/projects/opensim2real/leg-outline-spritesheet.webp';
import './SpinningLeg.css';

/** Rotating OpenSim2Real leg, drawn from two sprite sheets (outline at rest, colour on hover). */
export const SpinningLeg: React.FC = () => (
  // Fills the card media height and centres the leg at its own aspect ratio.
  <div style={{ width: 'auto', height: '100%', maxHeight: '100%', aspectRatio: '637/824', margin: '0 auto', position: 'relative' }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}
    >
      {/* Largest 637:824 box that fits the wrapper */}
      <div style={{ position: 'relative', aspectRatio: '637 / 824', width: '100%', height: 'auto', maxHeight: '100%', maxWidth: '100%' }}>
        <div
          className="spinning-leg-layer background-layer"
          style={{ backgroundImage: `url(${edgeSprite})`, opacity: 1, zIndex: 1 }}
        />
        <div
          className="spinning-leg-layer foreground-layer"
          style={{ backgroundImage: `url(${bodySprite})`, opacity: 0, zIndex: 2, pointerEvents: 'none' }}
        />
      </div>
    </div>
  </div>
);
