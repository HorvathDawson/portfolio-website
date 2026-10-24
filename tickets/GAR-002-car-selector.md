---
id: GAR-002
title: Car selector with outline art
status: todo
owner:
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
- [ ] Both cars render as white outlines and cross-fade to the gradient on hover and keyboard focus
- [ ] Works at 390 px wide (cars stack, art fits, no horizontal scroll)
- [ ] Reduced-motion respected
- [ ] Lighthouse accessibility ≥ 95 on /garage
- [ ] Screenshots at desktop and phone width attached to the Verification section

## Verification
_Filled by the reviewer._
