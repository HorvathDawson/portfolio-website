import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { loadPost, type BlogPost } from './blogData';
import { carPath, getCar, postPath, roadmapPath, type Car, type Epic } from './cars';
import { CATEGORIES, type Category, type PostMeta } from './frontmatter';
import { postsFor, serviceTable } from './postIndex';
import { CarSwitcher } from './CarSwitcher';
import { PostSearch } from './PostSearch';
import { RoadmapTasks, TOC_MIN, TocAside, TocInline, decoratePost, useOverflowHints, useScrollMemory } from './PostTools';
import { categoryLabel, formatDate, formatKm, kindChipLabel, statusLabel } from './format';
import { NotFound } from '../components/NotFound';
import { useBreakpoint } from '../utils/useBreakpoint';
import { usePageMeta } from '../utils/usePageMeta';
import { SITE_NAME, SITE_URL, absoluteUrl } from '../data/site';
import './blogStyles.css';
import './garage.css';
import 'katex/dist/katex.min.css';

// Prevent double scrollbar: the portfolio sets html { overflow-y: scroll }
// but the blog manages its own scroll internally.
function useLockHtmlScroll() {
  useEffect(() => {
    document.documentElement.style.overflowY = 'hidden';
    return () => { document.documentElement.style.overflowY = ''; };
  }, []);
}

/** The rendered post for `car/slug`, loaded lazily (undefined while loading). */
function useLoadedPost(car: string, slug: string | undefined): BlogPost | undefined {
  const [loaded, setLoaded] = useState<{ key: string; post?: BlogPost }>();
  const key = slug ? `${car}/${slug}` : '';
  useEffect(() => {
    if (!slug) return;
    let live = true;
    loadPost(car, slug).then((post) => { if (live) setLoaded({ key: `${car}/${slug}`, post }); });
    return () => { live = false; };
  }, [car, slug]);
  return slug && loaded?.key === key ? loaded.post : undefined;
}

const PostDate: React.FC<{ date: string; long?: boolean; className: string }> = ({ date, long, className }) =>
  date ? <time className={className} dateTime={date}>{formatDate(date, long)}</time> : null;

/* ── Sidebar items ─────────────────────────────────── */

/** Posts in an epic often repeat its first word ("Narrowing: …" under
 *  "Narrowing & Geometry"); drop it there so the distinguishing part shows. */
function shortTitle(title: string, epic?: Epic): string {
  const m = title.match(/^([\p{L}\p{N}-]+):\s+(.+)$/u);
  if (!m || !epic) return title;
  return epic.title.toLowerCase().startsWith(m[1].toLowerCase()) ? m[2] : title;
}

const PostItem: React.FC<{
  post: PostMeta;
  active: boolean;
  search: string;
  epic?: Epic;
  mobile?: boolean;
  showCategory?: boolean;
}> = ({ post, active, search, epic, mobile, showCategory }) => {
  const label = shortTitle(post.title, epic);
  return (
    <li>
      <Link
        to={postPath(post.car, post.slug) + search}
        className={`sb-item${mobile ? ' sb-item--mobile' : ''}${active ? ' sb-item--active' : ''}`}
        aria-current={active ? 'page' : undefined}
        title={label !== post.title ? post.title : undefined}
      >
        <span className={`sb-status-dot sb-dot--${post.status}`} aria-hidden="true" />
        <span className="sb-item-text">
          <span className="sb-item-title">{label}</span>
          <span className="sb-item-sub">
            <PostDate date={post.updated ?? post.date} className="sb-item-date" />
            {post.kind === 'reference' && <span className="sb-item-kind">ref</span>}
            {showCategory && post.category && <span className="sb-item-cat">{categoryLabel[post.category]}</span>}
            {post.mileage_km !== undefined && <span className="sb-item-km">{formatKm(post.mileage_km)}</span>}
          </span>
        </span>
      </Link>
    </li>
  );
};

