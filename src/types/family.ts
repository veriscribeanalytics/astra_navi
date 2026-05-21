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

export type FamilyCompatibilityBand = 'Excellent' | 'Good' | 'Average' | 'Challenging';
export type FamilyCompatibilityFactorStatus = 'strength' | 'balanced' | 'tension';
export type FamilyCompatibilityConfidenceLevel = 'high' | 'medium' | 'low';

export interface FamilyCompatibilityFactor {
  name: string;
  label: string;
  score?: number;
  score_percent: number;
  weight?: number;
  note?: string;
  status: FamilyCompatibilityFactorStatus;
  summary: string;
  /** Legacy field — older payloads. */
  key?: string;
  detail?: string;
}

export interface FamilyCompatibilityHighlight {
  factor: string;
  score: number;
  text: string;
}

export interface FamilyCompatibilityAdvice {
  communication_style: string;
  best_support_method: string;
  boundaries_or_cautions: string;
  next_step: string;
}

export interface FamilyRelationshipActions {
  today: string;
  this_week: string;
  long_term: string;
}

export interface FamilyCompatibilityConfidence {
  level: FamilyCompatibilityConfidenceLevel;
  label: string;
  note: string;
}

export interface FamilyCompatibilityResponse {
  score: number;
  band: FamilyCompatibilityBand | string;
  verdict: string;
  factors: FamilyCompatibilityFactor[];
  strengths?: FamilyCompatibilityHighlight[];
  tension_points?: FamilyCompatibilityHighlight[];
  advice?: FamilyCompatibilityAdvice;
  relationship_actions?: FamilyRelationshipActions;
  confidence?: FamilyCompatibilityConfidence;
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
