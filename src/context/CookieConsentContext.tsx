'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  ConsentPreference,
  ConsentType,
  DEFAULT_CONSENT_PREFERENCES,
  COOKIE_CONSENT_KEY,
  CONSENT_SESSION_KEY,
  PRIVACY_POLICY_VERSION,
  UserConsentRecord,
} from '@/types/consent';

interface CookieConsentState {
  /** Whether the consent banner needs to be shown. */
  showBanner: boolean;
  /** Whether the preferences modal is open. */
  preferencesOpen: boolean;
  /** Current consent preferences. */
  preferences: ConsentPreference[];
  /** Whether consent has been given at all (any interaction with banner). */
  hasConsented: boolean;
  /** When consent was last updated (ISO string). */
  consentedAt: string | null;
  /** Policy version that consent was given for. */
  consentedVersion: string | null;
}

interface CookieConsentContextValue extends CookieConsentState {
  /** Accept all non-essential cookies. */
  acceptAll: () => void;
  /** Accept only essential cookies. */
  acceptEssential: () => void;
  /** Open the preferences modal. */
  openPreferences: () => void;
  /** Close the preferences modal. */
  closePreferences: () => void;
  /** Toggle a specific consent category. */
  togglePreference: (category: string) => void;
  /** Save current preferences and close modal. */
  savePreferences: () => void;
  /** Check if a specific category of consent is granted. */
  isCategoryEnabled: (category: string) => boolean;
  /** Reset all consent (useful for testing or account deletion). */
  resetConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null);

