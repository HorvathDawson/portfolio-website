import React, { useCallback } from 'react';
import { BaseProjectItem, type ProjectConfig } from './BaseProjectItem';
import { onScrollFrameWhileVisible } from '../../utils/scrollFrame';
import { VintageCarDisplay } from '../visuals';

const projectConfig: ProjectConfig = {
  id: 'a40austin',
  category: 'In Progress',
  title: '1950 A40 Austin',
  description: 'Currently modernizing a 1950 Austin A40 by upgrading its suspension, brakes, and motor, blending modern performance with a classic design.',
  link: '/a40',
  buttonText: 'Build Log',
  internal: true,
};

export const A40AustinProject: React.FC = () => {

  // We use useCallback to keep the function reference stable
  const customAnimations = useCallback((rootElement: HTMLElement) => {
    
    // 1. FIND THE CAR
    // Since the attribute is inside the component, querySelector will find it deep inside rootElement
    const car = rootElement.querySelector('[data-vintage-car]') as HTMLElement | null;
    
    // 2. FIND THE FRAME (Static Reference)
    // We MUST measure the frame because it stays still. 
    // If we measure the car, the math breaks as soon as the car moves.
    const frame = rootElement.querySelector('.project-media-frame') as HTMLElement | null;

    if (!car || !frame) return;

    const update = () => {
      // Measure the STATIC frame relative to the viewport
      const rect = frame.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowCenterY = windowHeight / 2;
      
      // Calculate where the center of the frame is
      const itemCenterY = rect.top + rect.height / 2;
      
      // Calculate Distance from Center
      // Positive = Below center (scrolling in)
      // Negative = Above center (scrolled past)
      const distanceToCenter = itemCenterY - windowCenterY;
      
      // Calculate Factor (0 to 1)
      // We clamp it at 0 so it stops moving once it reaches the center/top
      let factor = distanceToCenter / windowCenterY;
      factor = Math.max(0, factor); 

      // Animation Values
      // Start 200px to the left, 100px down
      const baseDistance = -200; 
      
      const translateX = baseDistance * factor;
      const translateY = 100 * factor;

      // Apply transform to the CAR
      car.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    };

    // Recompute on scroll, only while the card is near the viewport
    return onScrollFrameWhileVisible(frame, update);
  }, []);

  return (
    <BaseProjectItem 
      config={projectConfig} 
      className="project-a40austin"
      customAnimations={customAnimations}
    >
      <VintageCarDisplay />
    </BaseProjectItem>
  );
};