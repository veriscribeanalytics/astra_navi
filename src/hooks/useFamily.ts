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
    FamilyAvatar,
    FamilyCompatibilityPreflight,
    FamilyInvite,
    FamilyConnection,
    FamilyInviteSendPayload,
    FamilyInviteAcceptPayload,
    FamilyInviteAcceptResponse,
    FamilyConnectionUpdatePayload,
    FamilyMergeCandidate,
    FamilyMergeMatchScore,
    FamilySharingBlockedBy,
    FamilySharingNudgeAction,
} from '@/types/family';

/* ------------------------------------------------------------------ */
/* snake_case (backend) → camelCase (frontend) normalizer              */
/* ------------------------------------------------------------------ */

/** Backend responses for /api/family/members are snake_case. Convert to the
 *  camelCase FamilyMember shape that the rest of the app consumes. Accepts
 *  either casing so future backend changes don't silently break the UI.
 *
 *  `/api/family/members` also returns linked-connection entries (source:'linked'
 *  with `connectionId` instead of `id`). Those are surfaced via
 *  `useFamilyConnections()` against /api/family/connections — we explicitly
 *  skip them here so manual-only callers stay clean. */
export function normalizeFamilyMember(raw: unknown): FamilyMember | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;

    // Linked entries don't have member.id and shouldn't be parsed as manual.
    if (r.source === 'linked') return null;

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
        avatarKey: pick<string>('avatar_key', 'avatarKey') ?? null,
        avatar: pick<FamilyMember['avatar']>('avatar', 'avatar') ?? null,
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
/* Linked-connection compatibility                                     */
/* ------------------------------------------------------------------ */

export interface ConnectionCompatibilityFetchResult extends CompatibilityFetchResult {
    /** True when both sides haven't enabled sharing — UI should prompt
     *  the user to toggle sharing on, rather than treating it as a hard error. */
    sharingRequired?: boolean;
    /** Which side is blocking. Set when sharingRequired is true. */
    blockedBy?: FamilySharingBlockedBy;
    /** Current per-side sharing flags from the SHARING_REQUIRED body. */
    sharingWithThem?: boolean;
    theyShareWithMe?: boolean;
    /** Optional nudge metadata for "Ask them to share back" affordances. */
    nudgeAction?: FamilySharingNudgeAction;
}

export function useFamilyConnectionCompatibility(connectionId: number | string | null) {
    const [data, setData] = useState<FamilyCompatibilityResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cacheRef = useRef<Map<string, FamilyCompatibilityResponse>>(new Map());

    const fetchCompatibility = useCallback(
        async (lang: CompatibilityLang = 'en'): Promise<ConnectionCompatibilityFetchResult> => {
            if (connectionId === null || connectionId === undefined || connectionId === '') {
                return { ok: false, status: 0, data: null, error: 'No connection selected' };
            }
            const key = `${connectionId}:${lang}`;
            const cached = cacheRef.current.get(key);
            if (cached) {
                setData(cached);
                return { ok: true, status: 200, data: cached };
            }
            setIsLoading(true);
            setError(null);

            const url = `/api/family/connections/${encodeURIComponent(String(connectionId))}/compatibility?lang=${encodeURIComponent(lang)}`;

            try {
                for (let attempt = 0; attempt <= PENDING_RETRY_BACKOFFS_MS.length; attempt++) {
                    const res = await clientFetch(url);
                    const body = await res.json().catch(() => ({}));

                    if (res.ok) {
                        const result = body as FamilyCompatibilityResponse;
                        cacheRef.current.set(key, result);
                        setData(result);
                        return { ok: true, status: res.status, data: result, raw: body };
                    }

                    // SHARING_REQUIRED — not an error to toast; surface inline.
                    const code = (body?.code ?? body?.detail?.code) as string | undefined;
                    if (code === 'SHARING_REQUIRED') {
                        const msg = body.error || body.message || body.detail?.error || 'Sharing required';
                        const rawNudge = (body.nudgeAction ?? body.nudge_action) as Record<string, unknown> | undefined;
                        const nudgeAction = rawNudge && typeof rawNudge === 'object' && typeof rawNudge.target_email === 'string'
                            ? {
                                type: (rawNudge.type ?? 'remind') as string,
                                target_email: rawNudge.target_email,
                            }
                            : undefined;
                        const blockedByRaw = (body.blockedBy ?? body.blocked_by) as string | undefined;
                        const blockedBy = (blockedByRaw === 'you' || blockedByRaw === 'them' || blockedByRaw === 'both')
                            ? (blockedByRaw as FamilySharingBlockedBy)
                            : undefined;
                        setError(msg);
                        return {
                            ok: false,
                            status: res.status,
                            data: null,
                            error: msg,
                            raw: body,
                            sharingRequired: true,
                            blockedBy,
                            sharingWithThem: !!(body.sharing_with_them ?? body.sharingWithThem),
                            theyShareWithMe: !!(body.they_share_with_me ?? body.theyShareWithMe ?? body.sharing_with_user),
                            ...(nudgeAction ? { nudgeAction } : {}),
                        };
                    }

                    if (res.status === 409 && body?.error === 'reservation_pending') {
                        if (attempt < PENDING_RETRY_BACKOFFS_MS.length) {
                            await sleep(PENDING_RETRY_BACKOFFS_MS[attempt]);
                            continue;
                        }
                        const msg = 'Still computing — please try again in a moment.';
                        setError(msg);
                        return { ok: false, status: 409, data: null, error: msg, raw: body, stillComputing: true };
                    }

                    const msg = body.error || body.detail || `Failed (${res.status})`;
                    setError(msg);
                    return { ok: false, status: res.status, data: null, error: msg, raw: body };
                }

                return { ok: false, status: 0, data: null, error: 'Unexpected retry exit' };
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to load compatibility';
                setError(msg);
                return { ok: false, status: 0, data: null, error: msg };
            } finally {
                setIsLoading(false);
            }
        },
        [connectionId]
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

export function useFamilyAvatars() {
    const [data, setData] = useState<FamilyAvatar[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAvatars = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch('/api/family/avatars');
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to load family avatars');
            }
            // Backend might return either array directly or { avatars: FamilyAvatar[] }
            const avatarsList = Array.isArray(body.avatars) ? body.avatars : (Array.isArray(body) ? body : []);
            setData(avatarsList);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load family avatars';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAvatars();
    }, [fetchAvatars]);

    return { data, isLoading, error, refetch: fetchAvatars };
}

