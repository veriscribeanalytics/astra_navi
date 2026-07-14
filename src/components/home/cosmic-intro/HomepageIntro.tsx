'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import SessionIntroGate from './SessionIntroGate';

/**
 * Homepage-scoped cosmic intro wrapper.
 *
 * The intro used to mount globally from the root layout, so a first visit to
 * ANY page (/login, /forgot-password, /reset-password, /logout, /privacy,
 * /terms, deep links) added `html.intro-pending`, which globals.css uses to
 * hide nav/footer/main. That blanked auth + recovery screens for fresh
 * sessions (17 Playwright failures + real users landing on shared links).
 *
 * This wrapper renders the gate ONLY on pathname === "/", preserving the
 * gate's original body-level DOM position (a sibling of <main>, so it is not
 * hidden by the `main { visibility: hidden }` rule). Auth/recovery/legal/deep
 * links never get it, so they render immediately on a fresh session.
 *
 * A hard fallback also strips the hiding classes after a generous cap, so the
 * page is never stuck hidden even if the intro or hydration fails to complete.
 */
export default function HomepageIntro() {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  React.useEffect(() => {
    if (!isHomepage) return;
    // Safety net: if the intro or hydration stalls, force-remove the hiding
    // classes so the page can never stay blank indefinitely.
    const fallback = window.setTimeout(() => {
      document.documentElement.classList.remove('intro-pending', 'intro-playing');
    }, 9000);
    return () => window.clearTimeout(fallback);
  }, [isHomepage]);

  if (!isHomepage) return null;
  return <SessionIntroGate />;
}
