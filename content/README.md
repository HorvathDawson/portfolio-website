# Writing for the garage

Everything under `content/` is published at `/garage`. Each folder with a `car.json` is a car. Each `*.md` file in that folder is one post (a "sheet"). This guide covers what you can write and how it shows up. To see every component in one place, run `npm run dev` and open `/garage/_styleguide` (dev only, not built into the site).

## Add a post

1. Create `content/<car>/<slug>.md`. The filename is the URL: `content/a40/rear-suspension.md` → `/garage/a40/rear-suspension`. A numeric prefix (`03-teardown.md`) is dropped from the URL.
2. Start it with frontmatter (one `key: value` per line):

```yaml
---
title: "Rear Suspension, Diff & Driveshaft"
date: 2026-03-26          # first written (YYYY-MM-DD)
updated: 2026-10-14       # optional: last real revision
status: in-progress       # planning | in-progress | decided | complete
epic: fabrication         # build cars: an epic id from car.json
kind: log                 # log | reference | tutorial
tags: [suspension, rear]
---
```

Garage-log cars (`"kind": "garage"`, e.g. the Autozam) use these instead of `epic`:

```yaml
category: maintenance     # maintenance | repair | mod | inspection (omit for kind: reference)
mileage_km: 81234
cost: "$120"
parts: [oil filter, 3.2 L 5W-30]
service: [oil and filter] # items for the service table on the car's home page (hidden until a post lists one)
```

3. That's it. The post appears in the sheet rail, the sheet index, the car home's wall, search and the sitemap. Roadmap tasks that should link to it list the slug in their `posts` (src/blog/roadmapData.ts); they then show as the post's work order.

### Sheet and drawing numbers

Sheets are numbered automatically: build cars in epic order (car.json) then by date; garage cars reference posts first, then by date. The drawing number is `<car code>-<first 3 letters of epic or category>-<nn>`, e.g. `A40-FAB-02`. To override:

```yaml
sheet: 3          # put this post at sheet 03 (the others move along)
drawing: A40-GEN-00
```

## Numbers (A40 only)

A40 posts never type a build number by hand. Write a placeholder and it is filled from `content/a40/constants.yaml`:

| Write | Get |
|---|---|
| `{{rear_track}}` | `1340 mm` |
| `{{rear_track:raw}}` | `1340` |
| `{{shaft_angle:1}}` | one decimal |
| `{{front_track:r10}}` | rounded to 10 |
| `{{table:vehicle}}` | a generated table (vehicle, wheels, suspension, drivetrain) |

`npm run check-constants` fails on an unknown name. After editing `constants.yaml`, run `npm run constants` and commit the regenerated JSON.

## Callouts

A blockquote whose first line is `[!type]` becomes a callout with a sticker label. An optional title follows the marker.

```markdown
> [!decision] October 2026
> The rear is a narrowed NA Miata independent rear.

> [!measure]
> Measure hub face to hub face on the donor before cutting.
```

| Type | Use it for |
|---|---|
| `decision` | a choice that is made |
| `verify` / `measure` | something to check or measure before trusting it |
| `safety` | anything that can hurt someone or the car (hazard stripe) |
| `open` | an open question |
| `note` | anything else worth setting apart |

A plain `>` blockquote (no marker) stays a quote.

## Figures

An image alone in its paragraph becomes a numbered figure. The title (in quotes) is the caption:

```markdown
![Driveshaft side view](/assets/projects/a40-austin/blog/plots/driveshaft_angles.png "Driveshaft side view: gearbox output 3° tail-down.")
```

HTML figures still work and are numbered the same way; `class="wide"` lets a figure use the full column:

```html
<figure class="wide">
  <img src="/assets/…/plot.png" alt="What the plot shows" />
  <figcaption>Caption text.</figcaption>
</figure>
```

Every figure gets a Zoom button (and clicking the image) to open it full screen. Put images under `public/assets/…` and always write alt text.

## Tables and status chips

Ordinary Markdown tables get the engineering-sheet style. Two rules make them richer:

- **Status chips:** in a column headed `Status` or `Check`, a cell that starts with a status word becomes a chip; the rest of the cell is shown under it as a note. Words: `locked`, `working`, `target`, `measure`, `verify`, `open`, `decided`, `done`, `complete`, `planning`, `in progress`. So `locked (body)` → a green LOCKED chip with "body" under it. Other text (`to order`) stays as text.
- **Numbers:** a column where most cells start with a number is right-aligned in monospace, with plain units (`mm`, `kg`, `rpm`, …) dimmed.

The generated `{{table:…}}` tables follow the same rules.

## Code

Fenced code blocks get a copy button. Add `title="…"` after the language for a filename tab:

````markdown
```yaml title="content/a40/constants.yaml"
shaft_drop:
  value: 3.5
```
````

## Maths

`$inline$` and `$$display$$` are KaTeX. Display maths sits on a drafting panel and scrolls sideways on phones if it is wide.

## Links

Link to another post with a relative path: `[geometry reference](./geometry-design-reference)` or a section `(./suspension-tuning#springs)`. Every h2/h3 gets an id from its text (GitHub style) and shows in the "On this sheet" contents when a post has four or more.

## Add a car

1. Create `content/<id>/car.json` (the folder name is the URL id):

```json
{
  "name": "Autozam AZ-1",
  "code": "AZ1",
  "logTitle": "AZ-1 Garage Log",
  "year": "1990s",
  "make": "Mazda (Autozam)",
  "model": "AZ-1",
  "description": "One line, shown on the garage and as the meta description.",
  "kind": "garage",
  "status": "in-progress",
  "accent": "#4978f4",
  "order": 1,
  "art": { "outline": "/assets/garage/<id>/outline.svg", "colored": "/assets/garage/<id>/colored.svg", "width": 1279, "height": 873 },
  "roadmap": false
}
```

- `kind`: `build` (posts grouped by `epics`, which you list here with `id`, `title`, `status`, `order`) or `garage` (grouped by category, with a service table).
- `code`: drawing-number prefix (defaults to the folder name in capitals).
- `art`: white line-art outline and the gradient-coloured version, same size. They are used in the garage bay, the car home hero and the shop-bar mini bay.
- Optional `badge`: the car's 88x31 footer badge, e.g. `"badge": "SR20 powered"` (first word bold). Leave it out for no car badge.
- Optional for cars with a constants file: `keyNumbers` (`[{ "label": "Wheelbase", "constants": ["wheelbase"] }]`) and `constantsPost` (slug linked from Key numbers).

2. Add posts. The car gets its own bay on `/garage`, a car home at `/garage/<id>` and a mini bay in the shop bar.

## Where the styles live

All colours, type sizes, spacing, radii, borders, shadows, motion and z-index are in `src/blog/styles/tokens.css`. Components use only those tokens (`components.css`, `layout.css`, `home.css`, `roadmap.css`, `print.css`). The Markdown rules above are in `src/blog/markdown.ts`; numbering and decoration of the rendered HTML in `src/blog/postDom.ts`.
