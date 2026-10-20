import React, { useCallback } from 'react';
import { BaseProjectItem, type ProjectConfig } from './BaseProjectItem';
import { onScrollFrameWhileVisible } from '../../utils/scrollFrame';
import { LaptopWithScreen } from '../visuals';

const projectConfig: ProjectConfig = {
  id: 'self-driving-car',
  category: 'Simulation',
  title: 'Self Driving Car',
  description: 'Simulated a self-driving robot in Gazebo and ROS.'
};

export const SelfDrivingCarProject: React.FC = () => {

  const customAnimations = useCallback((rootElement: HTMLElement) => {
    // 1. SELECT ELEMENTS
    // Target the specific screen inside this component
    const screen = rootElement.querySelector('[data-laptop-screen]') as HTMLElement | null;
    
    // Target the STATIC frame to measure position. 
    // IMPORTANT: We measure this because it doesn't move/rotate.
    const frame = rootElement.querySelector('.project-media-frame') as HTMLElement | null;

    if (!screen || !frame) return;

    const update = () => {
      // 2. MEASURE STATIC FRAME
      const rect = frame.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowCenterY = windowHeight / 2;
      
      // Center of the laptop frame
      const itemCenterY = rect.top + rect.height / 2;
      
      // 3. CALCULATE FACTOR
      // Distance from center of screen
      // Positive = Below center (scrolling in)
      // Negative = Above center (scrolled past)
      const distanceToCenter = itemCenterY - windowCenterY;

      // Normalize to a 0..1 factor based on half screen height
      let factor = distanceToCenter / windowCenterY;
      
      // Clamp: We only animate when it's below center (opening up)
      // Stops animating once it hits the center or goes above
      factor = Math.max(0, factor);

      // 4. ANIMATION MATH
      // At bottom of screen (factor 1) -> Rotate 90deg (Closed/Flat)
      // At center of screen (factor 0) -> Rotate 0deg (Open/Upright)
      const maxRotation = 90; 
      const rotation = maxRotation * factor;
      
      // Using rotateX to simulate lid opening
      screen.style.transform = `rotateX(-${rotation}deg)`; 
    };

    // Recompute on scroll, only while the card is near the viewport
    return onScrollFrameWhileVisible(frame, update);
  }, []);

  return (
    <BaseProjectItem
      config={projectConfig}
      className="project-self-driving-car"
      customAnimations={customAnimations}
    >
      <LaptopWithScreen />
    </BaseProjectItem>
  );
};