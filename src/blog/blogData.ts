import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { postSlug } from './postSlug';

marked.use(markedKatex({ throwOnError: false, nonStandard: true }));

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
const decodeEntities = (s: string) => s.replace(/&(amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e]);

/** Heading ids already used in the post being parsed (reset per post). */
const usedHeadingIds = new Map<string, number>();

/** GitHub-style heading slug, so `./post#some-heading` links resolve. */
function headingId(html: string): string {
  const base = decodeEntities(html.replace(/<[^>]+>/g, ''))
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
  const n = usedHeadingIds.get(base) ?? 0;
  usedHeadingIds.set(base, n + 1);
  return n === 0 ? base : `${base}-${n}`;
}

marked.use({
  renderer: {
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      return `<h${depth} id="${headingId(inner)}">${inner}</h${depth}>\n`;
    },
  },
});

export type Status = 'planning' | 'in-progress' | 'complete' | 'decided';

export type PostKind = 'log' | 'reference' | 'tutorial';

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  status: Status;
  tags: string[];
  epic: string;
  kind?: PostKind;
}

export interface BlogPost extends BlogPostMeta {
  html: string;
  /** Plain-text opening of the post, for meta descriptions. */
  excerpt: string;
}

export interface Epic {
  id: string;
  title: string;
  status: Status;
  order: number;
}

/** Epics define the top-level threads of the build. */
export const epics: Epic[] = [
  { id: 'project',      title: 'Project Overview',              status: 'complete',     order: 0 },
  { id: 'research',     title: 'Research & Initial Decisions',  status: 'complete',     order: 1 },
  { id: 'narrowing',    title: 'Narrowing & Geometry Analysis', status: 'in-progress',  order: 2 },
  { id: 'design',       title: 'Pre-Build Design',              status: 'in-progress',  order: 3 },
  { id: 'fabrication',  title: 'Fabrication',                   status: 'planning',     order: 4 },
  { id: 'finishing',    title: 'Finishing & Interior',          status: 'planning',     order: 5 },
];

/** Parse YAML-ish frontmatter from a Markdown string. */
function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
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

function parseTags(raw: string | undefined): string[] {
  if (!raw) return [];
  // handles [tag1, tag2] YAML shorthand
  return raw.replace(/^\[|\]$/g, '').split(',').map(t => t.trim()).filter(Boolean);
}

/** First paragraph of rendered HTML as plain text, cut to about `max` characters. */
function excerpt(html: string, max = 160): string {
  const text = decodeEntities((html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '').replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(' ', max - 1)).replace(/[,;:.\s]+$/, '') + '…';
}

/** Convert raw Markdown (with frontmatter) into a BlogPost. */
export function parsePost(raw: string, slug: string): BlogPost {
  const { meta, body } = parseFrontmatter(raw);
  const rawKind = meta.kind as PostKind | undefined;
  const kind: PostKind | undefined =
    rawKind === 'log' || rawKind === 'reference' || rawKind === 'tutorial' ? rawKind : undefined;
  usedHeadingIds.clear();
  // Lazy-load post images so long posts don't download every plot up front.
  const html = (marked.parse(body, { async: false }) as string)
    .replace(/<img /g, '<img loading="lazy" decoding="async" ');
  return {
    slug,
    title: meta.title ?? slug,
    date: meta.date ?? '',
    status: (meta.status as BlogPost['status']) ?? 'planning',
    tags: parseTags(meta.tags),
    epic: meta.epic ?? 'planning',
    kind,
    html,
    excerpt: excerpt(html),
  };
}

// --- Static import of all posts ---
// Vite's import.meta.glob with `?raw` gives us the raw Markdown strings at build time.
const modules = import.meta.glob('/content/a40/*.md', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export const allPosts: BlogPost[] = Object.entries(modules)
  .map(([path, raw]) => parsePost(raw, postSlug(path)))
  .sort((a, b) => a.date.localeCompare(b.date));

/** Meta description for the build log as a whole: the overview post's opening. */
export const buildLogDescription = (allPosts.find((p) => p.slug === 'overview') ?? allPosts[0]).excerpt;

/** Posts grouped by epic, ordered by epic.order then post date. */
export function postsByEpic(): { epic: Epic; posts: BlogPost[] }[] {
  return epics
    .map((epic) => ({
      epic,
      posts: allPosts.filter((p) => p.epic === epic.id),
    }))
    .filter((g) => g.posts.length > 0);
}
