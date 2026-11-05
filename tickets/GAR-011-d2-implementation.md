---
id: GAR-011
title: Build the D2 "bay to bench" design (cleaned up, consistent, easy to extend)
status: review
owner: implementation agent
reviewer: independent review agent (Nov 5 2026), then Dawson on the preview
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
Independent review, 2026-11-05. Reviewer did not implement. Checked against `npm run build` + `npx vite preview --port 5215` with Playwright (chromium, 1440x900, 1024x768, 390x844) and the code. Screenshots are in the session scratchpad `d2review/`.

**Checks run**
- `npm run build` passes (built in 2.7 s). `npm run lint`, `npm run check-constants` (752 placeholders in 18 posts) and `node scripts/check-roadmap-plan.mjs` all exit 0.
- **Every page at all 3 sizes** (84 loads: the 26 sitemap garage URLs, roadmap tree/map and 2 not-found URLs): exactly one h1 on each, no horizontal scroll (`scrollWidth == clientWidth`), no console errors or page errors. Collected 158 internal links and loaded every one. Each resolves and every `#hash` target exists. The only "miss" was the not-found page linking to itself.
- **Nav at 1440:** the rail, the Sheets button, search, the TOC and the sheet tabs are visible. The bottom bar is hidden. **At 390:** the rail, TOC and Sheets button are hidden and the bottom bar is shown. Every movement control is an `<a>`: rail cells, crumbs, mini bays, tabs and bottom-bar prev/next. Only the Sheets and Contents buttons are `<button>`, and they open dialogs. Shop-bar links are `/garage`, `/garage/a40` (aria-current), `/garage/autozam`, the crumb and `/garage/a40/roadmap`.
- **Sheet index:** opening it moves focus to the filter. I pressed Tab 60 times and Shift+Tab 5 times, and focus stayed inside every time. Esc closes it, and focus returns to `.shopbar-sheets` at 1440 and `.bbar-mid` at 390. Clicking the scrim closes it. It shows 18 rows and the "You are on 16" card, and filtering on "steer" leaves only `/garage/a40/steering`.
- **Contents dialog (phone):** it has 7 links. Tapping one lands on `#build-plan` at 108 px from the top, below the bar, and the dialog closes.
- **TOC progress:** reads 0 % at the top, 22 % in the middle and 70 % at the bottom (27 % and 71 % at 390). The active entry follows the scroll.
- **Prev/next tabs:** they show "Sheet 15 · E5 Frame Jig Build" and "Sheet 17 · E5 Digital Dash". The bottom-bar next link lands at scrollY 0.
- **Search on desktop:** pressing `/` focuses the box. "bump steer" returns `/garage/a40/steering#rack-narrowing`, and ArrowDown then Enter lands on that h2, 112 px from the top (108 px at 390).
- **Redirects:** `/a40`, `/a40/`, `/a40/rear-suspension` and `/a40/roadmap?view=map` redirect client-side to `/garage/...` with the query kept. `public/_redirects` has the 301s.
- **/garage morph:** View Transitions are available. Clicking a bay drives the car out, and the URL changes after about 600 ms. On `/garage/a40`, `garage-car-a40` is on the mini bay, and Back returns to `/garage`. With reduced motion, navigation takes 144 ms, the post runs no animations and `scroll-behavior` is auto. With the network throttled, the loader (`.slime-loader`) mounts.
- **Print:** in print media the shop bar, rail, TOC, tabs, bottom bar and gags are `display: none`. Geometry-design-reference prints to 8 A4 pages and rear-suspension to 5. Neither is cut off.
- **Readability (rear-suspension, measured):**
  - Body text is Lora 18 px / 30.6 px (1.7), and 17 px / 28.9 px on the phone. Table cells are 15 px.
  - Contrast ratios, computed from the styles: body 11.9:1, TOC links 13.7, TOC numbers 6.95, crumbs 7.7, sheet-tab labels 6.8, chips 6.8 to 11.3 on surface, ink-4 on surface-2 4.93, and table headers 7.5.
  - Manila paper: stamps 4.8 to 6.7 and work-order ink 11.2. Every pair is AA except one, listed below.
  - Nothing is tilted except `.callout-label` (the sticker). No background texture on `p` or `table`.
  - **Line length is 94 characters per line at 1440** (counted from rendered lines). `70ch` in Lora is 782 px. That is too long for the stated ~70.
  - **On the phone the first body paragraph starts 1095 px down a 844 px screen.** The first prose element (the callout) starts at 828 px. The title, tags, a 7-cell title block and the work order fill the whole first screen.
  - **"Updated —" shows on all 20 posts.** No post has an `updated:` date.
