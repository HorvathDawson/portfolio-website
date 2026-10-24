---
id: A40-007
title: Shared constants file (YAML → Python → JSON → posts)
status: todo
owner:
reviewer:
blocked_by: A40-001, A40-004
---

## Why
Numbers are typed by hand into a dozen posts and scripts and drift apart. One file should drive all of them.

## Design
- `content/a40/constants.yaml`: inputs only (masses, track, wheelbase, ET, tyre size, MR, target frequencies, CG, RC band…). Each entry has `value`, `unit`, `status` (locked/working/target/open/measure) and `note`.
- `scripts/a40_constants.py`: loads the YAML, computes derived values (track from hub face and ET, tyre OD, corner masses, wheel and spring rates, roll stiffness, roll angle, critical damping, rpm table…), writes `src/blog/a40-constants.generated.json`. Importable from the plot scripts: `from a40_constants import C`.
- Posts use `{{name}}` (formatted value with unit) or `{{name:raw}}`. `blogData.ts` substitutes at load. An unknown placeholder throws, so the build fails.
- The build-constants tables are generated from the YAML (a `{{table:vehicle}}`-style block), so that page can't disagree with the file.
- roadmapData.ts reads the JSON instead of literals.
- `npm run build` runs the Python step first, or the generated JSON is committed and a check fails if it's stale.

## Acceptance criteria
- [ ] Changing one input (e.g. ET) and rebuilding changes every dependent number in posts and plots
- [ ] Unknown `{{placeholder}}` fails `npm run build` with the post and name in the error
- [ ] Derived values match A40-000 (unit tests in Python: track 1234, OD 647.5, corners 231/181, roll stiffness 13.5/14.4, damping 4.1/3.4)
- [ ] Plot scripts import the constants; no duplicated literals for the same quantities
- [ ] README section in the YAML header explains how to add a constant

## Verification
_Filled by the reviewer._
