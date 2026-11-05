import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { SlimeLoader } from '../components/SlimeLoader';
import { NotFound } from '../components/NotFound';
import { usePageMeta } from '../utils/usePageMeta';
import { SITE_NAME, SITE_URL, absoluteUrl } from '../data/site';
import { loadPost, type BlogPost } from './blogData';
import { carPath, getCar, postPath, type Car } from './cars';
import { kindChipLabel } from './format';
import { rememberSheet } from './lastRead';
import { TOC_MIN, decoratePost, useOverflowHints, useScrollMemory } from './postDom';
import { sheetFor, sheetsFor, sheetNo, type Sheet } from './postIndex';
import { BottomBar } from './components/BottomBar';
import { CarHome } from './components/CarHome';
import { Dialog } from './components/Dialog';
import { Gags } from './components/Gags';
import { Lightbox, type LightboxImage } from './components/Lightbox';
import { SheetIndex } from './components/SheetIndex';
import { SheetRail } from './components/SheetRail';
import { SheetTabs } from './components/SheetTabs';
import { ShopBar, type Crumb } from './components/ShopBar';
import { TitleBlock } from './components/TitleBlock';
import { Toc, TocList } from './components/Toc';
import { WorkOrder } from './components/WorkOrder';
import './styles/garage.css';
import 'katex/dist/katex.min.css';

/* ============================================================
   /garage/:car and /garage/:car/:slug
   ------------------------------------------------------------
   Shop bar + sheet rail on top, then either the car home
   (CarHome) or a post as a drafting sheet: title block, work
   order, body with sticky TOC, prev/next sheet tabs. Phones get
   the bottom bar instead of the rail and TOC. The sheet index
   (drawer) is the same on every size.
   ============================================================ */

/** "E5 Fabrication" for epics, "Reference" / "Maintenance" for garage-log groups. */
const groupLabel = (s: Sheet) => (/^E\d+$/.test(s.group.short) ? `${s.group.short} ${s.group.title}` : s.group.title);

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

export const GarageBlog: React.FC = () => {
  const { car: carId } = useParams<{ car: string }>();
  const car = getCar(carId);
  return car ? <CarLog key={car.id} car={car} /> : <NotFound />;
};

