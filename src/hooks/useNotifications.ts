'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { clientFetch } from '@/lib/apiClient';
import type { AppNotification } from '@/types/notifications';

const PAGE_SIZE = 20;

/** Normalize one backend notification row (accepts camel or snake casing). */
function normalizeNotification(raw: unknown): AppNotification | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const id = (r.id ?? r.notification_id) as number | undefined;
    if (typeof id !== 'number') return null;
    return {
        id,
        type: (r.type ?? '') as AppNotification['type'],
        title: (r.title ?? '') as string,
        body: (r.body ?? '') as string,
        data: (r.data && typeof r.data === 'object' ? r.data : {}) as Record<string, unknown>,
        read: !!(r.read ?? r.is_read),
        createdAt: (r.createdAt ?? r.created_at ?? '') as string,
    };
}

function extractFeed(body: unknown): { notifications: AppNotification[]; nextCursor: number | null } {
    let raw: unknown[] = [];
    let nextCursor: number | null = null;
    if (Array.isArray(body)) {
        raw = body;
    } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.notifications)) raw = b.notifications;
        else if (Array.isArray(b.data)) raw = b.data;
        else if (Array.isArray(b.items)) raw = b.items;
        const cursor = b.nextCursor ?? b.next_cursor;
        nextCursor = typeof cursor === 'number' ? cursor : null;
    }
    return {
        notifications: raw.map(normalizeNotification).filter((n): n is AppNotification => n !== null),
        nextCursor,
    };
}

export interface UseNotificationFeedOptions {
    /** When true, request only unread rows (dedicated "unread" tab). */
    unreadOnly?: boolean;
    /** Defer the first fetch until explicitly told (e.g. panel only loads on open). */
    enabled?: boolean;
}

export function useNotificationFeed(options: UseNotificationFeedOptions = {}) {
    const { unreadOnly = false, enabled = true } = options;

    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    // Guards against overlapping loads (rapid scroll / refetch races).
    const loadingRef = useRef(false);

    const buildUrl = useCallback((beforeId: number | null) => {
        const qs = new URLSearchParams({ limit: String(PAGE_SIZE) });
        if (unreadOnly) qs.set('unread_only', 'true');
        if (beforeId != null) qs.set('before_id', String(beforeId));
        return `/api/notifications?${qs.toString()}`;
    }, [unreadOnly]);

    const fetchPage = useCallback(async (beforeId: number | null) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        const isFirst = beforeId == null;
        if (isFirst) setIsLoading(true);
        else setIsLoadingMore(true);
        setError(null);
        try {
            const res = await clientFetch(buildUrl(beforeId));
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to load notifications');
            }
            const { notifications: page, nextCursor: cursor } = extractFeed(body);
            setNotifications(prev => {
                if (isFirst) return page;
                // De-dupe defensively in case a row straddles a page boundary.
                const seen = new Set(prev.map(n => n.id));
                return [...prev, ...page.filter(n => !seen.has(n.id))];
            });
            setNextCursor(cursor);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load notifications');
        } finally {
            if (isFirst) setIsLoading(false);
            else setIsLoadingMore(false);
            setHasLoadedOnce(true);
            loadingRef.current = false;
        }
    }, [buildUrl]);

    const refetch = useCallback(() => fetchPage(null), [fetchPage]);

    const loadMore = useCallback(() => {
        if (nextCursor == null || loadingRef.current) return;
        return fetchPage(nextCursor);
    }, [nextCursor, fetchPage]);

    useEffect(() => {
        if (enabled) fetchPage(null);
        // Re-run when the filter changes; fetchPage closes over buildUrl(unreadOnly).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, unreadOnly]);

    /** Optimistically mark one read. Tolerant of `changed: false` (already read /
     *  not theirs) — never surfaced as a failure. Returns whether the row was
     *  unread locally before the call (so callers can adjust a badge). */
    const markRead = useCallback(async (id: number): Promise<{ wasUnread: boolean }> => {
        let wasUnread = false;
        setNotifications(prev => prev.map(n => {
            if (n.id === id) {
                if (!n.read) wasUnread = true;
                return { ...n, read: true };
            }
            return n;
        }));
        try {
            await clientFetch(`/api/notifications/${encodeURIComponent(String(id))}/read`, { method: 'POST' });
        } catch {
            // Best-effort; the optimistic state stands and a later refetch reconciles.
        }
        return { wasUnread };
    }, []);

    /** Optimistically mark everything read. Returns the count flipped locally. */
    const markAllRead = useCallback(async (): Promise<{ marked: number }> => {
        let marked = 0;
        setNotifications(prev => prev.map(n => {
            if (!n.read) marked += 1;
            return n.read ? n : { ...n, read: true };
        }));
        try {
            await clientFetch('/api/notifications/read-all', { method: 'POST' });
        } catch {
            // Best-effort.
        }
        return { marked };
    }, []);

    return {
        notifications,
        isLoading,
        isLoadingMore,
        error,
        hasMore: nextCursor != null,
        hasLoadedOnce,
        refetch,
        loadMore,
        markRead,
        markAllRead,
    };
}
