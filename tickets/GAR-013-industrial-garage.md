---
id: GAR-013
title: Industrial garage look (service station / warehouse) and tap-to-light on phones
status: in-progress
owner: implementation agent
reviewer: (independent agent, then Dawson on the preview)
blocked_by:
---

## Owner request (Nov 2026)
1. Phones have no hover, so on mobile a tap should give the light effect, with a separate option to then go to the car.
2. Make the stacked phone garage look more industrial (no V roof), and make the desktop scene more industrial too: old gas station or warehouse vibes.

## Design
Same visual language as today: white 2 px line art, night palette, neon, gradient cars, headlight glow. Grittier forms.
- **Desktop (> 600 px): 1950s service station / warehouse.** Flat-roofed building with a parapet and cap flashing (no gable), corrugated or brick-coursed walls, steel roll-up bay doors with a strip of door windows, stencilled bay numbers ("BAY 01"), hazard-stripe edges on the door jambs, an oil-drum or tyre-stack silhouette and a wall lamp per bay. The neon "THE GARAGE" sign moves to a tall gas-station pole sign beside the building (with a small "SERVICE" sub-panel). Interactions unchanged.
- **Phones (≤ 600 px): industrial multi-storey garage.** Flat roof with the neon sign on a rooftop billboard frame (steel lattice), steel I-beam floor slabs with rivets, corrugated walls, stencilled floor numbers, hazard stripes along slab edges, and a freight elevator: open steel cage with a scissor gate on a guide rail instead of the smooth shaft.
- **Phone interaction (tap to light):** scrolling no longer opens floors. Tap a floor → it lights (door up, strip light, gradient car, headlights), the elevator goes to it, and an "Enter ›" button appears on the floor (also: tapping the lit car again enters). Tapping another floor moves the light; tapping outside or pressing Esc turns it off. Enter → existing drive-out → car home (morph), Back → reverse-in with that floor lit. Links stay real `<a href>` (keyboard: focus = lit, Enter = go; ctrl/cmd-click = new tab). Reduced motion: no movement, fades only.
- Car-home hero bay and the shop-bar mini bays restyled to match (same industrial parts).

## Acceptance criteria
- [ ] Desktop: flat-roof service station/warehouse with pole sign; no gable roof anywhere
- [ ] Phone: industrial tower with flat roof, billboard sign, beam slabs, freight elevator; one connected building; no horizontal scroll at 360/390/414/600
- [ ] Phone: tap lights a floor and shows Enter; second action enters; tap elsewhere/Esc unlights; scrolling alone opens nothing
- [ ] Hover/focus/click behaviour on desktop unchanged; morph to car home and Back still work on both
- [ ] Car-home hero and mini bays match the new look
- [ ] Text ≥ 11 px, AA contrast, one h1, keyboard focus visible, reduced motion respected, tokens only (no stray hex/sizes)
- [ ] Third car still renders (bay 03 / floor 03)
- [ ] build, lint, check-constants, check-roadmap-plan pass

## Verification
_Filled by the reviewer._
