import React from 'react';
import { Link } from 'react-router-dom';
import { BayHero } from '../GarageScene';
import { cars, postPath, roadmapPath, type Car } from '../cars';
import { formatDate, formatKm, kindLabel, statusLabel } from '../format';
import { lastReadSlug } from '../lastRead';
import { serviceTable, sheetGroups, sheetsFor, sheetNo, type Sheet, type SheetGroup } from '../postIndex';
import { useRoadmap } from '../useRoadmap';
import { useBreakpoint } from '../../utils/useBreakpoint';
import type { EpicSummary, NextTask } from '../roadmapQueries';
import { KeyNumbers } from './KeyNumbers';
import { Gags } from './Gags';

type Queries = NonNullable<ReturnType<typeof useRoadmap>>;

const KIND_WORD: Record<NextTask['kind'], string> = { decision: 'Decide', purchase: 'Buy', task: 'Do' };
const taskHref = (car: string, id: string) => `${roadmapPath(car)}?view=next&task=${encodeURIComponent(id)}`;

/* ── Hero ──────────────────────────────────────────── */

const Hero: React.FC<{ car: Car; sheets: Sheet[]; rm: Queries | null | undefined }> = ({ car, sheets, rm }) => {
  const bay = String(cars.indexOf(car) + 1).padStart(2, '0');
  const since = sheets.reduce((m, s) => (s.post.date && s.post.date < m ? s.post.date : m), '9999').slice(0, 4);
  const latest = sheets.reduce((m, s) => ((s.post.updated ?? s.post.date) > m ? (s.post.updated ?? s.post.date) : m), '');
  const last = lastReadSlug(car.id);
  const cont = last ? sheets.find((s) => s.post.slug === last) : undefined;
  const first = sheets[0];
  const total = rm ? rm.overall() : undefined;
  return (
    <section className="home-hero">
      <BayHero car={car} sign={`Bay ${bay}`} />
      <div className="home-hero-text">
        <p className="kicker">Bay {bay} <b>/</b> {kindLabel[car.kind]}{since !== '9999' && <> <b>/</b> since {since}</>}</p>
        <h1>{car.name}</h1>
        <p className="home-lede">{car.description}</p>
        <dl className="stats">
          <div><dt>Sheets</dt><dd>{sheets.length}</dd></div>
          {total && <div><dt>Tasks done</dt><dd>{total.done}<small>/{total.total}</small></dd></div>}
          {total && <div><dt>Built</dt><dd>{total.pct}%</dd></div>}
          {!car.roadmap && <div><dt>Status</dt><dd className="stats-word">{statusLabel[car.status]}</dd></div>}
          {latest && <div><dt>Last sheet</dt><dd className="stats-word"><time dateTime={latest}>{formatDate(latest).replace(/, \d{4}$/, '')}</time></dd></div>}
        </dl>
        {first && (
          <p className="home-cta">
            {cont && cont !== first && (
              <Link className="btn btn--gold" to={postPath(car.id, cont.post.slug)}>Continue · sheet {sheetNo(cont.no)}</Link>
            )}
            <Link className={`btn${cont && cont !== first ? '' : ' btn--gold'}`} to={postPath(car.id, first.post.slug)}>
              Start at sheet {sheetNo(first.no)}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
};

/* ── Next up ───────────────────────────────────────── */

const NextUp: React.FC<{ car: Car; rm: Queries; no: string }> = ({ car, rm, no }) => {
  const tasks = rm.nextUp(4);
  if (tasks.length === 0) return null;
  return (
    <section className="home-section" aria-labelledby="nextup-h">
      <h2 className="section-h" id="nextup-h">
        <span className="section-no">{no}</span>Next up <small>ready now, from the roadmap</small>
        <Link to={roadmapPath(car.id)}>Open roadmap →</Link>
      </h2>
      <ul className="pegboard pegboard--tags">
        {tasks.map((t) => (
          <li key={t.task.id}>
            <Link className="tag-card" to={taskHref(car.id, t.task.id)}>
              <span className="tag-card-k">{KIND_WORD[t.kind]}<span>{t.wo}</span></span>
              <span className="tag-card-t">{t.task.title}</span>
              <span className="tag-card-e">{t.epicTitle}</span>
              <span className="tag-card-m">
                <span>{t.unblocks > 0 ? `Unblocks ${t.unblocks}` : 'Nothing waits on it'}</span>
                <span className={`stamp stamp--${t.task.status}`}>{statusLabel[t.task.status]}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

/* ── The wall ──────────────────────────────────────── */

const Board: React.FC<{ car: Car; group: SheetGroup; summary?: EpicSummary; current?: Sheet; open: boolean; collapsible: boolean }> = ({
  car, group, summary, current, open, collapsible,
}) => {
  const epic = car.epics.find((e) => e.id === group.id);
  const status = epic?.status;
  const pct = summary && summary.total ? (100 * summary.done) / summary.total : undefined;
  const list = group.sheets.length ? (
    <ul className="board-sheets">
      {group.sheets.map((s) => (
        <li key={s.post.slug} className={s === current ? 'is-on' : undefined}>
          <span className="sheet-row-no">{sheetNo(s.no)}</span>
          <Link to={postPath(car.id, s.post.slug)}>{s.post.title}</Link>
          <span className={`dot dot--${s.post.status}`} aria-hidden="true" />
          <span className="sr-only">{statusLabel[s.post.status]}</span>
        </li>
      ))}
    </ul>
  ) : <p className="board-empty">No sheets yet</p>;
  return (
    <li className={`board${group.sheets.includes(current!) ? ' is-on' : ''}`}>
      <span className="board-clip" aria-hidden="true" />
      <p className="board-k"><span>{group.short}</span>{status && <span className={`chip chip--${status}`}>{statusLabel[status]}</span>}</p>
      <h3>{group.title}</h3>
      {pct !== undefined && (
        <p className="board-progress">
          <span className="bar"><i style={{ width: `${Math.max(2, pct)}%` }} /></span>
          <span>{summary!.done}/{summary!.total} tasks</span>
        </p>
      )}
      {collapsible && group.sheets.length > 0 ? (
        <details open={open}>
          <summary>{group.sheets.length} {group.sheets.length === 1 ? 'sheet' : 'sheets'}</summary>
          {list}
        </details>
      ) : list}
      {summary?.next && (
        <Link className="board-next" to={taskHref(car.id, summary.next.task.id)}>
          <b>Next</b>{summary.next.task.title}
        </Link>
      )}
      {!summary?.next && summary?.blockedBy && (
        <p className="board-next board-next--blocked"><b>Waiting on</b>{summary.blockedBy.title}</p>
      )}
    </li>
  );
};

const Wall: React.FC<{ car: Car; rm: Queries | null | undefined; no: string }> = ({ car, rm, no }) => {
  const isBuild = car.kind === 'build';
  const groups = sheetGroups(car.id, isBuild);
  const summaries = rm ? rm.epicSummaries() : undefined;
  const last = lastReadSlug(car.id);
  const current = sheetsFor(car.id).find((s) => s.post.slug === last);
  const bp = useBreakpoint();
  const phone = bp === 'mobile';
  // Phones expand only the board being read (else the first one with work in progress).
  const openId = current?.group.id ?? groups.find((g) => car.epics.find((e) => e.id === g.id)?.status === 'in-progress')?.id ?? groups[0]?.id;
  return (
    <section className="home-section" aria-labelledby="wall-h">
      <h2 className="section-h" id="wall-h">
        <span className="section-no">{no}</span>The wall
        <small>{isBuild ? `${groups.length} epics, every sheet, what's next` : 'every entry by category'}</small>
      </h2>
      <ul className="pegboard pegboard--boards">
        {groups.map((g) => (
          <Board key={g.id} car={car} group={g} summary={summaries?.get(g.id)} current={current} open={!phone || g.id === openId} collapsible={phone} />
        ))}
      </ul>
    </section>
  );
};

/* ── Service table (garage cars) ───────────────────── */

const ServiceTable: React.FC<{ car: Car; no: string }> = ({ car, no }) => {
  const rows = serviceTable(car.id);
  return (
    <section className="home-section" aria-labelledby="service-h">
      <h2 className="section-h" id="service-h"><span className="section-no">{no}</span>Service record <small>latest job per item</small></h2>
      {rows.length === 0 ? (
        <p className="muted">No services logged yet. List jobs in a post's <code>service:</code> frontmatter and they show here.</p>
      ) : (
        <div className="scroll-x">
          <table className="sheet-table">
            <thead><tr><th scope="col">Item</th><th scope="col">Last done</th><th scope="col" className="c-num">Mileage</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.item}>
                  <td><Link to={postPath(car.id, r.post.slug)}>{r.item}</Link></td>
                  <td>{formatDate(r.date)}</td>
                  <td className="c-num">{r.mileage_km !== undefined ? formatKm(r.mileage_km) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

/**
 * /garage/:car — the car's home: lit bay hero with stats and Continue /
 * Start buttons, Next up tags and the wall (one board per epic, with
 * roadmap progress and next task), then key numbers. Garage-kind cars get
 * the same page with category boards and the service table.
 */
export const CarHome: React.FC<{ car: Car }> = ({ car }) => {
  const rm = useRoadmap(car.roadmap);
  const sheets = sheetsFor(car.id);
  let n = 0;
  const no = () => String(++n).padStart(2, '0');
  return (
    <div className="home">
      <Hero car={car} sheets={sheets} rm={rm} />
      {rm && <NextUp car={car} rm={rm} no={no()} />}
      {car.kind === 'garage' && <ServiceTable car={car} no={no()} />}
      <Wall car={car} rm={rm} no={no()} />
      <KeyNumbers car={car} no={no()} />
      <Gags count={sheets.length} />
    </div>
  );
};
