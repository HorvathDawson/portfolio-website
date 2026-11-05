import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { postPath, type Car } from '../cars';
import { sheetNo, type Sheet } from '../postIndex';

/** Previous / next sheet, as tabs hanging off the bottom edge of the drawing sheet. */
export const SheetTabs: React.FC<{ car: Car; prev?: Sheet; next?: Sheet }> = ({ car, prev, next }) => {
  const { search } = useLocation();
  const tab = (s: Sheet, dir: 'prev' | 'next') => (
    <Link to={postPath(car.id, s.post.slug) + search} className={`sheet-tab sheet-tab--${dir}`} rel={dir}>
      <small>{dir === 'prev' ? '← ' : ''}Sheet {sheetNo(s.no)} · {s.group.short}{dir === 'next' ? ' →' : ''}</small>
      <span>{s.post.title}</span>
    </Link>
  );
  return (
    <nav className="sheet-tabs" aria-label="Previous and next sheet">
      {prev ? tab(prev, 'prev') : <span />}
      {next ? tab(next, 'next') : <span />}
    </nav>
  );
};
