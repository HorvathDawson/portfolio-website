import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CarArt } from './CarArt';
import { GARAGE_PATH, carPath, cars, postPath, type Car } from './cars';
import { latestPost, postsFor } from './postIndex';
import { formatDate, kindLabel, statusLabel } from './format';
import { usePageMeta } from '../utils/usePageMeta';
import './blogStyles.css';
import './garage.css';

const lastUpdated = (car: string) => postsFor(car).reduce((m, p) => (p.date > m ? p.date : m), '');

const CarTile: React.FC<{ car: Car }> = ({ car }) => {
  const posts = postsFor(car.id);
  // Latest log entry; reference pages (car facts) only if there is nothing else.
  const latest = posts.filter((p) => p.kind !== 'reference').at(-1) ?? latestPost(car.id);
  const updated = lastUpdated(car.id);
  const nameId = `garage-tile-${car.id}`;
  return (
    <li className="garage-tile" style={{ '--car-accent': car.accent } as React.CSSProperties}>
      <Link to={carPath(car.id)} className="garage-tile-link" aria-labelledby={nameId} data-tile>
        <div className="garage-tile-art">
          <CarArt car={car} />
        </div>
        <h2 className="garage-tile-name" id={nameId}>{car.name}</h2>
      </Link>
      <p className="garage-tile-sub">{car.year} · {car.make} {car.model}</p>
      <p className="garage-tile-desc">{car.description}</p>
      <div className="garage-tile-meta">
        <span className="blog-status blog-status--kind">{kindLabel[car.kind]}</span>
        <span className={`blog-status blog-status--${car.status}`}>{statusLabel[car.status]}</span>
      </div>
      <p className="garage-tile-stats">
        {posts.length} {posts.length === 1 ? 'post' : 'posts'}
        {updated && <> · updated <time dateTime={updated}>{formatDate(updated)}</time></>}
      </p>
      {latest && (
        <p className="garage-tile-latest">
          Latest: <Link to={postPath(car.id, latest.slug)}>{latest.title}</Link>
        </p>
      )}
    </li>
  );
};

/** /garage: one tile per car. Arrow keys move between tiles. */
export const GarageSelector: React.FC = () => {
  usePageMeta({
    title: 'Garage',
    description: `Build and maintenance logs: ${cars.map((c) => c.name).join(', ')}.`,
    path: GARAGE_PATH,
  });
  const listRef = useRef<HTMLUListElement>(null);

  // Touch screens have no hover: colour the tile that is in view instead.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !window.matchMedia('(hover: none)').matches) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('is-inview', e.intersectionRatio >= 0.6);
    }, { threshold: [0, 0.6, 1] });
    list.querySelectorAll('.garage-tile').forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const tiles = [...e.currentTarget.querySelectorAll<HTMLAnchorElement>('[data-tile]')];
    const i = tiles.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? tiles.length - 1 : step !== undefined ? (i + step + tiles.length) % tiles.length : -1;
    if (to < 0) return;
    e.preventDefault();
    tiles[to].focus();
  };

  return (
    <div className="blog-page garage-page">
      <header className="garage-header">
        <Link to="/" className="blog-back-link">&larr; Portfolio</Link>
        <h1 className="garage-title">The Garage</h1>
        <p className="garage-lede">Build logs and maintenance logs, one car per tile.</p>
        <div className="blog-sidebar-divider" aria-hidden="true" />
      </header>
      <ul className="garage-grid" ref={listRef} onKeyDown={onKeyDown} aria-label="Cars">
        {cars.map((car) => <CarTile key={car.id} car={car} />)}
      </ul>
    </div>
  );
};
