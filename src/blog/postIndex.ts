/* ============================================================
   Garage — post metadata index
   ------------------------------------------------------------
   Frontmatter only (title, date, status, category, ...). The
   `?meta` query is served by the garageMeta() plugin in
   vite.plugins.ts, so post text never lands in this chunk.
   ============================================================ */

import type { PostMeta } from './frontmatter';

const metaModules = import.meta.glob<PostMeta>('/content/*/*.md', { eager: true, query: '?meta', import: 'default' });

const byCar = new Map<string, PostMeta[]>();
for (const meta of Object.values(metaModules)) {
  byCar.set(meta.car, [...(byCar.get(meta.car) ?? []), meta]);
}
// Oldest first (reading order for build logs; prev/next follows this).
for (const list of byCar.values()) list.sort((a, b) => a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug));

/** A car's posts, oldest first. */
export const postsFor = (car: string): PostMeta[] => byCar.get(car) ?? [];

/** A car's most recent post. */
export const latestPost = (car: string): PostMeta | undefined => postsFor(car).at(-1);

export const findPost = (car: string, slug: string): PostMeta | undefined =>
  postsFor(car).find((p) => p.slug === slug);

export interface ServiceRow {
  item: string;
  date: string;
  mileage_km?: number;
  post: PostMeta;
}

/**
 * Service table for a garage car: for each item named in a post's `service:`
 * frontmatter list, the most recent post that did it.
 */
export function serviceTable(car: string): ServiceRow[] {
  const rows = new Map<string, ServiceRow>();
  for (const post of postsFor(car)) {
    for (const item of post.service) {
      const key = item.toLowerCase();
      const prev = rows.get(key);
      if (!prev || post.date >= prev.date) rows.set(key, { item, date: post.date, mileage_km: post.mileage_km, post });
    }
  }
  return [...rows.values()].sort((a, b) => a.item.localeCompare(b.item));
}
