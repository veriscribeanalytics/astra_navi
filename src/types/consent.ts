/**
 * DPDP Act 2023 — Consent Management Types
 *
 * Implements consent categories, audit records, and preferences
 * in compliance with India's Digital Personal Data Protection Act.
 */

export type ConsentCategory = 'essential' | 'functional' | 'analytics' | 'marketing';

export type ConsentType =
  | 'registration'
  | 'cookies'
  | 'notifications'
  | 'data_processing'
  | 'age_verification'
  | 'terms_acceptance';

export interface ConsentPreference {
  category: ConsentCategory;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
}

export interface UserConsentRecord {
  consentId: string;
  userId?: string;
  sessionId: string;
  consentType: ConsentType;
  granted: boolean;
  preferences?: ConsentPreference[];
  policyVersion: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface ConsentAuditLog {
  userId: string;
  events: UserConsentRecord[];
  totalEvents: number;
}

/** Default consent preferences shown in the cookie/privacy banner. */
export const DEFAULT_CONSENT_PREFERENCES: ConsentPreference[] = [
  {
    category: 'essential',
    name: 'Essential',
    description:
      'Required for the website to function properly. Includes secure authentication, session management, and core platform features.',
    required: true,
    enabled: true,
  },
  {
    category: 'functional',
    name: 'Functional',
    description:
      'Remember your preferences such as theme (light/dark), language, and display settings for a smoother experience.',
    required: false,
    enabled: true,
  },
  {
    category: 'analytics',
    name: 'Analytics',
    description:
      'Help us understand how Astra Navi is used so we can improve accuracy, performance, and your Vedic astrology experience.',
    required: false,
    enabled: false,
  },
  {
    category: 'marketing',
    name: 'Marketing',
    description:
      'Allow us to inform you about new features, celestial events, premium offerings, and Jyotish content you may find valuable.',
    required: false,
    enabled: false,
  },
];

/** Current privacy policy version — bump on every policy change. */
export const PRIVACY_POLICY_VERSION = '2.0.0';

/** LocalStorage key for persisting cookie consent preferences. */
export const COOKIE_CONSENT_KEY = 'astra_navi_cookie_consent';

/** LocalStorage key for the consent session ID (anonymous, pre-auth). */
export const CONSENT_SESSION_KEY = 'astra_navi_consent_session';
