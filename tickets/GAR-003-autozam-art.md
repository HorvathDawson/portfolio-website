---
id: GAR-003
title: Autozam AZ-1 line art, gullwing doors up
status: review
owner: Claude
reviewer:
blocked_by:
---

## Why
The selector needs the AZ-1 in the same traced white-outline + gradient style as the A40, with the gullwing doors open.

## Steps
1. Owner supplies a photo of the AZ-1 with both doors up: front three-quarter view, left side towards the camera (matches the A40 drawing's angle), plain background, whole car in frame, ideally ≥ 2000 px wide.
2. Cut out the car (transparent background).
3. `python scripts/trace_outline.py --photo <cutout.png> --out public/assets/garage/autozam/` → `outline.svg` + `colored.svg`.
4. Clean up: remove background specks, keep the doors' edges and the glass outlines, match line weight to the A40 drawing at the same display size.

## Acceptance criteria
- [ ] Doors are clearly open (gullwing) in the outline
- [ ] Line weight and detail level look like the A40 drawing side by side at card size
- [ ] Both SVGs under ~200 KB (outline 183 KB, colored 224 KB; the A40's are 175/182 KB)
- [ ] Image is the owner's own photo (supplied by the owner in chat, Oct 2026; owner to confirm rights)

## Notes
Wikimedia Commons is blocked from the build container, and a third-party photo would carry licence terms anyway, so the owner's own photo is the source.

## Verification
_Filled by the reviewer._

## Implementer notes
- Source: owner's front three-quarter photo (960×640), doors up, bonnet shut.
- Cut-out: OpenCV GrabCut seeded with the blue paint as sure-foreground and the wall/floor as background; wall beside the raised door and the floor strip under the sills removed; small holes (headlight, spoke gaps) filled; edge smoothed.
- Licence plate blanked before tracing so the number isn't drawn.
- Upscaled 2× with a CLAHE contrast boost, then `scripts/trace_outline.py --photo --weight 2.2` (new `--weight` option thickens lines to match the A40 at card size). Path coordinates rounded to whole units to cut file size.
- Output: public/assets/garage/autozam/outline.svg and colored.svg. The photo and cut-out are not committed.
