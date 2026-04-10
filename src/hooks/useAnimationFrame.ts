import { useEffect, useRef } from 'react';

/**
 * Custom hook for requestAnimationFrame loops
 * Automatically handles cleanup and provides delta time
 */
export function useAnimationFrame(
  callback: (deltaTime: number, elapsedTime: number) => void,
  enabled: boolean = true
) {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    const animate = (time: number) => {
      if (startTimeRef.current === undefined) {
        startTimeRef.current = time;
      }
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        const elapsedTime = time - startTimeRef.current;
        callback(deltaTime, elapsedTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      previousTimeRef.current = undefined;
      startTimeRef.current = undefined;
    };
  }, [callback, enabled]);
}
