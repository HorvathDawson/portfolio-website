import React, { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { LayeredArt } from '../components/visuals/LayeredArt';
import { carPath, type Car } from './cars';
import { carTransitionName, clearReturningCar, rememberEnteredCar } from './garageSceneTransition';
import './garageScene.css';

/* ============================================================
   GarageScene — the /garage page as an industrial garage
   ------------------------------------------------------------
   One bay per car, in a flat-roofed 1950s service station:
   parapet and cap flashing, corrugated walls, steel roll-up
   doors with a window strip, stencilled bay numbers, hazard-
   striped jambs, a wall lamp per bay and a gas-station pole
   sign beside the building.

   Hover / keyboard focus a bay: its lights flicker on, the door
   goes up, the car fills with the gradient and its headlights
   glow. Click / Enter: the car rolls out toward the viewer, then
   onEnter(carId) runs (inside a view transition when the browser
   has them, so the car art can morph into the log's thumbnail).
   `returning` plays the reverse on mount. Only transforms and
   opacity are animated.

   Touch has no hover: the bay nearest the middle of the screen
   opens as you scroll, with an "Enter ›" button on it; tapping
   the open bay's car, or Enter, drives it out. Tapping a closed
   bay scrolls to it and opens it (it never navigates).

   Phones (≤ 600 px, TOWER_QUERY) get the "garage tower": the
   same building stacked one floor per car on steel I-beam
   slabs, the sign on a rooftop billboard, and a freight
   elevator (open cage, scissor gate) that rides to the lit floor.
   ============================================================ */

/** Headlight centres as fractions of the art box, and which way the car faces (1 = right, -1 = left). */
interface CarRig {
  lamps: [number, number][];
  drive: number;
}

const RIGS: Record<string, CarRig> = {
  a40: { lamps: [[0.622, 0.545], [0.926, 0.43]], drive: 1 },
  autozam: { lamps: [[0.065, 0.69], [0.27, 0.72]], drive: -1 },
};
const DEFAULT_RIG: CarRig = { lamps: [[0.3, 0.68], [0.7, 0.68]], drive: 0 };

/** Keep in step with garageScene.css (--gs-out-ms, --gs-in-ms). */
const ROLL_OUT_MS = 820;
const ROLL_IN_MS = 1500;

/** Desktop: bays per row of the building. */
const ROW_BAYS = 3;

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
  /** The one short line on a bay's sign under the name (default: year · make model). */
  signLine?: (car: Car) => string;
  /** Extra lines under a bay's note (kept quiet; the car home has the details). */
  renderMeta?: (car: Car) => React.ReactNode;
  className?: string;
}

/** Sign treatments under review (GAR-013): a neon name sign, a porcelain enamel sign, sign-writing painted on the wall, or D: neon name over a small enamel plate. */
type SignStyle = 'a' | 'b' | 'c' | 'd';
const SIGN_STYLES: SignStyle[] = ['a', 'b', 'c', 'd'];
const DEFAULT_SIGNS: SignStyle = 'a';
/** Temporary switch while the owner picks: `?signs=a|b|c|d`. Remove with the unused styles once one is chosen. */
const signStyle = (): SignStyle => {
  if (typeof window === 'undefined') return DEFAULT_SIGNS;
  const v = new URLSearchParams(window.location.search).get('signs') as SignStyle | null;
  return v && SIGN_STYLES.includes(v) ? v : DEFAULT_SIGNS;
};

/** Viewports that get the tower layout (keep in step with the 600 px phone breakpoint in garageScene.css). */
const TOWER_QUERY = '(max-width: 600px)';
/** Touch screens: no hover, or a coarse pointer (iPads with a trackpad report hover, phones may not report `hover: none`). */
const TOUCH_QUERY = '(hover: none), (pointer: coarse)';

