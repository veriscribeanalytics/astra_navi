'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { clientFetch } from '@/lib/apiClient';
import { useDebouncedValue } from '@/hooks/useDebounce';
import type {
    FamilyMember,
    FamilyMemberCreatePayload,
    FamilyMemberUpdatePayload,
    FamilyChartResponse,
    FamilyAvatar,
    FamilyInvite,
    FamilyConnection,
    FamilyInviteSendPayload,
    FamilyInviteAcceptPayload,
    FamilyInviteAcceptResponse,
    FamilyConnectionUpdatePayload,
    FamilyMergeCandidate,
    FamilyMergeMatchScore,
    FamilyDiscoverResult,
    FamilyDiscoverRelationshipStatus,
    FamilyBlock,
    FamilyGender,
} from '@/types/family';

/* ------------------------------------------------------------------ */
/* snake_case (backend) → camelCase (frontend) normalizer              */
/* ------------------------------------------------------------------ */

/** Backend responses for /api/family/members and /api/family/roster are
 *  snake_case. Convert to the camelCase FamilyMember shape that the rest of
 *  the app consumes. Accepts either casing. This normalizer now handles both
 *  manual entries (`source: 'manual'`) and linked connections promoted to
 *  family (`source: 'linked'`). UI should key list items by (source, id)
 *  because ids from the two tables can collide. */
