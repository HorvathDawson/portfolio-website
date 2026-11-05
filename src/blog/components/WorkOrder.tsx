import React from 'react';
import { Link } from 'react-router-dom';
import { roadmapCar, roadmapPath } from '../cars';
import { statusLabel } from '../format';
import { useRoadmap } from '../useRoadmap';
import { sheetNo, type Sheet } from '../postIndex';
import { Collapsible } from './Collapsible';

const taskHref = (car: string, id: string) => `${roadmapPath(car)}?view=tree&task=${encodeURIComponent(id)}`;

/**
 * The manila work-order tag on a post: the roadmap tasks that list this post,
 * with a stamp for each status and what the work opens next. Only for the
 * roadmap car; renders nothing when no task links the post.
 */
export const WorkOrder: React.FC<{ car: string; sheet: Sheet }> = ({ car, sheet }) => {
  const rm = useRoadmap(car === roadmapCar.id && roadmapCar.roadmap);
  if (rm === undefined) return null;
  if (rm === null) return <p className="workorder workorder--err">The roadmap could not be loaded.</p>;
  const tasks = rm.tasksForPost(sheet.post.slug);
  if (tasks.length === 0) return null;
  const next = rm.opensNext(tasks);
  return (
    <Collapsible className="wo-details" summary={<span className="wo-summary"><b>Work order</b> {rm.workOrderNo(tasks[0])} · {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>}>
    <aside className="workorder" aria-labelledby="wo-h">
      <span className="workorder-hole" aria-hidden="true" />
      <p className="workorder-head">
        <span id="wo-h" className="workorder-title">Work order</span>
        <span>No. {rm.workOrderNo(tasks[0])} · sheet {sheetNo(sheet.no)}</span>
        <span className="workorder-meta">Roadmap · {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
      </p>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <span className={`workorder-box${rm.isDone(t) ? ' is-done' : ''}`} aria-hidden="true" />
            <Link to={taskHref(car, t.id)}>{t.title}</Link>
            <span className={`stamp stamp--${t.status}`}>{statusLabel[t.status]}</span>
          </li>
        ))}
      </ul>
      {next.length > 0 && (
        <p className="workorder-foot">
          <b>Opens next</b>
          {next.map((t, i) => (
            <React.Fragment key={t.id}>
              {i > 0 && ' · '}
              <Link to={taskHref(car, t.id)}>{t.title}</Link>
            </React.Fragment>
          ))}
        </p>
      )}
    </aside>
    </Collapsible>
  );
};
