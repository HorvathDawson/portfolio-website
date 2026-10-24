import React, { useCallback, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { NotFound } from '../components/NotFound';
import { carPath, roadmapCar, roadmapPath } from './cars';
import { getTask, type TaskId } from './roadmapData';
import { readyTasks } from './roadmapPlan';
import { RoadmapMap, TaskDrawer } from './A40Roadmap';
import { NextUpView } from './RoadmapNextUp';
import { TreeView } from './RoadmapTree';
import { useBreakpoint } from '../utils/useBreakpoint';
import { usePageMeta } from '../utils/usePageMeta';
import './blogStyles.css';
import './roadmapViews.css';

/* ============================================================
   /garage/<car>/roadmap — view switcher
   ?view=next (default) | tree | map, &task=<id>
     next: task = drawer open on that task
     tree: task = focused task (defaults to the top ready task)
     map:  task = isolated on mount (the map's own deep link)
   ============================================================ */

type View = 'next' | 'tree' | 'map';
const VIEWS: { id: View; label: string }[] = [
  { id: 'next', label: 'Next up' },
  { id: 'tree', label: 'Tree' },
  { id: 'map', label: 'Map' },
];

function parseView(v: string | null): View {
  return v === 'tree' || v === 'map' ? v : 'next';
}

function hrefFor(view: View, task: TaskId | null): string {
  const p = new URLSearchParams();
  p.set('view', view);
  if (task) p.set('task', task);
  return `?${p.toString()}`;
}

const ViewSwitcher: React.FC<{ view: View; task: TaskId | null }> = ({ view, task }) => (
  <nav className="rv-switch" aria-label="Roadmap view">
    {VIEWS.map((v) => (
      <Link
        key={v.id}
        to={hrefFor(v.id, task)}
        className={`rv-switch-btn${v.id === view ? ' rv-switch-btn--on' : ''}`}
        aria-current={v.id === view ? 'page' : undefined}
      >
        {v.label}
      </Link>
    ))}
  </nav>
);

export const A40Roadmap: React.FC = () => {
  usePageMeta({ title: `Roadmap · ${roadmapCar.logTitle}`, description: roadmapCar.description, path: roadmapPath(roadmapCar.id) });
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile' || bp === 'tablet';
  const [params, setParams] = useSearchParams();
  const view = parseView(params.get('view'));
  const rawTask = params.get('task');
  const taskId = rawTask && getTask(rawTask) ? rawTask : null;
  // Tree drawer is separate from the focus so it can be opened on any node.
  const drawerParam = params.get('info');
  const drawerId = view === 'next' ? taskId : drawerParam && getTask(drawerParam) ? drawerParam : null;

  const topReady = useMemo(() => readyTasks()[0]?.id ?? null, []);
  const treeFocus = taskId ?? topReady;

  const go = useCallback(
    (next: { view?: View; task?: TaskId | null; info?: TaskId | null }, replace = false) => {
      setParams((prev) => {
        const p = new URLSearchParams(prev);
        if (next.view) p.set('view', next.view);
        if (next.task !== undefined) {
          if (next.task) p.set('task', next.task);
          else p.delete('task');
        }
        if (next.info !== undefined) {
          if (next.info) p.set('info', next.info);
          else p.delete('info');
        }
        if (!p.get('view')) p.set('view', 'next');
        return p;
      }, { replace });
    },
    [setParams],
  );

  const openInfo = useCallback((id: TaskId) => {
    if (view === 'next') go({ task: id });
    else go({ info: id });
  }, [go, view]);
  const closeInfo = useCallback(() => {
    if (view === 'next') go({ task: null }, true);
    else go({ info: null }, true);
  }, [go, view]);
  const showTree = useCallback((id: TaskId) => go({ view: 'tree', task: id, info: null }), [go]);

  // Lock html scroll like the map does; re-apply after the map unmounts
  // (its own cleanup clears the lock).
  useEffect(() => {
    document.documentElement.style.overflowY = 'hidden';
    return () => { document.documentElement.style.overflowY = ''; };
  }, [view]);

  // Escape closes the drawer.
  useEffect(() => {
    if (!drawerId || view === 'map') return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeInfo(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerId, view, closeInfo]);

  const switcher = <ViewSwitcher view={view} task={view === 'tree' ? treeFocus : taskId} />;

  if (view === 'map') return <RoadmapMap key={taskId ?? ''} toolbar={switcher} />;

  const drawerTask = drawerId ? getTask(drawerId) ?? null : null;

  return (
    <div
      className={[
        'blog-page',
        'rm-page',
        'rv-root',
        isMobile ? 'rm-page--mobile' : '',
        drawerTask && !isMobile ? 'rm-page--drawer-open' : '',
      ].join(' ').trim()}
    >
      <header className="rm-topbar">
        <Link to={carPath(roadmapCar.id)} className="blog-back-link">&larr; {roadmapCar.logTitle}</Link>
        <h1 className="rm-topbar-title">Roadmap</h1>
        {switcher}
      </header>

      {view === 'next' && (
        <NextUpView onOpen={openInfo} onShowTree={showTree} activeId={drawerId} />
      )}
      {view === 'tree' && treeFocus && (
        <TreeView
          focusId={treeFocus}
          onFocus={(id) => go({ task: id })}
          onInfo={openInfo}
          activeId={drawerId}
          isMobile={isMobile}
        />
      )}

      {drawerTask && (
        <>
          {isMobile && <div className="rm-drawer-backdrop" onClick={closeInfo} />}
          <TaskDrawer
            task={drawerTask}
            onClose={closeInfo}
            onSelectTask={(id) => (view === 'tree' ? go({ task: id, info: id }) : openInfo(id))}
            isMobile={isMobile}
            isolated={view === 'tree' && treeFocus === drawerTask.id}
            onToggleIsolate={() => showTree(drawerTask.id)}
            isolateLabel="⌖ Show dependency tree"
          />
        </>
      )}
    </div>
  );
};

/** /garage/:car/roadmap: the roadmap belongs to the car with `roadmap: true`. */
export const CarRoadmap: React.FC = () => {
  const { car } = useParams<{ car: string }>();
  return car === roadmapCar.id ? <A40Roadmap /> : <NotFound />;
};
