'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2, AlertCircle, RotateCcw, Ban, ImagePlus, X, ChevronDown } from 'lucide-react';
import { useThreadMessages, type OptimisticMessage } from '@/hooks/useThreadMessages';
import { useThreads } from '@/hooks/useThreads';
import { useMessagesContext } from '@/context/MessagesContext';
import { useToast } from '@/hooks/useToast';
import { formatDisplayTime, formatDateDivider, isSameDay } from '@/lib/datetime';
import { validateDmImage, DM_ALLOWED_TYPES } from '@/lib/dmImageUpload';
import { MESSAGE_MAX_LENGTH } from '@/types/messages';

/** 1:1 conversation view: message list (polled) + composer with image support. */
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

    // Composer image attachment (its own preview URL, distinct from the optimistic
    // bubble's preview which the hook manages).
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-grow the composer: reset to one row, then snap to content height
    // (capped by the CSS max-height, beyond which it scrolls).
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [draft]);

    // Fullscreen image viewer.
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    // Track whether the user is pinned to the bottom so polling doesn't yank them
    // up while they're scrolled back reading history. Mirrored into state so the
    // jump-to-latest button can react.
    const pinnedToBottomRef = useRef(true);
    const [atBottom, setAtBottom] = useState(true);
    // Count of messages that arrived while scrolled away (badge on the button).
    const [unseenCount, setUnseenCount] = useState(0);

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
        pinnedToBottomRef.current = true;
        setAtBottom(true);
        setUnseenCount(0);
    }, []);

    const handleScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        const pinned = distanceFromBottom < 80;
        pinnedToBottomRef.current = pinned;
        setAtBottom(pinned);
        if (pinned) setUnseenCount(0);
    }, []);

    // On new messages: auto-scroll if pinned, else bump the unseen badge.
    const lastCount = useRef(0);
    useEffect(() => {
        const delta = messages.length - lastCount.current;
        if (delta === 0) return;
        lastCount.current = messages.length;
        if (pinnedToBottomRef.current) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else if (delta > 0) {
            setUnseenCount(c => c + delta);
        }
    }, [messages.length]);

    // Reading the thread clears its unread contribution to the global badge.
    useEffect(() => {
        if (hasLoadedOnce) void refreshUnread();
    }, [hasLoadedOnce, refreshUnread]);

    // Reset scroll/unseen tracking when switching threads so counts from the
    // previous conversation don't leak into the new one.
    useEffect(() => {
        lastCount.current = 0;
        pinnedToBottomRef.current = true;
        setAtBottom(true);
        setUnseenCount(0);
    }, [threadId]);

    // Revoke the composer preview URL on unmount.
    useEffect(() => () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
    }, [imagePreview]);

    const clearImage = useCallback(() => {
        setSelectedImage(null);
        setImagePreview(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const onPickImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Reset the input so picking the same file again still fires onChange.
        e.target.value = '';
        if (!file) return;
        const valid = validateDmImage(file);
        if (!valid.ok) {
            toastError(valid.message);
            return;
        }
        setImagePreview(prev => {
            if (prev) URL.revokeObjectURL(prev);
            return URL.createObjectURL(file);
        });
        setSelectedImage(file);
    }, [toastError]);

    const doSend = useCallback(async () => {
        const body = draft.trim();
        if ((!body && !selectedImage) || sending || composerDisabled) return;
        const image = selectedImage ?? undefined;
        setSending(true);
        setDraft('');
        // Clear the composer attachment; the hook holds its own preview for the bubble.
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        pinnedToBottomRef.current = true;
        setAtBottom(true);
        setUnseenCount(0);
        const result = await send(body, image);
        setSending(false);
        if (!result.ok) {
            if (result.code === 'INVALID' && !image) setDraft(body); // restore so they can fix it
            toastError(result.message);
        } else {
            void refreshUnread();
        }
    }, [draft, selectedImage, imagePreview, sending, composerDisabled, send, toastError, refreshUnread]);

    const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void doSend();
        }
    };

    const canSend = (!!draft.trim() || !!selectedImage) && !sending;

    // Annotate each message with day-divider + grouping info. A "group" is a run
    // of consecutive messages from the same sender within 5 minutes: we tighten
    // the spacing and only show a timestamp on the last bubble of the run.
    const rows = useMemo(() => {
        const GROUP_GAP_MS = 5 * 60 * 1000;
        return messages.map((m, i) => {
            const prev = messages[i - 1];
            const next = messages[i + 1];
            const showDivider = !prev || !isSameDay(prev.createdAt, m.createdAt);

            const sameSenderAsPrev =
                !!prev && prev.isMine === m.isMine && !showDivider &&
                new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_GAP_MS;
            const nextSameDay = !!next && isSameDay(m.createdAt, next.createdAt);
            const sameSenderAsNext =
                !!next && next.isMine === m.isMine && nextSameDay &&
                new Date(next.createdAt).getTime() - new Date(m.createdAt).getTime() < GROUP_GAP_MS;

            return {
                message: m,
                dividerLabel: showDivider ? formatDateDivider(m.createdAt) : null,
                isGroupStart: !sameSenderAsPrev,
                isGroupEnd: !sameSenderAsNext,
            };
        });
    }, [messages]);

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
            <div className="relative flex-1 min-h-0">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto px-4 sm:px-6 py-4"
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

                {rows.map(({ message: m, dividerLabel, isGroupStart, isGroupEnd }) => (
                    <React.Fragment key={m.clientId}>
                        {dividerLabel && <DateDivider label={dividerLabel} />}
                        <MessageRow
                            message={m}
                            isGroupStart={isGroupStart}
                            isGroupEnd={isGroupEnd}
                            onRetry={() => void retry(m.clientId)}
                            onOpenImage={setLightboxUrl}
                        />
                    </React.Fragment>
                ))}
                <div ref={bottomRef} />
            </div>

                {/* Jump-to-latest: shown when scrolled up, badge counts new arrivals. */}
                {!atBottom && (
                    <button
                        type="button"
                        onClick={() => scrollToBottom()}
                        aria-label={unseenCount > 0 ? `${unseenCount} new messages, jump to latest` : 'Jump to latest'}
                        className="absolute bottom-3 right-4 flex items-center gap-1.5 pl-2.5 pr-3 py-2 rounded-full bg-surface border border-white/[0.12] shadow-lg text-on-surface-variant hover:text-secondary hover:border-secondary/40 backdrop-blur-sm transition-colors"
                    >
                        <ChevronDown className="w-4 h-4" />
                        {unseenCount > 0 && (
                            <span className="text-[11px] font-semibold">
                                {unseenCount > 9 ? '9+' : unseenCount} new
                            </span>
                        )}
                    </button>
                )}
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
                    {/* Selected image preview chip */}
                    {imagePreview && (
                        <div className="mb-2.5 flex items-center gap-3">
                            <div className="relative">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imagePreview}
                                    alt="Selected attachment"
                                    className="w-16 h-16 rounded-xl object-cover border border-white/[0.08]"
                                />
                                <button
                                    type="button"
                                    onClick={clearImage}
                                    aria-label="Remove image"
                                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-surface border border-white/[0.12] text-on-surface-variant/80 hover:text-primary flex items-center justify-center shadow"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            <span className="text-[12px] text-on-surface-variant/50 truncate">
                                {selectedImage?.name}
                            </span>
                        </div>
                    )}

                    <div className="flex items-end gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={DM_ALLOWED_TYPES.join(',')}
                            onChange={onPickImage}
                            className="hidden"
                            aria-hidden="true"
                            tabIndex={-1}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={sending}
                            aria-label="Attach image"
                            className="w-11 h-11 rounded-full bg-surface-variant/60 border border-white/[0.08] text-on-surface-variant/70 hover:text-secondary hover:border-secondary/40 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ImagePlus className="w-5 h-5" />
                        </button>
                        <textarea
                            ref={textareaRef}
                            value={draft}
                            onChange={e => setDraft(e.target.value.slice(0, MESSAGE_MAX_LENGTH))}
                            onKeyDown={onKeyDown}
                            rows={1}
                            placeholder={selectedImage ? 'Add a caption…' : `Message ${otherName}...`}
                            aria-label={`Message ${otherName}`}
                            className="flex-1 resize-none max-h-32 min-h-[44px] overflow-y-auto rounded-2xl bg-surface-variant/60 border border-white/[0.08] px-4 py-3 text-[14px] text-primary placeholder:text-on-surface-variant/40 focus:outline-none focus:border-secondary/40 focus:ring-1 focus:ring-secondary/30"
                        />
                        <button
                            type="button"
                            onClick={() => void doSend()}
                            disabled={!canSend}
                            aria-label="Send message"
                            className="w-11 h-11 rounded-full gold-gradient text-white flex items-center justify-center shrink-0 shadow-lg shadow-secondary/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-transform"
                        >
                            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Character counter — only surfaces as you near the limit. */}
                    {draft.length >= MESSAGE_MAX_LENGTH - 200 && (
                        <div
                            className={`mt-1.5 pr-1 text-right text-[11px] tabular-nums ${
                                draft.length >= MESSAGE_MAX_LENGTH
                                    ? 'text-red-400'
                                    : 'text-on-surface-variant/50'
                            }`}
                            aria-live="polite"
                        >
                            {draft.length} / {MESSAGE_MAX_LENGTH}
                        </div>
                    )}
                </div>
            )}

            {lightboxUrl && (
                <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
            )}
        </div>
    );
}

