# A40 build log audit (read-only)

Date: 2026-10-24. Method: read the code and posts, ran `npm run build` and `vite preview` on :4789 (prod build) and `vite` on :4790 (dev), and used Playwright at 1440x900 and 390x844. Both servers have been stopped.
Screenshots are in `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/shots/`, referred to below as `shots/`.
Line numbers are from the start of the audit. Other agents were editing content/a40, roadmapData.ts, blogData.ts and A40Blog.tsx at the same time, so some numbers may have moved.
Some content problems I saw at the start were fixed while I worked: 7 missing images in digital-dash, bad relative links to `scripts/*.py`, stale "four-link rear" text and live-axle maths in geometry-design-reference, and a dead `./four-link-rear` link. A second run of my link checker found no bad internal links, anchors or local images. They are left out below.

Effort: S = under 1 hour, M = half a day, L = 1 day or more.

---

## P1: blocks use as reference docs

### 1. Links in post text look the same as plain text
- **Problem:** global `a { color:#f3f3f3; text-decoration:none }` (src/App.css:281-283). Post text is #fcf7f0, so links have a 1.04:1 contrast against the text around them. The hover colour #535bf2 (App.css:20-22) is 3.5:1 on the #0f172a background. In `shots/desk_overview_links.png`, "build constants", "roadmap" and "rear suspension" can't be told apart from body text. Cross-links are the main way to move around the docs.
- **Fix:** add `.blog-article-body a { color: <accent>; text-decoration: underline; text-underline-offset: 2px }` with a hover/visited style that has AA contrast. Mark external links with an icon or `↗`.
- **Effort:** S

### 2. Printing (or Save as PDF) only gives one page
- **Problem:** the blog shell is `height:100vh; overflow:hidden` (blogStyles.css:41-54) and scrolls inside `.blog-content-panel` (blogStyles.css:420-424). A40Blog.tsx:14 also sets `html{overflow-y:hidden}`. There is no `@media print`. Printing /a40/geometry-design-reference (440 lines, ~20,000 px tall) gave a 1-page PDF. It had the sidebar, the visitor counter and the first paragraph only (`print_geometry.pdf` in the scratchpad). Printing is how you would take a reference into the garage.
- **Fix:** add `@media print`:
  - hide the sidebar, top bar, prev/next and gc-* decoration
  - set `.blog-page, .blog-content-panel { height:auto; overflow:visible }`
  - use a light background and dark text
  - set `img { break-inside: avoid }`, `a[href^=http]::after { content:" (" attr(href) ")" }`, and `h2, h3 { break-after: avoid }`
- **Effort:** S

### 3. Long posts have no table of contents and no heading links
- **Problem:** geometry-design-reference has 29 h2/h3 headings and is ~20,500 px tall on desktop (~27,400 px on phone). digital-dash has 31 headings and is ~19,200 px. No TOC element exists (count = 0), and headings contain no `<a>`. Heading ids are generated (blogData.ts:14-31) and deep links work on first load: `#motion-ratio` landed at top=0 (`shots/desk_deeplink.png`). But there is no way to find or copy one.
- **Fix:**
  - Collect h2/h3 in `parsePost`, which already makes the ids.
  - Show a sticky "On this page" list in the right gutter on desktop. It has room: the article is 780 px wide inside a 1150 px panel (`shots/desk_a40_suspension-tuning_33.png`).
  - On mobile, use a collapsible "Contents" block under the title.
  - Add a `#` link on hover to each heading.
- **Effort:** M

### 4. No search across posts
- **Problem:** there is no search box or tag filter anywhere. Tags show as plain spans (A40Blog.tsx `blog-tag`) and do nothing when clicked. Each post scrolls inside its own panel, so the browser's Ctrl+F only searches the current post. The roadmap has 174 tasks and 388 edges (roadmapData.ts) and no search either.
- **Fix:**
  - A client-side search box at the top of the sidebar. A substring match over title, headings and body text is enough for ~20 posts, since `allPosts` is already in memory.
  - Clickable tags that filter the sidebar.
  - A task search or filter on the roadmap.
