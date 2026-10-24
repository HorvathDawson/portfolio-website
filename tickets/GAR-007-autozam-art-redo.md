---
id: GAR-007
title: Redo the Autozam AZ-1 line art
status: todo
owner:
reviewer: Dawson
blocked_by:
---

## Why
The current Autozam drawing (traced from the owner's 960×640 photo) is jittery: lots of small fragments, uneven lines, and the windows are a mess of reflection edges. Next to the A40 it doesn't look like the same hand.

## What was tried (Oct 2026)
1. **Photo edge trace** (`scripts/trace_outline.py --photo --weight 2.2` on a GrabCut cut-out, upscaled 2× with CLAHE). In the repo now. Detail is there but the lines are fragmented and the glass is noisy.
2. **Paint-boundary lines** (mean-shift + blue-paint mask): lost the windows and door frames entirely.
3. **Automatic silhouette + hand-placed detail lines** (`tickets/assets/GAR-007-autozam-hand-attempt.py`): clean and even, but the owner judged it worse; it reads as a cartoon and loses the car's character.

## Options for next time
- A higher-resolution photo (≥ 3000 px wide, the whole car, plain background, same angle). The edge trace was limited mostly by the 960 px source.
- Trace it by hand in a vector editor (Inkscape/Illustrator) over the photo at the A40's line weight, then run it through `scripts/make_svg.py` for the outline and gradient versions.
- Commission or draw it, matching the A40 clip-art style (thick outer line, medium panel lines, filled dark details).

## Acceptance criteria
- [ ] Owner approves it side by side with the A40 card at card size
- [ ] Doors clearly up (gullwing); windows read as glass, not noise
- [ ] Even line weight comparable to the A40; no specks or fragments
- [ ] outline.svg and colored.svg under ~200 KB; licence plate not readable
- [ ] Drop-in replacement at public/assets/garage/autozam/

## Verification
_Filled by the reviewer._
