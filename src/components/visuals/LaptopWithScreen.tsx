import React, { useRef } from 'react';
import { ArtLayer } from './ArtLayer';
import { useContainFit } from '../../utils/useContainFit';

const ART = '/assets/projects/self-driving-car';

/** Laptop whose lid (`data-scroll`) is rotated open by the card's scroll animation. */
export const LaptopWithScreen: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useContainFit(containerRef, contentRef, 1000 / 700);

  return (
    <div
      ref={containerRef}
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
        ref={contentRef}
        style={{
          position: 'relative',
          aspectRatio: '10 / 7',
          // No preserve-3d/perspective here: the scene stays flat so layers
          // stack strictly by z-index.
          overflow: 'visible'
        }}
      >
        {/* Lid: z-index keeps it above the keyboard at any rotation */}
        <div
          data-scroll
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: '-30%',
            transformOrigin: '50% 100%',
            transformStyle: 'preserve-3d',
            zIndex: 20
          }}
        >
          <div
            style={{
              width: '75%',
              aspectRatio: '300 / 194',
              position: 'absolute',
              left: '50%',
              top: '100%',
              transform: 'translate(-50%, -100%)',
            }}
          >
            <ArtLayer layer="foreground" src={`${ART}/computer-colored.svg`} style={{ zIndex: 3 }} />
            <ArtLayer layer="background" src={`${ART}/computer-outline.svg`} style={{ zIndex: 1 }} />
            <ArtLayer
              layer="splash"
              className="computer-screen"
              src={`${ART}/simulation-demo.webp`}
              animated
              style={{ top: '10%', left: '4%', width: '92%', height: '84%', objectFit: 'cover', objectPosition: 'center', zIndex: 6 }}
            />
          </div>
        </div>

        {/* Keyboard */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: '70%',
            transformOrigin: '50% 50%',
            zIndex: 10
          }}
        >
          <div
            style={{
              width: '97%',
              aspectRatio: '300 / 61',
              position: 'absolute',
              left: '50%',
              top: '0%',
              transform: 'translate(-50%, 0%)',
              zIndex: 10
            }}
          >
            <ArtLayer layer="foreground" src={`${ART}/keyboard-colored.svg`} style={{ zIndex: 10 }} />
            <ArtLayer layer="background" src={`${ART}/keyboard-outline.svg`} style={{ zIndex: 10 }} />
          </div>
        </div>
      </div>
    </div>
  );
};
