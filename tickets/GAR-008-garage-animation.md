---
id: GAR-008
title: Animated garage on the /garage page
status: todo
owner:
reviewer: Dawson
blocked_by: GAR-005 (same files: GarageSelector.tsx, garage.css)
---

## Why
The garage page should feel like a garage: click a car and it drives out to its log; go back and it drives in.

## Concept (recommended): two-bay garage at night, same white line-art style
- **Scene:** a front-on line drawing of a two-bay garage (roll-up doors, roof line, a strip light per bay, a "THE GARAGE" sign that flickers on like a neon/fluorescent tube) in the site's white outline + gradient style, over the dark background, with a faint reflective floor.
- **Rest:** doors closed or half up, cars faintly visible as white outlines behind them.
- **Hover/focus a bay:** that bay's light flickers on, the door rolls up, the car fills with the gradient (the existing outline → colored cross-fade), headlights glow.
- **Click:** the car rolls out toward the viewer (translate down + scale up, slight bounce on the suspension), headlights sweep, then the page transitions into that car's log (View Transitions API where supported, so the car art morphs into the sidebar thumbnail).
- **Back to /garage:** the reverse: the car reverses into its bay and the door rolls down.
- **Phone:** bays stack vertically (or a swipeable row); tap = same roll-out.
- **Reduced motion:** no rolling or driving; doors open instantly, a simple fade into the log.
- **Keyboard:** each bay is a link; Enter triggers the roll-out; focus = hover state.
- **Tech:** SVG (garage, doors, lights) + CSS transforms/animations; the car layers are the existing outline.svg / colored.svg. No new dependencies. Adding a car = another bay from car.json.

## Other options considered
- Side-view drive-in from the edge of the screen: needs side-view art for every car (ours are 3/4 views).
- Isometric 3D garage (three.js): heavier and doesn't match the line-art look.
- Turntable showroom (car rotates on a platform): needs multiple angles per car.

## Acceptance criteria
- [ ] Owner likes it (prototype reviewed on the preview site)
- [ ] Click → car rolls out → log opens; Back → car reverses in
- [ ] 60 fps on a mid-range phone (transforms/opacity only, no layout thrash)
- [ ] Reduced motion and keyboard paths work
- [ ] Works at 390 px with no horizontal scroll

## Verification
_Filled by the reviewer._
