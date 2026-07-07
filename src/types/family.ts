/**
 * Family feature types — mirror the backend `/api/family` API contract.
 * See docs in: feat/family-feature (commit 8c88964).
 *
 * The old compatibility endpoints (/compatibility, /compatibility/summary,
 * /compatibility/preflight, /reports) were retired in favour of the daily
 * bond dashboard (/dashboard, /dashboard/weekly). The compatibility response,
 * summary, preflight, factor, advice, confidence, and credit-cost types that
 * mirrored those endpoints are therefore gone — see `familyDashboard.ts` for
 * the dashboard contract that replaces them.
 */

import type { PaywallData } from '@/types/paywall';

export type FamilyRelationshipType =
  | 'mother'
  | 'father'
  | 'son'
  | 'daughter'
  | 'sibling'
  | 'friend'
  | 'spouse'
  | 'other';

export type FamilyGender = 'male' | 'female' | 'other';

/** Total roster usage = manual members + active linked connections.
 *  Free: 1, Pro: 6, Premium: unlimited (`null`). Backend is the source of
 *  truth and enforces the same caps via FAMILY_FREE_TIER_CAP. */
export function familyRosterLimit(tier: string | null | undefined): number | null {
  const normalized = (tier || 'free').toLowerCase().trim();
  // Treat any paid/unlimited-sounding tier name as unlimited.
  if (['premium', 'paid', 'unlimited', 'lifetime', 'platinum'].includes(normalized)) {
    return null; // unlimited
  }
  if (normalized === 'pro') {
    return 6;
  }
  // Free and any unknown tier default to the free cap.
  return 1;
}

/** @deprecated Use {@link familyRosterLimit}. Retained as the free-tier value so
 *  any stray imports keep compiling; equals familyRosterLimit('free'). */
export const FAMILY_FREE_TIER_LIMIT = 1;

export interface FamilyAvatar {
  key: string;
  iconKey: string;
  accentColor: string;
  label: string;
}

/** Server returns numeric id; we keep number | string for flexibility.
 *  Backend response is snake_case; useFamily.ts normalizes into this camelCase
 *  shape before handing to React components. */
export interface FamilyMember {
  id: number;
  /** `manual` for entries owned by the current user; `linked` for accepted
   *  connections where both sides share birth details. Key UI lists by the
   *  combination of (source, id) because ids can collide across the two tables
   *  (a manual member id can equal a connection id). */
  source: 'manual' | 'linked';
  name: string;
  /** For manual entries this is always set. For linked entries it reflects
   *  the label chosen by the current user (`i_see_them_as`) and may be null
   *  until the user picks one — callers should render a sensible default. */
  relationshipType: FamilyRelationshipType | null;
  gender: FamilyGender;
  /** Birth details are only present for manual entries; linked connections
   *  compute synastry server-side without exposing coordinates. */
  dob?: string;            // YYYY-MM-DD
  tob?: string;            // HH:MM (24h)
  pob?: string;
  latitude?: number;
  longitude?: number;
  timezoneOffset?: number; // hours, e.g. 5.5
  notes?: string | null;
  avatarKey?: string | null;
  avatar?: FamilyAvatar | null;
  /** For manual entries only — linked entries don't store consent here. */
  consentAcknowledged?: boolean;
  consentAcknowledgedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Present only when source === 'linked'. Use this (not id) when routing
   *  sub-actions to /api/family/connections/{connectionId}/... */
  connectionId?: number;
  /** Present only when source === 'linked'. */
  sharingWithUser?: boolean;
  /** Present only when source === 'linked'. Mirrors the connection flag. */
  sharingWithThem?: boolean;
}

export interface FamilyMemberCreatePayload {
  name: string;
  relationshipType: FamilyRelationshipType;
  gender: FamilyGender;
  dob: string;
  tob: string;
  pob: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number;
  notes?: string;
  avatarKey?: string;
  consentAcknowledged: true;
}

export interface FamilyMemberUpdatePayload {
  name?: string;
  gender?: FamilyGender;
  dob?: string;
  tob?: string;
  pob?: string;
  latitude?: number;
  longitude?: number;
  timezoneOffset?: number;
  notes?: string;
  avatarKey?: string | null;
}

export interface FamilyLagna {
  sign: string;
  degree: number;
  absolute_longitude: number;
  nakshatra: string;
  pada: number;
}

export interface FamilyPlanet {
  sign: string;
  absolute_longitude: number;
  sign_degree: number;
  nakshatra: string;
  pada: number;
  house: number;
  motion: string;
  dignity: string;
  lord_of: number[];
  conjuncts: string[];
  shadbala_total?: number;
  shadbala_rupas?: number;
  shadbala_meets_req?: string;
}

export interface FamilyHouse {
  sign: string;
  lord: string;
  occupants: string[];
}

