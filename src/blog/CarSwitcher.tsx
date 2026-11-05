import React from 'react';
import { Link } from 'react-router-dom';
import { carPath, cars } from './cars';
import { carTransitionName } from './garageSceneTransition';

/**
 * Car switcher for the shop bar: one mini garage bay per car (the /garage
 * scene in miniature). The current car's bay is lit with its coloured art,
 * the others have the door half down. The lit car carries the scene's
 * view-transition name, so the car driving out of /garage morphs into it.
 */
export const CarSwitcher: React.FC<{ current: string }> = ({ current }) => (
  <nav className="minibays" aria-label="Cars in the garage">
    <ul>
      {cars.map((car) => {
        const on = car.id === current;
        return (
          <li key={car.id}>
            <Link
              to={carPath(car.id)}
              className={`minibay${on ? ' is-on' : ''}`}
              aria-current={on ? 'page' : undefined}
              title={car.name}
              style={{ '--car-accent': car.accent } as React.CSSProperties}
            >
              <span className="minibay-door" aria-hidden="true">
                <span className="minibay-tube" />
                <img
                  src={on ? car.art.colored : car.art.outline}
                  alt=""
                  style={on ? ({ viewTransitionName: carTransitionName(car.id), viewTransitionClass: 'garage-car' } as React.CSSProperties) : undefined}
                />
                <span className="minibay-slats" />
              </span>
              <span className="minibay-name">{car.model}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  </nav>
);
