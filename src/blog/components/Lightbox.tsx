import React, { useState } from 'react';
import { Dialog } from './Dialog';
import { IconZoom } from './Icons';

export interface LightboxImage {
  src: string;
  alt: string;
  caption: string;
}

/**
 * Enlarged figure in a dialog. Click the image (or the button) to toggle
 * between fit-to-screen and full size; the full-size view scrolls.
 */
export const Lightbox: React.FC<{ image: LightboxImage | null; onClose: () => void }> = ({ image, onClose }) => {
  const [zoomed, setZoomed] = useState(false);
  const close = () => { setZoomed(false); onClose(); };
  return (
    <Dialog open={Boolean(image)} onClose={close} label={image?.alt || 'Figure'} title="Figure" variant="lightbox">
      {image && (
        <>
          <div className={`lightbox-stage${zoomed ? ' is-zoomed' : ''}`}>
            <img src={image.src} alt={image.alt} onClick={() => setZoomed((z) => !z)} />
          </div>
          <div className="lightbox-foot">
            {image.caption && <p>{image.caption}</p>}
            <button type="button" className="btn btn--ghost" onClick={() => setZoomed((z) => !z)} aria-pressed={zoomed} data-autofocus>
              <IconZoom /> {zoomed ? 'Fit' : 'Full size'}
            </button>
          </div>
        </>
      )}
    </Dialog>
  );
};
