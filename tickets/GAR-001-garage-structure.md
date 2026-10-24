---
id: GAR-001
title: Turn /a40 into a multi-car garage
status: review
owner: Claude (garage agent)
reviewer:
blocked_by: A40-006 (roadmap agent is editing blogData.ts / A40Blog.tsx)
---

## Why
The Autozam AZ-1 is joining the A40. The blog is hard-wired to one car.

## Design
- Content moves to `content/garage/<car>/` (`a40/`, `autozam/`), each with a `car.yaml`: name, year, model, one-line description, status, art paths, accent colour, kind (`build` = from-scratch log with epics + roadmap, `garage` = maintenance/mods log).
- Routes: `/garage` (selector), `/garage/:car`, `/garage/:car/:slug`, `/garage/a40/roadmap`.
- Old URLs keep working: `/a40` → `/garage/a40`, `/a40/:slug` → `/garage/a40/:slug`, `/a40/roadmap` → `/garage/a40/roadmap` (client redirect + `_redirects`/worker 301 if the host supports it).
- `blogData.ts` loads per car with `import.meta.glob('/content/garage/*/*.md')`; posts are lazily imported, not bundled eagerly.
- `A40Blog.tsx` becomes `GarageBlog.tsx`, car-agnostic. Epics only show for `build` cars; `garage` cars get a simple dated list grouped by category (maintenance, mods, repairs) with a mileage field.
- The sitemap covers every car.
- The portfolio card links to `/garage`.

## Acceptance criteria
- [x] Every old `/a40...` URL redirects to the matching `/garage/a40...` URL (test each slug)
- [x] No A40 name, path or colour is hard-coded outside `content/a40/` (exceptions listed in the notes)
- [x] Adding a third car = add a folder with `car.json` + posts, no code change
- [x] Post bodies are code-split (initial JS for `/garage` doesn't contain post text)
- [x] `npm run build` and `npm run lint` pass; sitemap lists both cars

## Implementer notes
Design changed from the plan above (owner's call): content was **not** moved. Each car keeps its folder, `content/a40/` and `content/autozam/`, each with a `car.json` (JSON rather than YAML so it loads with no parser or plugin): name, logTitle, year, make, model, description, kind, status, accent, order, art (outline, colored, width, height), roadmap, and for build cars `epics` (moved out of blogData.ts).

- `src/blog/cars.ts`: cars from `import.meta.glob('/content/*/car.json')`; post bodies from a lazy `import.meta.glob('/content/*/*.md', { query: '?raw' })`, one chunk per post. Needs no plugin, so `scripts/check-roadmap-plan.mjs` still loads roadmapData.ts.
- `src/blog/postIndex.ts`: frontmatter only, via `?meta` imports served by `garageMeta()` in vite.plugins.ts. Lists, the selector and the roadmap use this, so no list ships post text. Checked: in `dist/assets`, "Headline numbers" (overview text) appears only in `overview-*.js`.
- `src/blog/frontmatter.ts`: shared parser and `PostMeta` (adds `category`, `mileage_km`, `parts`, `cost`, `service`).
- `A40Blog.tsx` → `GarageBlog.tsx` (car-agnostic). Build cars: epics + Roadmap link as before. Garage cars: Reference group, then a dated log (newest first) with a category filter (`?category=`), a car home panel with a service table, and mileage/cost/parts in the post header.
- Routes (src/main.tsx): `/garage`, `/garage/:car`, `/garage/:car/roadmap`, `/garage/:car/:slug`. `/a40/*` → `src/components/LegacyRedirect.tsx` (`<Navigate replace>`, keeps query and hash, drops a trailing slash).
- Host 301s: `public/_redirects` (Workers static assets read `_redirects` from `dist/`). Not tested against Cloudflare; `vite` and `wrangler dev` may not apply it, the client redirect covers that.
- Relative post links (`./slug`, `./slug#heading`) are rewritten to `/garage/<car>/<slug>` at render, so they resolve from `/garage/a40` (no trailing slash) as well as from a post, and clicks navigate in-app.
- Roadmap: it belongs to the car with `roadmap: true` (`roadmapCar` in cars.ts). Roadmap modules read epics and post titles from there; links go to `/garage/a40/<slug>`. `/garage/<other car>/roadmap` is a 404.
- Sitemap (`sitemap('content')` in vite.plugins.ts): `/garage`, every car with a car.json, its roadmap if it has one, and every post.
- Files outside src/ touched: vite.config.ts, vite.plugins.ts (garageMeta + sitemap), public/_redirects (new).
- A40-specific strings left outside content/a40/: the legacy `/a40` redirect (LegacyRedirect.tsx, public/_redirects), the portfolio card in src/data/projects.tsx (A40 art, now links to `/garage`), and roadmapData.ts (it *is* the A40 roadmap; it can't move because the check script loads it by path).
- Behaviour kept from before: `/garage/a40` with no slug shows the oldest post (Teardown), as `/a40` did.

Checks run: `npm run build` ok; `npm run lint` ok; `node scripts/check-roadmap-plan.mjs` 11 ok, 0 FAIL. Playwright against `npx vite --port 5185`: `/a40`, `/a40/`, `/a40/roadmap`, `/a40/roadmap?view=tree&task=t-frame-design`, `/a40/steering#manual-steering` and all 18 `/a40/<slug>` land on the matching `/garage/a40...` URL (23/23 at 1440×900 and 390×844); no console errors; no horizontal scroll. Screenshots: `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/garage/`.

## Verification
_Filled by the reviewer._
