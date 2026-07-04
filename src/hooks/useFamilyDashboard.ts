'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clientFetch } from '@/lib/apiClient';
import { memberActionTargets } from './useFamily';
import { todayISO } from '@/utils/forecastError';
import type { FamilyMember } from '@/types/family';
import type { PaywallData } from '@/types/paywall';
import {
    isFamilyDashboardDegraded,
    type FamilyAskResponse,
    type FamilyDashboardResponse,
    type FamilyDashboardWeeklyResponse,
} from '@/types/familyDashboard';

/* ------------------------------------------------------------------ */
/* Shared routing + state shapes                                        */
/* ------------------------------------------------------------------ */

/** The base path + target id for a member's dashboard endpoints, memoized on
 *  the member's stable identity primitives (same pattern as useFamily's other
 *  hooks) so re-renders don't invalidate downstream effects. */
function useDashboardTargets(member: FamilyMember | null) {
    return useMemo(
        () => memberActionTargets(member),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [member?.source, member?.id, member?.connectionId],
    );
}

/** Detect a SHARING_REQUIRED body from a connection dashboard endpoint.
 *  Returns the human message when sharing isn't mutual, else null. */
function parseSharingRequired(body: Record<string, unknown>): string | null {
    const detail = body?.detail && typeof body.detail === 'object'
        ? (body.detail as Record<string, unknown>)
        : null;
    const code = (body?.code ?? detail?.code) as string | undefined;
    if (code !== 'SHARING_REQUIRED') return null;
    return (body.message || body.error || detail?.error || 'Sharing required to view this dashboard.') as string;
}

export interface FamilyDashboardState {
    data: FamilyDashboardResponse | null;
    isLoading: boolean;
    error: string | null;
    /** Transit calc failed (`calculation_unavailable: true`). Render the
     *  "try again later" empty state — never silent empty cards. */
    degraded: boolean;
    /** Present when free-tier & not accessible → render the soft upgrade overlay
     *  over the visible teaser. The body also still carries the teaser fields. */
    paywall: PaywallData | null;
    /** Connection-only: sharing isn't mutual. Surface an inline sharing gate
     *  instead of a hard error (mirrors the compatibility endpoints). */
    sharingRequired: boolean;
    refetch: () => void;
}

export interface FamilyDashboardWeeklyState {
    data: FamilyDashboardWeeklyResponse | null;
    isLoading: boolean;
    error: string | null;
    degraded: boolean;
    paywall: PaywallData | null;
    sharingRequired: boolean;
    refetch: () => void;
}

/* ------------------------------------------------------------------ */
/* Daily dashboard                                                      */
/* ------------------------------------------------------------------ */

/**
 * Fetches the daily "bond" dashboard for a manual member or linked connection.
 *
 * Caching: keyed by `${source}:${id}:${day}:${lang}` so (a) re-renders and
 * re-selecting the same member are instant, (b) a new day refetches, and (c) a
 * language toggle is a fresh key (the backend re-translates server-side and is
 * cache-free for that key — instant). This mirrors the backend's 1h cache per
 * (viewer, day, tz, birth-location, access-scope, lang): the hook does NOT
 * refetch on every render.
 */
