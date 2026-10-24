import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { SearchDoc } from 'virtual:garage-search';
import { cars, getCar, postPath } from './cars';

/* ============================================================
   Sidebar search: post titles, headings and text.
   The index (virtual:garage-search, built by vite.plugins.ts)
   is fetched on first focus, so it is not in the page bundle.
   Keyboard: "/" focuses the box, ArrowDown moves into the
   results, arrows move between them, Escape goes back / clears.
   ============================================================ */

let indexPromise: Promise<SearchDoc[]> | undefined;
const loadIndex = () => (indexPromise ??= import('virtual:garage-search').then((m) => m.default));

interface Hit {
  car: string;
  slug: string;
  title: string;
  /** Heading id, '' for the post itself. */
  id: string;
  heading: string;
  snippet: string;
  score: number;
}

const norm = (s: string) => s.toLowerCase();

function snippet(text: string, terms: string[], width = 120): string {
  const lower = norm(text);
  const at = Math.min(...terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0));
  if (!Number.isFinite(at)) return text.slice(0, width) + (text.length > width ? '…' : '');
  const start = Math.max(0, at - 40);
  const s = text.slice(start, start + width);
  return (start > 0 ? '…' : '') + s + (start + width < text.length ? '…' : '');
}

function search(docs: SearchDoc[], query: string, car: string | null): Hit[] {
  const terms = norm(query).split(/\s+/).filter((t) => t.length > 0);
  if (terms.length === 0 || query.trim().length < 2) return [];
  const hits: Hit[] = [];
  for (const doc of docs) {
    if (car && doc.car !== car) continue;
    const title = norm(doc.title);
    const titleHits = terms.filter((t) => title.includes(t)).length;
    const postHits: Hit[] = [];
    for (const sec of doc.sections) {
      const heading = norm(sec.heading);
      const text = norm(sec.text);
      // Every term must appear in the title, this heading or this section's text.
      if (!terms.every((t) => title.includes(t) || heading.includes(t) || text.includes(t))) continue;
      const headingHits = terms.filter((t) => heading.includes(t)).length;
      const textHits = terms.filter((t) => text.includes(t)).length;
      postHits.push({
        car: doc.car, slug: doc.slug, title: doc.title, id: sec.id, heading: sec.heading,
        snippet: snippet(sec.text || sec.heading, terms),
        score: titleHits * 10 + headingHits * 6 + textHits,
      });
    }
    if (postHits.length === 0 && titleHits === terms.length) {
      postHits.push({ car: doc.car, slug: doc.slug, title: doc.title, id: '', heading: '', snippet: '', score: titleHits * 10 });
    }
    postHits.sort((a, b) => b.score - a.score);
    // A post whose title matches leads with the post itself, then its best sections.
    if (titleHits === terms.length && postHits[0]?.id) {
      postHits.unshift({ ...postHits[0], id: '', heading: '', score: postHits[0].score + 1 });
    }
    hits.push(...postHits.slice(0, 3));
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, 30);
}

/** Highlight the query terms in `text`. */
const Marked: React.FC<{ text: string; terms: string[] }> = ({ text, terms }) => {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return <>{text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}</>;
};

export const PostSearch: React.FC<{ car: string }> = ({ car }) => {
  const [query, setQuery] = useState('');
  const [allCars, setAllCars] = useState(false);
  const [docs, setDocs] = useState<SearchDoc[]>();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const multiCar = cars.length > 1;

  const ensureIndex = () => { if (!docs) loadIndex().then(setDocs); };

  // "/" focuses the search box (unless typing somewhere already).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, select, [contenteditable="true"]')) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const terms = useMemo(() => norm(query).split(/\s+/).filter(Boolean), [query]);
  const hits = useMemo(() => (docs ? search(docs, query, allCars ? null : car) : []), [docs, query, allCars, car]);
  const active = query.trim().length >= 2;

  const links = () => [...(listRef.current?.querySelectorAll<HTMLAnchorElement>('a') ?? [])];
  const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || (e.key === 'Enter' && hits.length)) {
      const first = links()[0];
      if (!first) return;
      e.preventDefault();
      if (e.key === 'Enter') first.click();
      else first.focus();
    } else if (e.key === 'Escape' && query) {
      e.preventDefault();
      setQuery('');
    }
  };
  const onListKey = (e: React.KeyboardEvent<HTMLUListElement>) => {
    const all = links();
    const i = all.indexOf(document.activeElement as HTMLAnchorElement);
    if (i < 0) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const to = i + (e.key === 'ArrowDown' ? 1 : -1);
      if (to < 0) inputRef.current?.focus();
      else all[Math.min(to, all.length - 1)].focus();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  return (
    <div className="post-search" role="search">
      <label className="sr-only" htmlFor={`${listId}-q`}>Search posts</label>
      <div className="post-search-box">
        <input
          ref={inputRef}
          id={`${listId}-q`}
          type="search"
          className="post-search-input"
          placeholder="Search posts…"
          title="Search post titles, headings and text (shortcut: /)"
          aria-keyshortcuts="/"
          value={query}
          autoComplete="off"
          spellCheck={false}
          onFocus={ensureIndex}
          onChange={(e) => { ensureIndex(); setQuery(e.target.value); }}
          onKeyDown={onInputKey}
          aria-controls={listId}
          aria-describedby={`${listId}-status`}
        />
      </div>
      {multiCar && (
        <label className="post-search-scope">
          <input type="checkbox" checked={allCars} onChange={(e) => setAllCars(e.target.checked)} />
          All cars
        </label>
      )}
      <p className="sr-only" id={`${listId}-status`} role="status" aria-live="polite">
        {active ? (docs ? `${hits.length} ${hits.length === 1 ? 'result' : 'results'}` : 'Loading search') : ''}
      </p>
      {active && (
        <ul className="post-search-results" id={listId} ref={listRef} onKeyDown={onListKey} aria-label="Search results">
          {!docs && <li className="post-search-empty">Loading…</li>}
          {docs && hits.length === 0 && <li className="post-search-empty">No matches.</li>}
          {hits.map((h) => (
            <li key={`${h.car}/${h.slug}#${h.id}`}>
              <Link
                to={postPath(h.car, h.slug) + (h.id ? `#${h.id}` : '')}
                className="post-search-hit"
                onClick={() => setQuery('')}
              >
                <span className="post-search-title">
                  {allCars && h.car !== car && <span className="post-search-car">{getCar(h.car)?.model} · </span>}
                  <Marked text={h.title} terms={terms} />
                </span>
                {h.heading && <span className="post-search-heading">§ <Marked text={h.heading} terms={terms} /></span>}
                {h.snippet && <span className="post-search-snippet"><Marked text={h.snippet} terms={terms} /></span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
