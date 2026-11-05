---
id: A40-006
title: Roadmap and overview posts
status: done
owner: roadmap agent (done: build + lint pass, roadmap validation passes)
reviewer: review agent (Oct 24)
blocked_by:
---

## Files
- src/blog/roadmapData.ts, src/blog/blogData.ts, src/blog/A40Blog.tsx
- content/a40/design-overview.md, frame-design.md, design-finalization.md, motor-selection.md, overview.md, teardown.md, frame-jig.md

## Acceptance criteria
- [x] Roadmap shows the rear as Miata IRS + RX-8 diff + custom half-shafts; Ford 9" / four-link items removed or marked superseded
- [x] Slugs updated: `rear-axle` → `rear-suspension`; `four-link-rear` removed
- [x] frame-design pivots 234.5/273 mm; no 240.5/290.5
- [x] Electrical fix list from A40-005 applied
- [x] Heading ids in blogData still resolve for every in-page link

## Verification
Reviewer, 2026-10-24. Read overview, design-overview, frame-design, design-finalization; grepped roadmapData.ts at commit 9b42ac8 (unchanged since for A40 content/roadmap).

- **Rear in roadmap (pass).** roadmapData.ts:177-193 t-decide-rear-suspension (Miata IRS + RX-8 + custom half-shafts, 1340 mm, "Ford 9″ housing on hand is surplus"); :376, :425 mark the CAD re-open; new tasks t-buy-rx8-diff (:775), t-buy-half-shafts (:783), rear pickups/diff mounts (:792). grep for four-link / Welder / live axle: only the "revised Oct 2026 … dropped" summaries. Posts: only superseded mentions (build-constants:44, overview:18, rear-suspension:10, suspension-options:32).
- **Slugs (pass).** No `rear-axle` / `four-link-rear` anywhere outside tickets/; every roadmap `posts:` slug exists as content/a40/<slug>.md.
- **frame-design pivots (pass).** frame-design.md:19 LCA 234.5 / UCA 273; design-overview Systems table the same; 240.5/290.5: 0 hits.
- **Electrical fixes (pass).** See A40-005 Verification: DCDC-USB 5 V feed, buck only as fallback, IG wake, loss policy, wheel-speed sensor, no Gen 3 in the roadmap.
- **Heading ids (pass).** Rendered every content/a40 post with marked + the blogData.ts heading renderer (GitHub-style slug, -n de-dup) and checked every `./slug`, `./slug#anchor`, `#anchor` and `/assets` src/href: 151 checked, 0 broken. The four anchored links (geometry-design-reference#structural-loads-and-compliance, rear-suspension#driveshaft-and-u-joint-angles ×2, design-finalization#build-sequence) all resolve.
- **Build / validation.** `npm run build` (tsc -b + vite build) passed on the working tree at the start of review (exit 0). A second run later failed with TS2305 in src/blog/A40Roadmap.tsx (`allPosts` no longer exported from blogData), caused by the concurrent garage restructure (commit bdbc4c4 + uncommitted src/blog changes, GAR-001), not by this ticket. On a clean export of 9b42ac8 (A40 content identical to HEAD): `tsc -b` exit 0, `vite build` exit 0, `node scripts/check-roadmap-plan.mjs` passes. Re-check after GAR-001 lands (A40-010).

Non-blocking (for A40-009): design-overview.md Clearance table "Steering lock" row says "Narrowing costs 12–18° of steering lock"; per A40-000 it is body/tyre clearance that costs it (steering.md:117). frame-design.md Loads "~43%" vs +44% elsewhere.

## Implementer notes (roadmap agent)
- Removed Ford 9"/four-link tasks; added t-decide-rear-suspension, t-measure-donor-rear, t-buy-miata-rear, t-buy-rx8-diff, t-buy-half-shafts, t-rear-irs-fab.
- e-brake decided: cable into NA rear calipers. Brake split flagged open.
- Heading ids: custom marked renderer (GitHub-style slugs). A40Blog.tsx now scrolls to #hash on load.
- Transmission kept as "CD009 or Z32"; build-constants updated to match.
- t-buy-miata-rear and t-buy-rx8-diff set to planning: owner to flip to complete if parts are on hand.
- Leftovers in other agents' files relayed to them (geometry reference MR/caster/dead links; wiring/dash/EPAS text).