export interface FamilyChart {
  schema_version: number;
  ayanamsa?: { name: string; value: number };
  lagna: FamilyLagna;
  planets: Record<string, FamilyPlanet>;
  houses: Record<string, FamilyHouse>;
  /** Backend also returns dasha / panchanga / ashtakavarga — not consumed yet. */
  [extra: string]: unknown;
}

export interface FamilyChartResponse {
  member_id: number;
  chart: FamilyChart;
}

/* ------------------------------------------------------------------ */
/* Discovery + blocking                                                */
/* ------------------------------------------------------------------ */

/** Drives the per-row CTA in search results. */
export type FamilyDiscoverRelationshipStatus = 'none' | 'pending' | 'connected';

/** A single /api/family/discover result. No email or avatar is returned —
 *  render initials or the moonSign/rashi instead. */
export interface FamilyDiscoverResult {
  username: string;
  name: string;
  moonSign: string | null;
  relationshipStatus: FamilyDiscoverRelationshipStatus;
}

/** A blocked user entry from GET /api/family/blocks. */
export interface FamilyBlock {
  id: number;
  username: string;
  name: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Invites + linked connections                                        */
/* ------------------------------------------------------------------ */

export type FamilyInviteStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';

export type FamilyMergeMatchScore = 'exact' | 'high' | 'partial';

export interface FamilyMergeCandidate {
  memberId: number;
  name: string;
  dob: string;
  matchScore?: FamilyMergeMatchScore;
}

/** Invites are plain (post-migration 059): a target + an optional message. There
 *  is no relationship label or kind at invite time — the label is chosen later,
 *  when sharing is enabled. */
export interface FamilyInvite {
  id: number;
  requesterEmail: string;
  inviteeEmail: string;
  message: string | null;
  status: FamilyInviteStatus;
  expiresAt: string;
  createdAt: string;
  respondedAt: string | null;
  requesterName: string | null;
  inviteeName: string | null;
}

/** A linked connection. `isFamily` is true only once **both** sides have enabled
 *  sharing — it's derived from mutual sharing, not a stored kind. Relationship
 *  labels are nullable until each side sets one when enabling sharing. */
export interface FamilyConnection {
  connectionId: number;
  /** True once both sides share. Drives the Family vs. plain-connection split. */
  isFamily: boolean;
  otherEmail: string;
  otherName: string;
  /** Null until you set a label when enabling sharing. */
  iSeeThemAs: FamilyRelationshipType | null;
  /** Null until they set a label on their side. */
  theySeeMeAs: FamilyRelationshipType | null;
  myAvatarKey: string | null;
  avatar: FamilyAvatar | null;
  myNotes: string | null;
  sharingWithThem: boolean;
  theyShareWithMe: boolean;
  createdAt: string;
  disconnectedAt: string | null;
  disconnected: boolean;
}

/** Accept returns the standard connection shape. No merge candidate here anymore
 *  — merge is offered when you set a relationship label via PATCH. */
export interface FamilyInviteAcceptResponse {
  connection: FamilyConnection;
}

/** Send by exactly one of `username` or `email`, plus an optional message. */
export interface FamilyInviteSendPayload {
  username?: string;
  email?: string;
  message?: string;
}

/** Accept takes only an optional avatar to use for the new connection. */
export interface FamilyInviteAcceptPayload {
  avatarKey?: string;
}

/** PATCH a connection. Enabling sharing + a relationship label together is what
 *  promotes a pair to family (once the other side also shares). */
export interface FamilyConnectionUpdatePayload {
  sharingWithThem?: boolean;
  avatarKey?: string | null;
  notes?: string;
  relationshipOverride?: FamilyRelationshipType;
}

/** PATCH /connections/{id} echoes the updated connection and may include a
 *  `mergeCandidate` when the new label matches a manual family member. */
export interface FamilyConnectionUpdateResponse {
  connection: FamilyConnection;
  mergeCandidate?: FamilyMergeCandidate;
}

/** Error codes returned on invite/connection/discovery/block endpoints. */
export const FAMILY_INVITE_ERROR_CODES = [
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
] as const;
export type FamilyInviteErrorCode = typeof FAMILY_INVITE_ERROR_CODES[number];

/** Tells the UI which side(s) need to enable sharing before the dashboard
 *  (or chart) can run on a connection. Backend sets this on every
 *  SHARING_REQUIRED response across connection endpoints. */
export type FamilySharingBlockedBy = 'you' | 'them' | 'both';

/** Optional hint for surfacing a "nudge the other person" affordance.
 *  No send endpoint exists yet — UI should display target_email so the
 *  user can message them out-of-band. */
export interface FamilySharingNudgeAction {
  type: string; // e.g. 'remind'
  target_email: string;
}

/** Body returned by /connections/{id}/* endpoints when sharing isn't mutual. */
export interface FamilySharingRequiredError {
  code: 'SHARING_REQUIRED';
  blockedBy: FamilySharingBlockedBy;
  sharing_with_them: boolean;
  they_share_with_me: boolean;
  nudgeAction?: FamilySharingNudgeAction;
  message: string;
}
