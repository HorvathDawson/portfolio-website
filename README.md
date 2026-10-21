# dawsonhorvath.com

The portfolio of Dawson Horvath, an engineering physicist who builds robots, imaging systems and
the software that runs them. **[Visit the site →](https://dawsonhorvath.com)**

![The home page: a layered mountain landscape that moves as you scroll](docs/home.jpg)

## What's on it

- **Projects**: a web app for BC fishing regulations, robotics, a motorcycle engine rebuild, an
  electric skateboard, a 3D printer and more. Each card shows a line drawing that fills with
  colour as you hover over it; some also play a short screen recording, like Can I Fish This?
  on both desktop and phone.
- **[The A40 build log](https://dawsonhorvath.com/a40)**: an ongoing restomod of a 1950 Austin
  A40, covering suspension, steering, frame and wiring design, with a roadmap.
- **[Resume](https://dawsonhorvath.com/resume-generator/?resume=dawson&mode=view)**: the live
  resume, made with [Resume Builder](https://github.com/HorvathDawson/resume-generator), a
  companion project anyone can use to make their own.
- **Contact**: a form that emails Dawson directly, plus GitHub and LinkedIn links.

![Project cards, shown as they look on hover](docs/projects.jpg)

## How it's built

- **React, TypeScript and Vite**, served by Cloudflare Workers. The A40 build log is written in
  Markdown and loads separately, so the home page stays light.
- **Parallax header** made of layered WebP artwork; phones get smaller copies, and a blurred
  placeholder shows while it loads.
- **Card artwork** is drawn as white line art with a matching gradient version. Small Python
  scripts in `scripts/` produce the gradient versions, trace drawings or photos into line art,
  and draw the device illustrations.
- **Respects reduced motion**: scroll effects and animated screens switch to still images for
  visitors who ask their device for less motion.
- **Contact form** goes through a small Cloudflare Worker that checks a Cloudflare Turnstile challenge
  and sends the message with Cloudflare Email Routing.
- **SEO and sharing**: per-page titles and descriptions, share images and a sitemap,
  generated at build time.

## Running it locally

```sh
npm install
npm run dev      # local dev server
npm run build    # type-check and build to dist/
npm run lint
```

`npm run preview` builds the site and serves it with the Cloudflare Worker, which is needed to
try the contact form. Copy `.dev.vars.example` to `.dev.vars` first; it uses Cloudflare's test
Turnstile key. In production the Worker needs Email Routing on the domain and three secrets:
`CONTACT_FROM`, `CONTACT_TO` and `TURNSTILE_SECRET`.

<details>
<summary>Where things are</summary>

- `src/data/projects.tsx`: the project cards (text, links, artwork, scroll animation). Cards
  marked `draft: true` are placeholders for future projects, hidden unless the address has
  `?drafts`.
- `src/data/content.ts` and `src/data/site.ts`: about text, contact links, page titles and
  descriptions.
- `src/components/visuals/`: the artwork inside each card.
- `src/blog/` and `content/a40/`: the A40 build log and its Markdown posts.
- `worker/index.ts`: the Worker behind the contact form; it also routes `/resume-generator/` to
  the Resume Builder app.
- `scripts/`: image tools, re-run after changing a source image:
  - `make-header-images.py`: phone-sized header layers, placeholder and share image;
  - `make-stills.py`: still frames used when motion is reduced;
  - `make_svg.py`: white and gradient versions of a line drawing;
  - `trace_outline.py`: line art (or, with `--photo`, a cut-out photo) traced into those two
    versions;
  - `make_device_art.py`: the computer, phone, tablet and TV drawings;
  - `record-demos.mjs`: records the Can I Fish This? card's desktop and phone recordings from
    the live site. Run it from GitHub (Actions → Record demos → Run workflow) to refresh them
    after the site changes; it also runs monthly. canifishthis.ca is behind Cloudflare's bot
    check, so GitHub needs a way in: create a repository secret `DEMO_HEADER` such as
    `X-Demo-Recorder: <long random string>`, and on canifishthis.ca's Cloudflare zone add a WAF
    custom rule matching that header and value with the action *Skip* (Super Bot Fight Mode
    and managed rules). Or run `npm install --no-save playwright && npx playwright install
    chromium && npm run record-demos` on your own computer (needs ffmpeg) and commit the
    results.

  The tracing scripts need `pip install potracer pillow numpy svgpathtools shapely
  opencv-python-headless`.

</details>
