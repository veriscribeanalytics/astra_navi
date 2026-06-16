/**
 * Direct messaging types — mirror the backend `/api/messages` contract.
 * See docs: Backend/docs/DIRECT_MESSAGING_FRONTEND_NOTES.md (migration 060).
 *
 * 1:1 text chat between two people with an active connection. Realtime is HTTP
 * polling (no WebSocket): poll the open thread on an interval using the `after`
 * cursor (the largest message `id` already rendered).
 */

/** A conversation thread, as returned by open-thread and the inbox list. */
export interface MessageThread {
    threadId: number;
    otherEmail: string;
    otherName: string;
    /** Inbox-only: short preview of the last message; null for an empty thread. */
    lastMessagePreview?: string | null;
    /** Inbox-only: whether the last message was sent by me; null if empty. */
    lastMessageFromMe?: boolean | null;
    /** ISO timestamp of the last message, or null if the thread is empty. */
    lastMessageAt: string | null;
    unreadCount: number;
    createdAt: string;
}

/** A single chat message. Align bubbles off `isMine`, not an email compare. */
export interface Message {
    /** Monotonic; use the largest seen as the `after` polling cursor. */
    id: number;
    threadId: number;
    senderEmail: string;
    isMine: boolean;
    body: string;
    createdAt: string;
}

export interface SendMessagePayload {
    /** Trimmed server-side; must be 1–4000 chars after trim (422 otherwise). */
    body: string;
}

export interface MarkReadPayload {
    /** Omit to mark the whole thread read. The pointer only moves forward. */
    lastReadMessageId?: number;
}

export interface MarkReadResponse {
    threadId: number;
    lastReadMessageId: number | null;
    unreadCount: number;
}

/** Body length bounds enforced by the backend (`422` outside this range). */
export const MESSAGE_MIN_LENGTH = 1;
export const MESSAGE_MAX_LENGTH = 4000;

/** Send-specific business error codes. */
export const MESSAGE_ERROR_CODES = ['MESSAGE_BLOCKED', 'NOT_CONNECTED'] as const;
export type MessageErrorCode = typeof MESSAGE_ERROR_CODES[number];

/** Notification type emitted when a new message arrives (existing feed). */
export const MESSAGE_NOTIFICATION_TYPE = 'family_message_received' as const;
