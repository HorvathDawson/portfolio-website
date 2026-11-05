import { useEffect, useState } from 'react';

type Queries = typeof import('./roadmapQueries');

let promise: Promise<Queries> | undefined;
const load = () => (promise ??= import('./roadmapQueries'));

/**
 * The roadmap query helpers (roadmapQueries.ts), loaded on first use so the
 * roadmap data is its own chunk. `undefined` while loading or when `enabled`
 * is false; `null` if the chunk failed to load.
 */
export function useRoadmap(enabled: boolean): Queries | null | undefined {
  const [mod, setMod] = useState<Queries | null>();
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    load().then((m) => { if (live) setMod(m); }, () => { if (live) setMod(null); });
    return () => { live = false; };
  }, [enabled]);
  return enabled ? mod : undefined;
}
