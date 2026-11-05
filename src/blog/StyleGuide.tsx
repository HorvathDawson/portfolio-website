import React, { useMemo, useState } from 'react';
import { cars, getCar } from './cars';
import { renderMarkdown } from './markdown';
import { decoratePost } from './postDom';
import { sheetFor, sheetsFor } from './postIndex';
import { ShopBar } from './components/ShopBar';
import { SheetRail } from './components/SheetRail';
import { SheetTabs } from './components/SheetTabs';
import { SheetIndex } from './components/SheetIndex';
import { TitleBlock } from './components/TitleBlock';
import { WorkOrder } from './components/WorkOrder';
import { KeyNumbers } from './components/KeyNumbers';
import { Gags } from './components/Gags';
import { Lightbox, type LightboxImage } from './components/Lightbox';
import { BayHero } from './GarageScene';
import './styles/garage.css';
import 'katex/dist/katex.min.css';

/* ============================================================
   /garage/_styleguide — dev only (registered in main.tsx when
   import.meta.env.DEV). Every token and component on one page,
   so a change to tokens.css or components.css can be checked
   in one place. Not in the sitemap or the production bundle.
   ============================================================ */

const COLOURS = [
  'night-0', 'night-1', 'bench', 'wall', 'sheet', 'surface', 'surface-2',
  'ink', 'ink-2', 'ink-3', 'ink-4', 'link', 'accent', 'cyan', 'g1', 'g2', 'g3',
  'st-locked', 'st-working', 'st-target', 'st-measure', 'st-open', 'st-decided', 'st-planning', 'st-safety', 'st-crit',
  'manila', 'manila-2', 'manila-ink', 'stamp-red', 'stamp-violet', 'paper',
];
const TYPE = ['t-micro', 't-meta', 't-ui', 't-small', 't-body', 't-lede', 't-h3', 't-h2', 't-h1'];
const SPACE = ['s-0', 's-1', 's-2', 's-3', 's-4', 's-5', 's-6', 's-7', 's-8'];
const STATUSES = ['locked', 'working', 'target', 'measure', 'verify', 'open', 'decided', 'planning', 'in-progress', 'complete'];

const SAMPLE_MD = `Body text is Lora at 18 px / 1.7 with a 70ch measure. **Strong**, *emphasis*, [an internal link](/garage/a40/steering), [an external link](https://example.com) and \`inline code\`.

## Callouts

> [!decision] October 2026
> The rear is a narrowed NA Miata independent rear.

> [!verify]
> Measure hub face to hub face on the donor before cutting.

> [!measure] Narrowing amount
> Narrowing per side = stock hub-face distance − 708 mm.

> [!safety]
> A diagonal split has no rear circuit.

> [!open]
> Front/rear split or diagonal split?

> [!note]
> A plain note.

## Table with status chips

| Item | Value | Status |
|---|---|---|
| Rear track | 1340 mm | locked (body) |
| Operating mass | ~950 kg | working |
| Final drive | 4.44 | measure on the unit |
| Brake split | — | open |

## Code, maths, figure

\`\`\`yaml title="content/a40/constants.yaml"
shaft_drop:
  value: 3.5
  unit: in
\`\`\`

$$\\theta_{UJ} = \\arctan\\left(\\frac{\\Delta z}{L}\\right) - \\theta_{gb}$$

![Driveshaft angle layout](/assets/projects/a40-austin/blog/plots/driveshaft_angles.png "Driveshaft side view (a figure from Markdown image syntax with a title).")

### A third-level heading

1. Ordered list
2. Second item

- Bullet list
- Second item
`;

const Swatch: React.FC<{ name: string }> = ({ name }) => (
  <li className="sg-swatch">
    <span style={{ background: `var(--${name})` }} />
    <code>--{name}</code>
  </li>
);