- **Effort:** M

### 5. Sidebar posts are buttons, not links, and in-post links reload the whole page
- **Problem:**
  - Sidebar entries and prev/next are `<button onClick={navigate}>` (A40Blog.tsx:56-75, 135-146, 241-260). You can't middle-click, open in a new tab, or copy their link address, which matters for keeping several reference posts open while working.
  - Links inside posts are plain `<a href="./build-constants">` in `dangerouslySetInnerHTML` (A40Blog.tsx:132). Clicking one does a full document reload: a window marker did not survive the click, so the 450 KB blog chunk is fetched and parsed again.
  - Going back to a long post opens it at the top (scrollTop 0 after back from 8000), because of `scrollTo(0,0)` on slug change (A40Blog.tsx:99).
- **Fix:**
  - Use `<Link to=…>` for sidebar entries and prev/next.
  - Add one delegated click handler on `.blog-article-body` that `navigate()`s same-origin `/a40/...` links.
  - Save and restore panel scrollTop per history entry (for example in `history.state` or a Map keyed by `location.key`).
- **Effort:** S–M

### 6. Display maths and wide tables break the phone layout
- **Problem:**
  - narrowing-analysis on phone: a `.katex-display` row ("wheel CL = 655 − ET · T = 2(655 − ET) · outer-to-outer = T + w_tyre") runs to x=734 on a 390 px screen. The whole content panel then scrolls sideways (scrollWidth 606 vs 390), and the third equation is off screen with no hint it exists (`shots/phone_narrowing_katex.png`).
  - geometry-design-reference: inline `ΔSR` runs against the right edge.
  - The cause is that `.katex-display` keeps `overflow-x: visible` and there is no rule for it in blogStyles.css.
  - Tables are `display:block; overflow-x:auto` (blogStyles.css:570-576), so they scroll on their own (2 to 4 per post on phone). There is no scroll hint: in `shots/phone_narrowing_katex.png` the "ET38" column is cut mid-word.
  - Code blocks in digital-dash (13 overflowing `pre` on phone) scroll on their own, which is fine.
- **Fix:**
  - `.blog-article-body .katex-display { overflow-x:auto; overflow-y:hidden; padding-bottom:4px }`
  - `.blog-content-panel { overflow-x:hidden }`
  - Wrap tables in a scroll container with an edge-fade shadow, or make the first column sticky.
  - Split that multi-equation display line in narrowing-analysis into separate lines.
- **Effort:** S

### 7. Truncated sidebar titles hide what tells posts apart
- **Problem:** the sidebar is about 270 px wide and uses ellipsis (blogStyles.css:286-287, 338-339). Four posts start with "Narrowing:", so they show as "Narrowing: Geometry Des…", "Narrowing: Suspension T…" and "Narrowing: Donor Geomet…". Epic names show as "PROJECT OVERVI…", "RESEARCH & INITIA…" and "NARROWING & GE…" (`shots/desk_a40_geometry-design-reference_33.png`). Only the epic holding the current post is open, so finding a post means opening epics one at a time.
- **Fix:**
  - Let titles wrap to 2 lines.
  - Drop the redundant "Narrowing:" prefix inside the Narrowing epic, or add a `short_title` frontmatter field.
  - Widen the sidebar to about 320 px.
  - Add "expand all", or open every epic by default since there are only 5.
- **Effort:** S

### 8. Status doesn't tell you what's decided and what's open
- **Problem:**
  - Every post has one status badge. 12 of 18 are `in-progress`, and none use `decided`.
  - `kind` (log, reference, tutorial) is parsed (blogData.ts:105-108, 45) but never shown, so you can't separate reference pages from history.
  - `statusLabel` in A40Blog.tsx:19-23 has no `decided` entry, and `.blog-status--decided` is missing (blogStyles.css:99-101). A post or epic marked decided would show a raw "decided" string, and the epic badge would be empty (`statusLabel[epic.status]` has no fallback).
  - Posts don't link back to their roadmap tasks: the roadmap→post link exists (A40Roadmap.tsx:399), but there is no post→roadmap link. The roadmap holds the real decided/open state.
  - Posts revised in Oct 2026 still show their original date: rear-suspension shows 2026-03-26 but holds an "October 2026" decision. The same applies to overview, build-constants, suspension-options, motor-selection and epas-can-gateway. There is no `updated` field.
