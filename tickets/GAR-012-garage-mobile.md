---
id: GAR-012
title: Garage on phones: a multi-storey garage tower
status: done (pending owner review on the preview)
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
- [x] At 390×844 and 360×740: one connected building (roof + sign + floors), no floating bays, no horizontal scroll
- [x] Both cars visible within ~1.5 screens; text ≥ 11 px; AA contrast
- [x] Floor in view opens; tap drives out to the car home; Back reverses in; elevator indicator tracks the floor in view (but see Failed checks: description does not fade on drive-out; stale open floor after rotating)
- [x] Keyboard and screen-reader paths unchanged (each floor is a link, one h1)
- [x] Reduced motion respected; 60 fps-friendly (transforms/opacity only)
- [x] Desktop/tablet scene unchanged (screenshots before/after at 1440 and 1024 match)
- [x] Third car renders as a third floor (checked in a scratch copy)
- [x] build, lint, check-constants, check-roadmap-plan pass

## Files
- `src/blog/GarageScene.tsx`: tower variant (`gs--tower` class, chosen by `matchMedia('(max-width: 600px)')` via `useSyncExternalStore`), floor plate + shaft landing per floor, elevator cab, scroll-driven floor tracking
- `src/blog/garageScene.css`: "Phone: the garage tower" section, all rules scoped to `.gs--tower`; reduced-motion rule for the cab
- `src/blog/styles/tokens.css`: new motion token `--dur-4: 700ms` (elevator)

## Implementer notes
- **One component, two layouts.** GarageScene renders the same bays; at ≤ 600 px it adds `gs--tower` and, per floor, a number plate (`01`, `02`, … from list order) and a landing in the shaft (lit floor number + landing doors), plus one `.gs-shaft` with the cab. A new car folder = one more floor, no code change (checked with a third car in a scratch copy). Desktop/tablet DOM gains only a plain wrapper `<div class="gs-floors">` around the `<ul>`; no styles apply to it there.
- **Building:** roof + neon sign unchanged on top; floors share one set of outer walls (`.gs-floors` border) and are separated by a 2 px slab; ground line under the building. Each floor: 3:2 bay (door trim, opening, interior lines, strip light, roll-up door, car + headlights, reflective deck), then a compact label band (name 19 px, year/make 11 px mono, description 13 px, chips/stats/latest, left-aligned). Both floors fit in 1026 px at 390×844 (1.22 screens) and 986 px at 360×740 (1.33 screens).
- **Elevator:** shaft on the right with guide rails; each floor's landing has a floor number that lights (neon) when the cab is there. The floor in view is the stage nearest a probe line that slides from 30 % to 75 % of the viewport with scroll progress (so the last floor is reachable); computed in a rAF-throttled passive scroll listener (reads only). The cab moves with `transform: translateY` (700 ms), its height matched to the landing door on resize (ResizeObserver). The cab holds still while a car drives out.
- **Touch:** on `hover: none` the elevator's floor gets `is-inview` (door up, light flickers on, gradient car, headlights) — only one floor open at a time. The old IntersectionObserver path stays for the side-by-side layout. Tap = existing roll-out (car drives down/toward the viewer, labels fade, other floor dims), then the view-transition morph into the shop-bar mini bay. Back: the layout effect scrolls the returning car's floor into view before paint, the car reverses in, door comes down.
- **Reduced motion:** existing rules (no flicker/roll/drive, 0.2 s fades) plus the cab jumps (no transition); measured: only opacity transitions run; tap → car home in ~136 ms.
- **Tokens:** new CSS uses tokens only (`--s-*`, `--bw*`, `--t-*`, `--r-1`, `--line*`, `--night-*`, `--dur-*`); the one new token is `--dur-4`.

