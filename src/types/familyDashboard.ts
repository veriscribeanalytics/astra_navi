/**
 * Family Dashboard types — mirror the backend `/api/family/{members|connections}/{id}/dashboard{,/weekly}`
 * contract documented in the Family Dashboard Frontend Integration Notes.
 *
 * The dashboard is a per-member / per-connection *daily* "bond" view: today's
 * bond score, guidance, chips, time triggers, relationship areas, and a weekly
 * graph. It is gated by the same `full_daily_horoscope` Pro+ feature key as
 * the personal daily horoscope. (The permanent compatibility baseline that
 * used to ride alongside is gone — `bond.score` is now the only headline.)
 *
 * Notable contract rules baked into these types:
 *  - All six relationship-area `value`s are "higher = better" (harmony), even
 *    for `conflict_sensitivity` — whose `risk_value` (higher = worse) is the
 *    inverse (`value + risk_value === 100`).
 *  - Time windows may be `null` independently (`good_connection` and
 *    `relationship_alert`). Render an empty/none state, never crash.
 *  - `location_basis: "birth"` means windows/today use the *viewer's* birth
 *    city; surface a caveat so users who've moved aren't confused.
 *  - The `paywall` field is present only for free-tier viewers who aren't
 *    accessible — render a soft upgrade overlay while keeping the teaser
 *    (bond / band / areas_summary / guidance.summary) visible.
 */

import type { PaywallData } from '@/types/paywall';

/**
 * Languages the family-dashboard backend translates content into. Unlike the
 * compatibility backend (9 langs), the dashboard supports all 11 app locales
 * (it adds Gujarati `gu` and Malayalam `ml`). The `?lang=` query param falls
 * back to the viewer's profile language, then `en`.
 */
export const FAMILY_DASHBOARD_LANGS = [
  'en', 'hi', 'ko', 'ta', 'te', 'kn', 'bn', 'mr', 'pa', 'gu', 'ml',
] as const;
export type FamilyDashboardLang = (typeof FAMILY_DASHBOARD_LANGS)[number];

/** The six bond bands returned by the dashboard. `band` is for display,
 *  `band_key` (snake-case) is for styling — they map 1:1. */
export const FAMILY_DASHBOARD_BAND_KEYS = [
  'harmonious',
  'supportive',
  'balanced',
  'sensitive',
  'caution',
  'tense',
] as const;
export type FamilyDashboardBandKey = (typeof FAMILY_DASHBOARD_BAND_KEYS)[number];

/** `ui_state` styling hint — maps 1:1 to `band_key` (with a `_bond` suffix). */
export type FamilyDashboardUiState =
  | 'excellent_bond'
  | 'good_bond'
  | 'balanced_bond'
  | 'sensitive_bond'
  | 'caution_bond'
  | 'tense_bond';

/** Per-area tone. Applied on harmony for `conflict_sensitivity`, so
 *  `positive` there means calm. positive ≥65, negative ≤45, else neutral. */
export type FamilyDashboardTone = 'positive' | 'neutral' | 'negative';

/** `location_basis` tells the UI which city the windows/today are computed
 *  for — the viewer's birth city (`"birth"`) or a fixed fallback (`"delhi"`). */
export type FamilyDashboardLocationBasis = 'birth' | 'delhi';

export interface FamilyDashboardUser {
  name: string;
  sign: string;
}

export interface FamilyDashboardMember {
  name: string;
  relationship_type: string;
  sign: string;
}

export interface FamilyDashboardRahukaal {
  start: string; // "HH:MM"
  end: string; // "HH:MM"
}

export interface FamilyDashboardPanchanga {
  tithi: string;
  nakshatra: string;
  vaara: string;
  rahukaal: FamilyDashboardRahukaal | null;
}

export interface FamilyDashboardMeta {
  date: string; // "YYYY-MM-DD"
  generated_at: string; // ISO-8601 with tz offset
  panchanga: FamilyDashboardPanchanga;
  location_basis: FamilyDashboardLocationBasis;
  timezone_name: string;
}

export interface FamilyDashboardBond {
  score: number; // 0-100
  band: string; // e.g. "Balanced"
  band_key: FamilyDashboardBandKey;
}

export interface FamilyDashboardChip {
  key: string;
  label: string;
  value: string;
}

export interface FamilyDashboardGuidance {
  /** Always present (free teaser). */
  summary: string;
  /** Pro+ only. */
  best_for?: string;
  avoid?: string;
  approach?: string;
}

