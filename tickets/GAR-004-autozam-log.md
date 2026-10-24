---
id: GAR-004
title: Autozam AZ-1 garage log
status: review
owner: Claude (garage agent)
reviewer:
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
_Filled by the reviewer._
