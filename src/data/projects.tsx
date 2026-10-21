import type { ReactElement } from 'react';
import { LayeredArt } from '../components/visuals/LayeredArt';
import { SpinningLeg } from '../components/visuals/SpinningLeg';
import { LaptopWithScreen } from '../components/visuals/LaptopWithScreen';
import { lidTransform } from '../components/visuals/laptopLid';
import { MotorcycleParts } from '../components/visuals/MotorcycleParts';
import { FumeExtractorArm } from '../components/visuals/FumeExtractorArm';
import { TabletDisplay } from '../components/visuals/TabletDisplay';
import { DeviceDisplay } from '../components/visuals/DeviceDisplay';
import { DesktopDisplay } from '../components/visuals/DesktopDisplay';
import { RESUME_VIEW_PATH } from './site';

/**
 * Transform for one `[data-scroll]` part of a card's visual, given the card's
 * offset from the viewport centre (see `centerOffset`).
 */
export type ScrollAnimation = (offset: number, part: HTMLElement) => string;

export interface Project {
  id: string;
  category: string;
  title: string;
  description: string;
  link?: string;
  buttonText?: string;
  /** When true, link uses client-side routing instead of opening a new tab. */
  internal?: boolean;
  visual: ReactElement;
  /** Clicking the visual also follows the link. */
  linkVisual?: boolean;
  animation?: ScrollAnimation;
  /** A card waiting for a project: hidden unless the address has ?drafts. */
  draft?: boolean;
}

/** How far below centre a card still is (0 once it reaches the centre). */
const below = (offset: number) => Math.max(0, offset);

/** The robot's layers cross-fade instead of switching instantly. */
const FADE = { transition: 'opacity 0.3s ease' };

const BUELL_ANGLE = (60 * Math.PI) / 180;

