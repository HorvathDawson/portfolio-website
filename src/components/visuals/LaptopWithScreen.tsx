import React, { useRef, useEffect } from 'react';

export interface LaptopWithScreenProps {
  className?: string;
  forceHover?: boolean;
}

export const LaptopWithScreen: React.FC<LaptopWithScreenProps> = ({
  className = '',
  forceHover
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const effectiveForceHover = forceHover ?? false;

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const updateSize = () => {
      if (!container || !content) return;
      const parent = container.parentElement;
      if (!parent) return;

      const parentRect = parent.getBoundingClientRect();
      const parentWidth = parentRect.width;
      const parentHeight = parentRect.height;
      if (parentWidth === 0 || parentHeight === 0) return;

      const targetAspectRatio = 1000 / 700; 
      const parentAspectRatio = parentWidth / parentHeight;
      let width, height;

      if (parentAspectRatio > targetAspectRatio) {
        height = parentHeight;
        width = height * targetAspectRatio;
      } else {
        width = parentWidth;
        height = width / targetAspectRatio;
      }
      content.style.width = `${width}px`;
      content.style.height = `${height}px`;
    };

    // ResizeObserver also fires once on observe, so this sets the initial size.
    const observer = new ResizeObserver(updateSize);
    if (container.parentElement) observer.observe(container.parentElement);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      data-laptop-with-screen
      className={className}
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
        {/* === SCREEN CONTAINER === */}
        <div
          data-laptop-screen
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: '-30%',
            transformOrigin: '50% 100%', 
            transformStyle: 'preserve-3d', // Keep this internal 3D for the screen itself
            // FORCE VISIBILITY: High z-index ensures it sits on top of the keyboard 
            // and the background, regardless of rotation angle.
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
            <img src="/assets/projects/self-driving-car/computer-colored.svg" alt="" className="foreground-layer" loading="lazy" style={{ opacity: effectiveForceHover ? 1 : 0, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 3 }} />
            <img src="/assets/projects/self-driving-car/computer-outline.svg" alt="" className="background-layer" loading="lazy" style={{ opacity: effectiveForceHover ? 0 : 1, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1 }} />
            <img src="/assets/projects/self-driving-car/simulation-demo.webp" alt="" className="splash-layer computer-screen" loading="lazy" decoding="async" style={{ opacity: effectiveForceHover ? 1 : 0, position: 'absolute', top: '10%', left: '4%', width: '92%', height: '84%', objectFit: 'cover', objectPosition: 'center', zIndex: 6 }} />
          </div>
        </div>

        {/* === KEYBOARD CONTAINER === */}
        <div
          data-laptop-keyboard
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: '70%',
            transformOrigin: '50% 50%',
            // Lower z-index means it will always be behind the screen
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
             <img src="/assets/projects/self-driving-car/keyboard-colored.svg" alt="" className="foreground-layer" loading="lazy" style={{ opacity: effectiveForceHover ? 1 : 0, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 10 }} />
             <img src="/assets/projects/self-driving-car/keyboard-outline.svg" alt="" className="background-layer" loading="lazy" style={{ opacity: effectiveForceHover ? 0 : 1, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 10 }} />
          </div>
        </div>
      </div>
    </div>
  );
};