/**
 * React hook for real-time date/time updates in components
 * Automatically updates every minute to keep displayed times current
 */

import { useState, useEffect } from 'react';
import { getCurrentDateTime } from '@/lib/datetime';

/**
 * Hook that returns current date/time and updates every minute
 * Useful for displaying "X minutes ago" that stays current
 */
export function useRealTime(updateInterval: number = 60000): Date {
  const [now, setNow] = useState<Date>(getCurrentDateTime());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(getCurrentDateTime());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  return now;
}

/**
 * Hook for formatting relative time that auto-updates
 */
export function useRelativeTime(date: Date | string): string {
  const now = useRealTime();
  const d = typeof date === 'string' ? new Date(date) : date;
  
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
