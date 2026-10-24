// Build-time plugins: home-page header preloads, <head> metadata, garage post index, sitemap.
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { Marked, type Token } from 'marked'
import markedKatex from 'marked-katex-extension'
import { HEADER_SIZES, HEADER_TILE, headerSrcSet, parallaxLayers } from './src/data/content'
import {
  GITHUB_URL, HOME_DESCRIPTION, LINKEDIN_URL, RESUME_GENERATOR_PATH, HOME_TITLE, OG_IMAGE, SHARE_DESCRIPTION, SHARE_TITLE, SITE_NAME, SITE_URL, absoluteUrl,
} from './src/data/site'
import { carAndSlug, parseFrontmatter, toPostMeta } from './src/blog/frontmatter'

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * Preload the parallax header at high priority, but only on the home page
 * (a static <link rel=preload> would also fire, unused, on blog routes).
 * Also flags the home route so index.html's pre-app header frame shows.
 * Injected at the marker, ahead of the stylesheets, so it doesn't wait on CSS.
 */
export function headerPreload(): Plugin {
  const links = [
    ...parallaxLayers.map((src) => ({ imageSrcset: headerSrcSet(src), imageSizes: HEADER_SIZES })),
    { href: HEADER_TILE },
  ]
  const script = `if (location.pathname === '/') {
  document.documentElement.dataset.bootRoute = 'home';
  for (const attrs of ${JSON.stringify(links)}) {
    document.head.append(Object.assign(document.createElement('link'), { rel: 'preload', as: 'image', fetchPriority: 'high' }, attrs));
  }
}`
  return {
    name: 'header-preload',
    transformIndexHtml: (html) => html.replace('<!-- header-preload -->', `<script>${script}</script>`),
  }
}

/**
 * Home-page <head> metadata from src/data/site.ts. Link-preview bots don't
 * run JS, so this static copy is what they see on every route; usePageMeta
 * updates it per route for browsers and search engines that render JS.
 */
export function siteMeta(): Plugin {
  const meta = (attr: 'name' | 'property', key: string, content: string | number) =>
    `<meta ${attr}="${key}" content="${escapeHtml(String(content))}" />`
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: SITE_NAME },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#person`,
        name: SITE_NAME,
        url: `${SITE_URL}/`,
        sameAs: [GITHUB_URL, LINKEDIN_URL],
        alumniOf: { '@type': 'CollegeOrUniversity', name: 'University of British Columbia' },
      },
    ],
  }
  const tags = [
    `<title>${escapeHtml(HOME_TITLE)}</title>`,
    meta('name', 'description', HOME_DESCRIPTION),
    `<link rel="canonical" href="${SITE_URL}/" />`,
    meta('property', 'og:type', 'website'),
    meta('property', 'og:site_name', SITE_NAME),
    meta('property', 'og:url', `${SITE_URL}/`),
    meta('property', 'og:title', SHARE_TITLE),
    meta('property', 'og:description', SHARE_DESCRIPTION),
    meta('property', 'og:image', absoluteUrl(OG_IMAGE.path)),
    meta('property', 'og:image:width', OG_IMAGE.width),
    meta('property', 'og:image:height', OG_IMAGE.height),
    meta('property', 'og:image:alt', OG_IMAGE.alt),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', SHARE_TITLE),
    meta('name', 'twitter:description', SHARE_DESCRIPTION),
    meta('name', 'twitter:image', absoluteUrl(OG_IMAGE.path)),
    `<script type="application/ld+json">${JSON.stringify(schema)}</script>`,
  ]
  return {
    name: 'site-meta',
    transformIndexHtml: (html) => html.replace('<!-- site-meta -->', tags.join('\n    ')),
  }
}

/**
 * `/content/<car>/<post>.md?meta` → the post's frontmatter as a JS object
 * (src/blog/postIndex.ts), so lists and the car selector never bundle post text.
 */
export function garageMeta(): Plugin {
  return {
    name: 'garage-meta',
    enforce: 'pre',
    load(id) {
      const [file, query] = id.split('?')
      if (query !== 'meta' || !file.endsWith('.md')) return
      this.addWatchFile(file)
      const { car, slug } = carAndSlug(file)
      const { meta } = parseFrontmatter(fs.readFileSync(file, 'utf8'))
      return `export default ${JSON.stringify(toPostMeta(meta, car, slug))}`
    },
  }
}

/* ── Search index ─────────────────────────────────── */

