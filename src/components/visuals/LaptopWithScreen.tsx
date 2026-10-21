import React, { useRef } from 'react';
import { ArtLayer } from './ArtLayer';
import { useContainFit } from '../../utils/useContainFit';
import { lidAngle } from './laptopLid';

const ART = '/assets/projects/self-driving-car';

/**
 * Laptop whose lid (`data-scroll`) is rotated open by the card's scroll
 * animation: closed on the keyboard (its back showing) when the card enters,
 * upright with the simulation playing once it reaches the middle of the screen.
 */
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
          // No perspective or preserve-3d here: Safari would then sort the lid
          // and keyboard by depth instead of z-index. The lid carries its own
          // perspective instead (see lidAngle).
          overflow: 'visible'
        }}
      >
        {/* Lid, hinged at its bottom edge; the card's scroll animation rotates it open */}
        <div
          data-scroll
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: '-30%',
            transformOrigin: '50% 100%',
            transformStyle: 'preserve-3d',
            // Closed until the scroll animation takes over.
            transform: lidAngle(90),
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
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Screen side */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
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
            {/* Back of the lid, seen while it is closed or nearly so */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateX(180deg)' }}>
              <ArtLayer layer="foreground" src={`${ART}/lid-back-colored.svg`} style={{ zIndex: 3 }} />
              <ArtLayer layer="background" src={`${ART}/lid-back-outline.svg`} style={{ zIndex: 1 }} />
            </div>
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
