import { useState, useEffect, useRef } from 'react';

/**
 * Detects when user is actively scrolling
 * Returns true during scroll, false when stopped
 */
export function useScrollDetection(delay: number = 150): boolean {
  const [isScrolling, setIsScrolling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    const handleScroll = () => {
      // Set scrolling to true immediately
      if (!isScrolling) {
        setIsScrolling(true);
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set scrolling to false after delay
      timeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, delay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [delay, isScrolling]);

  return isScrolling;
}
