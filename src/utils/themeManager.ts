/**
 * Theme Manager Utility
 * Core theme switching logic with performance optimization
 */

import { Theme, isValidTheme } from '@/types/theme';
import { DeviceTier } from './deviceTier';

const STORAGE_KEY = 'theme';

// Track pending Phase 2 callbacks so rapid toggles cancel previous ones
let pendingRafId: number | null = null;
let pendingTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Reads theme from localStorage with validation
 * @returns Theme value or null if invalid/unavailable
 */
export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isValidTheme(stored)) {
      return stored;
    }
    // Clear invalid value
    if (stored) {
      localStorage.removeItem(STORAGE_KEY);
      console.warn('Invalid theme value in localStorage, cleared');
    }
    return null;
  } catch (e) {
    console.warn('localStorage unavailable:', e);
    return null;
  }
}

/**
 * Persists theme to localStorage
 * @param theme - Theme to store
 */
export function setStoredTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, theme);
    document.cookie = `theme=${theme}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {
    console.warn('Failed to persist theme:', e);
  }
}

/**
 * Gets system theme preference
 * @returns Theme based on system preference
 */
export function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  
  try {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/**
 * Checks if user prefers reduced motion
 * @returns boolean indicating reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Temporarily disables transitions, executes callback, then re-enables
 * @param callback - Function to execute with transitions disabled
 */
export function disableTransitionsTemporarily(callback: () => void): void {
  if (typeof document === 'undefined') return;
  
  // Add disable-transitions class
  document.documentElement.classList.add('disable-transitions');
  
  // Execute callback — browser batches DOM mutations within the same
  // microtask so disable-transitions is active before paint
  callback();
  
  // Re-enable transitions on next frame
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('disable-transitions');
  });
}

/**
 * Applies theme with performance optimization based on device tier
 * Uses two-phase approach: instant background, delayed decorative elements
 * Cancels pending Phase 2 callbacks on rapid toggle to prevent pile-up
 * @param theme - Theme to apply
 * @param deviceTier - Device tier classification
 */
export function applyThemeWithOptimization(theme: Theme, deviceTier: DeviceTier): void {
  if (typeof document === 'undefined') return;
  
  // Validate theme
  if (!isValidTheme(theme)) {
    console.error('Invalid theme value:', theme);
    return;
  }
  
  // Cancel any pending Phase 2 callbacks from a previous toggle
  if (pendingRafId !== null) {
    cancelAnimationFrame(pendingRafId);
    pendingRafId = null;
  }
  if (pendingTimeoutId !== null) {
    clearTimeout(pendingTimeoutId);
    pendingTimeoutId = null;
  }
  
  // PHASE 1: Instant theme class swap (critical visual feedback)
  // On mobile viewports, skip the disable-transitions class entirely —
  // the @media (max-width: 768px) rule already forces transition: none,
  // and adding disable-transitions triggers a full style recalc of every
  // element via the * selector (~100ms on low-end devices).
  const isMobileViewport = typeof window !== 'undefined' && window.innerWidth < 768;
  
  if (!isMobileViewport) {
    document.documentElement.classList.add('disable-transitions');
  }
  
  // Apply theme class — browser batches DOM mutations within the same
  // microtask, so disable-transitions is guaranteed to be active before
  // the theme class change paints. No forced reflow needed.
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  
  // PHASE 2: Re-enable transitions for decorative elements only
  // This allows particles, glows, etc. to fade in gradually without blocking UI
  // On mobile viewports, skip entirely — no stagger class, no rAF callback needed
  if (isMobileViewport) {
    // Mobile: DOM is already correct, nothing more to do
    // No disable-transitions to remove, no stagger to add
  } else {
    pendingRafId = requestAnimationFrame(() => {
      pendingRafId = null;
      document.documentElement.classList.remove('disable-transitions');
      
      // On low-end devices or reduced motion — skip decorative transitions entirely
      const shouldSkipDecorativeTransitions = prefersReducedMotion() || deviceTier === 'low';
      if (!shouldSkipDecorativeTransitions) {
        document.documentElement.classList.add('theme-transition-stagger');
        
        // Remove stagger class after decorative elements finish transitioning
        pendingTimeoutId = setTimeout(() => {
          pendingTimeoutId = null;
          document.documentElement.classList.remove('theme-transition-stagger');
        }, 600);
      }
    });
  }
  
  // Persist preference
  setStoredTheme(theme);
}

/**
 * Gets current theme from DOM
 * @returns Current theme
 */
export function getCurrentTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Toggles between light and dark themes
 * @param deviceTier - Device tier classification
 */
export function toggleTheme(deviceTier: DeviceTier): void {
  const current = getCurrentTheme();
  const newTheme: Theme = current === 'light' ? 'dark' : 'light';
  applyThemeWithOptimization(newTheme, deviceTier);
}
