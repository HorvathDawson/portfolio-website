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
 * The tent, a campfire that's been put out and a fisher. The
 * fisher's line is drawn separately (FishingLine) since it runs down the page.
 */
export const CampScene: React.FC = () => (
  <svg className="camp-scene" viewBox="0 0 790 290" aria-hidden="true" focusable="false">
    <defs>
      {/* Softens the smoke wisps */}
      <filter id="camp-smoke-blur" x="-50%" y="-20%" width="200%" height="140%">
        <feGaussianBlur stdDeviation="3" />
      </filter>
    </defs>


    {/* Ground */}
    <path className="camp-line camp-faint" d="M0 272 L160 272 M176 273 L512 273" />

    {/* The original tent photo */}
    <image className="camp-tent" href={TENT_PHOTO} x="150" y="8" width="384" height="384" opacity="0.9" />

    {/* Campfire, put out: crossed logs, embers, smoke, a ring of stones in front */}
    <g className="camp-fire">
      <g transform="translate(80 248) rotate(-20)">
        <rect className="camp-line camp-dark" x="-56" y="-9" width="112" height="18" rx="9" />
        <ellipse className="camp-line camp-dark" cx="49" cy="0" rx="3.5" ry="7" />
      </g>
      <g transform="translate(80 248) rotate(20)">
        <rect className="camp-line camp-dark" x="-56" y="-9" width="112" height="18" rx="9" />
        <ellipse className="camp-line camp-dark" cx="-49" cy="0" rx="3.5" ry="7" />
      </g>
      {/* A few embers still glowing where the logs cross */}
      <circle className="camp-ember" cx="74" cy="244" r="2.2" />
      <circle className="camp-ember camp-ember-2" cx="86" cy="247" r="1.6" />
      <circle className="camp-ember camp-ember-3" cx="80" cy="240" r="1.3" />
      {/* Smoke curling up from it */}
      <g filter="url(#camp-smoke-blur)">
        {[
          'M80 238 C70 214 94 198 82 176 C72 158 92 142 84 120',
          'M84 238 C94 216 72 202 86 182 C98 164 78 150 90 128',
          'M76 238 C66 220 86 206 76 190 C68 176 84 162 78 146',
        ].map((d, i) => (
          <path key={d} className={`camp-smoke camp-smoke-${i + 1}`} d={d} />
        ))}
      </g>
      {[
        [32, 263, 15, 9],
        [57, 269, 16, 8.5],
        [86, 271, 15, 8],
        [114, 268, 16, 9],
        [135, 262, 12, 8],
      ].map(([cx, cy, rx, ry]) => (
        <ellipse key={cx} className="camp-line camp-dark" cx={cx} cy={cy} rx={rx} ry={ry} />
      ))}
    </g>

    <Fisher />
  </svg>
);
