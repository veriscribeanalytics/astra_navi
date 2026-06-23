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

export interface FamilyCapDetail {
    message?: string;
    currentTier?: string;
    limit?: number;
}

/** Detect a FAMILY_FREE_TIER_CAP body (code at top level or nested under
 *  `detail`) and pull out the spec's message / currentTier / limit so the caller
 *  can show the upgrade dialog. Returns null when it's not a cap error. */
export function familyCapDetail(body: unknown): FamilyCapDetail | null {
    if (!body || typeof body !== 'object') return null;
    const b = body as Record<string, unknown>;
    const detail = b.detail && typeof b.detail === 'object' ? b.detail as Record<string, unknown> : null;

    const code = extractCode(body);
    if (code !== 'FAMILY_FREE_TIER_CAP') return null;

    // Prefer the nested detail object (spec shape), fall back to top level.
    const src = detail ?? b;
    const message = typeof src.message === 'string' ? src.message
        : typeof b.message === 'string' ? b.message
        : undefined;
    const currentTier = typeof src.currentTier === 'string' ? src.currentTier
        : typeof src.current_tier === 'string' ? src.current_tier as string
        : undefined;
    const rawLimit = src.limit ?? b.limit;
    const limit = typeof rawLimit === 'number' ? rawLimit
        : typeof rawLimit === 'string' && rawLimit.trim() !== '' && !Number.isNaN(Number(rawLimit)) ? Number(rawLimit)
        : undefined;

    return {
        ...(message !== undefined ? { message } : {}),
        ...(currentTier !== undefined ? { currentTier } : {}),
        ...(limit !== undefined ? { limit } : {}),
    };
}

/** Detect a FAMILY_PEER_TIER_CAP body and return the localized, peer-facing
 *  message. Returns null when it's not a peer-cap error. This is intentionally
 *  separate from {@link familyCapDetail}: don't show an upgrade dialog, just
 *  toast the user and keep the sharing toggle off. */
export function familyPeerTierCapDetail(body: unknown): FamilyCapDetail | null {
    if (!body || typeof body !== 'object') return null;
    const b = body as Record<string, unknown>;
    const code = extractCode(body);
    if (code !== 'FAMILY_PEER_TIER_CAP') return null;

    const detail = b.detail && typeof b.detail === 'object' ? b.detail as Record<string, unknown> : null;
    const src = detail ?? b;
    const message = typeof src.message === 'string' ? src.message
        : typeof b.message === 'string' ? b.message
        : "They can't be added as family right now — their list is full.";
    return { message };
}

/** Detect a DECLINE_COOLDOWN_ACTIVE body (code at top level or nested under
 *  `detail`/`error`) and pull out the absolute `retryAfter` ISO timestamp so the
 *  caller can render a countdown and disable the re-invite CTA. Returns null when
 *  it's not a cooldown error or no usable timestamp is present. */
export function cooldownRetryAfter(body: unknown): string | null {
    if (!body || typeof body !== 'object') return null;
    const b = body as Record<string, unknown>;
    const errObj = b.error && typeof b.error === 'object' ? b.error as Record<string, unknown> : null;
    const detail = b.detail && typeof b.detail === 'object' ? b.detail as Record<string, unknown> : null;

    const code = (
        typeof b.code === 'string' ? b.code
        : errObj && typeof errObj.code === 'string' ? errObj.code as string
        : typeof b.error === 'string' ? b.error
        : detail && typeof detail.code === 'string' ? detail.code as string
        : null
    );
    if (code !== 'DECLINE_COOLDOWN_ACTIVE') return null;

    const src = errObj ?? detail ?? b;
    const retry = src.retryAfter ?? src.retry_after ?? b.retryAfter ?? b.retry_after;
    return typeof retry === 'string' && retry.trim() !== '' ? retry : null;
}

function extractCode(body: unknown): FamilyInviteErrorCode | null {
    if (!body || typeof body !== 'object') return null;
    const b = body as Record<string, unknown>;
    const detail = b.detail && typeof b.detail === 'object' ? b.detail as Record<string, unknown> : null;
    // Some endpoints (e.g. DECLINE_COOLDOWN_ACTIVE) nest the code under an `error` object.
    const errObj = b.error && typeof b.error === 'object' ? b.error as Record<string, unknown> : null;
    const raw = (
        typeof b.code === 'string' ? b.code
        : typeof b.error === 'string' ? b.error
        : errObj && typeof errObj.code === 'string' ? errObj.code
        : detail && typeof detail.code === 'string' ? detail.code
        : null
    );
    if (!raw) return null;
    const known: FamilyInviteErrorCode[] = [
        'INVITEE_NO_ACCOUNT',
        'FAMILY_FREE_TIER_CAP',
        'FAMILY_PEER_TIER_CAP',
        'ALREADY_CONNECTED',
        'INVITE_PENDING',
        'DECLINE_COOLDOWN_ACTIVE',
        'INVITE_NOT_PENDING',
        'MERGE_CANDIDATE_MISMATCH',
        'MERGE_LABEL_REQUIRED',
        'MERGE_NOT_SUPPORTED',
        'SHARING_REQUIRED',
        'USERNAME_TAKEN',
        'INVITE_BLOCKED',
        'CANNOT_BLOCK_SELF',
        'BLOCK_TARGET_NOT_FOUND',
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
        case 'MERGE_LABEL_REQUIRED': return t('family.inviteErrorMergeLabelRequired');
        case 'MERGE_NOT_SUPPORTED': return t('family.inviteErrorMergeNotSupported');
        case 'SHARING_REQUIRED': return t('family.sharingRequired');
        case 'INVITE_BLOCKED': return t('family.inviteErrorBlocked');
        case 'USERNAME_TAKEN': return t('family.usernameTaken');
        case 'CANNOT_BLOCK_SELF': return t('family.blockErrorSelf');
        case 'BLOCK_TARGET_NOT_FOUND': return t('family.blockErrorNotFound');
        // FAMILY_FREE_TIER_CAP intentionally returns null — caller should route
        // to the existing 402 paywall surface instead of a toast.
        // FAMILY_PEER_TIER_CAP is handled via familyPeerTierCapDetail() so callers
        // can surface a peer-facing message without an upgrade CTA.
        case 'FAMILY_PEER_TIER_CAP': return null;
        default: return null;
    }
}
