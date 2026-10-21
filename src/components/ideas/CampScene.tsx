import React from 'react';
import './CampScene.css';

const TENT_PHOTO = '/assets/about/tent.webp';

/** The fisher's silhouette (local units, feet at y = 0, facing right): legs and boots... */
const FISHER_LEGS = [
  'M-23 -80 L-1 -80 L-4 -14 L-18 -14 C-20 -34 -22 -56 -23 -80 Z',
  'M0 -80 L22 -80 C23 -56 21 -34 20 -14 L6 -14 L3 -50 Z',
  'M-20 -16 L-4 -16 L-3 -5 L3 -3 L3 0 L-21 0 Z',
  'M5 -16 L20 -16 L21 -6 L29 -3 L29 0 L4 0 Z',
];
/** ...and the upper body: hat, head, jacket, backpack with a rolled mat. */
const FISHER_BODY = [
  'M-32 -166 C-22 -171 22 -172 34 -165 C28 -162 -26 -161 -32 -166 Z',
  'M-15 -167 C-15 -183 15 -185 14 -167 Z',
  'M-9 -165 L11 -165 C12 -160 13 -158 16 -155 C14 -153 12 -153 12 -150 C12 -147 9 -144 4 -144 L-6 -144 C-10 -150 -10 -158 -9 -165 Z',
  'M-6 -147 L5 -147 L6 -134 L-7 -134 Z',
  'M-22 -132 C-8 -140 10 -140 18 -132 C24 -112 25 -88 23 -62 L-24 -62 C-26 -88 -27 -112 -22 -132 Z',
  'M-22 -130 C-40 -128 -47 -112 -47 -94 C-47 -78 -40 -68 -24 -68 Z',
  'M-30 -132 C-36 -138 -26 -142 -18 -136 Z',
];

/**
 * A fisher in silhouette against a pale moon, standing at the water with the
 * rod held out over the page's edge; ripples of moonlight at their feet.
 */
const Fisher: React.FC = () => (
  <g className="camp-fisher" transform="translate(640 272) scale(0.85)">
    <circle className="camp-moon" cx="46" cy="-118" r="82" />
    <g className="camp-moon-water">
      <rect x="20" y="-12" width="120" height="3" rx="1.5" />
      <rect x="40" y="-6" width="96" height="3" rx="1.5" />
      <rect x="30" y="0" width="70" height="2.5" rx="1.2" />
    </g>
    {/* The near bank, hiding the bottom of the moon */}
    <path className="camp-solid" d="M-90 4 C-30 -1 80 -2 200 3 L200 30 L-90 30 Z" />
    <g className="camp-silhouette">
      {FISHER_LEGS.map((d) => <path key={d} d={d} />)}
      <g transform="translate(0 -16)">
        {FISHER_BODY.map((d) => <path key={d} d={d} />)}
        <circle cx="35" cy="-87" r="6" />
        {/* Arm to the hands, a loose strap, and the rod held out */}
        <path className="camp-silhouette-line" d="M8 -128 L22 -98 L34 -88" style={{ strokeWidth: 11 }} />
        <path className="camp-silhouette-line" d="M-40 -72 C-42 -60 -40 -50 -44 -38" style={{ strokeWidth: 2 }} />
        <path className="camp-silhouette-line" d="M22 -78 L60 -98" style={{ strokeWidth: 3 }} />
        <path className="camp-silhouette-line" d="M60 -98 L210 -150" style={{ strokeWidth: 1.5 }} />
        <circle className="camp-rod-tip" cx="210" cy="-150" r="0.5" />
      </g>
    </g>
  </g>
);

/**
 * The tent, campfire and a fisher, as line art like the project cards. The
 * fisher's line is drawn separately (FishingLine) since it runs down the page.
 */
export const CampScene: React.FC = () => (
  <svg className="camp-scene" viewBox="0 0 870 290" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="camp-moon">
        <stop offset="0" stopColor="#d9cdf2" stopOpacity="0.34" />
        <stop offset="1" stopColor="#d9cdf2" stopOpacity="0.22" />
      </radialGradient>
      <radialGradient id="camp-glow">
        <stop offset="0" stopColor="#ff8c00" stopOpacity="0.45" />
        <stop offset="0.45" stopColor="#ff5a00" stopOpacity="0.15" />
        <stop offset="1" stopColor="#ff3c00" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="camp-flame" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stopColor="#ff5a1f" />
        <stop offset="0.6" stopColor="#ff9b3d" />
        <stop offset="1" stopColor="#ffd56b" />
      </linearGradient>
    </defs>

    <circle className="camp-glow" cx="80" cy="228" r="110" fill="url(#camp-glow)" />

    {/* Ground */}
    <path className="camp-line camp-faint" d="M0 272 L160 272 M176 273 L512 273" />

    {/* The original tent photo */}
    <image className="camp-tent" href={TENT_PHOTO} x="150" y="8" width="384" height="384" opacity="0.9" />

    {/* Campfire: crossed logs, flames, a ring of stones in front */}
    <g className="camp-fire">
      <g transform="translate(80 248) rotate(-20)">
        <rect className="camp-line camp-solid" x="-56" y="-9" width="112" height="18" rx="9" />
        <ellipse className="camp-line" cx="49" cy="0" rx="3.5" ry="7" />
      </g>
      <g transform="translate(80 248) rotate(20)">
        <rect className="camp-line camp-solid" x="-56" y="-9" width="112" height="18" rx="9" />
        <ellipse className="camp-line" cx="-49" cy="0" rx="3.5" ry="7" />
      </g>
      <path
        className="camp-flame camp-flame-outer"
        d="M80 242 C50 240 46 206 62 186 C66 201 72 203 75 197 C70 176 80 151 98 136 C94 159 112 173 110 201 C116 197 118 189 116 181 C128 198 125 238 80 242 Z"
      />
      <path
        className="camp-flame camp-flame-inner"
        d="M80 240 C66 238 63 220 72 207 C74 215 78 215 80 209 C80 197 86 187 94 181 C92 197 102 205 98 223 C96 233 90 240 80 240 Z"
      />
      <circle className="camp-spark camp-spark-1" cx="74" cy="150" r="1.8" />
      <circle className="camp-spark camp-spark-2" cx="92" cy="140" r="1.4" />
      <circle className="camp-spark camp-spark-3" cx="84" cy="160" r="1.6" />
      {[
        [32, 263, 15, 9],
        [57, 269, 16, 8.5],
        [86, 271, 15, 8],
        [114, 268, 16, 9],
        [135, 262, 12, 8],
      ].map(([cx, cy, rx, ry]) => (
        <ellipse key={cx} className="camp-line camp-solid" cx={cx} cy={cy} rx={rx} ry={ry} />
      ))}
    </g>

    <Fisher />
  </svg>
);
