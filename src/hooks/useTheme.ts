'use client';

/**
 * useTheme Hook
 * Custom hook for consuming theme context
 */

import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { ThemeContextValue } from '@/types/theme';

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}
