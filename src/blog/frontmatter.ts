/* Post frontmatter: parsing and the metadata shape shared by the garage
   pages and the build-time index plugin (vite.plugins.ts, `?meta` imports).
   Pure: no marked, no DOM, so it runs in Node and in the browser. */

import { postSlug } from './postSlug';

export type Status = 'planning' | 'in-progress' | 'complete' | 'decided';

export type PostKind = 'log' | 'reference' | 'tutorial';

/** Categories for `garage`-kind cars (maintenance logs). */
export const CATEGORIES = ['maintenance', 'repair', 'mod', 'inspection'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface PostMeta {
  /** Car id: the content folder name. */
  car: string;
  slug: string;
  title: string;
  date: string;
  status: Status;
  tags: string[];
  /** Build cars: the epic this post belongs to. */
  epic?: string;
  kind?: PostKind;
  /** Garage cars: what sort of job this was. */
  category?: Category;
  mileage_km?: number;
  parts: string[];
  cost?: string;
  /** Garage cars: service items this post records, for the service table. */
  service: string[];
}

/** Parse YAML-ish frontmatter (one `key: value` per line) from a Markdown string. */
export function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    meta[key] = val;
  }
  return { meta, body: match[2] };
}

/** `[a, b]` or `a, b` → ['a', 'b']. */
export function parseList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.replace(/^\[|\]$/g, '').split(',').map((t) => t.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
}

const STATUSES: Status[] = ['planning', 'in-progress', 'complete', 'decided'];
const KINDS: PostKind[] = ['log', 'reference', 'tutorial'];

/** Typed metadata from parsed frontmatter. */
export function toPostMeta(meta: Record<string, string>, car: string, slug: string): PostMeta {
  const mileage = meta.mileage_km ? Number(meta.mileage_km.replace(/[,_\s]/g, '')) : NaN;
  return {
    car,
    slug,
    title: meta.title || slug,
    date: meta.date ?? '',
    status: STATUSES.includes(meta.status as Status) ? (meta.status as Status) : 'planning',
    tags: parseList(meta.tags),
    epic: meta.epic || undefined,
    kind: KINDS.includes(meta.kind as PostKind) ? (meta.kind as PostKind) : undefined,
    category: CATEGORIES.includes(meta.category as Category) ? (meta.category as Category) : undefined,
    mileage_km: Number.isFinite(mileage) ? mileage : undefined,
    parts: parseList(meta.parts),
    cost: meta.cost || undefined,
    service: parseList(meta.service),
  };
}

/** Car id and slug from a content path like `/content/<car>/<file>.md`. */
export function carAndSlug(path: string): { car: string; slug: string } {
  const parts = path.split('/');
  return { car: parts[parts.length - 2], slug: postSlug(path) };
}
