'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { clientFetch } from '@/lib/apiClient';
import type { MessageThread } from '@/types/messages';

/** Normalize one thread row (tolerates camel or snake casing from the backend). */
function normalizeThread(raw: unknown): MessageThread | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const threadId = (r.threadId ?? r.thread_id) as number | undefined;
    if (typeof threadId !== 'number') return null;
    const unread = (r.unreadCount ?? r.unread_count) as number | undefined;
    return {
        threadId,
        otherEmail: (r.otherEmail ?? r.other_email ?? '') as string,
        otherName: (r.otherName ?? r.other_name ?? '') as string,
        lastMessagePreview: (r.lastMessagePreview ?? r.last_message_preview ?? null) as string | null,
        lastMessageFromMe: (r.lastMessageFromMe ?? r.last_message_from_me ?? null) as boolean | null,
        lastMessageAt: (r.lastMessageAt ?? r.last_message_at ?? null) as string | null,
        unreadCount: typeof unread === 'number' ? Math.max(0, unread) : 0,
        createdAt: (r.createdAt ?? r.created_at ?? '') as string,
    };
}

function extractThreads(body: unknown): MessageThread[] {
    let raw: unknown[] = [];
    if (Array.isArray(body)) {
        raw = body;
    } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.threads)) raw = b.threads;
        else if (Array.isArray(b.data)) raw = b.data;
    }
    return raw.map(normalizeThread).filter((t): t is MessageThread => t !== null);
}

export interface UseThreadsResult {
    threads: MessageThread[];
    isLoading: boolean;
    error: string | null;
    hasLoadedOnce: boolean;
    refetch: () => Promise<void>;
    /** Sum of per-thread unread counts (global inbox badge). */
    totalUnread: number;
}

/** Loads the inbox thread list (newest activity first). */
export function useThreads(options: { enabled?: boolean } = {}): UseThreadsResult {
    const { enabled = true } = options;

    const [threads, setThreads] = useState<MessageThread[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const loadingRef = useRef(false);

    const refetch = useCallback(async () => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch('/api/messages/threads');
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(body.error || body.detail || 'Failed to load conversations');
            }
            setThreads(extractThreads(body));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load conversations');
        } finally {
            setIsLoading(false);
            setHasLoadedOnce(true);
            loadingRef.current = false;
        }
    }, []);

    useEffect(() => {
        if (enabled) void refetch();
    }, [enabled, refetch]);

    const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0);

    return { threads, isLoading, error, hasLoadedOnce, refetch, totalUnread };
}
