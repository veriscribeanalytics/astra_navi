'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, ChevronRight, Loader2, RotateCcw, Image as ImageIcon, Mic, Mail } from 'lucide-react';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { useThreads } from '@/hooks/useThreads';
import { useMessagesContext } from '@/context/MessagesContext';
import { formatChatTimestamp } from '@/lib/datetime';
import type { MessageThread } from '@/types/messages';

// Colors resolve to CSS variables (defined in globals.css under
// .messages-page-shell) so dark mode keeps its exact midnight literals while
// light mode swaps to theme tokens. Gold accents read on both themes.
const SENDER_NAME = 'var(--msg-sender)';
const PREVIEW_TEXT = 'var(--msg-preview)';
const TIME_STAMP = 'var(--msg-time)';
const SUBTITLE = 'var(--msg-subtitle)';
const CARD_BG = 'var(--msg-card-bg)';
const CARD_BORDER = 'var(--msg-card-border)';
const HOVER_BORDER = 'rgba(201,151,46,0.28)';
const HOVER_BG = 'var(--msg-hover-bg)';
const UNREAD_PREVIEW = 'var(--msg-unread-preview)';
const BADGE_BG = 'var(--msg-badge-bg)';
const GOLD = '#C9972E';
const GOLD_MUTED = 'rgba(201,151,46,0.55)';

/** Last-message type inferred from the thread payload. */
function inferLastMessageType(thread: MessageThread): 'text' | 'photo' | 'voice' | 'none' {
    if (!thread.lastMessagePreview) return 'none';
    const p = thread.lastMessagePreview.toLowerCase();
    // Backend currently only stores a text preview; image only shows as empty preview.
    if (!p.trim()) return 'photo';
    // Voice preview if backend ever prefixes transcripts / metadata with this marker.
    if (p.startsWith('[voice]') || p.startsWith('🎙') || p.startsWith('voice note')) return 'voice';
    return 'text';
}

function PreviewIcon({ type }: { type: 'text' | 'photo' | 'voice' | 'none' }) {
    if (type === 'photo') return <ImageIcon className="w-3 h-3 shrink-0" />;
    if (type === 'voice') return <Mic className="w-3 h-3 shrink-0" />;
    return null;
}

