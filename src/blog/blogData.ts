import { marked } from 'marked';
import markedKatex from 'marked-katex-extension';
import { parseFrontmatter, toPostMeta, type PostMeta } from './frontmatter';
import { loadPostRaw, postPath } from './cars';

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

export type { Status, PostKind, PostMeta } from './frontmatter';

export interface BlogPost extends PostMeta {
  html: string;
  /** Plain-text opening of the post, for meta descriptions. */
  excerpt: string;
}

/** First paragraph of rendered HTML as plain text, cut to about `max` characters. */
function excerpt(html: string, max = 160): string {
  const text = decodeEntities((html.match(/<p>([\s\S]*?)<\/p>/)?.[1] ?? '').replace(/<[^>]+>/g, ''))
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(' ', max - 1)).replace(/[,;:.\s]+$/, '') + '…';
}

/** Convert raw Markdown (with frontmatter) into a BlogPost for `car`. */
export function parsePost(raw: string, car: string, slug: string): BlogPost {
  const { meta, body } = parseFrontmatter(raw);
  usedHeadingIds.clear();
  const html = (marked.parse(body, { async: false }) as string)
    // Lazy-load post images so long posts don't download every plot up front.
    .replace(/<img /g, '<img loading="lazy" decoding="async" ')
    // Post-to-post links are written relative (./slug). Make them absolute so
    // they resolve the same from /garage/<car> and /garage/<car>/<slug>.
    .replace(/href="\.\/([^"]*)"/g, (_, rest: string) => `href="${postPath(car, rest)}"`);
  return { ...toPostMeta(meta, car, slug), html, excerpt: excerpt(html) };
}

const cache = new Map<string, Promise<BlogPost | undefined>>();

/** Load and render one post (cached). Undefined if the car has no such post. */
export function loadPost(car: string, slug: string): Promise<BlogPost | undefined> {
  const key = `${car}/${slug}`;
  let p = cache.get(key);
  if (!p) {
    p = loadPostRaw(car, slug)?.then((raw) => parsePost(raw, car, slug)) ?? Promise.resolve(undefined);
    cache.set(key, p);
  }
  return p;
}
