/* ============================================================
   A40 build constants (generated)
   ------------------------------------------------------------
   Numbers come from content/a40/constants.yaml through
   scripts/a40_constants.py, which writes
   a40-constants.generated.json (committed; `npm run constants`
   regenerates it, `node scripts/check-constants.mjs` fails the
   build when it is stale or a post names an unknown constant).

   Posts:   {{name}}        formatted value with unit ("1234 mm")
            {{name:raw}}    number only ("1234")
            {{name:1}}      1 decimal;  {{name:r10}} nearest 10
            {{table:name}}  a generated Markdown table
   Roadmap: k('name') / raw('name').
   ============================================================ */

import generated from './a40-constants.generated.json';

export interface A40Constant {
  value: number | string;
  unit: string;
  text: string;
  raw: string;
  suffix: string;
  decimals: number;
  status: string;
  kind: 'input' | 'derived' | 'geometry';
  round_to?: number;
  signed?: boolean;
  label?: string;
  note: string;
}

export const a40Constants = generated.constants as Record<string, A40Constant>;
const tables = generated.tables as Record<string, string>;

/** Same rounding as format_number() in scripts/a40_constants.py: half-up, U+2212 minus. */
export function formatNumber(value: number, decimals: number, roundTo?: number, signed = false): string {
  let s: string;
  if (roundTo) s = (Math.round(value / roundTo) * roundTo).toFixed(0);
  else s = value.toFixed(decimals);
  if (s.startsWith('-')) return /^-[0.]+$/.test(s) ? s.slice(1) : `−${s.slice(1)}`;
  return signed && value !== 0 ? `+${s}` : s;
}

function get(name: string, where: string): A40Constant {
  const c = a40Constants[name];
  if (!c) throw new Error(`${where}: unknown constant {{${name}}} (content/a40/constants.yaml)`);
  return c;
}

/** One placeholder's text. `mods` are the `:raw`, `:N` and `:rN` modifiers. */
function render(name: string, mods: string[], where: string): string {
  if (name === 'table') {
    const t = tables[mods[0]];
    if (mods.length !== 1 || t === undefined) throw new Error(`${where}: unknown table {{table:${mods.join(':')}}}`);
    return t;
  }
  const c = get(name, where);
  let raw = false;
  let decimals: number | undefined;
  let roundTo: number | undefined;
  for (const m of mods) {
    if (m === 'raw') raw = true;
    else if (/^\d+$/.test(m)) decimals = Number(m);
    else if (/^r\d+$/.test(m)) roundTo = Number(m.slice(1));
    else throw new Error(`${where}: unknown modifier :${m} in {{${name}}}`);
  }
  if (typeof c.value === 'string') return c.value;
  if (decimals === undefined && roundTo === undefined) return raw ? c.raw : c.text;
  const n = formatNumber(c.value, decimals ?? c.decimals, roundTo ?? (decimals === undefined ? c.round_to : undefined), c.signed);
  return raw ? n : n + c.suffix;
}

const PLACEHOLDER = /\{\{\s*([a-z][a-z0-9_]*)((?::[a-z0-9]+)*)\s*\}\}/g;

/** Replace every {{placeholder}} in `text`. Throws on an unknown name; `where` names the post. */
export function substituteConstants(text: string, where: string): string {
  return text.replace(PLACEHOLDER, (_, name: string, mods: string) => render(name, mods.split(':').filter(Boolean), where));
}

/** Names used in `text` (for checks). */
export const placeholdersIn = (text: string): string[] => [...text.matchAll(PLACEHOLDER)].map((m) => m[0]);

/** Formatted value with unit, e.g. k('front_track') → "1234 mm". */
export const k = (name: string, ...mods: string[]): string => render(name, mods, 'roadmapData.ts');
/** Number only, e.g. raw('front_track') → "1234". */
export const raw = (name: string, ...mods: string[]): string => render(name, ['raw', ...mods], 'roadmapData.ts');

/**
 * The one hook every reader of post Markdown uses (blogData.ts parsePost, the
 * search index in vite.plugins.ts): substitutes constants in A40 post bodies,
 * returns other cars' bodies unchanged.
 */
export const substitutePostBody = (car: string, slug: string, body: string): string =>
  car === 'a40' ? substituteConstants(body, `content/a40/${slug}.md`) : body;