Checked (implementer, not verification), Playwright on `vite preview` of the build, mobile contexts isMobile/hasTouch/DPR 2:
- 390×844 and 360×740: scrollWidth = viewport width; one `h1`; no rendered text under 11 px; each floor has `a[href].gs-bay-link`; Tab focuses floor 01 with the gold frame outline + underlined name; no console/page errors through rest → scroll → tap → car home → Back.
- Scrolled to floor 02: cab at floor 02 (translateY 426 px at 390), `02` lit, floor 02 `is-inview`, floor 01 closed.
- Desktop: screenshots of rest and A40 hover at 1440×900 and 1024×768 before and after the change: pixel diff 0 (max channel difference 0) for all four.
- Third car (scratch copy with `content/third/car.json`): three floors `01/02/03`, cab tracks to 03 at the bottom, scrollWidth 390.
- `npm run build`, `npm run lint`, `npm run check-constants`, `node scripts/check-roadmap-plan.mjs` (11 ok, 0 FAIL) pass.
- Note for the reviewer: Playwright's `fullPage` screenshot drops touch emulation (`hover: none` flips to false), so the open floor closes in full-page shots; take them last or use viewport shots.
- Not checked: real phone frame rate, Safari/Firefox, the morph frames themselves (headless Chromium doesn't record them).

Screenshots: `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/mgarage/` (`v2-390-rest.png`, `v2-390-floor02.png`, `v2-390-driveout-mid.png`, `v2-390-carhome.png`, `v2-390-back-mid.png`, `v2-390-back-end.png`, `v2-390-focus.png`, `v2-390-full.png`, the same at 360, `v2-390-reduced-*.png`, `v2-390-three-*.png`, `desk/before-*.png` vs `desk/after-*.png`).

## Verification
Reviewer: independent agent (did not implement), 2026-11-05, branch `claude/keen-planck-2zcc5f` at c4b9cdd. `npm run build` then `npx vite preview --port 5225`; Playwright `chromium.launch()`, mobile contexts `isMobile/hasTouch/deviceScaleFactor 2`, viewport (not full-page) screenshots while scrolling. Master: copy of the repo in the scratchpad, `git checkout origin/master` (1928398), built and previewed on 5226. Third car: second scratch copy with `content/third/car.json` (copy of the AZ-1 car.json, name "Third Car", order 2) + one post, previewed on 5227. Screenshots: `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/mgarage-review/`.

**Result: fails review on two small defects (see Failed checks). Everything else passes.**

| Check | Result |
|---|---|
| Building, 390×844 / 360×740 / 414×896 / 600×900 | `gs--tower` at all four; roof bottom = `.gs-floors` top (188 px; 196 at 600), bays contiguous (a40 188–577, autozam 577–968 at 390), ground line under; scrollWidth = viewport width at all four. Pass |
| 601×900, 1024, 1440 | no `gs--tower`, no shaft/plates; side-by-side scene. Pass |
| Both cars within ~1.5 screens | last floor bottom / viewport height: 1.15 (390), 1.25 (360), 1.12 (414), 1.33 (600). Pass |
| Text ≥ 11 px | tree-walk of every visible text node (opacity > 0.05): none under 11 px at all four widths. Pass |
| AA contrast (computed colour vs floor bg `rgb(12,17,36)`) | name 13.67 (gold) / 17.57 (white), sub 9.99, desc 13.10, stats 8.23, latest 17.57, link 13.67, plate 18.37 on night-0, shaft numbers off 6.65 / lit 16.75, chips ≥ 9 (tinted chip bg). Pass |
| Elevator tracks scroll (0 → 25/50/75/100 % → 50 % → 0) | cab at landing 1,1,2,2,2,2,1; `is-here`, `is-inview` and lit number move with it; only one floor open at a time. Same at 360/414/600. Pass |
| Tap → car home | tap floor 02 → `/garage/autozam`, h1 "Autozam AZ-1", car in the hero bay (`390-carhome.png`); floor 01 → `/garage/a40`. Cab holds still during drive-out. Pass |
| Drive-out frames (`390-out-f00..05.png`) | car bottom 352 → 415 px, name top 382 (faded to 0 by then); car never crosses visible text. But `.gs-bay-desc` stays at opacity 1 while name/sub fade → **fail (1)** |
| Back | Back from autozam: floor 02 stage at 455–648 of 844 (in view), cab at 02, car reverses in (`390-back-mid.png`), ends `is-rest`. Back from a40: scrollY 0, cab 01. Pass |
| Reduced motion (emulated) | cab `transition: 0s`, cab already at floor 02 100 ms after scrolling; only `opacity` transitions fired (transitionrun/animationstart listener); tap → URL in 105 ms; Back lands on floor 02. Pass |
| Keyboard / SR | Tab reaches `/garage/a40` then `/garage/autozam` (`a.gs-bay-link`, `aria-labelledby` name); gold frame outline 2 px solid + underlined name (`390-focus-1/2.png`); one `h1` at every width. Pass |
| Console | no errors/page errors through rest → scroll → tap → home → Back at all widths, resize and rotate runs. Pass |
| Resize desktop window 1024 → 700 → 601 → 600 → 480 → 600 → 601 → 900 → 360 → 1024 | tower toggles exactly at 600/601, cab on a landing every time, no horizontal scroll, no errors. Pass |
| Rotate phone 390×844 → 844×390 → 390×844 | landscape: side-by-side, both bays in view; back to portrait: **both floors keep `is-inview`** (cab at 02, but floor 01 still open, `rotate-back-390.png`) → **fail (2)** |
| Desktop unchanged vs master | full-page shots, rest + hover A40 + hover AZ-1, at 1440×900, 1024×768 and 601×900: pixel diff 0 (max channel diff 0) for all 9 pairs (`desk-master-*` vs `desk-branch-*`). Pass |
| Third car | plates 01,02,03; cab 1 → 2 → 3 at the bottom → 1 back at top; scrollWidth 390; no errors (`third-390-bottom.png`). Pass |
| build / lint / check-constants / check-roadmap-plan | all exit 0 (roadmap plan: all `ok`, no FAIL). Pass |

**Looks:** still looks cool. The tower reads as one building: same line art and neon sign, parking-style 01/02 plates, the lit cab gliding in the shaft and the neon floor number are a good "different but same idea". Spacing is fine at 360–600; the 600 px edge is roomy but not awkward. Car never overlaps visible label text on drive-out or reverse-in. Only visual problem is (1): the paragraph hangs on alone under an empty gap while the car drives out.

### Failed checks
1. **Required.** `src/blog/garageScene.css:740`: `opacity: 1;` in `.gs--tower .gs-bay-desc` has the same specificity as `.is-leaving :is(.gs-bay-name, .gs-bay-sub, .gs-bay-desc) { opacity: 0; }` (line 468) and comes later, so the leaving car's description never fades (measured opacity 1.00 throughout the drive-out while name/sub go to 0). Fix: right after that block add `.gs--tower .is-leaving .gs-bay-desc { opacity: 0; }` (or drop the `opacity: 1`). Tested in a scratch copy: desc → 0.
2. **Required.** `src/blog/GarageScene.tsx:409`: the side-by-side IntersectionObserver writes `is-inview` with `classList` outside React; when the layout switches to the tower the observer disconnects but its classes stay on bays whose `className` prop didn't change, so after rotating a phone landscape → portrait two floors are open. Fix: ``key={tower ? `tower-${car.id}` : car.id}`` so bays remount (clean DOM) on a layout switch. Tested in a scratch copy: portrait → only the `is-here` floor open; landscape again → IO opens both as before; Back still works; lint/build pass.
3. Optional. Keyboard focus doesn't move the elevator: Tab to floor 02 while floor 01 is the scroll pick opens both (`:focus-within` + `is-inview`, `390-focus-2.png`). Could `setFloor(i)` on the link's `onFocus` when `tower`.
4. Optional (pre-existing, desktop too). Chips/stats/latest don't fade with the name on `is-leaving`/`is-dim`.

### Fixes after review (2026-11-05)
- `garageScene.css`: `.gs--tower .is-leaving .gs-bay-desc { opacity: 0; }`. Checked: the leaving floor's description fades (opacity ≈ 0 at 300 ms into the drive-out).
- `GarageScene.tsx`: bay key includes the layout (`tower-<id>`), so in-view marks from the side-by-side scene don't survive a rotate. Checked: landscape 844×390 → portrait 390×844 leaves exactly 1 open floor.
- Optional, done: focusing a floor link moves the elevator to it. Checked: focus on floor 02 → floor 02 is the elevator's floor.
Build and lint pass.
