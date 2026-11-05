---
id: GAR-008
title: Animated garage on the /garage page
status: done (pending owner)
owner: Claude
reviewer: independent review agent (owner: Dawson)
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
- [x] Click → car rolls out → log opens; Back → car reverses in
- [ ] 60 fps on a mid-range phone (transforms/opacity only, no layout thrash)
- [x] Reduced motion and keyboard paths work
- [x] Works at 390 px with no horizontal scroll

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
Reviewer: independent review agent (did not implement), 2026-10-24.

Common runs: `npm run build` exit 0; `npm run lint` exit 0; `node scripts/check-roadmap-plan.mjs` 11 ok / 0 FAIL. `npx vite preview --port 5195` on the build; Playwright (chromium.launch(), no options) at 1440x900 and 390x844 (isMobile, hasTouch), collecting console errors, page errors and failed requests on every page: none (Google Fonts requests aborted by navigation ignored). axe-core is not in node_modules (skipped); Lighthouse not installed (not run). Screenshots/PDFs: `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/review2/`.

GAR-008 checks (scene is integrated: src/blog/GarageSelector.tsx renders `<GarageScene>` with `returning={back}`, `onEnter={(id) => navigate(carPath(id))}`, `TileMeta`; src/blog/CarSwitcher.tsx gives the current car's thumbnail `view-transition-name: garage-car-<id>` + class `garage-car`; the preview files `scene-preview.html`, `src/scenePreview.tsx`, `src/blog/GarageScenePreview.tsx` are gone):
- Hover (1440): A40 bay light 0 → 1, door translateY −140 → −251 px, coloured layer 0 → 1; the other bay unchanged (`desk-garage-hover-a40.png`).
- Keyboard: focus = hover state plus gold outline on the door frame; Arrow/Home/End move between bays (wraps). Enter on the AZ-1 bay: 400 ms in, bay `is-leaving`, car transform `matrix(1.29,…,−14,83)` (rolling out, other bay dimmed; `desk-garage-rollout-mid.png`), URL changes to `/garage/autozam` after ~940 ms; sessionStorage `garage-scene:out=autozam`; the switcher thumbnail carries `garage-car-autozam`.
- Back: `/garage` mounts with `gs--back`, AZ-1 `is-returning` starting at the rolled-out pose (scale 1.35), after 2.5 s `is-rest`, transform none, door back at −140 px, sessionStorage cleared (`desk-garage-back-mid.png`). Mouse click on the A40 bay: A40 `is-leaving`, AZ-1 `is-dim`, then `/garage/a40`. Ctrl+click opens a new tab and leaves the page on /garage.
- Phone 390: bays stacked, scrollWidth 390; the bay in view opens (`is-inview`); tap rolls out to `/garage/autozam`; Back returns with scrollWidth 390.
- Reduced motion (both widths): no running animations, transitions 0s, click → navigation in ~100–120 ms, Back leaves the bay at rest with sessionStorage cleared.
- Performance proxy (not a real phone): 390x844, CDP CPU throttle ×4, rAF intervals during the roll-out: median 16.7 ms, p95 16.8 ms, one 50 ms frame at the tap; CSS keyframes animate only transform/opacity (and `scale` on the lamps). Layout runs about once per frame even at idle (48 layouts / 800 ms, 0.8 ms each) because the visually hidden `<h1 class="garage-title sr-only">` still runs the infinite `gc-glow-pulse` text-shadow animation. Non-blocking: add `.garage-title.sr-only { animation: none; }` to src/blog/garage.css.
- No console errors on /garage, during roll-out, or on Back.
- Non-blocking: headlight positions are per-car code (`RIGS` in src/blog/GarageScene.tsx:26-29); consider moving them to car.json (`lamps`, `drive`) when GAR-007 redraws the AZ-1.
- Not checked: Safari/Firefox, a real mid-range phone, and the view-transition morph itself (headless Chromium does not record it).

Open boxes: "Owner likes it" (owner) and "60 fps on a mid-range phone" (needs a real device; the throttled numbers above are the reviewer's evidence). Result: done (pending owner).