function generateSessionId(): string {
  return `cs_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function loadSavedPreferences(): {
  preferences: ConsentPreference[];
  hasConsented: boolean;
  consentedAt: string | null;
  consentedVersion: string | null;
} | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.preferences) return null;

    return {
      preferences: parsed.preferences,
      hasConsented: true,
      consentedAt: parsed.consentedAt || null,
      consentedVersion: parsed.consentedVersion || null,
    };
  } catch {
    return null;
  }
}

function savePreferencesToStorage(
  preferences: ConsentPreference[],
  consentedAt: string,
  consentedVersion: string
): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({ preferences, consentedAt, consentedVersion })
    );
  } catch {
    // Storage full or unavailable — silently fail (consent banner will re-appear)
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return generateSessionId();
  try {
    let sessionId = localStorage.getItem(CONSENT_SESSION_KEY);
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem(CONSENT_SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch {
    return generateSessionId();
  }
}

/**
 * Posts a consent record to the backend audit log.
 * Fires-and-forgets — failures are logged but don't block the UX.
 */
async function logConsentToBackend(record: Omit<UserConsentRecord, 'consentId'>): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/user/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
  } catch {
    // Silently fail — consent is still stored locally
  }
}

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<CookieConsentState>({
    showBanner: false,
    preferencesOpen: false,
    preferences: DEFAULT_CONSENT_PREFERENCES,
    hasConsented: false,
    consentedAt: null,
    consentedVersion: null,
  });

  const sessionIdRef = useRef<string>('');

  // Hydrate from localStorage on mount with a delayed banner trigger for first-visit/policy updates
  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId();

    const saved = loadSavedPreferences();
    let timer: NodeJS.Timeout | undefined;

    if (saved) {
      // Policy version check — if policy was updated, show banner again
      const needsReconsent = saved.consentedVersion !== PRIVACY_POLICY_VERSION;

      if (needsReconsent) {
        setState({
          showBanner: false,
          preferencesOpen: false,
          preferences: DEFAULT_CONSENT_PREFERENCES,
          hasConsented: false,
          consentedAt: null,
          consentedVersion: null,
        });

        // Delay showing banner by 5 seconds (5000ms)
        timer = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            showBanner: true,
          }));
        }, 5000);
      } else {
        setState({
          showBanner: false,
          preferencesOpen: false,
          preferences: saved.preferences,
          hasConsented: true,
          consentedAt: saved.consentedAt,
          consentedVersion: saved.consentedVersion,
        });
      }
    } else {
      // No saved consent — show banner after a 5-second (5000ms) delay
      setState((prev) => ({
        ...prev,
        showBanner: false,
        hasConsented: false,
      }));

      timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          showBanner: true,
        }));
      }, 5000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const applyConsent = useCallback(
    (
      preferences: ConsentPreference[],
      consentType: ConsentType = 'cookies'
    ) => {
      const consentedAt = new Date().toISOString();

      // Persist to localStorage
      savePreferencesToStorage(preferences, consentedAt, PRIVACY_POLICY_VERSION);

      // Enforce the functional-cookie choice. Declining functional must actually
      // remove the functional cookies/storage (theme + locale), otherwise the
      // toggle is cosmetic (DPDP S.6 — consent must be specific and actionable).
      if (typeof window !== 'undefined') {
        const functionalEnabled = preferences.find(
          (p) => p.category === 'functional'
        )?.enabled;

        if (!functionalEnabled) {
          try {
            // Expire the functional cookies set by themeManager / LanguageContext.
            document.cookie = 'theme=; path=/; max-age=0; SameSite=Lax';
            document.cookie = 'NEXT_LOCALE=; path=/; max-age=0; SameSite=Lax';
            localStorage.removeItem('theme');
          } catch {
            // Best-effort cleanup — ignore storage/cookie failures.
          }
        }
      }

      // Whether any optional (non-essential) category was actually granted.
      // Logging a flat granted:true even for "Accept Essential Only" would
      // misstate the audit trail, so derive it from the real choices.
      const anyOptionalGranted = preferences.some((p) => !p.required && p.enabled);

      // Log consent to backend for audit trail
      logConsentToBackend({
        userId: undefined, // May be set by AuthContext later
        sessionId: sessionIdRef.current,
        consentType,
        granted: anyOptionalGranted,
        preferences,
        policyVersion: PRIVACY_POLICY_VERSION,
        timestamp: consentedAt,
      });

      setState({
        showBanner: false,
        preferencesOpen: false,
        preferences,
        hasConsented: true,
        consentedAt,
        consentedVersion: PRIVACY_POLICY_VERSION,
      });
    },
    []
  );

  const acceptAll = useCallback(() => {
    const allEnabled = DEFAULT_CONSENT_PREFERENCES.map((p) => ({
      ...p,
      enabled: true,
    }));
    applyConsent(allEnabled);
  }, [applyConsent]);

  const acceptEssential = useCallback(() => {
    const essentialOnly = DEFAULT_CONSENT_PREFERENCES.map((p) => ({
      ...p,
      enabled: p.required,
    }));
    applyConsent(essentialOnly);
  }, [applyConsent]);

  const openPreferences = useCallback(() => {
    setState((prev) => ({ ...prev, preferencesOpen: true }));
  }, []);

  const closePreferences = useCallback(() => {
    setState((prev) => ({ ...prev, preferencesOpen: false }));
  }, []);

  const togglePreference = useCallback((category: string) => {
    setState((prev) => ({
      ...prev,
      preferences: prev.preferences.map((p) =>
        p.category === category && !p.required
          ? { ...p, enabled: !p.enabled }
          : p
      ),
    }));
  }, []);

  const savePreferences = useCallback(() => {
    applyConsent(state.preferences);
  }, [state.preferences, applyConsent]);

  const isCategoryEnabled = useCallback(
    (category: string): boolean => {
      const pref = state.preferences.find((p) => p.category === category);
      return pref?.enabled ?? false;
    },
    [state.preferences]
  );

  const resetConsent = useCallback(() => {
    // Record the withdrawal server-side so the DPDP audit trail reflects it
    // (best-effort; local reset proceeds regardless). The backend resolves the
    // user from the session cookie; anonymous callers simply no-op server-side.
    if (typeof window !== 'undefined') {
      fetch('/api/user/consent', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          consentType: 'cookies',
          policyVersion: PRIVACY_POLICY_VERSION,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // Withdrawal still applies locally even if the audit call fails.
      });

      // Clear functional cookies/storage on withdrawal too.
      try {
        localStorage.removeItem(COOKIE_CONSENT_KEY);
        document.cookie = 'theme=; path=/; max-age=0; SameSite=Lax';
        document.cookie = 'NEXT_LOCALE=; path=/; max-age=0; SameSite=Lax';
        localStorage.removeItem('theme');
      } catch {
        // ignore
      }
    }
    setState({
      showBanner: true,
      preferencesOpen: false,
      preferences: DEFAULT_CONSENT_PREFERENCES,
      hasConsented: false,
      consentedAt: null,
      consentedVersion: null,
    });
  }, []);

  const value: CookieConsentContextValue = {
    ...state,
    acceptAll,
    acceptEssential,
    openPreferences,
    closePreferences,
    togglePreference,
    savePreferences,
    isCategoryEnabled,
    resetConsent,
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export function useCookieConsent(): CookieConsentContextValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) {
    throw new Error(
      'useCookieConsent must be used within a <CookieConsentProvider>'
    );
  }
  return ctx;
}

export default CookieConsentContext;
