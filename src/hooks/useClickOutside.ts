import { useEffect, RefObject } from 'react';

/**
 * Custom hook to detect clicks outside of specified element(s)
 * Useful for closing dropdowns, modals, and menus
 */
export function useClickOutside(
  refs: RefObject<HTMLElement> | RefObject<HTMLElement>[],
  callback: (event: MouseEvent) => void
) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const refsArray = Array.isArray(refs) ? refs : [refs];
      const target = event.target as Node;

      // Check if click is outside all provided refs
      const isOutside = refsArray.every(ref => {
        return !ref.current || !ref.current.contains(target);
      });

      if (isOutside) {
        callback(event);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [refs, callback]);
}
