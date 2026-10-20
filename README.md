# portfolio-website

Dawson Horvath's portfolio and the A40 Austin build log. React + TypeScript +
Vite, deployed to Cloudflare (Workers static assets, see `wrangler.jsonc`).

## Development

```sh
npm install
npm run dev      # local dev server
npm run build    # type-check and build to dist/
npm run lint
npm run preview  # build, then serve dist/ with wrangler
```

## Layout

- `src/App.tsx`: home page (parallax header, about, project cards, contact form)
- `src/data/projects.tsx`: the project cards (copy, links, visual, scroll animation), rendered by `ProjectCard`
- `src/data/content.ts`: about text, header layers, contact links
- `src/data/site.ts`: domain, titles and descriptions used for `<head>` metadata
- `src/components/visuals/`: the artwork shown inside each card, built from `ArtLayer`/`LayeredArt`
- `src/blog/`: the A40 build log and roadmap (`/a40`, `/a40/roadmap`), loaded as a separate chunk
- `content/a40/`: build log posts in Markdown
- `src/utils/scrollFrame.ts`: shared, rAF-batched scroll subscription used by all scroll effects
- `src/utils/reducedMotion.ts`: the one `prefers-reduced-motion` check (CSS side at the end of `App.css`)
- `vite.plugins.ts`: home-page header preloads, `<head>` metadata, `sitemap.xml`
- `public/assets/`: images; home page artwork is WebP

## Assets

Home page images are WebP. Card artwork is capped at 1600px on its long edge,
which is enough for 2x/3x screens at the size the cards render. Header layers
keep their full 3000x2000 resolution; phones get 1500w copies via `srcset`.

Derived images are generated, so re-run the scripts after changing a source:

```sh
python3 scripts/make-header-images.py  # 1500w header layers, blurred placeholder, og/home.jpg
python3 scripts/make-stills.py         # *-still.webp frames for reduced motion
```
