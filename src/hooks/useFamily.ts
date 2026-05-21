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
/* snake_case (backend) → camelCase (frontend) normalizer              */
/* ------------------------------------------------------------------ */

/** Backend responses for /api/family/members are snake_case. Convert to the
 *  camelCase FamilyMember shape that the rest of the app consumes. Accepts
 *  either casing so future backend changes don't silently break the UI. */
export function normalizeFamilyMember(raw: unknown): FamilyMember | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;

    const pick = <T,>(snake: string, camel: string): T | undefined => {
        if (r[snake] !== undefined) return r[snake] as T;
        if (r[camel] !== undefined) return r[camel] as T;
        return undefined;
    };

    const id = pick<number>('id', 'id');
    if (id === undefined) return null;

    return {
        id: id as number,
        name: (pick<string>('name', 'name') ?? '') as string,
        relationshipType: pick<FamilyMember['relationshipType']>('relationship_type', 'relationshipType') as FamilyMember['relationshipType'],
        gender: pick<FamilyMember['gender']>('gender', 'gender') as FamilyMember['gender'],
        dob: (pick<string>('dob', 'dob') ?? '') as string,
        // backend returns "HH:MM:SS" — trim seconds for form pre-fill compatibility.
        tob: trimSeconds((pick<string>('tob', 'tob') ?? '') as string),
        pob: (pick<string>('pob', 'pob') ?? '') as string,
        latitude: Number(pick<number>('latitude', 'latitude') ?? 0),
        longitude: Number(pick<number>('longitude', 'longitude') ?? 0),
        timezoneOffset: Number(pick<number>('timezone_offset', 'timezoneOffset') ?? 0),
        notes: pick<string | null>('notes', 'notes') ?? null,
        consentAcknowledged: pick<boolean>('consent_acknowledged', 'consentAcknowledged'),
        consentAcknowledgedAt: pick<string>('consent_acknowledged_at', 'consentAcknowledgedAt'),
        createdAt: pick<string>('created_at', 'createdAt'),
        updatedAt: pick<string>('updated_at', 'updatedAt'),
    };
}

function trimSeconds(time: string): string {
    if (!time) return '';
    // "HH:MM:SS" → "HH:MM"; leave "HH:MM" as-is.
    const parts = time.split(':');
    if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
    return time;
}

/* ------------------------------------------------------------------ */
/* List of family members                                              */
/* ------------------------------------------------------------------ */

/** Normalize whatever shape the backend returns into FamilyMember[]. */
function extractMembers(body: unknown): FamilyMember[] {
    let raw: unknown[] = [];
    if (Array.isArray(body)) raw = body;
    else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.members)) raw = b.members;
        else if (Array.isArray(b.data)) raw = b.data;
        else if (Array.isArray(b.items)) raw = b.items;
    }
    return raw.map(normalizeFamilyMember).filter((m): m is FamilyMember => m !== null);
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
    /** Populated when the 400 missing_birth_details branch fires so the UI
     *  can prompt the user to complete their profile. */
    missingBirthFields?: string[];
    /** True when we exhausted retries on a 409 reservation_pending and the
     *  backend never returned a finished result. */
    stillComputing?: boolean;
}

const PENDING_RETRY_BACKOFFS_MS = [2000, 4000, 6000];

function sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
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

            const url = `/api/family/members/${encodeURIComponent(String(memberId))}/compatibility?lang=${encodeURIComponent(lang)}`;

            try {
                // 409 reservation_pending → auto-retry with backoff. Each attempt
                // is the same request; the backend serves the finished result
                // once the in-flight reservation completes.
                for (let attempt = 0; attempt <= PENDING_RETRY_BACKOFFS_MS.length; attempt++) {
                    const res = await clientFetch(url);
                    const body = await res.json().catch(() => ({}));

                    if (res.ok) {
                        const result = body as FamilyCompatibilityResponse;
                        cacheRef.current.set(key, result);
                        setData(result);
                        return { ok: true, status: res.status, data: result, raw: body };
                    }

                    // 409 → wait and retry (unless we've used all backoffs).
                    if (res.status === 409 && body?.error === 'reservation_pending') {
                        if (attempt < PENDING_RETRY_BACKOFFS_MS.length) {
                            await sleep(PENDING_RETRY_BACKOFFS_MS[attempt]);
                            continue;
                        }
                        const msg = 'Still computing — please try again in a moment.';
                        setError(msg);
                        return { ok: false, status: 409, data: null, error: msg, raw: body, stillComputing: true };
                    }

                    // 400 missing_birth_details → bubble up the missing field list.
                    if (res.status === 400 && body?.error === 'missing_birth_details') {
                        const missing = Array.isArray(body.missing) ? body.missing as string[] : [];
                        const msg = 'Complete your own birth details before running compatibility.';
                        setError(msg);
                        return {
                            ok: false,
                            status: 400,
                            data: null,
                            error: msg,
                            raw: body,
                            missingBirthFields: missing,
                        };
                    }

                    // Any other error → surface as-is.
                    const msg = body.error || body.detail || `Failed (${res.status})`;
                    setError(msg);
                    return { ok: false, status: res.status, data: null, error: msg, raw: body };
                }

                // Defensive — loop should have returned by now.
                return { ok: false, status: 0, data: null, error: 'Unexpected retry exit' };
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
        return {
            ok: true,
            status: res.status,
            data: normalizeFamilyMember(body),
            raw: body,
        };
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
        return {
            ok: true,
            status: res.status,
            data: normalizeFamilyMember(body),
            raw: body,
        };
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
