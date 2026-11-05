import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GARAGE_PATH, roadmapPath, type Car } from '../cars';
import { CarSwitcher } from '../CarSwitcher';
import { PostSearch } from '../PostSearch';
import { IconMap, IconSearch, IconSheets } from './Icons';

export interface Crumb {
  label: string;
  /** Omit for the current page (last crumb). */
  to?: string;
}

/**
 * The bar across the top of every log page (the bay wall, one row):
 * neon sign → /garage, mini-bay car switcher, breadcrumb, search, Sheets
 * (opens the sheet index) and the Roadmap tag. Phones keep the sign, the
 * bays, the last crumb and a search button.
 *
 * - `onSheets`: show the Sheets button (pages with a sheet index)
 */
export const ShopBar: React.FC<{ car: Car; crumbs: Crumb[]; onSheets?: () => void }> = ({ car, crumbs, onSheets }) => {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <header className="shopbar">
      <Link to={GARAGE_PATH} className="neon" aria-label="The Garage: all cars">
        <span className="neon-long">The Garage</span>
        <span className="neon-short" aria-hidden="true">Garage</span>
      </Link>
      <CarSwitcher current={car.id} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          {crumbs.map((c, i) => (
            <li key={i} className={i === crumbs.length - 1 ? 'is-last' : undefined}>
              {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <div className={`shopbar-search${searchOpen ? ' is-open' : ''}`}>
        <PostSearch car={car.id} autoFocus={searchOpen} onPicked={() => setSearchOpen(false)} />
      </div>
      <button
        type="button"
        className="icon-btn shopbar-search-btn"
        aria-label={searchOpen ? 'Close search' : 'Search'}
        aria-expanded={searchOpen}
        onClick={() => setSearchOpen((o) => !o)}
      >
        <IconSearch />
      </button>
      {onSheets && (
        <button type="button" className="btn btn--ghost shopbar-sheets" onClick={onSheets}>
          <IconSheets /> Sheets
        </button>
      )}
      {car.roadmap && (
        <Link to={roadmapPath(car.id)} className="btn btn--tag shopbar-roadmap">
          <IconMap /> Roadmap
        </Link>
      )}
    </header>
  );
};
