---
id: GAR-012
title: Garage on phones: a multi-storey garage tower
status: in-progress
owner: implementation agent
reviewer: (independent agent, then Dawson on the preview)
blocked_by:
---

## Why
On phones (≤ 600 px) the /garage bays stack as separate pieces: only the first has the roof and neon sign, the second floats on its own, and labels add a long scroll. The owner wants it to work on mobile and still look cool: "a different but same idea appearance".

## Design: the garage becomes a tower
- One building, drawn in the same white line art and night palette: the neon "THE GARAGE" sign on the roof, then **one floor per car**, stacked (floor 01 = A40, floor 02 = AZ-1, …), each floor a short, wide bay with its roll-up door, strip light and the car inside, and a floor number plate ("01", "02") like a parking garage.
- An **elevator shaft** down one side of the building with a lit floor indicator that follows the floor in view (scroll-driven, transforms only).
- Labels sit compactly on each floor (name, year, one line; chips/stats/latest kept but tight) so both cars fit in about one and a half screens.
- **Touch:** the floor in view opens (door up, light on, gradient car, headlights) like today's in-view behaviour; tapping it drives the car out toward the viewer into its car home (same view-transition morph into the shop-bar mini bay). Back reverses it into its floor.
- **Reduced motion:** no rolling/driving/elevator motion; fades only.
- Desktop and tablets keep the current side-by-side scene unchanged. Adding a car = another floor, no code change.

## Acceptance criteria
- [ ] At 390×844 and 360×740: one connected building (roof + sign + floors), no floating bays, no horizontal scroll
- [ ] Both cars visible within ~1.5 screens; text ≥ 11 px; AA contrast
- [ ] Floor in view opens; tap drives out to the car home; Back reverses in; elevator indicator tracks the floor in view
- [ ] Keyboard and screen-reader paths unchanged (each floor is a link, one h1)
- [ ] Reduced motion respected; 60 fps-friendly (transforms/opacity only)
- [ ] Desktop/tablet scene unchanged (screenshots before/after at 1440 and 1024 match)
- [ ] Third car renders as a third floor (checked in a scratch copy)
- [ ] build, lint, check-constants, check-roadmap-plan pass

## Verification
_Filled by the reviewer._
