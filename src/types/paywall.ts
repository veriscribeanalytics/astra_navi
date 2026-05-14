/**
 * Shared paywall types for frontend entitlement system.
 *
 * These types mirror the backend's paywall/entitlements response format
 * as defined in PAYWALL_FRONTEND_INTEGRATION.md and are used across
 * the frontend in hooks, components, and contexts.
 */

/** Feature keys that the entitlement system recognizes. */
export type PaywallFeatureKey =
  | 'chat_message'
  | 'full_daily_horoscope'
  | 'tomorrow_horoscope'
  | 'guided_consult'
  | 'match_report'
  | 'kundli_premium';

/** A product suggestion shown in the PaywallCard (backend sends array). */
export interface SuggestedProduct {
  productId: string;
  productType: string;       // "subscription" or "one_time_pack"
  nameEn: string;
  nameHi?: string | null;
  credits: number;
  tier?: string | null;      // "pro" or "premium" for subscriptions
  priceInr?: number | null;
  priceUsd?: number | null;
  currency?: string;
  icon?: string | null;
  color?: string | null;
}

/** The paywall data payload returned from the backend on 402 or check. */
export interface PaywallData {
  /** Feature key that triggered the paywall. Backend field: featureKey. */
  featureKey: PaywallFeatureKey;

  /** Whether this is a soft (partial) or hard (full) block. */
  isSoft: boolean;

  /** Human-readable title (English). */
  title: string;

  /** Human-readable title (Hindi). */
  titleHi?: string | null;

  /** Longer description (English). */
  description: string;

  /** Longer description (Hindi). */
  descriptionHi?: string | null;

  /** Emoji/icon for the card. */
  icon?: string | null;

  /** Theme color for the card. */
  color?: string | null;

  /** Short badge label (e.g. "Pro", "5 Credits"). */
  badge?: string | null;

  /** Remaining credit balance for this feature (null = none). */
  credits?: number | null;

  /** Minimum credits required to use the feature. */
  creditsRequired?: number;

  /** Current subscription tier of the user. */
  tier?: string;

  /** Suggested upgrade products (array, per backend spec). */
  suggestedProducts?: SuggestedProduct[];

  /** Locked section keys (for kundli premium, etc.). */
  lockedSections?: string[];

  /** Teaser flag — show limited content with upgrade prompt. */
  teaser?: boolean;
}

/**
 * Legacy alias: some existing code uses `feature` instead of `featureKey`.
 * PaywallData now uses `featureKey` to match the backend contract.
 * If you see `paywall.feature`, change it to `paywall.featureKey`.
 */

/** Response shape for a single-feature paywall check. */
export interface PaywallCheck {
  /** Whether the feature is accessible (true = allowed, false = blocked). */
  accessible: boolean;

  /** Feature key checked. */
  feature_key: PaywallFeatureKey;

  /** Reason if blocked. */
  reason?: string;

  /** Current subscription tier. */
  current_tier?: string;

  /** Minimum tier required. */
  min_tier?: string;

  /** Required credits. */
  required_credits?: number;

  /** Available credits. */
  available_credits?: number;

  /** Paywall data if accessible===false; undefined if allowed. */
  paywall?: PaywallData;
}

/** Individual feature item from the batch /features endpoint. */
export interface PaywallFeatureItem {
  accessible: boolean;
  feature_key: PaywallFeatureKey;
  reason?: string;
  current_tier?: string;
  min_tier?: string;
  required_credits?: number;
  available_credits?: number;
  paywall?: PaywallData;
}

/** Response shape for the batch /features endpoint. Backend returns array. */
export interface PaywallFeaturesResponse {
  /** Array of paywall checks for all features. */
  features: PaywallFeatureItem[];

  /** The user's current subscription tier. */
  tier?: string;

  /** Total remaining credits across all features (if applicable). */
  totalCredits?: number | null;
}

/**
 * Normalized map: feature_key → PaywallCheck.
 * Used by PaywallContext for quick lookups after batch check.
 * Created by normalizing the backend features array.
 */
export type PaywallFeatureMap = Record<PaywallFeatureKey, PaywallCheck>;