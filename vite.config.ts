import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { HEADER_SIZES, HEADER_TILE, headerSrcSet, parallaxLayers } from './src/data/content'

/**
 * Preload the parallax header at high priority, but only on the home page
 * (a static <link rel=preload> would also fire, unused, on blog routes).
 * Also flags the home route so index.html's pre-app header frame shows.
 */
function headerPreload(): Plugin {
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
    // At the marker, ahead of the stylesheets, so it doesn't wait on CSS.
    transformIndexHtml: (html) => html.replace('<!-- header-preload -->', `<script>${script}</script>`),
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), headerPreload()],
  assetsInclude: ['**/*.md'],
  build: {
    // Inline the header placeholder so it paints with the first frame.
    assetsInlineLimit: (file) => (file.endsWith('header-placeholder.webp') ? true : undefined),
  },
})
