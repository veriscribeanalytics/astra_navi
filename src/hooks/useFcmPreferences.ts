'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    FCM_DEFAULT_PREFERENCES,
    FcmPreferences,
    FcmTestError,
    getFcmPreferences,
    sendFcmTest,
    updateFcmPreferences,
} from '@/lib/fcm';

interface UseFcmPreferencesResult {
    preferences: FcmPreferences;
    loading: boolean;
    saving: boolean;
    testing: boolean;
    error: string | null;
    /** Update a subset of preferences; sends only changed fields. */
    save: (patch: Partial<FcmPreferences>) => Promise<boolean>;
    /** Send a test push to the caller's own devices. */
    test: () => Promise<{ ok: boolean; message?: string }>;
    refetch: () => Promise<void>;
}

/**
 * Manages the user's FCM reminder preferences (morning/evening toggles,
 * HH:MM times, IANA timezone). Reminders are opt-in by default; the UI should
 * prompt the user to enable them.
 */
export function useFcmPreferences(enabled = true): UseFcmPreferencesResult {
    const [preferences, setPreferences] = useState<FcmPreferences>(FCM_DEFAULT_PREFERENCES);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const mounted = useRef(false);

    const refetch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const prefs = await getFcmPreferences();
            if (mounted.current) setPreferences(prefs);
        } catch (err) {
            if (mounted.current) setError(err instanceof Error ? err.message : 'Could not load preferences.');
        } finally {
            if (mounted.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        if (enabled) void refetch();
        else setLoading(false);
        return () => { mounted.current = false; };
    }, [enabled, refetch]);

    const save = useCallback(async (patch: Partial<FcmPreferences>) => {
        setSaving(true);
        setError(null);
        try {
            const updated = await updateFcmPreferences(patch);
            if (mounted.current) setPreferences(updated);
            return true;
        } catch (err) {
            if (mounted.current) setError(err instanceof Error ? err.message : 'Could not save preferences.');
            return false;
        } finally {
            if (mounted.current) setSaving(false);
        }
    }, []);

    const test = useCallback(async () => {
        setTesting(true);
        setError(null);
        try {
            const result = await sendFcmTest();
            return { ok: true, message: result.summary };
        } catch (err) {
            const message = err instanceof FcmTestError
                ? err.message
                : err instanceof Error ? err.message : 'Could not send test push.';
            if (mounted.current) setError(message);
            return { ok: false, message };
        } finally {
            if (mounted.current) setTesting(false);
        }
    }, []);

    return { preferences, loading, saving, testing, error, save, test, refetch };
}
