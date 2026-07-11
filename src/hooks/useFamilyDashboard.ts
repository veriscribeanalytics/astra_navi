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

/** Module-level response cache + in-flight dedupe, shared across every hook
 *  instance. Without this the cache lived on each hook's useRef, so two cards
 *  rendering the same member — plus React StrictMode's dev double-invoke and any
 *  remount — each fired a real network call. Keyed by the same
 *  `${source}:${id}:${day}:${lang}` string the hooks already compute, so a new
 *  day or language is a fresh fetch while a re-render/remount is free.
 *
 *  We cache the parsed `{ ok, status, body }` (not the interpreted state) so the
 *  daily and weekly hooks keep their own paywall/sharing/degraded logic. The
 *  in-flight map collapses concurrent callers onto one promise; the result map
 *  persists for the session (the backend caches per-key for 1h anyway). */
type SharedFetch = { ok: boolean; status: number; body: Record<string, unknown> };
const sharedResultCache = new Map<string, SharedFetch>();
const sharedInFlight = new Map<string, Promise<SharedFetch>>();

async function fetchDashboardShared(key: string, url: string): Promise<SharedFetch> {
    const cached = sharedResultCache.get(key);
    if (cached) return cached;

    const inFlight = sharedInFlight.get(key);
    if (inFlight) return inFlight;

    const promise = (async (): Promise<SharedFetch> => {
        const res = await clientFetch(url);
        const body = await res.json().catch(() => ({})) as Record<string, unknown>;
        const result: SharedFetch = { ok: res.ok, status: res.status, body };
        // Only cache successful bodies for the session. Errors (sharing gate,
        // paywall, degraded transit calc, transient 5xx) must stay retryable on
        // the next mount/refetch rather than sticking.
        if (res.ok) sharedResultCache.set(key, result);
        return result;
    })().finally(() => {
        sharedInFlight.delete(key);
    });

    sharedInFlight.set(key, promise);
    return promise;
}

/** Drop a member's cached daily+weekly dashboard so an explicit refetch() hits
 *  the network again (e.g. after the sharing state or profile changes). */
function invalidateDashboardKey(keyPrefix: string) {
    for (const k of sharedResultCache.keys()) {
        if (k.startsWith(keyPrefix)) sharedResultCache.delete(k);
    }
}

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
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const targets = useDashboardTargets(member);

    const fetchDashboard = useCallback(async (force = false) => {
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
        // Explicit refetch() drops the shared cache entry so we re-hit the network.
        if (force) invalidateDashboardKey(`${targets.cachePrefix}:`);
        setIsLoading(true);
        setError(null);
        setDegraded(false);
        setPaywall(null);
        setSharingRequired(false);
        try {
            const url = `${targets.basePath}/${encodeURIComponent(String(targets.id))}/dashboard?lang=${encodeURIComponent(lang)}`;
            const { ok, status, body } = await fetchDashboardShared(key, url);
            if (!mountedRef.current) return;

            if (ok) {
                if (isFamilyDashboardDegraded(body)) {
                    setDegraded(true);
                    setData(null);
                    return;
                }
                const result = body as unknown as FamilyDashboardResponse;
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
            if (status === 402 && body?.paywall) {
                setPaywall(body.paywall as PaywallData);
                setData(null);
                return;
            }

            if (isFamilyDashboardDegraded(body)) {
                setDegraded(true);
                setData(null);
                return;
            }

            setError((body.error || body.detail || `Failed (${status})`) as string);
        } catch (err) {
            if (!mountedRef.current) return;
            setError(err instanceof Error ? err.message : 'Failed to load family dashboard');
        } finally {
            if (mountedRef.current) setIsLoading(false);
        }
    }, [targets, lang]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return { data, isLoading, error, degraded, paywall, sharingRequired, refetch: () => fetchDashboard(true) };
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
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const targets = useDashboardTargets(member);

    const fetchWeekly = useCallback(async (force = false) => {
        if (!targets) {
            setData(null);
            setError(null);
            setDegraded(false);
            setPaywall(null);
            setSharingRequired(false);
            return;
        }
        const day = todayISO();
        // Distinct ":weekly" namespace so the weekly response never collides with
        // the daily one (both share the module-level cache).
        const key = `${targets.cachePrefix}:weekly:${day}:${lang}`;
        if (force) invalidateDashboardKey(`${targets.cachePrefix}:weekly:`);
        setIsLoading(true);
        setError(null);
        setDegraded(false);
        setPaywall(null);
        setSharingRequired(false);
        try {
            const url = `${targets.basePath}/${encodeURIComponent(String(targets.id))}/dashboard/weekly?lang=${encodeURIComponent(lang)}`;
            const { ok, status, body } = await fetchDashboardShared(key, url);
            if (!mountedRef.current) return;

            if (ok) {
                if (isFamilyDashboardDegraded(body)) {
                    setDegraded(true);
                    setData(null);
                    return;
                }
                const result = body as unknown as FamilyDashboardWeeklyResponse;
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

            if (status === 402 && body?.paywall) {
                setPaywall(body.paywall as PaywallData);
                setData(null);
                return;
            }

            if (isFamilyDashboardDegraded(body)) {
                setDegraded(true);
                setData(null);
                return;
            }

            setError((body.error || body.detail || `Failed (${status})`) as string);
        } catch (err) {
            if (!mountedRef.current) return;
            setError(err instanceof Error ? err.message : 'Failed to load weekly bond');
        } finally {
            if (mountedRef.current) setIsLoading(false);
        }
    }, [targets, lang]);

    useEffect(() => {
        fetchWeekly();
    }, [fetchWeekly]);

    return { data, isLoading, error, degraded, paywall, sharingRequired, refetch: () => fetchWeekly(true) };
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
