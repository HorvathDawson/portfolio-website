import React, { useRef } from 'react';
import { ArtLayer } from './ArtLayer';
import { useContainFit } from '../../utils/useContainFit';
import './DeviceDisplay.css';

const ART = '/assets/projects/devices';

export type Device = 'desktop-phone' | 'tablet' | 'tv';

/** Shape of a screen, which sets its rounding and placeholder layout. */
type ScreenKind = 'wide' | 'tablet' | 'phone' | 'tv';

interface Screen {
  kind: ScreenKind;
  /** Position in percent of the 420×330 canvas, as printed by scripts/make_device_art.py. */
  left: number;
  top: number;
  width: number;
  height: number;
}

const SCREENS: Record<Device, Screen[]> = {
  'desktop-phone': [
    { kind: 'wide', left: 7.62, top: 6.06, width: 60, height: 43.64 },
    { kind: 'phone', left: 75.48, top: 36.67, width: 14.29, height: 38.79 },
  ],
  tablet: [{ kind: 'tablet', left: 28.1, top: 7.88, width: 36.19, height: 69.7 }],
  tv: [{ kind: 'tv', left: 11.43, top: 6.06, width: 77.14, height: 52.12 }],
};

const ROUNDING: Record<ScreenKind, string> = {
  wide: '1.5% / 2%',
  tablet: '4% / 2.6%',
  phone: '15% / 7%',
  tv: '0.6% / 1%',
};

/** A made-up app, drawn in CSS, for a screen that has no project yet. */
const PlaceholderScreen: React.FC<{ kind: ScreenKind }> = ({ kind }) =>
  kind === 'tv' ? (
    <div className="device-placeholder device-placeholder--tv">
      <div className="device-placeholder-glow" />
      <span className="device-placeholder-play" />
      <div className="device-placeholder-progress">
        <span />
      </div>
      <span className="device-placeholder-label">Coming soon</span>
    </div>
  ) : (
    <div className={`device-placeholder device-placeholder--${kind}`}>
      <div className="device-placeholder-glow" />
      {kind === 'phone' && <span className="device-placeholder-island" />}
      <div className="device-placeholder-bar">
        <span />
        <span />
        <span />
      </div>
      <div className="device-placeholder-hero">
        <span className="device-placeholder-line device-placeholder-line--title" />
        <span className="device-placeholder-line" />
        <span className="device-placeholder-line device-placeholder-line--short" />
      </div>
      <div className="device-placeholder-cards">
        <span />
        <span />
        <span />
      </div>
      <span className="device-placeholder-label">Coming soon</span>
    </div>
  );

interface DeviceDisplayProps {
  device: Device;
  /** What's on each screen, in order (desktop first); a placeholder app until a project fills it. */
  screens?: React.ReactNode[];
}

/**
 * Line-art desktop and phone, tablet or TV (outline at rest, gradient on
 * hover) with live content on its screens: a project's recordings, or a
 * placeholder app on spare cards.
 */
export const DeviceDisplay: React.FC<DeviceDisplayProps> = ({ device, screens = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useContainFit(containerRef, contentRef, 420 / 330);

  return (
    <div ref={containerRef} className="device-display" data-scroll>
      <div ref={contentRef} className="device-display-canvas">
        <ArtLayer layer="foreground" src={`${ART}/${device}-colored.svg`} style={{ zIndex: 3 }} />
        <ArtLayer layer="background" src={`${ART}/${device}-outline.svg`} style={{ zIndex: 1 }} />
        {SCREENS[device].map(({ kind, left, top, width, height }, i) => (
          <div
            key={i}
            className="splash-layer device-screen"
            style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, borderRadius: ROUNDING[kind] }}
          >
            {screens[i] ?? <PlaceholderScreen kind={kind} />}
          </div>
        ))}
      </div>
    </div>
  );
};
