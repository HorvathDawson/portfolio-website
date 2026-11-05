import { parseFrontmatter, toPostMeta, type PostMeta } from './frontmatter';
import { loadPostRaw, postPath } from './cars';
import { substitutePostBody } from './a40Constants';
import { decodeEntities, renderMarkdown } from './markdown';

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
  const { meta, body: md } = parseFrontmatter(raw);
  // A40 posts write numbers as {{constant}} (content/a40/constants.yaml); unknown names throw.
  const body = substitutePostBody(car, slug, md);
  const html = renderMarkdown(body)
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
