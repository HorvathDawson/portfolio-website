import React, { useRef, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { allPosts, buildLogDescription, postsByEpic, type BlogPost, type Epic } from './blogData';
import { useBreakpoint } from '../utils/useBreakpoint';
import { usePageMeta } from '../utils/usePageMeta';
import { SITE_NAME, SITE_URL, absoluteUrl } from '../data/site';
import './blogStyles.css';
import 'katex/dist/katex.min.css';

// Prevent double scrollbar: the portfolio sets html { overflow-y: scroll }
// but the blog manages its own scroll internally.
function useLockHtmlScroll() {
  useEffect(() => {
    document.documentElement.style.overflowY = 'hidden';
    return () => { document.documentElement.style.overflowY = ''; };
  }, []);
}

const statusLabel: Record<string, string> = {
  planning: 'Planning',
  'in-progress': 'In Progress',
  complete: 'Complete',
};

/* ── Epic group in sidebar ─────────────────────────── */

const EpicGroup: React.FC<{
  epic: Epic;
  posts: BlogPost[];
  activeSlug: string;
  onSelect: (slug: string) => void;
  defaultOpen?: boolean;
}> = ({ epic, posts, activeSlug, onSelect, defaultOpen = false }) => {
  const hasActive = posts.some((p) => p.slug === activeSlug);
  const [open, setOpen] = useState(defaultOpen || hasActive);

  return (
    <div className="sb-epic-group">
      <button
        type="button"
        className={`sb-epic-header${hasActive ? ' sb-epic-header--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={`sb-status-dot sb-dot--${epic.status}`} aria-hidden="true" />
        <span className="sb-epic-title">{epic.title}</span>
        <span className={`sb-epic-badge sb-badge--${epic.status}`}>
          {statusLabel[epic.status]}
        </span>
        <span className={`sb-epic-chevron${open ? ' sb-epic-chevron--open' : ''}`} aria-hidden="true">&#9656;</span>
      </button>
      {open && (
        <div className="sb-epic-posts" role="list">
          {posts.map((post) => (
            <button
              key={post.slug}
              type="button"
              className={`sb-item${post.slug === activeSlug ? ' sb-item--active' : ''}`}
              onClick={() => onSelect(post.slug)}
              aria-current={post.slug === activeSlug ? 'page' : undefined}
              role="listitem"
            >
              <span className={`sb-status-dot sb-dot--${post.status}`} aria-hidden="true" />
              <span className="sb-item-text">
                <span className="sb-item-title">{post.title}</span>
                {post.date && (
                  <time className="sb-item-date" dateTime={post.date}>
                    {new Date(post.date + 'T00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </time>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Post content panel ────────────────────────────── */

const PostContent: React.FC<{
  post: BlogPost;
  prev: BlogPost | null;
  next: BlogPost | null;
  onNav: (slug: string) => void;
  onBack?: () => void;
  showBack?: boolean;
}> = ({ post, prev, next, onNav, onBack, showBack }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Honour ./post#heading links; otherwise start each post at the top.
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const target = hash ? document.getElementById(hash) : null;
    if (target && contentRef.current?.contains(target)) target.scrollIntoView();
    else contentRef.current?.scrollTo(0, 0);
  }, [post.slug]);

  return (
    <div className="blog-content-panel" ref={contentRef}>
      {showBack && onBack && (
        <button type="button" className="blog-mobile-back" onClick={onBack}>
          &larr; All Posts
        </button>
      )}

      <article className="blog-article">
        <header className="blog-article-header">
          {post.date && (
            <time className="blog-article-date" dateTime={post.date}>
              {new Date(post.date + 'T00:00').toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </time>
          )}
          <h1>{post.title}</h1>
          <div className="blog-article-meta">
            <span className={`blog-status blog-status--${post.status}`}>
              {statusLabel[post.status] ?? post.status}
            </span>
            {post.tags.map((tag) => (
              <span key={tag} className="blog-tag">{tag}</span>
            ))}
          </div>
        </header>

        <div
          className="blog-article-body"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        <nav className="blog-article-nav" aria-label="Previous and next posts">
          {prev ? (
            <button type="button" className="blog-nav-btn blog-nav-prev" onClick={() => onNav(prev.slug)}>
              &larr; {prev.title}
            </button>
          ) : <span />}
          {next ? (
            <button type="button" className="blog-nav-btn blog-nav-next" onClick={() => onNav(next.slug)}>
              {next.title} &rarr;
            </button>
          ) : <span />}
        </nav>
      </article>
    </div>
  );
};

/* ── Main blog layout ──────────────────────────────── */

export const A40Blog: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile' || bp === 'tablet';
  useLockHtmlScroll();

  const grouped = postsByEpic();
  const activeSlug = slug ?? allPosts[0]?.slug;
  const activeIndex = allPosts.findIndex((p) => p.slug === activeSlug);
  const activePost = activeIndex >= 0 ? allPosts[activeIndex] : allPosts[0];
  const prev = activeIndex > 0 ? allPosts[activeIndex - 1] : null;
  const next = activeIndex < allPosts.length - 1 ? allPosts[activeIndex + 1] : null;

  // An unknown slug falls back to the first post; keep that URL out of search.
  const showingPost = Boolean(slug) && activeIndex >= 0;
  const postPath = `/a40/${activePost.slug}`;
  usePageMeta(showingPost ? {
    title: `${activePost.title} · A40 Build Log`,
    description: activePost.excerpt,
    path: postPath,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: activePost.title,
      datePublished: activePost.date,
      description: activePost.excerpt,
      url: absoluteUrl(postPath),
      mainEntityOfPage: absoluteUrl(postPath),
      isPartOf: { '@type': 'Blog', name: 'A40 Build Log', url: absoluteUrl('/a40') },
      author: { '@type': 'Person', '@id': `${SITE_URL}/#person`, name: SITE_NAME, url: `${SITE_URL}/` },
    },
  } : {
    title: 'A40 Build Log',
    description: buildLogDescription,
    path: '/a40',
    noindex: Boolean(slug),
  });

  const selectPost = (s: string) => navigate(`/a40/${s}`);
  const goToList = () => navigate('/a40');

  // Mobile: show list OR post
  if (isMobile) {
    if (slug && activePost) {
      return (
        <div className="blog-page blog-page--mobile">
          <PostContent
            post={activePost}
            prev={prev}
            next={next}
            onNav={selectPost}
            onBack={goToList}
            showBack
          />
        </div>
      );
    }

    return (
      <div className="blog-page blog-page--mobile">
        <nav className="blog-topbar" aria-label="Blog navigation">
          <Link to="/" className="blog-back-link">&larr; Portfolio</Link>
          <span className="blog-topbar-title">A40 Build Log</span>
          <Link to="/a40/roadmap" className="blog-roadmap-link">Roadmap &rarr;</Link>
        </nav>
        <div className="blog-mobile-list" role="list">
          <div className="blog-sidebar-divider" aria-hidden="true" />
          <p className="gc-under-construction" aria-hidden="true">
            &#9888; Under Construction &#9888;
          </p>
          <p className="gc-visitor-counter" aria-hidden="true">
            You are visitor #<span className="gc-counter-value">000{allPosts.length.toString().padStart(2, '0')}</span>
          </p>
          <div className="blog-sidebar-divider" aria-hidden="true" />
          {grouped.map(({ epic, posts }) => (
            <div key={epic.id} className="sb-epic-group sb-epic-group--mobile">
              <div className="sb-epic-header sb-epic-header--mobile">
                <span className={`sb-status-dot sb-dot--${epic.status}`} aria-hidden="true" />
                <span className="sb-epic-title">{epic.title}</span>
                <span className={`sb-epic-badge sb-badge--${epic.status}`}>
                  {statusLabel[epic.status]}
                </span>
              </div>
              {posts.map((post) => (
                <button
                  key={post.slug}
                  type="button"
                  className="sb-item sb-item--mobile"
                  onClick={() => selectPost(post.slug)}
                  role="listitem"
                >
                  <span className={`sb-status-dot sb-dot--${post.status}`} aria-hidden="true" />
                  <span className="sb-item-text">
                    <span className="sb-item-title">{post.title}</span>
                    {post.date && (
                      <time className="sb-item-date" dateTime={post.date}>
                        {new Date(post.date + 'T00:00').toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </time>
                    )}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Desktop: sidebar with epic groups + content
  return (
    <div className="blog-page blog-page--desktop">
      <aside className="blog-sidebar" aria-label="Post list">
        <div className="blog-sidebar-header">
          <Link to="/" className="blog-back-link">&larr; Portfolio</Link>
          <h1 className="blog-sidebar-title">A40 Build Log</h1>
          <p className="blog-sidebar-sub"><span>1950 Austin A40 Devon</span></p>
          <div className="blog-sidebar-divider" aria-hidden="true" />
          <p className="gc-under-construction" aria-hidden="true">
            &#9888; Under Construction &#9888;
          </p>
          <p className="gc-visitor-counter" aria-hidden="true">
            You are visitor #<span className="gc-counter-value">000{allPosts.length.toString().padStart(2, '0')}</span>
          </p>
          <div className="blog-sidebar-divider" aria-hidden="true" />
        </div>
        <nav className="blog-sidebar-nav">
          {grouped.map(({ epic, posts }) => (
            <EpicGroup
              key={epic.id}
              epic={epic}
              posts={posts}
              activeSlug={activeSlug}
              onSelect={selectPost}
            />
          ))}
        </nav>
        <div className="blog-sidebar-footer">
          <Link to="/a40/roadmap" className="blog-roadmap-link blog-roadmap-link--footer">
            Roadmap &rarr;
          </Link>
        </div>
      </aside>

      <PostContent
        post={activePost}
        prev={prev}
        next={next}
        onNav={selectPost}
      />
    </div>
  );
};
