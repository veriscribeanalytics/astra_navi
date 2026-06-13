'use client';

import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Cookie, ChevronRight } from 'lucide-react';
import { useCookieConsent } from '@/context/CookieConsentContext';
import CookiePreferencesModal from './CookiePreferencesModal';

/**
 * CookieConsentBanner
 *
 * DPDP Act 2023 compliant first-visit consent banner.
 * Appears as a fixed bottom bar until the user makes a choice.
 * Only essential cookies are set before consent.
 *
 * India DPDP Rules 2025, Rule 3 — notice must be:
 * - Standalone and clearly presented
 * - In plain language
 * - Available before processing begins
 */
const CookieConsentBanner: React.FC = () => {
  const {
    showBanner,
    preferencesOpen,
    acceptAll,
    acceptEssential,
    openPreferences,
    closePreferences,
    togglePreference,
    savePreferences,
  } = useCookieConsent();

  const bannerRef = useRef<HTMLDivElement>(null);
  const acceptAllRef = useRef<HTMLButtonElement>(null);

  // Focus trap — focus the accept button when banner appears
  useEffect(() => {
    if (showBanner && acceptAllRef.current) {
      // Small delay so the animation finishes first
      const timer = setTimeout(() => acceptAllRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [showBanner]);

  // Close on Escape
  useEffect(() => {
    if (!showBanner) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Escape does nothing — user must make a choice (DPDP requirement)
        // But we can let them know
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showBanner]);

  if (!showBanner) return null;

  return (
    <>
      {/* Banner — non-blocking, slides up from bottom. No backdrop overlay
          so the user can continue browsing. Essential cookies are already
          set; this banner only gates functional / analytics / marketing. */}
      <div
        ref={bannerRef}
        role="dialog"
        aria-modal="false"
        aria-label="Cookie consent"
        className="safe-area-bottom fixed bottom-0 left-0 right-0 z-[1001] animate-in slide-in-from-bottom duration-500"
      >
        <div className="max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2400px] mx-auto p-3 sm:p-4">
          <div className="bg-surface/98 backdrop-blur-xl border border-secondary/20 rounded-2xl sm:rounded-3xl shadow-2xl shadow-black/40 p-4 sm:p-6 lg:p-7 flex flex-col lg:flex-row lg:items-center gap-4 sm:gap-5">
            {/* Icon + Text */}
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center mt-0.5">
                <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-headline font-bold text-primary mb-1 sm:mb-1.5 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
                  Your Privacy, Your Choice
                </h2>
                <p className="text-xs sm:text-sm text-primary/70 leading-relaxed max-w-2xl">
                  Astra Navi uses cookies and similar technologies to provide a
                  secure, personalized Vedic astrology experience. With your
                  consent, we use functional cookies for preferences and
                  optional cookies to improve our service. Your data is
                  protected under India&apos;s{' '}
                  <strong>Digital Personal Data Protection (DPDP) Act, 2023</strong>
                  . You can review or change your preferences anytime.
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <a
                    href="/privacy"
                    className="text-[11px] sm:text-xs text-secondary hover:text-secondary/80 font-bold transition-colors underline underline-offset-2"
                  >
                    Privacy Policy
                  </a>
                  <span className="text-primary/20">|</span>
                  <a
                    href="/privacy/subprocessors"
                    className="text-[11px] sm:text-xs text-secondary hover:text-secondary/80 font-bold transition-colors underline underline-offset-2"
                  >
                    Subprocessors
                  </a>
                </div>
              </div>
            </div>

            {/* Buttons — Accept Essential Only + Accept All as primary CTAs */}
            <div className="flex flex-col sm:flex-row gap-2.5 lg:gap-3 shrink-0">
              <button
                onClick={acceptEssential}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-[18px] text-[11px] sm:text-xs font-bold uppercase tracking-wider border border-outline-variant/40 text-primary/60 hover:text-primary hover:border-outline-variant/60 transition-all bg-transparent cursor-pointer"
              >
                Accept Essential Only
              </button>
              <button
                ref={acceptAllRef}
                onClick={acceptAll}
                className="auth-btn-gold px-5 sm:px-6 py-2.5 sm:py-3 !rounded-[18px] !text-[11px] sm:!text-xs flex items-center gap-1.5 justify-center cursor-pointer"
              >
                Accept All
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.5} />
              </button>
            </div>

            {/* Customize — smaller, below buttons on mobile, inline on desktop */}
            <button
              onClick={openPreferences}
              className="text-[10px] sm:text-[11px] text-primary/35 hover:text-secondary transition-colors underline underline-offset-2 cursor-pointer lg:absolute lg:right-4 lg:bottom-1"
            >
              Customize preferences
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      <CookiePreferencesModal
        isOpen={preferencesOpen}
        onClose={closePreferences}
        onSave={savePreferences}
        onToggle={togglePreference}
      />
    </>
  );
};

export default CookieConsentBanner;
