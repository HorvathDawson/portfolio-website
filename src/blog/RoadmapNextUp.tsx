import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { postPath, roadmapCar } from './cars';
import { postsFor } from './postIndex';
import { bottleneckCount, type RoadmapTask, type TaskId, type TaskKind } from './roadmapData';
import {
  criticalPath,
  epicTitle,
  kindOf,
  nearReadyTasks,
  progress,
  readyTasks,
  statusLabel,
  unlockedBy,
} from './roadmapPlan';

const postBySlug = new Map(postsFor(roadmapCar.id).map((p) => [p.slug, p]));

const GROUPS: { kind: TaskKind; label: string; hint: string }[] = [
  { kind: 'decision', label: 'Decide', hint: 'Choices that unblock design work' },
  { kind: 'purchase', label: 'Buy', hint: 'Parts to order' },
  { kind: 'task', label: 'Do', hint: 'Hands-on and design work' },
];

const GROUP_LIMIT = 8;
const NEAR_LIMIT = 12;

interface Props {
  onOpen: (id: TaskId) => void;
  onShowTree: (id: TaskId) => void;
  activeId: TaskId | null;
}

/* ── Progress ─────────────────────────────────────── */

const Bar: React.FC<{ done: number; total: number; label: string }> = ({ done, total, label }) => (
  <div className="rv-bar-row">
    <span className="rv-bar-label">{label}</span>
    <span
      className="rv-bar"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
    >
      <span className="rv-bar-fill" style={{ width: total ? `${(100 * done) / total}%` : 0 }} />
    </span>
    <span className="rv-bar-num">{done}/{total}</span>
  </div>
);

const ProgressSummary: React.FC = () => {
  const p = useMemo(() => progress(), []);
  const pct = p.overall.total ? Math.round((100 * p.overall.done) / p.overall.total) : 0;
  return (
    <section className="rv-progress" aria-labelledby="rv-progress-h">
      <div className="rv-progress-head">
        <h2 id="rv-progress-h" className="rv-h2">Progress</h2>
        <span className="rv-progress-big">{p.overall.done}<span>/{p.overall.total} done · {pct}%</span></span>
        <span className="rv-progress-kinds">
          <span>{p.byKind.decision.done}/{p.byKind.decision.total} decisions</span>
          <span>{p.byKind.purchase.done}/{p.byKind.purchase.total} purchases</span>
          <span>{p.byKind.task.done}/{p.byKind.task.total} tasks</span>
        </span>
      </div>
      <div className="rv-bars">
        {p.byEpic.map((e) => <Bar key={e.id} label={e.title} done={e.done} total={e.total} />)}
      </div>
    </section>
  );
};

/* ── Cards ────────────────────────────────────────── */

const KindIcon: React.FC<{ kind: TaskKind }> = ({ kind }) =>
  kind === 'task' ? null : (
    <span className={`rm-card-kind rm-card-kind--${kind}`} aria-hidden="true">
      {kind === 'purchase' ? '$' : '?'}
    </span>
  );

const ReadyCard: React.FC<{
  task: RoadmapTask;
  onCrit: boolean;
  active: boolean;
  onOpen: (id: TaskId) => void;
  onShowTree: (id: TaskId) => void;
}> = ({ task, onCrit, active, onOpen, onShowTree }) => {
  const blocks = bottleneckCount.get(task.id) ?? 0;
  const next = unlockedBy(task.id);
  const posts = (task.posts ?? []).map((s) => postBySlug.get(s)).filter((p): p is NonNullable<typeof p> => !!p);
  return (
    <li className={`rv-card rv-card--${task.status}${onCrit ? ' rv-card--crit' : ''}${active ? ' rv-card--active' : ''}`}>
      <button type="button" className="rv-card-main" onClick={() => onOpen(task.id)}>
        <span className="rv-card-title">
          <KindIcon kind={kindOf(task)} />
          {task.title}
        </span>
        <span className="rv-card-meta">
          <span className={`sb-status-dot sb-dot--${task.status}`} aria-hidden="true" />
          <span>{statusLabel[task.status]}</span>
          <span className="rv-dim">· {epicTitle.get(task.epic) ?? task.epic}</span>
        </span>
      </button>
      <div className="rv-card-body">
        <p className="rv-card-unlocks">
          {blocks > 0 ? (
            <>
              <strong>Unblocks {blocks}</strong>
              {next.length > 0 && (
                <> · then ready: {next.slice(0, 3).map((t) => t.title).join(', ')}
                  {next.length > 3 && ` +${next.length - 3}`}</>
              )}
            </>
          ) : (
            <span className="rv-dim">Nothing waits on this</span>
          )}
        </p>
        <div className="rv-card-foot">
          {onCrit && <span className="rv-crit-badge" title="On the longest remaining chain">critical path</span>}
          {task.deferrable && <span className="rm-card-defer" title={task.deferrable}>⏱ deferrable</span>}
          {posts.map((p) => (
            <Link key={p.slug} to={postPath(roadmapCar.id, p.slug)} className="rv-post-link" title={p.title}>
              ✎ {p.title}
            </Link>
          ))}
          <button type="button" className="rv-tree-btn" onClick={() => onShowTree(task.id)}>
            Show tree →
          </button>
        </div>
      </div>
    </li>
  );
};

