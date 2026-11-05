/* ============================================================
   Roadmap planning helpers (the roadmap car, see cars.ts)
   ------------------------------------------------------------
   Pure graph logic behind the "Next up" and "Tree" views. No
   React here: everything takes a `Roadmap` (defaulting to the
   real one) so it can be checked by scripts/check-roadmap-plan.mjs.

   "Done" means status `complete` or `decided`. Only hard edges
   gate readiness; soft edges are informational.
   ============================================================ */

import { roadmapCar } from './cars';
import {
  roadmap as defaultRoadmap,
  bottleneckScores,
  type Roadmap,
  type RoadmapEdge,
  type RoadmapTask,
  type TaskId,
  type TaskKind,
} from './roadmapData';

export function isDone(t: RoadmapTask | undefined): boolean {
  return !!t && (t.status === 'complete' || t.status === 'decided');
}

/** Explicit `kind` wins, else `t-decide-*` ids are decisions, else `task`. */
export function kindOf(t: RoadmapTask): TaskKind {
  if (t.kind) return t.kind;
  if (t.id.startsWith('t-decide-')) return 'decision';
  return 'task';
}

/* ── Index ─────────────────────────────────────────── */

export interface GraphIndex {
  rm: Roadmap;
  task: Map<TaskId, RoadmapTask>;
  /** All incoming / outgoing edges by task id. */
  inc: Map<TaskId, RoadmapEdge[]>;
  out: Map<TaskId, RoadmapEdge[]>;
}

const indexCache = new WeakMap<Roadmap, GraphIndex>();

export function indexOf(rm: Roadmap = defaultRoadmap): GraphIndex {
  const hit = indexCache.get(rm);
  if (hit) return hit;
  const task = new Map(rm.tasks.map((t) => [t.id, t]));
  const inc = new Map<TaskId, RoadmapEdge[]>();
  const out = new Map<TaskId, RoadmapEdge[]>();
  for (const t of rm.tasks) {
    inc.set(t.id, []);
    out.set(t.id, []);
  }
  for (const e of rm.edges) {
    if (!task.has(e.from) || !task.has(e.to)) continue;
    out.get(e.from)!.push(e);
    inc.get(e.to)!.push(e);
  }
  const idx = { rm, task, inc, out };
  indexCache.set(rm, idx);
  return idx;
}

function hardPreds(idx: GraphIndex, id: TaskId): TaskId[] {
  return (idx.inc.get(id) ?? []).filter((e) => e.kind === 'hard').map((e) => e.from);
}
function hardSuccs(idx: GraphIndex, id: TaskId): TaskId[] {
  return (idx.out.get(id) ?? []).filter((e) => e.kind === 'hard').map((e) => e.to);
}

/** Hard dependencies of `id` that are not done yet. */
export function unfinishedHardDeps(id: TaskId, rm: Roadmap = defaultRoadmap): RoadmapTask[] {
  const idx = indexOf(rm);
  return hardPreds(idx, id)
    .map((p) => idx.task.get(p)!)
    .filter((t) => !isDone(t));
}

export function isReady(id: TaskId, rm: Roadmap = defaultRoadmap): boolean {
  const t = indexOf(rm).task.get(id);
  return !!t && !isDone(t) && unfinishedHardDeps(id, rm).length === 0;
}

/* ── Ranking ───────────────────────────────────────── */

function kindRank(t: RoadmapTask): number {
  const k = kindOf(t);
  return k === 'decision' ? 0 : k === 'task' ? 1 : 2;
}

/** Tasks that unblock something before those that don't; then in-progress first,
 *  then bottleneck score desc, then decision > task > purchase, then title. */
export function compareByPriority(
  a: RoadmapTask,
  b: RoadmapTask,
  scores: Map<TaskId, number> = bottleneckScores,
): number {
  const gates = Number((scores.get(b.id) ?? 0) > 0) - Number((scores.get(a.id) ?? 0) > 0);
  if (gates) return gates;
  const ip = Number(b.status === 'in-progress') - Number(a.status === 'in-progress');
  if (ip) return ip;
  const ds = (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0);
  if (ds) return ds;
  const dk = kindRank(a) - kindRank(b);
  if (dk) return dk;
  return a.title.localeCompare(b.title);
}