export function useFamilyCompatibilityPreflight(memberId: number | string | null) {
    const [data, setData] = useState<FamilyCompatibilityPreflight | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPreflight = useCallback(async () => {
        if (memberId === null || memberId === undefined || memberId === '') {
            setData(null);
            return null;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch(`/api/family/members/${encodeURIComponent(String(memberId))}/compatibility/preflight`);
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to check compatibility preflight');
            }
            const normalized = normalizePreflight(body);
            setData(normalized);
            return normalized;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to check compatibility preflight';
            setError(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [memberId]);

    return { data, isLoading, error, fetchPreflight, reset: () => setData(null) };
}

/** Same shape as the member preflight, but hits the connection endpoint.
 *  Backend exposes refresh CTA metadata under the same `refresh` block. */
export function useFamilyConnectionCompatibilityPreflight(connectionId: number | string | null) {
    const [data, setData] = useState<FamilyCompatibilityPreflight | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPreflight = useCallback(async () => {
        if (connectionId === null || connectionId === undefined || connectionId === '') {
            setData(null);
            return null;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch(`/api/family/connections/${encodeURIComponent(String(connectionId))}/compatibility/preflight`);
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to check compatibility preflight');
            }
            const normalized = normalizePreflight(body);
            setData(normalized);
            return normalized;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to check compatibility preflight';
            setError(msg);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [connectionId]);

    return { data, isLoading, error, fetchPreflight, reset: () => setData(null) };
}

function normalizePreflight(body: Record<string, unknown>): FamilyCompatibilityPreflight {
    const rawRefresh = (body.refresh ?? null) as Record<string, unknown> | null;
    const refresh = rawRefresh && typeof rawRefresh === 'object'
        ? {
            available: !!(rawRefresh.available ?? false),
            creditCost: Number(rawRefresh.credit_cost ?? rawRefresh.creditCost ?? 0),
            wouldUseFresh: !!(rawRefresh.would_use_fresh ?? rawRefresh.wouldUseFresh ?? false),
        }
        : undefined;
    return {
        cachedResultAvailable: !!(body.cached_result_available ?? body.cachedResultAvailable),
        staleDataWarning: !!(body.stale_data_warning ?? body.staleDataWarning),
        creditCost: Number(body.credit_cost ?? body.creditCost ?? 0),
        relationshipType: (body.relationship_type ?? body.relationshipType) as FamilyCompatibilityPreflight['relationshipType'],
        ...(refresh ? { refresh } : {}),
    };
}

export interface FamilyReport {
    id: number;
    memberId: number;
    reportType: string;
    title: string;
    summary?: string;
    createdAt: string;
}

export function useFamilyReports(memberId: number | string | null) {
    const [data, setData] = useState<FamilyReport[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReports = useCallback(async () => {
        if (memberId === null || memberId === undefined || memberId === '') {
            setData(null);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch(`/api/family/members/${encodeURIComponent(String(memberId))}/reports`);
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to load reports');
            }
            const reportsList = Array.isArray(body.reports) ? body.reports : (Array.isArray(body) ? body : []);
            const normalized: FamilyReport[] = reportsList
                .map((r: Record<string, unknown>): FamilyReport | null => {
                    if (!r || typeof r !== 'object') return null;
                    const id = (r.id ?? r.report_id) as number | undefined;
                    if (typeof id !== 'number') return null;
                    return {
                        id,
                        memberId: (r.member_id ?? r.memberId ?? 0) as number,
                        reportType: (r.report_type ?? r.reportType ?? '') as string,
                        title: (r.title ?? '') as string,
                        summary: (r.summary ?? undefined) as string | undefined,
                        createdAt: (r.created_at ?? r.createdAt ?? '') as string,
                    };
                })
                .filter((r: FamilyReport | null): r is FamilyReport => r !== null);
            setData(normalized);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load reports';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [memberId]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    return { data, isLoading, error, refetch: fetchReports };
}

/* ------------------------------------------------------------------ */
/* Invites + linked connections                                        */
/* ------------------------------------------------------------------ */

/** Normalize a single invite entry from the backend (snake or camel casing). */
function normalizeInvite(raw: unknown): FamilyInvite | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const pick = <T,>(snake: string, camel: string): T | undefined => {
        if (r[snake] !== undefined) return r[snake] as T;
        if (r[camel] !== undefined) return r[camel] as T;
        return undefined;
    };
    const id = pick<number>('id', 'id');
    if (id === undefined) return null;

    const rawCandidate = pick<unknown>('merge_candidate', 'mergeCandidate');
    const mergeCandidate = normalizeMergeCandidate(rawCandidate);

    return {
        id,
        requesterEmail: (pick<string>('requester_email', 'requesterEmail') ?? '') as string,
        inviteeEmail: (pick<string>('invitee_email', 'inviteeEmail') ?? '') as string,
        requesterRelationshipType: pick<FamilyInvite['requesterRelationshipType']>(
            'requester_relationship_type', 'requesterRelationshipType'
        ) as FamilyInvite['requesterRelationshipType'],
        message: (pick<string | null>('message', 'message') ?? null) as string | null,
        status: pick<FamilyInvite['status']>('status', 'status') as FamilyInvite['status'],
        expiresAt: (pick<string>('expires_at', 'expiresAt') ?? '') as string,
        createdAt: (pick<string>('created_at', 'createdAt') ?? '') as string,
        respondedAt: (pick<string | null>('responded_at', 'respondedAt') ?? null) as string | null,
        requesterName: (pick<string | null>('requester_name', 'requesterName') ?? null) as string | null,
        inviteeName: (pick<string | null>('invitee_name', 'inviteeName') ?? null) as string | null,
        ...(mergeCandidate ? { mergeCandidate } : {}),
    };
}

/** Normalize a merge candidate (returned inline on /incoming invites and inside
 *  the /accept response). Accepts snake or camel casing; null/undefined → null. */
export function normalizeMergeCandidate(raw: unknown): FamilyMergeCandidate | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const memberId = (r.member_id ?? r.memberId) as number | undefined;
    if (typeof memberId !== 'number') return null;
    const matchScore = (r.match_score ?? r.matchScore) as string | undefined;
    return {
        memberId,
        name: (r.name ?? '') as string,
        dob: (r.dob ?? '') as string,
        ...(matchScore ? { matchScore: matchScore as FamilyMergeMatchScore } : {}),
    };
}

/** Normalize a single connection entry (snake or camel casing). */
export function normalizeConnection(raw: unknown): FamilyConnection | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const pick = <T,>(snake: string, camel: string): T | undefined => {
        if (r[snake] !== undefined) return r[snake] as T;
        if (r[camel] !== undefined) return r[camel] as T;
        return undefined;
    };
    const connectionId = pick<number>('connection_id', 'connectionId');
    if (connectionId === undefined) return null;
    return {
        connectionId,
        otherEmail: (pick<string>('other_email', 'otherEmail') ?? '') as string,
        otherName: (pick<string>('other_name', 'otherName') ?? '') as string,
        iSeeThemAs: pick<FamilyConnection['iSeeThemAs']>('i_see_them_as', 'iSeeThemAs') as FamilyConnection['iSeeThemAs'],
        theySeeMeAs: pick<FamilyConnection['theySeeMeAs']>('they_see_me_as', 'theySeeMeAs') as FamilyConnection['theySeeMeAs'],
        myAvatarKey: (pick<string | null>('my_avatar_key', 'myAvatarKey') ?? null) as string | null,
        avatar: (pick<FamilyAvatar | null>('avatar', 'avatar') ?? null) as FamilyAvatar | null,
        myNotes: (pick<string | null>('my_notes', 'myNotes') ?? null) as string | null,
        sharingWithThem: !!pick<boolean>('sharing_with_them', 'sharingWithThem'),
        theyShareWithMe: !!(pick<boolean>('they_share_with_me', 'theyShareWithMe') ?? pick<boolean>('sharing_with_user', 'sharingWithUser')),
        createdAt: (pick<string>('created_at', 'createdAt') ?? '') as string,
        disconnectedAt: (pick<string | null>('disconnected_at', 'disconnectedAt') ?? null) as string | null,
        disconnected: !!pick<boolean>('disconnected', 'disconnected'),
    };
}

function extractList<T>(body: unknown, normalize: (raw: unknown) => T | null): T[] {
    let raw: unknown[] = [];
    if (Array.isArray(body)) raw = body;
    else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.invites)) raw = b.invites;
        else if (Array.isArray(b.connections)) raw = b.connections;
        else if (Array.isArray(b.data)) raw = b.data;
        else if (Array.isArray(b.items)) raw = b.items;
    }
    return raw.map(normalize).filter((x): x is T => x !== null);
}

