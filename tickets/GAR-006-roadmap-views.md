---
id: GAR-006
title: Roadmap views for deciding what to work on
status: in-progress
owner: roadmap-views agent
reviewer:
blocked_by:
---

## Why
The swim-lane map shows all 174 tasks and 388 edges at once. It's hard to see what's ready to do, what to buy first, or what a task depends on.

## Design
- **Next up** (default): ready-now tasks split into Decide / Buy / Do, ranked by how much they unblock; "almost ready" (one dependency left); the critical path to registration; progress by kind and epic.
- **Tree**: pick a task, see what it needs first (left) and what it unlocks (right), done tasks hidden, hard edges only by default.
- **Map**: the existing swim-lane view.
- View and focused task in the URL.

## Acceptance criteria
- [ ] Every "ready" task has all hard dependencies complete/decided (checked by a script against the real data)
- [ ] Critical path is a valid chain of unfinished tasks along hard edges
- [ ] Works at 390 px wide with no page-level horizontal scroll; keyboard-usable
- [ ] Map view unchanged
- [ ] `npm run build` and `npm run lint` pass
- [ ] Owner has tried it and picked the default view

## Verification
_Filled by the reviewer._
