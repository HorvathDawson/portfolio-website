import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { postPath, type Car } from '../cars';
import { categoryLabel, formatDate, kindChipLabel, statusLabel } from '../format';
import { sheetGroups, sheetNo, type Sheet } from '../postIndex';
import { Dialog } from './Dialog';

/** One line under a sheet title: date · kind (or category). */
const sheetSub = (s: Sheet) =>
  [formatDate(s.post.updated ?? s.post.date), s.post.category ? categoryLabel[s.post.category] : s.post.kind && kindChipLabel[s.post.kind]]
    .filter(Boolean)
    .join(' · ');

/**
 * The sheet index: every sheet of the car, grouped, with a filter box and a
 * "you are on" card. A drawer on desktop, a bottom sheet on phones.
 * - `current`: the sheet being read (highlighted)
 */
export const SheetIndex: React.FC<{ car: Car; current?: Sheet; open: boolean; onClose: () => void }> = ({ car, current, open, onClose }) => {
  const { search } = useLocation();
  const [filter, setFilter] = useState('');
  const q = filter.trim().toLowerCase();
  const groups = sheetGroups(car.id)
    .map((g) => ({ ...g, sheets: g.sheets.filter((s) => !q || s.post.title.toLowerCase().includes(q) || sheetNo(s.no) === q.padStart(2, '0')) }))
    .filter((g) => g.sheets.length > 0);
  return (
    <Dialog open={open} onClose={onClose} label={`Sheet index: ${car.logTitle}`} title={<>Sheet index <b>/</b> {car.code}</>}>
      <label className="sr-only" htmlFor="sheet-filter">Filter sheets</label>
      <input id="sheet-filter" className="field" type="search" placeholder="Filter sheets…" value={filter} autoComplete="off" onChange={(e) => setFilter(e.target.value)} />
      <div className="sheet-index">
        {current && !q && (
          <p className="sheet-index-cur">
            <span>You are on</span>
            <b>{sheetNo(current.no)} · {current.post.title}</b>
            <small>{current.group.title} · {sheetSub(current)}</small>
          </p>
        )}
        {groups.map((g) => (
          <section key={g.id} className="sheet-index-group" aria-label={g.title}>
            <h2 className="sheet-index-h"><span>{g.short}</span>{g.title}<small>{g.sheets.length}</small></h2>
            <ul>
              {g.sheets.map((s) => (
                <li key={s.post.slug}>
                  <Link
                    to={postPath(car.id, s.post.slug) + search}
                    className={`sheet-row${s === current ? ' is-on' : ''}`}
                    aria-current={s === current ? 'page' : undefined}
                    onClick={onClose}
                  >
                    <span className="sheet-row-no">{sheetNo(s.no)}</span>
                    <span className="sheet-row-t">{s.post.title}<small>{sheetSub(s)}</small></span>
                    <span className={`dot dot--${s.post.status}`} aria-hidden="true" /><span className="sr-only">{statusLabel[s.post.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {groups.length === 0 && <p className="muted">No sheets match.</p>}
      </div>
    </Dialog>
  );
};
