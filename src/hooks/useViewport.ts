import { useState, useEffect } from 'react';

interface ViewportSize {
  width: number;
  height: number;
  // Visual viewport (excludes browser UI like address bar)
  visualWidth: number;
  visualHeight: number;
}

/**
 * Custom hook to track viewport dimensions
 * Includes both layout viewport and visual viewport (for mobile browser UI)
 */
export function useViewport(): ViewportSize {
  const [viewport, setViewport] = useState<ViewportSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    visualWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    visualHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const updateViewport = () => {
      // Layout viewport (includes browser UI)
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Visual viewport (excludes browser UI on mobile)
      const visualViewport = window.visualViewport;
      const visualWidth = visualViewport?.width ?? width;
      const visualHeight = visualViewport?.height ?? height;

      setViewport({
        width,
        height,
        visualWidth,
        visualHeight,
      });
    };

    updateViewport();

    // Listen to both resize and visual viewport changes
    window.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('scroll', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('scroll', updateViewport);
    };
  }, []);

  return viewport;
}

/**
 * Hook to detect if mobile browser UI is visible
 * Useful for handling the address bar hide/show behavior
 */
export function useIsBrowserUIVisible(): boolean {
  const { height, visualHeight } = useViewport();
  
  // If visual viewport is significantly smaller than layout viewport,
  // browser UI is likely visible
  return Math.abs(height - visualHeight) > 50;
}
