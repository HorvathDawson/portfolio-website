/**
 * Shared, rAF-batched scroll/resize subscription.
 *
 * Every scroll-driven effect on the page (parallax header, project card
 * animations, hover re-checks) subscribes here instead of attaching its own
 * window listener. All callbacks run together in a single animation frame,
 * at most once per frame, so the page does one batch of reads/writes per
 * frame no matter how many effects are mounted.
 */

type FrameCallback = () => void;

const callbacks = new Set<FrameCallback>();
let rafId = 0;

const flush = () => {
  rafId = 0;
  callbacks.forEach((cb) => cb());
};

const schedule = () => {
  if (!rafId) rafId = requestAnimationFrame(flush);
};

/**
 * Run `cb` on the next animation frame and again on every frame in which the
 * window scrolled or resized. Returns an unsubscribe function.
 */
export function onScrollFrame(cb: FrameCallback): () => void {
  if (callbacks.size === 0) {
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  }
  callbacks.add(cb);
  schedule();

  return () => {
    callbacks.delete(cb);
    if (callbacks.size === 0) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }
  };
}

/**
 * Like `onScrollFrame`, but only subscribed while `target` is on (or within
 * `rootMargin` of) the screen, so off-screen effects cost nothing per frame.
 */
export function onScrollFrameWhileVisible(
  target: Element,
  cb: FrameCallback,
  rootMargin = '200px',
): () => void {
  let unsubscribe: (() => void) | null = null;

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      unsubscribe ??= onScrollFrame(cb);
    } else if (unsubscribe) {
      cb(); // settle on the latest position before going idle
      unsubscribe();
      unsubscribe = null;
    }
  }, { rootMargin });
  observer.observe(target);

  return () => {
    observer.disconnect();
    unsubscribe?.();
  };
}
