'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { clientFetch } from '@/lib/apiClient';
import type {
    FamilyMember,
    FamilyMemberCreatePayload,
    FamilyMemberUpdatePayload,
    FamilyChartResponse,
    FamilyCompatibilityResponse,
    CompatibilityLang,
} from '@/types/family';

/* ------------------------------------------------------------------ */
/* List of family members                                              */
/* ------------------------------------------------------------------ */

/** Normalize whatever shape the backend returns into FamilyMember[]. */
function extractMembers(body: unknown): FamilyMember[] {
    if (Array.isArray(body)) return body as FamilyMember[];
    if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.members)) return b.members as FamilyMember[];
        if (Array.isArray(b.data)) return b.data as FamilyMember[];
        if (Array.isArray(b.items)) return b.items as FamilyMember[];
    }
    return [];
}

export function useFamilyMembers() {
    const [data, setData] = useState<FamilyMember[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch('/api/family/members');
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to load family members');
            }
            setData(extractMembers(body));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load family members';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    return { data, isLoading, error, refetch: fetchMembers };
}

/* ------------------------------------------------------------------ */
/* Single member chart (free)                                          */
/* ------------------------------------------------------------------ */

export function useFamilyChart(memberId: number | string | null) {
    const [data, setData] = useState<FamilyChartResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cacheRef = useRef<Map<string, FamilyChartResponse>>(new Map());

    const fetchChart = useCallback(async () => {
        if (memberId === null || memberId === undefined || memberId === '') {
            setData(null);
            return;
        }
        const key = String(memberId);
        const cached = cacheRef.current.get(key);
        if (cached) {
            setData(cached);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch(`/api/family/members/${encodeURIComponent(key)}/chart`);
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to load chart');
            }
            cacheRef.current.set(key, body);
            setData(body as FamilyChartResponse);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load chart';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [memberId]);

    useEffect(() => {
        fetchChart();
    }, [fetchChart]);

    return { data, isLoading, error, refetch: fetchChart };
}

/* ------------------------------------------------------------------ */
/* Compatibility — manual trigger (because it costs credits)           */
/* ------------------------------------------------------------------ */

export interface CompatibilityFetchResult {
    ok: boolean;
    status: number;
    data: FamilyCompatibilityResponse | null;
    error?: string;
    /** Raw response body for paywall/insufficient-credit handling. */
    raw?: Record<string, unknown>;
}

export function useFamilyCompatibility(memberId: number | string | null) {
    const [data, setData] = useState<FamilyCompatibilityResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    /** Cache by `${memberId}:${lang}` so repeat in-session calls don't re-hit the network. */
    const cacheRef = useRef<Map<string, FamilyCompatibilityResponse>>(new Map());

    const fetchCompatibility = useCallback(
        async (lang: CompatibilityLang = 'en'): Promise<CompatibilityFetchResult> => {
            if (memberId === null || memberId === undefined || memberId === '') {
                return { ok: false, status: 0, data: null, error: 'No member selected' };
            }
            const key = `${memberId}:${lang}`;
            const cached = cacheRef.current.get(key);
            if (cached) {
                setData(cached);
                return { ok: true, status: 200, data: cached };
            }
            setIsLoading(true);
            setError(null);
            try {
                const res = await clientFetch(
                    `/api/family/members/${encodeURIComponent(String(memberId))}/compatibility?lang=${encodeURIComponent(lang)}`
                );
                const body = await res.json().catch(() => ({}));
                if (!res.ok) {
                    const msg = body.error || body.detail || `Failed (${res.status})`;
                    setError(msg);
                    return { ok: false, status: res.status, data: null, error: msg, raw: body };
                }
                const result = body as FamilyCompatibilityResponse;
                cacheRef.current.set(key, result);
                setData(result);
                return { ok: true, status: res.status, data: result, raw: body };
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to load compatibility';
                setError(msg);
                return { ok: false, status: 0, data: null, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [memberId]
    );

    return { data, isLoading, error, fetchCompatibility, reset: () => setData(null) };
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

export interface MutationResult<T = unknown> {
    ok: boolean;
    status: number;
    data: T | null;
    error?: string;
    /** Raw body to detect paywall codes like FAMILY_FREE_TIER_CAP. */
    raw?: Record<string, unknown>;
}

export async function createFamilyMember(
    payload: FamilyMemberCreatePayload
): Promise<MutationResult<FamilyMember>> {
    try {
        const res = await clientFetch('/api/family/members', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                data: null,
                error: body.error || body.detail || 'Failed to create',
                raw: body,
            };
        }
        return { ok: true, status: res.status, data: body as FamilyMember, raw: body };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            data: null,
            error: err instanceof Error ? err.message : 'Failed to create',
        };
    }
}

export async function updateFamilyMember(
    id: number | string,
    payload: FamilyMemberUpdatePayload
): Promise<MutationResult<FamilyMember>> {
    try {
        const res = await clientFetch(`/api/family/members/${encodeURIComponent(String(id))}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                data: null,
                error: body.error || body.detail || 'Failed to update',
                raw: body,
            };
        }
        return { ok: true, status: res.status, data: body as FamilyMember, raw: body };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            data: null,
            error: err instanceof Error ? err.message : 'Failed to update',
        };
    }
}

export async function deleteFamilyMember(id: number | string): Promise<MutationResult> {
    try {
        const res = await clientFetch(`/api/family/members/${encodeURIComponent(String(id))}`, {
            method: 'DELETE',
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                data: null,
                error: body.error || body.detail || 'Failed to delete',
                raw: body,
            };
        }
        return { ok: true, status: res.status, data: body, raw: body };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            data: null,
            error: err instanceof Error ? err.message : 'Failed to delete',
        };
    }
}
