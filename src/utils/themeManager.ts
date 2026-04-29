/**
 * Theme Manager Utility
 * Core theme switching logic with performance optimization
 */

import { Theme, isValidTheme } from '@/types/theme';
import { DeviceTier } from './deviceTier';

const STORAGE_KEY = 'theme';

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
  
  // Force reflow to ensure class is applied
  void document.documentElement.offsetHeight;
  
  // Execute callback
  callback();
  
  // Re-enable transitions on next frame
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('disable-transitions');
  });
}

/**
 * Applies theme with performance optimization based on device tier
 * Uses two-phase approach: instant background, delayed decorative elements
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
  
  // PHASE 1: Instant background color change (critical visual feedback)
  // This happens immediately with no transitions
  document.documentElement.classList.add('disable-transitions');
  
  // Force reflow to ensure class is applied
  void document.documentElement.offsetHeight;
  
  // Apply theme class
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  
  // PHASE 2: Re-enable transitions for decorative elements only
  // This allows particles, glows, etc. to fade in gradually without blocking UI
  requestAnimationFrame(() => {
    document.documentElement.classList.remove('disable-transitions');
    
    // On low-end devices or reduced motion, skip decorative transitions entirely
    const shouldSkipDecorativeTransitions = prefersReducedMotion() || deviceTier === 'low';
    if (!shouldSkipDecorativeTransitions) {
      document.documentElement.classList.add('theme-transition-stagger');
      
      // Remove stagger class after decorative elements finish transitioning
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition-stagger');
      }, 600);
    }
  });
  
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
