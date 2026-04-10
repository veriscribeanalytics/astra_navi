import { useEffect, useRef } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface UseMouseMoveOptions {
  throttle?: boolean;
  passive?: boolean;
}

/**
 * Custom hook to track mouse movement
 * Optionally throttles updates using requestAnimationFrame
 */
export function useMouseMove(
  callback: (position: MousePosition) => void,
  options: UseMouseMoveOptions = {}
) {
  const { throttle = false, passive = true } = options;
  const rafRef = useRef<number>(undefined);
  const pendingPositionRef = useRef<MousePosition | null>(null);

  useEffect(() => {
    const applyCallback = () => {
      if (pendingPositionRef.current) {
        callback(pendingPositionRef.current);
        pendingPositionRef.current = null;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const position = { x: e.clientX, y: e.clientY };

      if (throttle) {
        pendingPositionRef.current = position;
        if (!rafRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            applyCallback();
            rafRef.current = undefined;
          });
        }
      } else {
        callback(position);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [callback, throttle, passive]);
}
