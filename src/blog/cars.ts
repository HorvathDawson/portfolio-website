/* ============================================================
   Garage — cars and post loaders
   ------------------------------------------------------------
   Every folder under content/ with a car.json is a car; its
   *.md files are that car's posts. Adding a car = adding a
   folder, no code change.

   Post bodies are lazy imports (one chunk per post), so only
   the post being read is downloaded. Metadata for lists comes
   from postIndex.ts. This module needs no Vite plugin, so the
   roadmap check script (configFile: false) can load it.
   ============================================================ */

import { carAndSlug, type Status } from './frontmatter';

export type CarKind = 'build' | 'garage';

export interface Epic {
  id: string;
  title: string;
  status: Status;
  order: number;
}

interface CarFile {
  name: string;
  /** Title of the car's log, shown in the sidebar and page title. */
  logTitle: string;
  year: string;
  make: string;
  model: string;
  /** One line, shown on the selector and used as the log's meta description. */
  description: string;
  kind: CarKind;
  status: Status;
  /** CSS colour for the car's tile and pages. */
  accent: string;
  /** Selector order (lower first). */
  order?: number;
  art: { outline: string; colored: string; width: number; height: number };
  /** True when the car has the roadmap (src/blog/roadmapData.ts). */
  roadmap?: boolean;
  /** Build cars: top-level threads of the build, in order. */
  epics?: Epic[];
}

export interface Car extends CarFile {
  /** Folder name, used in URLs: /garage/<id>. */
  id: string;
  epics: Epic[];
  roadmap: boolean;
}

const carFiles = import.meta.glob<CarFile>('/content/*/car.json', { eager: true, import: 'default' });

export const cars: Car[] = Object.entries(carFiles)
  .map(([path, c]) => ({
    ...c,
    id: path.split('/').slice(-2)[0],
    epics: [...(c.epics ?? [])].sort((a, b) => a.order - b.order),
    roadmap: Boolean(c.roadmap),
  }))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));

const carById = new Map(cars.map((c) => [c.id, c]));

export const getCar = (id: string | undefined): Car | undefined => (id ? carById.get(id) : undefined);

/** The car whose roadmap lives in roadmapData.ts (the one with `roadmap: true`). */
export const roadmapCar: Car = cars.find((c) => c.roadmap) ?? cars[0];

/* ── Paths ─────────────────────────────────────────── */

export const GARAGE_PATH = '/garage';
export const carPath = (car: string) => `${GARAGE_PATH}/${car}`;
export const postPath = (car: string, slug: string) => `${GARAGE_PATH}/${car}/${slug}`;
export const roadmapPath = (car: string) => `${GARAGE_PATH}/${car}/roadmap`;

/* ── Lazy post bodies ──────────────────────────────── */

const postModules = import.meta.glob<string>('/content/*/*.md', { query: '?raw', import: 'default' });

const loaders = new Map<string, () => Promise<string>>();
const slugsByCar = new Map<string, string[]>();
for (const [path, load] of Object.entries(postModules)) {
  const { car, slug } = carAndSlug(path);
  loaders.set(`${car}/${slug}`, load);
  slugsByCar.set(car, [...(slugsByCar.get(car) ?? []), slug]);
}

/** Slugs of a car's posts (from filenames only; no post is loaded). */
export const postSlugs = (car: string): string[] => slugsByCar.get(car) ?? [];

/** Raw Markdown of one post, or undefined if the car has no such post. */
export function loadPostRaw(car: string, slug: string): Promise<string> | undefined {
  return loaders.get(`${car}/${slug}`)?.();
}
