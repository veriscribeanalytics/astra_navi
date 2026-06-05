'use client';

import React from 'react';
import { UserPlus, Heart, UserX, Bell } from 'lucide-react';
import { useRelativeTime } from '@/hooks/useRealTime';
import type { AppNotification } from '@/types/notifications';

function iconFor(type: string): React.ReactNode {
    switch (type) {
        case 'family_invite_received':
            return <UserPlus className="w-4 h-4" />;
        case 'family_invite_accepted':
            return <Heart className="w-4 h-4" />;
        case 'family_invite_declined':
            return <UserX className="w-4 h-4" />;
        default:
            return <Bell className="w-4 h-4" />;
    }
}

interface NotificationItemProps {
    notification: AppNotification;
    onActivate: (n: AppNotification) => void;
}

/** A single feed row. Shared by the navbar panel and the /notifications page.
 *  Renders the server-localized title/body directly. */
const NotificationItem: React.FC<NotificationItemProps> = ({ notification: n, onActivate }) => {
    const relative = useRelativeTime(n.createdAt);

    return (
        <button
            type="button"
            onClick={() => onActivate(n)}
            className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-xl transition-colors ${
                n.read ? 'hover:bg-surface-variant/30' : 'bg-secondary/5 hover:bg-secondary/10'
            }`}
        >
            <div className={`mt-0.5 p-2 rounded-xl shrink-0 ${
                n.read ? 'bg-on-surface-variant/10 text-on-surface-variant/50' : 'bg-secondary/15 text-secondary'
            }`}>
                {iconFor(n.type)}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className={`text-[13px] truncate ${n.read ? 'font-medium text-primary/80' : 'font-bold text-primary'}`}>
                        {n.title}
                    </p>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-secondary shrink-0" aria-hidden="true" />}
                </div>
                {n.body && (
                    <p className="text-[12px] text-on-surface-variant/65 mt-0.5 line-clamp-2">{n.body}</p>
                )}
                {n.createdAt && (
                    <p className="text-[10px] uppercase tracking-wider text-on-surface-variant/40 mt-1">{relative}</p>
                )}
            </div>
        </button>
    );
};

export default NotificationItem;
