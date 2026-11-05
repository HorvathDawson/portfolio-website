/* ============================================================
   Roadmap queries for the log pages (work orders, Next up, the
   wall). Loaded lazily with the roadmap data (useRoadmap), so
   post pages and the car home don't bundle the roadmap.
   Ranking is roadmapPlan.ts's (readyTasks / compareByPriority).
   ============================================================ */

import { bottleneckCount, roadmap, type RoadmapTask } from './roadmapData';
import { compareByPriority, epicTitle, indexOf, isDone, kindOf, progress, readyTasks, unfinishedHardDeps } from './roadmapPlan';

const order = new Map(roadmap.tasks.map((t, i) => [t.id, i]));

/** Stable work-order number for a task: `WO-0042` (its position in roadmapData.ts). */
export const workOrderNo = (t: RoadmapTask) => `WO-${String((order.get(t.id) ?? 0) + 1).padStart(4, '0')}`;

export interface NextTask {
  task: RoadmapTask;
  kind: ReturnType<typeof kindOf>;
  epicTitle: string;
  /** How many tasks wait on this one (hard, transitively). */
  unblocks: number;
  wo: string;
}

const toNext = (task: RoadmapTask): NextTask => ({
  task,
  kind: kindOf(task),
  epicTitle: epicTitle.get(task.epic) ?? task.epic,
  unblocks: bottleneckCount.get(task.id) ?? 0,
  wo: workOrderNo(task),
});

/** Roadmap tasks that list `slug` in their posts. */
export const tasksForPost = (slug: string): RoadmapTask[] => roadmap.tasks.filter((t) => t.posts?.includes(slug));

/** Unfinished tasks straight after `tasks` (hard edges), best first. */
export function opensNext(tasks: RoadmapTask[], limit = 3): RoadmapTask[] {
  const idx = indexOf();
  const ids = new Set(tasks.map((t) => t.id));
  const out = new Map<string, RoadmapTask>();
  for (const t of tasks) {
    for (const e of idx.out.get(t.id) ?? []) {
      const s = idx.task.get(e.to);
      if (e.kind === 'hard' && s && !isDone(s) && !ids.has(s.id)) out.set(s.id, s);
    }
  }
  return [...out.values()].sort((a, b) => compareByPriority(a, b)).slice(0, limit);
}

/** The top `n` ready tasks (every hard dependency done), ranked. */
export const nextUp = (n = 4): NextTask[] => readyTasks().slice(0, n).map(toNext);

export interface EpicSummary {
  done: number;
  total: number;
  /** The best ready task in the epic, if any. */
  next?: NextTask;
  /** Nothing ready: the epic's top unfinished task and what it waits on. */
  blockedBy?: RoadmapTask;
}

/** Progress and next task per epic id. */
export function epicSummaries(): Map<string, EpicSummary> {
  const ready = readyTasks();
  const out = new Map<string, EpicSummary>();
  for (const e of progress().byEpic) {
    const next = ready.find((t) => t.epic === e.id);
    let blockedBy: RoadmapTask | undefined;
    if (!next) {
      const open = roadmap.tasks.filter((t) => t.epic === e.id && !isDone(t)).sort((a, b) => compareByPriority(a, b));
      blockedBy = open.map((t) => unfinishedHardDeps(t.id)[0]).find(Boolean);
    }
    out.set(e.id, { done: e.done, total: e.total, next: next && toNext(next), blockedBy });
  }
  return out;
}

/** Overall roadmap progress. */
export function overall() {
  const p = progress().overall;
  return { ...p, pct: p.total ? Math.round((100 * p.done) / p.total) : 0 };
}

export { epicTitle, isDone };
