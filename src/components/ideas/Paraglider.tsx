import React from 'react';

/** Lines from the canopy's trailing edge down to the pilot. */
const LINE_ENDS = [12, 30, 48, 72, 90, 108];

/**
 * A paraglider silhouette for the parallax header (?ideas): flies its own
 * layer between the mountains, crossing the sky with a slow rise and fall.
 */
export const Paraglider: React.FC = () => (
  <div className="glider-path">
    <div className="glider-bob">
      <svg className="glider" viewBox="0 0 120 80" aria-hidden="true" focusable="false">
        <path d="M4 27 C18 6 102 6 116 27 C110 24 102 22 96 23 C80 18 40 18 24 23 C18 22 10 24 4 27 Z" />
        <g className="glider-lines">
          {LINE_ENDS.map((x) => (
            <path key={x} d={`M${x} ${x < 24 || x > 96 ? 26 : 22} L60 61`} />
          ))}
        </g>
        <circle cx="60" cy="58" r="3.4" />
        <path d="M54 61 C54 70 66 70 66 61 Z" />
        <path className="glider-legs" d="M60 66 L71 70" />
      </svg>
    </div>
  </div>
);
