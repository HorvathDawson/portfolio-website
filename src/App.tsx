import { useEffect, useState } from 'react';
import { ParallaxHeader } from './components/ParallaxHeader';
import { AboutMe } from './components/AboutMe';
import { ContactForm } from './components/ContactForm';
import { ProjectCard } from './components/ProjectCard';
import { aboutMeContent, parallaxLayers } from './data/content';
import { projects } from './data/projects';
import { BREAKPOINTS } from './utils/useBreakpoint';

function App() {
  const [ready, setReady] = useState(false);

  // Preload all parallax header images before revealing the site
  useEffect(() => {
    let imagesReady = false;
    let minTimeReady = false;

    const tryReveal = () => {
      if (imagesReady && minTimeReady) setReady(true);
    };

    // Minimum time so fast loads don't flash the spinner
    const timer = setTimeout(() => {
      minTimeReady = true;
      tryReveal();
    }, 400);

    const srcs = parallaxLayers.map((l) => l.src);
    let loaded = 0;
    const total = srcs.length;

    const onLoad = () => {
      loaded++;
      if (loaded >= total) {
        imagesReady = true;
        tryReveal();
      }
    };

    srcs.forEach((src) => {
      const img = new Image();
      img.onload = onLoad;
      img.onerror = onLoad;
      img.src = src;
    });

    return () => clearTimeout(timer);
  }, []);

  // Console easter egg
  useEffect(() => {
    const styles = [
      'color: #ff4500',
      'background: #2a2a2a',
      'font-size: 14px',
      'padding: 10px',
      'border-radius: 5px',
      'border: 2px solid #ff8c00'
    ].join(';');

    const funMessage = `
    (
      )
     ( )  .   
      |  /_\\  
    __|__/_|__ 
   /_________\\ 
     |     |   
   
   Hey there, explorer! 🌲 
   If you're looking at this, you probably enjoy code as much as I do.
   
   Feel free to poke around the source or reach out via the contact form!
    `;

    console.log(`%c 🏕️ Welcome to the Portfolio! `, styles);
    console.log(funMessage);
    console.log("Built with React, TypeScript, and a lot of coffee ☕");
  }, []);

  useEffect(() => {
    // Mouse tracking for shuffle effect (Project Cards), desktop only
    const cards = document.querySelectorAll<HTMLElement>('.project-card-media');
    let mouseAnimationFrame = 0;
    let mouseX = 0;
    let mouseY = 0;

    const applyOffset = () => {
      mouseAnimationFrame = 0;
      if (window.innerWidth <= BREAKPOINTS.tablet) return;

      const offsetX = (mouseX - window.innerWidth / 2) * 0.002;
      const offsetY = (mouseY - window.innerHeight / 2) * 0.002;
      const transform = `translate3d(${offsetX}%, ${offsetY}%, 0)`;
      cards.forEach((element) => {
        element.style.transform = transform;
      });
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!mouseAnimationFrame) mouseAnimationFrame = requestAnimationFrame(applyOffset);
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (mouseAnimationFrame) cancelAnimationFrame(mouseAnimationFrame);
    };
  }, []);

  return (
    <div className="app-container">

      {/* Skip-to-content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Loading overlay — hides content until header images are ready */}
      <div
        className={`loading-overlay${ready ? ' loaded' : ''}`}
        role="status"
        aria-live="polite"
        aria-label="Loading"
      >
        <div className="loading-spinner" aria-hidden="true" />
        <span className="sr-only">{ready ? 'Content loaded' : 'Loading portfolio…'}</span>
      </div>

      {/* Decorative parallax header */}
      <header aria-label="Decorative parallax landscape">
        <ParallaxHeader />
      </header>

      <main id="main-content" className="parallax-foreground">
        <div className="main-content home">
          <AboutMe content={aboutMeContent} />

          <section className="projects-content" aria-label="Projects">
            <div className="projects-section">
              <div className="projects-grid" role="list">
                {projects.map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
              <ContactForm />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;