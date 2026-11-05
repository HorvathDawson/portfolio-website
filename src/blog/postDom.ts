/* ============================================================
   Post page DOM helpers: heading anchors + TOC entries, scroll
   hints, and scroll memory for Back. The HTML from blogData.ts
   is decorated here, after conversion, so the Markdown
   converter stays untouched.
   ============================================================ */

import type React from 'react';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Posts with at least this many h2/h3 headings get a table of contents. */
export const TOC_MIN = 4;

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

