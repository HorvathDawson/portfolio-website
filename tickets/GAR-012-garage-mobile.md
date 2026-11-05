---
id: GAR-012
title: Garage on phones: a multi-storey garage tower
status: review
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
- [x] Floor in view opens; tap drives out to the car home; Back reverses in; elevator indicator tracks the floor in view
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
_Filled by the reviewer._
