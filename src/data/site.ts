// Site-wide identity used by the page <head>: index.html (via the Vite
// plugins in vite.plugins.ts), usePageMeta, and the generated sitemap.

export const SITE_URL = 'https://dawsonhorvath.com';

export const SITE_NAME = 'Dawson Horvath';

export const HOME_TITLE = "Dawson's Portfolio | Engineering & Design";

/** Title and description for link-preview cards of the home page. */
export const SHARE_TITLE = 'Dawson Horvath — Engineering Portfolio';
export const SHARE_DESCRIPTION = 'Robotics, software engineering, self-driving cars, and DIY fabrication projects.';

export const HOME_DESCRIPTION =
  'Portfolio of Dawson Horvath: A showcase of robotics, software engineering, self-driving cars, and DIY fabrication projects.';

/** Link-preview image, built from the header layers by scripts/make-header-images.py. */
export const OG_IMAGE = {
  path: '/assets/og/home.jpg',
  width: 1200,
  height: 630,
  alt: 'Illustrated mountain landscape with climbers, a mountain biker and forest',
};

/** Public profiles, used for the contact links and the Person schema's sameAs. */
export const GITHUB_URL = 'https://github.com/HorvathDawson';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/horvathdawson/';

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).href;

/**
 * The resume, served by the resume-generator app at /resume-generator/
 * (a separate Worker; see wrangler.jsonc). The data is its resumes/dawson.json.
 */
export const RESUME_GENERATOR_PATH = '/resume-generator/';
export const RESUME_VIEW_PATH = `${RESUME_GENERATOR_PATH}?resume=dawson&mode=view`;
/** The pages, scaled to fit and scrolling a page at a time, for the tablet on the Resume card. */
export const RESUME_EMBED_PATH = `${RESUME_GENERATOR_PATH}?resume=dawson&mode=embed`;
