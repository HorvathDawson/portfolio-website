import React from 'react';

export interface TabletDisplayProps {
    className?: string;
    forceHover?: boolean;
}

export const TabletDisplay: React.FC<TabletDisplayProps> = ({ 
    className = '',
    forceHover
}) => {
    const effectiveForceHover = forceHover ?? false;

    return (
        <div data-tablet-display className={className} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <div style={{ width: 720, height: 1040, maxWidth: '100%', maxHeight: '100%', position: 'relative' }}>
                <img
                    src="/assets/resume/colored.webp"
                    alt=""
                    className="foreground-layer"
                    loading="lazy"
                    style={{ opacity: effectiveForceHover ? 1 : 0, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <img
                    src="/assets/resume/outline.webp"
                    alt=""
                    className="background-layer"
                    loading="lazy"
                    style={{ opacity: effectiveForceHover ? 0 : 1, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                />
                {/* Resume page, laid flat onto the tablet screen */}
                <div
                    data-resume-splash
                    className="splash-layer"
                    style={{
                        opacity: effectiveForceHover ? 1 : 0,
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
                    {/* Purple tint over the page */}
                    <div style={{ position: 'absolute', inset: 0, backgroundColor: 'var(--purple)', opacity: 0.5 }} />
                </div>
            </div>
        </div>
    );
};
