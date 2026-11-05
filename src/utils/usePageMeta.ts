import { useEffect } from 'react';
import { absoluteUrl } from '../data/site';

export interface PageMeta {
  title: string;
  description: string;
  /** Canonical path, e.g. '/garage/a40/steering'. */
  path: string;
  /** Link-preview title/description, when they differ from the page's own. */
  shareTitle?: string;
  shareDescription?: string;
  type?: 'website' | 'article';
  /** Keep the page out of search results (e.g. not-found pages). */
  noindex?: boolean;
  /** Structured data for this page (schema.org JSON-LD). */
  jsonLd?: object;
}

const JSON_LD_SELECTOR = 'script#page-jsonld';

/** The <head> element matching `selector`, created with `attrs` if missing. */
function headElement(selector: string, tag: string, attrs: Record<string, string>): HTMLElement {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.append(el);
  }
  return el;
}

function setMeta(attr: 'name' | 'property', key: string, content: string | null) {
  const selector = `meta[${attr}="${key}"]`;
  if (content === null) document.head.querySelector(selector)?.remove();
  else headElement(selector, 'meta', { [attr]: key }).setAttribute('content', content);
}

/**
 * Per-route <title>, description, canonical URL and social tags. index.html
 * carries the home page's values for clients that don't run JS.
 */
export function usePageMeta({
  title,
  description,
  path,
  shareTitle = title,
  shareDescription = description,
  type = 'website',
  noindex = false,
  jsonLd,
}: PageMeta) {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    const url = absoluteUrl(path);
    document.title = title;
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex' : null);
    headElement('link[rel="canonical"]', 'link', { rel: 'canonical' }).setAttribute('href', url);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:title', shareTitle);
    setMeta('property', 'og:description', shareDescription);
    setMeta('name', 'twitter:title', shareTitle);
    setMeta('name', 'twitter:description', shareDescription);

    if (jsonLdText) {
      headElement(JSON_LD_SELECTOR, 'script', { id: 'page-jsonld', type: 'application/ld+json' }).textContent = jsonLdText;
    } else {
      document.head.querySelector(JSON_LD_SELECTOR)?.remove();
    }
  }, [title, description, path, shareTitle, shareDescription, type, noindex, jsonLdText]);
}
