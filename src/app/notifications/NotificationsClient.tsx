'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Loader2, CheckCheck } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useNotificationFeed } from '@/hooks/useNotifications';
import { useNotificationContext } from '@/context/NotificationContext';
import NotificationItem from '@/components/notifications/NotificationItem';
import { deepLinkFor, type AppNotification } from '@/types/notifications';

const NotificationsClient: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { decrementUnread, clearUnread } = useNotificationContext();

    const [unreadOnly, setUnreadOnly] = useState(false);

    const {
        notifications, isLoading, isLoadingMore, error, hasMore, hasLoadedOnce,
        loadMore, markRead, markAllRead,
    } = useNotificationFeed({ unreadOnly });

    const handleActivate = useCallback((n: AppNotification) => {
        if (!n.read) decrementUnread(1);
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
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 120 && hasMore && !isLoadingMore) {
            loadMore();
        }
    }, [hasMore, isLoadingMore, loadMore]);

    const hasAnyUnread = notifications.some(n => !n.read);

    return (
        <div className="min-h-screen pt-[calc(var(--navbar-height,64px)+1.5rem)] pb-12">
            <div className="max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                {/* Header */}
                <header className="flex items-end justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary">
                                {t('notifications.title')}
                            </h1>
                            <p className="text-sm text-on-surface-variant/60">{t('notifications.pageSubtitle')}</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleMarkAll}
                        disabled={!hasAnyUnread}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-secondary/80 hover:text-secondary hover:bg-secondary/10 disabled:opacity-40 disabled:cursor-default transition-colors shrink-0"
                    >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('notifications.markAllRead')}</span>
                    </button>
                </header>

                {/* Filter tabs */}
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-surface-variant/30 border border-outline-variant/15">
                    {([false, true] as const).map((val) => (
                        <button
                            key={String(val)}
                            type="button"
                            onClick={() => setUnreadOnly(val)}
                            className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${
                                unreadOnly === val ? 'bg-secondary/15 text-secondary' : 'text-on-surface-variant/50 hover:text-on-surface-variant/80'
                            }`}
                        >
                            {t(val ? 'notifications.filterUnread' : 'notifications.filterAll')}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="max-h-[70vh] overflow-y-auto -mx-1.5 px-1.5" onScroll={handleScroll}>
                    {isLoading && !hasLoadedOnce ? (
                        <div className="space-y-2">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="h-[68px] rounded-xl bg-surface border border-outline-variant/15 animate-pulse" />
                            ))}
                        </div>
                    ) : error && notifications.length === 0 ? (
                        <p className="px-3 py-16 text-center text-[13px] text-red-400">{t('notifications.loadError')}</p>
                    ) : notifications.length === 0 ? (
                        <div className="px-3 py-20 text-center">
                            <Bell className="w-9 h-9 mx-auto text-on-surface-variant/25 mb-3" />
                            <p className="text-[14px] text-on-surface-variant/50">
                                {t(unreadOnly ? 'notifications.emptyUnread' : 'notifications.empty')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {notifications.map((n) => (
                                <NotificationItem key={n.id} notification={n} onActivate={handleActivate} />
                            ))}
                            {isLoadingMore && (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-on-surface-variant/40" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificationsClient;
