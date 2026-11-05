import React from 'react';
import { categoryLabel, formatDate, formatKm, kindChipLabel, statusLabel } from '../format';
import { sheetNo, type Sheet } from '../postIndex';

/**
 * The drafting title block beside a post title: drawing number, sheet n of
 * N, epic (or category), dates, status and kind, plus mileage / cost / parts
 * for garage-log entries. Built from frontmatter and postIndex.ts.
 */
export const TitleBlock: React.FC<{ sheet: Sheet }> = ({ sheet }) => {
  const p = sheet.post;
  const isEpic = /^E\d+$/.test(sheet.group.short);
  const cells: [string, React.ReactNode, string?][] = [
    ['Drawing no.', p.drawing ?? sheet.drawing, 'tb-cell--wide tb-cell--big'],
    ['Sheet', <><b>{sheetNo(sheet.no)}</b> of {sheetNo(sheet.of)}</>],
    [isEpic ? 'Epic' : p.category ? 'Category' : 'Section', isEpic ? `${sheet.group.short} ${sheet.group.title}` : p.category ? categoryLabel[p.category] : sheet.group.title, 'tb-cell--wide tb-cell--wide-d'],
    ['Date', p.date ? <time dateTime={p.date}>{formatDate(p.date)}</time> : '—'],
    ['Updated', p.updated && p.updated !== p.date ? <time dateTime={p.updated}>{formatDate(p.updated)}</time> : '—'],
    ['Status', <span className={`chip chip--${p.status}`}>{statusLabel[p.status]}</span>],
  ];
  if (p.kind) cells.push(['Kind', kindChipLabel[p.kind]]);
  if (p.mileage_km !== undefined) cells.push(['Mileage', formatKm(p.mileage_km)]);
  if (p.cost) cells.push(['Cost', p.cost]);
  if (p.parts.length) cells.push(['Parts', p.parts.join(', '), 'tb-cell--wide']);
  // The last cell stretches to fill its row: 3 columns on wide screens, 2 on phones
  // (the epic cell is wide only on wide screens).
  const span = (cls: string | undefined, wide: boolean) => (cls?.includes('tb-cell--wide') && (wide || !cls.includes('wide-d')) ? 2 : 1);
  const fill = (cols: number, wide: boolean) => {
    const used = cells.slice(0, -1).reduce((n, c) => n + span(c[2], wide), 0) % cols;
    return cols - used;
  };
  const lastStyle = { '--span-d': fill(3, true), '--span-p': fill(2, false) } as React.CSSProperties;
  return (
    <dl className="titleblock">
      {cells.map(([k, v, cls], i) => (
        <div key={k} className={`tb-cell${cls ? ` ${cls}` : ''}`} style={i === cells.length - 1 ? lastStyle : undefined}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
};