export function normalizeFamilyMember(raw: unknown): FamilyMember | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;

    const source = ((r.source as string) === 'linked' ? 'linked' : 'manual') as FamilyMember['source'];

    const pick = <T,>(snake: string, camel: string): T | undefined => {
        if (r[snake] !== undefined) return r[snake] as T;
        if (r[camel] !== undefined) return r[camel] as T;
        return undefined;
    };

    const id = pick<number>('id', 'id');
    if (id === undefined) return null;

    const base: FamilyMember = {
        id: id as number,
        source,
        name: (pick<string>('name', 'name') ?? pick<string>('other_name', 'otherName') ?? '') as string,
        relationshipType: normalizeRelationshipLabel(
            pick<string>('relationship_type', 'relationshipType') ??
            pick<string>('i_see_them_as', 'iSeeThemAs')
        ) as FamilyMember['relationshipType'],
        gender: (pick<FamilyMember['gender']>('gender', 'gender') ?? 'other') as FamilyGender,
        dob: pick<string>('dob', 'dob') ?? (source === 'manual' ? '' : undefined),
        tob: source === 'manual' ? trimSeconds((pick<string>('tob', 'tob') ?? '') as string) : undefined,
        pob: pick<string>('pob', 'pob') ?? (source === 'manual' ? '' : undefined),
        latitude: source === 'manual' ? Number(pick<number>('latitude', 'latitude') ?? 0) : undefined,
        longitude: source === 'manual' ? Number(pick<number>('longitude', 'longitude') ?? 0) : undefined,
        timezoneOffset: source === 'manual' ? Number(pick<number>('timezone_offset', 'timezoneOffset') ?? 0) : undefined,
        notes: (source === 'linked'
            ? (pick<string | null>('notes', 'notes') ?? pick<string | null>('my_notes', 'myNotes') ?? null)
            : pick<string | null>('notes', 'notes') ?? null) as string | null | undefined,
        avatarKey: pick<string>('avatar_key', 'avatarKey') ?? null,
        avatar: pick<FamilyMember['avatar']>('avatar', 'avatar') ?? null,
        consentAcknowledged: source === 'manual' ? pick<boolean>('consent_acknowledged', 'consentAcknowledged') : undefined,
        consentAcknowledgedAt: source === 'manual' ? pick<string>('consent_acknowledged_at', 'consentAcknowledgedAt') : undefined,
        createdAt: pick<string>('created_at', 'createdAt'),
        updatedAt: pick<string>('updated_at', 'updatedAt'),
    };

    if (source !== 'linked') return base;

    // Normalize linked-only fields. For linked family entries, backend may set
    // `id` to `connection_id`; prefer an explicit connection_id when present.
    return {
        ...base,
        connectionId: (pick<number>('connection_id', 'connectionId') ?? id) as number,
        sharingWithUser: !!(
            pick<boolean>('sharing_with_user', 'sharingWithUser') ??
            pick<boolean>('they_share_with_me', 'theyShareWithMe')
        ),
        sharingWithThem: !!(pick<boolean>('sharing_with_them', 'sharingWithThem')),
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

/** Resolve a family member (manual or linked) to the backend base path + id
 *  that sub-actions (chart, compatibility, dashboard, …) should target. For
 *  linked members this routes to `/api/family/connections/{connectionId}` so
 *  the bidirectional-sharing gate applies; for manual members it routes to
 *  `/api/family/members/{id}`. Exported so the family-dashboard hooks reuse
 *  the same routing without duplicating the source/id heuristics. */
export function memberActionTargets(member: FamilyMember | null | undefined) {
    if (!member) return null;
    if (member.source === 'linked') {
        const targetId = member.connectionId ?? member.id;
        return {
            basePath: '/api/family/connections' as const,
            id: targetId,
            cachePrefix: `linked:${targetId}`,
        };
    }
 return {
        basePath: '/api/family/members' as const,
        id: member.id,
        cachePrefix: `manual:${member.id}`,
    };
}

export function useFamilyChart(member: FamilyMember | null) {
    const [data, setData] = useState<FamilyChartResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cacheRef = useRef<Map<string, FamilyChartResponse>>(new Map());

    // Memoize on the member's stable identity primitives. Without this,
    // memberActionTargets() returns a fresh object every render, which would
    // invalidate every downstream useCallback/useEffect that depends on
    // `targets` and cause infinite fetch loops (e.g. reports/preflight).
    const targets = useMemo(
        () => memberActionTargets(member),
        [member],
    );

    const fetchChart = useCallback(async () => {
        if (!targets) {
            setData(null);
            return;
        }
        const key = targets.cachePrefix;
        const cached = cacheRef.current.get(key);
        if (cached) {
            setData(cached);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch(`${targets.basePath}/${encodeURIComponent(String(targets.id))}/chart`);
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
    }, [targets]);

    useEffect(() => {
        fetchChart();
    }, [fetchChart]);

    return { data, isLoading, error, refetch: fetchChart };
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

/* ------------------------------------------------------------------ */
/* Invites + linked connections                                        */
/* ------------------------------------------------------------------ */

/** Normalize a single invite entry from the backend (snake or camel casing).
 *  Invites are plain post-059 — no kind, no relationship, no merge candidate. */
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

    return {
        id,
        requesterEmail: (pick<string>('requester_email', 'requesterEmail') ?? '') as string,
        inviteeEmail: (pick<string>('invitee_email', 'inviteeEmail') ?? '') as string,
        message: (pick<string | null>('message', 'message') ?? null) as string | null,
        status: pick<FamilyInvite['status']>('status', 'status') as FamilyInvite['status'],
        expiresAt: (pick<string>('expires_at', 'expiresAt') ?? '') as string,
        createdAt: (pick<string>('created_at', 'createdAt') ?? '') as string,
        respondedAt: (pick<string | null>('responded_at', 'respondedAt') ?? null) as string | null,
        requesterName: (pick<string | null>('requester_name', 'requesterName') ?? null) as string | null,
        inviteeName: (pick<string | null>('invitee_name', 'inviteeName') ?? null) as string | null,
    };
}

/** Normalize a merge candidate (returned inline on a PATCH that sets a relationship
 *  label). Accepts snake or camel casing; null/undefined → null. */
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

/** Coerce a raw relationship value into FamilyRelationshipType | null. Labels are
 *  nullable until each side picks one when enabling sharing. */
function normalizeRelationshipLabel(raw: unknown): FamilyConnection['iSeeThemAs'] {
    return (typeof raw === 'string' && raw ? raw : null) as FamilyConnection['iSeeThemAs'];
}

/** Normalize a single connection entry (snake or camel casing). `isFamily` is the
 *  derived mutual-sharing flag that replaced the old `kind`. */
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
        isFamily: !!pick<boolean>('is_family', 'isFamily'),
        otherEmail: (pick<string>('other_email', 'otherEmail') ?? '') as string,
        otherName: (pick<string>('other_name', 'otherName') ?? '') as string,
        iSeeThemAs: normalizeRelationshipLabel(pick<string>('i_see_them_as', 'iSeeThemAs')),
        theySeeMeAs: normalizeRelationshipLabel(pick<string>('they_see_me_as', 'theySeeMeAs')),
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

/** Shared connection-list fetcher. `/api/family/connections` returns **all**
 *  active connections; `/api/family/family` returns the **family subset** (both
 *  sides sharing). Each item carries `isFamily` so callers can also split the
 *  full list client-side without a second request. */
function useConnectionsList(endpoint: '/api/family/connections' | '/api/family/family') {
    const [data, setData] = useState<FamilyConnection[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchConnections = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch(endpoint);
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
    }, [endpoint]);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    return { data, isLoading, error, refetch: fetchConnections };
}

/** All active connections. Read `isFamily` per item to split family vs. plain. */
export function useFamilyConnections() {
    return useConnectionsList('/api/family/connections');
}

/** The family subset (connections where both sides share). Equivalent to
 *  filtering {@link useFamilyConnections} by `isFamily`, served by the backend. */
export function useFamilyFamilyConnections() {
    return useConnectionsList('/api/family/family');
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

export async function declineInvite(inviteId: number | string): Promise<MutationResult> {
    return postJson(`/api/family/invites/${encodeURIComponent(String(inviteId))}/decline`, undefined, 'POST');
}

export async function revokeInvite(inviteId: number | string): Promise<MutationResult> {
    return postJson(`/api/family/invites/${encodeURIComponent(String(inviteId))}`, undefined, 'DELETE');
}

/** Result of a connection PATCH: the updated connection plus an optional merge
 *  candidate surfaced when the relationship label matches a manual member. */
export interface ConnectionUpdateResult extends MutationResult<FamilyConnection> {
    /** Present when setting `relationshipOverride` matched a manual family member. */
    mergeCandidate?: FamilyMergeCandidate;
}

export async function updateConnection(
    connectionId: number | string,
    payload: FamilyConnectionUpdatePayload
): Promise<ConnectionUpdateResult> {
    const result = await postJson<unknown>(
        `/api/family/connections/${encodeURIComponent(String(connectionId))}`,
        payload,
        'PATCH'
    );
    if (!result.ok) return result as ConnectionUpdateResult;
    // Backend may return either the bare connection or { connection, mergeCandidate }.
    const raw = result.data as Record<string, unknown> | null;
    const connectionSource = raw && typeof raw === 'object' && 'connection' in raw ? raw.connection : raw;
    const candidate = raw && typeof raw === 'object'
        ? normalizeMergeCandidate(raw.mergeCandidate ?? raw.merge_candidate)
        : null;
    return {
        ...result,
        data: normalizeConnection(connectionSource),
        ...(candidate ? { mergeCandidate: candidate } : {}),
    };
}

/** Confirm merging a manual family member into this connection. Requires a
 *  relationship label to have been set first (else 409 MERGE_LABEL_REQUIRED). */
export async function mergeConnection(
    connectionId: number | string,
    candidateMemberId: number
): Promise<MutationResult<FamilyConnection>> {
    const result = await postJson<unknown>(
        `/api/family/connections/${encodeURIComponent(String(connectionId))}/merge`,
        { candidateMemberId },
        'POST'
    );
    if (!result.ok) return result as MutationResult<FamilyConnection>;
    const raw = result.data as Record<string, unknown> | null;
    const connectionSource = raw && typeof raw === 'object' && 'connection' in raw ? raw.connection : raw;
    return { ...result, data: normalizeConnection(connectionSource) };
}

export async function deleteConnection(connectionId: number | string): Promise<MutationResult> {
    return postJson(`/api/family/connections/${encodeURIComponent(String(connectionId))}`, undefined, 'DELETE');
}

/* ------------------------------------------------------------------ */
/* Discovery (search) + handle + blocking                              */
/* ------------------------------------------------------------------ */

const DISCOVER_MIN_CHARS = 2;
const DISCOVER_DEBOUNCE_MS = 300;

function normalizeDiscoverResult(raw: unknown): FamilyDiscoverResult | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const username = (r.username ?? r.user_name) as string | undefined;
    if (!username) return null;
    const statusRaw = (r.relationshipStatus ?? r.relationship_status ?? 'none') as string;
    const relationshipStatus: FamilyDiscoverRelationshipStatus =
        statusRaw === 'pending' || statusRaw === 'connected' ? statusRaw : 'none';
    return {
        username,
        name: (r.name ?? '') as string,
        moonSign: (r.moonSign ?? r.moon_sign ?? null) as string | null,
        relationshipStatus,
    };
}

function extractDiscoverResults(body: unknown): FamilyDiscoverResult[] {
    let raw: unknown[] = [];
    if (Array.isArray(body)) raw = body;
    else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.results)) raw = b.results;
        else if (Array.isArray(b.data)) raw = b.data;
    }
    return raw.map(normalizeDiscoverResult).filter((r): r is FamilyDiscoverResult => r !== null);
}

