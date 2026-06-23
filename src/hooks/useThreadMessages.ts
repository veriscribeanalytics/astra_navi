'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { clientFetch } from '@/lib/apiClient';
import { DmUploadError, uploadDmImage, validateDmImage } from '@/lib/dmImageUpload';
import {
    type Message,
    MESSAGE_MAX_LENGTH,
} from '@/types/messages';

/** Poll cadence while the chat is open and the tab is visible. */
const POLL_INTERVAL_MS = 4000;

/** A locally-created message awaiting server reconciliation. Carries a temporary
 *  negative id and a `pending` flag so the UI can show a sending/failed state. */
export interface OptimisticMessage extends Message {
    /** Stable client key for optimistic rows (server rows reconcile by `id`). */
    clientId: string;
    pending?: boolean;
    failed?: boolean;
    /** Image rows only: true while the GCS upload is in flight. */
    uploading?: boolean;
    /** Image rows only: blob: URL for instant local preview before the signed
     *  URL exists. Revoked once the server row replaces this one. */
    localPreviewUrl?: string;
    /** Image rows only: the original File, kept so a failed upload can be retried. */
    pendingFile?: File;
    /** Image rows only: set once the upload commits — lets a failed *send* retry
     *  reuse the committed key instead of re-uploading the bytes. */
    pendingImageKey?: string;
}

export type SendResult =
    | { ok: true }
    | { ok: false; code: 'BLOCKED' | 'NOT_CONNECTED' | 'INVALID' | 'ERROR'; message: string };

function normalizeMessage(raw: unknown): Message | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const id = (r.id ?? r.message_id) as number | undefined;
    if (typeof id !== 'number') return null;
    return {
        id,
        threadId: (r.threadId ?? r.thread_id ?? 0) as number,
        senderEmail: (r.senderEmail ?? r.sender_email ?? '') as string,
        isMine: !!(r.isMine ?? r.is_mine),
        body: (r.body ?? '') as string,
        createdAt: (r.createdAt ?? r.created_at ?? '') as string,
        imageUrl: (r.imageUrl ?? r.image_url ?? null) as string | null,
        imageWidth: (r.imageWidth ?? r.image_width ?? null) as number | null,
        imageHeight: (r.imageHeight ?? r.image_height ?? null) as number | null,
        isDeleted: !!(r.isDeleted ?? r.is_deleted),
        editedAt: (r.editedAt ?? r.edited_at ?? null) as string | null,
    };
}

function extractMessages(body: unknown): Message[] {
    let raw: unknown[] = [];
    if (Array.isArray(body)) raw = body;
    else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.messages)) raw = b.messages;
        else if (Array.isArray(b.data)) raw = b.data;
    }
    return raw.map(normalizeMessage).filter((m): m is Message => m !== null);
}

let optimisticCounter = 0;

export interface UseThreadMessagesResult {
    messages: OptimisticMessage[];
    isLoading: boolean;
    error: string | null;
    hasLoadedOnce: boolean;
    /** True once the connection is gone (409) — composer should stay disabled. */
    notConnected: boolean;
    /** True once a block is detected (403) — composer should be hidden/disabled. */
    blocked: boolean;
    /** Send a text message, an image, or both. `image` runs the GCS upload first. */
    send: (body: string, image?: File) => Promise<SendResult>;
    /** Retry a previously-failed optimistic message (text or image). */
    retry: (clientId: string) => Promise<SendResult>;
    refetch: () => Promise<void>;
}

/**
 * Loads and polls a single thread's messages, with optimistic send + mark-read.
 * Polling pauses when the tab is hidden and resumes (with an immediate fetch) on
 * return. The `after` cursor is the largest server id rendered so far.
 *
 * Image sends run the 3-step GCS upload (see lib/dmImageUpload) before posting the
 * message with the committed `imageKey`; an instant local blob preview is shown
 * meanwhile and replaced by the signed URL once the server row arrives.
 */
