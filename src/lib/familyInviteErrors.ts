import type { FamilyInviteErrorCode } from '@/types/family';

type Translator = (key: string, vars?: Record<string, string | number>) => string;

/**
 * Map a backend error body from any invite/connection endpoint to a user-facing
 * string. Falls back to a generic message when the code isn't recognized.
 *
 * The 410 expired case isn't a code field — callers should pass the HTTP status
 * separately or call `parseInviteErrorByStatus`.
 */
export function parseInviteError(body: unknown, t: Translator): string {
    const code = extractCode(body);
    return mapCodeToCopy(code, t) ?? t('family.inviteErrorGeneric');
}

/**
 * When you only have the HTTP status (e.g. 410 expired) but no body code,
 * use this — handles 410 specifically, falls back to body parsing otherwise.
 */
export function parseInviteErrorByStatus(status: number, body: unknown, t: Translator): string {
    if (status === 410) return t('family.inviteErrorExpired');
    return parseInviteError(body, t);
}

/** True if the backend body carries one of the known invite/connection codes. */
export function inviteErrorCode(body: unknown): FamilyInviteErrorCode | null {
    return extractCode(body);
}

function extractCode(body: unknown): FamilyInviteErrorCode | null {
    if (!body || typeof body !== 'object') return null;
    const b = body as Record<string, unknown>;
    const raw = (typeof b.code === 'string' ? b.code : typeof b.error === 'string' ? b.error : null);
    if (!raw) return null;
    const known: FamilyInviteErrorCode[] = [
        'INVITEE_NO_ACCOUNT',
        'FAMILY_FREE_TIER_CAP',
        'ALREADY_CONNECTED',
        'INVITE_PENDING',
        'DECLINE_COOLDOWN_ACTIVE',
        'INVITE_NOT_PENDING',
        'MERGE_CANDIDATE_MISMATCH',
        'SHARING_REQUIRED',
    ];
    return known.includes(raw as FamilyInviteErrorCode) ? (raw as FamilyInviteErrorCode) : null;
}

function mapCodeToCopy(code: FamilyInviteErrorCode | null, t: Translator): string | null {
    switch (code) {
        case 'INVITEE_NO_ACCOUNT': return t('family.inviteErrorNoAccount');
        case 'ALREADY_CONNECTED': return t('family.inviteErrorAlreadyConnected');
        case 'INVITE_PENDING': return t('family.inviteErrorPending');
        case 'DECLINE_COOLDOWN_ACTIVE': return t('family.inviteErrorCooldown');
        case 'INVITE_NOT_PENDING': return t('family.inviteErrorNotPending');
        case 'MERGE_CANDIDATE_MISMATCH': return t('family.inviteErrorMergeStale');
        case 'SHARING_REQUIRED': return t('family.sharingRequired');
        // FAMILY_FREE_TIER_CAP intentionally returns null — caller should route
        // to the existing 402 paywall surface instead of a toast.
        default: return null;
    }
}