const EpicGroup: React.FC<{
  epic: Epic;
  posts: PostMeta[];
  activeSlug?: string;
  search: string;
  mobile?: boolean;
}> = ({ epic, posts, activeSlug, search, mobile }) => {
  const hasActive = posts.some((p) => p.slug === activeSlug);
  const [open, setOpen] = useState(hasActive);
  const badge = statusLabel[epic.status] ?? epic.status;

  if (mobile) {
    return (
      <div className="sb-epic-group sb-epic-group--mobile">
        <h2 className="sb-epic-header sb-epic-header--mobile">
          <span className={`sb-status-dot sb-dot--${epic.status}`} aria-hidden="true" />
          <span className="sb-epic-title">{epic.title}</span>
          <span className={`sb-epic-badge sb-badge--${epic.status}`}>{badge}</span>
        </h2>
        <ul className="sb-list">
          {posts.map((post) => <PostItem key={post.slug} post={post} active={false} search={search} epic={epic} mobile />)}
        </ul>
      </div>
    );
  }

  const shown = open || hasActive;
  return (
    <div className="sb-epic-group">
      <button
        type="button"
        className={`sb-epic-header${hasActive ? ' sb-epic-header--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={shown}
      >
        <span className={`sb-status-dot sb-dot--${epic.status}`} aria-hidden="true" />
        <span className="sb-epic-title">{epic.title}</span>
        <span className={`sb-epic-badge sb-badge--${epic.status}`}>{badge}</span>
        <span className={`sb-epic-chevron${shown ? ' sb-epic-chevron--open' : ''}`} aria-hidden="true">&#9656;</span>
      </button>
      {shown && (
        <ul className="sb-list sb-epic-posts">
          {posts.map((post) => (
            <PostItem key={post.slug} post={post} active={post.slug === activeSlug} search={search} epic={epic} />
          ))}
        </ul>
      )}
    </div>
  );
};

/** A build car's posts in sidebar order: by epic, then any without a known epic. */
function epicOrder(car: Car, posts: PostMeta[]): PostMeta[] {
  if (car.kind !== 'build') return posts;
  const grouped = car.epics.flatMap((e) => posts.filter((p) => p.epic === e.id));
  return [...grouped, ...posts.filter((p) => !car.epics.some((e) => e.id === p.epic))];
}

/** Build cars: posts grouped by the car's epics. */
const EpicList: React.FC<{ car: Car; activeSlug?: string; search: string; mobile?: boolean }> = ({
  car, activeSlug, search, mobile,
}) => {
  const posts = postsFor(car.id);
  const groups = car.epics
    .map((epic) => ({ epic, posts: posts.filter((p) => p.epic === epic.id) }))
    .filter((g) => g.posts.length > 0);
  const loose = posts.filter((p) => !car.epics.some((e) => e.id === p.epic));
  return (
    <>
      {groups.map(({ epic, posts: ps }) => (
        <EpicGroup key={epic.id} epic={epic} posts={ps} activeSlug={activeSlug} search={search} mobile={mobile} />
      ))}
      {loose.length > 0 && (
        <ul className="sb-list sb-plain-group" aria-label="Other posts">
          {loose.map((p) => <PostItem key={p.slug} post={p} active={p.slug === activeSlug} search={search} mobile={mobile} />)}
        </ul>
      )}
    </>
  );
};

/** Category filter for garage cars, kept in `?category=`. */
function useCategoryFilter(): [Category | null, (c: Category | null) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('category');
  const current = CATEGORIES.includes(raw as Category) ? (raw as Category) : null;
  const set = (c: Category | null) => setParams((prev) => {
    const p = new URLSearchParams(prev);
    if (c) p.set('category', c);
    else p.delete('category');
    return p;
  }, { replace: true });
  return [current, set];
}

/** Garage cars: reference posts, then a dated log (newest first), filterable by category. */
const DatedList: React.FC<{ car: Car; activeSlug?: string; search: string; mobile?: boolean }> = ({
  car, activeSlug, search, mobile,
}) => {
  const [category, setCategory] = useCategoryFilter();
  const posts = postsFor(car.id);
  const reference = posts.filter((p) => p.kind === 'reference');
  const log = posts
    .filter((p) => p.kind !== 'reference' && (!category || p.category === category))
    .slice()
    .reverse();
  const present = CATEGORIES.filter((c) => posts.some((p) => p.category === c));

  return (
    <>
      {reference.length > 0 && (
        <div className="sb-plain-group">
          <h2 className="sb-group-title">Reference</h2>
          <ul className="sb-list">
            {reference.map((p) => <PostItem key={p.slug} post={p} active={p.slug === activeSlug} search={search} mobile={mobile} />)}
          </ul>
        </div>
      )}
      <div className="sb-plain-group">
        <h2 className="sb-group-title">Log</h2>
        <div className="garage-filter" role="group" aria-label="Filter by category">
          <button type="button" className="garage-chip" aria-pressed={!category} onClick={() => setCategory(null)}>All</button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className="garage-chip"
              aria-pressed={category === c}
              onClick={() => setCategory(category === c ? null : c)}
              disabled={!present.includes(c)}
            >
              {categoryLabel[c]}
            </button>
          ))}
        </div>
        <ul className="sb-list">
          {log.map((p) => <PostItem key={p.slug} post={p} active={p.slug === activeSlug} search={search} mobile={mobile} showCategory />)}
        </ul>
        {log.length === 0 && <p className="sb-empty">No {category ? categoryLabel[category].toLowerCase() : ''} entries yet.</p>}
      </div>
    </>
  );
};

/* ── Service table (garage cars) ───────────────────── */

const ServiceTable: React.FC<{ car: Car }> = ({ car }) => {
  const rows = serviceTable(car.id);
  return (
    <section className="garage-service" aria-labelledby="garage-service-h">
      <h2 id="garage-service-h">Service record</h2>
      {rows.length === 0 ? (
        <p className="garage-service-empty">
          No services logged yet.
        </p>
      ) : (
        <div className="garage-table-wrap">
          <table>
            <thead><tr><th scope="col">Item</th><th scope="col">Last done</th><th scope="col">Mileage</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.item}>
                  <th scope="row"><Link to={postPath(car.id, r.post.slug)}>{r.item}</Link></th>
                  <td>{formatDate(r.date)}</td>
                  <td>{r.mileage_km !== undefined ? formatKm(r.mileage_km) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

/** A garage car's landing panel: what it is, the service table, the latest entries. */
const CarHome: React.FC<{ car: Car }> = ({ car }) => {
  const latest = postsFor(car.id).filter((p) => p.kind !== 'reference').slice(-5).reverse();
  return (
    <article className="blog-article garage-home">
      <header className="blog-article-header">
        <span className="blog-article-date">{car.year} {car.make} {car.model}</span>
        <h1>{car.logTitle}</h1>
        <p className="garage-home-lede">{car.description}</p>
      </header>
      <ServiceTable car={car} />
      {latest.length > 0 && (
        <section className="garage-recent" aria-labelledby="garage-recent-h">
          <h2 id="garage-recent-h">Latest entries</h2>
          <ul>
            {latest.map((p) => (
              <li key={p.slug}>
                <Link to={postPath(car.id, p.slug)}>{p.title}</Link>{' '}
                <span className="garage-recent-meta">
                  {formatDate(p.date)}
                  {p.category && ` · ${categoryLabel[p.category]}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
};

/* ── Post content panel ────────────────────────────── */

const GarageFacts: React.FC<{ post: PostMeta }> = ({ post }) => {
  if (post.mileage_km === undefined && !post.cost && post.parts.length === 0) return null;
  return (
    <dl className="garage-facts">
      {post.mileage_km !== undefined && (<><dt>Mileage</dt><dd>{formatKm(post.mileage_km)}</dd></>)}
      {post.cost && (<><dt>Cost</dt><dd>{post.cost}</dd></>)}
      {post.parts.length > 0 && (<><dt>Parts</dt><dd>{post.parts.join(', ')}</dd></>)}
    </dl>
  );
};

const PostNavLink: React.FC<{ car: Car; post: PostMeta; dir: 'prev' | 'next'; search: string }> = ({ car, post, dir, search }) => (
  <Link to={postPath(car.id, post.slug) + search} className={`blog-nav-btn blog-nav-${dir}`} rel={dir}>
    <span className="blog-nav-dir">{dir === 'prev' ? '← Previous' : 'Next →'}</span>
    <span className="blog-nav-title">{post.title}</span>
  </Link>
);

const PostContent: React.FC<{
  car: Car;
  meta: PostMeta;
  post?: BlogPost;
  prev?: PostMeta;
  next?: PostMeta;
  search: string;
  mobile?: boolean;
}> = ({ car, meta, post, prev, next, search, mobile }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const shown = post?.slug === meta.slug ? post : undefined;
  const path = postPath(car.id, meta.slug);
  const decorated = useMemo(() => (shown ? decoratePost(shown.html, path) : undefined), [shown, path]);
  const toc = decorated && decorated.toc.length >= TOC_MIN ? decorated.toc : [];
  const [copied, setCopied] = useState<string>();

  useScrollMemory(contentRef, decorated);
  useOverflowHints(bodyRef, decorated?.html);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(undefined), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  // Links to other posts navigate in-app instead of reloading the page;
  // heading anchors copy their link.
  const onBodyClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    if (a.classList.contains('heading-anchor')) {
      navigate({ search, hash: url.hash }, { replace: true });
      navigator.clipboard?.writeText(url.href).then(() => setCopied(url.hash.slice(1)), () => undefined);
      return;
    }
    navigate(url.pathname === window.location.pathname ? { search, hash: url.hash } : url.pathname + url.search + url.hash);
  };

  const kind = meta.kind && kindChipLabel[meta.kind];
  return (
    <div className="blog-content-panel" ref={contentRef} tabIndex={-1}>
      {mobile && (
        <nav className="blog-post-bar" aria-label="Post navigation">
          <Link to={carPath(car.id) + search} className="blog-post-bar-back">&larr; Posts</Link>
          <span className="blog-post-bar-title">{car.logTitle}</span>
          {prev && <Link to={postPath(car.id, prev.slug) + search} className="blog-post-bar-step" aria-label={`Previous: ${prev.title}`} title={prev.title}>&lsaquo;</Link>}
          {next && <Link to={postPath(car.id, next.slug) + search} className="blog-post-bar-step" aria-label={`Next: ${next.title}`} title={next.title}>&rsaquo;</Link>}
        </nav>
      )}

      <div className={`blog-post-layout${toc.length ? ' blog-post-layout--toc' : ''}`}>
        <article className="blog-article">
          <header className="blog-article-header">
            <p className="blog-article-dates">
              <PostDate date={meta.date} long className="blog-article-date" />
              {meta.updated && meta.updated !== meta.date && (
                <span className="blog-article-date"> · Updated <time dateTime={meta.updated}>{formatDate(meta.updated, true)}</time></span>
              )}
            </p>
            <h1>{meta.title}</h1>
            <div className="blog-article-meta">
              {kind && <span className={`blog-status blog-status--kind blog-status--kind-${meta.kind}`}>{kind}</span>}
              {meta.category && <span className="blog-status blog-status--category">{categoryLabel[meta.category]}</span>}
              <span className={`blog-status blog-status--${meta.status}`}>{statusLabel[meta.status] ?? meta.status}</span>
              {meta.tags.map((tag) => <span key={tag} className="blog-tag">{tag}</span>)}
            </div>
            <GarageFacts post={meta} />
            <RoadmapTasks car={car.id} slug={meta.slug} />
            {toc.length > 0 && <TocInline toc={toc} />}
          </header>

          {decorated ? (
            <div className="blog-article-body" ref={bodyRef} onClick={onBodyClick} dangerouslySetInnerHTML={{ __html: decorated.html }} />
          ) : (
            <p className="blog-loading" role="status">Loading…</p>
          )}

          <nav className="blog-article-nav" aria-label="Previous and next posts">
            {prev ? <PostNavLink car={car} post={prev} dir="prev" search={search} /> : <span />}
            {next ? <PostNavLink car={car} post={next} dir="next" search={search} /> : <span />}
          </nav>
          {mobile && <div className="blog-post-cars"><CarSwitcher current={car.id} /></div>}
        </article>
        {toc.length > 0 && <TocAside toc={toc} scroller={contentRef} />}
      </div>
      <p className="heading-copied" role="status" aria-live="polite">{copied ? 'Link copied' : ''}</p>
    </div>
  );
};

/** In-layout message for /garage/<car>/<unknown-slug>. */
const PostNotFound: React.FC<{ car: Car; slug: string }> = ({ car, slug }) => (
  <article className="blog-article blog-not-found">
    <header className="blog-article-header">
      <h1>Post not found</h1>
    </header>
    <p>
      There is no post called <code>{slug}</code> in the {car.logTitle}. It may have been renamed.
      Try the search, or go to the <Link to={carPath(car.id)}>{car.logTitle}</Link>.
    </p>
  </article>
);

/* ── Header bits ───────────────────────────────────── */

const Counter: React.FC<{ count: number }> = ({ count }) => (
  <>
    <div className="blog-sidebar-divider" aria-hidden="true" />
    <p className="gc-under-construction" aria-hidden="true">&#9888; Under Construction &#9888;</p>
    <p className="gc-visitor-counter" aria-hidden="true">
      You are visitor #<span className="gc-counter-value">000{count.toString().padStart(2, '0')}</span>
    </p>
    <div className="blog-sidebar-divider" aria-hidden="true" />
  </>
);

/* ── Main layout ───────────────────────────────────── */

export const GarageBlog: React.FC = () => {
  const { car: carId } = useParams<{ car: string }>();
  const car = getCar(carId);
  return car ? <CarLog key={car.id} car={car} /> : <NotFound />;
};

/** The mobile post list, with its scroll position kept across Back. */
const MobileList: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  useScrollMemory(ref, true, false);
  return <div className="blog-mobile-list" ref={ref}>{children}</div>;
};