/* ── Ready / unlock / near-ready ───────────────────── */

/** Not done, and every hard dependency is done. Sorted by priority. */
export function readyTasks(rm: Roadmap = defaultRoadmap): RoadmapTask[] {
  return rm.tasks.filter((t) => isReady(t.id, rm)).sort((a, b) => compareByPriority(a, b));
}

/** Tasks that become ready the moment `id` is done (its only unfinished hard dependency). */
export function unlockedBy(id: TaskId, rm: Roadmap = defaultRoadmap): RoadmapTask[] {
  const idx = indexOf(rm);
  const out: RoadmapTask[] = [];
  for (const s of new Set(hardSuccs(idx, id))) {
    const t = idx.task.get(s)!;
    if (isDone(t)) continue;
    const blockers = unfinishedHardDeps(s, rm);
    if (blockers.every((b) => b.id === id)) out.push(t);
  }
  return out.sort((a, b) => compareByPriority(a, b));
}

export interface NearReady {
  task: RoadmapTask;
  blocker: RoadmapTask;
}

/** Blocked tasks with exactly one unfinished hard dependency. */
export function nearReadyTasks(rm: Roadmap = defaultRoadmap): NearReady[] {
  const out: NearReady[] = [];
  for (const t of rm.tasks) {
    if (isDone(t)) continue;
    const deps = unfinishedHardDeps(t.id, rm);
    if (deps.length === 1) out.push({ task: t, blocker: deps[0] });
  }
  return out.sort((a, b) => compareByPriority(a.task, b.task));
}

/* ── Critical path ─────────────────────────────────── */

export const PREFERRED_SINK: TaskId = 't-registration';

/**
 * Longest chain of unfinished tasks linked by hard edges that ends at a sink
 * of the unfinished sub-graph. Ends at `t-registration` when it is unfinished;
 * otherwise at whichever sink gives the longest chain. Ties prefer the
 * higher-priority predecessor so the chain starts at the most urgent task.
 */
export function criticalPath(rm: Roadmap = defaultRoadmap, preferredSink: TaskId = PREFERRED_SINK): RoadmapTask[] {
  const idx = indexOf(rm);
  const open = rm.tasks.filter((t) => !isDone(t));
  const openIds = new Set(open.map((t) => t.id));
  // Topological order of the open sub-graph (hard edges only).
  const indeg = new Map<TaskId, number>();
  for (const t of open) indeg.set(t.id, 0);
  for (const t of open) {
    for (const s of hardSuccs(idx, t.id)) if (openIds.has(s)) indeg.set(s, indeg.get(s)! + 1);
  }
  const order: TaskId[] = [];
  const q = open.filter((t) => indeg.get(t.id) === 0).map((t) => t.id);
  while (q.length) {
    const u = q.shift()!;
    order.push(u);
    for (const s of hardSuccs(idx, u)) {
      if (!openIds.has(s)) continue;
      indeg.set(s, indeg.get(s)! - 1);
      if (indeg.get(s) === 0) q.push(s);
    }
  }
  // len[v] = number of tasks on the longest open chain ending at v.
  const len = new Map<TaskId, number>();
  const prev = new Map<TaskId, TaskId | null>();
  for (const v of order) {
    let best: TaskId | null = null;
    let bestLen = 0;
    for (const p of new Set(hardPreds(idx, v))) {
      if (!openIds.has(p)) continue;
      const l = len.get(p) ?? 0;
      if (l > bestLen || (l === bestLen && best && compareByPriority(idx.task.get(p)!, idx.task.get(best)!) < 0)) {
        best = p;
        bestLen = l;
      }
    }
    len.set(v, bestLen + 1);
    prev.set(v, best);
  }
  let end: TaskId | null = null;
  if (openIds.has(preferredSink)) {
    end = preferredSink;
  } else {
    for (const v of order) {
      const isSink = hardSuccs(idx, v).every((s) => !openIds.has(s));
      if (isSink && (end === null || len.get(v)! > len.get(end)!)) end = v;
    }
  }
  const chain: RoadmapTask[] = [];
  for (let v: TaskId | null = end; v; v = prev.get(v) ?? null) chain.push(idx.task.get(v)!);
  return chain.reverse();
}

