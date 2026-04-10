/**
 * Theme Type Definitions
 * Core types and interfaces for theme management system
 */

import { DeviceTier } from '@/utils/deviceTier';

export type Theme = 'light' | 'dark';

export interface ThemeConfig {
  theme: Theme;
  enableTransitions: boolean;
  deviceTier: DeviceTier;
  transitionDuration: number; // milliseconds
  performanceBudget: PerformanceBudget;
}

export interface PerformanceBudget {
  maxRepaintTime: number; // milliseconds
  maxTransitionDuration: number; // milliseconds
  allowAnimations: boolean;
  useWillChange: boolean;
  scopeRepaints: boolean;
}

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  deviceTier: DeviceTier;
}

export interface PerformanceMetrics {
  repaintTime: number;
  transitionDuration: number;
  deviceTier: DeviceTier;
  timestamp: number;
}

/**
 * Gets performance budget based on device tier
 * @param deviceTier - The device tier classification
 * @returns PerformanceBudget configuration
 */
export function getPerformanceBudget(deviceTier: DeviceTier): PerformanceBudget {
  switch (deviceTier) {
    case 'low':
      return {
        maxRepaintTime: 16,
        maxTransitionDuration: 0,
        allowAnimations: false,
        useWillChange: false,
        scopeRepaints: true,
      };
    case 'mid':
      return {
        maxRepaintTime: 32,
        maxTransitionDuration: 150,
        allowAnimations: true,
        useWillChange: true,
        scopeRepaints: true,
      };
    case 'high':
      return {
        maxRepaintTime: 50,
        maxTransitionDuration: 300,
        allowAnimations: true,
        useWillChange: true,
        scopeRepaints: true,
      };
  }
}

/**
 * Validates theme value
 * @param value - Value to validate
 * @returns boolean indicating if value is a valid theme
 */
export function isValidTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}
