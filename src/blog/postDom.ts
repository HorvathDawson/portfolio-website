/* ============================================================
   Post page DOM helpers: heading anchors + TOC entries, scroll
   hints, and scroll memory for Back. The HTML from markdown.ts
   is decorated here (numbering needs the whole post).
   ============================================================ */

import type React from 'react';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** Posts with at least this many h2/h3 headings get a table of contents. */
export const TOC_MIN = 4;

/** A TOC line. `no` is the two-digit section number (h2 only). */
export interface TocEntry { id: string; level: 2 | 3; text: string; no?: string }

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
 * Decorates rendered post HTML: a `#` copy-link anchor on each h2–h4, a
 * dimension-line divider (`02 / 07`) above each h2, tables wrapped in a
 * sideways scroll box, figures numbered with a zoom button. Returns the
 * h2/h3 headings for the table of contents.
 */
export function decoratePost(html: string, path: string): { html: string; toc: TocEntry[] } {
  const toc: TocEntry[] = [];
  const h2Total = (html.match(/<h2 id=/g) ?? []).length;
  let h2 = 0;
  let fig = 0;
  const out = html
    .replace(/<h([234]) id="([^"]+)">([\s\S]*?)<\/h\1>/g, (_, level: string, id: string, inner: string) => {
      const text = toText(inner);
      const anchor = `<a class="heading-anchor" href="${escapeAttr(path)}#${id}" aria-label="Copy link to “${escapeAttr(text)}”">#</a>`;
      if (level === '2') {
        h2++;
        const no = String(h2).padStart(2, '0');
        toc.push({ id, level: 2, text, no });
        const dim = `<div class="dimline" aria-hidden="true"><span>${no} <em>/ ${String(h2Total).padStart(2, '0')}</em></span></div>`;
        return `${dim}<h2 id="${id}">${inner}${anchor}</h2>`;
      }
      if (level === '3') toc.push({ id, level: 3, text });
      return `<h${level} id="${id}">${inner}${anchor}</h${level}>`;
    })
    .replace(/<table class="sheet-table">/g, '<div class="scroll-x" role="region" aria-label="Table, scrolls sideways" tabindex="0"><table class="sheet-table">')
    .replace(/<table>/g, '<div class="scroll-x" role="region" aria-label="Table, scrolls sideways" tabindex="0"><table class="sheet-table">')
    .replace(/<\/table>/g, '</table></div>')
    // Figures: inline styles from older posts are dropped (the figure component sets the frame).
    .replace(/<figure([^>]*)>([\s\S]*?)<\/figure>/g, (_, attrs: string, inner: string) => {
      fig++;
      const cls = attrs.match(/class="([^"]*)"/)?.[1];
      const body = inner
        .replace(/\sstyle="[^"]*"/g, '')
        .replace(/(<img[^>]*>)/, `<span class="fig-card">$1<button type="button" class="fig-zoom" data-zoom aria-label="Enlarge figure ${fig}">Zoom</button></span>`)
        .replace(/<figcaption>/, `<figcaption><span class="fig-no">Fig. ${fig}</span> `);
      return `<figure class="fig${cls ? ` fig--${cls}` : ''}">${body}</figure>`;
    });
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

/* ── Scroll memory (window) ────────────────────────── */

/** Window scroll offset of each history entry, by location.key. */
const positions = new Map<string, number>();

/**
 * Garage pages scroll the window. Remembers the offset per history entry,
 * restores it on Back/Forward, jumps to #hash targets, and starts new pages
 * at the top. `ready` is anything that changes once the content is in the DOM.
 */
export function useScrollMemory(ready: unknown) {
  const location = useLocation();
  const navType = useNavigationType();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const key = location.key;
    const onScroll = () => positions.set(key, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.key]);

  useEffect(() => {
    if (!ready) return;
    const newPage = lastPath.current !== location.pathname;
    lastPath.current = location.pathname;
    const saved = positions.get(location.key);
    if (navType === 'POP' && saved !== undefined) {
      window.scrollTo(0, saved);
      // Lazy images above the fold can still change height; re-apply once.
      requestAnimationFrame(() => window.scrollTo(0, saved));
      return;
    }
    const hash = decodeURIComponent(location.hash.slice(1));
    const target = hash ? document.getElementById(hash) : null;
    if (target) target.scrollIntoView();
    else if (newPage) window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs per history entry / content, not per render
  }, [ready, location.key]);
}

/** True when the user asked for less motion. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
