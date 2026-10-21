import React from 'react';
import './CampScene.css';

const TENT_PHOTO = '/assets/about/tent.webp';

/** Size and place of the fisher silhouette (public/assets/about/fisher.svg, 616 × 570). */
const FISHER = { x: 560, y: 87.3, width: 200.6, height: 185.7 };
/** Where its rod tip lands in the scene; the line hangs from here. */
const ROD_TIP = { x: 760.0, y: 239.1 };

/** A fisher in silhouette, in the dark blue the page fades into, rod held out over the page's edge. */
const Fisher: React.FC = () => (
  <g className="camp-fisher">
    <image href="/assets/about/fisher.svg" {...FISHER} />
    <circle className="camp-rod-tip" cx={ROD_TIP.x} cy={ROD_TIP.y} r="0.5" />
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
