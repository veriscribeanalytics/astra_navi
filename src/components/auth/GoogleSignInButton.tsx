'use client';

import React, { useEffect, useRef, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useTranslation } from '@/hooks';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  /** Where to send the user after a successful Google auth. */
  callbackUrl?: string;
  disabled?: boolean;
  /** Called with a user-facing message if Google sign-in fails. */
  onError?: (message: string) => void;
}

/**
 * Premium Google Sign-In Button.
 * Uses Google's latest Identity Services SDK for a secure, localized iframe button,
 * plus optional Google One Tap for seamless login.
 */
const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  callbackUrl = '/',
  disabled = false,
  onError,
}) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // 1. Dynamically load Google's newer Identity Services client library
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      console.error('Failed to load Google Identity Services SDK.');
    };
    document.body.appendChild(script);
  }, []);

  // 2. Initialize Google Sign-in and render the official button
  useEffect(() => {
    if (!scriptLoaded || !clientId || !buttonContainerRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          setIsLoading(true);
          try {
            // Call our Next.js API Proxy which validates via FastAPI
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ idToken: response.credential }),
            });

            const data = await res.json();

            if (!res.ok) {
              throw new Error(data.error || 'Google verification failed.');
            }

            // Establish the session in NextAuth using the pre-verified tokens
            const result = await signIn('credentials', {
              redirect: false,
              isRegistration: 'true',
              id: data.user.id,
              email: data.user.email ?? undefined,
              name: data.user.name ?? undefined,
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
              expiresIn: String(data.expiresIn),
            });

            if (result?.error) {
              throw new Error(result.error);
            }

            // Trigger safe redirection to onboarding if profile is incomplete
            const redirectTarget = data.profileComplete ? callbackUrl : '/profile?onboarding=true';
            window.location.href = redirectTarget;
          } catch (err: any) {
            console.error('Google sign-in error:', err);
            onError?.(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
          } finally {
            setIsLoading(false);
          }
        },
        auto_select: false,
      });

      // Render official Google button, responsive to its wrapper's width
      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        theme: 'outline', // 'outline' | 'filled_blue' | 'filled_black'
        size: 'large',
        shape: 'rectangular',
        width: buttonContainerRef.current.offsetWidth || 340,
        text: 'continue_with',
        logo_alignment: 'left',
      });

      // Optional: One Tap prompt disabled by default to avoid intrusive auto-prompts
      // window.google.accounts.id.prompt();
    } catch (err) {
      console.error('Error rendering Google Sign-In button:', err);
    }
  }, [scriptLoaded, clientId, callbackUrl, onError]);

  // Developer reminder helper if Client ID is missing
  if (!clientId) {
    return (
      <div className="w-full p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-xs text-red-400">
        Google Client ID not configured. Add <code className="bg-red-500/10 px-1 py-0.5 rounded font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to your .env.local
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[44px] relative">
      {/* Mount point for the official Google Identity Services button */}
      <div 
        ref={buttonContainerRef} 
        className="w-full flex justify-center"
        style={{ display: isLoading ? 'none' : 'flex' }}
      />
      
      {(isLoading || !scriptLoaded) && (
        <div className="w-full h-[44px] flex items-center justify-center rounded-xl bg-surface border border-outline-variant/30 animate-pulse text-xs text-on-surface-variant/60 gap-2">
          <svg className="animate-spin h-4 w-4 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {isLoading ? (t('login.signingYouIn') || 'Signing you in...') : (t('login.loadingGoogle') || 'Loading...')}
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;

