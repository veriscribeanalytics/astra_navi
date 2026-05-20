/**
 * Family feature types — mirror the backend `/api/family` API contract.
 * See docs in: feat/family-feature (commit 8c88964).
 */

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

export type CompatibilityLang = 'en' | 'hi' | 'ko';

/** Credit cost per relationship type for compatibility calls. */
export const COMPATIBILITY_CREDIT_COST: Record<FamilyRelationshipType, number> = {
  spouse: 10,
  mother: 5,
  father: 5,
  son: 5,
  daughter: 5,
  sibling: 3,
  friend: 2,
  other: 2,
};

export const FAMILY_FREE_TIER_LIMIT = 3;

/** Server returns numeric id; we keep number | string for flexibility. */
export interface FamilyMember {
  id: number;
  name: string;
  relationshipType: FamilyRelationshipType;
  gender: FamilyGender;
  dob: string;            // YYYY-MM-DD
  tob: string;            // HH:MM (24h)
  pob: string;
  latitude: number;
  longitude: number;
  timezoneOffset: number; // hours, e.g. 5.5
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
}

export interface FamilyChart {
  schema_version: number;
  lagna: Record<string, unknown>;
  planets: Record<string, unknown>;
  houses: Record<string, unknown>;
}

export interface FamilyChartResponse {
  member_id: number;
  chart: FamilyChart;
}

export interface FamilyCompatibilityFactor {
  key?: string;
  label?: string;
  score?: number;
  detail?: string;
  [k: string]: unknown;
}

export interface FamilyCompatibilityResponse {
  score: number;
  band: string;
  verdict: string;
  factors: FamilyCompatibilityFactor[];
  lang: CompatibilityLang;
  relationship_type: FamilyRelationshipType;
  member_id: number;
  credit_cost: number;
  cached: boolean;
}

/** 402 paywall body when free-tier cap is hit. */
export interface FamilyFreeTierCapError {
  code: 'FAMILY_FREE_TIER_CAP';
  detail?: string;
  error?: string;
}
