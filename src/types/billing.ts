/**
 * Shared billing/entitlement types for frontend catalog, balance, and history.
 *
 * These types mirror the backend's entitlements API response format
 * (docs/entitlements-api-reference.md) and are used across the frontend
 * in billing components, hooks, and the plans page.
 */

// ─── Action Category Constants ────────────────────────────────
//
// The backend /history endpoint uses specific action names like
// "chat_message", "guided_consult", etc. The UI categorizes these
// into broader groups for filtering.

/** Set of action values that are feature-specific consumption actions. */
export const FEATURE_ACTION_NAMES: ReadonlySet<string> = new Set([
  'chat_message',
  'guided_consult',
  'kundli_report',
  'match_report',
  'monthly_report',
  'daily_horoscope_pro',
]);

/** Broad UI categories derived from raw backend action values. */
export type ActionCategory = 'usage' | 'grant' | 'refund' | 'purchase' | 'cycle_reset';

/** Default display names for known action values (English + Hindi). */
export const ACTION_DISPLAY_NAMES: Readonly<Record<string, { en: string; hi: string }>> = {
  chat_message:              { en: 'AI Chat',           hi: 'AI चैट' },
  guided_consult:            { en: 'Guided Consult',    hi: 'निर्देशित परामर्श' },
  kundli_report:             { en: 'Kundli Report',     hi: 'कुंडली रिपोर्ट' },
  match_report:              { en: 'Match Report',      hi: 'मिलान रिपोर्ट' },
  monthly_report:            { en: 'Monthly Report',    hi: 'मासिक रिपोर्ट' },
  daily_horoscope_pro:       { en: 'Pro Horoscope',     hi: 'प्रो राशिफल' },
  grant:                     { en: 'Credit Grant',      hi: 'क्रेडिट अनुदान' },
  refund:                    { en: 'Credit Refund',     hi: 'क्रेडिट वापसी' },
  pack_purchase:             { en: 'Pack Purchase',     hi: 'पैक खरीद' },
  subscription_cycle_reset:  { en: 'Cycle Reset',       hi: 'चक्र रीसेट' },
};

/**
 * Classify a raw backend action into a broad UI category.
 *
 * - Feature-specific actions (chat_message, guided_consult, etc.) → "usage"
 * - "grant" / "subscription_cycle_reset" → "grant"
 * - "refund" → "refund"
 * - "pack_purchase" → "purchase"
 * - Falls back to creditsDelta sign if action is unknown.
 */
export function getActionCategory(action: string, creditsDelta?: number | null): ActionCategory {
  if (FEATURE_ACTION_NAMES.has(action)) return 'usage';
  if (action === 'grant' || action === 'subscription_cycle_reset') return 'grant';
  if (action === 'refund') return 'refund';
  if (action === 'pack_purchase') return 'purchase';
  // Fallback: use creditsDelta sign for unknown actions
  if (creditsDelta != null) return creditsDelta > 0 ? 'grant' : 'usage';
  return 'usage';
}

// ─── Catalog Types ───────────────────────────────────────────

/** A subscription plan from the product catalog. */
export interface CatalogSubscription {
  productId: string;
  productType: 'subscription';
  nameEn: string;
  nameHi?: string | null;
  descriptionEn?: string | null;
  descriptionHi?: string | null;
  tier: string;           // "pro" or "premium"
  priceInr: number;
  priceUsd?: number | null;
  currency?: string;
  credits: number;        // credits per billing cycle
  validityDays?: number | null;  // cycle_days: e.g. 30 for monthly, 365 for yearly
  icon?: string | null;
  color?: string | null;
  badge?: string | null;  // e.g. "Most Chosen", "Best Value"
  isRecommended?: boolean;
  isFeatured?: boolean;          // is_featured flag from backend
  isActive?: boolean;            // is_active flag — false means product should be hidden
  salePriceInr?: number | null;  // sale_price_inr — discounted price
  saleEndsAt?: string | null;    // sale_ends_at — ISO date for sale expiry
  features?: string[] | null;    // features list from backend
}

