// data/content.ts

export interface ParallaxLayer {
  id: string;
  src: string;
  depth: number;
}

export interface AboutMeContent {
  title: string;
  description: string;
  tentImage: string;
  logsImage: string;
}

export const parallaxLayers: ParallaxLayer[] = [
  { id: 'layer0', src: '/assets/header/layer-0.webp', depth: 0.1 },
  { id: 'layer1', src: '/assets/header/layer-1.webp', depth: 0.2 },
  { id: 'layer2', src: '/assets/header/layer-2.webp', depth: 0.3 },
  { id: 'layer3', src: '/assets/header/layer-3.webp', depth: 0.4 },
  { id: 'layer4', src: '/assets/header/layer-4.webp', depth: 0.5 },
  { id: 'layer5', src: '/assets/header/layer-5.webp', depth: 0.6 },
];

export const aboutMeContent: AboutMeContent = {
  title: "Hi, I'm Dawson Horvath!",
  description: `I grew up working in a mechanics shop, so I was pulling things apart and putting them back together long before I got into engineering. I studied Engineering Physics at UBC, which covers everything from quantum mechanics to control systems to machine design. Between the shop and the degree, I ended up as a generalist comfortable with a wrench or a compiler. Professionally I do mechatronics and software: robots, imaging pipelines, embedded systems, web apps.

I spend most of my free time outside. I'm a TDI tech diver, and I mountain bike, paraglide, mountaineer, and fish whenever I can. Emperor Ridge on Mount Robson is the standout so far.`,
  tentImage: '/assets/about/tent.webp',
  logsImage: '/assets/about/logs.webp'
};
