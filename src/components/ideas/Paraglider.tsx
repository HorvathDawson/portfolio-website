import React from 'react';

/** Where the lines leave the canopy's lower edge; they meet at the pilot. */
const LINE_ENDS: [number, number][] = [
  [12, 50], [24, 36], [40, 30], [60, 28.5], [80, 30], [96, 36], [108, 50],
];

/**
 * A paraglider silhouette for the parallax header (?ideas): flies its own
 * layer between the mountains, crossing the sky with a slow rise and fall.
 */
export const Paraglider: React.FC = () => (
  <div className="glider-path">
    <div className="glider-bob">
      <svg className="glider" viewBox="0 0 120 112" aria-hidden="true" focusable="false">
        {/* Arched wing, seen from in front: thick in the middle, curling down at the tips */}
        <path d="M5 50 C10 12 110 12 115 50 C114 52 111 52 109 50 C101 24 19 24 11 50 C9 52 6 52 5 50 Z" />
        <g className="glider-lines">
          {LINE_ENDS.map(([x, y]) => (
            <path key={x} d={`M${x} ${y} L${x < 60 ? 58 : x > 60 ? 62 : 60} 94`} />
          ))}
        </g>
        {/* Pilot sitting in the harness */}
        <circle cx="60" cy="92" r="3.4" />
        <path d="M54 95 C53 103 58 107 66 106 L70 102 C65 101 63 99 63 95 Z" />
        <path className="glider-legs" d="M66 104 L74 107" />
      </svg>
    </div>
  </div>
);
