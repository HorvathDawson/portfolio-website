/* ============================================================
   Roadmap — pure layout
   ------------------------------------------------------------
   Computes swim-lane positions for each task. Pure / no React,
   so a future DAG renderer can ignore this and consume the raw
   `roadmap` directly.

   - laneIndex  → epic order in the roadmap car's car.json
   - col        → topological depth (longest path from a root),
                  clamped to >= 0. `task.order` overrides depth.
   ============================================================ */

import { roadmapCar, type Epic } from './cars';
import type { Roadmap, RoadmapTask, TaskId } from './roadmapData';

export interface LaneNode {
  task: RoadmapTask;
  lane: number;
  col: number;
}

export interface LaneLayout {
  nodes: LaneNode[];
  /** Epic rows in order (only those that contain tasks). */
  laneOrder: Epic[];
  /** Total number of content columns. */
  cols: number;
}

/** Topological depth: depth(v) = 0 if no incoming, else 1 + max(depth(u)). */
function computeDepths(roadmap: Roadmap): Map<TaskId, number> {
  const depth = new Map<TaskId, number>();
  const indeg = new Map<TaskId, number>();
  const adj = new Map<TaskId, TaskId[]>();
  for (const t of roadmap.tasks) {
    indeg.set(t.id, 0);
    adj.set(t.id, []);
    depth.set(t.id, 0);
  }
  for (const e of roadmap.edges) {
    if (!indeg.has(e.from) || !indeg.has(e.to)) continue;
    adj.get(e.from)!.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  // Kahn's
  const queue: TaskId[] = [];
  for (const [id, n] of indeg) if (n === 0) queue.push(id);
  while (queue.length > 0) {
    const u = queue.shift()!;
    const du = depth.get(u) ?? 0;
    for (const v of adj.get(u) ?? []) {
      depth.set(v, Math.max(depth.get(v) ?? 0, du + 1));
      indeg.set(v, (indeg.get(v) ?? 0) - 1);
      if ((indeg.get(v) ?? 0) === 0) queue.push(v);
    }
  }
  return depth;
}

export function computeLayout(roadmap: Roadmap): LaneLayout {
  const depth = computeDepths(roadmap);

  // Build forward adjacency for as-late-as-possible scheduling of purchases.
  const succ = new Map<TaskId, TaskId[]>();
  for (const t of roadmap.tasks) succ.set(t.id, []);
  for (const e of roadmap.edges) {
    if (succ.has(e.from) && depth.has(e.to)) succ.get(e.from)!.push(e.to);
  }

  // Lane index per epic (only epics with at least one task get a row).
  const epicsWithTasks = roadmapCar.epics.filter((e) =>
    roadmap.tasks.some((t) => t.epic === e.id),
  );
  const laneIndex = new Map<string, number>(
    epicsWithTasks.map((e, i) => [e.id, i]),
  );

  // Effective column: purchase tasks float to sit visually between their
  // upstream feeders and the install/fab task that consumes them. Centered
  // between (max parent depth + 1) and (min child depth − 1), biased right
  // so a part lives close to where it's used. Manual `task.order` always wins.
  const colOf = (task: RoadmapTask): number => {
    if (task.order !== undefined) return task.order;
    const base = depth.get(task.id) ?? 0;
    if (task.kind !== 'purchase') return base;
    const children = succ.get(task.id) ?? [];
    if (children.length === 0) return base;
    let minChildDepth = Infinity;
    for (const c of children) {
      const cd = depth.get(c);
      if (cd !== undefined && cd < minChildDepth) minChildDepth = cd;
    }
    if (!Number.isFinite(minChildDepth)) return base;
    const earliest = base; // already = max(parent depth) + 1 from Kahn's
    const latest = Math.max(earliest, minChildDepth - 1);
    // Bias toward the consumer (right-leaning midpoint).
    return Math.round(earliest + (latest - earliest) * 0.65);
  };

  const nodes: LaneNode[] = roadmap.tasks
    .filter((t) => laneIndex.has(t.epic))
    .map((task) => ({
      task,
      lane: laneIndex.get(task.epic)!,
      col: colOf(task),
    }));

  // Within each (lane, col) cell, multiple tasks can stack — that's fine,
  // the renderer flexes them vertically. We just need the global col count.
  const cols = nodes.reduce((m, n) => Math.max(m, n.col), 0) + 1;

  return { nodes, laneOrder: epicsWithTasks, cols };
}
