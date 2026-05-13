'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { locales, LanguageCode, languages, defaultLanguage } from '@/locales';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  /** Sync frontend language FROM a backend profile value.
   *  Updates state, localStorage, NEXT_LOCALE cookie, and <html lang>
   *  but does NOT PUT to /api/user/profile — avoids sync loops. */
  syncLanguageFromProfile: (code: LanguageCode) => void;
  t: (key: string) => string;
  availableLanguages: typeof languages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: React.ReactNode;
  /** Initial language from server (read from NEXT_LOCALE cookie).
   *  Eliminates hydration mismatch: server renders in this language,
   *  client first render matches, then syncs with localStorage. */
  initialLanguage?: string;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children, initialLanguage }) => {
  // Use server-provided language for initial state → eliminates hydration mismatch.
  // If no server value, use defaultLanguage (matches what server would render).
  const serverLang = (initialLanguage && locales[initialLanguage as LanguageCode])
    ? (initialLanguage as LanguageCode)
    : defaultLanguage;

  const [language, setLanguageState] = useState<LanguageCode>(serverLang);

  // After hydration, sync with localStorage — this may differ from serverLang
  // if the user changed language in another tab or the cookie wasn't set yet,
  // but since it runs AFTER hydration, it won't cause a mismatch.
  useEffect(() => {
    const saved = localStorage.getItem('language') as LanguageCode;
    if (saved && locales[saved] && saved !== language) {
      setLanguageState(saved);
    }
    document.documentElement.lang = language;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- intentional: run once after mount

  // Keep <html lang> in sync with language changes after initial mount
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const applyLanguageLocally = useCallback((code: LanguageCode) => {
    if (!locales[code]) return;
    setLanguageState(code);
    localStorage.setItem('language', code);
    document.documentElement.lang = code;
    // Set NEXT_LOCALE cookie so the server can read it on next request
    // (eliminates hydration mismatch on subsequent page loads).
    // max-age = 1 year, SameSite=Lax, Path=/ (accessible to all routes)
    document.cookie = `NEXT_LOCALE=${code};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
  }, []);

  /**
   * Full language change from a manual user action.
   * Persists to backend profile for logged-in users and dispatches a
   * custom event so AuthContext can update user.language locally.
   */
  const setLanguage = useCallback((code: LanguageCode) => {
    if (!locales[code]) return;

    applyLanguageLocally(code);

    // Fire-and-forget: persist language to backend profile for logged-in users.
    // Uses raw fetch (not clientFetch) to avoid the 401→signOut cascade.
    // If the user is not authenticated, the PUT will fail silently — that's fine,
    // localStorage + cookie already hold the preference for guests.
    fetch('/api/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: code }),
      credentials: 'same-origin',
    }).then(res => {
      if (res.ok) {
        console.log('[LanguageContext] Language persisted to backend profile:', code);
      } else {
        console.log('[LanguageContext] Backend profile PUT returned', res.status, '(user likely not authenticated — language saved to localStorage + cookie only)');
      }
    }).catch(() => {
      // Network error or not authenticated — silently ignore
    });

    // Notify AuthContext so it can update user.language locally without a
    // round-trip to the backend.
    window.dispatchEvent(new CustomEvent('user-language-changed', { detail: { code } }));
  }, [applyLanguageLocally]);

  /**
   * Sync frontend language FROM a backend profile value (e.g. on login or
   * after AuthContext fetches /api/user/profile).  Updates state, localStorage,
   * cookie, and <html lang> but does NOT PUT back to the backend — that would
   * cause an infinite loop.
   */
  const syncLanguageFromProfile = useCallback((code: LanguageCode) => {
    if (!locales[code]) return;
    // Avoid unnecessary state updates if the language already matches
    if (code === language) return;
    console.log('[LanguageContext] syncLanguageFromProfile: syncing frontend language to', code);
    applyLanguageLocally(code);
    // Note: no window.dispatchEvent here — this is a profile→frontend sync,
    // not a user-initiated change.  AuthContext already has the correct value.
  }, [applyLanguageLocally, language]);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let current = locales[language] as Record<string, unknown>;
    
    for (const k of keys) {
      if (current[k] === undefined) {
        // Fallback to English if key missing in current language
        let fallback = locales[defaultLanguage] as Record<string, unknown>;
        for (const fk of keys) {
            if (fallback[fk] === undefined) return key;
            fallback = fallback[fk] as Record<string, unknown>;
        }
        return typeof fallback === 'string' ? fallback : key;
      }
      current = current[k] as Record<string, unknown>;
    }
    
    return typeof current === 'string' ? current : key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, syncLanguageFromProfile, t, availableLanguages: languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};