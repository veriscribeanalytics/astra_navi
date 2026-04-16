'use client';

import { Suspense, lazy, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import Particles from './Particles';
import SunFlares from './SunFlares';
import RashiOrbitBackground from './RashiOrbitBackground';

/**
 * Optimized background manager
 * Adaptively adjusts quality based on device capability
 * Pauses animations during scroll for better performance
 * Keeps all visual elements but optimizes their settings
 */
export default function OptimizedBackgrounds() {
  const device = useDeviceCapability();
  const isScrolling = useScrollDetection(150);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted (avoid hydration issues)
  if (!mounted) {
    return null;
  }

  const isChatPage = pathname?.startsWith('/chat');

  // Pause animations during scroll on mobile/tablet for smoothness
  const shouldPauseOnScroll = device.isMobile || device.isTablet;
  // Pause if we are on mobile/tablet chat page (to save battery/performance) 
  // but allow animations on desktop chat as requested.
  const isPaused = (isChatPage && (device.isMobile || device.isTablet)) || (shouldPauseOnScroll && isScrolling);

  // Adjust particle speed based on device
  const particleSpeed = device.isMobile ? 0.1 : device.isTablet ? 0.12 : 0.15;
  const particleSpread = device.isMobile ? 10 : device.isTablet ? 11 : 12;

  // On the chat page, reduce the background opacity so text pops, but keep it visible on desktop
  const visualOpacity = isChatPage 
    ? (device.isDesktop ? 'opacity-30' : 'opacity-10') 
    : 'opacity-100';

  return (
    <div className={`transition-opacity duration-700 ${visualOpacity} pointer-events-none fixed inset-0 z-[-10]`}>
      {/* SunFlares - Always visible, lightweight */}
      <SunFlares />

      {/* Rashi Orbit Background - Adaptive icon count */}
      <RashiOrbitBackground 
        iconCount={device.rashiIconCount}
        pauseOnScroll={isPaused}
      />

      {/* Particles - Dark Mode */}
      <div className="fixed inset-0 z-[-5] pointer-events-none hidden dark:block">
        <Particles
          particleColors={["#c8880a", "#f5a623", "#faf7f2"]}
          particleCount={device.particleCount}
          particleSpread={particleSpread}
          speed={isPaused ? 0 : particleSpeed}
          particleBaseSize={device.particleSize}
          moveParticlesOnHover={(device.isDesktop || !isChatPage) && device.enableComplexAnimations}
          alphaParticles={false}
          disableRotation={(isChatPage && !device.isDesktop) || !device.enableComplexAnimations}
        />
      </div>

      {/* Particles - Light Mode */}
      <div className="fixed inset-0 z-[-5] pointer-events-none block dark:hidden">
        <Particles
          particleColors={["#E6D8E0", "#d1b8c6", "#c8880a"]}
          particleCount={device.particleCount}
          particleSpread={particleSpread + 2}
          speed={isPaused ? 0 : particleSpeed * 0.8}
          particleBaseSize={device.particleSize - 20}
          moveParticlesOnHover={(device.isDesktop || !isChatPage) && device.enableComplexAnimations}
          alphaParticles={true}
          disableRotation={(isChatPage && !device.isDesktop) || !device.enableComplexAnimations}
        />
      </div>
    </div>
  );
}