/** Inbox: lists every conversation, newest activity first. */
export default function MessagesClient() {
    const router = useRouter();
    const { threads, isLoading, error, hasLoadedOnce, refetch } = useThreads();
    const { refreshUnread } = useMessagesContext();

    const openThread = (t: MessageThread) => {
        router.push(`/messages/${t.threadId}`);
    };

    return (
        <div className="mx-auto w-full max-w-2xl 3xl:max-w-[2400px] px-4 sm:px-6 py-6 sm:py-8 flex flex-col min-h-[55vh] lg:min-h-[65vh]">
            <header className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border"
                        style={{ backgroundColor: 'rgba(201,151,46,0.10)', borderColor: 'rgba(201,151,46,0.20)' }}
                    >
                        <MessageCircle className="w-5 h-5" style={{ color: GOLD }} />
                    </div>
                    <div>
                        <h1 className="text-xl font-headline font-bold" style={{ color: SENDER_NAME }}>Messages</h1>
                        <p className="text-[12px] font-medium" style={{ color: SUBTITLE }}>Your private conversations</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => { void refetch(); void refreshUnread(); }}
                    aria-label="Refresh conversations"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-transparent text-[var(--msg-time)] hover:text-[#C9972E] hover:bg-[rgba(201,151,46,0.08)] hover:border-[rgba(201,151,46,0.18)] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9972E]/40"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </header>

            {isLoading && !hasLoadedOnce && (
                <div className="flex flex-col items-center justify-center flex-1 min-h-[240px] gap-3">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: GOLD }} />
                    <p className="text-sm" style={{ color: TIME_STAMP }}>Loading conversations...</p>
                </div>
            )}

            {error && hasLoadedOnce && (
                <div className="rounded-[22px] p-6 border text-center" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER }}>
                    <p className="text-sm text-red-400 mb-4">{error}</p>
                    <Button variant="secondary" size="sm" onClick={() => void refetch()}>Try again</Button>
                </div>
            )}

            {hasLoadedOnce && !error && threads.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState
                        icon={<Mail className="w-7 h-7" />}
                        title="No conversations yet"
                        description="Open a connection's profile in My Family and tap Message to start a private chat."
                        actionLabel="Go to My Family"
                        onAction={() => router.push('/family')}
                    />
                </div>
            )}

            {threads.length > 0 && (
                <ul className="space-y-2.5">
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
    const messageType = inferLastMessageType(thread);
    const preview = thread.lastMessagePreview;
    const previewText = preview
        ? `${thread.lastMessageFromMe ? 'You: ' : ''}${preview}`
        : messageType === 'photo'
            ? 'Photo'
            : 'No messages yet';

    // Optional relationship label: Friend / Family, etc. We don't have it on
    // MessageThread, so surface a neutral placeholder only for visual spacing.
    const relationship = thread.lastMessageFromMe === null ? undefined : undefined;

    return (
        <button
            type="button"
            onClick={onOpen}
            className="w-full text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9972E]/50 rounded-2xl"
        >
            <div
                className="relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl transition-all"
                style={{
                    backgroundColor: CARD_BG,
                    border: `1px solid ${CARD_BORDER}`,
                    minHeight: 72,
                }}
                onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.backgroundColor = HOVER_BG;
                    el.style.borderColor = HOVER_BORDER;
                }}
                onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.backgroundColor = CARD_BG;
                    el.style.borderColor = CARD_BORDER;
                }}
            >
                {/* Avatar */}
                <div className="relative shrink-0">
                    <div
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-headline text-base sm:text-lg font-bold border"
                        style={{
                            backgroundColor: 'rgba(201,151,46,0.10)',
                            borderColor: 'rgba(201,151,46,0.22)',
                            color: GOLD,
                        }}
                    >
                        {thread.otherName.charAt(0).toUpperCase() || '?'}
                    </div>
                    {hasUnread && (
                        <span className="absolute top-0 right-0 block w-2.5 h-2.5 rounded-full bg-[#C9972E] ring-2 ring-[var(--msg-card-bg)]" />
                    )}
                </div>

                {/* Name + preview */}
                <div className="flex-1 min-w-0 self-center">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3
                            className={`text-[15px] sm:text-base truncate font-headline ${hasUnread ? 'font-bold' : 'font-semibold'}`}
                            style={{ color: SENDER_NAME }}
                        >
                            {thread.otherName}
                        </h3>
                        {relationship && (
                            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ backgroundColor: BADGE_BG, color: SUBTITLE }}>
                                {relationship}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                        {messageType !== 'text' && messageType !== 'none' && (
                            <PreviewIcon type={messageType} />
                        )}
                        <p
                            className={`text-[13px] truncate ${hasUnread ? 'font-medium' : ''}`}
                            style={{ color: hasUnread ? UNREAD_PREVIEW : PREVIEW_TEXT }}
                        >
                            {previewText}
                        </p>
                    </div>
                </div>

                {/* Timestamp + unread badge + chevron */}
                <div className="flex flex-col items-end gap-1.5 shrink-0 self-center">
                    {thread.lastMessageAt && (
                        <span className="text-[11px] font-medium" style={{ color: TIME_STAMP }}>
                            {formatChatTimestamp(thread.lastMessageAt)}
                        </span>
                    )}
                    <div className="flex items-center gap-2">
                        {hasUnread && (
                            <span className="min-w-[18px] h-[18px] px-1 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ backgroundColor: GOLD }}>
                                {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
                            </span>
                        )}
                        <ChevronRight
                            className="w-4 h-4 shrink-0 transition-colors"
                            style={{ color: hasUnread ? GOLD : GOLD_MUTED }}
                        />
                    </div>
                </div>
            </div>
        </button>
    );
}
