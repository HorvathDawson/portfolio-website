import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { onScrollFrame } from '../../utils/scrollFrame';

export interface ProjectConfig {
  id: string;
  category: string;
  title: string;
  description: string;
  link?: string;
  buttonText?: string;
  downloadable?: boolean;
  /** When true, link uses client-side routing instead of opening a new tab. */
  internal?: boolean;
}

interface BaseProjectItemProps {
  config: ProjectConfig;
  className?: string;
  customAnimations?: (element: HTMLDivElement) => void | (() => void);
  children: React.ReactNode;
}

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

export const BaseProjectItem: React.FC<BaseProjectItemProps> = ({
  config,
  className = '',
  customAnimations,
  children
}) => {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const item = itemRef.current;
    if (!item) return;

    // Card visuals are static, so look the layers up once.
    const backgrounds = item.querySelectorAll<HTMLElement>('.background-layer');
    const foregrounds = item.querySelectorAll<HTMLElement>('.foreground-layer');
    const splashes = item.querySelectorAll<HTMLElement>('.splash-layer');

    // On stacked (<=991px) layouts CSS forces the coloured layers and glow on.
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

    // Apply custom animations if provided. If the function returns a cleanup, call it on unmount.
    const customCleanup = customAnimations?.(item);

    return () => {
      item.removeEventListener('mouseenter', onMouseEnter);
      item.removeEventListener('mouseleave', onMouseLeave);
      unregister();
      if (typeof customCleanup === 'function') customCleanup();
    };
  }, [customAnimations]);

  const rootClass = ['project-card', config.id, className];

  return (
    <div ref={itemRef} className={rootClass.filter(Boolean).join(' ')} role="listitem" aria-label={config.title}>
      <div className="project-card-overlay" aria-hidden="true" />
      <div className="project-card-content content-width-constrained">
        <p className="project-category">{config.category}</p>
        <h2 className="section-title">
          {config.link ? (
            config.internal ? (
              <Link to={config.link}>
                <span className="text-highlighted">{config.title}</span>
              </Link>
            ) : (
              <a href={config.link} target="_blank" rel="noopener noreferrer">
                <span className="text-highlighted">{config.title}</span>
              </a>
            )
          ) : (
            <span className="text-highlighted">{config.title}</span>
          )}
        </h2>
        <p className="about-description">{config.description}</p>
        
        {/* Simplified Button Logic */}
        {config.link && config.buttonText && (
          config.internal ? (
            <Link
              to={config.link}
              className="project-cta-button button"
              style={{ display: 'inline-block', marginTop: '18px' }}
            >
              {config.buttonText}
            </Link>
          ) : (
            <a
              href={config.link}
              target="_blank"
              rel="noopener noreferrer"
              className="project-cta-button button"
              {...(config.downloadable ? { download: true } : {})}
              style={{ display: 'inline-block', marginTop: '18px' }}
            >
              {config.buttonText}
            </a>
          )
        )}
      </div>
      <div className="project-card-media" aria-hidden="true">
        <div className="project-media-frame">
          {children}
        </div>
      </div>
    </div>
  );
};