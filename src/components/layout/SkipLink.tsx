'use client';

import { useEffect } from 'react';

/**
 * Skip-to-content link with strict visibility rules:
 * - Renders only briefly after page load, while the user hasn't touched anything yet.
 * - If the user's FIRST interaction is pressing Tab, the link reveals (browser focuses it).
 * - Any other interaction (click, touch, scroll, or pressing a non-Tab key first) disables it
 *   for the rest of the session until the next refresh.
 */
export default function SkipLink() {
  useEffect(() => {
    // Start fresh on every mount (which is effectively every refresh / route load).
    document.body.classList.remove('skip-disabled');

    const disable = () => {
      document.body.classList.add('skip-disabled');
      cleanup();
    };

    const onKey = (e: KeyboardEvent) => {
      // First-key-is-Tab → keep the link active (browser will focus it).
      if (e.key === 'Tab') return;
      // Any other key first → disable.
      disable();
    };

    const onPointer = () => disable();

    document.addEventListener('keydown', onKey, { once: false });
    document.addEventListener('mousedown', onPointer, { once: true });
    document.addEventListener('touchstart', onPointer, { once: true });
    document.addEventListener('wheel', onPointer, { once: true, passive: true });

    function cleanup() {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('wheel', onPointer);
    }

    return cleanup;
  }, []);

  return (
    <a href="#main-content" className="skip-to-content">
      Skip to main content
    </a>
  );
}