/** A one-time credit pack from the product catalog. */
export interface CatalogCreditPack {
  productId: string;
  productType: 'one_time_pack';
  nameEn: string;
  nameHi?: string | null;
  descriptionEn?: string | null;
  descriptionHi?: string | null;
  credits: number;
  priceInr: number;
  priceUsd?: number | null;
  currency?: string;
  validityDays?: number | null;  // how long credits last after purchase
  icon?: string | null;
  color?: string | null;
  badge?: string | null;
  isFeatured?: boolean;          // is_featured flag from backend
  isActive?: boolean;            // is_active flag — false means product should be hidden
  salePriceInr?: number | null;  // sale_price_inr — discounted price
  saleEndsAt?: string | null;    // sale_ends_at — ISO date for sale expiry
  features?: string[] | null;    // features list from backend
}

/** A one-time report from the product catalog (kundli, match, etc.). */
export interface CatalogOneTimeReport {
  productId: string;
  productType: 'one_time_report';
  nameEn: string;
  nameHi?: string | null;
  descriptionEn?: string | null;
  descriptionHi?: string | null;
  credits: number;                // credit cost per report
  priceInr: number;
  priceUsd?: number | null;
  currency?: string;
  validityDays?: number | null;   // for reports with expiration
  icon?: string | null;
  color?: string | null;
  badge?: string | null;
  isFeatured?: boolean;
  isActive?: boolean;
  salePriceInr?: number | null;
  saleEndsAt?: string | null;
  features?: string[] | null;
}

/** Union type for any catalog product. */
export type CatalogProduct = CatalogSubscription | CatalogCreditPack | CatalogOneTimeReport;

/** Response shape for the catalog endpoint. */
export interface CatalogResponse {
  subscriptions: CatalogSubscription[];
  creditPacks: CatalogCreditPack[];
  reports: CatalogOneTimeReport[];
}

// ─── Balance Types ───────────────────────────────────────────

/** An active credit pack details from the balance endpoint.
 *  The documented balance response uses camelCase for pack fields
 *  (productId, productName, creditsTotal, creditsRemaining, expiresAt),
 *  but we also handle snake_case variants defensively. */
export interface ActivePack {
  packId: string;
  productId: string;
  productName?: string | null;  // documented as camelCase "productName"
  creditsRemaining: number;
  creditsTotal: number;
  expiresAt?: string | null;    // ISO date string for pack expiry (null if no expiry)
  nameEn?: string | null;
  nameHi?: string | null;
}

/** The user's current credit balance.
 *  Maps from the documented balance response:
 *    subscription_credits_remaining → subscriptionCredits
 *    pack_credits_remaining → packCredits
 *    total_credits_remaining → credits
 *    subscription_cycle_end → nextRenewalAt
 */
export interface BalanceResponse {
  credits: number;              // total_credits_remaining (subscription + packs)
  tier: string;                 // "free", "pro", or "premium"
  tierExpiresAt?: string | null;
  creditsExpireAt?: string | null;
  nextRenewalAt?: string | null;   // subscription_cycle_end
  /** Credits from the current subscription cycle. Source: subscription_credits_remaining. */
  subscriptionCredits?: number | null;
  /** Credits from active credit packs. Source: pack_credits_remaining. */
  packCredits?: number | null;
  /** Number of active credit packs. */
  activePackCount?: number | null;
  /** Nearest pack expiry date (ISO). */
  nearestPackExpiry?: string | null;
  /** Full details of active packs. */
  activePacks?: ActivePack[] | null;
}

// ─── History Types ───────────────────────────────────────────

/** A single credit usage history entry (ledger line).
 *
 *  The documented /history response has these fields:
 *    action: "chat_message" | "guided_consult" | ... | "grant" | "refund" | "pack_purchase"
 *    creditsDelta: signed number (negative = consume, positive = grant/refund)
 *    sourceType: "subscription" | "pack" | "admin" | "system" | "refund"
 *    sourceId: uuid
 *    balanceAfter: number
 *    reservationStatus: "reserved" | "confirmed" | "refunded" | "expired"
 *    createdAt: ISO datetime
 *    metadata: object
 *
 *  The documented entry does NOT have feature_key, feature_name_en, or credits_spent.
 *  We derive featureKey from action when action is a feature-specific name,
 *  and compute actionCategory for UI filtering.
 */
