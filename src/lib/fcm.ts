'use client';

import { clientFetch } from '@/lib/apiClient';

/** Device platform for an FCM token registration. */
export type FcmPlatform = 'android' | 'ios' | 'web';

/** Reminder preferences (camelCase, as returned by the backend). */
export interface FcmPreferences {
    morningEnabled: boolean;
    /** HH:MM 24h, e.g. "07:00". */
    morningTime: string;
    eveningEnabled: boolean;
    /** HH:MM 24h, e.g. "19:00". */
    eveningTime: string;
    /** IANA timezone name, e.g. "Asia/Kolkata". */
    timezone: string;
}

/** Server defaults per the backend contract: opt-in, 07:00 / 19:00. */
export const FCM_DEFAULT_PREFERENCES: FcmPreferences = {
    morningEnabled: false,
    morningTime: '07:00',
    eveningEnabled: false,
    eveningTime: '19:00',
    timezone: 'Asia/Kolkata',
};

/**
 * Validate an HH:MM 24h string. Returns true for "00:00".."23:59".
 */
export function isValidTimeHHMM(value: string): boolean {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/**
 * Best-effort IANA timezone validation. We can't ship the full tz database,
 * so we check the shape and rely on the backend for the authoritative check.
 */
export function looksLikeIanaTimezone(value: string): boolean {
    return typeof value === 'string' && /^[A-Za-z_]{2,}(\/[A-Za-z_][A-Za-z0-9_+-]*)+$/.test(value) && value.length <= 64;
}

/** Detect the caller's IANA timezone via Intl, with a safe fallback. */
export function detectTimezone(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz && looksLikeIanaTimezone(tz)) return tz;
    } catch { /* Intl unsupported — fall through */ }
    return FCM_DEFAULT_PREFERENCES.timezone;
}

export interface FcmPreferencesResponse extends FcmPreferences {
    success?: boolean;
}

/**
 * Fetch the current reminder preferences. Falls back to the opt-in defaults
 * when the backend omits a field (e.g. a brand-new account with no row yet).
 */
export async function getFcmPreferences(): Promise<FcmPreferences> {
    const res = await clientFetch('/api/fcm/preferences', { method: 'GET' });
    const data = (await res.json().catch(() => ({}))) as Partial<FcmPreferencesResponse> & { error?: string; detail?: string };
    if (!res.ok) {
        throw new Error(data.error || data.detail || 'Could not load reminder preferences.');
    }
    return {
        morningEnabled: data.morningEnabled ?? FCM_DEFAULT_PREFERENCES.morningEnabled,
        morningTime: data.morningTime || FCM_DEFAULT_PREFERENCES.morningTime,
        eveningEnabled: data.eveningEnabled ?? FCM_DEFAULT_PREFERENCES.eveningEnabled,
        eveningTime: data.eveningTime || FCM_DEFAULT_PREFERENCES.eveningTime,
        timezone: data.timezone || FCM_DEFAULT_PREFERENCES.timezone,
    };
}

/**
 * Update reminder preferences. Per the backend contract, PUT uses
 * `exclude_unset` — send only the changed fields. Pass `null` for a field to
 * leave it unchanged; pass an explicit value (incl. `false`) to set it.
 */
export async function updateFcmPreferences(
    patch: Partial<FcmPreferences>
): Promise<FcmPreferences> {
    // Strip undefined entries so we don't send them (exclude_unset semantics).
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) {
        if (v !== undefined) body[k] = v;
    }
    const res = await clientFetch('/api/fcm/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<FcmPreferencesResponse> & { error?: string; detail?: string };
    if (!res.ok) {
        throw new Error(data.error || data.detail || 'Could not save reminder preferences.');
    }
    return {
        morningEnabled: data.morningEnabled ?? FCM_DEFAULT_PREFERENCES.morningEnabled,
        morningTime: data.morningTime || FCM_DEFAULT_PREFERENCES.morningTime,
        eveningEnabled: data.eveningEnabled ?? FCM_DEFAULT_PREFERENCES.eveningEnabled,
        eveningTime: data.eveningTime || FCM_DEFAULT_PREFERENCES.eveningTime,
        timezone: data.timezone || FCM_DEFAULT_PREFERENCES.timezone,
    };
}

export interface FcmRegisterResult {
    success: boolean;
    active?: boolean;
    removed?: boolean;
}

/** Register (or re-register) an FCM device token for the signed-in user. */
export async function registerFcmToken(token: string, platform: FcmPlatform): Promise<FcmRegisterResult> {
    const res = await clientFetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, platform }),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<FcmRegisterResult> & { error?: string; detail?: string };
    if (!res.ok) {
        throw new Error(data.error || data.detail || 'Could not register device for push.');
    }
    return { success: data.success === true, active: data.active };
}

/** Idempotently remove an FCM device token (e.g. on sign-out / token rotation). */
export async function unregisterFcmToken(token: string): Promise<FcmRegisterResult> {
    const res = await clientFetch('/api/fcm/register', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
    });
    const data = (await res.json().catch(() => ({}))) as Partial<FcmRegisterResult> & { error?: string; detail?: string };
    if (!res.ok) {
        throw new Error(data.error || data.detail || 'Could not unregister device.');
    }
    return { success: data.success === true, removed: data.removed };
}

export interface FcmTestResult {
    success: boolean;
    summary?: string;
}

/**
 * Send a test push to the caller's own registered tokens.
 * Surfaces the backend's 404 (no tokens) / 503 (FCM unconfigured) as
 * structured errors so the UI can render a distinct message.
 */
export async function sendFcmTest(): Promise<FcmTestResult> {
    const res = await clientFetch('/api/fcm/test', { method: 'POST' });
    const data = (await res.json().catch(() => ({}))) as Partial<FcmTestResult> & { error?: string; detail?: string };
    if (!res.ok) {
        const fallback = res.status === 404
            ? 'No registered devices yet — add a device first.'
            : res.status === 503
                ? 'Push notifications are not configured on the server.'
                : (data.error || data.detail || 'Could not send test push.');
        throw new FcmTestError(fallback, res.status);
    }
    return { success: data.success === true, summary: data.summary };
}

export class FcmTestError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.name = 'FcmTestError';
        this.status = status;
    }
}
