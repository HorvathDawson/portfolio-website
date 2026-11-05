---
id: GAR-011
title: Build the D2 "bay to bench" design (cleaned up, consistent, easy to extend)
status: in-progress
owner: implementation agent
reviewer: (independent agent, then Dawson on the preview)
blocked_by:
---

## Owner decision (Nov 2026)
Build D2 from the round-2 mockups (`assets/GAR-009-mockups/D2-*.png`, README "D2"), but **clean up the navigation and the style so they are more consistent and easier to read**, and make the code **easy to add to and edit later**.

## Principles
1. **One way to navigate per job.** Find a post: sheet rail (desktop) / sheet index (drawer, all sizes) / search. Move through posts: prev/next sheet tabs (+ phone bottom bar). Within a post: the TOC. Switch car: the mini bays in the shop bar. Nothing duplicated on screen at once; every nav element is a real link.
2. **Readable first.** Long-form body text in one serif at ~18 px / 1.7 line height, ~70ch measure, AA contrast everywhere. Mono only for UI labels, meta, numbers. Decoration (grid, tape, stickers, stamps) stays in the margins: never tilt or texture body text or tables.
3. **Consistent.** All colours, spacing, type sizes, radii, borders, shadows and motion come from one tokens file. One card style, one chip style, one callout component with variants, one table style.
4. **Easy to extend.** Adding a car = folder + `car.json`. Adding a post = Markdown file (sheet number derived). Callouts, figures and tables come from Markdown syntax documented in an authoring guide. A dev-only style-guide page shows every component.

## Acceptance criteria
- [ ] Shop bar (neon sign → /garage, mini-bay car switcher, breadcrumb, search, Sheets, Roadmap) replaces the sidebar on every garage page
- [ ] Sheet rail on desktop; sheet-index drawer (focus-trapped dialog, Esc closes) on all sizes; phone bottom bar (prev / Sheets / n of N / Contents / next)
- [ ] Posts as drafting sheets: title block (drawing no. + sheet derived from epic order + date, optional frontmatter override), work-order tag for roadmap tasks, sticky TOC with read progress, prev/next sheet tabs
- [ ] Car home (`/garage/:car`): lit bay hero, stats + "Continue / Start at sheet 01", Next up tags, the wall (one board per epic with progress, sheets, next task), key numbers. Garage-kind cars (Autozam) get the same page with categories instead of epics and the service table
- [ ] Markdown callouts `> [!decision]`, `[!verify]`/`[!measure]`, `[!safety]`, `[!open]`, `[!note]`; figures with captions + click-to-enlarge; engineering-sheet tables with status chips; code blocks with copy button; KaTeX panel
- [ ] Single tokens file; no stray hex colours / ad-hoc spacing in garage, blog and roadmap CSS; old unused CSS removed
- [ ] `content/README.md` authoring guide (posts, frontmatter, placeholders, callouts, figures, adding a car); dev-only `/garage/_styleguide` page
- [ ] Existing features still work: search, print (full-length, decoration off), reduced motion, garage scene + loader, roadmap views (restyled with tokens), redirects, constants checks
- [ ] AA contrast; keyboard and focus visible; one h1 per page; no horizontal scroll at 390 px on every page
- [ ] `npm run build`, `npm run lint`, `npm run check-constants`, `node scripts/check-roadmap-plan.mjs` pass

## Verification
_Filled by the reviewer._