/* ── View ─────────────────────────────────────────── */

export const NextUpView: React.FC<Props> = ({ onOpen, onShowTree, activeId }) => {
  const ready = useMemo(() => readyTasks(), []);
  const near = useMemo(() => nearReadyTasks(), []);
  const crit = useMemo(() => criticalPath(), []);
  const critIds = useMemo(() => new Set(crit.map((t) => t.id)), [crit]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  return (
    <div className="rv-scroll">
      <div className="rv-next">
        <ProgressSummary />

        <section aria-labelledby="rv-ready-h">
          <h2 id="rv-ready-h" className="rv-h2">
            Ready now <span className="rv-count">{ready.length}</span>
          </h2>
          <p className="rv-sub">Every hard dependency is done. Ranked by how much downstream work each one gates, in-progress first.</p>
          <div className="rv-groups">
            {GROUPS.map((g) => {
              const list = ready.filter((t) => kindOf(t) === g.kind);
              const open = expanded.has(g.kind);
              const shown = open ? list : list.slice(0, GROUP_LIMIT);
              return (
                <div key={g.kind} className="rv-group">
                  <h3 className="rv-h3">
                    {g.label} <span className="rv-count">{list.length}</span>
                    <span className="rv-h3-hint">{g.hint}</span>
                  </h3>
                  {list.length === 0 ? (
                    <p className="rv-dim rv-empty">Nothing ready.</p>
                  ) : (
                    <ul className="rv-cards">
                      {shown.map((t) => (
                        <ReadyCard
                          key={t.id}
                          task={t}
                          onCrit={critIds.has(t.id)}
                          active={activeId === t.id}
                          onOpen={onOpen}
                          onShowTree={onShowTree}
                        />
                      ))}
                    </ul>
                  )}
                  {list.length > GROUP_LIMIT && (
                    <button type="button" className="rv-more" onClick={() => toggle(g.kind)} aria-expanded={open}>
                      {open ? 'Show fewer' : `Show all ${list.length}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {crit.length > 0 && (
          <section aria-labelledby="rv-crit-h">
            <h2 id="rv-crit-h" className="rv-h2">Critical path</h2>
            <p className="rv-sub">
              <strong>{crit.length} tasks</strong> on the longest remaining chain of hard dependencies to
              {' '}{crit[crit.length - 1].title}. Nothing at the end can finish faster than this.
            </p>
            <ol className="rv-chain">
              {crit.map((t, i) => (
                <li key={t.id} className="rv-chain-item">
                  <button
                    type="button"
                    className={`rv-chain-btn rv-chain-btn--${t.status}${activeId === t.id ? ' rv-chain-btn--active' : ''}`}
                    onClick={() => onOpen(t.id)}
                    title={`${i + 1}. ${t.title} (${statusLabel[t.status]})`}
                  >
                    <span className="rv-chain-n">{i + 1}</span>
                    {t.title}
                  </button>
                  {i < crit.length - 1 && <span className="rv-chain-arrow" aria-hidden="true">→</span>}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section aria-labelledby="rv-near-h">
          <h2 id="rv-near-h" className="rv-h2">
            Almost ready <span className="rv-count">{near.length}</span>
          </h2>
          <p className="rv-sub">Waiting on exactly one unfinished hard dependency.</p>
          <ul className="rv-near">
            {(expanded.has('near') ? near : near.slice(0, NEAR_LIMIT)).map(({ task, blocker }) => (
              <li key={task.id} className={`rv-near-row${critIds.has(task.id) ? ' rv-near-row--crit' : ''}`}>
                <button type="button" className="rv-near-task" onClick={() => onOpen(task.id)}>
                  <span className={`sb-status-dot sb-dot--${task.status}`} aria-hidden="true" />
                  <KindIcon kind={kindOf(task)} />
                  {task.title}
                </button>
                <span className="rv-near-wait">
                  <span className="rv-dim">waits on</span>
                  <button type="button" className="rv-near-blocker" onClick={() => onOpen(blocker.id)}>
                    <span className={`sb-status-dot sb-dot--${blocker.status}`} aria-hidden="true" />
                    {blocker.title}
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {near.length > NEAR_LIMIT && (
            <button type="button" className="rv-more" onClick={() => toggle('near')} aria-expanded={expanded.has('near')}>
              {expanded.has('near') ? 'Show fewer' : `Show all ${near.length}`}
            </button>
          )}
        </section>
      </div>
    </div>
  );
};
