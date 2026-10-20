import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { allPosts, type Status } from './blogData';
import {
  roadmap,
  incomingEdges,
  outgoingEdges,
  getTask,
  bottleneckScores,
  bottleneckCount,
  bottleneckTier,
  purchaseRank,
  topBlockerRank,
  type RoadmapTask,
  type TaskId,
} from './roadmapData';
import { computeLayout } from './roadmapLayout';
import { useBreakpoint } from '../utils/useBreakpoint';
import './blogStyles.css';

const statusLabel: Record<Status, string> = {
  planning: 'Planning',
  'in-progress': 'In Progress',
  complete: 'Complete',
  decided: 'Decided',
};

const ALL_STATUSES: Status[] = ['planning', 'in-progress', 'decided', 'complete'];

const postBySlug = new Map(allPosts.map((p) => [p.slug, p]));

/* ── Card ─────────────────────────────────────────── */

interface CardProps {
  task: RoadmapTask;
  isActive: boolean;
  isDimmed: boolean;
  isHidden: boolean;
  isFocused: boolean;
  isUpstream: boolean;
  isDownstream: boolean;
  isFaded: boolean;
  hasSoftIncoming: boolean;
  onClick: (id: TaskId) => void;
  onHoverEnter: (id: TaskId) => void;
  onHoverLeave: () => void;
  cardRef: (id: TaskId, el: HTMLButtonElement | null) => void;
}

const TaskCard: React.FC<CardProps> = React.memo(({
  task, isActive, isDimmed, isHidden, isFocused, isUpstream, isDownstream, isFaded,
  hasSoftIncoming, onClick, onHoverEnter, onHoverLeave, cardRef,
}) => {
  const postCount = task.posts?.length ?? 0;
  const kind = effectiveKind(task);
  const isComplete = task.status === 'complete';
  const isDecided = task.status === 'decided';
  const showDecisionOutcome = !!task.decision && (isDecided || isComplete);
  const blocks = bottleneckCount.get(task.id) ?? 0;
  const tier = kind === 'purchase' ? bottleneckTier(task.id) : 0;
  const buyRank = kind === 'purchase' ? purchaseRank(task.id) : 0;
  const blockerRank = topBlockerRank(task.id);

  /* Touch interaction model:
     - Tap (short press)  → opens / isolates (the existing onClick path).
     - Press-and-hold     → highlights the cone (sets hoverId) WITHOUT
                            isolating. Releasing clears the highlight.
     Mouse / pen still get the regular hover via onMouseEnter/Leave. */
  const longPressTimer = React.useRef<number | null>(null);
  const suppressClick = React.useRef(false);
  const startPos = React.useRef<{ x: number; y: number } | null>(null);
  const LONG_PRESS_MS = 350;
  const MOVE_CANCEL_PX = 8;

  const cancelLongPress = React.useCallback(() => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <button
      type="button"
      ref={(el) => cardRef(task.id, el)}
      onClick={() => {
        if (suppressClick.current) { suppressClick.current = false; return; }
        onClick(task.id);
      }}
      onMouseEnter={() => onHoverEnter(task.id)}
      onMouseLeave={onHoverLeave}
      onFocus={() => onHoverEnter(task.id)}
      onBlur={onHoverLeave}
      onPointerDown={(e) => {
        if (e.pointerType !== 'touch') return;
        startPos.current = { x: e.clientX, y: e.clientY };
        cancelLongPress();
        longPressTimer.current = window.setTimeout(() => {
          longPressTimer.current = null;
          suppressClick.current = true;
          onHoverEnter(task.id);
        }, LONG_PRESS_MS);
      }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'touch' || !startPos.current) return;
        const dx = e.clientX - startPos.current.x;
        const dy = e.clientY - startPos.current.y;
        if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) cancelLongPress();
      }}
      onPointerUp={(e) => {
        if (e.pointerType !== 'touch') return;
        cancelLongPress();
        startPos.current = null;
        if (suppressClick.current) onHoverLeave();
      }}
      onPointerCancel={(e) => {
        if (e.pointerType !== 'touch') return;
        cancelLongPress();
        startPos.current = null;
        if (suppressClick.current) { suppressClick.current = false; onHoverLeave(); }
      }}
      className={[
        'rm-card',
        `rm-card--${task.status}`,
        `rm-card--kind-${kind}`,
        tier > 0 ? `rm-card--bottleneck-${tier}` : '',
        blockerRank > 0 ? 'rm-card--top-blocker' : '',
        isActive ? 'rm-card--active' : '',
        isFocused ? 'rm-card--focused' : '',
        isUpstream ? 'rm-card--upstream' : '',
        isDownstream ? 'rm-card--downstream' : '',
        isFaded ? 'rm-card--faded' : '',
        isDimmed ? 'rm-card--dimmed' : '',
        isHidden ? 'rm-card--hidden' : '',
      ].join(' ').trim()}
      aria-pressed={isActive}
      aria-hidden={isHidden}
      tabIndex={isHidden ? -1 : 0}
      data-blocker-rank={blockerRank > 0 ? blockerRank : undefined}
    >
      {blockerRank > 0 && (
        <span
          className="rm-card-blocker-rank"
          aria-label={`Top blocker rank ${blockerRank}`}
          title={`Top blocker #${blockerRank} — actionable now and gates the most downstream work`}
        >
          #{blockerRank}
        </span>
      )}
      <div className="rm-card-row">
        <span className={`sb-status-dot sb-dot--${task.status}`} aria-hidden="true" />
        {kind === 'purchase' && <span className="rm-card-kind rm-card-kind--purchase" aria-label="Purchase">$</span>}
        {kind === 'decision' && <span className="rm-card-kind rm-card-kind--decision" aria-label="Decision">?</span>}
        {(isComplete || isDecided) && <span className="rm-card-check" aria-label={isDecided ? 'Decided' : 'Complete'}>✓</span>}
        <span className="rm-card-title">{task.title}</span>
      </div>
      {showDecisionOutcome && (
        <div className="rm-card-decision" title="Chosen outcome">
          → {task.decision}
        </div>
      )}
      <div className="rm-card-meta">
        <span className={`sb-epic-badge sb-badge--${task.status}`}>
          {statusLabel[task.status]}
        </span>
        {task.deferrable && (
          <span className="rm-card-defer" title={`Can be figured out during build: ${task.deferrable}`}>
            ⏱ later
          </span>
        )}
        {postCount > 0 && (
          <span className="rm-card-posts" title={`${postCount} linked post${postCount === 1 ? '' : 's'}`}>
            &#9998; {postCount}
          </span>
        )}
        {hasSoftIncoming && (
          <span className="rm-card-soft" title="Has soft dependencies">~</span>
        )}
        {kind === 'purchase' && buyRank > 0 && (
          <span
            className={`rm-card-blocks rm-card-blocks--t${tier}`}
            title={`Buy priority #${buyRank} — hard-blocks ${blocks} downstream task${blocks === 1 ? '' : 's'}. Urgency score ${bottleneckScores.get(task.id) ?? 0}. Lower number = buy sooner. Ties share a rank.`}
          >
            buy #{buyRank}
          </span>
        )}
      </div>
    </button>
  );
});
TaskCard.displayName = 'TaskCard';

