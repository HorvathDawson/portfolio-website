import React from 'react';
import { ArtLayer } from './ArtLayer';
import { LayeredArt } from './LayeredArt';

const ART = '/assets/projects/buell-lightning/engine';
const PUSH_ROD_MASK = `url("${ART}/push-rods-mask.svg")`;

/**
 * Buell engine. Parts tagged `data-scroll="<n>"` are pushed apart by the
 * card's scroll animation, part n moving n steps.
 */
export const MotorcycleParts: React.FC = () => (
  <LayeredArt width={900} height={700}>
    <ArtLayer layer="foreground" src={`${ART}/section-view.webp`} alt="Buell motorcycle engine section view" style={{ zIndex: 5 }} />
    <ArtLayer layer="background" src={`${ART}/case.webp`} alt="Buell motorcycle engine case" style={{ zIndex: 4 }} />
    <ArtLayer layer="background" src={`${ART}/left-cylinder.webp`} alt="Buell motorcycle left cylinder" style={{ zIndex: 4 }} />
    <ArtLayer layer="background" src={`${ART}/cylinder-barrel.webp`} alt="Buell motorcycle cylinder barrel" data-scroll="1" style={{ zIndex: 4 }} />
    <ArtLayer layer="background" src={`${ART}/rocker-box.webp`} alt="Buell motorcycle rocker box" data-scroll="2" style={{ zIndex: 4 }} />
    <ArtLayer layer="background" src={`${ART}/rocker-box-top.webp`} alt="Buell motorcycle rocker box top" data-scroll="3" style={{ zIndex: 4 }} />
    <ArtLayer layer="background" src={`${ART}/push-rods.webp`} alt="Buell motorcycle push rods" data-scroll="4" style={{ zIndex: 6 }} />
    {/* Dark fill behind the push rods: a mask lets background-color fill the SVG shape */}
    <div
      aria-hidden="true"
      data-scroll="4"
      className="background-layer"
      style={{
        opacity: 1,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 5,
        backgroundColor: 'var(--dark-blue)',
        maskImage: PUSH_ROD_MASK,
        WebkitMaskImage: PUSH_ROD_MASK,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center'
      }}
    />
  </LayeredArt>
);