/** A single Hora time window. `start`/`end` are "HH:MM"; `"HH:MM (+1)"`
 *  means the window runs into the next day. May be `null` for both
 *  `good_connection` and `relationship_alert` independently. */
export interface FamilyDashboardTimeWindow {
  start: string;
  end: string;
  label: string;
  advice: string;
  lord: string;
}

export interface FamilyDashboardTimeTriggers {
  /** `"sunrise"` = real Vedic Hora from birth-location sunrise (blocks ≠ 60 min).
   *  `"fixed"` = no-location fallback. */
  hora_mode: 'sunrise' | 'fixed';
  good_connection: FamilyDashboardTimeWindow | null;
  relationship_alert: FamilyDashboardTimeWindow | null;
}

/** A single relationship-area row. `value` is harmony (higher = better) for
 *  ALL six areas. `conflict_sensitivity` additionally carries `risk_value`
 *  (0-100, higher = worse) and `level` — show `level` as that area's label
 *  so a harmony of 48 doesn't read as "bad". */
export interface FamilyDashboardArea {
  value: number; // 5-98, higher = better
  tone: FamilyDashboardTone;
  insight: string;
  /** conflict_sensitivity only: 0-100, higher = worse. value + risk_value == 100. */
  risk_value?: number;
  /** conflict_sensitivity only: "Low" | "Moderate" | "High". */
  level?: string;
}

export type FamilyDashboardAreaKey =
  | 'communication'
  | 'emotional_bond'
  | 'trust'
  | 'support'
  | 'cooperation'
  | 'conflict_sensitivity';

/** Order the six areas are presented in (matches the spec example). */
export const FAMILY_DASHBOARD_AREA_KEYS: FamilyDashboardAreaKey[] = [
  'communication',
  'emotional_bond',
  'trust',
  'support',
  'cooperation',
  'conflict_sensitivity',
];

export interface FamilyDashboardRelationshipAreas {
  communication: FamilyDashboardArea;
  emotional_bond: FamilyDashboardArea;
  trust: FamilyDashboardArea;
  support: FamilyDashboardArea;
  cooperation: FamilyDashboardArea;
  conflict_sensitivity: FamilyDashboardArea;
}

export interface FamilyDashboardAreaSummaryItem {
  key: FamilyDashboardAreaKey;
  label: string;
  value: number;
}

/** Always present (free teaser): the strongest, needs-care, and stable area. */
export interface FamilyDashboardAreasSummary {
  strongest: FamilyDashboardAreaSummaryItem;
  needs_care: FamilyDashboardAreaSummaryItem;
  stable: FamilyDashboardAreaSummaryItem;
}

/** The permanent baseline compatibility card.
 *
 * @deprecated The dashboard payload no longer carries a `compatibility` object
 *  — the backend retired the second "permanent compatibility" number/dial. The
 *  field is kept on the response type as optional for backward-compat with any
 *  cached/legacy payloads, but the UI must NOT render a permanent-compat
 *  number, dial, or "view full report" link from it. Treat `bond.score` +
 *  `bond.band` as the only headline.
 */
export interface FamilyDashboardCompatibility {
  score: number;
  band: string;
  relationship_type: string;
  relationship_label: string;
  main_strength: string;
  main_tension: string;
}

export interface FamilyDashboardSystem {
  is_personalized: boolean;
  language: string;
}

/** Daily dashboard response. Pro+ fields (`chips`, `time_triggers`,
 *  `relationship_areas`, and the Pro+ `guidance.*` sub-fields) are absent for
 *  free-tier viewers; `paywall` is present only when free & not accessible. */
export interface FamilyDashboardResponse {
  user: FamilyDashboardUser;
  member: FamilyDashboardMember;
  meta: FamilyDashboardMeta;
  bond: FamilyDashboardBond;
  chips?: FamilyDashboardChip[];
  guidance: FamilyDashboardGuidance;
  time_triggers?: FamilyDashboardTimeTriggers;
  relationship_areas?: FamilyDashboardRelationshipAreas;
  areas_summary: FamilyDashboardAreasSummary;
  /** @deprecated Removed from the payload — do not render a permanent-compat
   *  card. Kept optional for legacy/cached responses only. */
  compatibility?: FamilyDashboardCompatibility;
  ui_state: FamilyDashboardUiState;
  system: FamilyDashboardSystem;
  paywall?: PaywallData;
  lang: string;
}

/** Weekly dashboard response. Free tier gets the graph + summary but
 *  `summary.best_day_note` is stripped. `paywall` present only for free. */