/** Derive task kind: explicit `kind` wins, else `t-decide-*` ids are decisions, else `task`. */
function effectiveKind(task: RoadmapTask): 'task' | 'purchase' | 'decision' {
  if (task.kind) return task.kind;
  if (task.id.startsWith('t-decide-')) return 'decision';
  return 'task';
}

/* ── Edge overlay ─────────────────────────────────── */

interface EdgeGeom {
  id: string;
  from: TaskId;
  to: TaskId;
  kind: 'hard' | 'soft';
  label?: string;
  d: string;
  dimmed: boolean;
  hue: number;
}

interface EdgeOverlayProps {
  width: number;
  height: number;
  edges: EdgeGeom[];
  focusedId: TaskId | null;
  upstream: Set<TaskId>;
  downstream: Set<TaskId>;
}

function isEdgeHighlighted(
  e: EdgeGeom,
  focusedId: TaskId | null,
  upstream: Set<TaskId>,
  downstream: Set<TaskId>,
): boolean {
  if (!focusedId) return false;
  if (e.from === focusedId || e.to === focusedId) return true;
  // Edges fully within the upstream cone or downstream cone of the focused node.
  if (upstream.has(e.from) && (upstream.has(e.to) || e.to === focusedId)) return true;
  if (downstream.has(e.to) && (downstream.has(e.from) || e.from === focusedId)) return true;
  return false;
}

const EdgeOverlay: React.FC<EdgeOverlayProps> = ({
  width, height, edges, focusedId, upstream, downstream,
}) => {
  const hasFocus = focusedId !== null;
  return (
    <svg
      className={`rm-edges${hasFocus ? ' rm-edges--focused' : ''}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <defs>
        <marker
          id="rm-arrow-hard"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
        <marker
          id="rm-arrow-soft"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
      </defs>
      {/* Stable edge order — no per-hover sort, no group split. Splitting
          into bg/fg groups causes React to unmount/remount paths when their
          highlight state flips (because the conditional `null` returns put
          them in different parents), which breaks transition continuity and
          produces the visible style jumps the user sees on first hover.
          Single map + class toggle is the only way to keep DOM nodes stable
          so CSS transitions actually animate. Highlighted edges still appear
          on top because they have opacity:1 while others fade to 0.06. */}
      {edges.map((e) => {
        const highlighted = isEdgeHighlighted(e, focusedId, upstream, downstream);
        const stroke = highlighted
          ? `hsl(${e.hue}, 70%, 70%)`
          : `hsl(${e.hue}, 35%, 78%)`;
        return (
          <path
            key={e.id}
            d={e.d}
            className={[
              'rm-edge',
              `rm-edge--${e.kind}`,
              e.dimmed ? 'rm-edge--dimmed' : '',
              hasFocus && !highlighted ? 'rm-edge--background' : '',
              highlighted ? 'rm-edge--highlighted' : '',
            ].join(' ').trim()}
            style={{ stroke, color: stroke }}
            markerEnd={`url(#rm-arrow-${e.kind})`}
          >
            {e.label && <title>{e.label}</title>}
          </path>
        );
      })}
    </svg>
  );
};

/* ── Detail drawer ────────────────────────────────── */

