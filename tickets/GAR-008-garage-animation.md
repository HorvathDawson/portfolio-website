---
id: GAR-008
title: Animated garage on the /garage page
status: review
owner: Claude
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

## Implementer notes
Built as a standalone component, not yet wired into /garage (GarageSelector.tsx was being edited in parallel). Integration steps, props and the thumbnail's view-transition name: [GAR-008-integration.md](./GAR-008-integration.md).

- **Files (new):** `src/blog/GarageScene.tsx`, `src/blog/garageScene.css`, `src/blog/garageSceneTransition.ts`; dev-only preview `scene-preview.html`, `src/scenePreview.tsx`, `src/blog/GarageScenePreview.tsx` (not a build input; delete after integration).
- **Scene:** gable roof with a rooftop "THE GARAGE" neon sign (flickers on once, ~2.4 s, skipped when coming back from a log), board siding, double door trim, interior perspective lines, strip light per bay, roll-up door half up at rest, faint mirrored car on the floor. Lines are 2 px (1.5 px for slats/details) to match the car outlines at bay size. The garage is HTML/CSS + small inline SVGs; no new image assets.
- **Hover / focus / in view (touch):** light flickers on (0.75 s), door rolls up (translateY, clipped by the opening), outline → gradient cross-fade, headlight glows (per-car positions in `RIGS`, centred default for new cars), light spill on the floor.
- **Click / Enter:** car rolls out (translate down + scale 1.42, drifting the way it faces; squat on pull-away, brake dive and settle at the end), 820 ms; other bays' cars dim; then `onEnter` inside `document.startViewTransition` with `view-transition-name: garage-car-<id>` on the car.
- **returning:** that car starts at the rolled-out pose, reverses in (850 ms, settle bounce), then the door rolls down and the light goes off.
- **Animated properties:** transform, opacity only (plus `scale`/`translate` individual transform properties on the headlights).
- **Phone ≤600 px:** one bay per row, full width; 390 px has no horizontal scroll (scrollWidth 390). 3+ cars wrap (2 per row, odd one centred).
- **Reduced motion:** no flicker/roll/drive; states fade in 0.2 s; click goes straight to `onEnter`.
- **Keyboard:** each bay is an `<a href>` (modifier-clicks open a new tab normally); focus = hover state plus a gold outline round the door trim; arrows/Home/End move between bays.

Checked (implementer, not verification): `npm run lint` and `npm run build` pass; `dist/` has no preview files. Playwright screenshots of rest, hover per bay, mid roll-out, return, keyboard focus, reduced motion, 390×844 and 3 bays; video of hover → click → back (frames even through the roll-out; headless Chromium doesn't record the view-transition morph itself). Not yet checked: real phone frame rate, Safari/Firefox (no View Transitions in Firefox: plain swap), the morph against the real sidebar thumbnail.

## Verification
_Filled by the reviewer._
