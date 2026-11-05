import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getTask, type RoadmapEdge, type RoadmapTask, type TaskId } from './roadmapData';
import {
  criticalPath,
  epicTitle,
  focusTree,
  isDone,
  kindOf,
  searchTasks,
  statusLabel,
  type TreeSide,
} from './roadmapPlan';

interface Props {
  focusId: TaskId;
  onFocus: (id: TaskId) => void;
  onInfo: (id: TaskId) => void;
  activeId: TaskId | null;
  isMobile: boolean;
}

const LONG_PRESS_MS = 500;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/* ── Picker ───────────────────────────────────────── */

const TaskPicker: React.FC<{ focus: RoadmapTask; onPick: (id: TaskId) => void }> = ({ focus, onPick }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const results = useMemo(() => (query.trim() ? searchTasks(query).slice(0, 40) : []), [query]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [open]);

  const pick = (id: TaskId) => {
    onPick(id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="rv-picker" ref={wrapRef}>
      <label className="rv-picker-label" htmlFor="rv-picker-input">Focus</label>
      <input
        id="rv-picker-input"
        className="rv-picker-input"
        type="search"
        placeholder={focus.title}
        value={query}
        autoComplete="off"
        aria-controls="rv-picker-list"
        aria-expanded={open && results.length > 0}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) pick(results[0].id);
          if (e.key === 'Escape') { setOpen(false); setQuery(''); }
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            wrapRef.current?.querySelector<HTMLButtonElement>('.rv-picker-opt')?.focus();
          }
        }}
      />
      {open && query.trim() && (
        <ul className="rv-picker-list" id="rv-picker-list">
          {results.length === 0 && <li className="rv-dim rv-picker-none">No tasks match.</li>}
          {results.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                className="rv-picker-opt"
                onClick={() => pick(t.id)}
                onKeyDown={(e) => {
                  const li = e.currentTarget.parentElement;
                  if (e.key === 'ArrowDown') { e.preventDefault(); li?.nextElementSibling?.querySelector('button')?.focus(); }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const prev = li?.previousElementSibling?.querySelector('button');
                    if (prev) prev.focus();
                    else document.getElementById('rv-picker-input')?.focus();
                  }
                  if (e.key === 'Escape') { setOpen(false); document.getElementById('rv-picker-input')?.focus(); }
                }}
              >
                <span className={`sb-status-dot sb-dot--${t.status}`} aria-hidden="true" />
                <span className="rv-picker-title">{t.title}</span>
                <span className="rv-picker-id">{t.id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ── Node ─────────────────────────────────────────── */

const TreeNode: React.FC<{
  task: RoadmapTask;
  isFocus: boolean;
  onCrit: boolean;
  truncated: boolean;
  active: boolean;
  onFocus: (id: TaskId) => void;
  onInfo: (id: TaskId) => void;
  nodeRef: (id: TaskId, el: HTMLDivElement | null) => void;
}> = ({ task, isFocus, onCrit, truncated, active, onFocus, onInfo, nodeRef }) => {
  const timer = useRef<number | null>(null);
  const longPressed = useRef(false);
  const clear = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);
  const kind = kindOf(task);
  const done = isDone(task);

  return (
    <div
      ref={(el) => nodeRef(task.id, el)}
      className={[
        'rv-node',
        `rv-node--${task.status}`,
        isFocus ? 'rv-node--focus' : '',
        done ? 'rv-node--done' : '',
        active ? 'rv-node--active' : '',
      ].join(' ').trim()}
    >
      <button
        type="button"
        className="rv-node-main"
        title={isFocus ? task.title : `Focus on ${task.title} (long-press or right-click for details)`}
        onClick={() => {
          if (longPressed.current) { longPressed.current = false; return; }
          if (isFocus) onInfo(task.id);
          else onFocus(task.id);
        }}
        onPointerDown={(e) => {
          if (e.pointerType === 'mouse') return;
          longPressed.current = false;
          clear();
          timer.current = window.setTimeout(() => {
            longPressed.current = true;
            onInfo(task.id);
          }, LONG_PRESS_MS);
        }}
        onPointerUp={clear}
        onPointerLeave={clear}
        onPointerCancel={clear}
        onContextMenu={(e) => { e.preventDefault(); clear(); onInfo(task.id); }}
      >
        <span className="rv-node-title">
          {kind !== 'task' && (
            <span className={`rm-card-kind rm-card-kind--${kind}`} aria-hidden="true">{kind === 'purchase' ? '$' : '?'}</span>
          )}
          {done && <span className="rv-node-check" aria-hidden="true">✓</span>}
          {task.title}
        </span>
        <span className="rv-node-meta">
          <span className={`sb-status-dot sb-dot--${task.status}`} aria-hidden="true" />
          {statusLabel[task.status]}
          <span className="rv-dim"> · {epicTitle.get(task.epic) ?? task.epic}</span>
        </span>
        {(onCrit || truncated || task.deferrable) && (
          <span className="rv-node-tags">
            {onCrit && <span className="rv-crit-badge">critical</span>}
            {task.deferrable && <span className="rm-card-defer">⏱ deferrable</span>}
            {truncated && <span className="rv-node-more" title="More beyond the depth limit">… more</span>}
          </span>
        )}
      </button>
      <button
        type="button"
        className="rv-node-info"
        onClick={() => onInfo(task.id)}
        aria-label={`Details: ${task.title}`}
        title="Details"
      >
        ⓘ
      </button>
    </div>
  );
};

/* ── View ─────────────────────────────────────────── */

interface Geom { id: string; d: string; kind: 'hard' | 'soft'; touchesFocus: boolean }

export const TreeView: React.FC<Props> = ({ focusId, onFocus, onInfo, activeId, isMobile }) => {
  const [hideDone, setHideDone] = useState(true);
  const [hardOnly, setHardOnly] = useState(true);
  const [depth, setDepth] = useState(3);
  const focus = getTask(focusId);
  const tree = useMemo(
    () => focusTree(focusId, { depth, hardOnly, hideDone }),
    [focusId, depth, hardOnly, hideDone],
  );
  const critIds = useMemo(() => new Set(criticalPath().map((t) => t.id)), []);

  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<TaskId, HTMLDivElement>());
  const nodeRef = useCallback((id: TaskId, el: HTMLDivElement | null) => {
    if (el) nodes.current.set(id, el);
    else nodes.current.delete(id);
  }, []);
  const [geoms, setGeoms] = useState<Geom[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  const edges = useMemo<RoadmapEdge[]>(
    () => (tree ? [...tree.upstream.edges, ...tree.downstream.edges] : []),
    [tree],
  );

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cr = canvas.getBoundingClientRect();
    setSize({ w: canvas.scrollWidth, h: canvas.scrollHeight });
    const out: Geom[] = [];
    for (const e of edges) {
      const a = nodes.current.get(e.from);
      const b = nodes.current.get(e.to);
      if (!a || !b) continue;
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const sx = ar.right - cr.left;
      const sy = ar.top + ar.height / 2 - cr.top;
      const tx = br.left - cr.left;
      const ty = br.top + br.height / 2 - cr.top;
      const k = Math.max((tx - sx) * 0.5, 16);
      out.push({
        id: `${e.from}>${e.to}`,
        d: `M ${sx} ${sy} C ${sx + k} ${sy}, ${tx - k} ${ty}, ${tx - 2} ${ty}`,
        kind: e.kind,
        touchesFocus: e.from === focusId || e.to === focusId,
      });
    }
    setGeoms(out);
  }, [edges, focusId]);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => measure());
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Keep the focused node in view inside the tree box (never the page).
  useLayoutEffect(() => {
    const box = boxRef.current;
    const node = nodes.current.get(focusId);
    if (!box || !node) return;
    const br = box.getBoundingClientRect();
    const nr = node.getBoundingClientRect();
    const left = box.scrollLeft + nr.left - br.left - br.width / 2 + nr.width / 2;
    const top = box.scrollTop + nr.top - br.top - br.height / 2 + nr.height / 2;
    box.scrollTo({ left: Math.max(0, left), top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [focusId, tree]);

  if (!focus || !tree) return null;

  const col = (side: TreeSide, i: number, dir: 'up' | 'down') => (
    <div key={`${dir}-${i}`} className="rv-col">
      <div className="rv-col-head">{dir === 'up' ? `needs · ${i + 1}` : `unlocks · ${i + 1}`}</div>
      <div className="rv-col-nodes">
        {side.columns[i].map((id) => (
          <TreeNode
            key={id}
            task={getTask(id)!}
            isFocus={false}
            onCrit={critIds.has(id)}
            truncated={side.truncated.has(id)}
            active={activeId === id}
            onFocus={onFocus}
            onInfo={onInfo}
            nodeRef={nodeRef}
          />
        ))}
      </div>
    </div>
  );

  const up = tree.upstream;
  const down = tree.downstream;
  const upCount = up.col.size;
  const downCount = down.col.size;

  return (
    <div className="rv-tree">
      <div className="rv-tree-controls">
        <TaskPicker focus={focus} onPick={onFocus} />
        <div className="rv-toggles" role="group" aria-label="Tree options">
          <button type="button" className={`rm-filter rv-toggle${hideDone ? ' rm-filter--on' : ''}`} aria-pressed={hideDone} onClick={() => setHideDone((v) => !v)}>
            <span className="rv-toggle-box" aria-hidden="true">{hideDone ? '✓' : '○'}</span>
            Hide done
          </button>
          <button type="button" className={`rm-filter rv-toggle${hardOnly ? ' rm-filter--on' : ''}`} aria-pressed={hardOnly} onClick={() => setHardOnly((v) => !v)}>
            <span className="rv-toggle-box" aria-hidden="true">{hardOnly ? '✓' : '○'}</span>
            Hard only
          </button>
          <label className="rv-depth">
            Depth
            <select value={depth} onChange={(e) => setDepth(Number(e.target.value))}>
              {[1, 2, 3, 4, 5, 6, 8, 12].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        <p className="rv-tree-summary">
          <strong>{upCount}</strong> needed first · <strong>{downCount}</strong> unlocked
          {(up.hiddenDone > 0 || down.hiddenDone > 0) && (
            <span className="rv-dim"> · {up.hiddenDone + down.hiddenDone} done hidden</span>
          )}
          {up.impliedEdges + down.impliedEdges > 0 && (
            <span className="rv-dim" title="Links already implied by a longer chain are left out">
              {' '}· {up.impliedEdges + down.impliedEdges} implied links omitted
            </span>
          )}
          {!isMobile && <span className="rv-dim"> · click a task to refocus, ⓘ or right-click for details</span>}
          {isMobile && <span className="rv-dim"> · tap to refocus, long-press or ⓘ for details</span>}
        </p>
      </div>

      <div className="rv-tree-box" ref={boxRef} tabIndex={-1}>
        <div className="rv-tree-canvas" ref={canvasRef}>
          <svg className="rv-tree-edges" width={size.w} height={size.h} aria-hidden="true">
            <defs>
              <marker id="rv-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
              </marker>
            </defs>
            {geoms.map((g) => (
              <path
                key={g.id}
                d={g.d}
                className={`rv-edge rv-edge--${g.kind}${g.touchesFocus ? ' rv-edge--near' : ''}`}
                markerEnd="url(#rv-arrow)"
              />
            ))}
          </svg>

          {up.columns.length === 0 ? (
            <div className="rv-col rv-col--empty">
              <div className="rv-col-head">needs first</div>
              <p className="rv-dim">{up.hiddenDone > 0 ? `All ${up.hiddenDone} dependencies done` : 'No dependencies'}</p>
            </div>
          ) : (
            up.columns.map((_, i) => col(up, up.columns.length - 1 - i, 'up'))
          )}

          <div className="rv-col rv-col--focus">
            <div className="rv-col-head">focus</div>
            <div className="rv-col-nodes">
              <TreeNode
                task={focus}
                isFocus
                onCrit={critIds.has(focus.id)}
                truncated={false}
                active={activeId === focus.id}
                onFocus={onFocus}
                onInfo={onInfo}
                nodeRef={nodeRef}
              />
            </div>
          </div>

          {down.columns.length === 0 ? (
            <div className="rv-col rv-col--empty">
              <div className="rv-col-head">unlocks</div>
              <p className="rv-dim">Nothing downstream{hardOnly ? ' (hard)' : ''}</p>
            </div>
          ) : (
            down.columns.map((_, i) => col(down, i, 'down'))
          )}
        </div>
      </div>
    </div>
  );
};
