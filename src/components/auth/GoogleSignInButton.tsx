'use client';

import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/hooks';

interface GoogleSignInButtonProps {
  /** Where to send the user after a successful Google auth. */
  callbackUrl?: string;
  disabled?: boolean;
  /** Called with a user-facing message if Google sign-in fails. */
  onError?: (message: string) => void;
}

/** Google's official 4-color "G" mark. */
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
  </svg>
);

/**
 * "Continue with Google" button — UI template.
 *
 * The actual sign-in is stubbed out below. When the backend Google flow is
 * ready, replace the body of {@link handleGoogleSignIn} with the real call.
 */
const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  callbackUrl = '/',
  disabled = false,
  onError,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      // ─── TODO(backend): wire up Google sign-in ─────────────────────────────
      // Most likely once a Google provider is configured in the next-auth setup:
      //
      //   import { signIn } from 'next-auth/react';
      //   await signIn('google', { callbackUrl });
      //
      // If the backend issues its OWN JWT (exchanges the Google credential),
      // call that endpoint here, then complete the session via
      //   signIn('credentials', { accessToken, refreshToken, ... }).
      // Remove the throw below once wired.
      void callbackUrl;
      throw new Error(t('auth.google.notConfigured') || 'Google sign-in is not available yet.');
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="secondary"
      fullWidth
      size="lg"
      loading={isLoading}
      disabled={disabled || isLoading}
      onClick={handleGoogleSignIn}
      leftIcon={!isLoading ? <GoogleIcon /> : undefined}
      className="!rounded-xl font-bold text-[12px] uppercase tracking-widest bg-surface"
    >
      {t('auth.google.continueWithGoogle') || 'Continue with Google'}
    </Button>
  );
};

export default GoogleSignInButton;
