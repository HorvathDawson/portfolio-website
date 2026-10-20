import React from 'react';

export interface PrinterDisplayProps {
  className?: string;
  forceHover?: boolean;
}

export const PrinterDisplay: React.FC<PrinterDisplayProps> = ({ 
  className = '',
  forceHover
}) => {
  const effectiveForceHover = forceHover ?? false;
  return (
    <div data-printer-display className={className} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <div style={{ width: 1000, height: 700, maxWidth: '100%', maxHeight: '100%', position: 'relative' }}>
        <img
          src="/assets/projects/3d-printer/colored.webp"
          alt=""
          className="foreground-layer"
          loading="lazy"
          style={{ opacity: effectiveForceHover ? 1 : 0, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
        <img
          src="/assets/projects/3d-printer/outline.webp"
          alt=""
          className="background-layer"
          loading="lazy"
          style={{ opacity: effectiveForceHover ? 0 : 1, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
};