export function useThreadMessages(threadId: number | null): UseThreadMessagesResult {
    const [messages, setMessages] = useState<OptimisticMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [notConnected, setNotConnected] = useState(false);
    const [blocked, setBlocked] = useState(false);

    // Largest real (server) message id we've rendered — the polling cursor.
    const cursorRef = useRef<number>(0);
    const pollingRef = useRef(false);
    // Tracks the latest message we've told the server we read, to avoid spamming.
    const lastReadSentRef = useRef<number>(0);
    // Blob preview URLs by clientId, so we can revoke them exactly once (on
    // reconcile, thread switch, or unmount) without leaking object URLs.
    const blobUrlsRef = useRef<Map<string, string>>(new Map());

    const revokeBlob = useCallback((clientId: string) => {
        const url = blobUrlsRef.current.get(clientId);
        if (url) {
            URL.revokeObjectURL(url);
            blobUrlsRef.current.delete(clientId);
        }
    }, []);

    /** Merge freshly-fetched server rows in, dedupe, advance the cursor, and
     *  drop any optimistic row the server now echoes back (matched by body). */
    const mergeServer = useCallback((incoming: Message[]) => {
        if (incoming.length === 0) return;
        setMessages(prev => {
            const seen = new Set(prev.filter(m => m.id > 0).map(m => m.id));
            const fresh = incoming.filter(m => !seen.has(m.id));
            if (fresh.length === 0) return prev;

            // Reconcile: remove a pending optimistic row if the server now carries
            // an equivalent mine message (same trimmed body), so we don't double up.
            // Only fires for non-empty bodies — image-only rows (empty body) are
            // reconciled by clientId in postMessage instead, so two distinct photos
            // never collapse into one.
            let next = prev;
            for (const srv of fresh) {
                if (srv.isMine && srv.body) {
                    const idx = next.findIndex(
                        m => m.pending && m.isMine && !m.imageUrl && m.body === srv.body
                    );
                    if (idx !== -1) {
                        const dropped = next[idx];
                        revokeBlob(dropped.clientId);
                        next = next.filter((_, i) => i !== idx);
                    }
                }
            }
            const merged = [...next, ...fresh.map(m => ({ ...m, clientId: `s-${m.id}` }))];
            // Keep ordering oldest → newest by real id, optimistic rows last.
            merged.sort((a, b) => {
                if (a.id > 0 && b.id > 0) return a.id - b.id;
                if (a.id > 0) return -1;
                if (b.id > 0) return 1;
                return 0;
            });
            return merged;
        });
        const maxId = incoming.reduce((m, x) => Math.max(m, x.id), cursorRef.current);
        cursorRef.current = maxId;
    }, [revokeBlob]);

    /** POST read up to the latest server id (best-effort, forward-only). */
    const markRead = useCallback(async (id: number) => {
        if (threadId == null || id <= 0 || id <= lastReadSentRef.current) return;
        lastReadSentRef.current = id;
        try {
            await clientFetch(`/api/messages/threads/${threadId}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lastReadMessageId: id }),
            });
        } catch {
            // Best-effort; a later view/poll reconciles.
        }
    }, [threadId]);

    const fetchPage = useCallback(async (isInitial: boolean) => {
        if (threadId == null || pollingRef.current) return;
        pollingRef.current = true;
        if (isInitial) setIsLoading(true);
        try {
            const qs = cursorRef.current > 0 ? `?after=${cursorRef.current}` : '';
            const res = await clientFetch(`/api/messages/threads/${threadId}/messages${qs}`);
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (isInitial) {
                    setError(body.error || body.detail || 'Failed to load messages');
                }
                return;
            }
            const page = extractMessages(body);
            mergeServer(page);
            if (isInitial) setError(null);
            // Mark read up to the newest id we now hold.
            if (page.length > 0) {
                const maxId = page.reduce((m, x) => Math.max(m, x.id), 0);
                void markRead(maxId);
            }
        } catch {
            if (isInitial) setError('Failed to load messages');
        } finally {
            if (isInitial) {
                setIsLoading(false);
                setHasLoadedOnce(true);
            }
            pollingRef.current = false;
        }
    }, [threadId, mergeServer, markRead]);

    const refetch = useCallback(() => fetchPage(false), [fetchPage]);

    // Initial load + reset when the thread changes. Revoke any pending previews
    // from the thread we're leaving.
    useEffect(() => {
        cursorRef.current = 0;
        lastReadSentRef.current = 0;
        for (const url of blobUrlsRef.current.values()) URL.revokeObjectURL(url);
        blobUrlsRef.current.clear();
        setMessages([]);
        setError(null);
        setHasLoadedOnce(false);
        setNotConnected(false);
        setBlocked(false);
        if (threadId == null) return;
        void fetchPage(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [threadId]);

    // Revoke any remaining blob previews on unmount.
    useEffect(() => {
        const urls = blobUrlsRef.current;
        return () => {
            for (const url of urls.values()) URL.revokeObjectURL(url);
            urls.clear();
        };
    }, []);

    // Visibility-aware polling.
    useEffect(() => {
        if (threadId == null) return;
        let interval: ReturnType<typeof setInterval> | null = null;
        const start = () => {
            if (interval == null) interval = setInterval(() => fetchPage(false), POLL_INTERVAL_MS);
        };
        const stop = () => {
            if (interval != null) { clearInterval(interval); interval = null; }
        };
        const onVisibility = () => {
            if (document.visibilityState === 'visible') { void fetchPage(false); start(); }
            else stop();
        };
        if (document.visibilityState === 'visible') start();
        document.addEventListener('visibilitychange', onVisibility);
        return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
    }, [threadId, fetchPage]);

    const postMessage = useCallback(async (
        clientId: string,
        trimmed: string,
        imageKey?: string,
    ): Promise<SendResult> => {
        if (threadId == null) return { ok: false, code: 'ERROR', message: 'No conversation open.' };
        try {
            const payload: { body?: string; imageKey?: string } = {};
            if (trimmed) payload.body = trimmed;
            if (imageKey) payload.imageKey = imageKey;

            const res = await clientFetch(`/api/messages/threads/${threadId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => ({}));

            if (res.ok) {
                const created = normalizeMessage(body);
                revokeBlob(clientId);
                setMessages(prev => {
                    const without = prev.filter(m => m.clientId !== clientId);
                    if (!created) return without;
                    if (without.some(m => m.id === created.id)) return without;
                    return [...without, { ...created, clientId: `s-${created.id}` }];
                });
                if (created && created.id > cursorRef.current) cursorRef.current = created.id;
                if (created) void markRead(created.id);
                return { ok: true };
            }

            // Flag the optimistic row as failed and classify the error. Keep the
            // blob preview + pendingFile/pendingImageKey so retry can resend.
            setMessages(prev => prev.map(m =>
                m.clientId === clientId ? { ...m, pending: false, uploading: false, failed: true } : m
            ));
            const code = (body?.error?.code ?? body?.code) as string | undefined;
            if (res.status === 403 || code === 'MESSAGE_BLOCKED') {
                setBlocked(true);
                return { ok: false, code: 'BLOCKED', message: 'Messaging is unavailable for this conversation.' };
            }
            if (res.status === 409 || code === 'NOT_CONNECTED') {
                setNotConnected(true);
                return { ok: false, code: 'NOT_CONNECTED', message: "You're no longer connected." };
            }
            if (res.status === 422) {
                return { ok: false, code: 'INVALID', message: 'Message must be 1–4000 characters.' };
            }
            return { ok: false, code: 'ERROR', message: body.error || body.detail || 'Failed to send message.' };
        } catch {
            setMessages(prev => prev.map(m =>
                m.clientId === clientId ? { ...m, pending: false, uploading: false, failed: true } : m
            ));
            return { ok: false, code: 'ERROR', message: 'Failed to send message.' };
        }
    }, [threadId, markRead, revokeBlob]);

    /** Run the GCS upload for an optimistic image row, then post the message. */
    const uploadAndPost = useCallback(async (
        clientId: string,
        trimmed: string,
        image: File,
    ): Promise<SendResult> => {
        if (threadId == null) {
            setMessages(prev => prev.map(m =>
                m.clientId === clientId ? { ...m, pending: false, uploading: false, failed: true } : m
            ));
            return { ok: false, code: 'ERROR', message: 'No conversation open.' };
        }
        try {
            const committed = await uploadDmImage(image, threadId);
            // Upgrade the preview to the real signed URL and remember the committed
            // key so a failed *send* can retry without re-uploading the bytes.
            setMessages(prev => prev.map(m =>
                m.clientId === clientId
                    ? {
                        ...m,
                        uploading: false,
                        pendingImageKey: committed.objectKey,
                        imageUrl: committed.imageUrl,
                        imageWidth: committed.width,
                        imageHeight: committed.height,
                    }
                    : m
            ));
            return postMessage(clientId, trimmed, committed.objectKey);
        } catch (err) {
            setMessages(prev => prev.map(m =>
                m.clientId === clientId ? { ...m, pending: false, uploading: false, failed: true } : m
            ));
            const message = err instanceof DmUploadError ? err.message : 'Failed to send image.';
            return { ok: false, code: 'ERROR', message };
        }
    }, [threadId, postMessage]);

    const send = useCallback(async (raw: string, image?: File): Promise<SendResult> => {
        const trimmed = raw.trim();

        if (image) {
            const valid = validateDmImage(image);
            if (!valid.ok) return { ok: false, code: 'INVALID', message: valid.message };
            if (trimmed.length > MESSAGE_MAX_LENGTH) {
                return { ok: false, code: 'INVALID', message: `Caption must be ${MESSAGE_MAX_LENGTH} characters or fewer.` };
            }
            const clientId = `o-${++optimisticCounter}`;
            const previewUrl = URL.createObjectURL(image);
            blobUrlsRef.current.set(clientId, previewUrl);
            const optimistic: OptimisticMessage = {
                id: -optimisticCounter,
                threadId: threadId ?? 0,
                senderEmail: '',
                isMine: true,
                body: trimmed,
                createdAt: new Date().toISOString(),
                clientId,
                pending: true,
                uploading: true,
                localPreviewUrl: previewUrl,
                pendingFile: image,
            };
            setMessages(prev => [...prev, optimistic]);
            return uploadAndPost(clientId, trimmed, image);
        }

        if (trimmed.length === 0) {
            return { ok: false, code: 'INVALID', message: 'Message is empty.' };
        }
        if (trimmed.length > MESSAGE_MAX_LENGTH) {
            return { ok: false, code: 'INVALID', message: `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.` };
        }
        const clientId = `o-${++optimisticCounter}`;
        const optimistic: OptimisticMessage = {
            id: -optimisticCounter,
            threadId: threadId ?? 0,
            senderEmail: '',
            isMine: true,
            body: trimmed,
            createdAt: new Date().toISOString(),
            clientId,
            pending: true,
        };
        setMessages(prev => [...prev, optimistic]);
        return postMessage(clientId, trimmed);
    }, [threadId, postMessage, uploadAndPost]);

    const retry = useCallback(async (clientId: string): Promise<SendResult> => {
        let body = '';
        let file: File | undefined;
        let imageKey: string | undefined;
        setMessages(prev => prev.map(m => {
            if (m.clientId === clientId) {
                body = m.body;
                file = m.pendingFile;
                imageKey = m.pendingImageKey;
                return { ...m, pending: true, failed: false, uploading: !!file && !imageKey };
            }
            return m;
        }));
        // Image already committed but the send failed → reuse the key, no re-upload.
        if (imageKey) return postMessage(clientId, body, imageKey);
        // Image upload failed earlier → run the whole pipeline again.
        if (file) return uploadAndPost(clientId, body, file);
        if (!body) return { ok: false, code: 'ERROR', message: 'Nothing to retry.' };
        return postMessage(clientId, body);
    }, [postMessage, uploadAndPost]);

    return {
        messages, isLoading, error, hasLoadedOnce,
        notConnected, blocked, send, retry, refetch,
    };
}
