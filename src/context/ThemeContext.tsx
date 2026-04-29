'use client';

/**
 * Theme Context Provider
 * Manages global theme state with performance optimization
 */

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { Theme, ThemeContextValue } from '@/types/theme';
import { detectDeviceTier, DeviceTier } from '@/utils/deviceTier';
import {
  getStoredTheme,
  getSystemTheme,
  applyThemeWithOptimization,
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
  const [mounted, setMounted] = useState(false);

  // Initialize theme and device tier on mount
  useEffect(() => {
    // Detect device tier
    const tier = detectDeviceTier();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDeviceTier(tier);
    
    // Set device tier as data attribute for CSS
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-device-tier', tier);
    }

    // Initialize theme from storage or system preference
    const storedTheme = getStoredTheme();
    const initialTheme = storedTheme || getSystemTheme();
    
    setThemeState(initialTheme);
    setMounted(true);

    // Sync theme across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue as Theme);
        applyThemeWithOptimization(e.newValue as Theme, deviceTier);
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

      setThemeState(newTheme);
      applyThemeWithOptimization(newTheme, deviceTier);
    },
    [deviceTier]
  );

  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [theme, setTheme]);

  const value: ThemeContextValue = {
    theme,
    setTheme,
    toggleTheme,
    deviceTier,
  };

  // Prevent flash by not rendering until mounted
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export { ThemeContext };