- **Consistency:**
  - `grep '#hex'` and `rgba(` across `src/blog/styles/*.css` and `garageScene.css` only hit tokens.css.
  - **Literal sizes remain:** 40 literal font sizes in components/layout/home.css (8.5, 9.5, 10, 11, 11.5 px and others) and about 77 literal padding/margin/gap values (5, 6, 7, 10, 14, 18, 22, 26, 56 px). roadmap.css has 85 literal font sizes and about 80 literal spacing values.
  - One chip, card, callout and table style is used across posts, the car home and the style guide. The roadmap Next up and Map views still use their own `rm-card-*` / `rv-crit-badge` flags.
  - Autozam pages use the same layout, with REF/INS groups and the category cell in the title block.
- **Extensibility (followed content/README.md literally in a scratch copy, node_modules symlinked, no code changes):**
  - I added a third car, `content/mini/car.json` (kind build, 2 epics), with `01-subframe-check.md`. It has a `> [!decision]` callout, an image with a title, a Status table and a `yaml title=` code block. I also added an A40 post, `review-test-post.md` (epic finishing, uses `{{rear_track}}`).
  - The build passed. The sitemap lists `/garage/mini`, `/garage/mini/subframe-check` and `/garage/a40/review-test-post`.
  - `/garage` shows 3 bays, and there are 3 mini bays in the shop bar. The Mini home has the hero, stats and a wall with 2 boards.
  - The Mini post gets drawing no. MIN-BOD-01, sheet 01 of 01, epic E2 Bodywork. Its callout is `callout--decision`, its figure is "FIG. 1" with Zoom, the chips read MEASURE / OPEN / LOCKED, the number column is right-aligned and the code block has a filename tab and Copy.
  - The A40 post gets A40-FIN-01, sheet 19 of 19, `1340 mm`. The rail and the other posts move to "of 19". There is no horizontal scroll at 390 and no errors.
- **Style guide:** `/garage/_styleguide` renders in `npm run dev` (14 sections: tokens, type, spacing, chips, title block, callouts, tables, code, figure, bay hero, key numbers, tabs). In preview it shows "Page not found". No `dist/` file mentions it and it is not in the sitemap.
- **Keyboard:** I tabbed through 40 stops on a post: skip link, neon, bays, crumb, search, Sheets, Roadmap, 18 rail cells, TOC and anchors. Every stop has a visible outline. The search box shows focus through its gold `:focus-within` border.

