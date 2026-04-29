import { useState, useEffect } from 'react';

/**
 * Breakpoint values matching Tailwind CSS defaults
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  width: number;
  height: number;
  breakpoint: Breakpoint | 'xs';
}

/**
 * Custom hook for responsive design utilities
 * Provides device type detection and viewport dimensions
 */
export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLargeDesktop: false,
    width: 1024,
    height: 768,
    breakpoint: 'lg',
  });

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Determine breakpoint
      let breakpoint: Breakpoint | 'xs' = 'xs';
      if (width >= BREAKPOINTS['2xl']) breakpoint = '2xl';
      else if (width >= BREAKPOINTS.xl) breakpoint = 'xl';
      else if (width >= BREAKPOINTS.lg) breakpoint = 'lg';
      else if (width >= BREAKPOINTS.md) breakpoint = 'md';
      else if (width >= BREAKPOINTS.sm) breakpoint = 'sm';

      setState({
        isMobile: width < BREAKPOINTS.md, // < 768px
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg, // 768px - 1024px
        isDesktop: width >= BREAKPOINTS.lg, // >= 1024px
        isLargeDesktop: width >= BREAKPOINTS.xl, // >= 1280px
        width,
        height,
        breakpoint,
      });
    };

    // Initial update
    updateState();

    // Listen for resize
    window.addEventListener('resize', updateState);
    return () => window.removeEventListener('resize', updateState);
  }, []);

  return state;
}

/**
 * Detect if user is on a mobile device based on user agent
 * More reliable than just screen width for touch devices
 */
export function useIsMobileDevice(): boolean {
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobileDevice = () => {
      const userAgent = (navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera) || '';
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      setIsMobileDevice(mobileRegex.test(userAgent));
    };

    checkMobileDevice();
  }, []);

  return isMobileDevice;
}

/**
 * Combined hook for comprehensive mobile detection
 * Checks both viewport width AND user agent
 */
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  const isMobileDevice = useIsMobileDevice();
  
  return isMobile || isMobileDevice;
}
