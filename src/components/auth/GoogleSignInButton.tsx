'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslation } from '@/hooks';

interface GoogleSignInButtonProps {
  callbackUrl?: string;
  disabled?: boolean;
  onError?: (message: string) => void;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  callbackUrl = '/',
  disabled = false,
  onError,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID;

  const handleClick = async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);
    try {
      await signIn('google', { callbackUrl, redirect: true });
      // signIn with redirect:true navigates away — no need to reset isLoading
    } catch (err: unknown) {
      setIsLoading(false);
      onError?.(
        err instanceof Error
          ? err.message
          : 'Google sign-in is unavailable. Please try another method.',
      );
    }
  };

  if (!clientId) {
    return (
      <div className="w-full p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-400">
        Google Client ID not configured. Add{' '}
        <code className="bg-red-500/10 px-1 py-0.5 rounded font-mono">
          NEXT_PUBLIC_GOOGLE_CLIENT_ID
        </code>{' '}
        to your .env.local
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className="auth-google-btn"
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 3xl:h-6 3xl:w-6 text-[color-mix(in_srgb,var(--on-surface-variant)_55%,transparent)]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {t('login.signingYouIn')}
        </>
      ) : (
        <>
          {/* Google "G" logo */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className="3xl:w-7 3xl:h-7"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {t('login.googleSignIn')}
        </>
      )}
    </button>
  );
};

export default GoogleSignInButton;
