// Site-wide identity used by the page <head>: index.html (via the Vite
// plugin in vite.config.ts), usePageMeta, and the generated sitemap.

export const SITE_URL = 'https://dawsonhorvath.com';

export const SITE_NAME = 'Dawson Horvath';

export const HOME_TITLE = "Dawson's Portfolio | Engineering & Design";

export const HOME_DESCRIPTION =
  'Portfolio of Dawson Horvath: A showcase of robotics, software engineering, self-driving cars, and DIY fabrication projects.';

export const OG_IMAGE = { path: '/assets/og/home.jpg', width: 1200, height: 630 };

/** Public profiles, used for the contact links and the Person schema's sameAs. */
export const GITHUB_URL = 'https://github.com/HorvathDawson';

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).href;