- **Fix:**
  - Add `decided` to `statusLabel` and the CSS.
  - Show a `kind` chip, and pin reference-kind posts in a "Reference" group at the top of the sidebar.
  - Add an `updated:` frontmatter field, shown in the header and used as sitemap `lastmod`.
  - Show a "Roadmap tasks" box in each post listing the tasks whose `posts` include its slug, with their status and decision text. The data is already in roadmapData.
  - Optionally, a convention such as a `> **Open:**` callout style for unresolved items.
- **Effort:** M

---

## P2: noticeable problems

### 9. /a40 opens on the oldest post (Teardown, 2022), and prev/next jumps between epics
- **Problem:** `allPosts` is sorted by date (blogData.ts:131), and `/a40` uses `allPosts[0]` (A40Blog.tsx:162-164), so desktop /a40 shows "Teardown" (`shots/desk_a40.png`). Prev/next follows that date order, not the sidebar's epic order, so it jumps from Teardown to Motor Selection (research) to Front Suspension Options to Steering (design) to Frame Jig (fabrication) and so on. Posts with the same date are ordered by import order.
- **Fix:**
  - Make /a40 show the overview post, or better, a landing page with the reference posts, recently updated posts and open decisions.
  - Make prev/next follow sidebar order (the flattened `postsByEpic()`).
- **Effort:** S

### 10. Unknown slugs show a real post instead of a 404
- **Problem:** `/a40/does-not-exist` renders "Teardown" with title "A40 Build Log" and `noindex` (A40Blog.tsx:164, 191). A renamed post leaves dead bookmarks that silently show the wrong page.
- **Fix:** render `NotFound` with links to the post list, or keep a redirect map for renamed slugs.
- **Effort:** S

### 11. Duplicate roadmap edges cause a React key error, and the duplicates conflict
- **Problem:** the dev console shows "Encountered two children with the same key" for `t-decide-brake-system->t-buy-brake-master` and `t-decide-brake-system->t-pedal-box-design`. The edges are listed twice: roadmapData.ts:2009/2439 and 2012/2440. The pedal-box pair disagrees: line 2012 is `soft` with a label, line 2440 is `hard`. Edge ids come from A40Roadmap.tsx:851. `validateRoadmap()` (roadmapData.ts:2681) checks duplicate task ids but not duplicate edges.
- **Fix:** remove one of each pair and pick hard or soft for pedal-box. Add a duplicate-edge check to `validateRoadmap`.
- **Effort:** S

### 12. Roadmap validation runs in the browser and can crash the page
- **Problem:** `validateRoadmap()` throws at module load (roadmapData.ts:2758-2763). There is no ErrorBoundary in src. A bad slug or epic id in a content edit passes `npm run build` (the build only type-checks) and then blanks /a40/roadmap in production.
- **Fix:** run the validation at build time: a small vite plugin, a `tsx` script in `npm run build`, or a test. Remove the runtime throw, or keep it in dev only (`import.meta.env.DEV`). Add an ErrorBoundary around the routes.
- **Effort:** S

### 13. Every blog route loads all posts plus marked and KaTeX
- **Problem:**
  - `import.meta.glob(..., { eager: true })` (blogData.ts:127) bundles all 18 posts.
  - The posts are parsed with marked and KaTeX at module load, every time.
  - The shared chunk `blogStyles-*.js` is 461 KB (150 KB gzip), and that is on top of the 270 KB `index` chunk.
  - /a40/roadmap downloads it too, 860 KB of JS in total, because roadmapData.ts:53 and A40Roadmap.tsx:3 import `allPosts` and `buildLogDescription` from blogData.
  - A post page measured 739 KB JS, 120 KB CSS and 163 KB fonts.
  - Also, the comment in main.tsx:8 says "~150 KB of roadmap data", but the roadmap chunk is 128 KB and the posts chunk is the large one.