const CarLog: React.FC<{ car: Car }> = ({ car }) => {
  const { slug } = useParams<{ slug: string }>();
  const sheet = slug ? sheetFor(car.id, slug) : undefined;
  const missing = Boolean(slug) && !sheet;
  const post = useLoadedPost(car.id, sheet?.post.slug);
  const [indexOpen, setIndexOpen] = useState(false);

  const path = sheet ? postPath(car.id, sheet.post.slug) : carPath(car.id);
  usePageMeta(sheet ? {
    title: `${sheet.post.title} · ${car.logTitle}`,
    description: (post?.slug === sheet.post.slug && post.excerpt) || car.description,
    path,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: sheet.post.title,
      datePublished: sheet.post.date,
      ...(sheet.post.updated ? { dateModified: sheet.post.updated } : {}),
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

  // Scroll to top / #hash / remembered offset once the page content is in.
  useScrollMemory(sheet ? post : car.id);

  const crumbs: Crumb[] = sheet
    ? [{ label: car.logTitle, to: carPath(car.id) }, { label: groupLabel(sheet) }, { label: `Sheet ${sheetNo(sheet.no)} of ${sheetNo(sheet.of)}` }]
    : [{ label: car.logTitle }];

  return (
    <div className={`garage${sheet ? ' garage--sheet' : ''}`} style={{ '--car-accent': car.accent } as React.CSSProperties}>
      <a className="skip-link" href="#main">Skip to content</a>
      <ShopBar car={car} crumbs={crumbs} onSheets={() => setIndexOpen(true)} />
      <SheetRail car={car} current={sheet} />
      <main className="bench" id="main" tabIndex={-1}>
        {missing && slug ? <PostNotFound car={car} slug={slug} />
          : sheet ? <PostSheet car={car} sheet={sheet} post={post} onSheets={() => setIndexOpen(true)} />
            : <CarHome car={car} />}
      </main>
      <SheetIndex car={car} current={sheet} open={indexOpen} onClose={() => setIndexOpen(false)} />
    </div>
  );
};

/* ── A post as a drafting sheet ────────────────────── */

const ZONES_X = ['8', '7', '6', '5', '4', '3', '2', '1'];

const PostSheet: React.FC<{ car: Car; sheet: Sheet; post?: BlogPost; onSheets: () => void }> = ({ car, sheet, post, onSheets }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { search } = useLocation();
  const meta = sheet.post;
  const shown = post?.slug === meta.slug ? post : undefined;
  const path = postPath(car.id, meta.slug);
  const decorated = useMemo(() => (shown ? decoratePost(shown.html, path) : undefined), [shown, path]);
  const toc = decorated && decorated.toc.length >= TOC_MIN ? decorated.toc : [];
  const [notice, setNotice] = useState<string>();
  const [contentsOpen, setContentsOpen] = useState(false);
  const [zoom, setZoom] = useState<LightboxImage | null>(null);

  const sheets = sheetsFor(car.id);
  const prev = sheets[sheet.no - 2];
  const next = sheets[sheet.no];

  useOverflowHints(bodyRef, decorated?.html);
  useEffect(() => { rememberSheet(car.id, meta.slug); }, [car.id, meta.slug]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(undefined), 1800);
    return () => clearTimeout(t);
  }, [notice]);

  // Delegated clicks in the post body: in-app links, heading anchors (copy
  // link), code copy buttons and figure zoom.
  const onBodyClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const copy = target.closest<HTMLButtonElement>('[data-copy-code]');
    if (copy) {
      const code = copy.closest('.code-block')?.querySelector('code')?.textContent ?? '';
      navigator.clipboard?.writeText(code).then(() => setNotice('Code copied'), () => setNotice('Copy failed'));
      return;
    }
    const fig = target.closest('figure');
    if (fig && (target.closest('[data-zoom]') || target.tagName === 'IMG')) {
      const img = fig.querySelector('img');
      if (img) {
        const caption = fig.querySelector('figcaption')?.textContent?.trim() ?? '';
        setZoom({ src: img.currentSrc || img.src, alt: img.alt, caption });
        return;
      }
    }
    const a = target.closest('a');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target) return;
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin) return;
    e.preventDefault();
    if (a.classList.contains('heading-anchor')) {
      navigate({ search, hash: url.hash }, { replace: true });
      navigator.clipboard?.writeText(url.href).then(() => setNotice('Link copied'), () => undefined);
      return;
    }
    navigate(url.pathname === window.location.pathname ? { search, hash: url.hash } : url.pathname + url.search + url.hash);
  };

  const kind = meta.kind && kindChipLabel[meta.kind];
  return (
    <>
      <article className="sheet">
        <div className="sheet-zones" aria-hidden="true">{ZONES_X.map((z) => <span key={z}>{z}</span>)}</div>
        <header className="sheet-head">
          <div className="sheet-head-main">
            <img className="sheet-art" src={car.art.outline} alt="" aria-hidden="true" />
            <p className="kicker">Sheet {sheetNo(sheet.no)} <b>/</b> {groupLabel(sheet)}{kind && kind !== sheet.group.title && <> <b>/</b> {kind}</>}</p>
            <h1 className="sheet-title">{meta.title}</h1>
            {meta.tags.length > 0 && (
              <ul className="tags" aria-label="Tags">{meta.tags.map((t) => <li key={t}>{t}</li>)}</ul>
            )}
          </div>
          <div className="sheet-head-side">
            <TitleBlock sheet={sheet} />
            <WorkOrder car={car.id} sheet={sheet} />
          </div>
        </header>

        <div className={`sheet-body${toc.length ? ' sheet-body--toc' : ''}`}>
          {decorated ? (
            <div className="prose" ref={bodyRef} onClick={onBodyClick} dangerouslySetInnerHTML={{ __html: decorated.html }} />
          ) : (
            <SlimeLoader size={72} label="Loading post…" className="sheet-loading" />
          )}
          {toc.length > 0 && <Toc toc={toc} body={bodyRef} />}
        </div>

        <SheetTabs car={car} prev={prev} next={next} />
      </article>
      <Gags count={sheets.length} />

      <BottomBar car={car} current={sheet} prev={prev} next={next} onSheets={onSheets} onContents={toc.length ? () => setContentsOpen(true) : undefined} />
      <Dialog open={contentsOpen} onClose={() => setContentsOpen(false)} label="On this sheet" className="dialog--contents">
        <TocList toc={toc} onPick={() => setContentsOpen(false)} />
      </Dialog>
      <Lightbox image={zoom} onClose={() => setZoom(null)} />
      <p className="toast" role="status" aria-live="polite">{notice ?? ''}</p>
    </>
  );
};

/** In-layout message for /garage/<car>/<unknown-slug>. */
const PostNotFound: React.FC<{ car: Car; slug: string }> = ({ car, slug }) => (
  <article className="sheet sheet--plain">
    <h1 className="sheet-title">Post not found</h1>
    <div className="prose">
      <p>
        There is no post called <code>{slug}</code> in the {car.logTitle}. It may have been renamed.
        Try the search or the sheet index, or go to the <Link to={carPath(car.id)}>{car.logTitle}</Link>.
      </p>
    </div>
  </article>
);
