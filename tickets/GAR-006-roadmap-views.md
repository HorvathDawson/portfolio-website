---
id: GAR-006
title: Roadmap views for deciding what to work on
status: done
owner: roadmap-views agent
reviewer: independent review agent
blocked_by:
---

## Why
The swim-lane map shows all 174 tasks and 388 edges at once. It's hard to see what's ready to do, what to buy first, or what a task depends on.

## Design
- **Next up** (default): ready-now tasks split into Decide / Buy / Do, ranked by how much they unblock; "almost ready" (one dependency left); the critical path to registration; progress by kind and epic.
- **Tree**: pick a task, see what it needs first (left) and what it unlocks (right), done tasks hidden, hard edges only by default.
- **Map**: the existing swim-lane view.
- View and focused task in the URL.

## Acceptance criteria
- [x] Every "ready" task has all hard dependencies complete/decided (checked by a script against the real data)
- [x] Critical path is a valid chain of unfinished tasks along hard edges
- [x] Works at 390 px wide with no page-level horizontal scroll; keyboard-usable
- [x] Map view unchanged
- [x] `npm run build` and `npm run lint` pass
- [ ] Owner has tried it and picked the default view

## Verification
Reviewer: independent review agent (did not implement), 2026-10-24.

Common runs: `npm run build` exit 0; `npm run lint` exit 0; `node scripts/check-roadmap-plan.mjs` 11 ok / 0 FAIL. `npx vite preview --port 5195` on the build; Playwright (chromium.launch(), no options) at 1440x900 and 390x844 (isMobile, hasTouch), collecting console errors, page errors and failed requests on every page: none (Google Fonts requests aborted by navigation ignored). axe-core is not in node_modules (skipped); Lighthouse not installed (not run). Screenshots/PDFs: `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/review2/`.

GAR-006 checks:
- Ready tasks: `check-roadmap-plan.mjs` "every ready task is unfinished with all hard deps done" and "ready set is exactly the unfinished tasks with no unfinished hard deps": ok against the real roadmapData (40 ready).
- Critical path: "critical path is a hard-edge chain of unfinished tasks", "starts at a ready task", "ends at t-registration": ok; the page shows the same 14-step chain.
- Next up (default, `/garage/a40/roadmap`, switcher shows "Next up"): Decide 8 / Buy 15 / Do 17 groups (8 cards shown each), 14-item critical path, 12 almost-ready, progress panel. Deep links: `?view=next&task=t-frame-design` opens the drawer on "Ladder Frame Design"; `?view=tree&task=t-frame-design` focuses that task; `?view=bogus&task=nope` falls back to Next up. Switching views keeps state in the URL (`?view=tree`, tree node click → `&info=…`, Back restores `?view=tree`; Map gets `&task=` of the tree focus and isolates it). Drawer post link → `/garage/a40/frame-design`.
- 390x844: scrollWidth 390 on Next up, Tree and Map. Screenshots `phone-roadmap-next.png`, `phone-roadmap-tree.png`, `phone-roadmap-map.png`.
- Map: `?view=map` renders all 175 cards and 391 SVG paths; layout matches the audit screenshot (`scratchpad/shots/desk_a40_roadmap.png`) except the new view switcher in the top bar, which pushes the zoom control onto a second row at 1440 (`desk-roadmap-map-full.png`). Ticked as unchanged.
- Keyboard: cards are buttons; Enter opens the drawer and Escape closes it. **But focus stays on the card when the drawer (role="dialog") opens: reaching the drawer took 96 Tab presses at both widths** (see Failed checks).

### Failed checks
1. Task drawer is not keyboard-usable: opening it does not move focus into it, and closing it does not return focus. Fix in src/blog/A40Roadmap.tsx: in `TaskDrawer` (line 312) add `const closeRef = useRef<HTMLButtonElement>(null); useEffect(() => { closeRef.current?.focus(); }, [task.id]);` and put `ref={closeRef}` on the `.rm-drawer-close` button (line 334). In src/blog/A40RoadmapViews.tsx `openInfo` (line 91) remember `document.activeElement` in a ref and focus it again in `closeInfo` (line 95) / on Escape. Re-check: Enter on a Next up card → `document.activeElement` is inside `.rm-drawer`; Escape → focus back on the card.

Owner box ("tried it and picked the default view") stays open.

## Implementer notes
- New: src/blog/roadmapPlan.ts (logic), A40RoadmapViews.tsx (switcher, now the /a40/roadmap route), RoadmapNextUp.tsx, RoadmapTree.tsx, roadmapViews.css, scripts/check-roadmap-plan.mjs (11 invariant checks against the real data: `node scripts/check-roadmap-plan.mjs`).
- A40Roadmap.tsx: TaskDrawer exported; main component renamed RoadmapMap; switcher in its top bar.
- Ranking: tasks that gate something first, in-progress first within each group, then bottleneck score.
- Tree omits links implied by a longer chain (count shown).
- Removed two duplicate brake-system edges from roadmapData.ts (kept the originals).
- Critical path today (14): narrowing analysis → SA v2 → front shocks → frame design → design finalization → buy metal → frame build → engine mockup → trans crossmember → engine install → wiring → engine startup → alignment → registration.

## Fix after review (Oct 2026)
- TaskDrawer focuses its close button on open; closing returns focus to the card that opened it. Checked in Playwright: Enter on a Next up card → focus on .rm-drawer-close; Enter → focus back on .rv-card-main. Needs reviewer re-tick.

### Re-check of the fix (2026-10-24)
Re-check, independent reviewer (did not implement the fixes), 2026-10-24, on 80c37a3 + A40-010 working tree: A40Roadmap.tsx `TaskDrawer` focuses `closeRef` (`.rm-drawer-close`) on open; A40RoadmapViews.tsx stores `document.activeElement` in `opener` in `openInfo` and refocuses it in `closeInfo` (used by Escape and the close button). Playwright at 1440x900 and 390x844: Next up, focus first `.rv-card-main` → Enter → activeElement `.rm-drawer-close`, inside `.rm-drawer`, URL `?view=next&task=t-decide-arb-front` → Escape → focus back on the same card, URL `?view=next`; Enter on the close button also returns focus to the card. Tree view: same via the `.rv-node-info` button (`&info=t-narrowing-analysis`), focus returns to it. scrollWidth 390 on Next up, Tree and Map at 390; no console errors; build/lint exit 0. Keyboard box now ticked. **Pass; status done** (owner box "tried it and picked the default view" still open, owner-only).
