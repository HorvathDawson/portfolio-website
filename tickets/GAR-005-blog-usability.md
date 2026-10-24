---
id: GAR-005
title: Blog usability cleanup
status: done
owner:
reviewer: independent review agent
blocked_by:
---

## Why
The log is used as reference documentation while building. It has to be fast to find things and readable on a phone in the garage.

## Scope
Filled in from the usability audit: [GAR-005-audit.md](./GAR-005-audit.md) (26 items, prioritised, with evidence). Expected areas: search, table of contents on long posts, heading anchors, prev/next, phone layout of tables and maths, status clarity (decided vs open), print styles, load performance, accessibility, broken links.

Each audit finding becomes a checkbox here or its own ticket if it is larger than S.

## Acceptance criteria
- [x] Every High-priority audit item fixed or split into its own ticket
- [x] Long posts have a table of contents and copyable heading links
- [x] No horizontal page scroll at 390 px on any post (tables scroll inside their own box)
- [x] Search across post titles, headings and text works from the sidebar

## Implementer notes (2026-10-24)

Audit P1 items (all done):
- [x] 1 Links: post-text links are #7cc0ff (9.2:1 on #0f172a), visited #c4a8ff (8.8:1), hover gold (13:1), always underlined (1.8:1 vs body text, so the underline carries the difference). Off-site links get ↗. Rules are scoped to `.blog-article-body`, so they win over App.css in both the dark and the light-OS `a:hover` variants; print uses #0b4fa8 on white (7.8:1).
- [x] 2 Print: `@media print` in blogStyles.css hides sidebar, bars, TOC, search, prev/next and gc-* bits, un-fixes the 100vh/overflow shell (also beats the inline `html{overflow:hidden}`), prints dark on white, keeps figures/equations unbroken, repeats table headers, adds `(url)` after external links. geometry-design-reference prints to 10 A4 pages (was 1).
- [x] 3 TOC + anchors: posts with ≥4 h2/h3 get a sticky "On this page" column at ≥1360 px (current section highlighted) and a collapsible "Contents" block under the title below that. Every h2–h4 has a `#` link that copies the URL and updates the hash. Done by decorating the rendered HTML (src/blog/postDom.ts), not by changing the Markdown converter.
- [x] 4 Search: sidebar (and top of the mobile list) search over titles, headings and text, current car by default with an "All cars" toggle. Results link to `/garage/:car/:slug#heading`. `/` focuses it, ArrowDown/Up move through results, Enter opens the first, Escape clears/returns; result count is announced. Index is `virtual:garage-search`, built by `garageSearch()` in vite.plugins.ts and loaded on first focus (own 116 KB / 45 KB gz chunk, not in the initial bundle).
- [x] 5 Links: sidebar entries, prev/next and search results are `<Link>`s (middle-click / new tab work); in-post links navigate client-side (verified: no reload); scroll position is restored on Back (per history entry); the post scroller is focused on navigation so Page Down / Space scroll it.
- [x] 6 Phone: tables are wrapped in a `.scroll-x` box, `.katex-display` scrolls itself; both get edge shadows and a sticky "⇆ scroll sideways" label when they overflow and become keyboard-focusable. Long inline code wraps. Checked programmatically: no horizontal overflow at 390 px on all 18 a40 posts and both autozam posts.
- [x] 7 Sidebar: titles wrap to two lines; in an epic a repeated "Narrowing:" prefix is dropped (full title as tooltip); epic titles wrap; sidebar 310 px; car subtitle wraps instead of the clipped marquee ("1990s Mazda (Autozam) AZ-1" now shows in full).
- [x] 8 Status: post header shows kind chip (Log/Reference/Tutorial), `updated:` frontmatter date (new optional field in frontmatter.ts; also `dateModified` in JSON-LD and sitemap `lastmod`), "Decided" label/colours. Sidebar shows a REF marker for reference posts. A40 posts show a "Roadmap tasks" box (tasks whose `posts` include the slug) linking to `/garage/a40/roadmap?view=tree&task=<id>`; roadmapData is loaded lazily and a load failure shows a message instead of breaking the post.

