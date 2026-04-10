import { useEffect, RefObject } from 'react';

/**
 * Custom hook to observe element resize using ResizeObserver
 * Falls back to window resize listener if ResizeObserver is not available
 */
export function useResizeObserver(
  callback: () => void,
  elementRef: RefObject<HTMLElement> | RefObject<HTMLElement>[]
) {
  useEffect(() => {
    const elements = Array.isArray(elementRef) ? elementRef : [elementRef];
    const validElements = elements.map(ref => ref.current).filter(Boolean) as HTMLElement[];

    if (validElements.length === 0) return;

    // Fallback for browsers without ResizeObserver
    if (!window.ResizeObserver) {
      const handleResize = () => callback();
      window.addEventListener('resize', handleResize);
      callback(); // Initial call
      return () => window.removeEventListener('resize', handleResize);
    }

    // Use ResizeObserver
    const observers = validElements.map(element => {
      const observer = new ResizeObserver(callback);
      observer.observe(element);
      return observer;
    });

    callback(); // Initial call

    return () => {
      observers.forEach(observer => observer.disconnect());
    };
  }, [callback, elementRef]);
}
