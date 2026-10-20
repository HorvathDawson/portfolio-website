import React from 'react';
import { LayeredArt } from './LayeredArt';
import { RESUME_EMBED_PATH } from '../../data/site';
import './TabletDisplay.css';

export const TabletDisplay: React.FC = () => (
  <LayeredArt
    width={720}
    height={1040}
    layers={[
      { layer: 'foreground', src: '/assets/resume/colored.webp' },
      { layer: 'background', src: '/assets/resume/outline.webp' },
    ]}
  >
    {/* The live resume (from the resume generator), laid flat onto the
        tablet screen. The static image shows while the frame loads. */}
    <div
      className="splash-layer"
      style={{
        opacity: 0,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotateX(54deg) rotate(44.9deg)',
        aspectRatio: '1 / 1.4142',
        width: '50.6%',
        height: 'auto',
        zIndex: 2147483647,
      }}
    >
      <img
        src="/assets/resume/resume.webp"
        alt=""
        loading="lazy"
        decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <iframe
        src={RESUME_EMBED_PATH}
        title="Dawson Horvath's resume"
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        className="resume-embed"
      />
      {/* Purple tint over the page; lets the pointer through to the frame */}
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--purple)', opacity: 0.5, pointerEvents: 'none' }} />
    </div>
  </LayeredArt>
);
