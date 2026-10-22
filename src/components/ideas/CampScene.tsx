import React from 'react';
import { Campfire } from '../Campfire';
import './CampScene.css';

const TENT_PHOTO = '/assets/about/tent.webp';

/** Size and place of the fisher silhouette (public/assets/about/fisher.svg, 616 × 570). */
const FISHER = { x: 560, y: 87.3, width: 200.6, height: 185.7 };
/** Where its rod tip lands in the scene; the line hangs from here. */
const ROD_TIP = { x: 760.0, y: 239.1 };

/**
 * Blends the silhouette into the night: its outline feathered a little, and
 * firelight from the left on its left-facing edges (found by shifting the
 * shape right and keeping what it uncovers), soft and warm, kept inside it.
 */
const FireRim: React.FC = () => (
  <filter id="camp-fire-rim" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation="0.55" result="soft" />
    <feGaussianBlur in="SourceAlpha" stdDeviation="0.55" result="softAlpha" />
    <feOffset in="softAlpha" dx="2" result="nearShift" />
    <feComposite in="softAlpha" in2="nearShift" operator="out" result="nearEdge" />
    <feGaussianBlur in="nearEdge" stdDeviation="1.2" result="nearSoft" />
    <feOffset in="softAlpha" dx="6" result="farShift" />
    <feComposite in="softAlpha" in2="farShift" operator="out" result="farEdge" />
    <feGaussianBlur in="farEdge" stdDeviation="3" result="farSoft" />
    <feComponentTransfer in="nearSoft" result="near">
      <feFuncA type="linear" slope="0.5" />
    </feComponentTransfer>
    <feComponentTransfer in="farSoft" result="far">
      <feFuncA type="linear" slope="0.16" />
    </feComponentTransfer>
    <feMerge result="light">
      <feMergeNode in="far" />
      <feMergeNode in="near" />
    </feMerge>
    <feComposite in="light" in2="softAlpha" operator="in" result="inside" />
    <feFlood floodColor="#ff8a3d" />
    <feComposite in2="inside" operator="in" result="glow" />
    <feMerge>
      <feMergeNode in="soft" />
      <feMergeNode in="glow" />
    </feMerge>
  </filter>
);

/** Fades the fisher's boots into the ground. */
const GroundFade: React.FC = () => (
  <mask id="camp-fisher-fade" maskContentUnits="objectBoundingBox">
    <linearGradient id="camp-fisher-fade-ramp" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.86" stopColor="#fff" />
      <stop offset="1" stopColor="#fff" stopOpacity="0.15" />
    </linearGradient>
    <rect width="1" height="1" fill="url(#camp-fisher-fade-ramp)" />
  </mask>
);

/**
 * A fisher in silhouette, in the dark blue the page fades into, rod held out
 * over the page's edge, lit faintly on the left by the campfire and fading
 * into the ground at its feet.
 */
const Fisher: React.FC = () => (
  <g className="camp-fisher">
    <FireRim />
    <GroundFade />
    <g mask="url(#camp-fisher-fade)">
      <image href="/assets/about/fisher.svg" {...FISHER} filter="url(#camp-fire-rim)" />
    </g>
    <circle className="camp-rod-tip" cx={ROD_TIP.x} cy={ROD_TIP.y} r="0.5" />
  </g>
);

/**
 * The tent, the campfire and a fisher. The fisher's line is drawn separately
 * (FishingLine) since it runs down the page.
 */
export const CampScene: React.FC<{ logsImage: string }> = ({ logsImage }) => (
  <div className="camp-scene" aria-hidden="true">
    <svg viewBox="0 0 790 290" focusable="false">
      {/* The original tent photo */}
      <image className="camp-tent" href={TENT_PHOTO} x="150" y="8" width="384" height="384" opacity="0.9" />

      <Fisher />
    </svg>
    <Campfire logsImage={logsImage} />
  </div>
);
