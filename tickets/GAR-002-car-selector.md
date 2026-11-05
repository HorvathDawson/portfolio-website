---
id: GAR-002
title: Car selector with outline art
status: done (pending owner)
owner: Claude (garage agent)
reviewer: independent review agent
blocked_by: GAR-001, GAR-003
---

## Why
The garage landing page should show the cars as the white line drawings the site already uses, with the gradient fill on hover/focus, like the A40 project card.

## Design
- `/garage`: one tile per car from `car.yaml`, using the same `outline.svg` / `colored.svg` layer pair (reuse `LayeredArt` / `ArtLayer`).
- Rest: white outline. Hover/focus/selected: cross-fade to the gradient version, slight lift. On touch screens, show the gradient on the tile in view.
- Under each car: name, year, one line, status, post count, last updated, link to latest post.
- Keyboard: tiles are links; arrow keys move between them; visible focus ring.
- `prefers-reduced-motion`: no lift/fade animation.
- On a car's page, a compact switcher in the sidebar header (small outline thumbnails) to jump between cars.

## Acceptance criteria
- [x] Both cars render as white outlines and cross-fade to the gradient on hover and keyboard focus
- [x] Works at 390 px wide (cars stack, art fits, no horizontal scroll)
- [x] Reduced-motion respected
- [ ] Lighthouse accessibility ≥ 95 on /garage
- [x] Screenshots at desktop and phone width attached to the Verification section

## Implementer notes
- `src/blog/GarageSelector.tsx` (`/garage`) + `src/blog/garage.css`. One tile per car from `car.json`, in `order`. Art is `LayeredArt`/`ArtLayer` (`src/blog/CarArt.tsx`) with the outline as `background` and the coloured SVG as `foreground`; the tile cross-fades on `:hover`, `:focus-within`, and on touch screens (`hover: none`) when the tile is ≥60% in view (IntersectionObserver). `!important` rules scoped to `.garage-art` override ArtLayer's inline opacity and App.css's ≤991px rule that forces the coloured layer on.
- Each tile: name, year · make model, one line, kind (Build log / Garage log), status, post count, last updated, link to the latest log post (reference pages only if there is nothing else). The art box is the same 3:2 for every car so the text lines up.
- Keyboard: the art + name is one link per tile; Arrow keys (and Home/End) move between tile links; gold focus ring. Checked: focus on tile 1, ArrowRight → `/garage/autozam` link focused and its coloured layer at opacity 1.
- Reduced motion: no lift, no fade (checked: transition 0s, transform `none` on hover with `reducedMotion: 'reduce'`).
- Switcher: `src/blog/CarSwitcher.tsx`, small outline thumbnails + "← Garage" in each car page's sidebar header (and at the top of the mobile list); current car has `aria-current="page"` and its accent border.
- Accent: each car's `accent` sets `--car-accent` on its tile and pages (switcher border, category chips/badges).
- If a car's outline.svg fails to load, the tile shows a dashed "art coming soon" placeholder. The AZ-1 art was present at `public/assets/garage/autozam/` when tested, so the screenshots use it.
- Not done: Lighthouse accessibility score (not run here). Screenshots are in `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/garage/` (`desktop-garage.png`, `desktop-garage-hover.png`, `desktop-garage-keyboard-focus.png`, `phone-garage.png`) for the reviewer to attach.

## Verification
Reviewer: independent review agent (did not implement), 2026-10-24.

Common runs (apply to every GAR ticket below):
- `npm run build`: exit 0 (check-constants, `tsc -b`, check-roadmap-plan, vite build). `npm run lint`: exit 0 (only a baseline-browser-mapping staleness notice). `node scripts/check-roadmap-plan.mjs`: 11 `ok`, 0 FAIL (175 tasks, 389 edges, 40 ready, critical path 14).
- `npx vite preview --port 5195` on the build; Playwright (chromium.launch(), no options) at 1440x900 and 390x844 (isMobile, hasTouch). Console errors, page errors and failed requests were collected on every page visited: none (only Google Fonts requests aborted by navigation, ignored).
- axe-core is not in node_modules: axe check skipped. Lighthouse is not installed: not run.
- Screenshots and PDFs: `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/review2/`.

GAR-002 checks (the selector is now the GAR-008 garage scene; tiles are bays):
- Rest: both cars white outlines (`.gs-art--colored` opacity 0). Hover over the A40 bay (1440): coloured layer opacity 1, light 1, door raised; the AZ-1 bay unchanged. Keyboard: Tab reaches the A40 bay link (`:focus-visible` true, gold 2 px outline round the door frame, coloured layer 1); ArrowRight → AZ-1 link focused and its coloured layer 1; ArrowRight again wraps to A40; End → AZ-1, Home → A40. Screenshots `desk-garage-rest.png`, `desk-garage-hover-a40.png`, `desk-garage-focus-a40.png`.
- 390x844: bays stack one per row, art fits, documentElement/body scrollWidth 390 = clientWidth. Touch: the bay ≥60 % in view gets `is-inview` (gradient on); scrolling the AZ-1 into view switches it on. Screenshots `phone-garage-rest.png`, `phone-garage-autozam-inview.png`.
- Reduced motion (`reducedMotion: 'reduce'`, both widths): no running animations, car/door transition 0s, click navigates in ~100 ms with no roll-out. Screenshots `desk-garage-reduced.png`, `phone-garage-reduced.png`.
- Under each car: name, year · make model, description, kind + status chips, post count, last updated, "Latest:" link (A40 → Wiring & ECU Overview, AZ-1 → Bought it).
- Car switcher on car pages: `/garage/autozam` shows A40 + AZ-1 thumbnails, AZ-1 has `aria-current="page"` and `view-transition-name: garage-car-autozam`; clicking the A40 thumbnail opens `/garage/a40`; works in the mobile list too.
- One h1 on /garage ("The Garage", visually hidden; the neon sign is decorative).
- Lighthouse: not installed here, not run; left for the owner (`npx lighthouse http://localhost:5195/garage --only-categories=accessibility`). axe-core also unavailable.
- Screenshots box: ticked; desktop and phone screenshots listed above are in the review folder.
Result: done (pending owner): only the Lighthouse box is open.
