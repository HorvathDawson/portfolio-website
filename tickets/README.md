# Tickets

Markdown tickets for the garage blog (A40 build log, Autozam log). One file per ticket: `A40-NNN-…` for A40 content, `GAR-NNN-…` for the garage site itself. Not published to the site (the site only reads `content/`).

## Workflow

```
todo → in-progress → review → done
                 ↖ (fails review) ↙
```

1. **todo**: written, not started.
2. **in-progress**: someone is working on it. Put your name in `owner`.
3. **review**: the implementer thinks every acceptance box is ticked. Hand it to someone else.
4. **done**: a reviewer who did **not** implement it has checked every acceptance criterion and filled in **Verification**. If any check fails, set it back to `in-progress` with a note.

`blocked` can be used at any stage; say what it is waiting on in `blocked_by`.

## Rules

- Acceptance criteria are checkable facts ("`npm run build` passes", "rear track reads 1340 mm in every post"), not intentions.
- Numbers come from `content/a40/constants.yaml` once A40-007 is done. Until then, the spec in A40-000 is the source.
- A ticket touches the files it lists. If it needs others, note it in the ticket.
- The Verification section records what was actually run or read, with the result. "Looks good" is not verification.

## Template

```markdown
---
id: A40-NNN
title: Short title
status: todo        # todo | in-progress | review | done | blocked
owner:              # who is implementing
reviewer:           # who verifies (not the owner)
blocked_by:         # ticket ids or an owner decision
---

## Why
One or two sentences.

## Files
- path/to/file

## Acceptance criteria
- [ ] Checkable fact
- [ ] Checkable fact

## Notes
Implementation notes, decisions, links.

## Verification
_Filled by the reviewer: what was checked, how, and the result._
```

## Index

| Id | Title | Status |
|---|---|---|
| [A40-000](./A40-000-canonical-spec.md) | Canonical numbers and decisions | done |
| [A40-001](./A40-001-geometry-script.md) | Geometry script, plots and reference post | in-progress |
| [A40-002](./A40-002-front-geometry-steering.md) | Front narrowing, donor geometry and steering posts | done |
| [A40-003](./A40-003-rear-suspension.md) | Rear suspension post (Miata IRS, RX-8 diff) | done |
| [A40-004](./A40-004-constants-and-tuning.md) | Build constants and suspension tuning posts | done |
| [A40-005](./A40-005-electrical-dash.md) | Electrical, CAN gateway and dash | in-progress |
| [A40-006](./A40-006-roadmap-overview.md) | Roadmap and overview posts | done |
| [A40-007](./A40-007-shared-constants.md) | Shared constants file (YAML → Python → JSON → posts) | todo |
| [A40-008](./A40-008-use-constants.md) | Replace hard-coded numbers with constants | todo |
| [A40-009](./A40-009-consistency-review.md) | Independent cross-post consistency review | todo |
| [A40-010](./A40-010-build-and-visual-check.md) | Build, lint, links and visual check | todo |
| [A40-011](./A40-011-ship.md) | PR, preview check, merge, live check | todo |
| [A40-012](./A40-012-owner-decisions.md) | Owner measurements and decisions | blocked |
| [GAR-001](./GAR-001-garage-structure.md) | Turn /a40 into a multi-car garage | todo |
| [GAR-002](./GAR-002-car-selector.md) | Car selector with outline art | todo |
| [GAR-003](./GAR-003-autozam-art.md) | Autozam AZ-1 line art, gullwing doors up | done (placeholder, see GAR-007) |
| [GAR-004](./GAR-004-autozam-log.md) | Autozam AZ-1 garage log | todo |
| [GAR-005](./GAR-005-blog-usability.md) | Blog usability cleanup | todo (audit done) |
| [GAR-006](./GAR-006-roadmap-views.md) | Roadmap views for deciding what to work on | review (owner to pick default) |
| [GAR-007](./GAR-007-autozam-art-redo.md) | Redo the Autozam AZ-1 line art | todo |
| [GAR-008](./GAR-008-garage-animation.md) | Animated garage on the /garage page | review (component built; integration pending, see GAR-008-integration) |
| [FUT-001](./FUT-001-stl-art-pipeline.md) | Future: 3D scans → stylised spinning art and printable models | idea |
| [GAR-009](./GAR-009-visual-design-pass.md) | Visual design pass for the whole garage blog | todo |
