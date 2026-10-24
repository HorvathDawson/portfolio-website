import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { loadPost, type BlogPost } from './blogData';
import { carPath, getCar, postPath, roadmapPath, type Car, type Epic } from './cars';
import { CATEGORIES, type Category, type PostMeta } from './frontmatter';
import { postsFor, serviceTable } from './postIndex';
import { CarSwitcher } from './CarSwitcher';
import { categoryLabel, formatDate, formatKm, statusLabel } from './format';
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

const PostItem: React.FC<{
  post: PostMeta;
  active: boolean;
  onSelect: (slug: string) => void;
  mobile?: boolean;
  showCategory?: boolean;
}> = ({ post, active, onSelect, mobile, showCategory }) => (
  <button
    type="button"
    className={`sb-item${mobile ? ' sb-item--mobile' : ''}${active ? ' sb-item--active' : ''}`}
    onClick={() => onSelect(post.slug)}
    aria-current={active ? 'page' : undefined}
    role="listitem"
  >
    <span className={`sb-status-dot sb-dot--${post.status}`} aria-hidden="true" />
    <span className="sb-item-text">
      <span className="sb-item-title">{post.title}</span>
      <span className="sb-item-sub">
        <PostDate date={post.date} className="sb-item-date" />
        {showCategory && post.category && <span className="sb-item-cat">{categoryLabel[post.category]}</span>}
        {post.mileage_km !== undefined && <span className="sb-item-km">{formatKm(post.mileage_km)}</span>}
      </span>
    </span>
  </button>
);

