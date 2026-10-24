import React, { useEffect, useRef, useState } from 'react';
import { LayeredArt } from '../components/visuals/LayeredArt';
import { carPath, type Car } from './cars';
import { carTransitionName, clearReturningCar, rememberEnteredCar } from './garageSceneTransition';
import './garageScene.css';

/* ============================================================
   GarageScene — the /garage page as a two-bay (N-bay) garage
   ------------------------------------------------------------
   One bay per car. Hover / focus a bay: its strip light
   flickers on, the roll-up door goes up, the car fills with the
   gradient and its headlights glow. Click / Enter: the car rolls
   out toward the viewer, then onEnter(carId) runs (inside a view
   transition when the browser has them, so the car art can morph
   into the log's sidebar thumbnail). `returning` plays the
   reverse on mount: the car backs into its bay, the door comes
   down. Only transforms and opacity are animated.
   ============================================================ */

/** Headlight centres as fractions of the art box, and which way the car faces (1 = right, -1 = left). */
interface CarRig {
  lamps: [number, number][];
  drive: number;
}

const RIGS: Record<string, CarRig> = {
  a40: { lamps: [[0.598, 0.43], [0.917, 0.35]], drive: 1 },
  autozam: { lamps: [[0.065, 0.69], [0.27, 0.72]], drive: -1 },
};
const DEFAULT_RIG: CarRig = { lamps: [[0.3, 0.68], [0.7, 0.68]], drive: 0 };

/** Keep in step with garageScene.css (--gs-out-ms, --gs-in-ms). */
const ROLL_OUT_MS = 820;
const ROLL_IN_MS = 1500;

export interface GarageSceneProps {
  cars: Car[];
  /** Called after the roll-out. May return a promise; the view transition waits for it and for the scene to unmount. */
  onEnter?: (carId: string) => void | Promise<unknown>;
  /** Link target for each bay (default /garage/<id>). Without onEnter the page navigates here after the roll-out. */
  hrefFor?: (car: Car) => string;
  /** Car id that should reverse back into its bay on mount (see returningCar()). */
  returning?: string | null;
  /** Called once the returning car is parked (or straight away with reduced motion). */
  onReturned?: () => void;
  /** Extra lines under a bay's description (status chips, latest post...). */
  renderMeta?: (car: Car) => React.ReactNode;
  className?: string;
}

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Resolves when `done()` is true (checked each frame) or after `ms`. */
const until = (done: () => boolean, ms: number) =>
  new Promise<void>((resolve) => {
    const end = performance.now() + ms;
    const tick = () => (done() || performance.now() > end ? resolve() : requestAnimationFrame(tick));
    tick();
  });

/* ── Art ───────────────────────────────────────────── */

const Art: React.FC<{ car: Car; onMissing?: () => void }> = ({ car, onMissing }) => (
  <>
    <LayeredArt className="gs-art gs-art--outline" width={car.art.width} height={car.art.height}
      layers={[{ layer: 'background', src: car.art.outline, onError: onMissing }]} />
    <LayeredArt className="gs-art gs-art--colored" width={car.art.width} height={car.art.height}
      layers={[{ layer: 'foreground', src: car.art.colored }]} />
  </>
);

/* ── Bay ───────────────────────────────────────────── */

interface BayProps {
  car: Car;
  href: string;
  state: 'rest' | 'leaving' | 'returning' | 'dim';
  carRef: (el: HTMLDivElement | null) => void;
  onActivate: (e: React.MouseEvent<HTMLAnchorElement>, car: Car) => void;
  renderMeta?: (car: Car) => React.ReactNode;
}

const Bay: React.FC<BayProps> = ({ car, href, state, carRef, onActivate, renderMeta }) => {
  const [missing, setMissing] = useState(false);
  const rig = RIGS[car.id] ?? DEFAULT_RIG;
  const nameId = `gs-bay-${car.id}`;
  const style = {
    '--car-accent': car.accent,
    '--ar': `${car.art.width} / ${car.art.height}`,
    '--drive': rig.drive,
  } as React.CSSProperties;

  return (
    <li className={`gs-bay is-${state}`} style={style} data-bay={car.id}>
      <a href={href} className="gs-bay-link" aria-labelledby={nameId} data-bay-link onClick={(e) => onActivate(e, car)}>
        <div className="gs-stage" aria-hidden="true">
          <div className="gs-facade" />
          <div className="gs-frame" />
          <div className="gs-opening">
            <svg className="gs-interior" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0 L14 16 L86 16 L100 0 M14 16 L14 74 L86 74 L86 16 M14 74 L0 100 M86 74 L100 100" />
              <path className="gs-interior-shelf" d="M18 44 L34 44 M18 52 L34 52 M70 40 L82 40 L82 60 L70 60 Z" />
            </svg>
            <div className="gs-light">
              <div className="gs-wash" />
              <div className="gs-tube-glow" />
            </div>
            <div className="gs-tube" />
            <div className="gs-reflect">
              {!missing && <Art car={car} />}
            </div>
            <div className="gs-car" ref={carRef}>
              <div className="gs-car-body">
                {missing ? (
                  <div className="gs-art-missing"><span>{car.model}</span><small>art coming soon</small></div>
                ) : (
                  <Art car={car} onMissing={() => setMissing(true)} />
                )}
                {!missing && rig.lamps.map(([x, y], i) => (
                  <span key={i} className="gs-lamp" style={{ left: `${x * 100}%`, top: `${y * 100}%` }} />
                ))}
              </div>
            </div>
            <div className="gs-door-clip">
              <div className="gs-door"><span className="gs-door-handle" /></div>
            </div>
          </div>
          <div className="gs-floor">
            <div className="gs-spill" />
          </div>
        </div>
        <span className="gs-bay-name" id={nameId}>{car.name}</span>
      </a>
      <p className="gs-bay-sub">{car.year} · {car.make} {car.model}</p>
      <p className="gs-bay-desc">{car.description}</p>
      {renderMeta?.(car)}
    </li>
  );
};

