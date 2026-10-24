import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { garageMeta, headerPreload, siteMeta, sitemap } from './vite.plugins'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), headerPreload(), siteMeta(), garageMeta(), sitemap('content')],
  assetsInclude: ['**/*.md'],
  build: {
    // Inline the header placeholder so it paints with the first frame.
    assetsInlineLimit: (file) => (file.endsWith('header-placeholder.webp') ? true : undefined),
  },
})
