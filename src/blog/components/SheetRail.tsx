import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { postPath, type Car } from '../cars';
import { sheetGroups, sheetNo, type Sheet } from '../postIndex';

/**
 * Desktop strip under the shop bar: every sheet as a numbered cell, grouped
 * by epic (or category), so any sheet is one click away. The current sheet
 * is highlighted (its title is in the breadcrumb). Hidden on phones (the
 * bottom bar and sheet index take over).
 */
export const SheetRail: React.FC<{ car: Car; current?: Sheet }> = ({ car, current }) => {
  const { search } = useLocation();
  return (
    <nav className="rail" aria-label="Sheets">
      <span className="rail-k" aria-hidden="true">Sheets</span>
      <div className="rail-groups">
        {sheetGroups(car.id).map((g) => (
          <div className="rail-group" key={g.id} title={g.title}>
            <span className="rail-group-k">{g.short}</span>
            {g.sheets.map((s) => (
              <Link
                key={s.post.slug}
                to={postPath(car.id, s.post.slug) + search}
                className={`rail-cell${s === current ? ' is-on' : ''}`}
                aria-current={s === current ? 'page' : undefined}
                aria-label={`Sheet ${sheetNo(s.no)}: ${s.post.title}`}
                title={s.post.title}
              >
                {sheetNo(s.no)}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </nav>
  );
};
