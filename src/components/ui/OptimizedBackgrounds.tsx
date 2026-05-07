'use client';

import { usePathname } from 'next/navigation';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import { useScrollDetection } from '@/hooks/useScrollDetection';
import { useMounted } from '@/hooks/useMounted';
import { useTheme } from '@/hooks/useTheme';
import Particles from './Particles';
import SunFlares from './SunFlares';

/**
 * Optimized background manager
 * Adaptively adjusts quality based on device capability
 * Pauses animations during scroll for better performance
 * Keeps all visual elements but optimizes their settings
 * 
 * Uses a SINGLE Particles instance with darkMode prop to avoid
 * WebGL context creation/destruction on theme toggle — the #1 cause
 * of the ~1s delay on mobile when switching themes.
 */
export default function OptimizedBackgrounds() {
  const device = useDeviceCapability();
  const isScrolling = useScrollDetection(150);
  const pathname = usePathname();
  const mounted = useMounted();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

      {/* Rashi Orbit Background removed as requested */}

      {/* Single Particles instance — color buffer updates in-place on theme change */}
      <div className="fixed inset-0 z-[-5] pointer-events-none">
        <Particles
          lightParticleColors={["var(--outline-variant)", "var(--accent)", "var(--secondary)"]}
          darkParticleColors={["var(--secondary)", "var(--flare-gold)", "var(--foreground)"]}
          darkMode={isDark}
          particleCount={device.particleCount}
          particleSpread={particleSpread}
          speed={isPaused ? 0 : particleSpeed}
          particleBaseSize={device.particleSize}
          moveParticlesOnHover={(device.isDesktop || !isChatPage) && device.enableComplexAnimations}
          alphaParticles={!isDark}
          disableRotation={(isChatPage && !device.isDesktop) || !device.enableComplexAnimations}
        />
      </div>
    </div>
  );
}
