---
id: GAR-009
title: Visual design pass for the whole garage blog (keep its character)
status: todo
owner:
reviewer: Dawson
blocked_by: GAR-008 integration (same CSS files)
---

## Why
The blog works but looks assembled piece by piece: three type families, many border styles, dense sidebar, plain tables and figures. It should look designed, while keeping what makes it unique: the dark night-garage feel, the white line art with the pink→purple→blue gradient, the retro "under construction / visitor counter" web-1.0 jokes, and the monospace engineering-notebook voice.

## Direction: "night garage engineering notebook"
- **Design tokens first:** one CSS file of variables for colour (background layers, ink, accent gold, gradient stops, status colours), spacing scale, radii, border styles, shadows/glows, type sizes. Replace one-off values in blogStyles.css, garage.css, roadmapViews.css with tokens.
- **Typography:** keep the serif display headings and the monospace UI, pick one body face; a clear type scale (post title, h2, h3, body, small/meta); comfortable measure (~68–75ch) and line height; tabular numerals in tables.
- **Post header:** car outline art faintly behind the title (the same line art, low opacity, gradient on hover), date / kind / status / updated as one tidy meta row, roadmap-task box styled as a "work order" card.
- **Callouts:** consistent boxes for Decision, Open question, Verify/measure, Safety, Formula, styled like notebook stickers or shop tags. Markdown syntax (`> [!verify]` etc.) so posts can use them.
- **Tables:** engineering-sheet look: header row in mono caps, zebra or ruled rows, numbers right-aligned with units dimmed, status cells as chips (locked / working / open / measure).
- **Figures:** consistent frame, caption style, click to enlarge (lightbox with zoom), plots on a light "paper" card so the dark-on-white matplotlib output sits well.
- **Maths and code:** KaTeX blocks on a subtle panel; code blocks with a filename tab and copy button.
- **Sidebar:** calmer: fewer borders, clearer active state, epic progress as a thin bar, the visitor counter / under-construction kept but smaller and placed as a footer gag.
- **Motion:** small, purposeful: the gradient "ink" sweeping into the car art on load, link underline grow, card lift; all off under reduced motion.
- **Car landing page** (/garage/:car with no post): hero with the big car art, short intro, key numbers (from the constants file for the A40), latest posts, "what's next" from the roadmap.
- **Roadmap pages** share the same tokens and card styles.
- **Consistency checks:** contrast AA everywhere, focus rings consistent, 390 px layout reviewed for every component, print still works.

## Process
1. Moodboard/mockups of 2–3 directions as screenshots for the owner (same content, different treatment), owner picks.
2. Tokens + typography + layout.
3. Components (callouts, tables, figures, code, meta row, cards).
4. Car landing pages.
5. Screenshot review at 1440 / 1024 / 390, light-OS hover variants, print.

## Acceptance criteria
- [ ] Owner picked a direction from the mockups
- [ ] All blog/garage/roadmap styles use the shared tokens (no stray hex colours or ad-hoc spacing outside the token file)
- [ ] Callout syntax implemented and used in at least the build-constants, steering and rear-suspension posts
- [ ] Figures open in a lightbox; tables use the engineering-sheet style
- [ ] Contrast AA, keyboard focus visible, no horizontal scroll at 390 px, print still full-length
- [ ] Still recognisably this site: line-art cars, gradient, retro touches kept

## Verification
_Filled by the reviewer._
