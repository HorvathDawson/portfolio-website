import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { TocEntry } from '../postDom';

/** Offset below the sticky bars at which a heading counts as "current". */
const ACTIVE_LINE = 0.3;

/** The heading nearest the top of the window, and how far through `body` the reader is (0–1). */
function useReading(toc: TocEntry[], body: React.RefObject<HTMLElement | null>) {
  const [state, setState] = useState<{ active?: string; progress: number }>({ progress: 0 });
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * ACTIVE_LINE;
      let active: string | undefined;
      for (const t of toc) {
        const h = document.getElementById(t.id);
        if (h && h.getBoundingClientRect().top <= line) active = t.id;
        else break;
      }
      const el = body.current;
      let progress = 0;
      if (el) {
        const r = el.getBoundingClientRect();
        const span = r.height - window.innerHeight * (1 - ACTIVE_LINE);
        progress = span > 0 ? Math.min(1, Math.max(0, (line - r.top) / span)) : 1;
      }
      setState((s) => (s.active === active && Math.abs(s.progress - progress) < 0.005 ? s : { active, progress }));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [toc, body]);
  return state;
}

/** The numbered list of sections (used by the sticky TOC and the phone Contents sheet). */
export const TocList: React.FC<{ toc: TocEntry[]; active?: string; onPick?: () => void }> = ({ toc, active, onPick }) => {
  const { search } = useLocation();
  return (
    <ol className="toc-list">
      {toc.map((t) => (
        <li key={t.id} className={`toc-item toc-item--h${t.level}`}>
          <Link
            to={{ search, hash: t.id }}
            className={t.id === active ? 'toc-link is-on' : 'toc-link'}
            aria-current={t.id === active ? 'location' : undefined}
            onClick={onPick}
          >
            <span className="toc-no" aria-hidden="true">{t.no ?? ''}</span>
            <span>{t.text}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
};

/**
 * "On this sheet": sticky table of contents beside the post (wide screens),
 * with the current section highlighted and a read-progress bar.
 * - `body`: the post body element, for the progress measure
 */
export const Toc: React.FC<{ toc: TocEntry[]; body: React.RefObject<HTMLElement | null> }> = ({ toc, body }) => {
  const { active, progress } = useReading(toc, body);
  const pct = Math.round(progress * 100);
  return (
    <nav className="toc" aria-label="On this sheet">
      <p className="toc-title">On this sheet</p>
      <TocList toc={toc} active={active} />
      <div className="toc-progress">
        <span>Read</span>
        <span className="bar" role="progressbar" aria-label="Read" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
          <i style={{ width: `${pct}%` }} />
        </span>
        <span>{pct}%</span>
      </div>
    </nav>
  );
};