const CarLog: React.FC<{ car: Car }> = ({ car }) => {
  const { slug } = useParams<{ slug: string }>();
  const { search } = useLocation();
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile' || bp === 'tablet';
  useLockHtmlScroll();

  const isBuild = car.kind === 'build';
  const posts = epicOrder(car, postsFor(car.id));
  const found = slug ? posts.find((p) => p.slug === slug) : undefined;
  const missing = Boolean(slug) && !found;
  // Build cars open on their overview post (else the first in sidebar order);
  // garage cars on the car's home panel.
  const landing = isBuild ? posts.find((p) => p.slug === 'overview') ?? posts[0] : undefined;
  const activeMeta = slug ? found : landing;
  const activeIndex = activeMeta ? posts.indexOf(activeMeta) : -1;
  const post = useLoadedPost(car.id, activeMeta?.slug);
  const prev = activeIndex > 0 ? posts[activeIndex - 1] : undefined;
  const next = activeIndex >= 0 && activeIndex < posts.length - 1 ? posts[activeIndex + 1] : undefined;
  const showingPost = Boolean(found);

  const path = found ? postPath(car.id, found.slug) : carPath(car.id);
  usePageMeta(found ? {
    title: `${found.title} · ${car.logTitle}`,
    description: (post?.slug === found.slug && post.excerpt) || car.description,
    path,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: found.title,
      datePublished: found.date,
      ...(found.updated ? { dateModified: found.updated } : {}),
      url: absoluteUrl(path),
      mainEntityOfPage: absoluteUrl(path),
      isPartOf: { '@type': 'Blog', name: car.logTitle, url: absoluteUrl(carPath(car.id)) },
      author: { '@type': 'Person', '@id': `${SITE_URL}/#person`, name: SITE_NAME, url: `${SITE_URL}/` },
    },
  } : {
    title: missing ? `Post not found · ${car.logTitle}` : car.logTitle,
    description: car.description,
    path,
    noindex: missing,
  });

  const accent = { '--car-accent': car.accent } as React.CSSProperties;
  const list = isBuild
    ? <EpicList car={car} activeSlug={activeMeta?.slug} search={search} mobile={isMobile} />
    : <DatedList car={car} activeSlug={showingPost ? activeMeta?.slug : undefined} search={search} mobile={isMobile} />;
  const roadmapLink = car.roadmap && (
    <Link to={roadmapPath(car.id)} className={`blog-roadmap-link${isMobile ? '' : ' blog-roadmap-link--footer'}`}>
      Roadmap &rarr;
    </Link>
  );

  if (isMobile) {
    if (showingPost && activeMeta) {
      return (
        <div className="blog-page blog-page--mobile" style={accent}>
          <PostContent car={car} meta={activeMeta} post={post} prev={prev} next={next} search={search} mobile />
        </div>
      );
    }
    return (
      <div className="blog-page blog-page--mobile" style={accent}>
        <nav className="blog-topbar" aria-label="Blog navigation">
          <Link to="/" className="blog-back-link">&larr; Portfolio</Link>
          <span className="blog-topbar-title">{car.logTitle}</span>
          {roadmapLink}
        </nav>
        <MobileList>
          {missing && slug && <div className="blog-mobile-missing"><PostNotFound car={car} slug={slug} /></div>}
          <CarSwitcher current={car.id} />
          <PostSearch car={car.id} />
          <Counter count={posts.length} />
          {!isBuild && <div className="garage-mobile-home"><ServiceTable car={car} /></div>}
          {list}
        </MobileList>
      </div>
    );
  }

  return (
    <div className="blog-page blog-page--desktop" style={accent}>
      <aside className="blog-sidebar" aria-label="Post list">
        <div className="blog-sidebar-header">
          <CarSwitcher current={car.id} />
          <p className="blog-sidebar-title">{car.logTitle}</p>
          <p className="blog-sidebar-sub">{car.year} {car.make} {car.model}</p>
          <Counter count={posts.length} />
          <PostSearch car={car.id} />
        </div>
        <nav className="blog-sidebar-nav" aria-label="Posts">{list}</nav>
        {roadmapLink && <div className="blog-sidebar-footer">{roadmapLink}</div>}
      </aside>

      {missing && slug ? (
        <div className="blog-content-panel"><PostNotFound car={car} slug={slug} /></div>
      ) : activeMeta ? (
        <PostContent car={car} meta={activeMeta} post={post} prev={prev} next={next} search={search} />
      ) : (
        <div className="blog-content-panel"><CarHome car={car} /></div>
      )}
    </div>
  );
};
