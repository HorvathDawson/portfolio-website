/* ============================================================
   Post page helpers: heading anchors + table of contents,
   scroll memory for Back, and the "Roadmap tasks" box.
   The rendered HTML from blogData.ts is decorated here, after
   conversion, so the Markdown converter stays untouched.
   ============================================================ */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigationType } from 'react-router-dom';
import { roadmapCar, roadmapPath } from './cars';
import { statusLabel } from './format';
import type { RoadmapTask } from './roadmapData';

export interface TocEntry { id: string; level: 2 | 3; text: string }

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const toText = (html: string) =>
  html
    // KaTeX: keep the TeX source, drop the rendered glyph markup.
    .replace(/<span class="katex">[\s\S]*?<annotation encoding="application\/x-tex">([\s\S]*?)<\/annotation>[\s\S]*?<\/span><\/span><\/span>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e])
    .replace(/\s+/g, ' ')
    .trim();

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Adds a `#` copy-link anchor to each h2–h4, wraps tables in a sideways
 * scroll box, and lists the h2/h3 headings for the table of contents.
 */
export function decoratePost(html: string, path: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const out = html
    .replace(/<h([234]) id="([^"]+)">([\s\S]*?)<\/h\1>/g, (_, level: string, id: string, inner: string) => {
      const text = toText(inner);
      if (level !== '4') toc.push({ id, level: Number(level) as 2 | 3, text });
      return `<h${level} id="${id}">${inner}<a class="heading-anchor" href="${escapeAttr(path)}#${id}" aria-label="Copy link to “${escapeAttr(text)}”">#</a></h${level}>`;
    })
    .replace(/<table>/g, '<div class="scroll-x" role="region" aria-label="Table, scrolls sideways" tabindex="0"><table>')
    .replace(/<\/table>/g, '</table></div>');
  return { html: out, toc };
}

/**
 * Marks sideways-scrolling boxes (tables, display maths) that overflow, so
 * CSS can show the scroll hint and they are keyboard-focusable.
 */
export function useOverflowHints(root: React.RefObject<HTMLElement | null>, html: string | undefined) {
  useEffect(() => {
    const el = root.current;
    if (!el || !html) return;
    const boxes = [...el.querySelectorAll<HTMLElement>('.scroll-x, .katex-display')];
    const update = () => {
      for (const b of boxes) {
        const over = b.scrollWidth > b.clientWidth + 1;
        b.toggleAttribute('data-overflow', over);
        if (b.classList.contains('katex-display')) {
          if (over) { b.tabIndex = 0; b.setAttribute('role', 'region'); b.setAttribute('aria-label', 'Equation, scrolls sideways'); }
          else { b.removeAttribute('tabindex'); b.removeAttribute('role'); b.removeAttribute('aria-label'); }
        }
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [root, html]);
}

/* ── Scroll memory ─────────────────────────────────── */

/** Scroll offset of each history entry's scroller, by location.key. */
const positions = new Map<string, number>();

/**
 * For an inner scroll container: remembers its offset per history entry,
 * restores it on Back/Forward, jumps to #hash targets, starts new pages at
 * the top, and focuses the scroller so Page Down / Space scroll it.
 * `ready` is anything that changes once the content is in the DOM.
 */
export function useScrollMemory(ref: React.RefObject<HTMLElement | null>, ready: unknown, focus = true) {
  const location = useLocation();
  const navType = useNavigationType();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const key = location.key;
    const onScroll = () => positions.set(key, el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [ref, location.key, ready]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !ready) return;
    const newPage = lastPath.current !== location.pathname;
    lastPath.current = location.pathname;
    if (newPage && focus && !el.contains(document.activeElement)) el.focus({ preventScroll: true });
    const saved = positions.get(location.key);
    if (navType === 'POP' && saved !== undefined) {
      el.scrollTop = saved;
      // Lazy images above the fold can still change height; re-apply once.
      requestAnimationFrame(() => { el.scrollTop = saved; });
      return;
    }
    const hash = decodeURIComponent(location.hash.slice(1));
    const target = hash ? document.getElementById(hash) : null;
    if (target && el.contains(target)) target.scrollIntoView();
    else if (newPage) el.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per history entry / content, not per render
  }, [ready, location.key]);
}

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
      const top = el.getBoundingClientRect().top + 80;
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

/** Posts with at least this many h2/h3 headings get a table of contents. */
export const TOC_MIN = 4;

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
