'use client';

/**
 * Theme Context Provider
 * Manages global theme state with performance optimization
 * Throttles React re-renders during rapid toggling — DOM updates are instant,
 * React state catches up once the user pauses clicking.
 */

import React, { createContext, useEffect, useState, useCallback, useRef } from 'react';
import { Theme, ThemeContextValue } from '@/types/theme';
import { detectDeviceTier, DeviceTier } from '@/utils/deviceTier';
import {
  getStoredTheme,
  getSystemTheme,
  applyThemeWithOptimization,
  getCurrentTheme,
} from '@/utils/themeManager';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [deviceTier, setDeviceTier] = useState<DeviceTier>('mid');
  
  // Throttle mechanism: defer React state updates during rapid toggling
  // DOM updates via applyThemeWithOptimization are instant; React re-renders
  // are batched and only fire after the user pauses for 250ms
  const stateUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize theme and device tier on mount
  useEffect(() => {
    // Detect device tier
    const tier = detectDeviceTier();
    setDeviceTier(tier);
    
    // Set device tier as data attribute for CSS
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-device-tier', tier);
    }

    // Initialize theme from storage or system preference
    const storedTheme = getStoredTheme();
    const initialTheme = storedTheme || getSystemTheme();
    
    setThemeState(initialTheme);

    // Sync theme across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
        applyThemeWithOptimization(newTheme, tier);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      if (newTheme !== 'light' && newTheme !== 'dark') {
        console.error('Invalid theme value:', newTheme);
        return;
      }

      // DOM update is instant — user sees the theme change immediately
      applyThemeWithOptimization(newTheme, deviceTier);

      // Throttle React state update: cancel any pending update and schedule a new one
      // This prevents render cascade buildup during rapid toggling
      if (stateUpdateTimerRef.current !== null) {
        clearTimeout(stateUpdateTimerRef.current);
      }
      stateUpdateTimerRef.current = setTimeout(() => {
        stateUpdateTimerRef.current = null;
        // Read the *actual* current theme from DOM (source of truth)
        // in case the user toggled multiple times — React only needs
        // to catch up to the final state
        const actualTheme = getCurrentTheme();
        setThemeState(actualTheme);
      }, 250);
    },
    [deviceTier]
  );

  const toggleTheme = useCallback(() => {
    // Read theme from DOM (source of truth) instead of React state
    // This avoids stale closure issues during rapid toggling
    const currentTheme = getCurrentTheme();
    const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [setTheme]);

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleTheme,
    deviceTier,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext };
