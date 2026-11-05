/* ============================================================
   Garage Markdown: the marked set-up every post goes through.
   ------------------------------------------------------------
   Plain marked + KaTeX, plus a few rules that turn ordinary
   Markdown into the site's components (documented for authors
   in content/README.md):

   Callouts    > [!decision] Optional title     (also verify,
               > Body text…                      measure, safety,
                                                  open, note)
   Figures     ![alt](src "Caption")  alone in a paragraph, or
               raw <figure><img><figcaption> HTML (kept as is)
   Tables      a column headed "Status" or "Check": a cell that
               starts with a status word (locked, working, target,
               measure, open, decided, verify, done…) gets a chip,
               the rest of the cell becomes a note. Mostly-numeric
               columns are right-aligned with units dimmed.
   Code        ```yaml title="content/a40/constants.yaml"
               (filename tab + copy button, see GarageBlog.tsx)
   Headings    get GitHub-style ids (search index uses the same rule).
   ============================================================ */

import { Marked, type Tokens } from 'marked';
import markedKatex from 'marked-katex-extension';

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
export const decodeEntities = (s: string) => s.replace(/&(amp|lt|gt|quot|#39);/g, (e) => ENTITIES[e]);
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, '')).trim();

/* ── Callouts ──────────────────────────────────────── */

/** Callout types and their sticker labels. `measure` and `verify` share a style. */
export const CALLOUTS: Record<string, string> = {
  decision: 'Decision',
  verify: 'Verify',
  measure: 'Measure',
  safety: 'Safety',
  open: 'Open question',
  note: 'Note',
};

const CALLOUT_START = /^<p>\[!([a-z]+)\][ \t]*([^\n]*?)(\n|<\/p>\n?)/i;

function renderCallout(inner: string): string | undefined {
  const m = inner.match(CALLOUT_START);
  if (!m) return undefined;
  const type = m[1].toLowerCase();
  if (!CALLOUTS[type]) return undefined;
  const title = m[2].trim();
  // Title alone on the first line closed the paragraph; otherwise the body continues it.
  let body = inner.slice(m[0].length);
  if (m[3].startsWith('\n')) body = `<p>${body}`;
  const head = `<p class="callout-label">${CALLOUTS[type]}</p>${title ? `<p class="callout-title">${title}</p>` : ''}`;
  return `<div class="callout callout--${type}" role="note">${head}${body}</div>\n`;
}

/* ── Tables ────────────────────────────────────────── */

/** Words that become status chips (first word(s) of a Status / Check cell). */
const STATUS_WORDS = ['in progress', 'locked', 'working', 'target', 'measure', 'open', 'decided', 'verify', 'done', 'complete', 'planning'];
const STATUS_RE = new RegExp(`^(${STATUS_WORDS.join('|')})(?=$|[\\s(:;,.])`, 'i');
const STATUS_CLASS: Record<string, string> = { 'in progress': 'in-progress', done: 'complete' };

function statusCell(html: string): string {
  const text = plain(html);
  const m = text.match(STATUS_RE);
  if (!m) return html;
  const word = m[1].toLowerCase();
  const rest = text.slice(m[0].length).replace(/^[\s:;,.]+/, '').trim();
  const note = rest ? `<span class="cell-note">${escapeHtml(rest.replace(/^\((.*)\)$/, '$1'))}</span>` : '';
  return `<span class="chip chip--${STATUS_CLASS[word] ?? word}">${escapeHtml(word)}</span>${note}`;
}

const NUMERIC = /^[~≈<>±+−-]?\s?\d/;
const isNumeric = (html: string) => {
  const t = plain(html);
  return NUMERIC.test(t) && (t.match(/[a-z]/gi)?.length ?? 0) <= 6;
};
const UNITS = /(\d)\s(mm|cm|kg|N\/mm|Nm|N|rpm|in|km\/h|km|kW|whp|hp|L|Hz|ms|V|A|W|deg|m|s|cc|kPa|psi|bar)(?![\w/])/g;
const dimUnits = (html: string) => (html.includes('<') ? html : html.replace(UNITS, '$1 <span class="u">$2</span>'));