function useInvitesList(endpoint: '/api/family/invites/incoming' | '/api/family/invites/outgoing') {
    const [data, setData] = useState<FamilyInvite[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchInvites = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch(endpoint);
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to load invites');
            }
            setData(extractList(body, normalizeInvite));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load invites';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [endpoint]);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    return { data, isLoading, error, refetch: fetchInvites };
}

export function useIncomingInvites() {
    return useInvitesList('/api/family/invites/incoming');
}

export function useOutgoingInvites() {
    return useInvitesList('/api/family/invites/outgoing');
}

export function useFamilyConnections() {
    const [data, setData] = useState<FamilyConnection[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConnections = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch('/api/family/connections');
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to load connections');
            }
            setData(extractList(body, normalizeConnection));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load connections';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    return { data, isLoading, error, refetch: fetchConnections };
}

/* ----- Mutations ----- */

async function postJson<T = unknown>(url: string, body?: unknown, method: 'POST' | 'PATCH' | 'DELETE' = 'POST'): Promise<MutationResult<T>> {
    try {
        const res = await clientFetch(url, {
            method,
            headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
        const respBody = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                ok: false,
                status: res.status,
                data: null,
                error: respBody.error || respBody.detail || 'Request failed',
                raw: respBody,
            };
        }
        return { ok: true, status: res.status, data: respBody as T, raw: respBody };
    } catch (err) {
        return {
            ok: false,
            status: 0,
            data: null,
            error: err instanceof Error ? err.message : 'Request failed',
        };
    }
}

