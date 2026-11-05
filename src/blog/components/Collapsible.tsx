import React, { useEffect, useState } from 'react';

const QUERY = '(max-width: 599px)';
const isPhone = () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches;

/**
 * Open on wide screens; on phones (< 600 px) a one-line `<details>` summary
 * the reader can expand. Keeps long post headers from pushing the body text
 * below the first screen.
 * - `summary`: the one-line version (shown only on phones)
 */
export const Collapsible: React.FC<{ summary: React.ReactNode; className?: string; children: React.ReactNode }> = ({ summary, className, children }) => {
  const [phone, setPhone] = useState(isPhone);
  const [open, setOpen] = useState(() => !isPhone());
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => { setPhone(mq.matches); setOpen(!mq.matches); };
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return (
    <details
      className={`collapsible${phone ? ' is-phone' : ''}${className ? ` ${className}` : ''}`}
      open={open}
      onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
    >
      <summary>{summary}</summary>
      {children}
    </details>
  );
};