export function useFamilyDashboard(member: FamilyMember | null, lang: string): FamilyDashboardState {
    const [data, setData] = useState<FamilyDashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [degraded, setDegraded] = useState(false);
    const [paywall, setPaywall] = useState<PaywallData | null>(null);
    const [sharingRequired, setSharingRequired] = useState(false);
    const cacheRef = useRef<Map<string, FamilyDashboardResponse>>(new Map());

    const targets = useDashboardTargets(member);

    const fetchDashboard = useCallback(async () => {
        if (!targets) {
            setData(null);
            setError(null);
            setDegraded(false);
            setPaywall(null);
            setSharingRequired(false);
            return;
        }
        const day = todayISO();
        const key = `${targets.cachePrefix}:${day}:${lang}`;
        const cached = cacheRef.current.get(key);
        if (cached) {
            setData(cached);
            setError(null);
            setDegraded(false);
            setPaywall(cached.paywall ?? null);
            setSharingRequired(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        setDegraded(false);
        setPaywall(null);
        setSharingRequired(false);
        try {
            const url = `${targets.basePath}/${encodeURIComponent(String(targets.id))}/dashboard?lang=${encodeURIComponent(lang)}`;
            const res = await clientFetch(url);
            const body = await res.json().catch(() => ({})) as Record<string, unknown>;

            if (res.ok) {
                if (isFamilyDashboardDegraded(body)) {
                    setDegraded(true);
                    setData(null);
                    return;
                }
                const result = body as unknown as FamilyDashboardResponse;
                cacheRef.current.set(key, result);
                setData(result);
                setPaywall(result.paywall ?? null);
                return;
            }

            // Connection-only: sharing isn't mutual → inline gate, not a toast.
            const sharingMsg = parseSharingRequired(body);
            if (sharingMsg) {
                setSharingRequired(true);
                setError(sharingMsg);
                return;
            }

            // 402 paywall (defensive — the soft paywall is normally a 200 body field).
            if (res.status === 402 && body?.paywall) {
                setPaywall(body.paywall as PaywallData);
                setData(null);
                return;
            }

            if (isFamilyDashboardDegraded(body)) {
                setDegraded(true);
                setData(null);
                return;
            }

            setError((body.error || body.detail || `Failed (${res.status})`) as string);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load family dashboard');
        } finally {
            setIsLoading(false);
        }
    }, [targets, lang]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return { data, isLoading, error, degraded, paywall, sharingRequired, refetch: fetchDashboard };
}

/* ------------------------------------------------------------------ */
/* Weekly dashboard                                                     */
/* ------------------------------------------------------------------ */

/**
 * Fetches the weekly bond graph + summary. Same routing + caching strategy as
 * {@link useFamilyDashboard}; the week range is fixed (Mon→Sun containing
 * today) so the day component of the key just guards against week rollover.
 */
export function useFamilyDashboardWeekly(member: FamilyMember | null, lang: string): FamilyDashboardWeeklyState {
    const [data, setData] = useState<FamilyDashboardWeeklyResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [degraded, setDegraded] = useState(false);
    const [paywall, setPaywall] = useState<PaywallData | null>(null);
    const [sharingRequired, setSharingRequired] = useState(false);
    const cacheRef = useRef<Map<string, FamilyDashboardWeeklyResponse>>(new Map());

    const targets = useDashboardTargets(member);

    const fetchWeekly = useCallback(async () => {
        if (!targets) {
            setData(null);
            setError(null);
            setDegraded(false);
            setPaywall(null);
            setSharingRequired(false);
            return;
        }
        const day = todayISO();
        const key = `${targets.cachePrefix}:${day}:${lang}`;
        const cached = cacheRef.current.get(key);
        if (cached) {
            setData(cached);
            setError(null);
            setDegraded(false);
            setPaywall(cached.paywall ?? null);
            setSharingRequired(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        setDegraded(false);
        setPaywall(null);
        setSharingRequired(false);
        try {
            const url = `${targets.basePath}/${encodeURIComponent(String(targets.id))}/dashboard/weekly?lang=${encodeURIComponent(lang)}`;
            const res = await clientFetch(url);
            const body = await res.json().catch(() => ({})) as Record<string, unknown>;

            if (res.ok) {
                if (isFamilyDashboardDegraded(body)) {
                    setDegraded(true);
                    setData(null);
                    return;
                }
                const result = body as unknown as FamilyDashboardWeeklyResponse;
                cacheRef.current.set(key, result);
                setData(result);
                setPaywall(result.paywall ?? null);
                return;
            }

            const sharingMsg = parseSharingRequired(body);
            if (sharingMsg) {
                setSharingRequired(true);
                setError(sharingMsg);
                return;
            }

            if (res.status === 402 && body?.paywall) {
                setPaywall(body.paywall as PaywallData);
                setData(null);
                return;
            }

            if (isFamilyDashboardDegraded(body)) {
                setDegraded(true);
                setData(null);
                return;
            }

            setError((body.error || body.detail || `Failed (${res.status})`) as string);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load weekly bond');
        } finally {
            setIsLoading(false);
        }
    }, [targets, lang]);

    useEffect(() => {
        fetchWeekly();
    }, [fetchWeekly]);

    return { data, isLoading, error, degraded, paywall, sharingRequired, refetch: fetchWeekly };
}

/* ------------------------------------------------------------------ */
/* Ask about this relationship (Phase 3)                                */
/* ------------------------------------------------------------------ */

export interface FamilyAskResult {
    ok: boolean;
    status: number;
    data: FamilyAskResponse | null;
    error?: string;
    /** Connection-only: sharing isn't mutual. */
    sharingRequired?: boolean;
}

/**
 * Create a pre-seeded chat thread + starter prefill for "ask about this
 * relationship". Routes to `/members/{id}/ask` or `/connections/{id}/ask`
 * based on the member's `source`. NOT cached — each call creates a unique
 * thread. Returns the `chat.id` (to deep-link the chat screen) and the
 * `starter.prefill` (to render as a tappable suggestion that sends on tap).
 */
export async function familyAsk(member: FamilyMember): Promise<FamilyAskResult> {
    const targets = memberActionTargets(member);
    if (!targets) {
        return { ok: false, status: 0, data: null, error: 'No member selected' };
    }
    try {
        const url = `${targets.basePath}/${encodeURIComponent(String(targets.id))}/ask`;
        const res = await clientFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
        const body = await res.json().catch(() => ({})) as Record<string, unknown>;

        if (res.ok) {
            return { ok: true, status: res.status, data: body as unknown as FamilyAskResponse };
        }

        // Connection-only: SHARING_REQUIRED → not a hard error to toast; the
        // caller surfaces an inline sharing gate instead.
        const code = (body?.code ?? (body?.detail && typeof body.detail === 'object' ? (body.detail as Record<string, unknown>).code : undefined)) as string | undefined;
        if (code === 'SHARING_REQUIRED') {
            return {
                ok: false,
                status: res.status,
                data: null,
                error: (body.message || body.error || 'Sharing required') as string,
                sharingRequired: true,
            };
        }

        return {
            ok: false,
            status: res.status,
            data: null,
            error: (body.error || body.detail || `Failed (${res.status})`) as string,
        };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            data: null,
            error: err instanceof Error ? err.message : 'Failed to start relationship chat',
        };
    }
}
