/**
 * In-app notification types — mirror the backend `/api/notifications` contract.
 * See docs: Backend/docs/NOTIFICATIONS_FRONTEND_NOTES.md (migration 057).
 *
 * The feed is pull-based. The backend renders `title`/`body` at read time in the
 * user's profile language, so the client never localizes notification text — it
 * renders `title`/`body` directly and uses `data` only for deep-links.
 */

/** Known notification types. Kept open (`| string`) so unrecognized future
 *  types still render their title/body without a deep-link. */
export type NotificationType =
    | 'family_invite_received'
    | 'family_invite_accepted'
    | 'family_invite_declined'
    | (string & {});

export interface AppNotification {
    id: number;
    type: NotificationType;
    title: string;
    body: string;
    /** Type-specific payload for building deep-links (e.g. inviteId, connectionId). */
    data: Record<string, unknown>;
    read: boolean;
    createdAt: string;
}

export interface NotificationFeedResponse {
    notifications: AppNotification[];
    /** Cursor for the next (older) page; null when there are no more rows. */
    nextCursor: number | null;
}

/**
 * Map a notification to an in-app destination, or null when it's purely
 * informational / an unknown type. Switch on `type`, not on `data`, so future
 * types degrade gracefully (render title/body, no navigation).
 */
export function deepLinkFor(n: Pick<AppNotification, 'type'>): string | null {
    switch (n.type) {
        case 'family_invite_received':
            // The invite is data.inviteId; the incoming-invites screen lists it.
            return '/family/invites';
        case 'family_invite_accepted':
            // A new connection (data.connectionId) — surfaced on the same screen.
            return '/family/invites';
        case 'family_invite_declined':
            // Informational: no destination.
            return null;
        default:
            return null;
    }
}
