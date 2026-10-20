import React, { useState } from 'react';
import { contactLinks, type ContactLink } from '../data/content';
import './ContactLinks.css';

const icons: Record<ContactLink['icon'], React.ReactNode> = {
  // GitHub's Octicon mark-github
  github: (
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  ),
  // Rounded square with an "in" cut out
  linkedin: (
    <path
      fillRule="evenodd"
      d="M2 0h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2ZM5.4 4.3a1.2 1.2 0 1 1-2.4 0a1.2 1.2 0 1 1 2.4 0ZM3.2 6.3h2v6.5h-2ZM7 6.3h1.9v.9c.4-.6 1.1-1.1 2.2-1.1 1.8 0 2.4 1.2 2.4 3v3.7h-2V9.4c0-.9-.2-1.6-1.1-1.6-.9 0-1.4.7-1.4 1.7v3.3H7Z"
    />
  ),
  email: (
    <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
      <rect x="1" y="3" width="14" height="10" rx="1.5" />
      <path d="m1.5 4 6.5 5 6.5-5" />
    </g>
  ),
};

const Icon: React.FC<{ name: ContactLink['icon'] }> = ({ name }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">{icons[name]}</svg>
);

const decode = (part: string) => [...atob(part)].reverse().join('');

/** Assembles the address only on a real click, then opens the mail client and shows it. */
const EmailButton: React.FC<{ label: string; email: [string, string] }> = ({ label, email }) => {
  const [address, setAddress] = useState<string | null>(null);

  const onClick = () => {
    const full = `${decode(email[0])}@${decode(email[1])}`;
    setAddress(full);
    window.location.href = `mailto:${full}`;
  };

  return (
    <button type="button" onClick={onClick} aria-label={address ?? label}>
      <Icon name="email" />
      <span className={address ? 'contact-email-address' : undefined}>{address ?? label}</span>
    </button>
  );
};

/** A row of contact links rendered from `contactLinks`. */
export const ContactLinks: React.FC<{ className?: string }> = ({ className }) => (
  <ul className={['contact-links', className].filter(Boolean).join(' ')}>
    {contactLinks.map((link) => (
      <li key={link.label}>
        {'email' in link ? (
          <EmailButton label={link.label} email={link.email} />
        ) : (
          <a href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label}>
            <Icon name={link.icon} />
            <span>{link.label}</span>
          </a>
        )}
      </li>
    ))}
  </ul>
);