/* ── Focus tree (upstream / downstream) ────────────── */

export interface TreeOptions {
  depth: number;
  hardOnly: boolean;
  hideDone: boolean;
  /** Drop edges already implied by a longer path among the shown nodes
   *  (transitive reduction). Defaults to true. */
  reduce?: boolean;
}

export interface TreeSide {
  /** Column (1 = adjacent to the focus) → task ids. Columns are layered so
   *  every edge goes from a farther column to a nearer one (upstream) or
   *  nearer to farther (downstream). */
  columns: TaskId[][];
  /** Every node on this side with its column. */
  col: Map<TaskId, number>;
  /** Edges among focus + this side's nodes (deduplicated; transitively
   *  reduced unless `reduce: false`). */
  edges: RoadmapEdge[];
  /** Edges left out because a longer shown path already implies them. */
  impliedEdges: number;
  /** Done tasks skipped because `hideDone` was on (direct or deeper). */
  hiddenDone: number;
  /** Nodes on the depth boundary that have further neighbours not shown. */
  truncated: Set<TaskId>;
}

export interface FocusTree {
  focus: RoadmapTask;
  upstream: TreeSide;
  downstream: TreeSide;
}

function buildSide(
  idx: GraphIndex,
  focus: TaskId,
  dir: 'up' | 'down',
  opts: TreeOptions,
): TreeSide {
  const neighbours = (id: TaskId): RoadmapEdge[] =>
    (dir === 'up' ? idx.inc.get(id) : idx.out.get(id))!.filter((e) => !opts.hardOnly || e.kind === 'hard');
  const other = (e: RoadmapEdge) => (dir === 'up' ? e.from : e.to);

  // BFS by shortest distance to decide membership.
  const dist = new Map<TaskId, number>([[focus, 0]]);
  const hidden = new Set<TaskId>();
  const truncated = new Set<TaskId>();
  const queue: TaskId[] = [focus];
  while (queue.length) {
    const u = queue.shift()!;
    const du = dist.get(u)!;
    for (const e of neighbours(u)) {
      const v = other(e);
      if (dist.has(v)) continue;
      if (opts.hideDone && isDone(idx.task.get(v))) {
        hidden.add(v);
        continue;
      }
      if (du >= opts.depth) {
        truncated.add(u);
        continue;
      }
      dist.set(v, du + 1);
      queue.push(v);
    }
  }
  const members = new Set(dist.keys());
  const seenEdge = new Set<string>();
  let edges: RoadmapEdge[] = [];
  for (const id of members) {
    for (const e of neighbours(id)) {
      const key = `${e.from}>${e.to}`;
      if (!members.has(other(e)) || seenEdge.has(key)) continue;
      seenEdge.add(key);
      edges.push(e);
    }
  }
  let impliedEdges = 0;
  if (opts.reduce !== false) {
    const succ = new Map<TaskId, TaskId[]>();
    for (const e of edges) succ.set(e.from, [...(succ.get(e.from) ?? []), e.to]);
    // Is `to` reachable from `from` without using the direct edge?
    const implied = (e: RoadmapEdge): boolean => {
      const stack = (succ.get(e.from) ?? []).filter((n) => n !== e.to);
      const seen = new Set(stack);
      while (stack.length) {
        const u = stack.pop()!;
        if (u === e.to) return true;
        for (const v of succ.get(u) ?? []) if (!seen.has(v)) { seen.add(v); stack.push(v); }
      }
      return false;
    };
    const kept = edges.filter((e) => !implied(e));
    impliedEdges = edges.length - kept.length;
    edges = kept;
  }
  // Longest-path layering inside the member set keeps every edge monotonic.
  const col = new Map<TaskId, number>();
  const layer = (id: TaskId): number => {
    if (id === focus) return 0;
    const c = col.get(id);
    if (c !== undefined) return c;
    // Nearer neighbours (toward the focus) are the opposite-direction edges.
    const toward = (dir === 'up' ? idx.out.get(id) : idx.inc.get(id))!
      .filter((e) => (!opts.hardOnly || e.kind === 'hard'))
      .map((e) => (dir === 'up' ? e.to : e.from))
      .filter((n) => members.has(n));
    let best = 0;
    for (const n of toward) best = Math.max(best, layer(n));
    col.set(id, best + 1);
    return best + 1;
  };
  for (const id of members) if (id !== focus) layer(id);

  const nCols = Math.max(0, ...col.values());
  const columns: TaskId[][] = Array.from({ length: nCols }, () => []);
  for (const [id, c] of col) columns[c - 1].push(id);
  // Order each column by the mean row of its nearer-side neighbours
  // (barycentre) so curves cross less; ties by priority.
  const row = new Map<TaskId, number>([[focus, 0]]);
  for (let c = 0; c < nCols; c++) {
    const bary = (id: TaskId): number => {
      const near = edges
        .filter((e) => other(e) === id)
        .map((e) => (dir === 'up' ? e.to : e.from))
        .filter((n) => row.has(n));
      return near.length ? near.reduce((s, n) => s + row.get(n)!, 0) / near.length : 0;
    };
    columns[c].sort((a, b) => bary(a) - bary(b) || compareByPriority(idx.task.get(a)!, idx.task.get(b)!));
    columns[c].forEach((id, i) => row.set(id, i));
  }
  return { columns, col, edges, impliedEdges, hiddenDone: hidden.size, truncated };
}

