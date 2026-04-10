import { useState, useEffect } from 'react';

export type OrientationType = 'portrait' | 'landscape';

interface OrientationState {
  orientation: OrientationType;
  angle: number;
  isPortrait: boolean;
  isLandscape: boolean;
}

/**
 * Custom hook to track device orientation
 * Useful for responsive layouts that change based on orientation
 */
export function useOrientation(): OrientationState {
  const [state, setState] = useState<OrientationState>({
    orientation: 'portrait',
    angle: 0,
    isPortrait: true,
    isLandscape: false,
  });

  useEffect(() => {
    const updateOrientation = () => {
      // Try to use Screen Orientation API first
      if (window.screen?.orientation) {
        const type = window.screen.orientation.type;
        const angle = window.screen.orientation.angle;
        const isPortrait = type.includes('portrait');
        
        setState({
          orientation: isPortrait ? 'portrait' : 'landscape',
          angle,
          isPortrait,
          isLandscape: !isPortrait,
        });
      } 
      // Fallback to window dimensions
      else {
        const isPortrait = window.innerHeight > window.innerWidth;
        setState({
          orientation: isPortrait ? 'portrait' : 'landscape',
          angle: 0,
          isPortrait,
          isLandscape: !isPortrait,
        });
      }
    };

    updateOrientation();

    // Listen for orientation changes
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener('change', updateOrientation);
    }
    
    // Fallback to resize listener
    window.addEventListener('resize', updateOrientation);

    return () => {
      if (window.screen?.orientation) {
        window.screen.orientation.removeEventListener('change', updateOrientation);
      }
      window.removeEventListener('resize', updateOrientation);
    };
  }, []);

  return state;
}
