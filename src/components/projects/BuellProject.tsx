import React, { useCallback } from 'react';
import { BaseProjectItem, type ProjectConfig } from './BaseProjectItem';
import { onScrollFrameWhileVisible } from '../../utils/scrollFrame';
import { MotorcycleParts } from '../visuals';

const projectConfig: ProjectConfig = {
  id: 'buell',
  category: 'Fix',
  title: 'Buell Motor Rebuild',
  description: 'Rebuilt a 2008 Buell XB9SX motor by disassembling, inspecting, and replacing worn components, requiring precision and expertise to restore performance and reliability.'
};

export const BuellProject: React.FC = () => {
  
  const customAnimations = useCallback((rootElement: HTMLElement) => {
    // 1. SELECT PARTS
    // Find all elements with data-part attribute inside this component
    const parts = Array.from(rootElement.querySelectorAll('[data-part]')) as HTMLElement[];
    
    // 2. SELECT FRAME (Static Reference)
    // We measure this to calculate scroll position
    const frame = rootElement.querySelector('.project-media-frame') as HTMLElement | null;

    if (!parts.length || !frame) return;

    const update = () => {
      // Measure the static frame relative to viewport
      const rect = frame.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowCenterY = windowHeight / 2;

      // Calculate center of the image
      const itemCenterY = rect.top + rect.height / 2;
      
      // Calculate Distance from Center (Absolute)
      // We use Math.abs because we want it to explode if it's too high OR too low.
      // It should only be fully assembled when exactly in the center.
      const distanceToCenter = Math.abs(itemCenterY - windowCenterY);
      
      // Calculate Factor (0 to 1)
      // 0 = At center (Assembled)
      // 1 = At edge of screen (Exploded)
      // We clamp at 1 so parts don't fly off to infinity if you have a tall monitor
      const factor = Math.min(1, distanceToCenter / (windowHeight / 2));

      // CONFIGURATION
      const baseDistance = 40; // Pixels of separation per part index
      const angleInDegrees = 60;
      const angleInRadians = (angleInDegrees * Math.PI) / 180;

      parts.forEach((part) => {
        const partAttr = part.getAttribute('data-part');
        if (!partAttr) return;
        
        const partNumber = parseInt(partAttr, 10);
        
        // The higher the part number, the further it moves
        const totalDistance = baseDistance * partNumber * factor;

        // Calculate X/Y vector based on 60 degree angle
        const translateX = totalDistance * Math.cos(angleInRadians);
        // Negative Y moves UP (exploding outwards)
        const translateY = -totalDistance * Math.sin(angleInRadians);

        part.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
      });
    };

    // Recompute on scroll, only while the card is near the viewport
    return onScrollFrameWhileVisible(frame, update);
  }, []);

  return (
    <BaseProjectItem 
      config={projectConfig} 
      className="project-buell"
      customAnimations={customAnimations}
    >
      <MotorcycleParts />
    </BaseProjectItem>
  );
};