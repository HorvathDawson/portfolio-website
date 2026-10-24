// Checks the roadmap planning helpers (src/blog/roadmapPlan.ts) against the
// real roadmap data. Loads the TypeScript through Vite so import.meta.glob in
// blogData.ts works, then asserts a few invariants and prints a summary.
//
//   node scripts/check-roadmap-plan.mjs
//
// Exits non-zero when an invariant fails.
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = await createServer({
  root,
  configFile: false,
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
});

let failed = false;
try {
  const data = await server.ssrLoadModule('/src/blog/roadmapData.ts');
  const plan = await server.ssrLoadModule('/src/blog/roadmapPlan.ts');
  const { roadmap } = data;
  const byId = new Map(roadmap.tasks.map((t) => [t.id, t]));
  const hardIn = (id) => roadmap.edges.filter((e) => e.kind === 'hard' && e.to === id).map((e) => e.from);
  const hardEdge = new Set(roadmap.edges.filter((e) => e.kind === 'hard').map((e) => `${e.from}>${e.to}`));
  const done = (t) => t.status === 'complete' || t.status === 'decided';

  const check = (name, fn) => {
    try {
      fn();
      console.log(`ok   ${name}`);
    } catch (err) {
      failed = true;
      console.log(`FAIL ${name}\n     ${err.message.split('\n').join('\n     ')}`);
    }
  };

  const ready = plan.readyTasks();
  const path_ = plan.criticalPath();
  const near = plan.nearReadyTasks();

  check('ready set is non-empty', () => assert.ok(ready.length > 0));
  check('every ready task is unfinished with all hard deps done', () => {
    for (const t of ready) {
      assert.ok(!done(t), `${t.id} is done`);
      for (const d of hardIn(t.id)) assert.ok(done(byId.get(d)), `${t.id} waits on ${d}`);
    }
  });
  check('ready set is exactly the unfinished tasks with no unfinished hard deps', () => {
    const expected = roadmap.tasks.filter((t) => !done(t) && hardIn(t.id).every((d) => done(byId.get(d))));
    assert.deepEqual(new Set(ready.map((t) => t.id)), new Set(expected.map((t) => t.id)));
  });
  check('ready ranking puts in-progress tasks first', () => {
    const firstPlanned = ready.findIndex((t) => t.status !== 'in-progress');
    if (firstPlanned >= 0) assert.ok(ready.slice(firstPlanned).every((t) => t.status !== 'in-progress'));
  });
  check('critical path is a hard-edge chain of unfinished tasks', () => {
    assert.ok(path_.length > 0, 'empty path');
    for (const t of path_) assert.ok(!done(t), `${t.id} is done`);
    for (let i = 1; i < path_.length; i++) {
      assert.ok(hardEdge.has(`${path_[i - 1].id}>${path_[i].id}`), `no hard edge ${path_[i - 1].id} -> ${path_[i].id}`);
    }
  });
  check('critical path starts at a ready task', () => assert.ok(plan.isReady(path_[0].id), path_[0].id));
  check('critical path ends at t-registration when it is unfinished', () => {
    const reg = byId.get('t-registration');
    if (reg && !done(reg)) assert.equal(path_.at(-1).id, 't-registration');
  });
  check('near-ready tasks have exactly one unfinished hard dep', () => {
    for (const { task, blocker } of near) {
      const open = hardIn(task.id).filter((d) => !done(byId.get(d)));
      assert.deepEqual(open, [blocker.id], task.id);
    }
  });
  check('unlockedBy(x) tasks become ready once x is done', () => {
    for (const t of ready) {
      for (const u of plan.unlockedBy(t.id)) {
        const open = hardIn(u.id).filter((d) => !done(byId.get(d)));
        assert.deepEqual([...new Set(open)], [t.id], `${u.id} after ${t.id}`);
      }
    }
  });
  check('focus tree edges are monotonic in column', () => {
    const opts = { depth: 3, hardOnly: false, hideDone: false };
    for (const t of roadmap.tasks) {
      const tree = plan.focusTree(t.id, opts);
      const colUp = (id) => (id === t.id ? 0 : tree.upstream.col.get(id));
      for (const e of tree.upstream.edges) assert.ok(colUp(e.from) > colUp(e.to), `${t.id} up ${e.from}->${e.to}`);
      const colDn = (id) => (id === t.id ? 0 : tree.downstream.col.get(id));
      for (const e of tree.downstream.edges) assert.ok(colDn(e.to) > colDn(e.from), `${t.id} down ${e.from}->${e.to}`);
    }
  });
  check('progress totals add up', () => {
    const p = plan.progress();
    assert.equal(p.overall.total, roadmap.tasks.length);
    const kindSum = Object.values(p.byKind).reduce((s, k) => s + k.total, 0);
    assert.equal(kindSum, roadmap.tasks.length);
    assert.equal(p.byEpic.reduce((s, e) => s + e.total, 0), roadmap.tasks.length);
  });

  const p = plan.progress();
  console.log(`\n${roadmap.tasks.length} tasks, ${roadmap.edges.length} edges; ${p.overall.done} done`);
  console.log(`ready now (${ready.length}):`);
  for (const t of ready.slice(0, 8)) {
    console.log(`  ${t.id.padEnd(34)} ${t.status.padEnd(11)} score ${data.bottleneckScores.get(t.id)}`);
  }
  console.log(`almost ready: ${near.length}`);
  console.log(`critical path (${path_.length}): ${path_.map((t) => t.id).join(' > ')}`);
} finally {
  await server.close();
}
process.exit(failed ? 1 : 0);
