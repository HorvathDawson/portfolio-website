---
id: GAR-004
title: Autozam AZ-1 garage log
status: todo
owner:
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
- [ ] Autozam page lists posts newest first, filterable by category
- [ ] Car facts page exists with every unverified value marked
- [ ] Service table shows last date/mileage per item, derived from the posts
- [ ] Owner has reviewed the first two posts

## Verification
_Filled by the reviewer._