export function focusTree(id: TaskId, opts: TreeOptions, rm: Roadmap = defaultRoadmap): FocusTree | null {
  const idx = indexOf(rm);
  const focus = idx.task.get(id);
  if (!focus) return null;
  return {
    focus,
    upstream: buildSide(idx, id, 'up', opts),
    downstream: buildSide(idx, id, 'down', opts),
  };
}

/* ── Progress ──────────────────────────────────────── */

export interface Tally {
  done: number;
  total: number;
}

export interface Progress {
  overall: Tally;
  byKind: Record<TaskKind, Tally>;
  byEpic: { id: string; title: string; done: number; total: number }[];
}

export function progress(rm: Roadmap = defaultRoadmap): Progress {
  const byKind: Record<TaskKind, Tally> = {
    task: { done: 0, total: 0 },
    purchase: { done: 0, total: 0 },
    decision: { done: 0, total: 0 },
  };
  const epicTally = new Map<string, Tally>();
  let done = 0;
  for (const t of rm.tasks) {
    const d = isDone(t) ? 1 : 0;
    done += d;
    const k = byKind[kindOf(t)];
    k.total++;
    k.done += d;
    const e = epicTally.get(t.epic) ?? { done: 0, total: 0 };
    e.total++;
    e.done += d;
    epicTally.set(t.epic, e);
  }
  const byEpic = [...roadmapCar.epics]
    .sort((a, b) => a.order - b.order)
    .filter((e) => epicTally.has(e.id))
    .map((e) => ({ id: e.id, title: e.title, ...epicTally.get(e.id)! }));
  return { overall: { done, total: rm.tasks.length }, byKind, byEpic };
}

/* ── Search ────────────────────────────────────────── */

export function searchTasks(query: string, rm: Roadmap = defaultRoadmap): RoadmapTask[] {
  const q = query.trim().toLowerCase();
  if (!q) return rm.tasks.slice();
  // Title hits first, then id hits, then summary-only hits.
  const rank = (t: RoadmapTask): number =>
    t.title.toLowerCase().includes(q) ? 0
      : t.id.toLowerCase().includes(q) ? 1
        : (t.summary ?? '').toLowerCase().includes(q) ? 2
          : 3;
  return rm.tasks
    .map((t) => ({ t, r: rank(t) }))
    .filter((x) => x.r < 3)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.t);
}

/* ── Labels ────────────────────────────────────────── */

export const statusLabel: Record<RoadmapTask['status'], string> = {
  planning: 'Planning',
  'in-progress': 'In progress',
  complete: 'Complete',
  decided: 'Decided',
};

export const epicTitle: Map<string, string> = new Map(roadmapCar.epics.map((e) => [e.id, e.title]));