export const projects: Project[] = [
  {
    id: 'bc-fishing-regulations',
    category: 'Web App',
    title: 'Can I Fish This?',
    description: 'A web app that simplifies BC fishing regulations, helping anglers quickly find what they can fish, where, and when.',
    link: 'https://canifishthis.ca',
    buttonText: 'Visit Site',
    // Screens play recordings of the live site from scripts/record-demos.mjs (the "Record demos" GitHub Action).
    visual: <DesktopDisplay />,
    // Monitor rises into place.
    animation: (offset) => `translate3d(0, ${60 * below(offset)}px, 0)`,
  },
  {
    id: 'opensim2real',
    category: 'Opensource Robotics',
    title: 'OpenSim2Real',
    description: 'Open Sim2Real is a open source project striving to develop a simple inexpensive platform for Sim2Real research.',
    link: 'https://opensim2real.github.io/os2r-superbuild/docs/index.html',
    buttonText: 'Explore More',
    visual: <SpinningLeg />,
  },
  {
    id: 'a40austin',
    category: 'In Progress',
    title: '1950 A40 Austin',
    description: 'Currently modernizing a 1950 Austin A40 by upgrading its suspension, brakes, and motor, blending modern performance with a classic design.',
    link: '/a40',
    buttonText: 'Build Log',
    internal: true,
    visual: (
      <LayeredArt
        width={1205}
        height={757}
        data-scroll
        layers={[
          { layer: 'foreground', src: '/assets/projects/a40-austin/colored.svg' },
          { layer: 'background', src: '/assets/projects/a40-austin/outline.svg' },
        ]}
      />
    ),
    // Car drives in from the lower left.
    animation: (offset) => `translate3d(${-200 * below(offset)}px, ${100 * below(offset)}px, 0)`,
  },
  {
    id: 'self-driving-car',
    category: 'Simulation',
    title: 'Self Driving Car',
    description: 'Simulated a self-driving robot in Gazebo and ROS.',
    visual: <LaptopWithScreen />,
    // Lid swings up from closed (lying on the keyboard) to upright as the card reaches the middle.
    animation: (offset, part) => lidTransform(part, 90 * Math.min(1, below(offset))),
  },
  {
    id: 'robot253',
    category: 'Competition',
    title: 'Autonomous Robot',
    description: 'Designed an autonomous robot for the Engineering Physics Robot Competition, featuring a custom drivetrain, SPI communication, control loop and mechanical systems.',
    visual: (
      <LayeredArt
        width={800}
        height={600}
        layers={[
          { layer: 'foreground', src: '/assets/projects/competition-robot/colored.webp', alt: 'Robot 253 foreground', style: FADE },
          { layer: 'background', src: '/assets/projects/competition-robot/outline.webp', alt: 'Robot 253 background', style: FADE },
          { layer: 'splash', src: '/assets/projects/competition-robot/glow.webp', alt: 'Robot 253 splash', style: FADE },
        ]}
      />
    ),
  },
  {
    id: 'buell',
    category: 'Fix',
    title: 'Buell Motor Rebuild',
    description: 'Rebuilt a 2008 Buell XB9SX motor by disassembling, inspecting, and replacing worn components, requiring precision and expertise to restore performance and reliability.',
    visual: <MotorcycleParts />,
    // Engine is assembled when centred and explodes along a 60° line either side.
    animation: (offset, part) => {
      const distance = 40 * Number(part.dataset.scroll) * Math.min(1, Math.abs(offset));
      return `translate3d(${distance * Math.cos(BUELL_ANGLE)}px, ${-distance * Math.sin(BUELL_ANGLE)}px, 0)`;
    },
  },
  {
    id: 'fume-extractor',
    category: 'Project',
    title: 'Fume Extractor',
    description: 'Designed and built a low-cost fume extractor arm with an inline fan, counterbalance system, friction joints, and a welded, mobile stand.',
    visual: <FumeExtractorArm />,
  },
  {
    id: 'esk8',
    category: 'Project',
    title: 'DIY E-Sk8',
    description: 'Designed and built a DIY electric skateboard with dual 6374 motors, a custom 10s4p Li-ion battery, and Vedder ESCs, optimized for daily commuting with waterproofing and tailored gearing.',
    visual: (
      <LayeredArt
        width={900}
        height={600}
        layers={[
          { layer: 'foreground', src: '/assets/projects/electric-skateboard/colored.webp' },
          { layer: 'background', src: '/assets/projects/electric-skateboard/outline.svg' },
        ]}
      />
    ),
  },
  {
    id: '3dprinter',
    category: 'Scholarship',
    title: 'Low-Cost 3D Printer Build',
    description: 'Built in 2015, when 3D printers were still rare and expensive, this low-cost printer was inspired by the open-source Prusa i3: an Arduino Mega with a RAMPS 1.4 board, an MDF frame and custom wiring, balancing print quality against cost.',
    visual: (
      <LayeredArt
        width={1000}
        height={700}
        layers={[
          { layer: 'foreground', src: '/assets/projects/3d-printer/colored.webp' },
          { layer: 'background', src: '/assets/projects/3d-printer/outline.webp' },
        ]}
      />
    ),
  },
  {
    id: 'resume',
    category: 'Offline Website',
    title: 'Resume',
    description: 'If you feel inclined to take the experience offline.',
    link: RESUME_VIEW_PATH,
    buttonText: 'View Resume',
    visual: <TabletDisplay />,
    linkVisual: true,
  },
  // Spare cards for future projects. To use one, fill in the text and link,
  // pass the project's screens as `screens` (<AnimatedImage> recordings, like
  // the other cards; desktop first) and drop `draft`.
  {
    id: 'upcoming-desktop-phone',
    category: 'Coming Soon',
    title: 'Next Web Project',
    description: 'Something new is in the works, on desktop and mobile. Check back soon.',
    visual: <DeviceDisplay device="desktop-phone" />,
    draft: true,
    // Rises into place, like the monitor above.
    animation: (offset) => `translate3d(0, ${60 * below(offset)}px, 0)`,
  },
  {
    id: 'upcoming-tablet',
    category: 'Coming Soon',
    title: 'Next Tablet Project',
    description: 'Something new is in the works. Check back soon.',
    visual: <DeviceDisplay device="tablet" />,
    draft: true,
  },
  {
    id: 'upcoming-tv',
    category: 'Coming Soon',
    title: 'Next Big-Screen Project',
    description: 'Something new is in the works. Check back soon.',
    visual: <DeviceDisplay device="tv" />,
    draft: true,
  },
];

/** Drafts show in development and with ?drafts in the address. */
export const visibleProjects = (search: string) =>
  import.meta.env.DEV || new URLSearchParams(search).has('drafts') ? projects : projects.filter((p) => !p.draft);