export const StyleGuide: React.FC = () => {
  const car = getCar('a40') ?? cars[0];
  const sheet = sheetFor(car.id, 'rear-suspension') ?? sheetsFor(car.id)[0];
  const sheets = sheetsFor(car.id);
  const [indexOpen, setIndexOpen] = useState(false);
  const [zoom, setZoom] = useState<LightboxImage | null>(null);
  const sample = useMemo(() => decoratePost(renderMarkdown(SAMPLE_MD), '/garage/_styleguide').html, []);

  return (
    <div className="garage">
      <ShopBar car={car} crumbs={[{ label: 'Garage', to: '/garage' }, { label: 'Style guide' }]} onSheets={() => setIndexOpen(true)} />
      <SheetRail car={car} current={sheet} />
      <main className="bench sg">
        <article className="sheet sheet--plain">
          <p className="kicker">Dev only <b>/</b> /garage/_styleguide</p>
          <h1 className="sheet-title">Garage style guide</h1>

          <h2 className="sg-h">Colour tokens</h2>
          <ul className="sg-swatches">{COLOURS.map((c) => <Swatch key={c} name={c} />)}</ul>

          <h2 className="sg-h">Type scale</h2>
          {TYPE.map((t) => (
            <p key={t} style={{ fontSize: `var(--${t})`, fontFamily: t.startsWith('t-h') ? 'var(--f-display)' : 'var(--f-body)', color: 'var(--ink)', lineHeight: 1.3, margin: '6px 0' }}>
              <code className="sg-code">--{t}</code> The quick brown A40
            </p>
          ))}
          <p className="sg-mono">Space Mono: UI labels, meta, numbers 0123456789</p>

          <h2 className="sg-h">Spacing</h2>
          <ul className="sg-space">{SPACE.map((s) => <li key={s}><span style={{ width: `var(--${s})` }} /><code>--{s}</code></li>)}</ul>

          <h2 className="sg-h">Chips, dots, stamps, progress</h2>
          <p className="sg-row">{STATUSES.map((s) => <span key={s} className={`chip chip--${s}`}>{s}</span>)}<span className="chip chip--plain">plain</span></p>
          <p className="sg-row">{STATUSES.map((s) => <span key={s} className={`dot dot--${s}`} />)}</p>
          <p className="sg-row sg-paper">{['planning', 'in-progress', 'decided', 'complete'].map((s) => <span key={s} className={`stamp stamp--${s}`}>{s}</span>)}</p>
          <span className="bar" style={{ maxWidth: 320 }}><i style={{ width: '40%' }} /></span>

          <h2 className="sg-h">Buttons and labels</h2>
          <p className="sg-row">
            <a className="btn btn--gold" href="#top">Gold</a>
            <a className="btn" href="#top">Default</a>
            <a className="btn btn--tag" href="#top">Tag</a>
            <button type="button" className="btn btn--ghost" onClick={() => setIndexOpen(true)}>Open sheet index</button>
            <a className="neon" href="#top"><span>The Garage</span></a>
          </p>
          <p className="kicker">Kicker <b>/</b> mono caps <b>/</b> cyan</p>
          <ul className="tags"><li>tag</li><li>another</li></ul>

          <h2 className="sg-h">Title block and work order</h2>
          <div style={{ maxWidth: 440 }}>
            <TitleBlock sheet={sheet} />
            <WorkOrder car={car.id} sheet={sheet} />
          </div>

          <h2 className="sg-h">Post body (Markdown components)</h2>
          <div
            className="prose"
            onClick={(e) => {
              const img = (e.target as HTMLElement).closest('figure')?.querySelector('img');
              if (img) setZoom({ src: img.src, alt: img.alt, caption: 'Lightbox demo' });
            }}
            dangerouslySetInnerHTML={{ __html: sample }}
          />

          <h2 className="sg-h">Bay hero</h2>
          <div style={{ maxWidth: 420 }}><BayHero car={car} sign="Bay 01" /></div>

          <h2 className="sg-h">Key numbers</h2>
          <KeyNumbers car={car} no="03" />

          <h2 className="sg-h">Sheet tabs</h2>
          <SheetTabs car={car} prev={sheets[0]} next={sheets[1]} />
        </article>
        <Gags count={sheets.length} />
      </main>
      <SheetIndex car={car} current={sheet} open={indexOpen} onClose={() => setIndexOpen(false)} />
      <Lightbox image={zoom} onClose={() => setZoom(null)} />
      <style>{`
        .sg .sheet { padding-bottom: 72px; }
        .sg-h { margin: var(--s-7) 0 var(--s-4); padding-bottom: var(--s-2); border-bottom: var(--bw) solid var(--line-2); color: var(--ink); font: 700 var(--t-h3) var(--f-display); }
        .sg-swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: var(--s-3); list-style: none; }
        .sg-swatch { display: grid; gap: var(--s-1); }
        .sg-swatch span { height: 40px; border: var(--bw) solid var(--line-2); border-radius: var(--r-1); }
        .sg-space { list-style: none; display: grid; gap: var(--s-1); }
        .sg-space li { display: flex; align-items: center; gap: var(--s-3); }
        .sg-space span { height: 10px; background: var(--accent); }
        .sg-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3); margin: var(--s-3) 0; }
        .sg-paper { padding: var(--s-3); background: var(--manila); }
        .sg-code { color: var(--ink-3); font-size: var(--t-meta); margin-right: var(--s-3); }
        .sg-mono { color: var(--ink-2); font: 400 var(--t-ui) var(--f-mono); }
      `}</style>
    </div>
  );
};
