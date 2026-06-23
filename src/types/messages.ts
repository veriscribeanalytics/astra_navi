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
    /** May be empty for an image-only message. Null on a deleted tombstone. */
    body: string;
    createdAt: string;
    /** Short-lived signed GET URL (~15 min). Null for a text-only message. Do
     *  NOT persist in long-lived caches — re-fetch to refresh. */
    imageUrl?: string | null;
    /** Trust these server-returned dimensions (EXIF stripped + re-encoded). */
    imageWidth?: number | null;
    imageHeight?: number | null;
    /** Soft-deleted: render a tombstone; body/imageUrl come back null. */
    isDeleted?: boolean;
    /** ISO timestamp if the message was edited, else null. */
    editedAt?: string | null;
}

export interface SendMessagePayload {
    /** Trimmed server-side; ≤4000 chars. Optional when sending an image alone. */
    body?: string;
    /** Permanent object key from a `dm` commit for THIS thread (e.g. `dm/7/<uuid>.jpg`). */
    imageKey?: string;
}

/** Upload kinds the backend signer accepts. DM images use `dm`. */
export type UploadKind = 'profile' | 'chat_avatar' | 'family' | 'dm';

/** POST /api/uploads/sign request. */
export interface SignUploadRequest {
    kind: UploadKind;
    /** Must be one of the allowed image types (see DM_ALLOWED_TYPES). */
    contentType: string;
    /** Byte size of the file to upload. */
    size: number;
}

/** POST /api/uploads/sign response. */
export interface SignUploadResponse {
    /** Signed PUT URL — upload bytes straight to GCS (no auth/cookies). */
    uploadUrl: string;
    /** Temporary object key (e.g. `tmp/<uid>/<hex>`) to pass to commit. */
    objectKey: string;
    maxBytes: number;
    /** Echo the signed content type — the PUT's Content-Type MUST equal this. */
    contentType: string;
}

/** POST /api/uploads/commit request. `targetId` = threadId for `dm`. */
export interface CommitUploadRequest {
    kind: UploadKind;
    objectKey: string;
    targetId?: number;
}

/** POST /api/uploads/commit response. `objectKey` is now PERMANENT. */
export interface CommitUploadResponse {
    objectKey: string;
    /** Signed GET URL for immediate display. */
    imageUrl: string;
    width: number;
    height: number;
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