Audit P2 items:
- [x] 9 /garage/a40 opens on the overview post; prev/next follow sidebar (epic) order.
- [x] 10 Unknown slug shows "Post not found" (noindex) inside the log layout, with search and a link back.
- [x] 12 Route-level error boundary (src/components/RouteErrorBoundary.tsx): a throwing roadmapData shows "This page failed to load" instead of a blank page (full error shown in dev). `npm run build` now runs `scripts/check-roadmap-plan.mjs`, which imports roadmapData, so a validation error fails the build.
- [ ] 16 (part) One h1 per page (reviewer: fails on the mobile car index, see Verification) (sidebar title is now a `<p>`); `role="listitem"` on buttons replaced by `ul/li` + links; reduced motion stops the blink/star/glow (App.css already had a global rule; blogStyles adds an explicit one); small text contrast raised (sidebar dates 0.45→0.75 opacity ≈10:1, post date 0.5→0.75, counter 9→10 px full opacity, subtitle/lede #6cb4f5 ≈8.7:1); Page Down works.
- [x] 17 Mobile post view: sticky bar with ← Posts, log title and ‹ › prev/next; prev/next and the car switcher at the end of the post; search at the top of the mobile list.

Not done (and why):
- 11 Duplicate roadmap edges / duplicate-edge validation: in roadmapData.ts, owned by the concurrent content agent.
- 13 Build-time Markdown rendering / dropping marked+KaTeX from the client: the converter is being changed by another agent (placeholder substitution); left alone. Post bodies are already lazy per post.
- 14 Asset clean-up: not deleting files (out of scope). Unreferenced: `public/assets/projects/a40-austin/blog/dash/PICAN3_UGA_10.pdf` (11 MB), `dash/dash-wiring.png` (684 KB), `blog/Tech-01-Motion-ratios-4.pdf` (240 KB). Oversized: `reference/sr20-downpipe-routing.png` (5.0 MB), `reference/upper-control-arm.png` (1.0 MB), `plots/rc_migration_miata.png` (696 KB), `plots/rc_migration_a40.png` (624 KB).
- 15 Figure width / click-to-enlarge, 4b clickable tags, roadmap task search, 7d expand-all epics, 8 "Reference" group pinned at top of the build sidebar and `> **Open:**` callouts: not requested in this pass (P2/P3 polish).
- 18 Prerendering / OG per post, 19 offline: skipped as instructed (only `dateModified` + `lastmod` from `updated` added).
- 20–26 P3: not in scope; 24 (Suspense fallback) unchanged.
- Search text shows raw Markdown placeholders if the content agent adds placeholder substitution to the converter; the index plugin would need the same substitution step.

Checks run: `npm run lint`, `npm run build`, `node scripts/check-roadmap-plan.mjs` pass. Playwright against `vite --port 5187` at 1440×900 and 390×844: screenshots of /garage, /garage/a40, geometry-design-reference, narrowing-analysis, roadmap, autozam/car-facts, unknown slug, search, TOC, print emulation and PDF (scratchpad `usability/`). Also verified: keyboard search → `#heading` landing, Back restores scroll (5000 → ~5114 after image layout), in-post link keeps the JS window state, heading copy puts the URL on the clipboard, one h1 on each garage page, reduced-motion → no animation, simulated roadmapData failure → boundary message and posts still render. No console errors.

## Verification
Reviewer: independent review agent (did not implement), 2026-10-24.

Common runs: `npm run build` exit 0; `npm run lint` exit 0; `node scripts/check-roadmap-plan.mjs` 11 ok / 0 FAIL. `npx vite preview --port 5195` on the build; Playwright (chromium.launch(), no options) at 1440x900 and 390x844 (isMobile, hasTouch), collecting console errors, page errors and failed requests on every page: none (Google Fonts requests aborted by navigation ignored). axe-core is not in node_modules (skipped); Lighthouse not installed (not run). Screenshots/PDFs: `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/review2/`.

GAR-005 checks (all 18 a40 posts + 2 autozam posts, both widths):
- No page-level horizontal scroll at 390: for every post documentElement and body scrollWidth = 390, and no element inside `.blog-article` extends past the viewport outside a scrolling/clipping box. The only inner scrollers are tables/maths (`.scroll-x`, `.katex-display`) and `<pre>` code blocks (10 in digital-dash, 2 in epas-can-gateway), which scroll inside their own box. Screenshots `phone-geometry-design-reference.png`, `phone-narrowing-analysis.png`, `phone-digital-dash.png`, `phone-car-facts.png`.
- P1 #1 links: post-text links computed `rgb(124,192,255)` + underline vs body text `rgb(252,247,240)` on every post.
- P1 #2 print: `page.pdf` (A4, print media) gives geometry-design-reference 9 pages (8 at 390), digital-dash 13, steering 5, car-facts 2; sidebar hidden, dark on white, roadmap-task box and body only (`desk-a40_geometry-design-reference.pdf`, `gdr-1.png`).
- P1 #3 TOC + anchors: every post with ≥4 h2/h3 shows a TOC (aside at 1440, collapsible "Contents" at 390); every h2–h4 has a `.heading-anchor` (counts equal on all 20 posts). Clicking the 4th TOC entry on geometry-design-reference lands "Front roll centre" at top 16 px (64 px on phone, below the 49 px bar) and marks it current. Clicking the `#` on "Results at a glance" set the URL hash and put `http://localhost:5195/garage/a40/geometry-design-reference#results-at-a-glance` on the clipboard, with the "copied" message.
- P1 #4 search: `/` focuses the sidebar search; "rack" → 28 results announced in the live region; ArrowDown moves into results, Enter on `build-constants#track-wheels-tyres` opens that post with the heading at top 16 px (64 px phone). Escape clears. "All cars" toggle: "oil" 14 → 19 hits incl. autozam. No raw `{...}` in results for 9 queries (rack, mm, kg, track, ratio, deg, nm, width, spring); the built search chunk contains no `{`.
- P1 #5: in-post link click (overview → build-constants) navigates without reload (window marker kept); 37 in-post `/garage/...` links on overview.
- P1 #7 sidebar: no sidebar title, epic title, car title or subtitle is clipped (scrollWidth/scrollHeight ≤ client size) at 1440 (9 visible) or 390 (23 visible).
- P1 #8: roadmap-task boxes on 16/18 a40 posts (build-constants and donor-geometry-dimensions have none); first box link on steering `/garage/a40/roadmap?view=tree&task=t-steering-research` opens the tree focused on "Decide: Steering Donors". No box shows the load-error message.
- Not-found: `/garage/a40/no-such-post` shows "Post not found" in the log layout, `noindex`, search present, one h1. Unknown car / `/garage/autozam/roadmap` → site 404.
- Focus visible: 59 Tab stops on the steering post, every one with an outline or box-shadow.
- One h1 per page: 1 on every post, the roadmap, not-found, /garage and the desktop car pages; **0 on `/garage/a40` and `/garage/autozam` at 390** (see Failed checks).

### Failed checks
1. Mobile car index has no h1 (audit item 16, "one h1 per page", claimed done). At 390x844 `/garage/a40` and `/garage/autozam` render the mobile list, whose only title is `<span className="blog-topbar-title">{car.logTitle}</span>` at src/blog/GarageBlog.tsx:515. Fix: render `<h1 className="blog-topbar-title">{car.logTitle}</h1>` there when `!missing` (keep the span when `missing`, because PostNotFound already renders an h1), and add `h1.blog-topbar-title { margin: 0; font: inherit; }` next to `.blog-topbar-title` in src/blog/blogStyles.css:674 so it looks the same. Re-check: one h1 on both pages at 390, and still one on `/garage/a40/no-such` at 390.

The four acceptance boxes themselves pass and stay ticked; the ticket goes back to in-progress only for the item above.

## Fix after review (Oct 2026)
- Phone car pages: the top-bar title is an h1 (span only on the post-not-found view, which has its own h1). Checked: /garage/a40, /garage/autozam, /garage/a40/steering at 390 px each have exactly one h1. Needs reviewer re-tick.

### Re-check of the fix (2026-10-24)
Re-check, independent reviewer (did not implement the fixes), 2026-10-24, on 80c37a3 + A40-010 working tree: src/blog/GarageBlog.tsx renders `<h1 className="blog-topbar-title">` on the mobile car list and keeps the span only for `missing && slug`; blogStyles.css has `h1.blog-topbar-title { margin: 0; }` (the class rule sets font-size/weight/family, so it looks as before; screenshot `phone-a40.png`). `npm run build` / `npm run lint` exit 0. Playwright on `vite preview --port 5205` (chromium.launch(), 390x844 isMobile/hasTouch): h1 count = 1 on /garage/a40, /garage/autozam and /garage/a40/no-such-post; 1 on every other page checked at both widths. Regression: scrollWidth 390 on every page checked at 390, no console/page errors, no failed requests. **Pass; status done.** Screenshots in `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/final/`.
