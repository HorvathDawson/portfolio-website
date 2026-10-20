import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { centerOffset, onScrollFrame, onScrollMotion } from '../utils/scrollFrame';
import type { Project } from '../data/projects';

interface HoverHandlers {
  enter: () => void;
  leave: () => void;
}

/*
 * One shared hover tracker for every project card.
 *
 * Browsers don't fire mouseenter/mouseleave while the page scrolls under a
 * stationary cursor, so we also re-check which card is under the last known
 * pointer position on scroll. A single elementFromPoint hit-test per frame
 * replaces per-card pointermove/scroll listeners that each measured their
 * card's bounding box.
 */
const hoverHandlers = new Map<Element, HoverHandlers>();
let hoveredCard: Element | null = null;
let pointerX = -1;
let pointerY = -1;
let unsubscribeScroll: (() => void) | null = null;

const setHoveredCard = (card: Element | null) => {
  if (card === hoveredCard) return;
  if (hoveredCard) hoverHandlers.get(hoveredCard)?.leave();
  hoveredCard = card;
  if (card) hoverHandlers.get(card)?.enter();
};

const recheckHover = () => {
  if (pointerX < 0) return;
  const el = document.elementFromPoint(pointerX, pointerY);
  const card = el?.closest('.project-card') ?? null;
  setHoveredCard(card && hoverHandlers.has(card) ? card : null);
};

const trackPointer = (e: PointerEvent) => {
  pointerX = e.clientX;
  pointerY = e.clientY;
};

const registerCard = (card: Element, handlers: HoverHandlers) => {
  if (hoverHandlers.size === 0) {
    document.addEventListener('pointermove', trackPointer, { passive: true });
    unsubscribeScroll = onScrollFrame(recheckHover);
  }
  hoverHandlers.set(card, handlers);

  return () => {
    if (hoveredCard === card) hoveredCard = null;
    hoverHandlers.delete(card);
    if (hoverHandlers.size === 0) {
      document.removeEventListener('pointermove', trackPointer);
      unsubscribeScroll?.();
      unsubscribeScroll = null;
    }
  };
};

const setOpacity = (elements: NodeListOf<HTMLElement>, value: string) => {
  elements.forEach((el) => { el.style.opacity = value; });
};

/** Internal links use client-side routing; external ones open in a new tab. */
const ProjectLink: React.FC<{ project: Project; className?: string; children: React.ReactNode }> = ({
  project,
  className,
  children,
}) =>
  project.internal ? (
    <Link to={project.link!} className={className}>{children}</Link>
  ) : (
    <a
      href={project.link}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      {...(project.downloadable ? { download: true } : {})}
    >
      {children}
    </a>
  );

export const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const { animation } = project;

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    // Card visuals are static, so look the layers up once.
    const backgrounds = item.querySelectorAll<HTMLElement>('.background-layer');
    const foregrounds = item.querySelectorAll<HTMLElement>('.foreground-layer');
    const splashes = item.querySelectorAll<HTMLElement>('.splash-layer');

    // On stacked layouts CSS forces the coloured layers and glow on.
    const unregister = registerCard(item, {
      enter: () => {
        setOpacity(backgrounds, '0');
        setOpacity(foregrounds, '1');
        setOpacity(splashes, '1');
        item.classList.add('is-hovered');
      },
      leave: () => {
        setOpacity(backgrounds, '1');
        setOpacity(foregrounds, '0');
        setOpacity(splashes, '0');
        item.classList.remove('is-hovered');
      },
    });

    const onMouseEnter = () => setHoveredCard(item);
    const onMouseLeave = () => { if (hoveredCard === item) setHoveredCard(null); };
    item.addEventListener('mouseenter', onMouseEnter);
    item.addEventListener('mouseleave', onMouseLeave);

    // Scroll animation: measure the static media frame (the animated parts
    // move, so they can't be measured) and transform each [data-scroll] part.
    const frame = item.querySelector<HTMLElement>('.project-media-frame');
    const parts = item.querySelectorAll<HTMLElement>('[data-scroll]');
    let stopAnimation: (() => void) | undefined;
    if (animation && frame && parts.length) {
      const animate = (offset: number) => {
        parts.forEach((part) => { part.style.transform = animation(offset, part); });
      };
      // Reduced motion holds the centred pose.
      stopAnimation = onScrollMotion(frame, () => animate(centerOffset(frame)), () => animate(0));
    }

    return () => {
      item.removeEventListener('mouseenter', onMouseEnter);
      item.removeEventListener('mouseleave', onMouseLeave);
      unregister();
      stopAnimation?.();
    };
  }, [animation]);

  return (
    <div ref={itemRef} className={`project-card ${project.id}`} role="listitem" aria-label={project.title}>
      <div className="project-card-overlay" aria-hidden="true" />
      <div className="project-card-content content-width-constrained">
        <p className="project-category">{project.category}</p>
        <h2 className="section-title">
          {project.link ? (
            <ProjectLink project={project}>
              <span className="text-highlighted">{project.title}</span>
            </ProjectLink>
          ) : (
            <span className="text-highlighted">{project.title}</span>
          )}
        </h2>
        <p className="about-description">{project.description}</p>
        {project.link && project.buttonText && (
          <ProjectLink project={project} className="project-cta-button button">
            {project.buttonText}
          </ProjectLink>
        )}
      </div>
      <div className="project-card-media" aria-hidden="true">
        <div className="project-media-frame">
          {project.visual}
        </div>
      </div>
    </div>
  );
};
