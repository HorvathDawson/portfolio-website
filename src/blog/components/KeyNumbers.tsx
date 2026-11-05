import React from 'react';
import { Link } from 'react-router-dom';
import { a40Constants, type A40Constant } from '../a40Constants';
import { postPath, type Car } from '../cars';
import { sheetFor, sheetNo } from '../postIndex';

/** Constants per car (only the A40 has a constants file today). */
const constantsFor = (car: Car): Record<string, A40Constant> | undefined => (car.id === 'a40' ? a40Constants : undefined);

/**
 * Car home "Key numbers": the cells named in car.json `keyNumbers`, read from
 * the car's constants (value, dimmed unit, status chip). Renders nothing for
 * cars without constants.
 */
export const KeyNumbers: React.FC<{ car: Car; no: string }> = ({ car, no }) => {
  const all = constantsFor(car);
  const rows = (car.keyNumbers ?? [])
    .map((k) => ({ ...k, values: k.constants.map((c) => all?.[c]).filter((c): c is A40Constant => Boolean(c)) }))
    .filter((k) => k.values.length > 0);
  if (!all || rows.length === 0) return null;
  const ref = car.constantsPost ? sheetFor(car.id, car.constantsPost) : undefined;
  return (
    <section className="home-section" aria-labelledby="kn-h">
      <h2 className="section-h" id="kn-h">
        <span className="section-no">{no}</span>Key numbers <small>from constants.yaml</small>
        {ref && <Link to={postPath(car.id, ref.post.slug)}>Sheet {sheetNo(ref.no)} →</Link>}
      </h2>
      <dl className="keynumbers">
        {rows.map((k) => {
          const unit = k.values[0].unit;
          const sameUnit = k.values.every((v) => v.unit === unit);
          const text = k.values.map((v) => (sameUnit ? v.raw : v.text)).join(' / ');
          // The least settled status of the joined values.
          const order = ['open', 'measure', 'target', 'working', 'locked'];
          const status = k.values.map((v) => v.status).sort((a, b) => order.indexOf(a) - order.indexOf(b))[0];
          return (
            <div key={k.label} className="tb-cell">
              <dt>{k.label}</dt>
              <dd>
                <span className="kn-v">{text}{sameUnit && unit && <span className="u"> {unit}</span>}</span>
                <span className={`chip chip--${status}`}>{status}</span>
              </dd>
            </div>
          );
        })}
      </dl>
    </section>
  );
};
