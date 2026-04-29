import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook to debounce a callback function
 * Useful for performance optimization with frequent updates
 */
export function useDebounce(
  callback: () => void,
  delay: number,
  dependencies: unknown[] = []
) {
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callback();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, delay]);
}

/**
 * Alternative: Returns a debounced value instead of calling a callback
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [value, delay]);

  return debouncedValue;
}