/** Live matchMedia result (false outside the browser). */
function useMedia(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

const matches = (query: string) => typeof window !== 'undefined' && window.matchMedia(query).matches;

/** "01", "02", … */
const floorNo = (i: number) => String(i + 1).padStart(2, '0');

const reducedMotion = () => matches('(prefers-reduced-motion: reduce)');

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

/* ── Signs ─────────────────────────────────────────── */

/** Neon tube lettering: an unlit outline under a lit copy that flickers on. */
const Neon: React.FC<{ text: string; className?: string }> = ({ text, className }) => {
  const words = text.split(' ').map((w, i) => (
    <React.Fragment key={i}>{i > 0 && ' '}<span className="gs-sign-word">{w}</span></React.Fragment>
  ));
  return (
    <div className={['gs-sign', className].filter(Boolean).join(' ')}>
      <span className="gs-sign-text gs-sign-text--off">{words}</span>
      <span className="gs-sign-text gs-sign-text--on">{words}</span>
    </div>
  );
};

/** Desktop: a tall gas-station pole sign beside the building, with a SERVICE panel, an oil drum and tyres at its foot. */
const PoleSign: React.FC<{ sign: string }> = ({ sign }) => (
  <div className="gs-pole">
    <span className="gs-pole-post" />
    <Neon text={sign} className="gs-sign--pole" />
    <span className="gs-pole-sub">Service</span>
    <svg className="gs-yard" viewBox="0 0 120 44">
      {/* Tyre stack */}
      <rect x="4" y="31" width="40" height="12" rx="6" />
      <rect x="6" y="19" width="36" height="12" rx="6" />
      <rect x="8" y="7" width="32" height="12" rx="6" />
      <path className="gs-yard-detail" d="M14 37 H34 M15 25 H33 M16 13 H32" />
      {/* Oil drum */}
      <path d="M84 43 V12 H112 V43" />
      <path className="gs-yard-detail" d="M84 21 H112 M84 33 H112 M90 16 H96" />
    </svg>
  </div>
);

/** A steel lattice billboard frame on the roof, carrying the neon sign (tower and the car-home hero). */
const Billboard: React.FC<{ sign: string }> = ({ sign }) => (
  <div className="gs-billboard">
    <Neon text={sign} />
    <svg className="gs-lattice" viewBox="0 0 120 24" preserveAspectRatio="none">
      <path d="M2 1 H118 M6 1 V24 M42 1 V24 M78 1 V24 M114 1 V24" />
      <path className="gs-lattice-brace" d="M6 1 L42 24 M42 1 L6 24 M42 1 L78 24 M78 1 L42 24 M78 1 L114 24 M114 1 L78 24 M2 9 H118" />
    </svg>
  </div>
);

/** Flat roof: parapet wall with cap flashing; a rooftop unit (desktop) or the sign billboard; the hoist over the tower's elevator. */
const Roof: React.FC<{ sign?: string; hoist?: boolean }> = ({ sign, hoist }) => (
  <div className="gs-top" aria-hidden="true">
    {sign ? <Billboard sign={sign} /> : (
      <svg className="gs-rooftop" viewBox="0 0 96 30">
        <path d="M2 30 V6 H62 V30 M70 30 V14 H94 V30 M78 14 V2 H86 V14" />
        <path className="gs-rooftop-detail" d="M10 12 H54 M10 17 H54 M10 22 H54" />
      </svg>
    )}
    {hoist && (
      <svg className="gs-hoist" viewBox="0 0 44 40">
        <path d="M6 40 L18 9 M38 40 L26 9 M11 27 H33" />
        <circle cx="22" cy="11" r="8" />
        <path className="gs-hoist-detail" d="M22 11 m-2 0 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 M29 13 V40" />
      </svg>
    )}
    <div className="gs-parapet" />
  </div>
);

/* ── Bay ───────────────────────────────────────────── */

interface StageProps {
  car: Car;
  carRef?: (el: HTMLDivElement | null) => void;
  /** Stencilled number ("01"); the tower also draws the elevator landing for it. */
  number?: string;
  tower?: boolean;
  /** Desktop: the pole sign stands beside this bay. */
  pole?: string;
}

/** A bay's drawing: corrugated wall, wall lamp, hazard-striped door frame, lit interior, the car (+ reflection and lamps) and the roll-up door. */
const BayStage: React.FC<StageProps> = ({ car, carRef, number, tower, pole }) => {
  const [missing, setMissing] = useState(false);
  const rig = RIGS[car.id] ?? DEFAULT_RIG;
  return (
    <div className="gs-stage" aria-hidden="true">
      <div className="gs-facade" />
      {number && <span className="gs-stencil"><span className="gs-stencil-word">Bay </span>{number}</span>}
      <span className="gs-walllamp">
        <span className="gs-walllamp-glow" />
        <svg viewBox="0 0 48 30">
          <path d="M18 1 H30 M24 1 V11" />
          <path d="M7 24 C9 13 39 13 41 24 Z" />
          <path className="gs-walllamp-bulb" d="M20 24 A4 4 0 0 0 28 24" />
        </svg>
      </span>
      <div className="gs-frame" />
      <div className="gs-opening">
        <svg className="gs-interior" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 0 L14 16 L86 16 L100 0 M14 16 L14 74 L86 74 L86 16 M14 74 L0 100 M86 74 L100 100" />
          <path className="gs-interior-shelf" d="M18 44 L34 44 M18 52 L34 52 M70 40 L82 40 L82 60 L70 60 Z" />
        </svg>
        <div className="gs-light">
          <div className="gs-wash" />
          <div className="gs-beam" />
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
          <div className="gs-door">
            <span className="gs-door-windows">{[0, 1, 2, 3, 4, 5].map((i) => <span key={i} />)}</span>
            <span className="gs-door-handle" />
          </div>
        </div>
      </div>
      <div className="gs-floor">
        <div className="gs-spill" />
      </div>
      {/* Low fog along the ground, tinted by the bay's light when it's on. */}
      <span className="gs-fog" />
      {tower && number && (
        /* Tower only: this floor's landing on the freight elevator (lit floor number, cross-braced hoistway). */
        <span className="gs-landing">
          <span className="gs-call">
            <span className="gs-call-off">{number}</span>
            <span className="gs-call-on">{number}</span>
          </span>
          <span className="gs-landing-door" />
        </span>
      )}
      {pole && <PoleSign sign={pole} />}
    </div>
  );
};

const bayStyle = (car: Car) => ({
  '--car-accent': car.accent,
  '--ar': `${car.art.width} / ${car.art.height}`,
  '--drive': (RIGS[car.id] ?? DEFAULT_RIG).drive,
} as React.CSSProperties);

interface BayProps {
  car: Car;
  href: string;
  state: 'rest' | 'leaving' | 'returning' | 'dim';
  number: string;
  tower: boolean;
  pole?: string;
  /** The elevator is at this floor (tower). */
  here: boolean;
  /** Lit by a tap or keyboard focus (touch and tower). */
  on: boolean;
  /** Desktop rows: this bay ends its row (outer wall), and/or starts a row after the first (that row's own parapet). */
  rowEnd: boolean;
  lowerRow?: 'start' | 'mid';
  carRef: (el: HTMLDivElement | null) => void;
  onActivate: (e: React.MouseEvent<HTMLAnchorElement>, car: Car, direct: boolean) => void;
  onLight: (e: React.SyntheticEvent) => void;
  signLine: string;
  renderMeta?: (car: Car) => React.ReactNode;
}

const Bay: React.FC<BayProps> = ({ car, href, state, number, tower, pole, here, on, rowEnd, lowerRow, carRef, onActivate, onLight, signLine, renderMeta }) => {
  const nameId = `gs-bay-${car.id}`;
  const cls = ['gs-bay', `is-${state}`, here && 'is-here', on && 'is-on', rowEnd && 'is-row-end', lowerRow && `is-row-${lowerRow}`].filter(Boolean).join(' ');
  return (
    <li className={cls} style={bayStyle(car)} data-bay={car.id} onFocus={onLight} onClick={onLight}>
      {/* Desktop, rows after the first: this bay's piece of that row's parapet. */}
      {lowerRow && <span className="gs-row-roof" aria-hidden="true"><span className="gs-parapet" /></span>}
      <a href={href} className="gs-bay-link" aria-labelledby={nameId} data-bay-link onClick={(e) => onActivate(e, car, false)}>
        {/* The bay's sign on the wall over the door: the name (the link's label) and one short line. */}
        <span className="gs-signband">
          <span className="gs-signboard">
            <span className="gs-bay-name" id={nameId}>
              <span className="gs-bay-name-text">{car.name}</span>
              <span className="gs-bay-name-lit" aria-hidden="true">{car.name}</span>
            </span>
            <span className="gs-sign-line">{signLine}</span>
            <span className="gs-sign-sheen" aria-hidden="true" />
          </span>
        </span>
        <BayStage car={car} carRef={carRef} number={number} tower={tower} pole={pole} />
      </a>
      {/* Shown on the lit bay for touch: the "second action" that drives the car out. */}
      <a href={href} className="gs-enter" aria-label={`Enter ${car.name}`} tabIndex={on ? undefined : -1}
        onClick={(e) => onActivate(e, car, true)}>
        Enter <span aria-hidden="true">›</span>
      </a>
      {/* Off the sign: one quiet line (the car home has the rest). */}
      <p className="gs-bay-note">{car.description}</p>
      {renderMeta && <div className="gs-bay-meta">{renderMeta(car)}</div>}
    </li>
  );
};

/**
 * One lit bay, held open (door up, lights on, car in colour): the hero of a
 * car's home page. Same industrial parts as the /garage scene; decorative.
 * - `sign`: text on the rooftop neon sign, e.g. "Bay 01"
 */
export const BayHero: React.FC<{ car: Car; sign: string }> = ({ car, sign }) => (
  <div className="gs gs--hero" aria-hidden="true">
    <div className="gs-building">
      <Roof sign={sign} />
      <ul className="gs-bays gs-bays--1">
        <li className="gs-bay is-lit" style={bayStyle(car)}>
          <BayStage car={car} />
        </li>
      </ul>
    </div>
  </div>
);

/* ── Scene ─────────────────────────────────────────── */

export const GarageScene: React.FC<GarageSceneProps> = ({
  cars,
  onEnter,
  hrefFor = (car) => carPath(car.id),
  returning,
  onReturned,
  signLine = (car) => `${car.year} · ${car.make} ${car.model}`,
  renderMeta,
  className,
}) => {
  const [signs] = useState(signStyle);
  const rootRef = useRef<HTMLDivElement>(null);
  const floorsRef = useRef<HTMLDivElement>(null);
  const cabRef = useRef<HTMLDivElement>(null);
  const carEls = useRef(new Map<string, HTMLDivElement>());
  const tower = useMedia(TOWER_QUERY);
  // Touch: the media query, or any touch press seen on the page (robust on phones that misreport media features).
  const touchMedia = useMedia(TOUCH_QUERY);
  const [sawTouch, setSawTouch] = useState(false);
  const touch = touchMedia || sawTouch;
  const back = cars.findIndex((c) => c.id === returning);
  // The lit bay (tap / keyboard focus; null = none). Coming back on a touch screen, the returning car's bay stays lit.
  const [lit, setLit] = useState<number | null>(() => (back >= 0 && matches(TOUCH_QUERY) ? back : null));
  // Tower: the floor the elevator is at (it stays where it was when the light goes off).
  const [floor, setFloor] = useState(() => Math.max(0, back));
  const [leaving, setLeaving] = useState<string | null>(null);
  const [parking, setParking] = useState<string | null>(() =>
    returning && back >= 0 && !reducedMotion() ? returning : null,
  );
  // How the current press started, and what was lit before it (a tap focuses the link before its click).
  const press = useRef<{ type: string; lit: number | null }>({ type: '', lit: null });
  // Touch: after a tap opens a floor, scroll picks wait until the page has scrolled it into place.
  const pickLock = useRef(0);
  const litRef = useRef(lit);
  useEffect(() => { litRef.current = lit; }, [lit]);

  useEffect(() => {
    if (sawTouch) return;
    const onDown = (e: PointerEvent) => { if (e.pointerType === 'touch') setSawTouch(true); };
    document.addEventListener('pointerdown', onDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onDown);
  }, [sawTouch]);

  const light = (i: number | null) => {
    setLit(i);
    if (i !== null) setFloor(i);
  };

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

  // Tower, coming back from a log: put the returning car's floor in view before the first paint.
  useLayoutEffect(() => {
    if (!tower || !returning) return;
    const stage = floorsRef.current?.querySelector(`[data-bay="${CSS.escape(returning)}"] .gs-stage`);
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight * 0.45);
    // Only on mount: later re-renders must not yank the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tower]);

  // Touch: the bay nearest the middle of the viewport opens as you scroll (and the elevator follows it).
  // The probe line slides from 30 % to 75 % of the viewport with scroll progress, so the last floor is
  // reachable even when it can't reach the middle. Reads only, rAF-throttled, passive listener.
  useEffect(() => {
    const wrap = floorsRef.current;
    if (!touch || !wrap || leaving) return;
    let raf = 0;
    const pick = () => {
      raf = 0;
      if (performance.now() < pickLock.current) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const probe = window.innerHeight * (0.3 + 0.45 * progress);
      const d = [...wrap.querySelectorAll('.gs-stage')].map((st) => {
        const r = st.getBoundingClientRect();
        return Math.abs(r.top + r.height / 2 - probe);
      });
      if (!d.length) return;
      let best = d.indexOf(Math.min(...d));
      // Bays side by side tie: keep the one that is already open.
      const cur = litRef.current;
      if (cur !== null && d[cur] !== undefined && d[cur] - d[best] < 2) best = cur;
      setLit(best);
      setFloor(best);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(pick); };
    pick();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [touch, tower, cars, leaving]);

  // Mouse / keyboard: a lit bay goes dark on a click outside the bays, or Esc. (On touch, scrolling decides.)
  useEffect(() => {
    if (lit === null || leaving || touch) return;
    const root = rootRef.current;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t?.closest || !root?.contains(t) || !t.closest('.gs-bay')) setLit(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setLit(null);
      const a = document.activeElement;
      if (a instanceof HTMLElement && root?.contains(a)) a.blur();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [lit, leaving, touch]);

  // Tower: move the cab to its floor (a transform), sized to that floor's landing.
  useLayoutEffect(() => {
    const wrap = floorsRef.current;
    const cab = cabRef.current;
    if (!tower || !wrap || !cab) return;
    const place = () => {
      const door = wrap.querySelectorAll('.gs-landing-door')[floor];
      if (!door) return;
      const w = wrap.getBoundingClientRect();
      const d = door.getBoundingClientRect();
      cab.style.height = `${d.height}px`;
      cab.style.transform = `translateY(${d.top - w.top}px)`;
    };
    place();
    // Glide from the next move on, not on the first placement.
    const t = requestAnimationFrame(() => cab.classList.add('is-ready'));
    const ro = new ResizeObserver(place);
    ro.observe(wrap);
    return () => {
      cancelAnimationFrame(t);
      ro.disconnect();
    };
  }, [tower, floor, cars]);

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

  /** A press on a bay's link (`direct`: its Enter button). A first tap only lights the bay. */
  const onActivate = (e: React.MouseEvent<HTMLAnchorElement>, car: Car, direct: boolean) => {
    // New tab / window: leave it to the browser.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const i = cars.indexOf(car);
    const pt = (e.nativeEvent as PointerEvent).pointerType;
    const tap = pt !== undefined ? pt === 'touch' : e.detail > 0 && press.current.type === 'touch';
    const litBefore = press.current.type ? press.current.lit : lit;
    press.current = { type: '', lit: null };
    e.preventDefault();
    if (leaving) return;
    if (tap && !direct && litBefore !== i) {
      openByTap(i, e.currentTarget);
      return;
    }
    if (tower) setFloor(i);
    if (reducedMotion()) {
      enter(car, false);
      return;
    }
    setLit(i);
    setLeaving(car.id);
    window.setTimeout(() => enter(car, true), ROLL_OUT_MS);
  };

  /** Touch: a tap on a closed bay opens it and scrolls it to the middle (scroll picks wait for that). */
  const openByTap = (i: number, el: Element) => {
    const smooth = !reducedMotion();
    pickLock.current = performance.now() + (smooth ? 900 : 150);
    light(i);
    el.closest('.gs-bay')?.querySelector('.gs-stage')?.scrollIntoView({ block: 'center', behavior: smooth ? 'smooth' : 'auto' });
  };

  /** Focus (keyboard) or a tap on a bay's labels lights it, on touch screens and in the tower. */
  const onLight = (car: Car) => (e: React.SyntheticEvent) => {
    if (leaving || !(tower || touch)) return;
    if (e.type === 'click') {
      if (press.current.type !== 'touch' || (e.target as Element).closest('a')) return;
      if (lit !== cars.indexOf(car)) openByTap(cars.indexOf(car), e.target as Element);
      return;
    }
    light(cars.indexOf(car));
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

  // Keyboard focus leaving the bays turns the light off.
  const onBlur = (e: React.FocusEvent<HTMLUListElement>) => {
    if (!leaving && e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node)) setLit(null);
  };

  const stateOf = (id: string): BayProps['state'] =>
    leaving === id ? 'leaving' : leaving ? 'dim' : parking === id ? 'returning' : 'rest';

  // Desktop: up to ROW_BAYS bays side by side under one roof; more cars start another row with its own parapet.
  // The pole sign stands beside the last bay of the first row.
  const cols = Math.min(cars.length, ROW_BAYS);
  const poleAt = cols - 1;

  return (
    <div ref={rootRef} className={['gs', `gs--signs-${signs}`, tower && 'gs--tower', touch && 'gs--touch', leaving && 'gs--leaving', returning && 'gs--back', className].filter(Boolean).join(' ')}>
      <div className="gs-building">
        <Roof sign={tower ? 'The Garage' : undefined} hoist={tower} />
        <div className="gs-floors" ref={floorsRef}>
          <ul className={`gs-bays gs-bays--${cols}`} style={{ '--gs-cols': cols } as React.CSSProperties} aria-label="Cars" onKeyDown={onKeyDown}
            onBlur={onBlur} onPointerDown={(e) => { press.current = { type: e.pointerType, lit }; }}>
            {cars.map((car, i) => (
              <Bay
                // Rebuild bays when the layout switches, so nothing set for one layout carries over.
                key={tower ? `tower-${car.id}` : car.id}
                car={car}
                href={hrefFor(car)}
                state={stateOf(car.id)}
                number={floorNo(i)}
                tower={tower}
                pole={!tower && i === poleAt ? 'The Garage' : undefined}
                here={tower && floor === i}
                on={lit === i}
                rowEnd={i % cols === cols - 1 || i === cars.length - 1}
                lowerRow={!tower && i >= cols ? (i % cols === 0 ? 'start' : 'mid') : undefined}
                carRef={(el) => { if (el) carEls.current.set(car.id, el); else carEls.current.delete(car.id); }}
                onActivate={onActivate}
                onLight={onLight(car)}
                signLine={signLine(car)}
                renderMeta={renderMeta}
              />
            ))}
          </ul>
          {tower && (
            <div className="gs-shaft" aria-hidden="true">
              <div className="gs-cab" ref={cabRef}>
                <span className="gs-cab-lamp" />
                <svg className="gs-gate" viewBox="0 0 24 48" preserveAspectRatio="none">
                  <path d="M0 0 L12 12 L24 0 M0 12 L12 0 L24 12 M0 12 L12 24 L24 12 M0 24 L12 12 L24 24 M0 24 L12 36 L24 24 M0 36 L12 24 L24 36 M0 36 L12 48 L24 36 M0 48 L12 36 L24 48" />
                  <path d="M12 0 V48" />
                </svg>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
