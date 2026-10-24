import React from 'react';
import { useLocation } from 'react-router-dom';

interface State { error?: Error }

/**
 * Catches render / chunk-load errors (for example roadmapData.ts failing its
 * validation at import) so one broken page shows a message instead of a blank
 * screen. In dev the full error is shown so it stays loud; the build runs the
 * same validation through scripts/check-roadmap-plan.mjs and fails there.
 */
class Boundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <main className="not-found route-error" role="alert">
        <h1>This page failed to load</h1>
        <p>Something in this page's data or code is broken. Other pages should still work.</p>
        {import.meta.env.DEV && <pre className="route-error-detail">{error.message}</pre>}
        <p>
          <a href="/garage" className="project-cta-button button">Garage</a>{' '}
          <a href="/" className="project-cta-button button">Portfolio</a>
        </p>
      </main>
    );
  }
}

/** Error boundary that resets when the route changes. */
export const RouteErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();
  return <Boundary key={pathname}>{children}</Boundary>;
};
