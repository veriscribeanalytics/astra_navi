'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { clientFetch } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';

/** How often to poll the unread badge while logged in and the tab is visible. */
const POLL_INTERVAL_MS = 45_000;

interface NotificationContextType {
    unreadCount: number;
    /** Re-fetch the unread count from the server. */
    refreshUnread: () => Promise<void>;
    /** Optimistically lower the badge (e.g. after marking one read). */
    decrementUnread: (by?: number) => void;
    /** Optimistically zero the badge (e.g. after "mark all read"). */
    clearUnread: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function parseUnread(body: unknown): number {
    if (!body || typeof body !== 'object') return 0;
    const v = (body as Record<string, unknown>).unread;
    return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, v) : 0;
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isLoggedIn } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);
    // Prevents overlapping polls and lets the interval read fresh auth state.
    const inFlightRef = useRef(false);
    const isLoggedInRef = useRef(isLoggedIn);
    // Keep the ref in sync inside an effect (not during render) so the stable
    // refreshUnread callback can read the latest login state.
    useEffect(() => {
        isLoggedInRef.current = isLoggedIn;
    }, [isLoggedIn]);

    const refreshUnread = useCallback(async () => {
        if (!isLoggedInRef.current || inFlightRef.current) return;
        inFlightRef.current = true;
        try {
            const res = await clientFetch('/api/notifications/unread-count');
            if (!res.ok) return;
            const body = await res.json().catch(() => ({}));
            setUnreadCount(parseUnread(body));
        } catch {
            // Transient — next poll will retry. Leave the last known count.
        } finally {
            inFlightRef.current = false;
        }
    }, []);

    const decrementUnread = useCallback((by: number = 1) => {
        setUnreadCount(c => Math.max(0, c - by));
    }, []);

    const clearUnread = useCallback(() => setUnreadCount(0), []);

    // Poll while logged in; pause when logged out or the tab is hidden.
    useEffect(() => {
        if (!isLoggedIn) {
            setUnreadCount(0);
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
            if (document.visibilityState === 'visible') {
                refreshUnread();
                start();
            } else {
                stop();
            }
        };

        if (document.visibilityState === 'visible') start();
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            stop();
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [isLoggedIn, refreshUnread]);

    return (
        <NotificationContext.Provider value={{ unreadCount, refreshUnread, decrementUnread, clearUnread }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationContext = (): NotificationContextType => {
    const ctx = useContext(NotificationContext);
    if (ctx === undefined) {
        throw new Error('useNotificationContext must be used within a NotificationProvider');
    }
    return ctx;
};
