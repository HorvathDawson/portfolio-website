import React from 'react';
import { Campfire } from '../Campfire';
import './CampScene.css';

const TENT_PHOTO = '/assets/about/tent.webp';

/** Size and place of the fisher silhouette (public/assets/about/fisher.svg, 616 × 570). */
const FISHER = { x: 560, y: 87.3, width: 200.6, height: 185.7 };
/** Where its rod tip lands in the scene; the line hangs from here. */
const ROD_TIP = { x: 760.0, y: 239.1 };

/**
 * Firelight from the left: the silhouette's left-facing edges (found by
 * shifting the shape right and keeping what it uncovers) tinted warm, a thin
 * bright rim over a wider, fainter falloff, kept inside the shape.
 */
const FireRim: React.FC = () => (
  <filter id="camp-fire-rim" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
    <feOffset in="SourceAlpha" dx="1.4" result="nearShift" />
    <feComposite in="SourceAlpha" in2="nearShift" operator="out" result="nearEdge" />
    <feGaussianBlur in="nearEdge" stdDeviation="0.5" result="nearSoft" />
    <feOffset in="SourceAlpha" dx="6" result="farShift" />
    <feComposite in="SourceAlpha" in2="farShift" operator="out" result="farEdge" />
    <feGaussianBlur in="farEdge" stdDeviation="2.5" result="farSoft" />
    <feComponentTransfer in="nearSoft" result="near">
      <feFuncA type="linear" slope="0.55" />
    </feComponentTransfer>
    <feComponentTransfer in="farSoft" result="far">
      <feFuncA type="linear" slope="0.2" />
    </feComponentTransfer>
    <feMerge result="light">
      <feMergeNode in="far" />
      <feMergeNode in="near" />
    </feMerge>
    <feComposite in="light" in2="SourceAlpha" operator="in" result="inside" />
    <feFlood floodColor="#ff8a3d" />
    <feComposite in2="inside" operator="in" result="glow" />
    <feMerge>
      <feMergeNode in="SourceGraphic" />
      <feMergeNode in="glow" />
    </feMerge>
  </filter>
);

/**
 * A fisher in silhouette, in the dark blue the page fades into, rod held out
 * over the page's edge, lit faintly on the left by the campfire.
 */
const Fisher: React.FC = () => (
  <g className="camp-fisher">
    <FireRim />
    <image href="/assets/about/fisher.svg" {...FISHER} filter="url(#camp-fire-rim)" />
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
