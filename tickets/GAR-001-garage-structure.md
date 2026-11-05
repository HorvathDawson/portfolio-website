---
id: GAR-001
title: Turn /a40 into a multi-car garage
status: done
owner: Claude (garage agent)
reviewer: independent review agent
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
Reviewer: independent review agent (did not implement), 2026-10-24.

Common runs (apply to every GAR ticket below):
- `npm run build`: exit 0 (check-constants, `tsc -b`, check-roadmap-plan, vite build). `npm run lint`: exit 0 (only a baseline-browser-mapping staleness notice). `node scripts/check-roadmap-plan.mjs`: 11 `ok`, 0 FAIL (175 tasks, 389 edges, 40 ready, critical path 14).
- `npx vite preview --port 5195` on the build; Playwright (chromium.launch(), no options) at 1440x900 and 390x844 (isMobile, hasTouch). Console errors, page errors and failed requests were collected on every page visited: none (only Google Fonts requests aborted by navigation, ignored).
- axe-core is not in node_modules: axe check skipped. Lighthouse is not installed: not run.
- Screenshots and PDFs: `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/review2/`.

GAR-001 checks:
- Legacy URLs (client redirect, vite preview): `/a40`, `/a40/`, `/a40/roadmap`, `/a40/roadmap/`, `/a40/roadmap?view=tree&task=t-frame-design`, `/a40/steering#manual-or-epas` and all 18 `/a40/<slug>` (every .md in content/a40) land on the matching `/garage/a40...` URL with query and hash kept and no "Post not found": 24/24 at 1440 and 24/24 at 390. The hash target `#manual-or-epas` is scrolled to the top of the post panel (top 16 px desktop; 64 px on phone, below the 49 px sticky bar).
- Host 301s: `npx wrangler dev` on dist/ printed "Parsed 3 valid redirect rules"; curl: `/a40` → 301 `/garage/a40`, `/a40/` → 301 `/garage/a40`, `/a40/steering` → 301 `/garage/a40/steering`, `/a40/roadmap?view=tree&task=t-frame-design` → 301 `/garage/a40/roadmap?view=tree&task=t-frame-design` (query kept), `/a40/roadmap/` → 301 `/garage/a40/roadmap/` (the SPA serves that fine). `public/_redirects` syntax is valid for Workers static assets.
- Hard-coding: `grep -rni a40 src` outside the listed exceptions finds two newer ones, both from other tickets and neither stops a new car working: `RIGS.a40` headlight positions in src/blog/GarageScene.tsx:27 (GAR-008; unknown cars get a default) and `car === 'a40'` constant substitution in src/blog/a40Constants.ts:96 (A40-007). Recommend moving lamp positions into car.json later (noted on GAR-008).
- Third car: copied the repo (without tickets/dist) to the scratchpad, added `content/testcar/car.json` + one post with `service: [oil and filter]`, no code change. `npm run build` passed; sitemap gained `/garage/testcar` and `/garage/testcar/first-oil-change`; /garage showed 3 bays (third wraps centred, "art coming soon" placeholder because the art paths don't exist, scrollWidth 390 on phone); `/garage/testcar` showed the service table row (oil and filter, Oct 20, 2026, 81,234 km) and a 3-car switcher; the post showed mileage/cost/parts. Screenshot `desk-third-car-garage.png`. Copy deleted afterwards.
- Code split: network log for `/garage` loads only index, GarageSelector, blogStyles, garage chunks; `/garage/a40/steering` adds GarageBlog, a40Constants, roadmapData and `steering-*.js`. Post text ("Headline numbers", "Manual or EPAS") is only in its own post chunk and the lazy search chunk (`_virtual_garage-search-*.js`, loaded on first search focus), not in index/GarageSelector/GarageBlog.
- `dist/sitemap.xml` lists /garage, /garage/a40, /garage/a40/roadmap, 18 a40 posts, /garage/autozam and its 2 posts.
- Portfolio card on `/` links to `/garage` (both links).
Result: all acceptance boxes pass. Status done.
