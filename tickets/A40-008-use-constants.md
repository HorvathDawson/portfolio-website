---
id: A40-008
title: Replace hard-coded numbers with constants
status: todo
owner:
reviewer:
blocked_by: A40-007
---

## Files
All of content/a40/*.md, scripts/plot_geometry_reference.py, scripts/a40-*.py, src/blog/roadmapData.ts

## Acceptance criteria
- [ ] Every number listed in constants.yaml is a placeholder in the posts (grep for the literal values returns only the YAML, generated JSON, and historical log entries where the old value is the point)
- [ ] Rendered posts read the same as before apart from intended corrections (diff the rendered text)
- [ ] Plots regenerate identically or with intended changes only

## Verification
_Filled by the reviewer._
