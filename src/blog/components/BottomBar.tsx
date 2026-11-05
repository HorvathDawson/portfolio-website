import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { postPath, type Car } from '../cars';
import { sheetNo, type Sheet } from '../postIndex';
import { IconNext, IconPrev, IconSheets, IconToc } from './Icons';

/**
 * Phone-only bar on a sheet: previous · Sheets (n of N) · Contents · next.
 * - `onContents`: omit when the post has no table of contents
 */
export const BottomBar: React.FC<{
  car: Car;
  current: Sheet;
  prev?: Sheet;
  next?: Sheet;
  onSheets: () => void;
  onContents?: () => void;
}> = ({ car, current, prev, next, onSheets, onContents }) => {
  const { search } = useLocation();
  const edge = (s: Sheet | undefined, dir: 'prev' | 'next') =>
    s ? (
      <Link to={postPath(car.id, s.post.slug) + search} className={`bbar-btn bbar-edge bbar-edge--${dir}`} aria-label={`${dir === 'prev' ? 'Previous' : 'Next'}: sheet ${sheetNo(s.no)}, ${s.post.title}`}>
        {dir === 'prev' && <IconPrev />}<small>{sheetNo(s.no)}</small>{dir === 'next' && <IconNext />}
      </Link>
    ) : <span className="bbar-btn bbar-edge is-off" aria-hidden="true" />;
  return (
    <nav className="bbar" aria-label="Sheet navigation">
      {edge(prev, 'prev')}
      <button type="button" className="bbar-btn bbar-mid" onClick={onSheets}>
        <IconSheets />
        <small><b>{sheetNo(current.no)}</b> of {sheetNo(current.of)}</small>
        <span className="sr-only">Open the sheet index</span>
      </button>
      {onContents ? (
        <button type="button" className="bbar-btn" onClick={onContents}>
          <IconToc /><small>Contents</small>
        </button>
      ) : <span className="bbar-btn is-off" aria-hidden="true" />}
      {edge(next, 'next')}
    </nav>
  );
};