// Matches http(s) URLs and bare www. hosts. Captured so split() keeps the
// delimiters. Conservative on purpose — we only ever linkify these two shapes.
const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s]+)/gi;

/** Render message text with http(s)/www URLs as safe external links. */
function Linkified({ text }: { text: string }) {
    const parts = text.split(URL_PATTERN);
    return (
        <>
            {parts.map((part, i) => {
                // Odd indices are the captured URL delimiters.
                if (i % 2 === 1) {
                    // Trim trailing punctuation that's almost always sentence-final,
                    // not part of the URL, and render it as plain text after the link.
                    const trailMatch = part.match(/[.,!?;:)\]]+$/);
                    const trail = trailMatch ? trailMatch[0] : '';
                    const url = trail ? part.slice(0, -trail.length) : part;
                    const href = url.startsWith('www.') ? `https://${url}` : url;
                    return (
                        <React.Fragment key={i}>
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer nofollow"
                                className="underline decoration-secondary/50 underline-offset-2 hover:decoration-secondary text-secondary break-all"
                            >
                                {url}
                            </a>
                            {trail}
                        </React.Fragment>
                    );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </>
    );
}

function MessageRow({
    message,
    isGroupStart,
    isGroupEnd,
    onRetry,
    onOpenImage,
}: {
    message: OptimisticMessage;
    isGroupStart: boolean;
    isGroupEnd: boolean;
    onRetry: () => void;
    onOpenImage: (url: string) => void;
}) {
    const mine = message.isMine;
    const ts = message.createdAt ? formatDisplayTime(message.createdAt) : '';
    const imageSrc = message.imageUrl || message.localPreviewUrl || null;
    // Show the timestamp/status footer only on the last bubble of a run, but
    // always keep it for pending/failed/uploading rows so feedback isn't hidden.
    const showMeta = isGroupEnd || message.pending || message.failed || message.uploading;

    return (
        <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} ${isGroupStart ? 'mt-3' : 'mt-0.5'}`}>
            {message.isDeleted ? (
                <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] italic leading-relaxed text-on-surface-variant/45 bg-surface-variant/40 border border-white/[0.05] ${
                        mine ? 'rounded-br-md' : 'rounded-bl-md'
                    }`}
                >
                    This message was deleted
                </div>
            ) : imageSrc ? (
                <div
                    className={`max-w-[78%] overflow-hidden rounded-2xl border ${
                        mine
                            ? 'border-secondary/30 bg-secondary/10 rounded-br-md'
                            : 'border-white/[0.06] bg-surface-variant/60 rounded-bl-md'
                    } ${message.failed ? 'opacity-70 border-red-400/40' : ''}`}
                >
                    <button
                        type="button"
                        onClick={() => onOpenImage(imageSrc)}
                        className="relative block w-full cursor-zoom-in"
                        aria-label="Open image"
                    >
                        {/* Signed GCS URLs are short-lived & query-signed — use a plain
                            img, not next/image. Trust the server-returned dimensions. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageSrc}
                            alt={message.body || 'Shared image'}
                            width={message.imageWidth ?? undefined}
                            height={message.imageHeight ?? undefined}
                            className="block h-auto w-auto max-h-[320px] max-w-[260px] object-cover"
                        />
                        {message.uploading && (
                            <div className="absolute inset-0 grid place-items-center bg-black/35">
                                <Loader2 className="w-6 h-6 animate-spin text-white/90" />
                            </div>
                        )}
                    </button>
                    {message.body && (
                        <div
                            className="px-3 py-2 text-[14px] leading-relaxed text-primary"
                            style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                        >
                            <Linkified text={message.body} />
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed ${
                        mine
                            ? 'bg-secondary/20 border border-secondary/30 text-primary rounded-br-md'
                            : 'bg-surface-variant/70 border border-white/[0.06] text-primary rounded-bl-md'
                    } ${message.failed ? 'opacity-70 border-red-400/40' : ''}`}
                    style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                    <Linkified text={message.body} />
                </div>
            )}
            {showMeta && (
                <div className={`flex items-center gap-1.5 mt-1 px-1 ${mine ? 'flex-row-reverse' : ''}`}>
                    {ts && <span className="text-[10px] text-on-surface-variant/40">{ts}</span>}
                    {message.uploading && <span className="text-[10px] text-on-surface-variant/40">Uploading…</span>}
                    {message.pending && !message.uploading && (
                        <span className="text-[10px] text-on-surface-variant/40">Sending…</span>
                    )}
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
            )}
        </div>
    );
}

/** Centered day divider ("Today" / "Yesterday" / date) between message groups. */
function DateDivider({ label }: { label: string }) {
    return (
        <div className="flex items-center gap-3 my-4" role="separator" aria-label={label}>
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-on-surface-variant/40 shrink-0">
                {label}
            </span>
            <div className="flex-1 h-px bg-white/[0.06]" />
        </div>
    );
}

/** Minimal fullscreen image viewer: close on backdrop click or Escape. */
function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close image"
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt="Shared image"
                onClick={e => e.stopPropagation()}
                className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain shadow-2xl"
            />
        </div>
    );
}