- **Fix:**
  - Render the Markdown to HTML at build time, with a vite plugin or a `?html` loader. That stops shipping marked and KaTeX JS; only the KaTeX CSS and fonts are needed.
  - Make the post list a small metadata JSON, and load each post's HTML lazily (non-eager glob).
  - Give roadmapData its own metadata import so it doesn't pull post bodies.
- **Effort:** M

### 14. Unused and very large assets in public
- **Problem:**
  - Not referenced anywhere in content, src or scripts: `public/assets/projects/a40-austin/blog/dash/PICAN3_UGA_10.pdf` (11 MB, vendor manual) and `dash/dash-wiring.png` (716 KB; the post uses the .svg).
  - `reference/PWR-DCDC-USB-manual.pdf` duplicates `dash/PWR-DCDC-USB-manual.pdf`.
  - `reference/sr20-downpipe-routing.png` is 5.0 MB at 2547x3296 and is shown at 780 px or less (design-overview.md:54).
  - The plots are 1758–2723 px PNGs up to 700 KB (rc_migration_*.png), shown at 780 px.
  - Hosting third-party PDFs (PiCAN, Mini-Box, ISMA Tech-01) may raise redistribution questions; linking to the vendor is safer.
- **Fix:** delete the unused files. Convert large PNG/photos to WebP or AVIF at about 1600 px, with `srcset`. Link to vendor PDFs instead of hosting them.
- **Effort:** S–M

### 15. Figures are capped at 520 px and can't be enlarged
- **Problem:** `figure { max-width:520px }` (blogStyles.css:492-497), unless the figure has `.wide`. Plots with small legend and annotation text are shown at 520 px from about 1550 px sources (`shots/desk_a40_suspension-tuning_33.png`), and the annotation box text is about 8 px. Images aren't clickable.
- **Fix:** default plots to `.wide` (780 px), and wrap images in `<a href=src target=_blank>` (can be done in `parsePost`) or add a simple lightbox.
- **Effort:** S

