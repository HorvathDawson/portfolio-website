import React, { useLayoutEffect, useRef } from 'react';

/**
 * The fisher's line: hangs from the rod tip in the camp scene straight down
 * the side of the page to just above the contact form, with a lure and a
 * curious fish at the end. Positioned from the rod tip, so it follows the
 * scene at every width.
 */
export const FishingLine: React.FC = () => {
  const lineRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const line = lineRef.current;
    const host = line?.offsetParent as HTMLElement | null;
    if (!line || !host) return;
    const place = () => {
      const tip = document.querySelector('.camp-rod-tip')?.getBoundingClientRect();
      const end = document.querySelector('.contact-section')?.getBoundingClientRect();
      if (!tip || !end) return;
      const origin = host.getBoundingClientRect();
      const top = tip.top + tip.height / 2 - origin.top;
      line.style.left = `${tip.left + tip.width / 2 - origin.left}px`;
      line.style.top = `${top}px`;
      line.style.height = `${Math.max(0, end.top - origin.top - 90 - top)}px`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(host);
    window.addEventListener('resize', place);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
    };
  }, []);

  return (
    <div className="fishing-line" ref={lineRef} aria-hidden="true">
      <svg className="fishing-tackle" viewBox="0 0 120 70">
        {/* Swivel, spoon lure and hook */}
        <circle className="camp-line" cx="60" cy="3" r="2.5" />
        <path className="camp-line camp-solid" d="M60 6 C52 14 52 30 60 38 C68 30 68 14 60 6 Z" />
        <path className="camp-line" d="M60 38 L60 48 C60 56 52 56 51 50 M51 50 L54 48" />
        {/* A fish nosing up to it */}
        <g className="fishing-fish">
          <path className="camp-line camp-solid" d="M44 46 C34 36 14 36 6 46 C14 56 34 56 44 46 Z M8 46 L0 39 L0 53 Z" />
          <circle cx="36" cy="44" r="1.6" fill="currentColor" />
          <path className="camp-line camp-faint" d="M26 40 C29 44 29 48 26 52" />
        </g>
      </svg>
    </div>
  );
};
