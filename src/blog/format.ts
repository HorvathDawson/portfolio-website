import type { Category, Status } from './frontmatter';
import type { CarKind } from './cars';

export const statusLabel: Record<Status, string> = {
  planning: 'Planning',
  'in-progress': 'In Progress',
  complete: 'Complete',
  decided: 'Decided',
};

export const categoryLabel: Record<Category, string> = {
  maintenance: 'Maintenance',
  repair: 'Repair',
  mod: 'Mod',
  inspection: 'Inspection',
};

export const kindLabel: Record<CarKind, string> = {
  build: 'Build log',
  garage: 'Garage log',
};

/** `2026-10-24` → `Oct 24, 2026` (or `October 24, 2026` with `long`). */
export function formatDate(date: string, long = false): string {
  if (!date) return '';
  return new Date(date + 'T00:00').toLocaleDateString('en-US', {
    month: long ? 'long' : 'short', day: 'numeric', year: 'numeric',
  });
}

export const formatKm = (km: number) => `${km.toLocaleString('en-US')} km`;
