---
id: GAR-010
title: Slime-mould loading icon
status: done
owner: Claude
reviewer: Dawson
blocked_by:
---

## What
The owner's procedural slime-mould sphere (`scripts/slime_loader.py`) is the site's loading icon: the full-screen fallback while a page's code loads (`PageLoader` in `src/main.tsx`) and the "loading post" state in the garage blog. Sphere recoloured to the site purple (#9a6be6 → #5a2fb4 → #241052), veins to the site gold (#f3de40). `--food 450` keeps it ~154 KB (~23 KB gzipped); `--static` makes the still version served under prefers-reduced-motion. The page loader fades in after 150 ms so fast loads don't flash.

## Verification
Playwright with the route chunks delayed 2.5 s: loader centred at 1440×900 and 390×844, still frame under reduced motion, gone once the page renders, no console errors. Build and lint pass.
