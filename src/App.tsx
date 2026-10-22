import { useEffect } from 'react';
import { ParallaxHeader } from './components/ParallaxHeader';
import { AboutMe } from './components/AboutMe';
import { ContactForm } from './components/ContactForm';
import { ProjectCard } from './components/ProjectCard';
import { FishingLine } from './components/ideas/FishingLine';
import { showIdeas } from './utils/ideas';
import { aboutMeContent } from './data/content';
import { visibleProjects } from './data/projects';
import { BREAKPOINTS } from './utils/useBreakpoint';
import { watchReducedMotion } from './utils/reducedMotion';
import { usePageMeta } from './utils/usePageMeta';
import { HOME_DESCRIPTION, HOME_TITLE, SHARE_DESCRIPTION, SHARE_TITLE } from './data/site';

function App() {
  usePageMeta({
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    path: '/',
    shareTitle: SHARE_TITLE,
    shareDescription: SHARE_DESCRIPTION,
  });

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

  // Cards drift slightly with the mouse (desktop only, and not for reduced motion).
  useEffect(() => {
    const cards = document.querySelectorAll<HTMLElement>('.project-card-media');
    let frame = 0;
    let mouseX = 0;
    let mouseY = 0;

    const applyOffset = () => {
      frame = 0;
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
      if (!frame) frame = requestAnimationFrame(applyOffset);
    };

    const detach = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const unwatch = watchReducedMotion((reduced) => {
      if (reduced) {
        detach();
        cards.forEach((element) => { element.style.transform = ''; });
      } else {
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
      }
    });

    return () => {
      unwatch();
      detach();
    };
  }, []);

  return (
    <div className="app-container">

      {/* Skip-to-content link for keyboard users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

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
                {visibleProjects(window.location.search).map((project) => <ProjectCard key={project.id} project={project} />)}
              </div>
              <ContactForm />
            </div>
          </section>
        </div>
        {showIdeas() && <FishingLine />}
      </main>
    </div>
  );
}

export default App;