const EpicGroup: React.FC<{
  epic: Epic;
  posts: PostMeta[];
  activeSlug?: string;
  onSelect: (slug: string) => void;
  mobile?: boolean;
}> = ({ epic, posts, activeSlug, onSelect, mobile }) => {
  const hasActive = posts.some((p) => p.slug === activeSlug);
  const [open, setOpen] = useState(hasActive);

  if (mobile) {
    return (
      <div className="sb-epic-group sb-epic-group--mobile">
        <div className="sb-epic-header sb-epic-header--mobile">
          <span className={`sb-status-dot sb-dot--${epic.status}`} aria-hidden="true" />
          <span className="sb-epic-title">{epic.title}</span>
          <span className={`sb-epic-badge sb-badge--${epic.status}`}>{statusLabel[epic.status]}</span>
        </div>
        {posts.map((post) => <PostItem key={post.slug} post={post} active={false} onSelect={onSelect} mobile />)}
      </div>
    );
  }

  return (
    <div className="sb-epic-group">
      <button
        type="button"
        className={`sb-epic-header${hasActive ? ' sb-epic-header--active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open || hasActive}
      >
        <span className={`sb-status-dot sb-dot--${epic.status}`} aria-hidden="true" />
        <span className="sb-epic-title">{epic.title}</span>
        <span className={`sb-epic-badge sb-badge--${epic.status}`}>{statusLabel[epic.status]}</span>
        <span className={`sb-epic-chevron${open || hasActive ? ' sb-epic-chevron--open' : ''}`} aria-hidden="true">&#9656;</span>
      </button>
      {(open || hasActive) && (
        <div className="sb-epic-posts" role="list">
          {posts.map((post) => (
            <PostItem key={post.slug} post={post} active={post.slug === activeSlug} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
};

/** Build cars: posts grouped by the car's epics. */
const EpicList: React.FC<{ car: Car; activeSlug?: string; onSelect: (slug: string) => void; mobile?: boolean }> = ({
  car, activeSlug, onSelect, mobile,
}) => {
  const posts = postsFor(car.id);
  const groups = car.epics
    .map((epic) => ({ epic, posts: posts.filter((p) => p.epic === epic.id) }))
    .filter((g) => g.posts.length > 0);
  const loose = posts.filter((p) => !car.epics.some((e) => e.id === p.epic));
  return (
    <>
      {groups.map(({ epic, posts: ps }) => (
        <EpicGroup key={epic.id} epic={epic} posts={ps} activeSlug={activeSlug} onSelect={onSelect} mobile={mobile} />
      ))}
      {loose.length > 0 && (
        <div className="sb-plain-group" role="list" aria-label="Other posts">
          {loose.map((p) => <PostItem key={p.slug} post={p} active={p.slug === activeSlug} onSelect={onSelect} mobile={mobile} />)}
        </div>
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
const DatedList: React.FC<{ car: Car; activeSlug?: string; onSelect: (slug: string) => void; mobile?: boolean }> = ({
  car, activeSlug, onSelect, mobile,
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
          <div role="list">
            {reference.map((p) => <PostItem key={p.slug} post={p} active={p.slug === activeSlug} onSelect={onSelect} mobile={mobile} />)}
          </div>
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
        <div role="list">
          {log.map((p) => <PostItem key={p.slug} post={p} active={p.slug === activeSlug} onSelect={onSelect} mobile={mobile} showCategory />)}
          {log.length === 0 && <p className="sb-empty">No {category ? categoryLabel[category].toLowerCase() : ''} entries yet.</p>}
        </div>
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

const PostContent: React.FC<{
  meta: PostMeta;
  post?: BlogPost;
  prev?: PostMeta;
  next?: PostMeta;
  onNav: (slug: string) => void;
  onBack?: () => void;
}> = ({ meta, post, prev, next, onNav, onBack }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const shown = post?.slug === meta.slug ? post : undefined;

  useEffect(() => {
    if (!shown) return;
    // Honour ./post#heading links; otherwise start each post at the top.
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const target = hash ? document.getElementById(hash) : null;
    if (target && contentRef.current?.contains(target)) target.scrollIntoView();
    else contentRef.current?.scrollTo(0, 0);
  }, [shown]);

  // Links to other posts navigate in-app instead of reloading the page.
  const onBodyClick = (e: React.MouseEvent) => {
    const a = (e.target as HTMLElement).closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
    e.preventDefault();
    navigate(url.pathname + url.search + url.hash);
  };

  return (
    <div className="blog-content-panel" ref={contentRef}>
      {onBack && (
        <button type="button" className="blog-mobile-back" onClick={onBack}>
          &larr; All Posts
        </button>
      )}

      <article className="blog-article">
        <header className="blog-article-header">
          <PostDate date={meta.date} long className="blog-article-date" />
          <h1>{meta.title}</h1>
          <div className="blog-article-meta">
            {meta.category && <span className="blog-status blog-status--category">{categoryLabel[meta.category]}</span>}
            <span className={`blog-status blog-status--${meta.status}`}>{statusLabel[meta.status]}</span>
            {meta.tags.map((tag) => <span key={tag} className="blog-tag">{tag}</span>)}
          </div>
          <GarageFacts post={meta} />
        </header>

        {shown ? (
          <div className="blog-article-body" onClick={onBodyClick} dangerouslySetInnerHTML={{ __html: shown.html }} />
        ) : (
          <p className="blog-loading" role="status">Loading…</p>
        )}

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

const CarLog: React.FC<{ car: Car }> = ({ car }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { search } = useLocation();
  const bp = useBreakpoint();
  const isMobile = bp === 'mobile' || bp === 'tablet';
  useLockHtmlScroll();

  const posts = postsFor(car.id);
  const isBuild = car.kind === 'build';
  const index = slug ? posts.findIndex((p) => p.slug === slug) : -1;
  // Build cars open on their first post; garage cars on the car's home panel.
  // An unknown slug falls back to that view, kept out of search.
  const activeMeta = index >= 0 ? posts[index] : isBuild ? posts[0] : undefined;
  const activeIndex = activeMeta ? posts.indexOf(activeMeta) : -1;
  const post = useLoadedPost(car.id, activeMeta?.slug);
  const prev = activeIndex > 0 ? posts[activeIndex - 1] : undefined;
  const next = activeIndex >= 0 && activeIndex < posts.length - 1 ? posts[activeIndex + 1] : undefined;
  const showingPost = index >= 0;

  const path = showingPost ? postPath(car.id, posts[index].slug) : carPath(car.id);
  usePageMeta(showingPost ? {
    title: `${activeMeta!.title} · ${car.logTitle}`,
    description: (post?.slug === activeMeta!.slug && post.excerpt) || car.description,
    path,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: activeMeta!.title,
      datePublished: activeMeta!.date,
      url: absoluteUrl(path),
      mainEntityOfPage: absoluteUrl(path),
      isPartOf: { '@type': 'Blog', name: car.logTitle, url: absoluteUrl(carPath(car.id)) },
      author: { '@type': 'Person', '@id': `${SITE_URL}/#person`, name: SITE_NAME, url: `${SITE_URL}/` },
    },
  } : {
    title: car.logTitle,
    description: car.description,
    path,
    noindex: Boolean(slug),
  });

  // Keep the category filter when moving between posts.
  const selectPost = (s: string) => navigate(postPath(car.id, s) + search);
  const goToList = () => navigate(carPath(car.id) + search);
  const accent = { '--car-accent': car.accent } as React.CSSProperties;

  const list = isBuild
    ? <EpicList car={car} activeSlug={activeMeta?.slug} onSelect={selectPost} mobile={isMobile} />
    : <DatedList car={car} activeSlug={showingPost ? activeMeta?.slug : undefined} onSelect={selectPost} mobile={isMobile} />;
  const roadmapLink = car.roadmap && (
    <Link to={roadmapPath(car.id)} className={`blog-roadmap-link${isMobile ? '' : ' blog-roadmap-link--footer'}`}>
      Roadmap &rarr;
    </Link>
  );

  if (isMobile) {
    if (showingPost && activeMeta) {
      return (
        <div className="blog-page blog-page--mobile" style={accent}>
          <PostContent meta={activeMeta} post={post} prev={prev} next={next} onNav={selectPost} onBack={goToList} />
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
        <div className="blog-mobile-list">
          <CarSwitcher current={car.id} />
          <Counter count={posts.length} />
          {!isBuild && <div className="garage-mobile-home"><ServiceTable car={car} /></div>}
          {list}
        </div>
      </div>
    );
  }

  return (
    <div className="blog-page blog-page--desktop" style={accent}>
      <aside className="blog-sidebar" aria-label="Post list">
        <div className="blog-sidebar-header">
          <CarSwitcher current={car.id} />
          <h1 className="blog-sidebar-title">{car.logTitle}</h1>
          <p className="blog-sidebar-sub"><span>{car.year} {car.make} {car.model}</span></p>
          <Counter count={posts.length} />
        </div>
        <nav className="blog-sidebar-nav" aria-label="Posts">{list}</nav>
        {roadmapLink && <div className="blog-sidebar-footer">{roadmapLink}</div>}
      </aside>

      {activeMeta && (showingPost || isBuild) ? (
        <PostContent meta={activeMeta} post={post} prev={prev} next={next} onNav={selectPost} />
      ) : (
        <div className="blog-content-panel"><CarHome car={car} /></div>
      )}
    </div>
  );
};
