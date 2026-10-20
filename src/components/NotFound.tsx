import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePageMeta } from '../utils/usePageMeta';

/** Catch-all route. The host serves the app for every path, so mark these noindex. */
export const NotFound: React.FC = () => {
  const { pathname } = useLocation();
  usePageMeta({ title: 'Page not found', description: 'This page does not exist.', path: pathname, noindex: true });

  return (
    <main className="not-found">
      <h1>Page not found</h1>
      <Link to="/" className="project-cta-button button">&larr; Portfolio</Link>
    </main>
  );
};
