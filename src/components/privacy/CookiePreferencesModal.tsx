'use client';

import React, { useEffect, useRef } from 'react';
import { X, ShieldCheck, ShieldAlert, Check } from 'lucide-react';
import { useCookieConsent } from '@/context/CookieConsentContext';
import { ConsentPreference } from '@/types/consent';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  onToggle: (category: string) => void;
}

/**
 * CookiePreferencesModal
 *
 * Granular consent management modal. Allows the user to toggle
 * individual cookie categories before saving their preference.
 *
 * DPDP Act 2023, Section 6 — consent must be:
 * - Free, specific, informed, unconditional, and unambiguous
 * - Given through clear affirmative action
 * - As easy to withdraw as to give
 */
const CookiePreferencesModal: React.FC<CookiePreferencesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onToggle,
}) => {
  const { preferences } = useCookieConsent();
  const modalRef = useRef<HTMLDivElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);
  const overflowModifiedRef = useRef(false);

  // Trap focus + handle Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      overflowModifiedRef.current = true;
      // Focus save button after open animation
      setTimeout(() => saveBtnRef.current?.focus(), 200);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (overflowModifiedRef.current) {
        document.body.style.overflow = '';
        overflowModifiedRef.current = false;
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-prefs-title"
    >
      <div
        ref={modalRef}
        className="bg-surface border border-outline-variant/30 rounded-[32px] w-full max-w-lg animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 overflow-hidden shadow-2xl shadow-black/40"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-outline-variant/15">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2
                id="cookie-prefs-title"
                className="text-base sm:text-lg font-headline font-bold text-primary"
              >
                Cookie Preferences
              </h2>
              <p className="text-[10px] sm:text-xs text-primary/50">
                Manage your privacy settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-primary/5 transition-colors text-primary/40 hover:text-primary/70 cursor-pointer"
            aria-label="Close preferences"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preferences List */}
        <div className="p-5 sm:p-6 space-y-1 max-h-[50vh] overflow-y-auto">
          <p className="text-xs text-primary/60 mb-4 leading-relaxed">
            We use cookies and similar technologies to provide essential
            services and enhance your experience. Below you can choose which
            categories you allow. Your preferences are stored locally and you
            can change them at any time via the Privacy Settings page.
          </p>

          {preferences.map((pref) => (
            <PreferenceRow
              key={pref.category}
              preference={pref}
              onToggle={onToggle}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-2.5 p-5 sm:p-6 border-t border-outline-variant/15 bg-background/30">
          <p className="text-[10px] sm:text-xs text-primary/40 leading-relaxed flex-1">
            Your choices are stored locally and logged in compliance with
            India&apos;s DPDP Act, 2023.
          </p>
          <button
            ref={saveBtnRef}
            onClick={onSave}
            className="auth-btn-gold px-5 sm:px-6 py-2.5 sm:py-3 !rounded-[18px] !text-[11px] sm:!text-xs flex items-center gap-1.5 justify-center shrink-0 font-bold cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

/** Individual preference toggle row. */
const PreferenceRow: React.FC<{
  preference: ConsentPreference;
  onToggle: (category: string) => void;
}> = ({ preference, onToggle }) => {
  const { category, name, description, required, enabled } = preference;
  const id = `pref-${category}`;

  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl transition-all cursor-pointer ${
        required
          ? 'bg-primary/[0.02] cursor-default'
          : 'hover:bg-primary/[0.03]'
      }`}
    >
      {/* Toggle switch */}
      <div className="shrink-0 mt-0.5">
        {required ? (
          <div className="w-10 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
            <ShieldAlert className="w-3 h-3 text-secondary" />
          </div>
        ) : (
          <button
            type="button"
            role="switch"
            id={id}
            aria-checked={enabled}
            onClick={(e) => {
              e.preventDefault();
              onToggle(category);
            }}
            className={`w-10 h-6 rounded-full transition-all duration-300 relative cursor-pointer ${
              enabled
                ? 'bg-secondary shadow-[0_0_8px_rgba(200,136,10,0.3)]'
                : 'bg-primary/15'
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${
                enabled ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">{name}</span>
          {required && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full">
              Required
            </span>
          )}
        </div>
        <p className="text-xs text-primary/55 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </label>
  );
};

export default CookiePreferencesModal;