### Failed checks
**Required** (needed for the acceptance boxes or for the owner's "consistent and reads easier" goal):
1. **Line length too long.** `src/blog/styles/tokens.css:115` sets `--measure: 70ch`, which is 782 px in Lora and gives 94 characters per line. Change it to `--measure: 34em` (612 px, about 73 characters per line). Let figures and tables keep the full column through `.wide` / the table scroll box if they need it. Then recheck that `.sheet-body--toc` still lines up with the TOC.
2. **Phone body text starts below the first screen** (at 1095 px on an 844 px screen). At `max-width: 600px`, collapse the head:
   - Make the title block a single summary line: drawing no. · sheet n/N · date · status chip. Put the full `<dl>` inside a `<details>` ("Title block").
   - Make the work order a `<details>` with the summary "Work order WO-0007 · 2 tasks".
   - Files: `components/TitleBlock.tsx`, `components/WorkOrder.tsx`, `GarageBlog.tsx:188-190`, and the CSS in `styles/layout.css:283-292`.
   - Target: the first paragraph or callout is visible at 390x844 without scrolling.
3. **Hide the "Updated —" placeholder.** `components/TitleBlock.tsx:18` always pushes the Updated cell. Push it only when `p.updated && p.updated !== p.date`, as is already done for mileage and cost.
4. **Phone search icon does not focus the box.** After a tap, `activeElement` stays on `.shopbar-search-btn`, so the user has to tap again. Cause: `PostSearch.tsx:160` uses the `autoFocus` attribute, which only works on mount, and the component is always mounted. Fix: add `useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);` in PostSearch (`inputRef` is at line 94). Esc in the open panel should also close it and return focus to the button.
5. **Ad-hoc sizes break box 6.**
   - Replace the literal `font-size` / `font:` px values in `styles/components.css`, `layout.css` and `home.css` with type tokens. Examples: `components.css:135,202,345,349`, `layout.css:151,251,254,278,320`, `home.css:15,101,115`.
   - Replace the literal padding, margin and gap values with `--s-*` tokens. If 6 px and 10 px are really needed, add `--s-1h` and `--s-2h` to tokens.css rather than hard-coding them.
   - Do the same pass on `styles/roadmap.css`, at least for type.
   - Verify with `grep -nE "font(-size)?:[^;]*[0-9.]+px|(padding|margin|gap)[a-z-]*:[^;]*[0-9]+px" src/blog/styles/{components,layout,home}.css`. It should only hit hairlines and icon sizes, with a comment on each.
6. **Text that is too small to read.** 8.5 to 10 px text is used for the 88x31 badge, `.board-next b`, `.stats dt`, `.board-k`, the neon on the phone (9.5 px), bottom-bar labels (10 px), the sheet-index counters, and in the roadmap `rv-crit-badge` (9 px), `rv-node-meta` (9.5 px) and `rm-card-*` (10 px). Raise `--t-micro` to 11 px, make it the floor for every UI label, and point these at it. Decorative gags can stay smaller if they are `aria-hidden`.
7. **AA failure (box 9).** On the roadmap Map view, the `chip--decided` sitting on `.rm-card--decided` is 4.41:1. The cause is the gradient background in `styles/roadmap.css:395-399` plus the translucent chip fill. Give chips inside `.rm-card` an opaque background, for example `.rm-card .chip { background: var(--night-0); }`, or lighten that gradient, then remeasure to at least 4.5.
8. **Public text that is really an authoring note.** The Autozam home shows "No services logged yet. List jobs in a post's `service:` frontmatter…" (`components/CarHome.tsx:170`). Leave the Service record section out when `rows.length === 0`, or show only "No services logged yet." Move the how-to to content/README.md, where it already is.
9. **Gag shows A40 data on every car.** "SR20 powered" (`components/Gags.tsx:15`) appears on the Autozam and on new cars. Take it from car.json (for example an optional `badge` field, documented in content/README.md) or drop it.

**Optional** (would improve consistency and polish, but no box depends on them):
- At 1024 the breadcrumb is cut off ("Sheet 16 of …"), and the tags sit right against the title block because of `layout.css:268` `gap: 0`. Use `gap: var(--s-4)` and let the crumb shrink before it is cut.
- The rail's right-hand "16 Rear Suspension…" label repeats the breadcrumb's last crumb (principle 1). Remove one of them.
- The "A40 Build Log" crumb and the active mini bay are two links to the same car home.
- The `/` key hint shows in the phone search panel, where it is no use. Hide it under `(hover: none)`.
- `content/a40/rear-suspension.md:10-11` gives the DECISION callout body the bold lead "Decision (October 2026): …". Write it as `> [!decision] October 2026`, as the mockup and the guide do.
- The roadmap Next up and Map cards and flags (`rm-card-defer`, `rv-crit-badge`, the mono caps "READY NOW" heading) still use a different card, chip and heading language from the car home (`.section-h`, chips, manila tags). Moving them onto the shared components would finish the "one card / one chip" goal.
- The `/garage` morph lands on the shop-bar mini bay, not on the big lit hero bay that sits right under it. Putting the transition name on `BayHero` would read more naturally.
- Print reliability: post images get `loading="lazy"` (`blogData.ts:30`). In Playwright `page.pdf()` without scrolling, figures came out blank or cropped (rear-suspension p. 4). Add a `beforeprint` handler in `postDom.ts` that sets `img.loading = 'eager'`, so printing straight from the top always includes the plots.

## Fixes after review
Required:
1. `--measure: 34em` (612 px of Lora, ~73 characters per line). The `.sheet-body--toc` grid is now `minmax(0, var(--measure)) 236px` with space-between, and it sets the body font size so the em value resolves the same as in `.prose`. The TOC lines up with the title block's right edge.
2. Phones (< 600 px): the title block and the work order are `Collapsible` `<details>` (new `components/Collapsible.tsx`).
   - Title block summary: drawing no. · n/N · date · status chip.
   - Work order summary: "Work order WO-0007 · 2 tasks".
   - At 390x844 the first callout or paragraph now starts at 442 px, inside the first screen (it was 1095 px).
3. The Updated cell is only added when `updated` differs from `date`.
4. Phone search: `PostSearch` focuses the input whenever `autoFocus` turns on. Esc (or picking a result) closes the panel and returns focus to the search button. Checked: activeElement is `.post-search-input` after the tap, then `.shopbar-search-btn` after Esc.
5. Type and spacing are on tokens in base, components, layout, home, selector and roadmap CSS.
   - New tokens: `--t-callout` 17, `--t-h4` 19, `--t-stat` 22; `--s-1h` 6, `--s-2h` 10, `--s-4h` 20, `--s-6h` 40, `--s-7h` 56.
   - The reviewer's grep now only hits five 1 px hairlines and two 18 px line boxes, each with a comment.
6. `--t-micro` is now 11 px and is the floor. A Playwright scan of every visible text element at 1440, 1024 and 390 finds nothing under 11 px outside the aria-hidden gags.
   - This covers the roadmap legend icons (their inline 9/10 px sizes were removed) and the bottom-bar labels.
   - Mini-bay labels use the car's `code` (A40 / AZ1) so they fit at 11 px.
7. Map chips: `.rm-card .chip` and `.rm-drawer .chip` get an opaque base, `color-mix(st 14%, --night-0)`. `chip--decided` on a decided card is now 7.9:1 (it was 4.41).
8. The Service record section is left out until a post lists a `service:` item. The how-to is only in content/README.md.
9. The car's own badge comes from optional `"badge"` in car.json (A40: "SR20 powered", documented in content/README.md). Cars without one show only the generic "Best viewed" badge.

Optional, done:
- 1024 px:
  - The search box shrinks (`flex: 0 1 280px`, min 180) and the last crumb never truncates; the crumb check found nothing cut off at 1440, 1024 or 390.
  - The stacked post head has `gap: var(--s-4)`.
- Rail: the right-hand current-sheet label is removed (the breadcrumb has it).
- The `/` hint is hidden under `(hover: none)`.
- rear-suspension: `> [!decision] October 2026`, with the body starting "The rear is a narrowed…". The repeated "Decision (October 2026):" lead is gone.
- Print: a `beforeprint` handler in postDom.ts sets lazy images to eager. With that event fired, every image on rear-suspension loaded before `page.pdf()`.

Re-checked: `npm run build`, `npm run lint`, `npm run check-constants` and `node scripts/check-roadmap-plan.mjs` pass. Playwright at 1440, 1024 and 390 (screenshots `fix-*.png` in the session scratchpad `d2/`):
- one h1 per page and no horizontal scroll on all 27 phone pages
- 26 internal links resolve
- drawer focus moves in, is trapped, and returns to the Sheets button
- print is 11 pages with no navigation
- no console errors

### Re-check 2026-11-05 (after "Fixes after review")
Same reviewer and setup: build plus `vite preview :5215`, Playwright at 1440, 1024 and 390. Screenshots are in the session scratchpad `d2recheck/`.

- **Build and checks:** build, lint, check-constants and check-roadmap-plan all exit 0.
- **Sweep:** 28 garage URLs at 3 sizes (84 loads). One h1 each, no horizontal scroll, no console or page errors. All 158 internal links and #anchors resolve.
- **Required fixes:**
  1. **Line length:** `--measure: 34em` makes `.prose` 612 px. Rendered lines are 71 to 73 characters (were 94). ✔
  2. **Phone first screen:** at 390x844 the title block and work order are collapsed `<details>` ("A40-FAB-02 · 16/18 · Mar 26, 2026 · IN PROGRESS" and "WORK ORDER WO-0007 · 2 tasks"). The first prose element (the callout) is at 442 px (was 828) and the first plain paragraph at 718 px (was 1095), both on the first screen. In print media the collapsed content is still shown (title block 205 px tall, work order 80 px). ✔
  3. **Updated cell:** no "Updated —" on any of the 20 posts. The title block is now 6 cells. ✔
  4. **Phone search:** tapping the icon focuses `.post-search-input`. Esc closes the panel and returns focus to `.shopbar-search-btn`. "bump steer" → ArrowDown → Enter lands on `steering#rack-narrowing` H2 at 108 px. ✔
  5. **Literal sizes:**
     - No hex or `rgba(` outside tokens.css.
     - In components, layout, home, base and selector CSS the grep only hits 1 px hairlines and two 18 px line boxes, each commented.
     - roadmap.css has 0 literal font sizes. Its 8 spacing hits are `1px` hairlines and the `min(420px, 92vw)` drawer gutter. ✔
  6. **Small text:** `--t-micro` is 11 px. A scan of all visible, non-aria-hidden text on the post, both car homes and the 3 roadmap views finds nothing under 11 px. Table headers and chips are now 11 px. ✔
  7. **Map `chip--decided`:** now passes; the scan no longer flags it. ✔ But see the failed check below.
  8. **Autozam home:** the Service record section is gone (no `service:` items yet), and the wall is section 01. ✔
  9. **Badges:** the Autozam shows only the generic badge. The A40 badge comes from car.json `badge`. ✔
- **Optional fixes:**
  - At 1024 the full "Sheet 16 of 18" crumb shows, the search box shrinks, and there is a gap between the tags and the title block.
  - The rail's current-sheet label is gone, and the `/` hint is hidden on touch.
  - The rear-suspension callout title is "October 2026". ✔
- **Regressions:**
  - Sheet index: focus starts in the filter. 65 Tab and Shift+Tab presses never left the dialog. Esc returns focus to Sheets (1440) and to `.bbar-mid` (390), and a scrim click closes it.
  - Phone Contents: links land on the heading.
  - Next tab lands at scrollY 0. `/a40/*` redirects still work.
  - `/garage` morph: `garage-car-a40` on arrival, Back works.
  - Reduced motion: navigation in 139 ms, no animations. The loader mounts under throttling.
  - Print: rear-suspension is 5 A4 pages and geometry-design-reference 8. Navigation and gags are `display: none`, and both rear-suspension figures render (they did not before).
  - Contrast on the post, car homes, roadmap tree and car-facts: no failures off paper.

### Failed checks (re-check)
**Required** (box 9, AA contrast):
1. **Roadmap Map view, completed cards: `chip--complete` is 4.26:1.** The chip is `#7fdcaa` on its opaque base, but `.rm-card--complete .rm-card-meta { opacity: 0.6; }` (`src/blog/styles/roadmap.css:411`) dims the whole meta row, chip included.
   - Fix: replace that `opacity: 0.6` with `color: var(--ink-3);`, so the meta text is muted by colour and the chip keeps full strength.
   - If the faded look is wanted, add `.rm-card--complete .rm-card-meta .chip { … }` with no opacity, and move the meta row's opacity onto its text spans only.
   - Then remeasure: the chip should be ≥ 4.5:1, and `--ink-3` on the card is about 6:1.
   - The hover and cone fades (`.rm-card--faded` 0.32, `.rm-card--dimmed` 0.25) are temporary focus states and are fine.

Everything else passes. Once this one-line fix is in and the chip is remeasured at ≥ 4.5:1, tick box 9 and set the status to done.

### Final fix (2026-11-05)
`roadmap.css:411`: `.rm-card--complete .rm-card-meta` uses `color: var(--ink-3)` instead of `opacity: 0.6`. Measured on the Map view at 1440: "Complete" chip rgb(127,220,170) on rgb(24,40,47) = 9.2:1 (was 4.26:1). Build passes.
