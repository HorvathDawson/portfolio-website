import React from 'react';
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
      </div>

      {/* Tent and campfire scene */}
      <div className="about-image-responsive" aria-hidden="true">
        <div className="campfire-group">
          <div className="fire-pit">
            <div className="glow-base"></div>
            <div className="flame flame-red"></div>
            <div className="flame flame-orange"></div>
            <div className="flame flame-yellow"></div>
            <div className="flame flame-white"></div>
            <div className="spark spark-1"></div>
            <div className="spark spark-2"></div>
            <div className="spark spark-3"></div>
          </div>
          <img
            src={content.logsImage}
            alt="Campfire logs"
            loading="lazy"
            className="logs-img"
          />
        </div>

        <img
          src={content.tentImage}
          alt="Tent scene"
          loading="lazy"
          className="tent-img"
        />
      </div>
    </section>
  );
};