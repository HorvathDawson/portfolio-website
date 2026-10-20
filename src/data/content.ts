export interface AboutMeContent {
  title: string;
  description: string;
  tentImage: string;
  logsImage: string;
}

/**
 * Parallax header art: 3000x2000 layers (back to front) with 1500w copies
 * for phones, both written by scripts/make-header-images.py. Desktop
 * (above BREAKPOINTS.tablet) always gets the full art; smaller screens pick
 * by the header's rendered width (3:2, no taller than the viewport).
 */
export const HEADER_SIZES = '(min-width: 992px) 3000px, min(100vw, 150vh)';

export const headerSrcSet = (src: string) =>
  `${src.replace(/\.webp$/, '-1500.webp')} 1500w, ${src} 3000w`;

export const HEADER_TILE = '/assets/header/foreground-tile.webp';

export const parallaxLayers = [
  '/assets/header/layer-0.webp',
  '/assets/header/layer-1.webp',
  '/assets/header/layer-2.webp',
  '/assets/header/layer-3.webp',
  '/assets/header/layer-4.webp',
  '/assets/header/layer-5.webp',
];

export const aboutMeContent: AboutMeContent = {
  title: "Hi, I'm Dawson Horvath!",
  description: `I grew up working in a mechanics shop, so I was pulling things apart and putting them back together long before I got into engineering. I studied Engineering Physics at UBC, which covers everything from quantum mechanics to control systems to machine design. Between the shop and the degree, I ended up as a generalist comfortable with a wrench or a compiler. Professionally I do mechatronics and software: robots, imaging pipelines, embedded systems, web apps.

I spend most of my free time outside. I'm a TDI tech diver, and I mountain bike, paraglide, mountaineer, and fish whenever I can. Emperor Ridge on Mount Robson is the standout so far.`,
  tentImage: '/assets/about/tent.webp',
  logsImage: '/assets/about/logs.webp'
};
