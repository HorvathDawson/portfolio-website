---
id: GAR-013
title: Industrial garage look (service station / warehouse) and tap-to-light on phones
status: review
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
- **Signage (owner addition):** each car's info (name, year/make, description, chips, post count/updated, "Latest:" link) is an enamel sign plate bolted to the building rather than a plain label band: double-piece plate with corner bolts, painted name, a rule under the year line, status chips as stamped tags with a punched hole, "Latest:" on a smaller bolted plate. Phone: on the wall under each floor; desktop: matching plates under each bay.
- **3+ cars on desktop (coordinator):** up to 3 bays in one row under one parapet (narrower bays/plates); a 4th car starts a second row with its own parapet, so nothing floats.

## Acceptance criteria
- [x] Desktop: flat-roof service station/warehouse with pole sign; no gable roof anywhere
- [x] Phone: industrial tower with flat roof, billboard sign, beam slabs, freight elevator; one connected building; no horizontal scroll at 360/390/414/600
- [x] Phone: tap lights a floor and shows Enter; second action enters; tap elsewhere/Esc unlights; scrolling alone opens nothing
- [x] Hover/focus/click behaviour on desktop unchanged; morph to car home and Back still work on both
- [x] Car-home hero and mini bays match the new look
- [x] Project info shown as signs mounted on the building (enamel plates, stamped chip tags, smaller "Latest" plate) on phone and desktop; name is still the bay link's accessible label
- [x] Text ≥ 11 px, AA contrast, one h1, keyboard focus visible, reduced motion respected, tokens only (no stray hex/sizes)
- [x] Third car still renders (bay 03 / floor 03); on desktop 3 bays share one roof, a 4th gets its own roofed row
- [x] build, lint, check-constants, check-roadmap-plan pass

## Files
- `src/blog/GarageScene.tsx`: Roof (parapet + cap flashing; rooftop unit on desktop, lattice billboard + hoist on phones/hero), PoleSign (desktop), BayStage (corrugated wall, stencil, wall lamp, hazard jambs + coil housing, door window strip, freight-elevator landing), Bay (sign plate wrapper `.gs-bay-plate`, `.gs-enter` link), tap-to-light state, desktop rows (`ROW_BAYS = 3`)
- `src/blog/garageScene.css`: rewritten on tokens; industrial parts, plates, Enter button, I-beam slabs, freight cage, rows
- `src/blog/styles/tokens.css`: new `--hazard`, `--touch`, `--minibay-w`, and a "Garage scene" block (`--gs-max`, `--gs-rise`, `--gs-rise-tower`, `--gs-parapet-h`, `--gs-pole-w`, `--gs-plate-w`, `--gs-bay-solo`, `--gs-shaft-w`, `--gs-slab-h`, `--gs-neon`, `--gs-neon-pole`, `--gs-stencil`)
- `src/blog/styles/components.css`: mini bays (cap flashing, hazard jambs, window strip)
- `garageSceneTransition.ts`, `CarSwitcher.tsx`, `CarHome.tsx`: unchanged (same props / transition names)

