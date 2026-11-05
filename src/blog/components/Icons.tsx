import React from 'react';

/* Line icons for the garage UI (16 px grid, stroke = currentColor). Decorative: aria-hidden. */

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg className="icon" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const IconSearch = () => <Svg><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" /></Svg>;
export const IconSheets = () => <Svg><rect x="3" y="1.5" width="10" height="13" rx="1" /><path d="M5.5 5h5M5.5 8h5M5.5 11h3" /></Svg>;
export const IconToc = () => <Svg><path d="M2 3.5h1M5 3.5h9M2 8h1M5 8h9M2 12.5h1M5 12.5h9" /></Svg>;
export const IconMap = () => <Svg><path d="M1.5 3.5 5.5 2l5 1.5 4-1.5v10.5l-4 1.5-5-1.5-4 1.5z" /><path d="M5.5 2v10.5M10.5 3.5V14" /></Svg>;
export const IconClose = () => <Svg><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></Svg>;
export const IconPrev = () => <Svg><path d="M10 3 5 8l5 5" /></Svg>;
export const IconNext = () => <Svg><path d="M6 3l5 5-5 5" /></Svg>;
export const IconZoom = () => <Svg><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14M5 7h4M7 5v4" /></Svg>;
