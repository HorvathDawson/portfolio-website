import React from 'react';

// Import your Sprite Sheets
import bodySprite from '/assets/projects/opensim2real/leg-colored-spritesheet.webp';
import edgeSprite from '/assets/projects/opensim2real/leg-outline-spritesheet.webp';

export interface SpinningLegProps {
  className?: string;
  forceHover?: boolean;
}

export const SpinningLeg: React.FC<SpinningLegProps> = ({
  className = '',
  forceHover
}) => {
  const showBody = forceHover ?? false;

  // --- CONFIGURATION ---
  const FRAMES = 24;
  const WIDTH = 637;
  const HEIGHT = 824;
  const DURATION = '2s';
  // ---------------------

  // Math: 
  // 1. We scale the strip so it is (Frames * 100)% of the container width.
  // 2. We force height to 100% of the container.
  const bgSize = `${FRAMES * 100}% 100%`;
  const stepCount = FRAMES - 1;
  const animName = `spin-${FRAMES}`;

  return (
    // 1. OUTER WRAPPER:
    // This fills the parent (project-card-media) completely.
    // It uses Flexbox to CENTER the actual leg animation in the middle of the available space.
    <div style={
      {
        width: 'auto',
        height: '100%',
        maxHeight: '100%',
        aspectRatio: '637/824',
        margin: '0 auto',
        position: 'relative'
      }
    }>
      <div
        className={className}
        data-spinning-leg-wrapper
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
        <style>{`
          @keyframes ${animName} {
            from { background-position: 0% 0; }
            to { background-position: 100% 0; }
          }
          .spinning-leg-layer {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            background-repeat: no-repeat;
            background-size: ${bgSize};
            animation: ${animName} ${DURATION} steps(${stepCount}) infinite;
            
            image-rendering: -webkit-optimize-contrast; 
            image-rendering: crisp-edges;
          }
        `}</style>

        {/* 2. INNER CONTAINER (The Leg):
            - Enforces Aspect Ratio (637/824).
            - max-width/max-height: 100% prevents it from overflowing the wrapper.
            - height/width: auto allows the aspect-ratio to drive the dimensions.
        */}
        <div
          data-spinning-leg-inner
          style={{
            position: 'relative',
            aspectRatio: `${WIDTH} / ${HEIGHT}`,

            // These 3 lines create the "contain" logic:
            // Try to fill width, but stop if height hits the edge first (and vice versa)
            width: '100%',
            height: 'auto',
            maxHeight: '100%',
            maxWidth: '100%'
          }}
        >
          {/* Background Layer (Edge) */}
          <div
            className="spinning-leg-layer background-layer"
            style={{
              backgroundImage: `url(${edgeSprite})`,
              opacity: showBody ? 0 : 1,
              zIndex: 1,
              transition: 'opacity 0.2s',
            }}
          />

          {/* Foreground Layer (Body) */}
          <div
            className="spinning-leg-layer foreground-layer"
            style={{
              backgroundImage: `url(${bodySprite})`,
              opacity: showBody ? 1 : 0,
              zIndex: 2,
              transition: 'opacity 0.2s',
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>
    </div>
  );
};