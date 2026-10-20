import React from 'react';

export interface VintageCarDisplayProps {
  className?: string;
  forceHover?: boolean;
}

export const VintageCarDisplay: React.FC<VintageCarDisplayProps> = ({ 
  className = '',
  forceHover
}) => {
  const effectiveForceHover = forceHover ?? false;
  return (
    <div data-vintage-car className={className} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <div style={{ width: 1000, height: 600, maxWidth: '100%', maxHeight: '100%', position: 'relative' }}>
        <img
          src="/assets/projects/a40-austin/colored.webp"
          alt=""
          className="foreground-layer"
          loading="lazy"
          style={{ opacity: effectiveForceHover ? 1 : 0, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <img
          src="/assets/projects/a40-austin/outline.webp"
          alt=""
          className="background-layer"
          loading="lazy"
          style={{ opacity: effectiveForceHover ? 0 : 1, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
};
