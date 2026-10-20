import { useEffect, type RefObject } from 'react';

/**
 * Sizes `content` to the largest box of the given aspect ratio that fits
 * inside the parent of `container`, like `object-fit: contain`, and keeps it
 * fitted as the parent resizes. `onFit` receives the new size in pixels.
 */
export function useContainFit(
  container: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
  ratio: number,
  onFit?: (width: number, height: number) => void,
) {
  useEffect(() => {
    const parent = container.current?.parentElement;
    const box = content.current;
    if (!parent || !box) return;

    // ResizeObserver also fires once on observe, which sets the initial size.
    const observer = new ResizeObserver(() => {
      const { width: pw, height: ph } = parent.getBoundingClientRect();
      if (pw === 0 || ph === 0) return;

      const [width, height] = pw / ph > ratio ? [ph * ratio, ph] : [pw, pw / ratio];
      box.style.width = `${width}px`;
      box.style.height = `${height}px`;
      onFit?.(width, height);
    });
    observer.observe(parent);

    return () => observer.disconnect();
  }, [container, content, ratio, onFit]);
}
