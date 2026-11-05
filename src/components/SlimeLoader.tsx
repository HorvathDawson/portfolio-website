import React from 'react';

interface SlimeLoaderProps {
  /** Rendered width and height in px. */
  size?: number;
  /** Read out to screen readers. */
  label?: string;
  className?: string;
}

/**
 * Loading icon: a slime-mould network growing over a sphere
 * (scripts/slime_loader.py). Reduced motion gets the grown network, still.
 */
export const SlimeLoader: React.FC<SlimeLoaderProps> = ({ size = 96, label = 'Loading…', className }) => (
  <span className={['slime-loader', className].filter(Boolean).join(' ')} role="status">
    <picture>
      <source srcSet="/assets/loader/slime-static.svg" media="(prefers-reduced-motion: reduce)" />
      <img src="/assets/loader/slime.svg" width={size} height={size} alt="" />
    </picture>
    <span className="sr-only">{label}</span>
  </span>
);

/** Full-screen version for route chunks that are still loading. */
export const PageLoader: React.FC = () => (
  <div className="page-loader">
    <SlimeLoader size={120} />
  </div>
);
