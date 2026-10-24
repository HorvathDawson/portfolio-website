---
id: GAR-001
title: Turn /a40 into a multi-car garage
status: todo
owner:
reviewer:
blocked_by: A40-006 (roadmap agent is editing blogData.ts / A40Blog.tsx)
---

## Why
The Autozam AZ-1 is joining the A40. The blog is hard-wired to one car.

## Design
- Content moves to `content/garage/<car>/` (`a40/`, `autozam/`), each with a `car.yaml`: name, year, model, one-line description, status, art paths, accent colour, kind (`build` = from-scratch log with epics + roadmap, `garage` = maintenance/mods log).
- Routes: `/garage` (selector), `/garage/:car`, `/garage/:car/:slug`, `/garage/a40/roadmap`.
- Old URLs keep working: `/a40` → `/garage/a40`, `/a40/:slug` → `/garage/a40/:slug`, `/a40/roadmap` → `/garage/a40/roadmap` (client redirect + `_redirects`/worker 301 if the host supports it).
- `blogData.ts` loads per car with `import.meta.glob('/content/garage/*/*.md')`; posts are lazily imported, not bundled eagerly.
- `A40Blog.tsx` becomes `GarageBlog.tsx`, car-agnostic. Epics only show for `build` cars; `garage` cars get a simple dated list grouped by category (maintenance, mods, repairs) with a mileage field.
- The sitemap covers every car.
- The portfolio card links to `/garage`.

## Acceptance criteria
- [ ] Every old `/a40...` URL redirects to the matching `/garage/a40...` URL (test each slug)
- [ ] No A40 name, path or colour is hard-coded outside `content/garage/a40/`
- [ ] Adding a third car = add a folder with `car.yaml` + posts, no code change
- [ ] Post bodies are code-split (initial JS for `/garage` doesn't contain post text)
- [ ] `npm run build` and `npm run lint` pass; sitemap lists both cars

## Verification
_Filled by the reviewer._
