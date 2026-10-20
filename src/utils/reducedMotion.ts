/**
 * Single source for the visitor's reduced-motion preference. Scroll effects
 * (via scrollFrame.ts) and <picture> stills read it here; CSS animations are
 * switched off by the matching media query block at the end of App.css.
 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const query = window.matchMedia(REDUCED_MOTION_QUERY);

export const prefersReducedMotion = () => query.matches;

/** Calls `cb` now and whenever the preference changes. Returns an unsubscribe function. */
export function watchReducedMotion(cb: (reduced: boolean) => void): () => void {
  const onChange = (e: MediaQueryListEvent) => cb(e.matches);
  query.addEventListener('change', onChange);
  cb(query.matches);
  return () => query.removeEventListener('change', onChange);
}
