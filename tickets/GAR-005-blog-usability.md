---
id: GAR-005
title: Blog usability cleanup
status: review
owner:
reviewer:
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
- [x] 16 (part) One h1 per page (sidebar title is now a `<p>`); `role="listitem"` on buttons replaced by `ul/li` + links; reduced motion stops the blink/star/glow (App.css already had a global rule; blogStyles adds an explicit one); small text contrast raised (sidebar dates 0.45→0.75 opacity ≈10:1, post date 0.5→0.75, counter 9→10 px full opacity, subtitle/lede #6cb4f5 ≈8.7:1); Page Down works.
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
_Filled by the reviewer._
