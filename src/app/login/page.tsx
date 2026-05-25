'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { useToast, useTranslation } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import {
  Orbit, Sparkles, ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  AuthShell,
  AuthFormCard,
  SignInForm,
  RegisterFlow,
} from '@/components/auth';
import { isProfileComplete } from '@/lib/profileCompleteness';
import { ParsedAuthError, parseAuthError } from '@/utils/authErrorParser';

const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError, ToastContainer } = useToast();
  const { showLoading, login: setAuthUser, isLoggedIn, user, logout } = useAuth();
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockedRemaining, setLockedRemaining] = useState<number>(0);
  const recoveryStartedRef = useRef(false);

  // Handle Lockout Countdown
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= lockedUntil) {
        setLockedUntil(null);
        setLockedRemaining(0);
        clearInterval(interval);
      } else {
        setLockedRemaining(Math.ceil((lockedUntil - now) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Handle NextAuth errors from query params
  useEffect(() => {
    const authError = searchParams.get('error');

    if (authError === 'SessionExpired') {
      if (recoveryStartedRef.current) return;
      recoveryStartedRef.current = true;
      sessionStorage.removeItem('auth_recovery_attempts');
      window.history.replaceState(null, '', '/login?sessionCleared=1');
      window.setTimeout(() => showError('Your session has expired. Please sign in again.'), 500);

      void (async () => {
        try {
          await fetch('/api/auth/clear-session', { method: 'POST', cache: 'no-store' });
        } catch {
          // Best effort. Middleware also sends cookie deletion headers.
        }

        try {
          await signOut({ redirect: false, redirectTo: '/login?sessionCleared=1' });
        } catch {
          // Keep the user on the stable login form even if the sign-out POST fails.
        }
      })();

      return; // stop looping - show the form so user can sign in manually
    }
    // Clear the counter once the user lands on a clean login page
    if (!authError) {
      recoveryStartedRef.current = false;
      sessionStorage.removeItem('auth_recovery_attempts');
    }

    if (authError) {
      const errorMessages: Record<string, string> = {
        Signin: 'Try signing in with a different account.',
        OAuthSignin: 'Try signing in with a different account.',
        OAuthCallback: 'Try signing in with a different account.',
        OAuthCreateAccount: 'Try signing in with a different account.',
        EmailCreateAccount: 'Try signing in with a different account.',
        Callback: 'Try signing in with a different account.',
        OAuthAccountNotLinked: 'To confirm your identity, please sign in with the same account you used originally.',
        EmailSignin: 'Check your email address.',
        CredentialsSignin: t('login.invalidCredentials'),
        Configuration: t('login.networkError'),
        SessionRequired: 'Please sign in to access this page.',
        SessionExpired: 'Your session has expired. Please sign in again.',
        default: 'An error occurred. Please try again.',
      };

      const message = errorMessages[authError] || authError;
      const timer = setTimeout(() => showError(message), 500);
      return () => clearTimeout(timer);
    }
  }, [searchParams, showError, t, router]);

  /** Extract callbackUrl, stripping nested callbackUrl params (Bug 2 fix). */
  const getCallbackUrl = (): string => {
    let cb = searchParams.get('callbackUrl') || '/?login=success';
    if (cb.includes('callbackUrl=')) {
      try {
        const url = new URL(cb, window.location.origin);
        url.searchParams.delete('callbackUrl');
        cb = url.pathname + url.search + url.hash;
      } catch {
        cb = cb.split('?')[0];
      }
    }
    return cb;
  };

  // --- Sign In handler ---
  const handleSignIn = async (formData: { email: string; password: string }) => {
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, password: formData.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const parsedError = parseAuthError(data);
        if (parsedError.code === 'account_locked' || (parsedError.message && parsedError.message.toLowerCase().includes('locked'))) {
          const seconds = parsedError.retryAfterSeconds || 15 * 60;
          const lockoutEnd = Date.now() + seconds * 1000;
          setLockedUntil(lockoutEnd);
          setLockedRemaining(seconds);
        }
        return { parsedError };
      }

      // If credentials check succeeded, proceed with NextAuth signIn to establish the session.
      const result = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (result?.error) {
        return { parsedError: parseAuthError(result.error) };
      }

      showLoading(t('login.signingYouIn'), 1500);
      setTimeout(() => {
        router.push(getCallbackUrl());
      }, 1500);

    } catch (err: unknown) {
      return { parsedError: parseAuthError(err) };
    }
  };

  // --- Register handler ---
  const handleRegister = async (submitData: {
    email: string; password: string; name: string; gender: string;
    phoneNumber: string; maritalStatus: string; occupation: string;
    dob: string; tob: string; pob: string; birthPlaceName: string;
    birthLatitude: number | undefined; birthLongitude: number | undefined;
    birthTimezoneName: string; language: string;
    preferences: { horoscope: boolean; notifications: boolean };
  }): Promise<{ ok: boolean; data: Record<string, unknown>; parsedError?: ParsedAuthError | null }> => {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { ok: false, data: {}, parsedError: parseAuthError(data) };
      }

      success(t('login.accountCreated'));

      // Save preferences if different from defaults
      if (submitData.preferences) {
        try {
          await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${data.accessToken}`,
            },
            body: JSON.stringify({ preferences: submitData.preferences }),
          });
        } catch {
          // non-critical — preference save is best-effort
        }
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        redirect: false,
        isRegistration: 'true',
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
      });

      if (result?.error) {
        return { ok: false, data: {}, parsedError: parseAuthError(result.error) };
      }

      const { password: _password, ...profileData } = submitData;
      setAuthUser(data.user.email, {
        ...profileData,
        id: data.user.id,
        name: data.user.name || submitData.name,
      });

      showLoading(t('login.signingYouIn'), 1500);
      setTimeout(() => {
        router.push(data.profileComplete || isProfileComplete(submitData) ? '/?login=success' : '/profile?onboarding=true');
      }, 1500);

      return { ok: true, data: data || {} };
    } catch (err: unknown) {
      return { ok: false, data: {}, parsedError: parseAuthError(err) };
    }
  };

  const handleActionClick = (action: string) => {
    if (action === 'register') {
      setIsRegister(true);
    } else if (action === 'login') {
      setIsRegister(false);
    } else if (action === 'reset_password') {
      router.push('/forgot-password');
    }
  };

  // Respect `?action=register` on mount so deep-links from "Sign Up" CTAs
  // (navbar, landing-page hero) drop the user straight into the register
  // form instead of the sign-in form. Runs once: after this the user can
  // toggle freely without the URL fighting them.
  const initialActionRef = useRef(false);
  useEffect(() => {
    if (initialActionRef.current) return;
    initialActionRef.current = true;
    if (searchParams.get('action') === 'register') {
      setIsRegister(true);
    }
  }, [searchParams]);

  const [quoteIndex, setQuoteIndex] = useState(0);
  const quotes = [
    'The stars do not pull us, they guide us.',
    'Your destiny is a map, let Navi be your compass.',
    'Align with the cosmic frequency of your true self.',
    'In the silence of the heavens, your story is written.',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [quotes.length]);

  const lockedDisplay = lockedUntil
    ? `Locked (${Math.floor(lockedRemaining / 60)}:${(lockedRemaining % 60).toString().padStart(2, '0')})`
    : undefined;

  // Map known protected destinations to a human-readable label so the bounce
  // banner can tell the user *why* they landed on /login. Unknown / empty
  // callbackUrls fall through to no banner.
  const destinationLabel = (() => {
    const cb = searchParams.get('callbackUrl');
    if (!cb || cb === '/' || cb.startsWith('/?')) return null;
    const path = cb.split('?')[0];
    const map: Record<string, string> = {
      '/chat': t('nav.chatWithNavi'),
      '/profile': t('nav.userProfile') || 'Your Profile',
      '/family': t('nav.myFamily'),
      '/kundli': t('nav.myKundli'),
      '/kundli/match': t('nav.chartMatching'),
      '/horoscope/forecast': t('nav.forecast'),
      '/consult': t('nav.guidedSessions'),
      '/plans': t('nav.astraNaviPremium'),
    };
    return map[path] || null;
  })();

  return (
    <AuthShell mouseGlow fullHeight className="px-0">
      {ToastContainer}

      <div className="w-full max-w-[1600px] mx-auto min-h-[calc(100dvh-var(--navbar-height,64px))] relative z-10 flex flex-col lg:flex-row items-stretch">
        {/* Left Panel: Brand & Vision (Desktop) */}
        <div className="hidden lg:flex flex-1 p-12 xl:p-20 flex-col relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-10">
            <Orbit className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] text-secondary animate-orbit" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Spacer to maintain layout without the duplicate logo */}
            <div className="mb-auto"></div>

            <div className="flex-1 flex flex-col justify-center py-12">
              <div className="space-y-4">
                <h2 className="text-3xl xl:text-4xl font-headline font-bold text-primary leading-tight">
                  {t('login.blueprintTitle').split(' ').map((word, i) =>
                    word === 'Personal' ? (
                      <span key={i} className="text-secondary italic"> {word} </span>
                    ) : (
                      <React.Fragment key={i}>{i === 0 ? '' : ' '}{word}</React.Fragment>
                    )
                  )}
                </h2>
                <p className="text-base text-on-surface-variant max-w-sm leading-relaxed">
                  {t('login.blueprintDesc')}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <div className="h-16 flex flex-col justify-end">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={quoteIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-[13px] font-medium italic text-secondary"
                  >
                    &quot;{quotes[quoteIndex]}&quot;
                  </motion.p>
                </AnimatePresence>
              </div>
              <div className="mt-6 flex gap-6">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-primary">12</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-bold">{t('login.statRashis')}</span>
                </div>
                <div className="w-[1px] bg-outline-variant/30" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-xl font-bold text-primary">27</span>
                  <span className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-bold">{t('login.statNakshatras')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Auth Form */}
        <div className="w-full lg:w-[550px] xl:w-[650px] flex flex-col min-h-[calc(100dvh-var(--navbar-height,64px))] overflow-hidden relative">
          {/* Form body */}
          <div className="flex-1 p-4 sm:p-6 py-6 overflow-y-auto flex flex-col">
            <div className="m-auto w-full">
              {/* Already-signed-in banner — shown when a returning user lands on /login
                  with a valid session (e.g. clicked a shared /login link). Provides a
                  clear path to the dashboard or to sign out, instead of silently
                  bouncing them into a feature page. */}
              {isLoggedIn && user && (
                <div className="mb-6 mx-2 sm:mx-4 rounded-2xl border border-secondary/30 bg-secondary/5 px-4 py-4 sm:px-5 sm:py-5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-secondary/15 border border-secondary/30 text-secondary flex items-center justify-center text-sm font-headline font-bold shrink-0">
                      {(user.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-secondary">
                        {t('login.alreadySignedIn')}
                      </p>
                      <p className="mt-0.5 text-sm font-headline font-semibold text-primary truncate">
                        {user.name || user.email}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => router.push('/')}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-secondary text-on-primary text-[11px] sm:text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                    >
                      {t('login.goToDashboard')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { void logout('/login?signedOut=1'); }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-transparent border border-outline-variant/30 text-on-surface-variant text-[11px] sm:text-xs font-bold uppercase tracking-widest hover:border-secondary/40 hover:text-secondary transition-colors"
                    >
                      {t('login.signOut')}
                    </button>
                  </div>
                </div>
              )}

              {/* Bounce-context banner — shown when the proxy/middleware
                  redirected the user here from a protected route. Tells them
                  exactly *why* they're seeing the login form. */}
              {!isLoggedIn && destinationLabel && (
                <div className="mb-5 mx-2 sm:mx-4 rounded-2xl border border-secondary/20 bg-secondary/[0.04] px-4 py-3 sm:px-5 sm:py-3.5 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-secondary mt-0.5 shrink-0" />
                  <p className="text-[12px] sm:text-[13px] leading-relaxed text-on-surface-variant">
                    {t('login.signInToContinue')}{' '}
                    <span className="font-bold text-primary">{destinationLabel}</span>
                  </p>
                </div>
              )}

              {/* Header */}
              <div className="px-4 sm:px-6 pb-6 shrink-0">
                <h1 className="text-xl sm:text-2xl font-headline font-bold text-primary mb-0.5 text-center">
                  {isRegister ? t('login.stepAccount') || 'Create Your Account' : t('login.signIn')}
                </h1>
                <p className="text-[11px] sm:text-xs text-on-surface-variant/60 font-medium text-center">
                  {isRegister ? t('login.joinCelestialJourney') : t('login.welcomeBack')}
                </p>
              </div>

              <AuthFormCard>
                {!isRegister ? (
                  <SignInForm
                    onSubmit={handleSignIn}
                    disabled={!!lockedUntil}
                    disabledReason={lockedDisplay}
                    onForgotPassword={() => router.push('/forgot-password')}
                    onActionClick={handleActionClick}
                  />
                ) : (
                  <RegisterFlow
                    onSubmit={handleRegister}
                    onActionClick={handleActionClick}
                  />
                )}

                <div className="flex items-center gap-4 py-3">
                  <div className="h-[1px] flex-1 bg-outline-variant/10" />
                  <span className="text-[8px] uppercase tracking-widest text-on-surface-variant/20 font-bold">
                    {t('login.secureConnection')}
                  </span>
                  <div className="h-[1px] flex-1 bg-outline-variant/10" />
                </div>

                <div className="text-center pt-3">
                  <button
                    type="button"
                    onClick={() => setIsRegister(!isRegister)}
                    className="text-[9px] font-bold uppercase tracking-[0.12em] text-on-surface-variant/30 hover:text-secondary transition-colors"
                  >
                    {isRegister ? (
                      <>{t('login.alreadyHaveAccount')} <span className="text-secondary ml-1">{t('login.signIn')}</span></>
                    ) : (
                      <>{t('login.dontHaveAccount')} <span className="text-secondary ml-1">{t('login.createAccount')}</span></>
                    )}
                  </button>
                </div>
              </AuthFormCard>
            </div>
          </div>
        </div>

        {/* Bottom badging */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-20 pointer-events-none whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <Sparkles size={10} className="text-secondary" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-primary">AI x Jyotish</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={10} className="text-secondary" />
            <span className="text-[8px] font-bold uppercase tracking-widest text-primary">Secure</span>
          </div>
        </div>
      </div>
    </AuthShell>
  );
};

const LoginPage = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
};

export default LoginPage;