### 16. Accessibility problems
- **Problem:**
  - `role="listitem"` sits on `<button>` elements (A40Blog.tsx:61, 245). That replaces the button role, so screen readers announce list items that aren't operable. `role="list"` is also on a div whose children are epic groups (A40Blog.tsx:221).
  - The desktop page has two `<h1>`s: "A40 Build Log" in the sidebar (A40Blog.tsx:273) and the post title.
  - Animations run forever with no `prefers-reduced-motion` guard: a 1 Hz blinking "Under Construction" (blogStyles.css:124), a marquee (236), spinning stars (175) and a glow pulse (221, 671). Blinking content conflicts with WCAG 2.2.2.
  - The marquee also truncates "1950 Austin A40 Devon" in most frames (`shots/desk_a40.png`).
  - Small low-contrast text: sidebar dates are 10 px at opacity 0.45, about 4.27:1, below AA. The sidebar subtitle (#3898ec at 0.7) is about 3.5:1. The visitor counter is 9 px.
  - Keyboard: after loading a post, PageDown didn't scroll the content panel (scrollTop stayed 0) because the inner scroller has no focus. Focus outlines do exist (3px solid).
- **Fix:**
  - Use `<ul><li><Link>` markup in the sidebar and make the sidebar title a `<p>` or `<div>`.
  - Add `@media (prefers-reduced-motion: reduce) { * { animation: none !important } }`.
  - Raise the opacity of small text.
  - Give `.blog-content-panel` `tabIndex={-1}` and focus it on post change, or let the document scroll instead of an inner panel (which also helps items 2 and 5).
- **Effort:** S–M

### 17. The mobile post view has no navigation beyond "All Posts"
- **Problem:** phone post pages show only "← All Posts" (`shots/phone_a40_geometry-design-reference.png`). There is no roadmap link, no site link, and no way to move between posts without scrolling to the bottom. The mobile list page is a long scroll of 18 entries with no search (`shots/phone_a40.png`).
- **Fix:** add a slim sticky top bar on post pages with back, title, and Contents (from item 3). Put search at the top of the list.
- **Effort:** S

### 18. SEO and link-preview metadata
- **Problem:**
  - The app is a SPA with no prerendering. `index.html` only has the home page meta (vite.plugins.ts:37-82), and the comment there says link-preview bots see home-page meta on every route. Sharing /a40/steering gives the portfolio card. Post text isn't in the HTML.
  - `usePageMeta` sets title, description and JSON-LD at runtime only.
  - `BlogPosting` JSON-LD has no `dateModified` or `image` (A40Blog.tsx:176-186).
  - Sitemap `lastmod` is the post's creation date (vite.plugins.ts:92), so recent revisions aren't signalled.
- **Fix:** prerender /a40, /a40/roadmap and every post to static HTML at build (the posts are static Markdown), with per-post `<title>`, description, OG tags and an og:image. Add `updated` (item 8) as `dateModified` and as `lastmod`.
- **Effort:** M–L

### 19. No offline support
- **Problem:** there is no service worker or web manifest (public/ holds only `assets/` and `robots.txt`). Phone use in a shop with poor signal isn't supported. Fonts load from Google Fonts (index.html:120).
- **Fix:** add a small service worker, for example `vite-plugin-pwa` with a runtime cache for /a40 routes, post assets and fonts. Once item 2 is done, Print/Save-as-PDF is a cheap alternative.
- **Effort:** M

---

## P3: smaller items and cleanup

20. **Fake visitor counter shows the post count.** "You are visitor #00018" is `allPosts.length` padded (A40Blog.tsx:227, 280). It's a joke, but it uses sidebar space on every view and changes whenever a post is added. Keep it or remove it as you like. **Effort:** S
21. **The `epic` fallback is `'planning'`** (blogData.ts:118). That isn't an epic id, so a post missing `epic:` disappears from the sidebar without warning: `postsByEpic` filters by known epics. **Fix:** warn or fail the build on unknown epic, status or kind values. **Effort:** S
22. **The frontmatter parser is hand-rolled** (blogData.ts:72-85). It splits on the first `:` and strips quotes, so multi-line values, quoted strings with `:`, and lists other than `[a, b]` won't parse. That's fine for now, but the planned car field and an `updated` field make this a good time to validate the parsed frontmatter. **Effort:** S
23. **Two posts aren't linked from any roadmap task:** `build-constants` and `donor-geometry-dimensions` aren't in any task's `posts` (roadmapData.ts). This only matters if item 8's post→task box is built. **Effort:** S
24. **`Suspense fallback={null}`** (main.tsx:16) shows a blank dark page while the 450 KB chunk loads. **Fix:** a minimal skeleton. **Effort:** S
25. **External GitHub links point at `blob/main/scripts/plot_geometry_reference.py`** (geometry-design-reference, donor-geometry-dimensions, suspension-tuning). I didn't check that the repo is public. If it's private, these links 404 for readers. **Effort:** S
26. **Remaining TBDs in content:** rear motion ratio "TBD, measure" (build-constants.md:46), shifter linkage TBD (design-overview.md:31), and TBDs in roadmapData.ts at 245, 359, 524, 527, 1498, 1686 and 1893. These are legitimate open items. A view that lists all open items is the "status clarity" feature from item 8. There are no TODO or FIXME comments in src/blog.

No console errors or warnings appeared in the production preview. The only dev-mode errors were the duplicate keys in item 11. No network 4xx was seen. Note that vite serves index.html (200 text/html) for missing files, so missing images don't show up as 404s locally. Use the link checker approach: compare `src` paths to files in `public/`.

---

## A40-specific code to generalise for a multi-car garage

Routes and paths:
- src/main.tsx:8-11: A40Blog and A40Roadmap lazy imports; the comment names the A40.
- src/main.tsx:19-21: `/a40`, `/a40/roadmap` and `/a40/:slug` are hard-coded. They need `/garage`, `/garage/:car`, `/garage/:car/roadmap` and `/garage/:car/:slug`, plus redirects from /a40/*.
- src/blog/blogData.ts:127: `import.meta.glob('/content/a40/*.md')`. Needs `/content/*/*.md` with the car taken from the folder, or a `car:` frontmatter field.
- src/blog/blogData.ts:62-69: `epics` is the A40 build's phases (project, research, narrowing, design, fabrication, finishing). These must be per car. The AZ-1 needs maintenance/mod categories, not build epics.
- src/blog/blogData.ts:134: `buildLogDescription` looks up the `'overview'` slug, so it assumes one overview post.
- src/blog/blogData.ts:61-69 and roadmapLayout.ts:13 and 70-72: roadmap lanes come from the global `epics`.
- src/blog/A40Blog.tsx:170, 194, 195: `/a40/${slug}` and `/a40` navigation.
- src/blog/A40Blog.tsx:172, 184, 188, 190: "A40 Build Log" title, the JSON-LD Blog name and the `/a40` path.
- src/blog/A40Blog.tsx:218-219 and 296: mobile topbar title "A40 Build Log" and roadmap links to `/a40/roadmap`.
- src/blog/A40Blog.tsx:273-274: sidebar `<h1>A40 Build Log</h1>` and subtitle "1950 Austin A40 Devon". This is where the car selector goes.
- src/blog/A40Roadmap.tsx:399: drawer post link `/a40/${p.slug}`.
- src/blog/A40Roadmap.tsx:471: meta title "Roadmap · A40 Build Log" and the `/a40/roadmap` path.
- src/blog/A40Roadmap.tsx:1054: back link "← A40 Build Log" to `/a40`.
- src/blog/roadmapData.ts:1-51: header comment and glossary are A40/SR20/Miata-specific.
- src/blog/roadmapData.ts:98+: a single global `roadmap` export. Needs one per car, and the AZ-1 may not need a roadmap at all, so the roadmap link must be optional per car.
- src/blog/roadmapData.ts:53 and 2681-2763: validation against the global `allPosts` and `epics`. It needs to be per car, so slugs can repeat across cars and be checked within one car.
- src/blog/postSlug.ts:2: slug is the filename only. Slugs must be unique per car, or the car must be part of the URL.
- vite.config.ts:7: `sitemap('content/a40')`.
- vite.plugins.ts:84-95: sitemap emits `/a40`, `/a40/roadmap` and `/a40/${slug}` only.
- src/data/projects.tsx:67-81: the portfolio card links to `/a40`, with A40 art under `/assets/projects/a40-austin/`.
- src/utils/usePageMeta.ts:7: example path in a comment only.
- Asset paths in posts point at `/assets/projects/a40-austin/blog/...`. That's fine per car, but new cars need their own folder convention.
- Content links between posts are relative (`./slug`), so they keep working if the car becomes a URL segment.

Styling, and things that work for a build log but not a maintenance log:
- src/blog/blogStyles.css:1-4: header comment "A40 Build Log". Colours come from shared portfolio variables (--gold, --icg, #3898ec, #b07cff for statuses), and none are A40-specific. A per-car accent would need a CSS variable on `.blog-page`.
- src/blog/blogData.ts:34 and A40Blog.tsx:19-23: the Status set (planning, in-progress, complete, decided) and PostKind (log, reference, tutorial) fit a build. AZ-1 maintenance posts would likely want kinds like `maintenance` or `mod`, plus fields such as mileage or odometer and a service interval. Make Status and Kind per car or extensible.
- Component and file names (`A40Blog`, `A40Roadmap`, `blog-*` / `rm-*` classes) would be renamed to `GarageLog` / `CarRoadmap` or similar. The class names are generic and can stay.
