'use client';

import React from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { useMessagesContext } from '@/context/MessagesContext';
import { useTranslation } from '@/hooks';

/** Navbar icon linking to the messages inbox, with a global unread badge.
 *  Mirrors NotificationBell's badge styling but navigates rather than opening
 *  a dropdown (the inbox is a full page). */
const MessagesBell: React.FC<{ buttonClassName?: string }> = ({ buttonClassName = '' }) => {
    const { t } = useTranslation();
    const { unreadTotal } = useMessagesContext();
    const badge = unreadTotal > 9 ? '9+' : String(unreadTotal);

    return (
        <Link
            href="/messages"
            aria-label={
                unreadTotal > 0
                    ? `${t('nav.messages') || 'Messages'} (${unreadTotal} unread)`
                    : (t('nav.messages') || 'Messages')
            }
            className={`relative w-9 h-9 rounded-full flex items-center justify-center text-primary/70 hover:text-secondary hover:bg-secondary/10 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-secondary/50 ${buttonClassName}`}
        >
            <MessageCircle className="w-5 h-5" />
            {unreadTotal > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center border border-surface">
                    {badge}
                </span>
            )}
        </Link>
    );
};

export default MessagesBell;
