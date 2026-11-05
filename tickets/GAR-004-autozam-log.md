---
id: GAR-004
title: Autozam AZ-1 garage log
status: done (pending owner)
owner: Claude (garage agent)
reviewer: independent review agent
blocked_by: GAR-001
---

## Why
The AZ-1 gets work done but isn't a from-scratch build. It needs a lighter log: what was done, when, at what mileage, parts and cost.

## Design
- `content/garage/autozam/car.yaml` (kind: garage)
- Post frontmatter: `title, date, category (maintenance|repair|mod|inspection), mileage_km, parts, cost, status`
- A "Car facts" post: chassis code (PG6SA), engine (Suzuki F6A turbo 657 cc), fluids and capacities, torque specs, part numbers, tyre sizes and pressures. Every value marked verify until checked against the service manual.
- A service-interval table generated from the posts (last done, due at).
- First post: "Bought it" with current condition and a to-do list.

## Acceptance criteria
- [x] Autozam page lists posts newest first, filterable by category
- [x] Car facts page exists with every unverified value marked
- [x] Service table shows last date/mileage per item, derived from the posts
- [ ] Owner has reviewed the first two posts

## Implementer notes
- Path is `content/autozam/` (not `content/garage/autozam/`; see GAR-001). `car.json`: kind `garage`, no roadmap, art at `/assets/garage/autozam/outline.svg` + `colored.svg` (viewBox 1279×873). Year is "1990s" because the owner's model year isn't known.
- Frontmatter for log posts: `title, date, category (maintenance|repair|mod|inspection), mileage_km, parts: [..], cost, status`, plus `service: [..]`, the items the post records. The service table on `/garage/autozam` has one row per `service` item: the most recent post's date and mileage, linking to that post. It reads "No services logged yet." until a post has `service:`. "Due at" is not implemented (no intervals until the manual is checked).
- `car-facts.md` (kind reference, pinned under "Reference"): chassis code, engine and layout are marked done (owner-supplied); production years, curb weight, tyre sizes, fluids, capacities, torque specs and part numbers are blank or marked **verify**, each saying where to check (factory service manual / F6A engine manual / parts catalogue).
- `bought-it.md` (2026-10-24, category inspection): a template marked as such. Condition lines read "(owner to fill in)"; mileage, price and condition are left blank. The to-do list covers oil and filter, gearbox oil, coolant + hoses, brake fluid, timing belt age, tyre date codes, plugs/air filter and door struts.
- Not done: owner review of the two posts.

## Verification
Reviewer: independent review agent (did not implement), 2026-10-24.

Common runs (apply to every GAR ticket below):
- `npm run build`: exit 0 (check-constants, `tsc -b`, check-roadmap-plan, vite build). `npm run lint`: exit 0 (only a baseline-browser-mapping staleness notice). `node scripts/check-roadmap-plan.mjs`: 11 `ok`, 0 FAIL (175 tasks, 389 edges, 40 ready, critical path 14).
- `npx vite preview --port 5195` on the build; Playwright (chromium.launch(), no options) at 1440x900 and 390x844 (isMobile, hasTouch). Console errors, page errors and failed requests were collected on every page visited: none (only Google Fonts requests aborted by navigation, ignored).
- axe-core is not in node_modules: axe check skipped. Lighthouse is not installed: not run.
- Screenshots and PDFs: `/tmp/claude-0/-home-user/c87f3b61-444e-51a8-bee1-fcced4861d9c/scratchpad/review2/`.

GAR-004 checks:
- `/garage/autozam` (1440): h1 "AZ-1 Garage Log", sidebar Reference (Car facts) then Log (Bought it); category chips All / Maintenance / Repair / Mod / Inspection, chips with no posts are disabled; clicking Inspection sets `?category=inspection` and keeps Bought it; `?category=repair` presses Repair and the log shows "No repair entries yet.". Newest first: the AZ-1 has only one log post, so order was checked in code: postsFor() sorts by date ascending (src/blog/postIndex.ts:18) and DatedList reverses it (src/blog/GarageBlog.tsx:189-192); the owner will see it on the second post. Screenshots `desk-autozam-home.png`, `phone-autozam-list.png`.
- `content/autozam/car-facts.md`: chassis code, engine, layout marked done (owner); every other value (production years, VIN location, curb weight, tyre sizes/pressures, wheel torque, all fluids/capacities, torque specs, part numbers) is blank or marked **verify** with where to check. Renders with tables in scroll boxes, no page overflow at 390, prints to 2 A4 pages.
- Service table: with no `service:` items it reads "No services logged yet."; with the throw-away third car (post with `service: [oil and filter]`, mileage 81234) it showed one row "oil and filter · Oct 20, 2026 · 81,234 km" linking to the post. Derived from posts as specified.
- Both posts: one h1, no console errors, no horizontal scroll at 390.
Result: done (pending owner): only "Owner has reviewed the first two posts" is open.
