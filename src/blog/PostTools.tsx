/* ============================================================
   Post page parts: table of contents and the "Roadmap tasks"
   box. HTML decoration and scroll handling are in postDom.ts.
   ============================================================ */

import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { roadmapCar, roadmapPath } from './cars';
import { statusLabel } from './format';
import type { TocEntry } from './postDom';
import type { RoadmapTask } from './roadmapData';

/* ── Table of contents ─────────────────────────────── */

/** The heading nearest the top of `scroller`, for highlighting the TOC. */
function useActiveHeading(scroller: React.RefObject<HTMLElement | null>, toc: TocEntry[]): string | undefined {
  const [active, setActive] = useState<string>();
  useEffect(() => {
    const el = scroller.current;
    if (!el || toc.length === 0) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const top = el.getBoundingClientRect().top + el.clientHeight * 0.3;
      let current: string | undefined;
      for (const t of toc) {
        const h = document.getElementById(t.id);
        if (h && h.getBoundingClientRect().top <= top) current = t.id;
        else break;
      }
      setActive(current);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, [scroller, toc]);
  return active;
}

const TocList: React.FC<{ toc: TocEntry[]; active?: string }> = ({ toc, active }) => {
  const { search } = useLocation();
  return (
    <ol className="toc-list">
      {toc.map((t) => (
        <li key={t.id} className={`toc-item toc-item--h${t.level}`}>
          <Link
            to={{ search, hash: t.id }}
            className={t.id === active ? 'toc-link toc-link--on' : 'toc-link'}
            aria-current={t.id === active ? 'location' : undefined}
          >
            {t.text}
          </Link>
        </li>
      ))}
    </ol>
  );
};

/** Sticky "On this page" column (wide screens only, via CSS). */
export const TocAside: React.FC<{ toc: TocEntry[]; scroller: React.RefObject<HTMLElement | null> }> = ({ toc, scroller }) => {
  const active = useActiveHeading(scroller, toc);
  return (
    <nav className="toc toc--aside" aria-label="On this page">
      <p className="toc-title">On this page</p>
      <TocList toc={toc} active={active} />
    </nav>
  );
};

/** Collapsible "Contents" block under the post title (narrow screens). */
export const TocInline: React.FC<{ toc: TocEntry[] }> = ({ toc }) => (
  <details className="toc toc--inline">
    <summary>Contents <span className="toc-count">({toc.length} sections)</span></summary>
    <nav aria-label="Contents">
      <TocList toc={toc} />
    </nav>
  </details>
);

/* ── Roadmap tasks box ─────────────────────────────── */

/** Roadmap tasks whose `posts` include this post, loaded with the roadmap chunk. */
export const RoadmapTasks: React.FC<{ car: string; slug: string }> = ({ car, slug }) => {
  const [state, setState] = useState<{ slug: string; tasks?: RoadmapTask[]; error?: boolean }>();
  const enabled = car === roadmapCar.id && roadmapCar.roadmap;
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    import('./roadmapData')
      .then((m) => { if (live) setState({ slug, tasks: m.roadmap.tasks.filter((t) => t.posts?.includes(slug)) }); })
      .catch(() => { if (live) setState({ slug, error: true }); });
    return () => { live = false; };
  }, [enabled, slug]);

  if (!enabled || state?.slug !== slug) return null;
  if (state.error) {
    return <aside className="post-tasks"><p className="post-tasks-title">Roadmap tasks</p><p className="post-tasks-err">The roadmap could not be loaded.</p></aside>;
  }
  const tasks = state.tasks ?? [];
  if (tasks.length === 0) return null;
  return (
    <aside className="post-tasks" aria-labelledby="post-tasks-h">
      <p className="post-tasks-title" id="post-tasks-h">Roadmap tasks</p>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <span className={`sb-status-dot sb-dot--${t.status}`} aria-hidden="true" />
            <Link to={`${roadmapPath(car)}?view=tree&task=${encodeURIComponent(t.id)}`}>{t.title}</Link>
            <span className={`post-tasks-status blog-status--${t.status}`}>{statusLabel[t.status]}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};
