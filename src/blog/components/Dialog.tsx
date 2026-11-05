import React, { useEffect, useRef } from 'react';
import { IconClose } from './Icons';

/**
 * Modal dialog used by the sheet index, the phone contents sheet and the
 * figure lightbox. Moves focus inside on open, keeps Tab inside, closes on
 * Escape or a click on the scrim, and gives focus back to whatever opened it.
 *
 * - `label`: accessible name (also the visible kicker when `title` is unset)
 * - `variant`: `drawer` (left panel; bottom sheet on phones) or `lightbox`
 */
export const Dialog: React.FC<{
  open: boolean;
  onClose: () => void;
  label: string;
  title?: React.ReactNode;
  variant?: 'drawer' | 'lightbox';
  className?: string;
  children: React.ReactNode;
}> = ({ open, onClose, label, title, variant = 'drawer', className, children }) => {
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const el = panel.current;
    // Focus the first field if there is one (filter box), else the panel itself.
    const first = el?.querySelector<HTMLElement>('input, [data-autofocus]');
    (first ?? el)?.focus();
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !el) return;
      const items = [...el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (items.length === 0) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && (i <= 0)) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      html.style.overflow = prevOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className={`dialog dialog--${variant}${className ? ` ${className}` : ''}`}>
      <div className="dialog-scrim" onClick={onClose} aria-hidden="true" />
      <div className="dialog-panel" role="dialog" aria-modal="true" aria-label={label} ref={panel} tabIndex={-1}>
        <div className="dialog-head">
          <span className="dialog-grab" aria-hidden="true" />
          <p className="kicker">{title ?? label}</p>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <IconClose />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
