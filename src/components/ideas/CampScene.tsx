import React from 'react';
import { Campfire } from '../Campfire';
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