export interface CreditHistoryEntry {
  id: string;
  /** Raw action from backend — feature-specific name or abstract action. */
  action: string;
  /** Derived UI category: 'usage' | 'grant' | 'refund' | 'purchase' | 'cycle_reset'. */
  actionCategory: ActionCategory;
  /** Feature key — derived from action for feature-specific actions, or from explicit field. */
  featureKey: string;
  /** Human-readable name (English) — derived from ACTION_DISPLAY_NAMES if not in payload. */
  featureNameEn: string;
  /** Human-readable name (Hindi) — derived from ACTION_DISPLAY_NAMES if not in payload. */
  featureNameHi?: string | null;
  /** Always positive magnitude (absolute value of creditsDelta). */
  creditsSpent: number;
  /** Signed delta: negative for consumption, positive for grants/refunds. */
  creditsDelta: number | null;
  /** Balance after this entry. Maps from balanceAfter. */
  balanceAfter?: number | null;
  /** Source of the credit change. Maps from sourceType. */
  sourceType?: string | null;
  /** Source entity ID. Maps from sourceId. */
  sourceId?: string | null;
  /** Reservation status. Maps from reservationStatus. */
  reservationStatus?: string | null;
  /** Arbitrary metadata from backend. */
  metadata?: Record<string, unknown> | null;
  /** ISO datetime. Maps from createdAt. */
  createdAt: string;
  /** Optional description. */
  description?: string | null;
}

/** Response shape for the history endpoint. */
export interface CreditHistoryResponse {
  entries: CreditHistoryEntry[];
  total: number;
  hasMore: boolean;
}

// ─── Helper Functions ────────────────────────────────────────

/** Check if a catalog product is a subscription. */
export function isSubscription(product: CatalogProduct): product is CatalogSubscription {
  return product.productType === 'subscription';
}

/** Check if a catalog product is a one-time credit pack. */
export function isCreditPack(product: CatalogProduct): product is CatalogCreditPack {
  return product.productType === 'one_time_pack';
}

/** Check if a catalog product is a one-time report. */
export function isOneTimeReport(product: CatalogProduct): product is CatalogOneTimeReport {
  return product.productType === 'one_time_report';
}

/** Format a price based on currency. */
export function formatProductPrice(product: CatalogProduct): string {
  if (product.currency === 'USD' && product.priceUsd) return `$${product.priceUsd}`;
  return `₹${product.priceInr}`;
}

/** Get the price period label for subscriptions. */
export function getPricePeriod(product: CatalogProduct): string {
  if (isSubscription(product)) {
    if (product.validityDays === 365) return '/year';
    return '/mo';
  }
  return ''; // one-time packs and reports have no period
}

/** Tier display label. */
export function getTierLabel(tier: string): string {
  const labels: Record<string, string> = {
    free: 'Free',
    pro: 'Pro',
    premium: 'Premium',
  };
  return labels[tier.toLowerCase()] || tier;
}

/** Determine if a history entry represents a credit gain (positive delta). */
export function isPositiveEntry(entry: CreditHistoryEntry): boolean {
  if (entry.creditsDelta != null) return entry.creditsDelta > 0;
  return entry.actionCategory === 'grant' || entry.actionCategory === 'refund' || entry.actionCategory === 'purchase';
}

/** Get the display label for an action category. */
export function getActionCategoryLabel(category: ActionCategory, t: (key: string) => string): string {
  const map: Record<ActionCategory, string> = {
    usage: t('plans.filterConsume'),
    grant: t('plans.filterGrant'),
    refund: t('plans.filterRefund'),
    purchase: t('plans.filterPurchase'),
    cycle_reset: t('plans.filterCycleReset'),
  };
  return map[category] || category;
}

// ─── Response Normalization Functions ────────────────────────
//
// These handle backend response shape mismatches defensively.
// The proxy routes pass through backend JSON transparently, so
// the frontend must normalize whatever shape arrives.

/**
 * Normalize a raw catalog response into the frontend CatalogResponse shape.
 *
 * Backend may return:
 *   - `{ subscriptions: [...], creditPacks: [...] }`  (ideal, our expected shape)
 *   - `{ products: [...] }`                           (flat array with productType field)
 *   - `{ data: { ... } }`                             (nested under a `data` key)
 *   - `{ plans: [...], packs: [...] }`               (alternative key names)
 *
 * Returns a valid CatalogResponse with empty arrays for missing sections.
 */
export interface NormalizeCatalogOptions {
  /** When true, include products where isActive === false (e.g. hidden/test products). */
  showInactive?: boolean;
}

