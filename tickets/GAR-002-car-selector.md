---
id: GAR-002
title: Car selector with outline art
status: review
owner: Claude (garage agent)
reviewer:
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
- [ ] Screenshots at desktop and phone width attached to the Verification section

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
_Filled by the reviewer._