/* ── Scene ─────────────────────────────────────────── */

export const GarageScene: React.FC<GarageSceneProps> = ({
  cars,
  onEnter,
  hrefFor = (car) => carPath(car.id),
  returning,
  onReturned,
  renderMeta,
  className,
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const carEls = useRef(new Map<string, HTMLDivElement>());
  const [leaving, setLeaving] = useState<string | null>(null);
  const [parking, setParking] = useState<string | null>(() =>
    returning && cars.some((c) => c.id === returning) && !reducedMotion() ? returning : null,
  );

  // Reverse in: the returning car carries the transition name while it parks
  // (so a view transition on the way back can morph the thumbnail into it).
  const onReturnedRef = useRef(onReturned);
  useEffect(() => { onReturnedRef.current = onReturned; });
  useEffect(() => {
    if (!returning) return;
    const el = carEls.current.get(returning);
    const done = () => {
      el?.style.removeProperty('view-transition-name');
      setParking(null);
      clearReturningCar();
      onReturnedRef.current?.();
    };
    if (!el || reducedMotion()) {
      done();
      return;
    }
    el.style.setProperty('view-transition-name', carTransitionName(returning));
    const t = window.setTimeout(done, ROLL_IN_MS);
    return () => window.clearTimeout(t);
  }, [returning]);

  // Touch screens have no hover: open the bay that is in view.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !window.matchMedia('(hover: none)').matches) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('is-inview', e.intersectionRatio >= 0.6);
    }, { threshold: [0, 0.6, 1] });
    root.querySelectorAll('.gs-bay').forEach((b) => io.observe(b));
    return () => io.disconnect();
  }, [cars]);

  const enter = (car: Car, morph: boolean) => {
    rememberEnteredCar(car.id);
    if (!onEnter) {
      window.location.assign(hrefFor(car));
      return;
    }
    const root = rootRef.current;
    if (typeof document.startViewTransition !== 'function') {
      void onEnter(car.id);
      return;
    }
    const el = carEls.current.get(car.id);
    if (morph && el) el.style.setProperty('view-transition-name', carTransitionName(car.id));
    document.startViewTransition(async () => {
      await onEnter(car.id);
      // Wait for the router to swap the page (lazy routes may take a moment).
      await until(() => !root?.isConnected, 1000);
    });
  };

  const onActivate = (e: React.MouseEvent<HTMLAnchorElement>, car: Car) => {
    // New tab / window: leave it to the browser.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (leaving) return;
    if (reducedMotion()) {
      enter(car, false);
      return;
    }
    setLeaving(car.id);
    window.setTimeout(() => enter(car, true), ROLL_OUT_MS);
  };

  // Arrow keys move between bays (same as the old tile grid).
  const onKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const links = [...e.currentTarget.querySelectorAll<HTMLAnchorElement>('[data-bay-link]')];
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    const to = e.key === 'Home' ? 0 : e.key === 'End' ? links.length - 1 : step !== undefined ? (i + step + links.length) % links.length : -1;
    if (to < 0) return;
    e.preventDefault();
    links[to].focus();
  };

  const stateOf = (id: string): BayProps['state'] =>
    leaving === id ? 'leaving' : leaving ? 'dim' : parking === id ? 'returning' : 'rest';

  return (
    <div ref={rootRef} className={['gs', leaving && 'gs--leaving', className].filter(Boolean).join(' ')}>
      <div className="gs-building">
        <div className="gs-top" aria-hidden="true">
          <div className="gs-sign">
            <span className="gs-sign-text gs-sign-text--off">The Garage</span>
            <span className="gs-sign-text gs-sign-text--on">The Garage</span>
          </div>
          <svg className="gs-roof" viewBox="0 0 1000 100" preserveAspectRatio="none">
            <path className="gs-roof-gable" d="M0 100 L500 14 L1000 100 Z" />
            <path className="gs-roof-board" d="M-26 94 L500 3 L1026 94 L1026 102 L500 12 L-26 102 Z" />
          </svg>
          <svg className="gs-vent" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" />
            <path d="M8 13 H32 M5 20 H35 M8 27 H32" />
          </svg>
        </div>
        <ul className={`gs-bays gs-bays--${Math.min(cars.length, 2)}`} aria-label="Cars" onKeyDown={onKeyDown}>
          {cars.map((car) => (
            <Bay
              key={car.id}
              car={car}
              href={hrefFor(car)}
              state={stateOf(car.id)}
              carRef={(el) => { if (el) carEls.current.set(car.id, el); else carEls.current.delete(car.id); }}
              onActivate={onActivate}
              renderMeta={renderMeta}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};