const TaskDrawer: React.FC<{
  task: RoadmapTask;
  onClose: () => void;
  onSelectTask: (id: TaskId) => void;
  isMobile: boolean;
  isolated: boolean;
  onToggleIsolate: () => void;
}> = ({ task, onClose, onSelectTask, isMobile, isolated, onToggleIsolate }) => {
  const incoming = incomingEdges(task.id);
  const outgoing = outgoingEdges(task.id);
  const linkedPosts = (task.posts ?? [])
    .map((slug) => postBySlug.get(slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const kind = effectiveKind(task);

  return (
    <div className={`rm-drawer${isMobile ? ' rm-drawer--mobile' : ''}`} role="dialog" aria-label={`Task: ${task.title}`}>
      <div className="rm-drawer-header">
        <span className={`sb-status-dot sb-dot--${task.status}`} aria-hidden="true" />
        <h2 className="rm-drawer-title">{task.title}</h2>
        <button type="button" className="rm-drawer-close" onClick={onClose} aria-label="Close">✕</button>
      </div>

      <div className="rm-drawer-meta">
        <span className={`sb-epic-badge sb-badge--${task.status}`}>{statusLabel[task.status]}</span>
        {kind === 'purchase' && <span className="rm-drawer-kind rm-drawer-kind--purchase">Purchase</span>}
        {kind === 'decision' && <span className="rm-drawer-kind rm-drawer-kind--decision">Decision</span>}
        {task.deferrable && (
          <span className="rm-card-defer" title={task.deferrable}>⏱ deferrable</span>
        )}
        {(() => {
          const blocks = bottleneckCount.get(task.id) ?? 0;
          const score = bottleneckScores.get(task.id) ?? 0;
          const tier = kind === 'purchase' ? bottleneckTier(task.id) : 0;
          const buyRank = kind === 'purchase' ? purchaseRank(task.id) : 0;
          if (kind !== 'purchase' || buyRank <= 0) return null;
          return (
            <span
              className={`rm-drawer-blocks rm-drawer-blocks--t${tier}`}
              title={`Lower number = buy sooner. Ties share a rank. Hard-blocks ${blocks} downstream task${blocks === 1 ? '' : 's'}. Urgency score ${score}.`}
            >
              buy #{buyRank} · blocks {blocks} · urgency {score}
            </span>
          );
        })()}
        <span className="rm-drawer-epic">{task.epic}</span>
      </div>

      {task.decision && (task.status === 'decided' || task.status === 'complete') && (
        <div className="rm-drawer-decision">
          <span className="rm-drawer-decision-label">Decision</span>
          <span className="rm-drawer-decision-value">{task.decision}</span>
        </div>
      )}

      {task.deferrable && (
        <p className="rm-drawer-defer-note" title="Can be figured out during build">
          <strong>Deferrable.</strong> {task.deferrable}
        </p>
      )}

      {task.summary && <p className="rm-drawer-summary">{task.summary}</p>}

      {!isolated && (
        <button
          type="button"
          className="rm-isolate-btn"
          onClick={onToggleIsolate}
          title="Show only this task and everything connected to it"
        >
          ⌖ Isolate this path
        </button>
      )}

      {task.notes && task.notes.length > 0 && (
        <>
          <h3 className="rm-drawer-h3">What's involved</h3>
          <ul className="rm-drawer-list">
            {task.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </>
      )}

      {linkedPosts.length > 0 && (
        <>
          <h3 className="rm-drawer-h3">Blog posts</h3>
          <ul className="rm-drawer-list">
            {linkedPosts.map((p) => (
              <li key={p.slug}>
                <Link to={`/a40/${p.slug}`} className="rm-drawer-link">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {incoming.length > 0 && (
        <>
          <h3 className="rm-drawer-h3">Blocked by</h3>
          <ul className="rm-drawer-list">
            {incoming.map((e) => {
              const t = getTask(e.from);
              if (!t) return null;
              return (
                <li key={e.from}>
                  <button
                    type="button"
                    className="rm-drawer-tasklink"
                    onClick={() => onSelectTask(e.from)}
                  >
                    <span className={`sb-status-dot sb-dot--${t.status}`} aria-hidden="true" />
                    {t.title}
                  </button>
                  <span className={`rm-edge-pill rm-edge-pill--${e.kind}`}>{e.kind}</span>
                  {e.label && <span className="rm-edge-note"> — {e.label}</span>}
                </li>
              );
            })}
          </ul>
        </>
      )}

      {outgoing.length > 0 && (
        <>
          <h3 className="rm-drawer-h3">Blocks</h3>
          <ul className="rm-drawer-list">
            {outgoing.map((e) => {
              const t = getTask(e.to);
              if (!t) return null;
              return (
                <li key={e.to}>
                  <button
                    type="button"
                    className="rm-drawer-tasklink"
                    onClick={() => onSelectTask(e.to)}
                  >
                    <span className={`sb-status-dot sb-dot--${t.status}`} aria-hidden="true" />
                    {t.title}
                  </button>
                  <span className={`rm-edge-pill rm-edge-pill--${e.kind}`}>{e.kind}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

/* ── Main page ────────────────────────────────────── */

const HEADER_W_DESKTOP = 160; // mobile omits the lane-name column entirely
const COL_W_DESKTOP = 240;
const COL_W_MOBILE = 200;
const ROW_GAP = 80;
const COL_GAP = 110;

export const A40Roadmap: React.FC = () => {
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile' || bp === 'tablet';
  const colW = isMobile ? COL_W_MOBILE : COL_W_DESKTOP;

  const layout = useMemo(() => computeLayout(roadmap), []);
  const [activeId, setActiveId] = useState<TaskId | null>(null);
  const [hoverId, setHoverIdRaw] = useState<TaskId | null>(null);
  const [isolatedId, setIsolatedId] = useState<TaskId | null>(null);
  const [expandDownstream, setExpandDownstream] = useState(false);
  const [statusFilter, setStatusFilter] = useState<Set<Status>>(new Set(ALL_STATUSES));

  /* Hover debouncer: BOTH enter and leave are delayed so quick mouse
     movement across cards / gaps doesn't paint a flickery highlight trail.
     The applied `hoverId` only commits ~120 ms after the cursor settles on
     a particular card (or leaves entirely). The pending intent is tracked
     separately so back-to-back enters cancel cleanly without commits. */
  const hoverTimer = useRef<number | null>(null);
  const pendingHover = useRef<TaskId | null>(null);
  const HOVER_DELAY = 120;
  const setHoverId = useCallback((id: TaskId | null) => {
    // Already targeting this id — nothing to do.
    if (pendingHover.current === id) return;
    pendingHover.current = id;
    if (hoverTimer.current !== null) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
    hoverTimer.current = window.setTimeout(() => {
      hoverTimer.current = null;
      setHoverIdRaw(pendingHover.current);
    }, HOVER_DELAY);
  }, []);

  // Deep-linking: read ?task=<id> or #<id> on mount → isolate that task.
  useEffect(() => {
    const url = new URL(window.location.href);
    const fromQuery = url.searchParams.get('task');
    const fromHash = window.location.hash.startsWith('#t-')
      ? window.location.hash.slice(1)
      : null;
    const id = (fromQuery || fromHash) as TaskId | null;
    if (id && getTask(id)) {
      setActiveId(id);
      setIsolatedId(id);
    }
    // Only run once on mount.
  }, []);

  // Sync URL hash with the active task so links can be shared / refreshed.
  useEffect(() => {
    if (activeId) {
      if (window.location.hash !== `#${activeId}`) {
        window.history.replaceState(null, '', `#${activeId}`);
      }
    } else if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [activeId]);

  // Focus = isolate target (sticky) > hover > active drawer.
  const focusedId = isolatedId ?? hoverId ?? activeId;

  // Pre-compute adjacency once for upstream/downstream BFS.
  const adjacency = useMemo(() => {
    const fwd = new Map<TaskId, TaskId[]>();
    const back = new Map<TaskId, TaskId[]>();
    for (const t of roadmap.tasks) {
      fwd.set(t.id, []);
      back.set(t.id, []);
    }
    for (const e of roadmap.edges) {
      fwd.get(e.from)?.push(e.to);
      back.get(e.to)?.push(e.from);
    }
    return { fwd, back };
  }, []);

  const { upstream, downstream } = useMemo(() => {
    const up = new Set<TaskId>();
    const down = new Set<TaskId>();
    if (!focusedId) return { upstream: up, downstream: down };
    // BFS upstream
    const qu: TaskId[] = [focusedId];
    while (qu.length) {
      const u = qu.shift()!;
      for (const v of adjacency.back.get(u) ?? []) {
        if (!up.has(v)) { up.add(v); qu.push(v); }
      }
    }
    // BFS downstream
    const qd: TaskId[] = [focusedId];
    while (qd.length) {
      const u = qd.shift()!;
      for (const v of adjacency.fwd.get(u) ?? []) {
        if (!down.has(v)) { down.add(v); qd.push(v); }
      }
    }
    return { upstream: up, downstream: down };
  }, [focusedId, adjacency]);

  const isolatedSet = useMemo(() => {
    if (!isolatedId) return null;
    const s = new Set<TaskId>([isolatedId]);
    upstream.forEach((id) => s.add(id));
    if (expandDownstream) downstream.forEach((id) => s.add(id));
    return s;
  }, [isolatedId, upstream, downstream, expandDownstream]);

  // Reset downstream-expanded whenever the isolated target changes.
  useEffect(() => { setExpandDownstream(false); }, [isolatedId]);

  /* ── Zoom ─────────────────────────────────────────
     CSS transform: scale on .rm-inner, top-left origin so layout coords
     stay simple. recompute() divides measured rects by zoom to keep the
     SVG overlay in pre-scale coordinates.
     ──────────────────────────────────────────────── */
  const ZOOM_MIN = 0.4;
  const ZOOM_MAX = 1.8;
  const ZOOM_STEP = 1.15;
  // Start zoomed out so the whole DAG is visible at first glance — most
  // users land here wanting an overview, not a single card. Mobile gets an
  // extra-wide initial view since the canvas is much larger than the screen.
  const [zoom, setZoom] = useState(() => (
    typeof window !== 'undefined' && window.innerWidth < 900 ? 0.5 : 0.7
  ));
  const zoomRef = useRef(1);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  /** Apply a new zoom level while keeping the given viewport-relative point
   *  (cx, cy in px from the scroll element's top-left) anchored under the
   *  cursor / pinch midpoint. */
  const setZoomAt = useCallback((next: number, cx: number, cy: number) => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const z = zoomRef.current;
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    if (Math.abs(clamped - z) < 1e-4) return;
    const lx = (scroll.scrollLeft + cx) / z;
    const ly = (scroll.scrollTop + cy) / z;
    setZoom(clamped);
    // Adjust scroll on the next frame so layout has settled.
    requestAnimationFrame(() => {
      scroll.scrollLeft = lx * clamped - cx;
      scroll.scrollTop = ly * clamped - cy;
    });
  }, []);

  const zoomIn = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    setZoomAt(zoomRef.current * ZOOM_STEP, scroll.clientWidth / 2, scroll.clientHeight / 2);
  }, [setZoomAt]);
  const zoomOut = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    setZoomAt(zoomRef.current / ZOOM_STEP, scroll.clientWidth / 2, scroll.clientHeight / 2);
  }, [setZoomAt]);
  const zoomReset = useCallback(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    setZoomAt(1, scroll.clientWidth / 2, scroll.clientHeight / 2);
  }, [setZoomAt]);

  // Ctrl/Cmd + wheel → zoom; pinch (touchpad) sends ctrlKey synthetically too.
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const r = scroll.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      // deltaY > 0 → zoom out
      const factor = Math.exp(-e.deltaY * 0.0015);
      setZoomAt(zoomRef.current * factor, cx, cy);
    };
    scroll.addEventListener('wheel', onWheel, { passive: false });
    return () => scroll.removeEventListener('wheel', onWheel);
  }, [setZoomAt]);

  // Pinch zoom via PointerEvents (touch). Tracks two active pointers.
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    const pts = new Map<number, { x: number; y: number }>();
    let pinchStart = 0;
    let zoomStart = 1;
    const dist = () => {
      const it = pts.values();
      const a = it.next().value;
      const b = it.next().value;
      if (!a || !b) return 0;
      const dx = a.x - b.x, dy = a.y - b.y;
      return Math.hypot(dx, dy);
    };
    const mid = () => {
      const it = pts.values();
      const a = it.next().value;
      const b = it.next().value;
      if (!a || !b) return { x: 0, y: 0 };
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    };
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2) {
        pinchStart = dist();
        zoomStart = zoomRef.current;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinchStart > 0) {
        e.preventDefault();
        const r = scroll.getBoundingClientRect();
        const m = mid();
        const next = zoomStart * (dist() / pinchStart);
        setZoomAt(next, m.x - r.left, m.y - r.top);
      }
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerType !== 'touch') return;
      pts.delete(e.pointerId);
      if (pts.size < 2) pinchStart = 0;
    };
    scroll.addEventListener('pointerdown', onDown);
    scroll.addEventListener('pointermove', onMove, { passive: false });
    scroll.addEventListener('pointerup', onUp);
    scroll.addEventListener('pointercancel', onUp);
    scroll.addEventListener('pointerleave', onUp);
    return () => {
      scroll.removeEventListener('pointerdown', onDown);
      scroll.removeEventListener('pointermove', onMove);
      scroll.removeEventListener('pointerup', onUp);
      scroll.removeEventListener('pointercancel', onUp);
      scroll.removeEventListener('pointerleave', onUp);
    };
  }, [setZoomAt]);

  const cardRefs = useRef(new Map<TaskId, HTMLButtonElement>());
  const innerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [edgeGeoms, setEdgeGeoms] = useState<EdgeGeom[]>([]);
  const [stubPos, setStubPos] = useState<{ x: number; y: number } | null>(null);

  // Stable handlers for TaskCard so React.memo can short-circuit re-renders.
  // Without these, every hover would re-render all ~100 cards because the
  // inline lambdas allocated a new function reference on each parent render.
  const handleCardClick = useCallback((id: TaskId) => {
    setActiveId(id);
    setIsolatedId(id);
  }, []);
  const handleCardEnter = useCallback((id: TaskId) => {
    setHoverId(id);
  }, [setHoverId]);
  const handleCardLeave = useCallback(() => {
    setHoverId(null);
  }, [setHoverId]);
  const handleCardRef = useCallback((id: TaskId, el: HTMLButtonElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  }, []);

  // Lock html scroll like the blog does (we manage our own).
  useEffect(() => {
    document.documentElement.style.overflowY = 'hidden';
    return () => { document.documentElement.style.overflowY = ''; };
  }, []);

  // Mirror downstream into a ref so recompute can read it without taking it
  // as a reactive dep (would otherwise tear down ResizeObserver on every hover).
  const downstreamRef = useRef(downstream);
  useEffect(() => { downstreamRef.current = downstream; }, [downstream]);

  // Recompute edges + size whenever layout, breakpoint, or filter changes.
  const recompute = useCallback(() => {
    const inner = innerRef.current;
    if (!inner) return;
    const rect = inner.getBoundingClientRect();
    // scrollWidth/Height are layout (pre-scale) dims — perfect for the SVG.
    setSize({ w: inner.scrollWidth, h: inner.scrollHeight });
    const z = zoomRef.current || 1;

    const dimmedTask = (id: TaskId) => {
      const t = getTask(id);
      return t ? !statusFilter.has(t.status) : true;
    };

    // Group outgoing/incoming edges per node so multiple edges leaving or
    // entering the same card attach at distinct Y positions along the side.
    const outBySource = new Map<TaskId, typeof roadmap.edges>();
    const inByTarget = new Map<TaskId, typeof roadmap.edges>();
    for (const e of roadmap.edges) {
      if (!outBySource.has(e.from)) outBySource.set(e.from, []);
      outBySource.get(e.from)!.push(e);
      if (!inByTarget.has(e.to)) inByTarget.set(e.to, []);
      inByTarget.get(e.to)!.push(e);
    }
    // Sort each side's edges by the *other* endpoint's Y so that adjacent
    // attach points correspond to similar target Ys → curves don't cross
    // each other near the card.
    const yOf = (id: TaskId): number => {
      const el = cardRefs.current.get(id);
      if (!el) return 0;
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    };
    for (const arr of outBySource.values()) arr.sort((a, b) => yOf(a.to) - yOf(b.to));
    for (const arr of inByTarget.values()) arr.sort((a, b) => yOf(a.from) - yOf(b.from));

    const hashStr = (s: string): number => {
      let h = 0;
      for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
      return Math.abs(h);
    };

    const geoms: EdgeGeom[] = [];
    for (const e of roadmap.edges) {
      // In isolate mode, skip edges whose endpoints aren't part of the path.
      if (isolatedSet && (!isolatedSet.has(e.from) || !isolatedSet.has(e.to))) continue;
      const a = cardRefs.current.get(e.from);
      const b = cardRefs.current.get(e.to);
      if (!a || !b) continue;
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();

      // Fan attach Y positions along the right/left edges.
      const outs = outBySource.get(e.from)!;
      const oi = outs.indexOf(e);
      const oCount = outs.length;
      const sFrac = oCount === 1 ? 0.5 : 0.2 + (0.6 * oi) / Math.max(1, oCount - 1);

      const ins = inByTarget.get(e.to)!;
      const ti = ins.indexOf(e);
      const iCount = ins.length;
      const tFrac = iCount === 1 ? 0.5 : 0.2 + (0.6 * ti) / Math.max(1, iCount - 1);

      const sx = (ar.right - rect.left) / z;
      const sy = (ar.top + ar.height * sFrac - rect.top) / z;
      const tx = (br.left - rect.left) / z;
      const ty = (br.top + br.height * tFrac - rect.top) / z;

      const dx = tx - sx;
      const goingRight = dx > 0;

      // Cubic bezier with horizontally-pulled handles → smooth left-to-right
      // flow with zero visible corners. Handle length scales with horizontal
      // distance, capped so close edges aren't overly curvy and far edges
      // don't get absurd S-shapes.
      let d: string;
      if (goingRight) {
        // Handle length scales with BOTH axes so steep edges (small dx, big
        // dy) still get smooth, gently-sweeping curves rather than a tight S.
        // Arrowheads always land horizontal because the final handle is
        // colinear with the target row.
        const dy = ty - sy;
        const k = Math.min(
          Math.max(Math.abs(dx) * 0.5, Math.abs(dy) * 0.45, 24),
          200,
        );
        d = `M ${sx} ${sy} C ${sx + k} ${sy}, ${tx - k} ${ty}, ${tx} ${ty}`;
      } else {
        // Backwards edge (target is left of source): loop out to the right of
        // source, around, and into target's left side. Two bezier segments.
        const detour = 80;
        const midX = sx + detour;
        const midY = (sy + ty) / 2 + (ty > sy ? 60 : -60);
        d = [
          `M ${sx} ${sy}`,
          `C ${sx + detour} ${sy}, ${midX} ${midY}, ${midX - 10} ${midY}`,
          `C ${tx - detour} ${midY}, ${tx - detour} ${ty}, ${tx} ${ty}`,
        ].join(' ');
      }

      geoms.push({
        id: `${e.from}->${e.to}`,
        from: e.from,
        to: e.to,
        kind: e.kind,
        label: e.label,
        d,
        dimmed: dimmedTask(e.from) || dimmedTask(e.to),
        hue: hashStr(e.from) % 360,
      });
    }

    // Synthetic stub edge for collapsed downstream cone.
    // Read downstream via ref so recompute's identity doesn't churn on hover.
    const dsSize = downstreamRef.current.size;
    if (
      isolatedId &&
      !expandDownstream &&
      dsSize > 0 &&
      cardRefs.current.get(isolatedId)
    ) {
      const a = cardRefs.current.get(isolatedId)!;
      const ar = a.getBoundingClientRect();
      const sx = (ar.right - rect.left) / z;
      const sy = (ar.top + ar.height / 2 - rect.top) / z;
      const stubX = sx + Math.max(80, COL_GAP);
      const stubY = sy;
      const tx = stubX - 18; // arrow lands at stub left edge
      const dy = stubY - sy;
      const k = Math.min(
        Math.max((tx - sx) * 0.5, Math.abs(dy) * 0.45, 24),
        200,
      );
      const d = `M ${sx} ${sy} C ${sx + k} ${sy}, ${tx - k} ${stubY}, ${tx} ${stubY}`;
      geoms.push({
        id: `${isolatedId}->__downstream-stub`,
        from: isolatedId,
        to: isolatedId, // re-use to satisfy types; highlighting uses focusedId
        kind: 'soft',
        d,
        dimmed: false,
        hue: 280,
      });
      setStubPos({ x: stubX, y: stubY });
    } else {
      setStubPos(null);
    }

    setEdgeGeoms(geoms);
    // `zoom` moves the rendered nodes, so edges must be re-measured when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, isolatedSet, isolatedId, expandDownstream, zoom]);

  useEffect(() => {
    recompute();
    const ro = new ResizeObserver(() => recompute());
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [recompute, layout, isMobile]);

  // Re-run after fonts/images settle.
  useEffect(() => {
    const t = setTimeout(recompute, 50);
    return () => clearTimeout(t);
  }, [recompute, isMobile]);

  // Scroll the active card into view whenever it changes (or after isolation
  // re-flows the layout). Run after the layout / edges have settled.
  useEffect(() => {
    if (!activeId) return;
    const t = setTimeout(() => {
      const card = cardRefs.current.get(activeId);
      const scroll = scrollRef.current;
      if (!card || !scroll) return;
      const cardRect = card.getBoundingClientRect();
      const scrollRect = scroll.getBoundingClientRect();
      // Center the card within the scroll viewport.
      const targetLeft =
        scroll.scrollLeft + (cardRect.left - scrollRect.left) -
        scrollRect.width / 2 + cardRect.width / 2;
      const targetTop =
        scroll.scrollTop + (cardRect.top - scrollRect.top) -
        scrollRect.height / 2 + cardRect.height / 2;
      scroll.scrollTo({ left: Math.max(0, targetLeft), top: Math.max(0, targetTop), behavior: 'smooth' });
    }, 80);
    return () => clearTimeout(t);
  }, [activeId, isolatedId, edgeGeoms.length]);

  // Mouse drag-to-pan on the scroll background. Ignore drags that start on a
  // card / button / link so clicks still work.
  useEffect(() => {
    const scroll = scrollRef.current;
    if (!scroll) return;
    let isDragging = false;
    let startX = 0, startY = 0, startScrollX = 0, startScrollY = 0;

    const isInteractive = (target: EventTarget | null) =>
      target instanceof Element &&
      target.closest('button, a, .rm-card, input, select, textarea');

    const onDown = (e: MouseEvent) => {
      // Left-click only; skip when starting on an interactive element.
      if (e.button !== 0 || isInteractive(e.target)) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startScrollX = scroll.scrollLeft;
      startScrollY = scroll.scrollTop;
      scroll.classList.add('rm-scroll--dragging');
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      scroll.scrollLeft = startScrollX - (e.clientX - startX);
      scroll.scrollTop = startScrollY - (e.clientY - startY);
    };
    const onUp = () => {
      if (!isDragging) return;
      isDragging = false;
      scroll.classList.remove('rm-scroll--dragging');
    };

    scroll.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      scroll.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  const toggleStatus = (s: Status) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      // Don't allow zero filters (would hide everything confusingly).
      if (next.size === 0) return new Set(ALL_STATUSES);
      return next;
    });
  };

  // Active layout: when isolating, compact-layout the filtered subgraph so
  // the visible cards form a tight linear flow instead of dispersed cells.
  const activeLayout = useMemo(() => {
    if (!isolatedSet) return layout;
    const tasks = roadmap.tasks.filter((t) => isolatedSet.has(t.id));
    const edges = roadmap.edges.filter(
      (e) => isolatedSet.has(e.from) && isolatedSet.has(e.to),
    );
    // Strip per-task `order` overrides so depth is recomputed against the
    // filtered subgraph — yields a compact left-to-right flow.
    const stripped = tasks.map(({ order: _omit, ...rest }) => rest);
    return computeLayout({ tasks: stripped, edges });
  }, [isolatedSet, layout]);

  const activeTask = activeId ? getTask(activeId) ?? null : null;

  // Group nodes by (lane, col) for stacking.
  const cellMap = useMemo(() => {
    const m = new Map<string, RoadmapTask[]>();
    for (const n of activeLayout.nodes) {
      const key = `${n.lane}:${n.col}`;
      const list = m.get(key) ?? [];
      list.push(n.task);
      m.set(key, list);
    }
    return m;
  }, [activeLayout]);

  const numLanes = activeLayout.laneOrder.length;
  const numCols = activeLayout.cols;

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile
      ? `repeat(${numCols}, ${colW}px)`
      : `${HEADER_W_DESKTOP}px repeat(${numCols}, ${colW}px)`,
    gridTemplateRows: `repeat(${numLanes}, auto)`,
    gap: `${ROW_GAP}px ${COL_GAP}px`,
    padding: '24px',
    minWidth: 'max-content',
    position: 'relative',
    transform: `scale(${zoom})`,
    transformOrigin: '0 0',
  };

  const isTaskDimmed = (t: RoadmapTask) => !statusFilter.has(t.status);

  return (
    <div
      className={[
        'blog-page',
        'rm-page',
        isMobile ? 'rm-page--mobile' : '',
        activeTask && !isMobile ? 'rm-page--drawer-open' : '',
      ].join(' ').trim()}
    >
      <header className="rm-topbar">
        <Link to="/a40" className="blog-back-link">&larr; A40 Build Log</Link>
        <h1 className="rm-topbar-title">Roadmap</h1>

        <div className="rm-legend" aria-label="Legend">
          <span className="rm-legend-item">
            <svg width="32" height="10" aria-hidden="true">
              <line x1="0" y1="5" x2="28" y2="5" className="rm-edge rm-edge--hard" />
            </svg>
            hard
          </span>
          <span className="rm-legend-item">
            <svg width="32" height="10" aria-hidden="true">
              <line x1="0" y1="5" x2="28" y2="5" className="rm-edge rm-edge--soft" />
            </svg>
            soft
          </span>
          <span className="rm-legend-item">
            <span className="rm-card-kind rm-card-kind--purchase" aria-hidden="true" style={{ width: 14, height: 14, fontSize: 9 }}>$</span>
            purchase
          </span>
          <span className="rm-legend-item">
            <span className="rm-card-kind rm-card-kind--decision" aria-hidden="true" style={{ width: 14, height: 14, fontSize: 9 }}>?</span>
            decision
          </span>
          <span className="rm-legend-item">
            <span className="rm-card-check" aria-hidden="true" style={{ width: 14, height: 14, fontSize: 10 }}>✓</span>
            done
          </span>
          <span className="rm-legend-item rm-legend-hint">
            <span className="rm-legend-swatch rm-legend-swatch--up" /> upstream
          </span>
          <span className="rm-legend-item rm-legend-hint">
            <span className="rm-legend-swatch rm-legend-swatch--down" /> downstream
          </span>
        </div>

        <div className="rm-filters" role="group" aria-label="Status filters">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`rm-filter${statusFilter.has(s) ? ' rm-filter--on' : ''}`}
              onClick={() => toggleStatus(s)}
              aria-pressed={statusFilter.has(s)}
            >
              <span className={`sb-status-dot sb-dot--${s}`} aria-hidden="true" />
              {statusLabel[s]}
            </button>
          ))}
        </div>

        {!isMobile && (
          <div className="rm-zoom-controls" role="group" aria-label="Zoom">
            <button type="button" className="rm-zoom-btn" onClick={zoomOut} aria-label="Zoom out" title="Zoom out (Ctrl/Cmd + scroll)">−</button>
            <button type="button" className="rm-zoom-btn rm-zoom-btn--reset" onClick={zoomReset} aria-label="Reset zoom" title="Reset zoom">{Math.round(zoom * 100)}%</button>
            <button type="button" className="rm-zoom-btn" onClick={zoomIn} aria-label="Zoom in" title="Zoom in (Ctrl/Cmd + scroll)">+</button>
          </div>
        )}

        {/* Mobile: surface isolate controls inside the header to reclaim
            canvas space. Desktop keeps the floating chips below. */}
        {isMobile && isolatedSet && (
          <div className="rm-isolate-controls rm-isolate-controls--header" role="group" aria-label="Isolation">
            <button
              type="button"
              className="rm-exit-isolate"
              onClick={() => { setIsolatedId(null); setActiveId(null); setHoverIdRaw(null); }}
            >
              × Exit
            </button>
            {expandDownstream && downstream.size > 0 && (
              <button
                type="button"
                className="rm-toggle-downstream"
                onClick={() => setExpandDownstream(false)}
              >
                Hide downstream ({downstream.size})
              </button>
            )}
            {isolatedId && !activeId && (
              <button
                type="button"
                className="rm-isolate-toggle"
                onClick={() => setActiveId(isolatedId)}
                aria-label="Show task details"
                title="Show task details"
              >
                ⓘ
              </button>
            )}
          </div>
        )}
      </header>

      <div className="rm-scroll" ref={scrollRef}>
        {!isMobile && isolatedSet && (
          <div className="rm-isolate-controls">
            <button
              type="button"
              className="rm-exit-isolate"
              onClick={() => { setIsolatedId(null); setActiveId(null); setHoverIdRaw(null); }}
            >
              × Exit isolated path
            </button>
            {expandDownstream && downstream.size > 0 && (
              <button
                type="button"
                className="rm-toggle-downstream"
                onClick={() => setExpandDownstream(false)}
              >
                Hide downstream ({downstream.size})
              </button>
            )}
            {isolatedId && !activeId && (
              <button
                type="button"
                className="rm-isolate-toggle"
                onClick={() => setActiveId(isolatedId)}
                aria-label="Show task details"
                title="Show task details"
              >
                ⓘ
              </button>
            )}
          </div>
        )}
        <div
          className="rm-zoom-sizer"
          style={{
            width: size.w ? size.w * zoom : undefined,
            height: size.h ? size.h * zoom : undefined,
          }}
        >
        <div
          className={`rm-inner${focusedId ? ' rm-inner--focused' : ''}${isolatedSet ? ' rm-inner--isolated' : ''}`}
          ref={innerRef}
          style={gridStyle}
        >
          {/* Lane headers — hidden on mobile (column has zero width there).
              Skipping render saves DOM nodes too. */}
          {!isMobile && activeLayout.laneOrder.map((epic, i) => (
            <div
              key={`lane-${epic.id}`}
              className="rm-lane-header"
              style={{ gridRow: i + 1, gridColumn: 1 }}
            >
              <span className={`sb-status-dot sb-dot--${epic.status}`} aria-hidden="true" />
              <span className="rm-lane-title">{epic.title}</span>
            </div>
          ))}

          {/* Lane background stripes (purely decorative) */}
          {activeLayout.laneOrder.map((epic, i) => (
            <div
              key={`stripe-${epic.id}`}
              className={`rm-lane-stripe rm-lane-stripe--${i % 2}`}
              style={{ gridRow: i + 1, gridColumn: isMobile ? `1 / span ${numCols}` : `2 / span ${numCols}` }}
              aria-hidden="true"
            />
          ))}

          {/* Task cells */}
          {Array.from(cellMap.entries()).map(([key, tasks]) => {
            const [lane, col] = key.split(':').map(Number);
            return (
              <div
                key={`cell-${key}`}
                className="rm-cell"
                style={{ gridRow: lane + 1, gridColumn: col + (isMobile ? 1 : 2) }}
              >
                {tasks.map((task) => {
                  const softIn = incomingEdges(task.id).some((e) => e.kind === 'soft');
                  const isFocused = focusedId === task.id;
                  const isUpstream = upstream.has(task.id);
                  const isDownstream = downstream.has(task.id);
                  // Faded = there IS a focus and this card isn't part of the cone.
                  // Computed in the parent and passed as a primitive prop so React.memo
                  // only re-renders cards whose membership actually changed, and so the
                  // browser doesn't have to re-evaluate a parent-descendant selector
                  // (`.rm-inner--focused .rm-card:not(...)`) against every descendant
                  // when focus toggles. Bounds style-invalidation work to changed cards.
                  const isFaded = !!focusedId && !isFocused && !isUpstream && !isDownstream;
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isActive={activeId === task.id}
                      isFocused={isFocused}
                      isUpstream={isUpstream}
                      isDownstream={isDownstream}
                      isFaded={isFaded}
                      isDimmed={isTaskDimmed(task)}
                      isHidden={false}
                      hasSoftIncoming={softIn}
                      onClick={handleCardClick}
                      onHoverEnter={handleCardEnter}
                      onHoverLeave={handleCardLeave}
                      cardRef={handleCardRef}
                    />
                  );
                })}
              </div>
            );
          })}

          <EdgeOverlay
            width={size.w}
            height={size.h}
            edges={edgeGeoms}
            focusedId={focusedId}
            upstream={upstream}
            downstream={downstream}
          />

          {stubPos && (
            <button
              type="button"
              className="rm-downstream-stub"
              style={{ left: stubPos.x, top: stubPos.y }}
              onClick={() => setExpandDownstream(true)}
              title={`Expand ${downstream.size} downstream task${downstream.size === 1 ? '' : 's'}`}
            >
              +{downstream.size}
            </button>
          )}
        </div>
        </div>
      </div>

      {activeTask && (
        <>
          {isMobile && (
            <div
              className="rm-drawer-backdrop"
              onClick={() => { setActiveId(null); }}
            />
          )}
          <TaskDrawer
            task={activeTask}
            onClose={() => { setActiveId(null); }}
            onSelectTask={(id) => { setActiveId(id); setIsolatedId(id); }}
            isMobile={isMobile}
            isolated={isolatedId === activeTask.id}
            onToggleIsolate={() =>
              setIsolatedId((cur) => (cur === activeTask.id ? null : activeTask.id))
            }
          />
        </>
      )}

    </div>
  );
};
