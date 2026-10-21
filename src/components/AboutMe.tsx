import React from 'react';
import { Campfire } from './Campfire';
import { ContactLinks } from './ContactLinks';
import { CampScene } from './ideas/CampScene';
import { showIdeas } from '../utils/ideas';
import './AboutMe.css';

interface AboutMeProps {
  content: {
    title: string;
    description: string;
    tentImage: string;
    logsImage: string;
  };
}

export const AboutMe: React.FC<AboutMeProps> = ({ content }) => {
  return (
    <section className="about-section" aria-labelledby="about-heading">
      {/* Fades the scene into the projects section below */}
      <div className="gradient-layer"></div>

      <div className="about-content">
        <h1 id="about-heading" className="about-title">{content.title}</h1>
        <div className="about-description">
          {content.description.split('\n\n').map((paragraph, index) => (
            <p key={index} className="about-paragraph">
              {paragraph}
            </p>
          ))}
        </div>
        <ContactLinks className="about-contact-links" />
      </div>

      {/* Tent and campfire scene (with a fisher, under ?ideas) */}
      {showIdeas() ? <CampScene logsImage={content.logsImage} /> : (
      <div className="about-image-responsive" aria-hidden="true">
        <Campfire logsImage={content.logsImage} />

        <img
          src={content.tentImage}
          alt="Tent scene"
          loading="lazy"
          className="tent-img"
        />
      </div>
      )}
    </section>
  );
};