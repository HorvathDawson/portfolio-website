// Build-time plugins: home-page header preloads, <head> metadata, sitemap.
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { HEADER_SIZES, HEADER_TILE, headerSrcSet, parallaxLayers } from './src/data/content'
import {
  GITHUB_URL, HOME_DESCRIPTION, LINKEDIN_URL, HOME_TITLE, OG_IMAGE, SHARE_DESCRIPTION, SHARE_TITLE, SITE_NAME, SITE_URL, absoluteUrl,
} from './src/data/site'
import { postSlug } from './src/blog/postSlug'

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

/** Emit sitemap.xml: the home page, the build log, the roadmap and every post. */
export function sitemap(postsDir: string): Plugin {
  return {
    name: 'sitemap',
    apply: 'build',
    generateBundle() {
      const posts = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md')).map((file) => {
        const raw = fs.readFileSync(path.join(postsDir, file), 'utf8')
        const date = raw.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1]
        return { path: `/a40/${postSlug(file)}`, lastmod: date }
      })
      const urls = [{ path: '/' }, { path: '/a40' }, { path: '/a40/roadmap' }, ...posts]
      const body = urls
        .map((u: { path: string; lastmod?: string }) =>
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
