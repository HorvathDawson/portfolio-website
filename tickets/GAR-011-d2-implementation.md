---
id: GAR-011
title: Build the D2 "bay to bench" design (cleaned up, consistent, easy to extend)
status: review
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
- [x] Shop bar (neon sign → /garage, mini-bay car switcher, breadcrumb, search, Sheets, Roadmap) replaces the sidebar on every garage page
- [x] Sheet rail on desktop; sheet-index drawer (focus-trapped dialog, Esc closes) on all sizes; phone bottom bar (prev / Sheets / n of N / Contents / next)
- [x] Posts as drafting sheets: title block (drawing no. + sheet derived from epic order + date, optional frontmatter override), work-order tag for roadmap tasks, sticky TOC with read progress, prev/next sheet tabs
- [x] Car home (`/garage/:car`): lit bay hero, stats + "Continue / Start at sheet 01", Next up tags, the wall (one board per epic with progress, sheets, next task), key numbers. Garage-kind cars (Autozam) get the same page with categories instead of epics and the service table
- [x] Markdown callouts `> [!decision]`, `[!verify]`/`[!measure]`, `[!safety]`, `[!open]`, `[!note]`; figures with captions + click-to-enlarge; engineering-sheet tables with status chips; code blocks with copy button; KaTeX panel
- [x] Single tokens file; no stray hex colours / ad-hoc spacing in garage, blog and roadmap CSS; old unused CSS removed
- [x] `content/README.md` authoring guide (posts, frontmatter, placeholders, callouts, figures, adding a car); dev-only `/garage/_styleguide` page
- [x] Existing features still work: search, print (full-length, decoration off), reduced motion, garage scene + loader, roadmap views (restyled with tokens), redirects, constants checks
- [x] AA contrast; keyboard and focus visible; one h1 per page; no horizontal scroll at 390 px on every page
- [x] `npm run build`, `npm run lint`, `npm run check-constants`, `node scripts/check-roadmap-plan.mjs` pass


## Implementer notes

**Where things live**
- Tokens: `src/blog/styles/tokens.css` (colour, status, paper, type scale, spacing, radii, borders, shadows, motion, layout heights, z-index). Imported once via `src/blog/styles/garage.css` (tokens → base → components → layout → home → print). Roadmap adds `styles/roadmap.css`, /garage adds `styles/selector.css`; the scene keeps `src/blog/garageScene.css` (now on tokens). Garage CSS has no hex colours outside tokens.css (`grep '#[0-9a-f]{3,8}' src/blog/styles/*.css src/blog/garageScene.css` only hits tokens.css).
- Deleted: `blogStyles.css` (old sidebar/mobile list/geocities CSS; its roadmap part moved to `styles/roadmap.css`), `garage.css`, `roadmapViews.css` (merged into roadmap.css), `PostTools.tsx`, `CarArt.tsx`.
- Markdown rules: `src/blog/markdown.ts` (callouts, single-image figures, status-chip / numeric tables, code filename tab + copy, heading ids shared with the search index). Post-render decoration: `src/blog/postDom.ts` (dimension lines `02 / 07` above h2, TOC entries with numbers, figure numbering + zoom button, table scroll boxes, window scroll memory).
- Sheets: `postIndex.ts` `sheetsFor()` / `sheetGroups()` (epic order then date; garage cars reference first then date; frontmatter `sheet:` moves a post, `drawing:` overrides the number; `code` in car.json is the prefix).
- Roadmap queries for posts/car home: `roadmapQueries.ts` (lazy chunk via `useRoadmap.ts`), reusing `roadmapPlan.ts` `readyTasks` / `compareByPriority` for Next up, per-epic next task and work-order "opens next".
- Authoring guide: `content/README.md`. Style guide: `/garage/_styleguide` (`src/blog/StyleGuide.tsx`, only routed and bundled when `import.meta.env.DEV`; not in the sitemap).

**Components** (`src/blog/components/`, one per file, props commented): `ShopBar` (neon → /garage, `CarSwitcher` mini bays, breadcrumb, `PostSearch`, Sheets, Roadmap tag), `SheetRail`, `SheetIndex` (drawer on `Dialog`: focus moves in, Tab trapped, Esc / scrim closes, focus returns), `Dialog`, `SheetTabs`, `BottomBar`, `TitleBlock`, `WorkOrder`, `Toc` / `TocList` (sticky, active section, read progress), `CarHome` (hero, stats, Continue / Start, Next up, the wall boards, service table), `KeyNumbers` (car.json `keyNumbers` read from constants; hidden for cars without), `Lightbox`, `Gags`, `Icons`. `GarageScene.tsx` now exports `BayHero` (same bay markup held lit, `.is-lit`) used by the car home.

**How to add**: a post = a Markdown file (sheet no. derived); a car = folder + `car.json`; a callout = `> [!decision] Title` (decision, verify, measure, safety, open, note). Details in `content/README.md`.

**Simplified vs the D2 mockup (and why)**
- One way per job: dropped the floating "Sheet index" side tab, the "Sheet index 16/18" middle sheet tab and the drawer's Sheets / On this sheet / Roadmap tabs (they duplicated the Sheets button, the TOC and the Roadmap tag). Rail is desktop only; phones get the bottom bar instead (prev · Sheets n of N · Contents · next; the counter is the Sheets button, so there is no dead "16 of 18" cell). No bottom bar on the car home (the wall lists every sheet; shop bar has search).
- Rail is one compact row, no "last read" text; the car home's Continue button covers that (last sheet read is kept in localStorage per car).
- No tilt on body text, tables, work orders or tags' text; only the callout sticker label is rotated (it sits on the border). Figures have no masking tape and sit in a dark framed card instead of paper: the plots are dark-on-navy, so a paper card only added a white border.
- Title block drops Rev / Drawn / Scale (no data behind them); it absorbs the old garage facts (mileage, cost, parts). No lede under the post title (it repeated the first paragraph).
- One chip style (status chips, also in the roadmap, replacing `sb-status-dot` / `sb-epic-badge`), one card/board style, one callout component, one table style. Stamps only on paper (work order, tags).
- Roadmap pages: shop bar on top, same views; old back link removed (the breadcrumb does it). Roadmap CSS was mechanically tokenised (colours → status/ink tokens, exact spacing values → `--s-*`); some small literal sizes in the dense map remain.
- Status-chip rule is limited to columns headed `Status` or `Check`, so prose tables never sprout chips.

**Posts converted to callouts** (wording unchanged): rear-suspension (decision, measure), steering (verify), build-constants (note: status legend), epas-can-gateway (safety, 2× verify). digital-dash gained two code filename tabs.

**Checked** (Playwright against `vite preview`, screenshots in the session scratchpad `d2/`): 1440×900 and 390×844 for /garage (hover lights the bay, click drives out and lands on /garage/a40 with the thumbnail carrying `garage-car-a40`), car homes, posts, roadmap next/tree/map, sheet index open, search open, lightbox; all 20 posts + garage/roadmap/not-found pages at 390: one h1, no horizontal scroll; 26 internal links resolve; no console errors; drawer focus in → trapped → back to the Sheets button; print PDF of geometry-design-reference is 11 pages with bar/rail/TOC/tabs/bottom bar hidden. `npm run build`, `npm run lint`, `npm run check-constants`, `node scripts/check-roadmap-plan.mjs` pass.

## Verification
_Filled by the reviewer._
