import React, { useRef } from 'react';
import { ArtLayer } from './ArtLayer';
import { useContainFit } from '../../utils/useContainFit';
import './DeviceDisplay.css';

const ART = '/assets/projects/upcoming';

export type Device = 'computer' | 'tablet' | 'phone';

/**
 * Where each device's screen sits in its art, in percent of the 420×330
 * canvas, as printed by scripts/make_device_art.py.
 */
const SCREENS: Record<Device, { left: number; top: number; width: number; height: number; rotate?: number }> = {
  computer: { left: 17.62, top: 6.06, width: 65.71, height: 47.27 },
  tablet: { left: 28.1, top: 7.88, width: 36.19, height: 69.7 },
  phone: { left: 31.9, top: 8.48, width: 29.52, height: 80, rotate: -10 },
};

const ROUNDING: Record<Device, string> = {
  computer: '1.5% / 2%',
  tablet: '4% / 2.6%',
  phone: '13% / 6.5%',
};

/** A made-up app, drawn in CSS, for a screen that has no project yet. */
const PlaceholderScreen: React.FC<{ device: Device }> = ({ device }) => (
  <div className={`device-placeholder device-placeholder--${device}`}>
    <div className="device-placeholder-glow" />
    {device === 'phone' && <span className="device-placeholder-island" />}
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
  /** What's on the screen; a placeholder app until a project fills it. */
  screen?: React.ReactNode;
}

/**
 * Line-art computer, tablet or phone (outline at rest, gradient on hover)
 * with live content on its screen. Used for cards still waiting for a project.
 */
export const DeviceDisplay: React.FC<DeviceDisplayProps> = ({ device, screen }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { left, top, width, height, rotate } = SCREENS[device];

  useContainFit(containerRef, contentRef, 420 / 330);

  return (
    <div ref={containerRef} className="device-display" data-scroll>
      <div ref={contentRef} className="device-display-canvas">
        <ArtLayer layer="foreground" src={`${ART}/${device}-colored.svg`} style={{ zIndex: 3 }} />
        <ArtLayer layer="background" src={`${ART}/${device}-outline.svg`} style={{ zIndex: 1 }} />
        <div
          className="splash-layer device-screen"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            width: `${width}%`,
            height: `${height}%`,
            borderRadius: ROUNDING[device],
            transform: rotate ? `rotate(${rotate}deg)` : undefined,
          }}
        >
          {screen ?? <PlaceholderScreen device={device} />}
        </div>
      </div>
    </div>
  );
};