export function normalizeCatalogResponse(raw: unknown, options?: NormalizeCatalogOptions): CatalogResponse {
  const { showInactive = false } = options || {};

  if (!raw || typeof raw !== 'object') {
    return { subscriptions: [], creditPacks: [], reports: [] };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = raw as any;

  // Unwrap if nested under `data`
  const source = data.data && typeof data.data === 'object' ? data.data : data;

  // Try known key names for subscriptions
  const subs: CatalogSubscription[] = [];
  const packs: CatalogCreditPack[] = [];
  const reports: CatalogOneTimeReport[] = [];

  // Check for explicit `subscriptions` key
  if (Array.isArray(source.subscriptions)) {
    for (const item of source.subscriptions) {
      if (item && typeof item === 'object') {
        subs.push(normalizeCatalogProduct(item) as CatalogSubscription);
      }
    }
  }
  // Alternative: `plans` key
  else if (Array.isArray(source.plans)) {
    for (const item of source.plans) {
      if (item && typeof item === 'object' && item.productType === 'subscription') {
        subs.push(normalizeCatalogProduct(item) as CatalogSubscription);
      }
    }
  }

  // Check for explicit `creditPacks` key
  if (Array.isArray(source.creditPacks)) {
    for (const item of source.creditPacks) {
      if (item && typeof item === 'object') {
        packs.push(normalizeCatalogProduct(item) as CatalogCreditPack);
      }
    }
  }
  // Alternative: `packs` key
  else if (Array.isArray(source.packs)) {
    for (const item of source.packs) {
      if (item && typeof item === 'object' && item.productType === 'one_time_pack') {
        packs.push(normalizeCatalogProduct(item) as CatalogCreditPack);
      }
    }
  }

  // Check for explicit `reports` key
  if (Array.isArray(source.reports)) {
    for (const item of source.reports) {
      if (item && typeof item === 'object') {
        reports.push(normalizeCatalogProduct(item) as CatalogOneTimeReport);
      }
    }
  }

  // Fallback: flat `products` array — split by productType (handles snake_case product_type too)
  if (subs.length === 0 && packs.length === 0 && reports.length === 0 && Array.isArray(source.products)) {
    for (const item of source.products) {
      if (!item || typeof item !== 'object') continue;
      const pt = item.productType || item.product_type || item.type || '';
      const normalized = normalizeCatalogProduct(item);
      // Filter out inactive products (unless showInactive test mode)
      if (!showInactive && normalized.isActive === false) continue;
      if (pt === 'subscription' || normalized.productType === 'subscription') {
        subs.push(normalized as CatalogSubscription);
      } else if (pt === 'one_time_pack' || normalized.productType === 'one_time_pack') {
        packs.push(normalized as CatalogCreditPack);
      } else if (pt === 'one_time_report' || normalized.productType === 'one_time_report') {
        reports.push(normalized as CatalogOneTimeReport);
      }
    }
  }

  // Filter out inactive products from explicit-key collections too (unless showInactive test mode)
  const activeSubs = showInactive ? subs : subs.filter(s => s.isActive !== false);
  const activePacks = showInactive ? packs : packs.filter(p => p.isActive !== false);
  const activeReports = showInactive ? reports : reports.filter(r => r.isActive !== false);

  return { subscriptions: activeSubs, creditPacks: activePacks, reports: activeReports };
}

/**
 * Normalize a single catalog product item, ensuring required fields exist.
 * Maps alternative key names to our standard field names.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCatalogProduct(item: any): CatalogProduct {
  const productId = item.productId || item.product_id || item.id || 'unknown';
  const productType = item.productType || item.product_type || item.type || 'subscription';
  const nameEn = item.nameEn || item.name_en || item.name || 'Unnamed Plan';
  const nameHi = item.nameHi ?? item.name_hi ?? null;
  const tier = item.tier || item.plan_tier || 'free';
  const credits = item.credits || item.credit_amount || item.amount || 0;
  const priceInr = item.priceInr || item.price_inr || item.price || 0;
  const priceUsd = item.priceUsd ?? item.price_usd ?? null;
  const currency = item.currency || 'INR';
  const validityDays = item.validityDays ?? item.validity_days ?? item.cycle_days ?? item.duration_days ?? null;
  const descriptionEn = item.descriptionEn ?? item.description_en ?? item.description ?? null;
  const descriptionHi = item.descriptionHi ?? item.description_hi ?? null;
  const icon = item.icon ?? null;
  const color = item.color ?? item.metadata?.color ?? null;
  const badge = item.badge ?? item.tag ?? null;
  const isRecommended = item.isRecommended ?? item.is_recommended ?? false;
  const isFeatured = item.isFeatured ?? item.is_featured ?? false;
  const isActive = item.isActive ?? item.is_active ?? true; // default true — only hide if explicitly false
  const salePriceInr = item.salePriceInr ?? item.sale_price_inr ?? null;
  const saleEndsAt = item.saleEndsAt ?? item.sale_ends_at ?? null;
  const features = Array.isArray(item.features) ? item.features : null;

  if (productType === 'one_time_pack') {
    return {
      productId,
      productType: 'one_time_pack',
      nameEn,
      nameHi,
      descriptionEn,
      descriptionHi,
      credits,
      priceInr,
      priceUsd,
      currency,
      validityDays,
      icon,
      color,
      badge,
      isFeatured,
      isActive,
      salePriceInr,
      saleEndsAt,
      features,
    } as CatalogCreditPack;
  }

  if (productType === 'one_time_report') {
    return {
      productId,
      productType: 'one_time_report',
      nameEn,
      nameHi,
      descriptionEn,
      descriptionHi,
      credits,
      priceInr,
      priceUsd,
      currency,
      validityDays,
      icon,
      color,
      badge,
      isFeatured,
      isActive,
      salePriceInr,
      saleEndsAt,
      features,
    } as CatalogOneTimeReport;
  }

  return {
    productId,
    productType: 'subscription',
    nameEn,
    nameHi,
    descriptionEn,
    descriptionHi,
    tier,
    priceInr,
    priceUsd,
    currency,
    credits,
    validityDays,
    icon,
    color,
    badge,
    isRecommended,
    isFeatured,
    isActive,
    salePriceInr,
    saleEndsAt,
    features,
  } as CatalogSubscription;
}

/**
 * Normalize a raw balance response into the frontend BalanceResponse shape.
 *
 * Documented balance endpoint fields (per docs/entitlements-api-reference.md):
 *   - subscription_credits_remaining  → subscriptionCredits (primary)
 *   - pack_credits_remaining          → packCredits (primary)
 *   - total_credits_remaining         → credits (primary)
 *   - subscription_cycle_end          → nextRenewalAt
 *   - active_packs (camelCase items)  → activePacks
 *
 * Also handles alternative key names defensively:
 *   - subscription_credits / subscriptionCredits (shorter variants)
 *   - pack_credits / packCredits (shorter variants)
 *   - credits / credit_balance / balance / remaining_credits
 *   - user_tier / plan / plan_tier
 *
 * Returns null if no recognizable credit count is found.
 */
export function normalizeBalanceResponse(raw: unknown): BalanceResponse | null {
  if (!raw || typeof raw !== 'object') return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = raw as any;

  // Unwrap if nested under `data`
  const source = data.data && typeof data.data === 'object' ? data.data : data;

  // Extract credits — try documented key first, then alternatives
  const credits =
    typeof source.total_credits_remaining === 'number' ? source.total_credits_remaining :
    typeof source.credits === 'number' ? source.credits :
    typeof source.credit_balance === 'number' ? source.credit_balance :
    typeof source.balance === 'number' ? source.balance :
    typeof source.remaining_credits === 'number' ? source.remaining_credits :
    null;

  // Extract tier — try multiple key names
  const tier =
    source.tier || source.user_tier || source.plan || source.plan_tier || source.subscription_tier || 'free';

  if (credits === null) return null; // No recognizable credit count

  // Extract subscription credits — documented key: subscription_credits_remaining
  const subscriptionCredits =
    typeof source.subscription_credits_remaining === 'number' ? source.subscription_credits_remaining :
    typeof source.subscription_credits === 'number' ? source.subscription_credits :
    typeof source.subscriptionCredits === 'number' ? source.subscriptionCredits :
    typeof source.subscriptionCreditsRemaining === 'number' ? source.subscriptionCreditsRemaining :
    null;

  // Extract pack credits — documented key: pack_credits_remaining
  const packCredits =
    typeof source.pack_credits_remaining === 'number' ? source.pack_credits_remaining :
    typeof source.pack_credits === 'number' ? source.pack_credits :
    typeof source.packCredits === 'number' ? source.packCredits :
    typeof source.packCreditsRemaining === 'number' ? source.packCreditsRemaining :
    null;

  // Extract active packs — documented uses camelCase fields per item
  // but we also handle snake_case variants defensively
  let activePacks: ActivePack[] | null = null;
  const packArrays = [source.active_packs, source.activePacks].filter(Array.isArray);
  if (packArrays.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activePacks = packArrays[0].map((p: any) => ({
      packId: p.id || p.packId || p.pack_id || 'unknown',
      productId: p.productId || p.product_id || 'unknown',
      productName: p.productName ?? p.product_name ?? p.name ?? null,
      creditsRemaining: p.creditsRemaining || p.credits_remaining || p.remaining || 0,
      creditsTotal: p.creditsTotal || p.credits_total || p.total || 0,
      expiresAt: p.expiresAt ?? p.expires_at ?? p.pack_expires_at ?? null,
      nameEn: p.nameEn ?? p.name_en ?? p.productName ?? p.product_name ?? p.name ?? null,
      nameHi: p.nameHi ?? p.name_hi ?? null,
    }));
  }

  // Extract active pack count
  const activePackCount =
    typeof source.active_pack_count === 'number' ? source.active_pack_count :
    typeof source.activePackCount === 'number' ? source.activePackCount :
    activePacks ? activePacks.length : null;

  // Find nearest pack expiry from active packs
  const nearestPackExpiry = activePacks
    ? activePacks
        .filter(p => p.expiresAt)
        .sort((a, b) => new Date(a.expiresAt!).getTime() - new Date(b.expiresAt!).getTime())[0]?.expiresAt ?? null
    : (source.nearest_pack_expiry ?? source.nearestPackExpiry ?? null);

  // Map subscription_cycle_end to nextRenewalAt / tierExpiresAt
  const subscriptionCycleEnd = source.subscription_cycle_end ?? source.subscriptionCycleEnd ?? null;

  return {
    credits,
    tier,
    tierExpiresAt: source.tierExpiresAt ?? source.tier_expires_at ?? source.expires_at ?? null,
    creditsExpireAt: source.creditsExpireAt ?? source.credits_expire_at ?? null,
    nextRenewalAt: source.nextRenewalAt ?? source.next_renewal_at ?? source.renewal_at ?? subscriptionCycleEnd ?? null,
    subscriptionCredits,
    packCredits,
    activePackCount,
    nearestPackExpiry,
    activePacks,
  };
}

/**
 * Normalize a raw history response into the frontend CreditHistoryResponse shape.
 *
 * Documented /history entry fields (per docs/entitlements-api-reference.md):
 *   - action: "chat_message" | "guided_consult" | ... | "grant" | "refund" | "pack_purchase"
 *   - creditsDelta: signed number (-1 for consume, +N for grant/refund)
 *   - sourceType: "subscription" | "pack" | "admin" | "system" | "refund"
 *   - sourceId: uuid
 *   - balanceAfter: number
 *   - metadata: object
 *   - reservationStatus: "reserved" | "confirmed" | "refunded" | "expired"
 *   - createdAt: ISO datetime
 *
 * The documented entry does NOT have feature_key, feature_name_en, or credits_spent.
 * We derive:
 *   - featureKey from action (when action is a feature-specific name)
 *   - featureNameEn/Hi from ACTION_DISPLAY_NAMES (when not in payload)
 *   - creditsSpent as Math.abs(creditsDelta)
 *   - actionCategory from getActionCategory(action, creditsDelta)
 *
 * Also handles alternative shapes defensively:
 *   - `{ history: [...], total: N, hasMore: bool }`
 *   - `{ items: [...], count: N }`
 *   - `{ data: { ... } }`
 *   - legacy shapes with feature_key, credits_spent, etc.
 *
 * Returns null if no recognizable entries are found.
 */
export function normalizeHistoryResponse(raw: unknown): CreditHistoryResponse | null {
  if (!raw || typeof raw !== 'object') return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = raw as any;

  // Unwrap if nested under `data`
  const source = data.data && typeof data.data === 'object' ? data.data : data;

  // Find the entries array — try multiple key names
  let entries: unknown[] | null = null;
  if (Array.isArray(source.entries)) entries = source.entries;
  else if (Array.isArray(source.history)) entries = source.history;
  else if (Array.isArray(source.items)) entries = source.items;
  else if (Array.isArray(source.records)) entries = source.records;

  if (!entries) return null; // No recognizable entries array

  // Normalize each entry
  const normalizedEntries: CreditHistoryEntry[] = entries
    .filter(e => e && typeof e === 'object')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((e: any) => {
      // Raw action from backend — this is the feature-specific name or abstract action
      const action = e.action || e.type || e.operation || 'unknown';

      // creditsDelta: signed value (negative = consumption, positive = grant/refund)
      // The documented field is "creditsDelta" (camelCase); also try snake_case
      const creditsDelta =
        typeof e.creditsDelta === 'number' ? e.creditsDelta :
        typeof e.credits_delta === 'number' ? e.credits_delta :
        typeof e.delta === 'number' ? e.delta :
        null;

      // Determine creditsSpent (always positive magnitude)
      let creditsSpent: number;
      if (typeof e.creditsSpent === 'number' || typeof e.credits_spent === 'number') {
        creditsSpent = Math.abs(e.creditsSpent || e.credits_spent);
      } else if (typeof e.cost === 'number' || typeof e.amount === 'number') {
        creditsSpent = Math.abs(e.cost || e.amount);
      } else if (creditsDelta !== null) {
        creditsSpent = Math.abs(creditsDelta);
      } else {
        creditsSpent = 0;
      }

      // If no explicit creditsDelta, derive it from action + creditsSpent
      // For feature-specific actions (chat_message, etc.) → negative
      // For grant/refund/purchase/cycle_reset → positive
      const effectiveDelta = creditsDelta ?? (
        FEATURE_ACTION_NAMES.has(action) ? -creditsSpent :
        action === 'grant' || action === 'refund' || action === 'pack_purchase' || action === 'subscription_cycle_reset' ? creditsSpent :
        -creditsSpent  // default: assume consumption for unknown actions
      );

      // Derive actionCategory from action + creditsDelta
      const actionCategory = getActionCategory(action, effectiveDelta);

      // Derive featureKey:
      // If action is a feature-specific name (chat_message, etc.), action IS the feature key
      // If action is an abstract name (grant, refund, etc.), look for explicit feature_key field
      let featureKey: string;
      if (FEATURE_ACTION_NAMES.has(action)) {
        featureKey = action;
      } else {
        featureKey = e.featureKey || e.feature_key || e.feature || 'unknown';
      }

      // Derive feature display names:
      // Use ACTION_DISPLAY_NAMES when the payload doesn't provide them
      const knownDisplay = ACTION_DISPLAY_NAMES[action];
      const featureNameEn = e.featureNameEn || e.feature_name_en || e.feature_name || e.name || knownDisplay?.en || action;
      const featureNameHi = e.featureNameHi ?? e.feature_name_hi ?? knownDisplay?.hi ?? null;

      // Source fields — documented as sourceType and sourceId
      const sourceType = e.sourceType ?? e.source_type ?? e.source ?? null;
      const sourceId = e.sourceId ?? e.source_id ?? e.sourceId ?? null;

      // Reservation status — documented values: "reserved" | "confirmed" | "refunded" | "expired"
      const reservationStatus = e.reservationStatus ?? e.reservation_status ?? e.reservation ?? null;

      // Metadata
      const metadata = e.metadata && typeof e.metadata === 'object' ? e.metadata : null;

      return {
        id: e.id || e._id || e.entry_id || String(Math.random()),
        action,
        actionCategory,
        featureKey,
        featureNameEn,
        featureNameHi,
        creditsSpent,
        creditsDelta: effectiveDelta,
        balanceAfter: e.balanceAfter ?? e.balance_after ?? e.remainingBalance ?? e.remaining_balance ?? null,
        sourceType,
        sourceId,
        reservationStatus,
        metadata,
        createdAt: e.createdAt || e.created_at || e.timestamp || e.date || new Date().toISOString(),
        description: e.description ?? e.desc ?? null,
      };
    });

  // Extract total and hasMore
  const total =
    typeof source.total === 'number' ? source.total :
    typeof source.count === 'number' ? source.count :
    normalizedEntries.length;

  const hasMore =
    source.hasMore ?? source.has_more ?? source.more_available ?? (normalizedEntries.length < total);

  return { entries: normalizedEntries, total, hasMore };
}