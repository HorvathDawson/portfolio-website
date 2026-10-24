import { Navigate, useLocation } from 'react-router-dom';

/** The build log used to live at /a40; send old links (with query and hash) to /garage/a40. */
export function LegacyRedirect() {
  const { pathname, search, hash } = useLocation();
  return <Navigate replace to={pathname.replace(/^\/a40/, '/garage/a40').replace(/\/$/, '') + search + hash} />;
}
