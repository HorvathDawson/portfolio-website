import React from 'react';
import { Link } from 'react-router-dom';
import { CarThumb } from './CarArt';
import { GARAGE_PATH, carPath, cars } from './cars';

/** Compact row of outline thumbnails for jumping between cars. */
export const CarSwitcher: React.FC<{ current: string }> = ({ current }) => (
  <nav className="car-switcher" aria-label="Cars in the garage">
    <Link to={GARAGE_PATH} className="car-switcher-all">&larr; Garage</Link>
    <ul>
      {cars.map((car) => (
        <li key={car.id}>
          <Link
            to={carPath(car.id)}
            className={`car-switcher-link${car.id === current ? ' car-switcher-link--on' : ''}`}
            aria-current={car.id === current ? 'page' : undefined}
            title={car.name}
            style={{ '--car-accent': car.accent } as React.CSSProperties}
          >
            <CarThumb car={car} />
            <span className="car-switcher-name">{car.model}</span>
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);
