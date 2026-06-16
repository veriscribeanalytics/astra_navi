'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2, AlertCircle, RotateCcw, Ban } from 'lucide-react';
import { useThreadMessages, type OptimisticMessage } from '@/hooks/useThreadMessages';
import { useThreads } from '@/hooks/useThreads';
import { useMessagesContext } from '@/context/MessagesContext';
import { useToast } from '@/hooks/useToast';
import { formatDisplayTime } from '@/lib/datetime';
import { MESSAGE_MAX_LENGTH } from '@/types/messages';

/** 1:1 conversation view: message list (polled) + composer. */
export default function ConversationClient({ threadId }: { threadId: number }) {
    const router = useRouter();
    const { error: toastError } = useToast();
    const { refreshUnread } = useMessagesContext();

    const {
        messages, isLoading, error, hasLoadedOnce,
        notConnected, blocked, send, retry,
    } = useThreadMessages(threadId);

    // Resolve the other party's name from the inbox list (covers deep-links where
    // we have no thread context yet). Cheap: the list is small and cached briefly.
    const { threads } = useThreads();
    const thread = useMemo(
        () => threads.find(t => t.threadId === threadId) ?? null,
        [threads, threadId]
    );
    const otherName = thread?.otherName ?? 'Conversation';

    const composerDisabled = blocked || notConnected;
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    // Track whether the user is pinned to the bottom so polling doesn't yank them
    // up while they're scrolled back reading history.
    const pinnedToBottomRef = useRef(true);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        pinnedToBottomRef.current = distanceFromBottom < 80;
    }, []);

    // Auto-scroll to bottom on new messages when pinned.
    const lastCount = useRef(0);
    useEffect(() => {
        if (messages.length !== lastCount.current) {
            lastCount.current = messages.length;
            if (pinnedToBottomRef.current) {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }
    }, [messages.length]);

    // Reading the thread clears its unread contribution to the global badge.
    useEffect(() => {
        if (hasLoadedOnce) void refreshUnread();
    }, [hasLoadedOnce, refreshUnread]);

    const doSend = useCallback(async () => {
        const body = draft.trim();
        if (!body || sending || composerDisabled) return;
        setSending(true);
        setDraft('');
        pinnedToBottomRef.current = true;
        const result = await send(body);
        setSending(false);
        if (!result.ok) {
            if (result.code === 'INVALID') setDraft(body); // restore so they can fix it
            toastError(result.message);
        } else {
            void refreshUnread();
        }
    }, [draft, sending, composerDisabled, send, toastError, refreshUnread]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void doSend();
        }
    };

    return (
        <div className="mx-auto w-full max-w-2xl 3xl:max-w-[2400px] flex flex-col h-[calc(100vh-var(--navbar-height,64px))]">
            {/* Header */}
            <header className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-surface/40 backdrop-blur-sm shrink-0">
                <button
                    type="button"
                    onClick={() => router.push('/messages')}
                    className="w-9 h-9 rounded-full hover:bg-secondary/10 flex items-center justify-center text-on-surface-variant/70 hover:text-secondary transition-colors shrink-0"
                    aria-label="Back to messages"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-sm font-bold shrink-0">
                    {otherName.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                    <h1 className="text-[15px] font-headline font-bold text-primary truncate">{otherName}</h1>
                    {thread?.otherEmail && (
                        <p className="text-[11px] text-on-surface-variant/50 truncate">{thread.otherEmail}</p>
                    )}
                </div>
            </header>

            {/* Messages */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-2"
            >
                {isLoading && !hasLoadedOnce && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="w-6 h-6 text-secondary animate-spin" />
                        <p className="text-sm text-on-surface-variant/60">Loading messages...</p>
                    </div>
                )}

                {error && hasLoadedOnce && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                        <p className="text-sm text-red-400">{error}</p>
                    </div>
                )}

                {hasLoadedOnce && !error && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                        <p className="text-[15px] font-headline font-bold text-primary">Say hello</p>
                        <p className="text-sm text-on-surface-variant/60 max-w-xs">
                            This is the start of your conversation with {otherName}.
                        </p>
                    </div>
                )}

                {messages.map(m => (
                    <MessageRow key={m.clientId} message={m} onRetry={() => void retry(m.clientId)} />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Composer / status banner */}
            {composerDisabled ? (
                <div className="px-4 sm:px-6 py-4 border-t border-white/[0.06] bg-surface/40 shrink-0">
                    <div className="flex items-center gap-2 text-[13px] text-on-surface-variant/70 justify-center">
                        <Ban className="w-4 h-4 shrink-0" />
                        <span>
                            {notConnected
                                ? "You're no longer connected, so you can't send new messages."
                                : 'Messaging is unavailable for this conversation.'}
                        </span>
                    </div>
                </div>
            ) : (
                <div className="px-3 sm:px-4 py-3 border-t border-white/[0.06] bg-surface/40 backdrop-blur-sm shrink-0">
                    <div className="flex items-end gap-2">
                        <textarea
                            value={draft}
                            onChange={e => setDraft(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
                            onKeyDown={onKeyDown}
                            rows={1}
                            placeholder={`Message ${otherName}...`}
                            aria-label={`Message ${otherName}`}
                            className="flex-1 resize-none max-h-32 min-h-[44px] rounded-2xl bg-surface-variant/60 border border-white/[0.08] px-4 py-3 text-[14px] text-primary placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary/40 focus:ring-1 focus:ring-secondary/30"
                        />
                        <button
                            type="button"
                            onClick={() => void doSend()}
                            disabled={!draft.trim() || sending}
                            aria-label="Send message"
                            className="w-11 h-11 rounded-full gold-gradient text-white flex items-center justify-center shrink-0 shadow-lg shadow-secondary/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                        >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function MessageRow({ message, onRetry }: { message: OptimisticMessage; onRetry: () => void }) {
    const mine = message.isMine;
    const ts = message.createdAt ? formatDisplayTime(message.createdAt) : '';

    return (
        <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
            <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                    mine
                        ? 'bg-secondary/20 border border-secondary/30 text-primary rounded-br-md'
                        : 'bg-surface-variant/70 border border-white/[0.06] text-primary rounded-bl-md'
                } ${message.failed ? 'opacity-70 border-red-400/40' : ''}`}
                style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
            >
                {message.body}
            </div>
            <div className={`flex items-center gap-1.5 mt-1 px-1 ${mine ? 'flex-row-reverse' : ''}`}>
                {ts && <span className="text-[10px] text-on-surface-variant/40">{ts}</span>}
                {message.pending && <span className="text-[10px] text-on-surface-variant/40">Sending…</span>}
                {message.failed && (
                    <button
                        type="button"
                        onClick={onRetry}
                        className="text-[10px] text-red-400 hover:text-red-300 inline-flex items-center gap-0.5"
                    >
                        <RotateCcw className="w-2.5 h-2.5" /> Failed — retry
                    </button>
                )}
            </div>
        </div>
    );
}
