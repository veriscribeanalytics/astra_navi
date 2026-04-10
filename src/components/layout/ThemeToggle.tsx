'use client';

/**
 * ThemeToggle Component (Optimized)
 * Accessible theme toggle button with performance optimization
 */

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme();
    
    // Announce theme change to screen readers
    setAnnouncement(`Switched to ${newTheme} mode`);
    setTimeout(() => setAnnouncement(''), 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg bg-surface hover:bg-surface-variant transition-colors border border-secondary/10 opacity-50 ${className}`}
        disabled
        aria-label="Loading theme toggle"
      >
        <span className="material-symbols-outlined text-lg">light_mode</span>
      </button>
    );
  }

  const isDark = theme === 'dark';
  const icon = isDark ? 'light_mode' : 'dark_mode';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <>
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-[34px] h-[34px] flex items-center justify-center rounded-lg bg-surface hover:bg-surface-variant transition-colors border border-secondary/10 group active:scale-95 cursor-pointer ${className}`}
        aria-label={label}
        aria-pressed={isDark}
        type="button"
      >
        <span className={`material-symbols-outlined text-lg transition-all duration-500 ${isDark ? 'text-secondary rotate-[360deg]' : 'text-primary'}`}>
          {icon}
        </span>
        {showLabel && (
          <span className="ml-2 text-sm font-medium">
            {isDark ? 'Dark' : 'Light'}
          </span>
        )}
      </button>
      
      {/* Screen reader announcement */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </>
  );
}
