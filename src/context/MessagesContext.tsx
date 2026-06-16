'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { clientFetch } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

/** How often to refresh the global messages badge while logged in and visible. */
const POLL_INTERVAL_MS = 30_000;

interface MessagesContextType {
    /** Sum of unread counts across all threads (global inbox badge). */
    unreadTotal: number;
    /** Re-fetch the unread total from the thread list. */
    refreshUnread: () => Promise<void>;
    /** Optimistically lower the badge (e.g. after reading a thread). */
    decrementUnread: (by: number) => void;
    /** Optimistically clear a single thread's contribution to the badge. */
    setThreadRead: (previousThreadUnread: number) => void;
}

const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

function parseUnreadTotal(body: unknown): number {
    let raw: unknown[] = [];
    if (Array.isArray(body)) raw = body;
    else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (Array.isArray(b.threads)) raw = b.threads;
        else if (Array.isArray(b.data)) raw = b.data;
    }
    return raw.reduce<number>((sum, t) => {
        if (!t || typeof t !== 'object') return sum;
        const r = t as Record<string, unknown>;
        const u = (r.unreadCount ?? r.unread_count) as number | undefined;
        return sum + (typeof u === 'number' && Number.isFinite(u) ? Math.max(0, u) : 0);
    }, 0);
}

export const MessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isLoggedIn } = useAuth();
    const [unreadTotal, setUnreadTotal] = useState(0);
    const inFlightRef = useRef(false);
    const isLoggedInRef = useRef(isLoggedIn);
    isLoggedInRef.current = isLoggedIn;

    const refreshUnread = useCallback(async () => {
        if (!isLoggedInRef.current || inFlightRef.current) return;
        inFlightRef.current = true;
        try {
            const res = await clientFetch('/api/messages/threads');
            if (!res.ok) return;
            const body = await res.json().catch(() => ({}));
            setUnreadTotal(parseUnreadTotal(body));
        } catch {
            // Transient — next poll retries. Keep the last known count.
        } finally {
            inFlightRef.current = false;
        }
    }, []);

    const decrementUnread = useCallback((by: number) => {
        setUnreadTotal(c => Math.max(0, c - by));
    }, []);

    const setThreadRead = useCallback((previousThreadUnread: number) => {
        if (previousThreadUnread > 0) setUnreadTotal(c => Math.max(0, c - previousThreadUnread));
    }, []);

    // Poll while logged in; pause when logged out or the tab is hidden.
    useEffect(() => {
        if (!isLoggedIn) {
            setUnreadTotal(0);
            return;
        }

        refreshUnread();

        let interval: ReturnType<typeof setInterval> | null = null;
        const start = () => {
            if (interval == null) interval = setInterval(refreshUnread, POLL_INTERVAL_MS);
        };
        const stop = () => {
            if (interval != null) { clearInterval(interval); interval = null; }
        };
        const onVisibility = () => {
            if (document.visibilityState === 'visible') { refreshUnread(); start(); }
            else stop();
        };

        if (document.visibilityState === 'visible') start();
        document.addEventListener('visibilitychange', onVisibility);
        return () => { stop(); document.removeEventListener('visibilitychange', onVisibility); };
    }, [isLoggedIn, refreshUnread]);

    return (
        <MessagesContext.Provider value={{ unreadTotal, refreshUnread, decrementUnread, setThreadRead }}>
            {children}
        </MessagesContext.Provider>
    );
};

export const useMessagesContext = (): MessagesContextType => {
    const ctx = useContext(MessagesContext);
    if (ctx === undefined) {
        throw new Error('useMessagesContext must be used within a MessagesProvider');
    }
    return ctx;
};
