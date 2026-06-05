'use client';

import React, { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';
import { useTranslation } from '@/hooks';
import { useNotificationFeed } from '@/hooks/useNotifications';
import { useNotificationContext } from '@/context/NotificationContext';
import NotificationItem from '@/components/notifications/NotificationItem';
import { deepLinkFor, type AppNotification } from '@/types/notifications';

/** Bell badge + dropdown feed panel. Reads the badge from NotificationContext;
 *  loads the feed lazily (only while the panel is open). */
const NotificationBell: React.FC<{ buttonClassName?: string }> = ({ buttonClassName = '' }) => {
    const { t } = useTranslation();
    const router = useRouter();
    const { unreadCount, decrementUnread, clearUnread, refreshUnread } = useNotificationContext();

    const [open, setOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    useClickOutside(wrapperRef as React.RefObject<HTMLElement>, () => setOpen(false));

    const {
        notifications, isLoading, isLoadingMore, error, hasMore, hasLoadedOnce,
        loadMore, markRead, markAllRead,
    } = useNotificationFeed({ enabled: open });

    const badge = unreadCount > 9 ? t('notifications.badgeOverflow') : String(unreadCount);

    const toggle = () => {
        setOpen(prev => {
            const next = !prev;
            // Reconcile the badge with the server whenever the panel opens.
            if (next) refreshUnread();
            return next;
        });
    };

    const handleActivate = useCallback((n: AppNotification) => {
        setOpen(false);
        if (!n.read) decrementUnread(1);
        // Fire-and-forget; markRead updates the list + server optimistically.
        void markRead(n.id);
        const link = deepLinkFor(n);
        if (link) router.push(link);
    }, [decrementUnread, markRead, router]);

    const handleMarkAll = useCallback(async () => {
        clearUnread();
        await markAllRead();
    }, [clearUnread, markAllRead]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 80 && hasMore && !isLoadingMore) {
            loadMore();
        }
    }, [hasMore, isLoadingMore, loadMore]);

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                onClick={toggle}
                aria-label={t('notifications.bellLabel')}
                aria-haspopup="true"
                aria-expanded={open}
                className={`relative flex items-center justify-center text-primary/70 hover:text-secondary transition-colors ${buttonClassName}`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] px-1 rounded-full bg-secondary text-on-primary text-[9px] font-bold leading-none flex items-center justify-center tabular-nums shadow-sm">
                        {badge}
                    </span>
                )}
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label={t('notifications.title')}
                    className="absolute top-[calc(100%+10px)] right-0 w-[min(360px,calc(100vw-2rem))] bg-surface border border-outline-variant/30 rounded-2xl shadow-xl z-[150] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-primary/5">
                        <p className="text-sm font-bold text-primary">{t('notifications.title')}</p>
                        <button
                            type="button"
                            onClick={handleMarkAll}
                            disabled={unreadCount === 0}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-secondary/80 hover:text-secondary disabled:opacity-40 disabled:cursor-default transition-colors"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            {t('notifications.markAllRead')}
                        </button>
                    </div>

                    {/* List */}
                    <div className="max-h-[60vh] overflow-y-auto p-1.5" onScroll={handleScroll}>
                        {isLoading && !hasLoadedOnce ? (
                            <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-on-surface-variant/60">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('notifications.loading')}
                            </div>
                        ) : error && notifications.length === 0 ? (
                            <p className="px-3 py-10 text-center text-[13px] text-red-400">{error}</p>
                        ) : notifications.length === 0 ? (
                            <div className="px-3 py-12 text-center">
                                <Bell className="w-7 h-7 mx-auto text-on-surface-variant/25 mb-2" />
                                <p className="text-[13px] text-on-surface-variant/50">{t('notifications.empty')}</p>
                            </div>
                        ) : (
                            <>
                                {notifications.map((n) => (
                                    <NotificationItem key={n.id} notification={n} onActivate={handleActivate} />
                                ))}
                                {isLoadingMore && (
                                    <div className="flex items-center justify-center py-3">
                                        <Loader2 className="w-4 h-4 animate-spin text-on-surface-variant/40" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-primary/5 p-1.5">
                        <Link
                            href="/notifications"
                            onClick={() => setOpen(false)}
                            className="block w-full text-center px-4 py-2.5 text-[12px] font-bold text-secondary/80 hover:text-secondary hover:bg-secondary/10 rounded-xl transition-colors"
                        >
                            {t('notifications.seeAll')}
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