function renderTable(this: { parser: { parseInline(tokens: Tokens.Generic[]): string } }, token: Tokens.Table): string {
  const head = token.header.map((c) => this.parser.parseInline(c.tokens));
  const rows = token.rows.map((r) => r.map((c) => this.parser.parseInline(c.tokens)));
  const cols = head.map((h, i) => {
    const filled = rows.map((r) => r[i]).filter((c) => c && plain(c));
    const status = /^(status|check)$/i.test(plain(h));
    const numeric = !status && filled.length > 0 && filled.filter(isNumeric).length / filled.length >= 0.6;
    return { status, numeric };
  });
  const cls = (i: number) => (cols[i].numeric ? ' class="c-num"' : cols[i].status ? ' class="c-st"' : '');
  const align = (i: number) => (!cols[i].numeric && token.align[i] ? ` style="text-align:${token.align[i]}"` : '');
  const th = head.map((h, i) => `<th scope="col"${cls(i)}${align(i)}>${h}</th>`).join('');
  const body = rows
    .map((r) => `<tr>${r.map((c, i) => `<td${cls(i)}${align(i)}>${cols[i].status ? statusCell(c) : cols[i].numeric ? dimUnits(c) : c}</td>`).join('')}</tr>`)
    .join('\n');
  return `<table class="sheet-table">\n<thead><tr>${th}</tr></thead>\n<tbody>\n${body}\n</tbody>\n</table>\n`;
}

/* ── Code ──────────────────────────────────────────── */

function renderCode({ text, lang }: Tokens.Code): string {
  const info = (lang ?? '').trim();
  const language = info.match(/^[^\s"]+/)?.[0] ?? '';
  const title = info.match(/title="([^"]*)"/)?.[1];
  const tab = title ? `<span class="code-file">${escapeHtml(title)}</span>` : '';
  const langLabel = language ? `<span class="code-lang">${escapeHtml(language)}</span>` : '';
  return `<div class="code-block">`
    + `<div class="code-bar">${tab}${langLabel}<button type="button" class="code-copy" data-copy-code>Copy</button></div>`
    + `<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>${escapeHtml(text.replace(/\n$/, ''))}</code></pre>`
    + `</div>\n`;
}

/* ── Headings ──────────────────────────────────────── */

/** GitHub-style heading slug, so `./post#some-heading` links resolve. */
export function headingSlugger() {
  const used = new Map<string, number>();
  return (innerHtml: string) => {
    const base = decodeEntities(innerHtml.replace(/<[^>]+>/g, ''))
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s_-]/gu, '')
      .replace(/\s/g, '-');
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };
}

/** Markdown → post HTML (a fresh heading-id scope per call). */
export function renderMarkdown(md: string): string {
  const slug = headingSlugger();
  const marked = new Marked()
    .use(markedKatex({ throwOnError: false, nonStandard: true }))
    .use({
      renderer: {
        heading({ tokens, depth }) {
          const inner = this.parser.parseInline(tokens);
          return `<h${depth} id="${slug(inner)}">${inner}</h${depth}>\n`;
        },
        blockquote({ tokens }) {
          const inner = this.parser.parse(tokens);
          return renderCallout(inner) ?? `<blockquote>\n${inner}</blockquote>\n`;
        },
        paragraph({ tokens }) {
          // A paragraph that is just one image becomes a figure; its title is the caption.
          const only = tokens.filter((t) => !(t.type === 'text' && !t.raw.trim()));
          if (only.length === 1 && only[0].type === 'image') {
            const img = only[0] as Tokens.Image;
            const cap = img.title ? `<figcaption>${escapeHtml(img.title)}</figcaption>` : '';
            return `<figure><img src="${escapeHtml(img.href)}" alt="${escapeHtml(img.text)}" />${cap}</figure>\n`;
          }
          return `<p>${this.parser.parseInline(tokens)}</p>\n`;
        },
        table: renderTable,
        code: renderCode,
      },
    });
  return marked.parse(md, { async: false }) as string;
}
