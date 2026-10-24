---
id: A40-006
title: Roadmap and overview posts
status: review
owner: roadmap agent (done: build + lint pass, roadmap validation passes)
reviewer:
blocked_by:
---

## Files
- src/blog/roadmapData.ts, src/blog/blogData.ts, src/blog/A40Blog.tsx
- content/a40/design-overview.md, frame-design.md, design-finalization.md, motor-selection.md, overview.md, teardown.md, frame-jig.md

## Acceptance criteria
- [ ] Roadmap shows the rear as Miata IRS + RX-8 diff + custom half-shafts; Ford 9" / four-link items removed or marked superseded
- [ ] Slugs updated: `rear-axle` → `rear-suspension`; `four-link-rear` removed
- [ ] frame-design pivots 234.5/273 mm; no 240.5/290.5
- [ ] Electrical fix list from A40-005 applied
- [ ] Heading ids in blogData still resolve for every in-page link

## Verification
_Filled by the reviewer._

## Implementer notes (roadmap agent)
- Removed Ford 9"/four-link tasks; added t-decide-rear-suspension, t-measure-donor-rear, t-buy-miata-rear, t-buy-rx8-diff, t-buy-half-shafts, t-rear-irs-fab.
- e-brake decided: cable into NA rear calipers. Brake split flagged open.
- Heading ids: custom marked renderer (GitHub-style slugs). A40Blog.tsx now scrolls to #hash on load.
- Transmission kept as "CD009 or Z32"; build-constants updated to match.
- t-buy-miata-rear and t-buy-rx8-diff set to planning: owner to flip to complete if parts are on hand.
- Leftovers in other agents' files relayed to them (geometry reference MR/caster/dead links; wiring/dash/EPAS text).
