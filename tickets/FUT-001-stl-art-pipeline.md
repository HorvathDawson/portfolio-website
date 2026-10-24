---
id: FUT-001
title: "Future: 3D scans/STLs → stylised spinning art (and printable models)"
status: idea
owner:
reviewer: Dawson
blocked_by: not scheduled
---

## Idea
Use the real 3D data (the A40 body scan, frame CAD, the donor Miata scans, a future Autozam phone scan) as the source for the site's art instead of traced photos and clip art:
- A **spinning car** on its card, like the OpenSim2Real leg: white outline at rest, gradient on hover.
- **Different styles** from the same model: line art (silhouette + creases), blueprint/wireframe, toon-shaded gradient, x-ray (body transparent, frame and suspension visible), exploded view.
- **Printable models**: a scale A40 (and garage diorama) from the scan.

## How the leg does it today
`src/components/visuals/SpinningLeg.tsx` plays two pre-rendered sprite sheets (`leg-outline-spritesheet.webp`, `leg-colored-spritesheet.webp`) with CSS steps. No 3D at runtime.

## Proposed pipeline (offline, scripted)
1. **Prepare the mesh:** load STL/OBJ/PLY (trimesh), decimate to ~100–300k triangles, fix normals, centre and orient (wheels on the ground, nose to +X).
2. **Render N frames** around the vertical axis (36–72 frames) headless: Blender (`blender -b -P render.py`, Freestyle for clean line art) or pyrender/three.js offscreen. Per frame:
   - line pass: silhouette + crease edges (normal-angle threshold) + optional hidden-line, at a fixed stroke width so it matches the existing outline art;
   - colour pass: flat or toon shading with the site gradient (#f65e79 → #8a3ab9 → #4978f4) on the base #361c7d.
3. **Pack** into WebP sprite sheets (outline + colour) and reuse the SpinningLeg component (generalised: frames, size, speed, scroll- or drag-driven rotation).
4. **Stills:** any single frame becomes `outline.svg`/`colored.svg` via `scripts/trace_outline.py` (line-art mode), so the garage tiles and the A40 card can use the real car.
5. **Optional live 3D:** three.js with an edge-detection post pass for drag-to-rotate on the car's page. Heavier (~150 KB+ JS, GPU); sprite sheets stay the default for cards.

## Printable models
- From the scan: make it watertight (Blender remesh / voxel remesh), thicken thin panels (≥1.2 mm at print scale), separate wheels, scale (1:18 ≈ 215 mm long; 1:43 ≈ 90 mm), export STL. Resin prints hold the panel detail best.
- The garage scene could be a printable diorama too.

## Difficulty
- Sprite-sheet pipeline from a clean mesh: **medium** (a day or two to script and tune the line style). Each extra style: small.
- The scan itself is the hard part: raw scans are noisy and huge; cleaning/decimating and getting crisp crease lines is where the time goes.
- **Autozam:** a phone photogrammetry scan (Polycam / RealityScan / Scaniverse, walk around it in even light) would also solve GAR-007: render the doors-up 3/4 view from the mesh and get clean line art.
- Printable model: medium; mostly mesh repair.

## Not now
Recorded as a future idea only; not part of the current branch.