## Implementer notes
- **Desktop:** flat roof = brick-coursed parapet with steel cap flashing (overhangs both ends) and a rooftop unit + vent stack behind it. Walls corrugated (`--gs-corrugated`). Each bay: stencilled "BAY 0n" (mono, a mask cuts the stencil bridge), gooseneck wall lamp centred over the door (glows with the bay), door frame with hazard-striped jambs and a coil housing across the top, steel roll-up door with a 6-window strip. Pole sign stands in a reserved column right of the building (`--gs-pole-w`), drawn inside the last bay of the first row so it shares the ground line: neon "THE / GARAGE" panel with inner trim, "SERVICE" sub-panel, steel post on a base plate, tyre stack and oil drum at its foot. The pole is `pointer-events: none`, so it never lights or opens a bay. Gable roof, round vent and roof board are gone everywhere.
- **Desktop rows:** `--gs-cols = min(n, 3)`; bays in later rows get `is-row-start/mid/end` and draw their own parapet piece, so a 4th car is a second roofed building row (checked with 3 and 4 cars).
- **Phone tower:** same parts in a 10:7 floor; flat roof with the neon sign on a steel-lattice billboard frame and a hoist (A-frame + sheave) over the elevator; each storey sits under a riveted I-beam slab with a hazard-striped lower edge (`.gs-bay::before`, runs across the hoistway); big stencilled floor number; freight elevator = guide rails, X-braced hoistway per floor, landing sill and lit floor number, and an open cage with a scissor gate (SVG) that moves with `transform` only.
- **Sign plates:** name (inside the bay link, still its `aria-labelledby` label) + `.gs-bay-plate` (sub, description, meta) drawn as one enamel plate with 4 bolts; sub line ruled off; chips as stamped tags with a punched hole; stats in mono; "Latest:" on a smaller bolted plate. Left-aligned on phones, centred on desktop; 3-to-a-row plates are narrower.
- **Tap to light (any touch screen, both layouts):** the scroll-driven floor pick and the in-view IntersectionObserver are removed. State `lit` (index or null). A touch press (`pointerType === 'touch'`, recorded on pointerdown with the lit floor *before* the tap's focus) on an unlit bay's link: `preventDefault`, light it, move the elevator. A touch press on the lit bay's link, or on its "Enter ›" link, drives out. Tapping a floor's plate text lights that floor; a pointerdown outside the bays or Esc unlights (Esc also blurs). Mouse clicks, keyboard Enter and ctrl/cmd/shift/middle clicks are untouched (mouse/keyboard drive out directly, modifier clicks open a tab). Keyboard focus lights the floor on touch/tower (and moves the elevator); focus leaving the bays unlights. On touch, `:hover`/`:focus-within` lighting is disabled (`.gs--touch`) so sticky hover can't light a second floor.
- **Enter button:** a real `<a href>` sibling of the bay link (no nested links), `aria-label="Enter <car>"`, gold, 44 px tall (`--touch`), positioned on the deck/forecourt in stage units (the bay is an inline-size container). Hidden with `visibility` when not lit, so it is not tabbable then.
- **Back:** the returning car reverses in as before; on touch screens its floor stays lit afterwards (Enter showing, elevator there). Desktop mouse: door rolls down after parking, as before.
- **Hero (car home):** same stage parts with the billboard roof ("BAY 0n" neon), no stencil (the sign says it). **Mini bays:** cap flashing strip, hazard jambs, door with window strip; lit bay unchanged otherwise (same view-transition name).
- **Tokens:** all new CSS uses tokens; remaining literals are percentages/cq units/unitless and the scene's own timing variables.

Checked (implementer, not verification), `npm run build` + `npx vite preview --port 5229`, Playwright `chromium.launch()`, phone contexts isMobile/hasTouch/DPR 2:
- 1440/1024: scrollWidth = width, one h1, no text < 11 px (the pole's "THE" is clamped to 11 px at 1024). Hover A40 lights A40 only (door −221 px vs −124 px rest at 1440); click → drive-out → `/garage/a40`; Back reverses in, both doors at rest; Tab focuses `/garage/a40` (gold frame outline + underline), ArrowRight → `/garage/autozam`; ctrl+click opens a new tab and stays on /garage.
- 390/360 (also 414/600 rest): scrollWidth = width, one h1, no text < 11 px. Scrolling top → bottom: no floor lit, doors at rest. Tap floor 02: URL stays `/garage`, floor 02 `is-on`, elevator `is-here` 02, Enter visible (107×44 px). Tap floor 01 moves the light; tap header / roof → none lit (doors back to rest); Esc → none lit; tap on a plate's text lights that floor. Tap Enter → drive-out → `/garage/autozam` (car home); Back → floor 02 reverses in and stays lit; tap the lit car again → `/garage/autozam`. Keyboard on phone: Tab → floor 01 lit, Enter → `/garage/a40`.
- Reduced motion: tap → Enter → car home in ~85 ms; cage jumps; Back leaves floor 02 lit.
- Third car (scratch copy, `content/third/car.json`): desktop "Bay 01/02/03" in one row under one roof, phone floors 01/02/03 and tap on 03 lights it with the elevator there; 4 cars: 3 + a second roofed row. No horizontal scroll, no errors.
- No console or page errors in any run. `npm run build`, `npm run lint`, `npm run check-constants`, `node scripts/check-roadmap-plan.mjs` (0 FAIL) pass.
- Not checked: real phones (iOS Safari doesn't focus links on tap; the logic doesn't rely on it), Firefox/Safari, the morph frames (headless Chromium doesn't record them), measured contrast ratios of the new plate colours (text pairs are token pairs on `--surface`, which tokens.css documents as AA).

Screenshots: `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/industrial/` — `before-*.png`; `after-1440-{rest,hover,driveout,back-mid,focus,reduced-hover,hero}.png`, `after-1024-{rest,hover,driveout,back-mid,focus}.png`, `after-{390,360}-{rest,tap02,driveout,carhome,back-mid,back-end}.png`, `after-390-{focus,hero,reduced-rest,reduced-tap02}.png`, `after-{414,600}-rest.png`, `after-shopbar.png`, `after-third-{1440,390-floor03}.png`, `after-three-{1440,1024,700}.png`, `after-four-{1440,1024,700}.png`.

## Verification
_Filled by the reviewer._