export interface FamilyDashboardWeeklyDay {
  date: string; // "YYYY-MM-DD"
  is_today: boolean;
  score: number;
  band: string;
  band_key: FamilyDashboardBandKey;
}

export interface FamilyDashboardWeeklySummary {
  best_day: string;
  worst_day: string;
  average_score: number;
  trend: string;
  /** Pro+ only — stripped for free. */
  best_day_note?: string;
}

export interface FamilyDashboardWeeklyResponse {
  area: string;
  relationship_type: string;
  location_basis: FamilyDashboardLocationBasis;
  range: { from: string; to: string };
  today: string;
  days: FamilyDashboardWeeklyDay[];
  summary: FamilyDashboardWeeklySummary;
  paywall?: PaywallData;
  lang: string;
}

/** Transit-calculation degraded state. The backend returns this instead of a
 *  500 when the dashboard can't be computed. Render a "try again later" empty
 *  state — the frontend must NOT show empty cards silently. */
export interface FamilyDashboardDegraded {
  calculation_unavailable: true;
  message: string;
}

/** Type guard: a daily payload is the degraded form when `calculation_unavailable` is truthy. */
export function isFamilyDashboardDegraded(body: unknown): body is FamilyDashboardDegraded {
    return !!body && typeof body === 'object' && (body as Record<string, unknown>).calculation_unavailable === true;
}

/* ------------------------------------------------------------------ */
/* Ask about this relationship (Phase 3)                               */
/* ------------------------------------------------------------------ */

/** A chat message as returned inside the pre-seeded thread. Matches the shape
 *  the chat backend returns (`id`, `type`, `text`, `status`, `errorCode`,
 *  `avatarId`, `createdAt`). Kept loose since the chat context re-fetches the
 *  thread via GET /api/chat/{id} and owns the canonical rendering. */
export interface FamilyAskChatMessage {
    id: string;
    type: string;
    text: string;
    status: string;
    errorCode?: string | null;
    avatarId?: string | null;
    createdAt: string;
}

/** The pre-seeded chat thread created by `POST .../ask`. We only consume
 *  `chat.id` (to deep-link the chat screen) — the messages array is shown via
 *  the normal chat fetch, not rendered from this payload directly. */
export interface FamilyAskChat {
    id: string;
    userEmail?: string;
    title: string;
    messages: FamilyAskChatMessage[];
    createdAt: string;
    updatedAt: string;
}

/** Starter to send as the first user message. The prefill embeds the member's
 *  name, which is what activates the family chart tools server-side (see
 *  references_other_person in the backend). `context.source` is metadata — the
 *  frontend does NOT need to forward it for tools to turn on; sending the
 *  prefill text via the normal send path is sufficient. */
export interface FamilyAskStarter {
    prefill: string;
    context: {
        source: 'family';
        note?: string;
    };
}

/** Response from `POST /api/family/{members|connections}/{id}/ask`. The `ask`
 *  endpoint is NOT cached — thread creation must be unique each call. */
export interface FamilyAskResponse {
    chat: FamilyAskChat;
    starter: FamilyAskStarter;
}

/** Band → accent hex used for rings / chips / chart strokes. Shared by the
 *  daily ring, the weekly chart, and area bars so the bond reads consistently. */
export const FAMILY_DASHBOARD_BAND_HEX: Record<FamilyDashboardBandKey, string> = {
  harmonious: '#3DD6A0',
  supportive: '#5BBE8A',
  balanced: '#E5A33A',
  sensitive: '#E8C25A',
  caution: '#E0795A',
  tense: '#D96B78',
};

/** Map a `band_key` to its accent hex, falling back to the balanced tone. */
export function familyDashboardBandHex(bandKey: string | null | undefined): string {
  if (bandKey && (FAMILY_DASHBOARD_BAND_KEYS as readonly string[]).includes(bandKey)) {
    return FAMILY_DASHBOARD_BAND_HEX[bandKey as FamilyDashboardBandKey];
  }
  return FAMILY_DASHBOARD_BAND_HEX.balanced;
}

/** The six area keys → i18n label keys (under `familyDashboard.areas.<key>`). */
export const FAMILY_DASHBOARD_AREA_LABEL_KEYS: Record<FamilyDashboardAreaKey, string> = {
  communication: 'familyDashboard.areas.communication',
  emotional_bond: 'familyDashboard.areas.emotional_bond',
  trust: 'familyDashboard.areas.trust',
  support: 'familyDashboard.areas.support',
  cooperation: 'familyDashboard.areas.cooperation',
  conflict_sensitivity: 'familyDashboard.areas.conflict_sensitivity',
};
