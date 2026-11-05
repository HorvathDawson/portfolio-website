import React from 'react';

/**
 * The web-1.0 footer gag: under-construction tape, a visitor odometer and
 * two 88x31 badges. Decoration only (aria-hidden), hidden in print.
 */
export const Gags: React.FC<{ count: number }> = ({ count }) => (
  <footer className="gags" aria-hidden="true">
    <p className="gags-uc">Under construction</p>
    <p className="gags-odo">
      You are visitor
      <span className="odo">{String(count + 1000).slice(-5).padStart(5, '0').split('').map((d, i) => <b key={i}>{d}</b>)}</span>
    </p>
    <p className="gags-badges">
      <span className="b88 b88--a"><b>SR20</b>powered</span>
      <span className="b88 b88--b"><b>Best viewed</b>800×600</span>
    </p>
  </footer>
);