/** Debounced people search. Queries shorter than 2 chars short-circuit to an
 *  empty result set without hitting the network (backend also enforces this). */
export function useFamilyDiscover() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FamilyDiscoverResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounced = useDebouncedValue(query, DISCOVER_DEBOUNCE_MS);
    // Guards against out-of-order responses overwriting a newer query's results.
    const latestQueryRef = useRef('');

    useEffect(() => {
        const term = debounced.trim();
        latestQueryRef.current = term;

        if (term.length < DISCOVER_MIN_CHARS) {
            setResults([]);
            setIsLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        setError(null);

        (async () => {
            try {
                const res = await clientFetch(`/api/family/discover?q=${encodeURIComponent(term)}`);
                const body = await res.json().catch(() => ({}));
                if (cancelled || latestQueryRef.current !== term) return;
                if (!res.ok) {
                    throw new Error(body.error || body.detail || 'Search failed');
                }
                setResults(extractDiscoverResults(body));
            } catch (err) {
                if (cancelled || latestQueryRef.current !== term) return;
                setError(err instanceof Error ? err.message : 'Search failed');
                setResults([]);
            } finally {
                if (!cancelled && latestQueryRef.current === term) setIsLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, [debounced]);

    /** Patch a single row's relationshipStatus in place (e.g. after inviting),
     *  so the CTA flips to "Requested" without a re-search. */
    const setResultStatus = useCallback((username: string, status: FamilyDiscoverRelationshipStatus) => {
        setResults(prev => prev.map(r => (r.username === username ? { ...r, relationshipStatus: status } : r)));
    }, []);

    /** Drop a row from results entirely (e.g. after blocking). */
    const removeResult = useCallback((username: string) => {
        setResults(prev => prev.filter(r => r.username !== username));
    }, []);

    return { query, setQuery, results, isLoading, error, setResultStatus, removeResult };
}

/** Set, change, or clear (pass null) the caller's discovery handle.
 *  On 409 the backend returns { error: { code: 'USERNAME_TAKEN' } }; the raw
 *  body is returned so callers can distinguish taken vs. validation (422). */
export async function setUsername(username: string | null): Promise<MutationResult<{ username: string | null }>> {
    return postJson<{ username: string | null }>('/api/user/username', { username }, 'PATCH');
}

function normalizeBlock(raw: unknown): FamilyBlock | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const id = (r.id ?? r.block_id) as number | undefined;
    if (typeof id !== 'number') return null;
    return {
        id,
        username: (r.username ?? r.user_name ?? '') as string,
        name: (r.name ?? '') as string,
        createdAt: (r.createdAt ?? r.created_at ?? '') as string,
    };
}

function extractBlocks(body: unknown): FamilyBlock[] {
    let raw: unknown[] = [];
    if (Array.isArray(body)) raw = body;
    else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.blocks)) raw = b.blocks;
        else if (Array.isArray(b.data)) raw = b.data;
    }
    return raw.map(normalizeBlock).filter((x): x is FamilyBlock => x !== null);
}

export function useFamilyBlocks() {
    const [data, setData] = useState<FamilyBlock[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchBlocks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch('/api/family/blocks');
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to load blocked users');
            }
            setData(extractBlocks(body));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load blocked users';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBlocks();
    }, [fetchBlocks]);

    return { data, isLoading, error, refetch: fetchBlocks };
}

/** Block a user by exactly one of username or email. Idempotent on the backend. */
export async function blockUser(target: { username?: string; email?: string }): Promise<MutationResult> {
    return postJson('/api/family/blocks', target, 'POST');
}

/** Unblock by block id (not username — survives handle changes). */
export async function unblockUser(blockId: number | string): Promise<MutationResult> {
    return postJson(`/api/family/blocks/${encodeURIComponent(String(blockId))}`, undefined, 'DELETE');
}

