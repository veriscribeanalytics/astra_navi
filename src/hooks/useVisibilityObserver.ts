import { useEffect, useRef, RefObject } from 'react';

interface UseVisibilityObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
}

/**
 * Custom hook to observe element visibility using IntersectionObserver
 * Useful for pausing animations when elements are off-screen
 */
export function useVisibilityObserver(
  elementRef: RefObject<HTMLElement>,
  onVisibilityChange: (isVisible: boolean) => void,
  options: UseVisibilityObserverOptions = {}
) {
  const { threshold = 0.1, root = null, rootMargin = '0px' } = options;
  const callbackRef = useRef(onVisibilityChange);

  useEffect(() => {
    callbackRef.current = onVisibilityChange;
  }, [onVisibilityChange]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        callbackRef.current(entry.isIntersecting);
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, threshold, root, rootMargin]);
}
