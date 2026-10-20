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
- `src/components/projects/`: one component per project card, built on `BaseProjectItem`
- `src/components/visuals/`: the artwork shown inside each card
- `src/blog/`: the A40 build log and roadmap (`/a40`, `/a40/roadmap`), loaded as a separate chunk
- `content/a40/`: build log posts in Markdown
- `src/utils/scrollFrame.ts`: shared, rAF-batched scroll subscription used by all scroll effects
- `public/assets/`: images; home page artwork is WebP

## Assets

Home page images are WebP. Card artwork is capped at 1600px on its long edge,
which is enough for 2x/3x screens at the size the cards render. Header layers
keep their full 3000x2000 resolution.
