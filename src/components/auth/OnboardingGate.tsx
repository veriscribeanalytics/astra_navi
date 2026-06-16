'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isProfileComplete } from '@/lib/profileCompleteness';

/**
 * Global onboarding gate.
 *
 * A logged-in user whose profile is missing birth details (DOB / time / place)
 * must finish onboarding before using the app — astrology features (chat with a
 * guide, kundli, horoscope) can't work without that data. This is especially
 * important for OAuth sign-ups (Google), which physically cannot collect birth
 * details during the handshake.
 *
 * Mounted once in the root layout so it fires on EVERY page, regardless of where
 * the post-sign-in redirect (callbackUrl) dropped the user — not just the
 * dashboard. Without this, a Google user bounced to /login?callbackUrl=/chat
 * lands back on /chat with an empty profile and chat silently degrades.
 *
 * Loop-safety: the redirect is gated on live profile fields
 * (profileCompleteFromFields). Once onboarding populates DOB/tob/pob, the gate
 * stops firing even though the OAuth JWT hint is still stale until token refresh.
 */

// Pages where the gate must never redirect: the onboarding page itself, auth
// pages, and standalone/utility routes. Everything else under the app is gated.
const EXEMPT_PREFIXES = [
  '/profile',
  '/login',
  '/register',
  '/logout',
  '/intro',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/support',
];

const OnboardingGate: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    isLoggedIn,
    user,
    profileComplete,
    profileFetched,
    needsOnboardingHint,
  } = useAuth();
  const redirectedRef = useRef(false);

  const profileCompleteFromFields = isProfileComplete({
    name: user?.name,
    dob: user?.dob,
    tob: user?.tob,
    pob: user?.pob,
    birthLatitude: user?.birthLatitude,
    birthLongitude: user?.birthLongitude,
    birthTimezoneName: user?.birthTimezoneName,
  });

  const isExempt = EXEMPT_PREFIXES.some(
    (p) => pathname === p || pathname?.startsWith(`${p}/`),
  );
  // Guest chat mode is an explicit opt-out — don't force onboarding there.
  const isGuestChat = pathname === '/chat' && searchParams.get('mode') === 'guest';

  useEffect(() => {
    if (!isLoggedIn || isExempt || isGuestChat || redirectedRef.current) return;

    // Act once we have a definitive completeness signal: the live profile fetch
    // resolved, or NextAuth flagged a fresh OAuth sign-in as incomplete.
    const haveSignal = profileFetched || needsOnboardingHint;
    if (!haveSignal || profileComplete || profileCompleteFromFields) return;

    // OAuth hint is authoritative immediately; otherwise give the fetch a beat.
    const delay = needsOnboardingHint ? 0 : 800;
    const timer = setTimeout(() => {
      if (redirectedRef.current) return;
      if (profileComplete || profileCompleteFromFields) return;
      redirectedRef.current = true;
      const ret = pathname && pathname !== '/' ? pathname : '/';
      router.push(`/profile?onboarding=true&return=${encodeURIComponent(ret)}`);
    }, delay);
    return () => clearTimeout(timer);
  }, [
    isLoggedIn,
    isExempt,
    isGuestChat,
    profileFetched,
    needsOnboardingHint,
    profileComplete,
    profileCompleteFromFields,
    pathname,
    router,
  ]);

  return null;
};

export default OnboardingGate;
