/* ============================================================
   Garage — post metadata index
   ------------------------------------------------------------
   Frontmatter only (title, date, status, category, ...). The
   `?meta` query is served by the garageMeta() plugin in
   vite.plugins.ts, so post text never lands in this chunk.
   ============================================================ */

import type { Category, PostMeta } from './frontmatter';
import { getCar, type Car } from './cars';

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

/* ── Sheets ────────────────────────────────────────── */

/** A post in its place in the car's log: sheet number, drawing number and group. */
export interface Sheet {
  post: PostMeta;
  /** 1-based position in the car's reading order. */
  no: number;
  /** Total sheets for the car. */
  of: number;
  /** e.g. `A40-FAB-02` (frontmatter `drawing:` wins). */
  drawing: string;
  /** Epic (build cars) or category / Reference (garage cars) this sheet sits in. */
  group: SheetGroupRef;
}

export interface SheetGroupRef {
  id: string;
  title: string;
  /** Short label for the rail: `E5` for epics, `MNT` style codes for categories. */
  short: string;
}

export interface SheetGroup extends SheetGroupRef {
  sheets: Sheet[];
}

const CATEGORY_TITLE: Record<Category, string> = { maintenance: 'Maintenance', repair: 'Repair', mod: 'Mods', inspection: 'Inspection' };
const groupCode = (id: string) => id.replace(/[^a-z0-9]/gi, '').slice(0, 3).toUpperCase();

/** The groups a car's sheets fall into, in order (empty groups included for epics). */
function groupsOf(car: Car): SheetGroupRef[] {
  if (car.kind === 'build') {
    return [
      ...car.epics.map((e, i) => ({ id: e.id, title: e.title, short: `E${i + 1}` })),
      { id: '_other', title: 'Other', short: '··' },
    ];
  }
  return [
    { id: 'reference', title: 'Reference', short: 'REF' },
    ...(['maintenance', 'repair', 'mod', 'inspection'] as Category[]).map((c) => ({ id: c, title: CATEGORY_TITLE[c], short: groupCode(c) })),
    { id: '_other', title: 'Log', short: 'LOG' },
  ];
}

function groupIdOf(car: Car, post: PostMeta): string {
  if (car.kind === 'build') return car.epics.some((e) => e.id === post.epic) ? post.epic! : '_other';
  if (post.kind === 'reference') return 'reference';
  return post.category ?? '_other';
}

const sheetCache = new Map<string, Sheet[]>();

/**
 * A car's posts as numbered sheets. Order: build cars by epic (car.json
 * order) then date; garage cars reference first, then by date. A post with
 * `sheet: N` in its frontmatter is moved to position N.
 */
export function sheetsFor(carId: string): Sheet[] {
  const hit = sheetCache.get(carId);
  if (hit) return hit;
  const car = getCar(carId);
  if (!car) return [];
  const groups = groupsOf(car);
  const rank = new Map(groups.map((g, i) => [g.id, i]));
  const ordered = postsFor(carId)
    .slice()
    .sort((a, b) => rank.get(groupIdOf(car, a))! - rank.get(groupIdOf(car, b))! || a.date.localeCompare(b.date) || a.slug.localeCompare(b.slug));
  // Frontmatter `sheet:` overrides, lowest first so later moves don't shift earlier ones.
  const pinned = ordered.filter((p) => p.sheet !== undefined).sort((a, b) => a.sheet! - b.sheet!);
  const list = ordered.filter((p) => p.sheet === undefined);
  for (const p of pinned) list.splice(Math.min(p.sheet! - 1, list.length), 0, p);

  const byId = new Map(groups.map((g) => [g.id, g]));
  const inGroup = new Map<string, number>();
  const sheets = list.map((post, i) => {
    const group = byId.get(groupIdOf(car, post))!;
    const n = (inGroup.get(group.id) ?? 0) + 1;
    inGroup.set(group.id, n);
    const code = group.id === '_other' ? 'GEN' : groupCode(group.id);
    return {
      post,
      no: i + 1,
      of: list.length,
      drawing: post.drawing ?? `${car.code}-${code}-${String(n).padStart(2, '0')}`,
      group,
    };
  });
  sheetCache.set(carId, sheets);
  return sheets;
}

/** The sheets grouped (epics or categories), in order. `withEmpty` keeps epics that have no sheets yet. */
export function sheetGroups(carId: string, withEmpty = false): SheetGroup[] {
  const car = getCar(carId);
  if (!car) return [];
  const sheets = sheetsFor(carId);
  return groupsOf(car)
    .map((g) => ({ ...g, sheets: sheets.filter((s) => s.group.id === g.id) }))
    .filter((g) => g.sheets.length > 0 || (withEmpty && car.kind === 'build' && g.id !== '_other'));
}

export const sheetFor = (carId: string, slug: string): Sheet | undefined => sheetsFor(carId).find((s) => s.post.slug === slug);

/** Two-digit sheet number: `07`. */
export const sheetNo = (n: number) => String(n).padStart(2, '0');
