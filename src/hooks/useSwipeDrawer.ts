import { useCallback, useRef } from 'react';

interface SwipeDrawerOptions {
  onOpenLeft?: () => void;
  onOpenRight?: () => void;
  onCloseLeft?: () => void;
  onCloseRight?: () => void;
  leftEdgeWidth?: number;
  rightEdgeWidth?: number;
  threshold?: number;
  maxWidth?: number;
}

interface SwipeDrawerReturn {
  bindGestures: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove: (e: React.TouchEvent) => void;
    onTouchEnd: () => void;
  };
}

export function useSwipeDrawer(options: SwipeDrawerOptions = {}): SwipeDrawerReturn {
  const {
    onOpenLeft,
    onOpenRight,
    onCloseLeft,
    onCloseRight,
    leftEdgeWidth = 20,
    rightEdgeWidth = 20,
    threshold = 50,
    maxWidth = 1024,
  } = options;

  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentXRef = useRef(0);
  const currentYRef = useRef(0);
  const edgeRef = useRef<'left' | 'right' | null>(null);
  const trackedRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.innerWidth >= maxWidth) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    currentXRef.current = touch.clientX;
    currentYRef.current = touch.clientY;
    trackedRef.current = true;

    if (touch.clientX <= leftEdgeWidth) {
      edgeRef.current = 'left';
    } else if (touch.clientX >= window.innerWidth - rightEdgeWidth) {
      edgeRef.current = 'right';
    } else {
      edgeRef.current = null;
      trackedRef.current = false;
    }
  }, [leftEdgeWidth, rightEdgeWidth, maxWidth]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!trackedRef.current || window.innerWidth >= maxWidth) return;
    const touch = e.touches[0];
    currentXRef.current = touch.clientX;
    currentYRef.current = touch.clientY;
  }, [maxWidth]);

  const handleTouchEnd = useCallback(() => {
    if (!trackedRef.current || window.innerWidth >= maxWidth) return;
    trackedRef.current = false;

    const dx = currentXRef.current - startXRef.current;
    const dy = currentYRef.current - startYRef.current;
    const edge = edgeRef.current;

    edgeRef.current = null;

    if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx) * 0.75) return;

    if (edge === 'left' && dx > 0) {
      onOpenLeft?.();
    } else if (edge === 'left' && dx < 0) {
      onCloseLeft?.();
    } else if (edge === 'right' && dx < 0) {
      onOpenRight?.();
    } else if (edge === 'right' && dx > 0) {
      onCloseRight?.();
    }
  }, [onOpenLeft, onOpenRight, onCloseLeft, onCloseRight, threshold, maxWidth]);

  return {
    bindGestures: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}