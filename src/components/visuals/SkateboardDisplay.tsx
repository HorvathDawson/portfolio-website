import React from 'react';

export interface SkateboardDisplayProps {
  className?: string;
  forceHover?: boolean;
}

export const SkateboardDisplay: React.FC<SkateboardDisplayProps> = ({ 
  className = '',
  forceHover
}) => {
  const effectiveForceHover = forceHover ?? false;
  return (
    <div data-skateboard-display className={className} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <div style={{ width: 900, height: 600, maxWidth: '100%', maxHeight: '100%', position: 'relative' }}>
        <img
          src="/assets/projects/electric-skateboard/colored.webp"
          alt=""
          className="foreground-layer"
          loading="lazy"
          style={{ opacity: effectiveForceHover ? 1 : 0, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <img
          src="/assets/projects/electric-skateboard/outline.svg"
          alt=""
          className="background-layer"
          loading="lazy"
          style={{ opacity: effectiveForceHover ? 0 : 1, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
};
