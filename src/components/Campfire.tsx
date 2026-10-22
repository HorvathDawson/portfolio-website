import React from 'react';

/** The campfire: an animated CSS flame with sparks over a photo of logs (styles in AboutMe.css). */
export const Campfire: React.FC<{ logsImage: string }> = ({ logsImage }) => (
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
    <img src={logsImage} alt="Campfire logs" loading="lazy" className="logs-img" />
  </div>
);
