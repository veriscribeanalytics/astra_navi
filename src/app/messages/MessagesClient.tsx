'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, ChevronRight, Loader2, RotateCcw } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useThreads } from '@/hooks/useThreads';
import { useMessagesContext } from '@/context/MessagesContext';
import { formatChatTimestamp } from '@/lib/datetime';
import type { MessageThread } from '@/types/messages';

/** Inbox: lists every conversation, newest activity first. */
export default function MessagesClient() {
    const router = useRouter();
    const { threads, isLoading, error, hasLoadedOnce, refetch } = useThreads();
    const { refreshUnread } = useMessagesContext();

    const openThread = (t: MessageThread) => {
        router.push(`/messages/${t.threadId}`);
    };

    return (
        <div className="mx-auto w-full max-w-2xl 3xl:max-w-[2400px] px-4 sm:px-6 py-6 sm:py-8">
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-headline font-bold text-primary">Messages</h1>
                        <p className="text-[12px] text-on-surface-variant/70">Your private conversations</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { void refetch(); void refreshUnread(); }}
                    aria-label="Refresh conversations"
                    leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                    Refresh
                </Button>
            </header>

            {isLoading && !hasLoadedOnce && (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-6 h-6 text-secondary animate-spin" />
                    <p className="text-sm text-on-surface-variant/60">Loading conversations...</p>
                </div>
            )}

            {error && hasLoadedOnce && (
                <Card variant="default" padding="lg" hoverable={false}>
                    <div className="text-center">
                        <p className="text-sm text-red-400 mb-4">{error}</p>
                        <Button variant="secondary" size="sm" onClick={() => void refetch()}>Try again</Button>
                    </div>
                </Card>
            )}

            {hasLoadedOnce && !error && threads.length === 0 && (
                <EmptyState
                    icon={<MessageCircle className="w-7 h-7" />}
                    title="No conversations yet"
                    description="Open a connection's profile in My Family and tap Message to start a private chat."
                    actionLabel="Go to My Family"
                    onAction={() => router.push('/family')}
                />
            )}

            {threads.length > 0 && (
                <ul className="space-y-2">
                    {threads.map(t => (
                        <li key={t.threadId}>
                            <ThreadRow thread={t} onOpen={() => openThread(t)} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function ThreadRow({ thread, onOpen }: { thread: MessageThread; onOpen: () => void }) {
    const hasUnread = thread.unreadCount > 0;
    const preview = thread.lastMessagePreview;
    const previewText = preview
        ? `${thread.lastMessageFromMe ? 'You: ' : ''}${preview}`
        : 'No messages yet';

    return (
        <button
            type="button"
            onClick={onOpen}
            className="w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 rounded-[28px]"
        >
            <Card variant="default" padding="md" hoverable>
                <div className="flex items-center gap-3">
                    <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-sm font-bold">
                            {thread.otherName.charAt(0).toUpperCase() || '?'}
                        </div>
                        {hasUnread && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-white text-[10px] font-bold flex items-center justify-center">
                                {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h3 className={`text-[15px] font-headline truncate ${hasUnread ? 'font-bold text-primary' : 'font-semibold text-primary/90'}`}>
                                {thread.otherName}
                            </h3>
                            {thread.lastMessageAt && (
                                <span className="text-[11px] text-on-surface-variant/50 shrink-0">
                                    {formatChatTimestamp(thread.lastMessageAt)}
                                </span>
                            )}
                        </div>
                        <p className={`text-[13px] truncate mt-0.5 ${hasUnread ? 'text-on-surface-variant/90' : 'text-on-surface-variant/60'}`}>
                            {previewText}
                        </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant/30 group-hover:text-secondary transition-colors shrink-0" />
                </div>
            </Card>
        </button>
    );
}
