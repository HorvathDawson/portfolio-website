import React from 'react';

/**
 * The web-1.0 footer gag: under-construction tape, a visitor odometer and
 * 88x31 badges. Decoration only (aria-hidden), hidden in print.
 * - `badge`: the car's own badge from car.json (`"badge": "SR20 powered"`;
 *   first word in bold). Omitted → only the generic badge.
 */
export const Gags: React.FC<{ count: number; badge?: string }> = ({ count, badge }) => (
  <footer className="gags" aria-hidden="true">
    <p className="gags-uc">Under construction</p>
    <p className="gags-odo">
      You are visitor
      <span className="odo">{String(count + 1000).slice(-5).padStart(5, '0').split('').map((d, i) => <b key={i}>{d}</b>)}</span>
    </p>
    <p className="gags-badges">
      {badge && <span className="b88 b88--a"><b>{badge.split(' ')[0]}</b>{badge.split(' ').slice(1).join(' ')}</span>}
      <span className="b88 b88--b"><b>Best viewed</b>800×600</span>
    </p>
  </footer>
);
