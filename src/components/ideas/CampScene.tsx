import React from 'react';
import './CampScene.css';

/**
 * A seated fisher in silhouette, facing the page edge, in local units with the
 * ground at y = 0 and the seat rock under the hips. Each shape is drawn twice:
 * a light rim first, then the dark body over it, so the figure reads as one
 * silhouette with a thin outline.
 */
const FISHER_SHAPES = [
  // Head and cap with its peak forward
  'M-9 -122 C-9 -134 10 -135 10 -122 C10 -114 5 -109 0 -109 C-5 -109 -9 -114 -9 -122 Z',
  'M-11 -124 C-11 -137 11 -138 12 -126 L23 -124 C24 -122 23 -121 21 -121 L-11 -121 Z',
  // Neck and jacket, leaning a little forward
  'M-4 -112 L5 -112 L6 -103 L-4 -103 Z',
  'M-14 -100 C-10 -106 8 -107 13 -100 C19 -88 18 -66 14 -46 L-12 -44 C-18 -62 -19 -86 -14 -100 Z',
  // Thigh to the knee, shin down, boot
  'M-10 -56 L30 -62 C40 -63 43 -50 34 -46 L-8 -40 Z',
  'M27 -58 C33 -61 41 -58 41 -51 L43 -10 L31 -10 L28 -50 Z',
  'M29 -12 L44 -12 C51 -12 54 -6 54 0 L28 0 Z',
];
/** Arms as thick strokes: shoulder to elbow to the hands on the rod. */
const FISHER_ARM = 'M2 -97 L14 -70 L35 -80';

const Fisher: React.FC = () => (
  <g className="camp-fisher" transform="translate(640 272)">
    {/* Rock seat, behind the legs */}
    <path className="camp-line camp-solid" d="M-46 0 C-46 -28 -26 -46 -2 -46 C20 -46 30 -30 30 0 Z" />
    <g className="camp-rim">
      {FISHER_SHAPES.map((d) => <path key={d} d={d} />)}
      <path d={FISHER_ARM} fill="none" style={{ strokeWidth: 12.5 }} />
    </g>
    <g className="camp-body">
      {FISHER_SHAPES.map((d) => <path key={d} d={d} />)}
      <path d={FISHER_ARM} fill="none" style={{ strokeWidth: 9 }} />
    </g>
    {/* Rod (thicker at the butt), reel, and the tip the line hangs from */}
    <path className="camp-line" d="M18 -66 Q108 -150 196 -228" strokeWidth={1.6} />
    <path className="camp-line" d="M18 -66 L46 -90" strokeWidth={3.4} />
    <circle className="camp-line camp-solid" cx="28" cy="-70" r="4" strokeWidth={1.4} />
    <circle className="camp-rod-tip" cx="196" cy="-228" r="0.5" />
  </g>
);

/**
 * The tent, campfire and a fisher, as line art like the project cards. The
 * fisher's line is drawn separately (FishingLine) since it runs down the page.
 */
export const CampScene: React.FC = () => (
  <svg className="camp-scene" viewBox="0 0 850 290" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="camp-lantern" cx="0.5" cy="0.82" r="0.7">
        <stop offset="0" stopColor="#ffe3a1" stopOpacity="0.85" />
        <stop offset="0.5" stopColor="#ffb057" stopOpacity="0.35" />
        <stop offset="1" stopColor="#ff8a3d" stopOpacity="0.05" />
      </radialGradient>
      <radialGradient id="camp-spill">
        <stop offset="0" stopColor="#ffc46b" stopOpacity="0.28" />
        <stop offset="1" stopColor="#ffc46b" stopOpacity="0" />
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
    <path className="camp-line camp-faint" d="M0 272 L160 272 M176 271 L520 271 M580 272 L710 272" />

    {/* A-frame tent seen from the front corner: front triangle with its door
        flaps tied back and a lantern glowing inside, ridge and side wall
        running back, guy lines and stakes. */}
    <g className="camp-tent">
      <ellipse className="camp-tent-spill" cx="262" cy="272" rx="90" ry="12" />
      <path className="camp-tent-door" d="M262 128 L226 270 L300 270 Z" />
      <path className="camp-line camp-solid" d="M262 122 L448 134 L512 268 L338 270 Z" />
      <path className="camp-line camp-faint" d="M300 125 L372 268 M352 128 L428 269 M404 131 L472 268" />
      <path className="camp-line" d="M262 122 L182 270 L338 270 Z" />
      <path className="camp-line camp-solid" d="M262 128 C246 180 232 226 222 270 L196 270 Z" />
      <path className="camp-line camp-solid" d="M262 128 C278 180 294 226 304 270 L326 270 Z" />
      <path className="camp-line" d="M234 214 L214 222 M290 214 L311 222" />
      <path className="camp-line camp-faint" d="M262 122 L262 270" />
      <path className="camp-line camp-faint" d="M262 122 L176 196 M448 134 L540 200" />
      <path className="camp-line" d="M262 112 L262 122 M448 124 L448 134" />
      <path className="camp-line" d="M171 190 L180 202 M536 194 L545 206" />
    </g>

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
