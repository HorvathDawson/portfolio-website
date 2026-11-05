import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GarageScene } from './GarageScene';
import { returningCar } from './garageSceneTransition';
import { GARAGE_PATH, carPath, cars, type Car } from './cars';
import { postsFor } from './postIndex';
import { kindLabel } from './format';
import { usePageMeta } from '../utils/usePageMeta';
import './styles/garage.css';
import './styles/selector.css';

/** The one line on a bay's sign: what kind of log it is and how many sheets. */
const signLine = (car: Car) => {
  const n = postsFor(car.id).length;
  return `${kindLabel[car.kind]} · ${n} ${n === 1 ? 'sheet' : 'sheets'}`;
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
    <div className="garage garage-select">
      <header className="garage-select-head">
        <Link to="/" className="back-link">&larr; Portfolio</Link>
        {/* The scene draws its own neon sign; the heading stays for screen readers. */}
        <h1 className="sr-only">The Garage</h1>
        <p className="garage-select-lede">Build logs and maintenance logs. Pick a bay.</p>
      </header>
      <main>
      <GarageScene cars={cars} returning={back} onEnter={(id) => navigate(carPath(id))} signLine={signLine} />
      </main>
    </div>
  );
};
