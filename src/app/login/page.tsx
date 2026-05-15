'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useToast, useTranslation } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import {
  Orbit, Sparkles, ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
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

const LoginContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError, ToastContainer } = useToast();
  const { showLoading, login: setAuthUser } = useAuth();
  const { t } = useTranslation();
  const [isRegister, setIsRegister] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockedRemaining, setLockedRemaining] = useState<number>(0);

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
      fetch('/api/auth/clear-session', { method: 'POST' })
        .catch(err => console.warn('[Login] Session clear failed:', err));
      router.replace('/login?sessionCleared=1');
      return;
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
    const result = await signIn('credentials', {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    if (result?.error) {
      if (result.error.toLowerCase().includes('locked')) {
        const lockoutEnd = Date.now() + 15 * 60 * 1000;
        setLockedUntil(lockoutEnd);
        setLockedRemaining(15 * 60);
        showError('Account locked due to too many failed attempts.');
        return { error: 'Account locked. Try again later.' };
      }
      const msg =
        result.error === 'CredentialsSignin'
          ? t('login.invalidCredentials')
          : result.error === 'Configuration'
            ? t('login.networkError')
            : result.error;
      return { error: msg };
    }

    showLoading(t('login.signingYouIn'), 1500);
    setTimeout(() => {
      router.push(getCallbackUrl());
    }, 1500);
  };

  // --- Register handler ---
  const handleRegister = async (submitData: {
    email: string; password: string; name: string; gender: string;
    phoneNumber: string; maritalStatus: string; occupation: string;
    dob: string; tob: string; pob: string; birthPlaceName: string;
    birthLatitude: number | undefined; birthLongitude: number | undefined;
    birthTimezoneName: string; language: string;
    preferences: { horoscope: boolean; notifications: boolean };
  }) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    });

    const data = await res.json();
    if (!res.ok) {
      const errorMsg = data.error || data.detail || t('login.registrationFailed');
      const msg = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
      throw new Error(msg);
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

    if (result?.error) throw new Error(result.error);

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
  };

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
          {/* Mobile-only logo */}
          <div className="lg:hidden flex justify-center mt-4 mb-2">
            <div className="flex flex-col items-center gap-1">
              <Image src="/icons/logo.jpeg" alt="AstraNavi" width={32} height={32} style={{ width: 'auto', height: 'auto' }} className="rounded-lg" />
              <h2 className="text-base font-headline font-bold text-primary">AstraNavi</h2>
            </div>
          </div>

          {/* Form body */}
          <div className="flex-1 p-4 sm:p-6 py-6 overflow-y-auto flex flex-col justify-center">
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
                />
              ) : (
                <RegisterFlow
                  onSubmit={async (data) => {
                    await handleRegister(data);
                    return { ok: true, data: {} };
                  }}
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
