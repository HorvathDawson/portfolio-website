import React from 'react';

/** Where the lines leave the wing's lower edge; they meet above the pilot. */
const LINE_ENDS: [number, number][] = [
  [16, 46], [28, 32], [44, 25], [62, 22], [80, 22], [96, 27], [106, 37],
];

/**
 * A paraglider silhouette for the parallax header (?ideas), seen from the
 * side and a little in front so it has a direction: it faces right, and the
 * header turns it around (mirrors it) at each end of its run.
 */
export const Paraglider: React.FC = () => (
  <div className="glider-path">
    <div className="glider-bob">
      <div className="glider-turn">
        <svg className="glider" viewBox="0 0 120 112" aria-hidden="true" focusable="false">
          {/* Wing: an arch seen from the side, its leading edge (right) deeper */}
          <path d="M10 50 C12 14 90 2 112 34 C112 38 108 40 105 37 C94 20 34 18 18 50 C16 53 11 53 10 50 Z" />
          <g className="glider-lines">
            {LINE_ENDS.map(([x, y]) => (
              <path key={x} d={`M${x} ${y} L${x < 60 ? 56 : 60} 88`} />
            ))}
          </g>
          {/* Pilot sitting back in the harness, legs forward */}
          <circle cx="57" cy="90" r="3.4" />
          <path d="M53 93 C50 101 55 105 63 104 L72 103 L72 99 L62 99 C59 99 58 96 58 93 Z" />
          <path className="glider-legs" d="M70 101 L80 101" />
        </svg>
      </div>
    </div>
  </div>
);