export async function sendInvite(payload: FamilyInviteSendPayload): Promise<MutationResult<FamilyInvite>> {
    const result = await postJson<unknown>('/api/family/invites', payload, 'POST');
    if (!result.ok) return result as MutationResult<FamilyInvite>;
    return { ...result, data: normalizeInvite(result.data) };
}

export async function acceptInvite(
    inviteId: number | string,
    payload: FamilyInviteAcceptPayload = {}
): Promise<MutationResult<FamilyInviteAcceptResponse>> {
    return postJson<FamilyInviteAcceptResponse>(
        `/api/family/invites/${encodeURIComponent(String(inviteId))}/accept`,
        payload,
        'POST'
    );
}

export async function acceptInviteMerge(
    inviteId: number | string,
    candidateMemberId: number
): Promise<MutationResult<FamilyInviteAcceptResponse>> {
    return postJson<FamilyInviteAcceptResponse>(
        `/api/family/invites/${encodeURIComponent(String(inviteId))}/accept/merge`,
        { candidateMemberId },
        'POST'
    );
}

export async function declineInvite(inviteId: number | string): Promise<MutationResult> {
    return postJson(`/api/family/invites/${encodeURIComponent(String(inviteId))}/decline`, undefined, 'POST');
}

export async function revokeInvite(inviteId: number | string): Promise<MutationResult> {
    return postJson(`/api/family/invites/${encodeURIComponent(String(inviteId))}`, undefined, 'DELETE');
}

export async function updateConnection(
    connectionId: number | string,
    payload: FamilyConnectionUpdatePayload
): Promise<MutationResult<FamilyConnection>> {
    const result = await postJson<unknown>(
        `/api/family/connections/${encodeURIComponent(String(connectionId))}`,
        payload,
        'PATCH'
    );
    if (!result.ok) return result as MutationResult<FamilyConnection>;
    return { ...result, data: normalizeConnection(result.data) };
}

export async function deleteConnection(connectionId: number | string): Promise<MutationResult> {
    return postJson(`/api/family/connections/${encodeURIComponent(String(connectionId))}`, undefined, 'DELETE');
}

