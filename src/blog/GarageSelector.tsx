import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GarageScene } from './GarageScene';
import { returningCar } from './garageSceneTransition';
import { GARAGE_PATH, carPath, cars, postPath, type Car } from './cars';
import { latestPost, postsFor } from './postIndex';
import { formatDate, kindLabel, statusLabel } from './format';
import { usePageMeta } from '../utils/usePageMeta';
import './blogStyles.css';
import './garage.css';

const lastUpdated = (car: string) => postsFor(car).reduce((m, p) => (p.date > m ? p.date : m), '');

/** Status chips, post count and latest entry under a car's bay. */
const TileMeta: React.FC<{ car: Car }> = ({ car }) => {
  const posts = postsFor(car.id);
  // Latest log entry; reference pages (car facts) only if there is nothing else.
  const latest = posts.filter((p) => p.kind !== 'reference').at(-1) ?? latestPost(car.id);
  const updated = lastUpdated(car.id);
  return (
    <>
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
    </>
  );
};

/** /garage: the animated garage, one bay per car (arrow keys move between bays). */
export const GarageSelector: React.FC = () => {
  usePageMeta({
    title: 'Garage',
    description: `Build and maintenance logs: ${cars.map((c) => c.name).join(', ')}.`,
    path: GARAGE_PATH,
  });
  const navigate = useNavigate();
  // The car that last drove out in this tab reverses back into its bay.
  const [back] = useState(returningCar);

  return (
    <div className="blog-page garage-page">
      <header className="garage-header">
        <Link to="/" className="blog-back-link">&larr; Portfolio</Link>
        {/* The scene draws its own neon sign; the heading stays for screen readers. */}
        <h1 className="garage-title sr-only">The Garage</h1>
        <p className="garage-lede">Build logs and maintenance logs. Pick a bay.</p>
        <div className="blog-sidebar-divider" aria-hidden="true" />
      </header>
      <GarageScene cars={cars} returning={back} onEnter={(id) => navigate(carPath(id))} renderMeta={(car) => <TileMeta car={car} />} />
    </div>
  );
};
