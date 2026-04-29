import { useState, useEffect } from 'react';

interface DeviceCapability {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLowEnd: boolean;
  isMidRange: boolean;
  isHighEnd: boolean;
  prefersReducedMotion: boolean;
  // Optimized settings
  particleCount: number;
  particleSize: number;
  rashiIconCount: number;
  enableComplexAnimations: boolean;
}

/**
 * Detects device capability and returns optimized settings
 * Keeps all animations but adjusts quality based on device
 */
export function useDeviceCapability(): DeviceCapability {
  const [capability, setCapability] = useState<DeviceCapability>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isLowEnd: false,
    isMidRange: false,
    isHighEnd: true,
    prefersReducedMotion: false,
    particleCount: 500,
    particleSize: 120,
    rashiIconCount: 12,
    enableComplexAnimations: true,
  });

  useEffect(() => {
    const detectCapability = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Detect device performance tier
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;
      const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory || 4;
      
      // Performance scoring
      const performanceScore = hardwareConcurrency + deviceMemory;
      const isLowEnd = performanceScore < 6;
      const isMidRange = performanceScore >= 6 && performanceScore < 10;
      const isHighEnd = performanceScore >= 10;

      // Optimized settings based on device
      let particleCount = 500;
      let particleSize = 120;
      let rashiIconCount = 12;
      let enableComplexAnimations = true;

      if (isMobile) {
        if (isLowEnd) {
          particleCount = 40;
          particleSize = 80;
          rashiIconCount = 8;
          enableComplexAnimations = false;
        } else if (isMidRange) {
          particleCount = 60;
          particleSize = 90;
          rashiIconCount = 10;
          enableComplexAnimations = true;
        } else {
          particleCount = 80;
          particleSize = 100;
          rashiIconCount = 12;
          enableComplexAnimations = true;
        }
      } else if (isTablet) {
        if (isLowEnd) {
          particleCount = 150;
          particleSize = 100;
          rashiIconCount = 10;
        } else {
          particleCount = 250;
          particleSize = 110;
          rashiIconCount = 12;
        }
      } else {
        // Desktop - full quality
        particleCount = isLowEnd ? 300 : 500;
        particleSize = 120;
        rashiIconCount = 12;
      }

      // Respect user preference
      if (prefersReducedMotion) {
        particleCount = Math.floor(particleCount * 0.5);
        enableComplexAnimations = false;
      }

      setCapability({
        isMobile,
        isTablet,
        isDesktop,
        isLowEnd,
        isMidRange,
        isHighEnd,
        prefersReducedMotion,
        particleCount,
        particleSize,
        rashiIconCount,
        enableComplexAnimations,
      });
    };

    detectCapability();

    // Re-detect on resize
    window.addEventListener('resize', detectCapability);
    return () => window.removeEventListener('resize', detectCapability);
  }, []);

  return capability;
}
