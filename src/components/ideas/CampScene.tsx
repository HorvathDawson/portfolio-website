import React from 'react';
import './CampScene.css';

/** Silhouette parts of the fisher, drawn twice: a light rim, then the dark body over it. */
const FISHER_LIMBS: [string, number][] = [
  ['M560 232 L566 190', 17], // torso
  ['M562 230 L600 226', 13], // thigh
  ['M600 226 L605 266', 11], // shin
  ['M603 268 L616 268', 7], // boot
  ['M566 196 L586 213', 9], // upper arm
  ['M586 213 L603 203', 8], // forearm
];

const Fisher: React.FC = () => (
  <g className="camp-fisher" transform="translate(560 272) scale(1.2) translate(-560 -272)">
    {/* Rock seat */}
    <path className="camp-line camp-solid" d="M505 272 C505 247 524 233 558 233 C594 233 614 249 615 272 Z" />
    <g className="camp-rim">
      {FISHER_LIMBS.map(([d, w]) => <path key={d} d={d} strokeWidth={w + 3.5} />)}
      <circle cx="569" cy="173" r="12.5" />
      <path d="M553 166 L588 164" strokeWidth={6.5} />
    </g>
    <g className="camp-body">
      {FISHER_LIMBS.map(([d, w]) => <path key={d} d={d} strokeWidth={w} />)}
      <circle cx="569" cy="173" r="10.8" />
      {/* Bucket hat */}
      <path d="M560 167 C560 155 579 154 580 166 Z" />
      <path d="M554 166 L587 164" strokeWidth={3} />
    </g>
    {/* Rod (thicker at the butt), reel, and the tip the line hangs from */}
    <path className="camp-line" d="M588 216 Q666 122 742 66" strokeWidth={1.6} />
    <path className="camp-line" d="M588 216 L612 194" strokeWidth={3.2} />
    <circle className="camp-line camp-solid" cx="600" cy="207" r="3.6" strokeWidth={1.4} />
    <circle className="camp-rod-tip" cx="742" cy="66" r="0.5" />
  </g>
);

/**
 * The tent, campfire and a fisher, as line art like the project cards. The
 * fisher's line is drawn separately (FishingLine) since it runs down the page.
 */
export const CampScene: React.FC = () => (
  <svg className="camp-scene" viewBox="0 0 790 290" aria-hidden="true" focusable="false">
    <defs>
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
    <path className="camp-line camp-faint" d="M0 272 L150 272 M168 271 L470 271 M495 272 L640 272" />

    {/* Tent: dome, seams, a half-open door glowing from inside, vent, guy lines */}
    <g className="camp-tent">
      <path className="camp-tent-inside" d="M242 270 C246 216 276 178 312 172 C329 200 343 238 349 270 Z" />
      <path className="camp-line" d="M168 270 C172 190 240 128 312 124 C385 120 450 180 462 270" />
      <path className="camp-line" d="M205 270 C230 175 290 130 330 125 C380 150 410 210 420 270" />
      <path className="camp-line" d="M242 270 C246 216 276 178 312 172 C350 176 378 216 384 270" />
      <path className="camp-line" d="M312 172 C329 200 343 238 349 270" />
      <path className="camp-line camp-faint" d="M312 176 L312 268" strokeDasharray="2 5" />
      <path className="camp-line" d="M292 140 Q312 131 334 139" />
      <path className="camp-line camp-faint" d="M180 214 L152 271 M456 214 L496 271" />
      <path className="camp-line" d="M148 266 L156 276 M492 266 L500 276" />
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