const SEARCH_ID = 'virtual:garage-search'
const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }
const decodeEntities = (s: string) => s.replace(/&(amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e])
const plainText = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

/** Same rule as headingId() in src/blog/blogData.ts, so #ids from the index match the rendered post. */
function headingSlugger() {
  const used = new Map<string, number>()
  return (innerHtml: string) => {
    const base = decodeEntities(innerHtml.replace(/<[^>]+>/g, ''))
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-')
    const n = used.get(base) ?? 0
    used.set(base, n + 1)
    return n === 0 ? base : `${base}-${n}`
  }
}

export interface SearchSection { id: string; heading: string; text: string }
export interface SearchDoc { car: string; slug: string; title: string; sections: SearchSection[] }

/** One post → its sections (intro + one per heading), as plain text. */
function searchDoc(file: string, raw: string): SearchDoc {
  const { car, slug } = carAndSlug(file)
  const { meta, body } = parseFrontmatter(raw)
  // Headings use the same KaTeX rendering as the post, so their ids match;
  // section text keeps $maths$ as written (readable and searchable).
  const withMath = new Marked().use(markedKatex({ throwOnError: false, nonStandard: true }))
  const plain = new Marked()
  const slugger = headingSlugger()
  const sections: SearchSection[] = []
  let current: SearchSection = { id: '', heading: '', text: '' }
  let pending: Token[] = []
  const flush = () => {
    current.text = plainText(plain.parser(pending))
    if (current.heading || current.text) sections.push(current)
    pending = []
  }
  for (const token of plain.lexer(body)) {
    if (token.type === 'heading') {
      flush()
      const inner = withMath.parseInline(token.text, { async: false }) as string
      current = { id: slugger(inner), heading: plainText(plain.parseInline(token.text, { async: false }) as string), text: '' }
    } else {
      pending.push(token)
    }
  }
  flush()
  return { car, slug, title: toPostMeta(meta, car, slug).title, sections }
}

/**
 * `virtual:garage-search` → every post's title, headings and plain text, for
 * the sidebar search. Imported lazily (on first search), so it is its own
 * chunk and never part of the initial bundle.
 */
export function garageSearch(contentDir: string): Plugin {
  const resolved = '\0' + SEARCH_ID
  return {
    name: 'garage-search',
    resolveId: (id) => (id === SEARCH_ID ? resolved : undefined),
    load(id) {
      if (id !== resolved) return
      const docs: SearchDoc[] = []
      for (const car of fs.readdirSync(contentDir).sort()) {
        const dir = path.join(contentDir, car)
        if (!fs.existsSync(path.join(dir, 'car.json'))) continue
        for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
          const full = path.resolve(dir, file)
          this.addWatchFile(full)
          docs.push(searchDoc(`/content/${car}/${file}`, fs.readFileSync(full, 'utf8')))
        }
      }
      return `export default ${JSON.stringify(docs)}`
    },
    handleHotUpdate({ file, server }) {
      if (!file.endsWith('.md')) return
      const mod = server.moduleGraph.getModuleById(resolved)
      if (mod) server.moduleGraph.invalidateModule(mod)
    },
  }
}

/** Emit sitemap.xml: the home page, the resume generator, the garage, and every car's log, roadmap and posts. */
export function sitemap(contentDir: string): Plugin {
  return {
    name: 'sitemap',
    apply: 'build',
    generateBundle() {
      const urls: { path: string; lastmod?: string }[] = [{ path: '/' }, { path: RESUME_GENERATOR_PATH }, { path: '/garage' }]
      const carDirs = fs.readdirSync(contentDir).filter((d) => fs.existsSync(path.join(contentDir, d, 'car.json'))).sort()
      for (const car of carDirs) {
        const dir = path.join(contentDir, car)
        const config = JSON.parse(fs.readFileSync(path.join(dir, 'car.json'), 'utf8')) as { roadmap?: boolean }
        urls.push({ path: `/garage/${car}` })
        if (config.roadmap) urls.push({ path: `/garage/${car}/roadmap` })
        for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
          const meta = toPostMeta(parseFrontmatter(fs.readFileSync(path.join(dir, file), 'utf8')).meta, car, file)
          urls.push({ path: `/garage/${car}/${carAndSlug(`${car}/${file}`).slug}`, lastmod: meta.updated || meta.date || undefined })
        }
      }
      const body = urls
        .map((u) =>
          `  <url><loc>${absoluteUrl(u.path)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
        .join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
      })
    },
  }
}
