import React from 'react';

export interface MotorcyclePartsProps {
  className?: string;
  forceHover?: boolean;
}

export const MotorcycleParts: React.FC<MotorcyclePartsProps> = ({ 
  className = '',
  forceHover
}) => {
  const effectiveForceHover = forceHover ?? false;

  // Hover behaviour is driven by BaseProjectItem, which toggles the
  // foreground/background/splash layer opacities directly.

  return (
    <div 
      data-motorcycle-parts
      className={className}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <div style={{ width: 900, height: 700, maxWidth: '100%', maxHeight: '100%', position: 'relative' }}>
        {/* Section view animation - shows on hover */}
        <img
          src="/assets/projects/buell-lightning/engine/section-view.webp"
          alt="Buell motorcycle engine section view"
          className="foreground-layer"
          loading="lazy"
          style={{ 
            opacity: effectiveForceHover ? 1 : 0,
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            zIndex: 5
          }}
        />
      
      {/* Static engine case - shows by default */}
      <img
        src="/assets/projects/buell-lightning/engine/case.webp"
        alt="Buell motorcycle engine case"
        className="background-layer"
        loading="lazy"
        style={{ 
          opacity: effectiveForceHover ? 0 : 1,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: 4
        }}
      />
      
      {/* Left cylinder - shows by default */}
      <img
        src="/assets/projects/buell-lightning/engine/left-cylinder.webp"
        alt="Buell motorcycle left cylinder"
        className="background-layer"
        loading="lazy"
        style={{ 
          opacity: effectiveForceHover ? 0 : 1,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: 4
        }}
      />
      
      {/* Exploding parts - animated by scroll */}
      <img
        src="/assets/projects/buell-lightning/engine/cylinder-barrel.webp"
        alt="Buell motorcycle cylinder barrel"
        data-part="1"
        className="background-layer"
        loading="lazy"
        style={{ 
          opacity: effectiveForceHover ? 0 : 1,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: 4
        }}
      />
      <img
        src="/assets/projects/buell-lightning/engine/rocker-box.webp"
        alt="Buell motorcycle rocker box"
        data-part="2"
        className="background-layer"
        loading="lazy"
        style={{ 
          opacity: effectiveForceHover ? 0 : 1,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: 4
        }}
      />
      <img
        src="/assets/projects/buell-lightning/engine/rocker-box-top.webp"
        alt="Buell motorcycle rocker box top"
        data-part="3"
        className="background-layer"
        loading="lazy"
        style={{ 
          opacity: effectiveForceHover ? 0 : 1,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: 4
        }}
      />
      <img
        src="/assets/projects/buell-lightning/engine/push-rods.webp"
        alt="Buell motorcycle push rods"
        data-part="4"
        className="background-layer"
        loading="lazy"
        style={{ 
          opacity: effectiveForceHover ? 0 : 1,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: 6
        }}
      />
      
      {/* FIX APPLIED: Switched from <img> to <div> with mask-image.
          This allows backgroundColor to act as the fill color for the SVG shape.
      */}
      <div
        role="img"
        aria-label="Buell motorcycle push rods bg"
        data-part="4"
        className="background-layer"
        style={{ 
          opacity: effectiveForceHover ? 0 : 1,
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 5,
          // The background color becomes the "fill"
          backgroundColor: 'var(--dark-blue)',
          // The mask cuts the div into the shape of the SVG
          maskImage: 'url("/assets/projects/buell-lightning/engine/push-rods-mask.svg")',
          WebkitMaskImage: 'url("/assets/projects/buell-lightning/engine/push-rods-mask.svg")',
          maskSize: 'contain',
          WebkitMaskSize: 'contain',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center'
        }}
      />
      </div>
    </div>
  );
};