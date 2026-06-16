'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ExactIntro from './ExactIntro';
import { INTRO_SEEN_KEY } from './assets';

export default function SessionIntroGate() {
  const pathname = usePathname();
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    const html = document.documentElement;

    if (pathname === '/intro') {
      html.classList.remove('intro-pending');
      return;
    }

    const introCookie = `${INTRO_SEEN_KEY}=1`;
    const hasSeenIntro = document.cookie
      .split(';')
      .some((cookie) => cookie.trim() === introCookie);

    if (hasSeenIntro) {
      html.classList.remove('intro-pending', 'intro-playing');
      return;
    }

    document.cookie = `${introCookie}; path=/; SameSite=Lax`;
    html.classList.remove('intro-pending');
    html.classList.add('intro-playing');
    setShowIntro(true);

    return () => {
      html.classList.remove('intro-pending', 'intro-playing');
    };
  }, [pathname]);

  const handleComplete = useCallback(() => {
    setShowIntro(false);
    document.documentElement.classList.remove('intro-pending', 'intro-playing');
  }, []);

  if (!showIntro) return null;

  return (
    <div className="session-intro-gate">
      <ExactIntro autoComplete onComplete={handleComplete} />
    </div>
  );
}
