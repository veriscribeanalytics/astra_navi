import { test, expect } from '@playwright/test';

/**
 * Billing Frontend Integration Tests
 *
 * Tests the contract between frontend types and backend billing data shapes
 * using the exact documented payloads from docs/entitlements-api-reference.md:
 *   - Catalog: flat products array with product_type, snake_case fields, one_time_report
 *   - Balance: subscription_credits_remaining, pack_credits_remaining, total_credits_remaining,
 *              subscription_cycle_end, active_packs (camelCase items)
 *   - History: action as feature-specific name (chat_message, grant, refund, pack_purchase),
 *               creditsDelta (camelCase signed), sourceType, balanceAfter, reservationStatus
 *
 * These tests verify that the frontend normalizers correctly handle
 * documented response shapes and produce valid frontend types.
 */

// ─── Import normalizers (they run in Node.js too) ──────────────
// We import the TypeScript module directly — Playwright test runner
// supports TS imports. We test the normalization logic, not the UI.

import {
  normalizeCatalogResponse,
  normalizeBalanceResponse,
  normalizeHistoryResponse,
  isSubscription,
  isCreditPack,
  isOneTimeReport,
  getActionCategory,
  isPositiveEntry,
} from '../src/types/billing';

// ─── Mock Data: Catalog (documented flat products shape) ───────

const MOCK_CATALOG_FLAT_PRODUCTS = {
  products: [
    {
      product_id: 'pro_monthly',
      product_type: 'subscription',
      name_en: 'Pro Monthly',
      name_hi: 'प्रो मासिक',
      description_en: 'Extended daily access to Navi features',
      description_hi: 'नवी सुविधाओं का विस्तारित दैनिक उपयोग',
      tier: 'pro',
      price_inr: 199.00,
      price_usd: 2.49,
      currency: 'INR',
      credits: 300,
      cycle_days: 30,
      is_featured: true,
      is_active: true,
      features: ['chat', 'horoscope', 'consult'],
      badge: 'Most Chosen',
    },
    {
      product_id: 'premium_monthly',
      product_type: 'subscription',
      name_en: 'Premium Monthly',
      name_hi: 'प्रीमियम मासिक',
      description_en: 'Full unlimited access to all Navi features',
      tier: 'premium',
      price_inr: 499.00,
      price_usd: 5.99,
      currency: 'INR',
      credits: 1000,
      cycle_days: 30,
      is_featured: false,
      is_active: true,
      sale_price_inr: 399.00,
      sale_ends_at: '2026-06-30T23:59:59Z',
    },
    {
      product_id: 'credit_pack_10',
      product_type: 'one_time_pack',
      name_en: '10 Credits Pack',
      name_hi: '10 क्रेडिट पैक',
      description_en: '10 one-time credits for any feature',
      credits: 10,
      price_inr: 49.00,
      price_usd: 0.99,
      currency: 'INR',
      validity_days: 30,
      is_active: true,
    },
    {
      product_id: 'credit_pack_50',
      product_type: 'one_time_pack',
      name_en: '50 Credits Pack',
      name_hi: '50 क्रेडिट पैक',
      credits: 50,
      price_inr: 199.00,
      price_usd: 2.49,
      currency: 'INR',
      validity_days: 30,
      is_featured: true,
      is_active: true,
      badge: 'Best Value',
    },
    {
      product_id: 'deprecated_pack',
      product_type: 'one_time_pack',
      name_en: 'Old Pack',
      credits: 5,
      price_inr: 29.00,
      is_active: false,  // inactive product — should be filtered out
    },
    {
      product_id: 'kundli_full_report',
      product_type: 'one_time_report',
      name_en: 'Full Kundli Report',
      name_hi: 'पूर्ण कुंडली रिपोर्ट',
      description_en: 'Complete detailed kundli analysis',
      credits: 10,
      price_inr: 399.00,
      price_usd: 4.99,
      currency: 'INR',
      is_active: true,
    },
  ],
};

const MOCK_CATALOG_SPLIT_KEYS = {
  subscriptions: [
    {
      productId: 'pro_monthly',
      productType: 'subscription',
      nameEn: 'Pro Monthly',
      nameHi: 'प्रो मासिक',
      tier: 'pro',
      priceInr: 199.00,
      priceUsd: 2.49,
      credits: 300,
      validityDays: 30,
      isRecommended: true,
      isFeatured: true,
      isActive: true,
    },
  ],
  creditPacks: [
    {
      productId: 'credit_pack_10',
      productType: 'one_time_pack',
      nameEn: '10 Credits Pack',
      nameHi: '10 क्रेडिट पैक',
      credits: 10,
      priceInr: 49.00,
      priceUsd: 0.99,
      validityDays: 30,
      isFeatured: false,
      isActive: true,
    },
  ],
};

const MOCK_CATALOG_WITH_REPORTS = {
  reports: [
    {
      productId: 'kundli_report',
      productType: 'one_time_report',
      nameEn: 'Kundli Report',
      nameHi: 'कुंडली रिपोर्ट',
      credits: 10,
      priceInr: 399.00,
      isActive: true,
    },
  ],
};

// ─── Mock Data: Balance (documented shape with _remaining fields) ───

const MOCK_BALANCE_DOCUMENTED = {
  total_credits_remaining: 230,
  user_tier: 'pro',
  subscription_cycle_end: '2026-06-14T23:59:59Z',
  // Documented field names (with _remaining suffix):
  subscription_credits_remaining: 180,
  pack_credits_remaining: 50,
  active_pack_count: 1,
  // Documented camelCase active_packs (per API spec):
  active_packs: [
    {
      id: 'pack_abc123',
      productId: 'credit_pack_50',
      productName: '50 Credits Pack',
      creditsTotal: 50,
      creditsRemaining: 50,
      expiresAt: '2026-07-14T23:59:59Z',
    },
  ],
};

const MOCK_BALANCE_MINIMAL = {
  credits: 30,
  tier: 'free',
};

// ─── Mock Data: History (documented ledger shape, real action values) ───

const MOCK_HISTORY_DOCUMENTED = {
  entries: [
    {
      // Consumption: chat_message action (real backend value, not "consume" category)
      id: 'entry_001',
      action: 'chat_message',           // documented: action IS the feature name
      creditsDelta: -2,                 // documented: camelCase, signed (-1 for consume)
      balanceAfter: 228,                // documented: camelCase balanceAfter
      sourceType: 'subscription',       // documented: camelCase sourceType
      sourceId: 'sub_abc123',
      created_at: '2026-05-14T10:30:00Z',
      description: 'Chat with Navi',
    },
    {
      // Consumption: guided_consult action
      id: 'entry_002',
      action: 'guided_consult',
      creditsDelta: -5,
      balanceAfter: 223,
      sourceType: 'subscription',
      sourceId: 'sub_abc123',
      created_at: '2026-05-14T09:00:00Z',
    },
    {
      // Grant: explicit grant action
      id: 'entry_003',
      action: 'grant',
      creditsDelta: 50,
      balanceAfter: 50,
      sourceType: 'admin',
      sourceId: 'admin_grant_xyz',
      created_at: '2026-05-01T00:00:00Z',
      description: 'Welcome bonus credits',
    },
    {
      // Refund: explicit refund action
      id: 'entry_004',
      action: 'refund',
      creditsDelta: 2,
      balanceAfter: 230,
      sourceType: 'refund',
      sourceId: 'ref_xyz',
      reservationStatus: 'refunded',     // documented values: reserved, confirmed, refunded, expired
      created_at: '2026-05-14T10:35:00Z',
      description: 'Refund for failed chat',
    },
    {
      // Consumption: kundli_report action
      id: 'entry_005',
      action: 'kundli_report',
      creditsDelta: -10,
      balanceAfter: 213,
      sourceType: 'subscription',
      sourceId: 'sub_abc123',
      created_at: '2026-05-14T11:00:00Z',
      description: 'Kundli report generated',
    },
    {
      // Purchase: pack_purchase action
      id: 'entry_006',
      action: 'pack_purchase',
      creditsDelta: 100,
      balanceAfter: 313,
      sourceType: 'purchase',
      sourceId: 'purch_xyz',
      created_at: '2026-05-14T12:00:00Z',
      description: 'Purchased 100 credit pack',
    },
    {
      // Cycle reset: subscription_cycle_reset
      id: 'entry_007',
      action: 'subscription_cycle_reset',
      creditsDelta: 300,
      balanceAfter: 300,
      sourceType: 'subscription',
      sourceId: 'sub_abc123',
      created_at: '2026-05-01T00:00:00Z',
      description: 'Monthly credit reset',
    },
  ],
  total: 100,
  has_more: true,
};

// ─── Test: Catalog Normalization ────────────────────────────────

test.describe('Catalog Normalization', () => {
  test('flat products array with product_type is correctly split into subscriptions, packs, and reports', () => {
    const result = normalizeCatalogResponse(MOCK_CATALOG_FLAT_PRODUCTS);

    // Should have 2 subscriptions (pro_monthly, premium_monthly)
    expect(result.subscriptions.length).toBe(2);
    // Should have 2 packs (credit_pack_10, credit_pack_50) — deprecated_pack filtered out
    expect(result.creditPacks.length).toBe(2);
    // Should have 1 report (kundli_full_report)
    expect(result.reports.length).toBe(1);

    // Deprecated/inactive product should be filtered out
    const allIds = [
      ...result.subscriptions.map(s => s.productId),
      ...result.creditPacks.map(p => p.productId),
      ...result.reports.map(r => r.productId),
    ];
    expect(allIds).not.toContain('deprecated_pack');
  });

  test('snake_case fields are mapped to camelCase frontend fields', () => {
    const result = normalizeCatalogResponse(MOCK_CATALOG_FLAT_PRODUCTS);
    const proMonthly = result.subscriptions.find(s => s.productId === 'pro_monthly');
    expect(proMonthly).toBeDefined();

    // Snake_case → camelCase mappings
    expect(proMonthly!.productId).toBe('pro_monthly');
    expect(proMonthly!.productType).toBe('subscription');
    expect(proMonthly!.nameEn).toBe('Pro Monthly');
    expect(proMonthly!.nameHi).toBe('प्रो मासिक');
    expect(proMonthly!.descriptionEn).toBe('Extended daily access to Navi features');
    expect(proMonthly!.descriptionHi).toBe('नवी सुविधाओं का विस्तारित दैनिक उपयोग');
    expect(proMonthly!.tier).toBe('pro');
    expect(proMonthly!.priceInr).toBe(199);
    expect(proMonthly!.priceUsd).toBe(2.49);
    expect(proMonthly!.credits).toBe(300);
    expect(proMonthly!.validityDays).toBe(30); // cycle_days → validityDays
    expect(proMonthly!.isFeatured).toBe(true);
    expect(proMonthly!.isActive).toBe(true);
  });

  test('one_time_report product_type is correctly parsed', () => {
    const result = normalizeCatalogResponse(MOCK_CATALOG_FLAT_PRODUCTS);
    const report = result.reports[0];
    expect(report).toBeDefined();
    expect(report.productType).toBe('one_time_report');
    expect(report.productId).toBe('kundli_full_report');
    expect(report.nameEn).toBe('Full Kundli Report');
    expect(report.credits).toBe(10);
    expect(report.priceInr).toBe(399.00);
  });

  test('sale_price_inr and sale_ends_at are preserved', () => {
    const result = normalizeCatalogResponse(MOCK_CATALOG_FLAT_PRODUCTS);
    const premiumMonthly = result.subscriptions.find(s => s.productId === 'premium_monthly');
    expect(premiumMonthly).toBeDefined();

    expect(premiumMonthly!.salePriceInr).toBe(399.00);
    expect(premiumMonthly!.saleEndsAt).toBe('2026-06-30T23:59:59Z');
  });

  test('is_featured flag is preserved for auto-highlighting', () => {
    const result = normalizeCatalogResponse(MOCK_CATALOG_FLAT_PRODUCTS);

    // pro_monthly is featured
    const proMonthly = result.subscriptions.find(s => s.productId === 'pro_monthly');
    expect(proMonthly!.isFeatured).toBe(true);

    // premium_monthly is not featured
    const premiumMonthly = result.subscriptions.find(s => s.productId === 'premium_monthly');
    expect(premiumMonthly!.isFeatured).toBe(false);
  });

  test('explicit subscriptions/creditPacks/reports keys work without flat products fallback', () => {
    const result = normalizeCatalogResponse(MOCK_CATALOG_SPLIT_KEYS);

    expect(result.subscriptions.length).toBe(1);
    expect(result.creditPacks.length).toBe(1);

    expect(result.subscriptions[0].productId).toBe('pro_monthly');
    expect(result.creditPacks[0].productId).toBe('credit_pack_10');
  });

  test('explicit reports key is parsed', () => {
    const result = normalizeCatalogResponse(MOCK_CATALOG_WITH_REPORTS);
    expect(result.reports.length).toBe(1);
    expect(result.reports[0].productType).toBe('one_time_report');
    expect(result.reports[0].productId).toBe('kundli_report');
  });

  test('nested data key is unwrapped', () => {
    const nested = { data: MOCK_CATALOG_FLAT_PRODUCTS };
    const result = normalizeCatalogResponse(nested);

    // Should unwrap data and process normally
    expect(result.subscriptions.length).toBe(2);
    expect(result.creditPacks.length).toBe(2);
    expect(result.reports.length).toBe(1);
  });

  test('null/undefined input returns empty catalog', () => {
    expect(normalizeCatalogResponse(null).subscriptions.length).toBe(0);
    expect(normalizeCatalogResponse(undefined).subscriptions.length).toBe(0);
    expect(normalizeCatalogResponse('string').subscriptions.length).toBe(0);
  });

  test('isSubscription, isCreditPack, and isOneTimeReport correctly identify product types', () => {
    const result = normalizeCatalogResponse(MOCK_CATALOG_FLAT_PRODUCTS);

    for (const sub of result.subscriptions) {
      expect(isSubscription(sub)).toBe(true);
      expect(isCreditPack(sub)).toBe(false);
      expect(isOneTimeReport(sub)).toBe(false);
    }

    for (const pack of result.creditPacks) {
      expect(isSubscription(pack)).toBe(false);
      expect(isCreditPack(pack)).toBe(true);
      expect(isOneTimeReport(pack)).toBe(false);
    }

    for (const report of result.reports) {
      expect(isSubscription(report)).toBe(false);
      expect(isCreditPack(report)).toBe(false);
      expect(isOneTimeReport(report)).toBe(true);
    }
  });
});

// ─── Test: Balance Normalization ────────────────────────────────

test.describe('Balance Normalization', () => {
  test('total_credits_remaining maps to credits', () => {
    const result = normalizeBalanceResponse(MOCK_BALANCE_DOCUMENTED);
    expect(result).not.toBeNull();
    expect(result!.credits).toBe(230);
  });

  test('user_tier maps to tier', () => {
    const result = normalizeBalanceResponse(MOCK_BALANCE_DOCUMENTED);
    expect(result!.tier).toBe('pro');
  });

  test('subscription_cycle_end maps to nextRenewalAt', () => {
    const result = normalizeBalanceResponse(MOCK_BALANCE_DOCUMENTED);
    expect(result!.nextRenewalAt).toBe('2026-06-14T23:59:59Z');
  });

  test('subscription_credits_remaining maps to subscriptionCredits (documented field name)', () => {
    const result = normalizeBalanceResponse(MOCK_BALANCE_DOCUMENTED);
    expect(result!.subscriptionCredits).toBe(180);
  });

  test('pack_credits_remaining maps to packCredits (documented field name)', () => {
    const result = normalizeBalanceResponse(MOCK_BALANCE_DOCUMENTED);
    expect(result!.packCredits).toBe(50);
  });

  test('documented camelCase active_packs items are normalized to ActivePack objects', () => {
    const result = normalizeBalanceResponse(MOCK_BALANCE_DOCUMENTED);
    expect(result!.activePacks).not.toBeNull();
    expect(result!.activePacks!.length).toBe(1);

    const pack = result!.activePacks![0];
    // The documented API uses "id" not "pack_id"
    expect(pack.packId).toBe('pack_abc123');
    expect(pack.productId).toBe('credit_pack_50');
    expect(pack.productName).toBe('50 Credits Pack');
    expect(pack.creditsRemaining).toBe(50);
    expect(pack.creditsTotal).toBe(50);
    expect(pack.expiresAt).toBe('2026-07-14T23:59:59Z');
    // nameEn should fall back to productName when name_en is missing
    expect(pack.nameEn).toBe('50 Credits Pack');
  });

  test('active_pack_count is extracted from documented field', () => {
    const result = normalizeBalanceResponse(MOCK_BALANCE_DOCUMENTED);
    expect(result!.activePackCount).toBe(1);
  });

  test('nearestPackExpiry is computed from active packs', () => {
    const result = normalizeBalanceResponse(MOCK_BALANCE_DOCUMENTED);
    // Only one pack, so its expiry is the nearest
    expect(result!.nearestPackExpiry).toBe('2026-07-14T23:59:59Z');
  });

  test('snake_case active_packs variant is also handled (defensive)', () => {
    const balanceWithSnakeCasePacks = {
      total_credits_remaining: 100,
      tier: 'pro',
      active_packs: [
        {
          pack_id: 'pack_snake',
          product_id: 'pack_test',
          credits_remaining: 10,
          credits_total: 20,
          pack_expires_at: '2026-12-31T00:00:00Z',
          name_en: 'Test Pack',
          name_hi: 'टेस्ट पैक',
        },
      ],
    };
    const result = normalizeBalanceResponse(balanceWithSnakeCasePacks);
    expect(result).not.toBeNull();
    expect(result!.activePacks).not.toBeNull();
    expect(result!.activePacks!.length).toBe(1);

    const pack = result!.activePacks![0];
    expect(pack.packId).toBe('pack_snake');
    expect(pack.productId).toBe('pack_test');
    expect(pack.creditsRemaining).toBe(10);
    expect(pack.creditsTotal).toBe(20);
    expect(pack.expiresAt).toBe('2026-12-31T00:00:00Z');
    expect(pack.nameEn).toBe('Test Pack');
    expect(pack.nameHi).toBe('टेस्ट पैक');
  });

  test('legacy short field names (subscription_credits, pack_credits) are still recognized', () => {
    // Backend may return shorter names during migration — still should work
    const balanceWithShortNames = {
      total_credits_remaining: 200,
      user_tier: 'premium',
      subscription_credits: 150,
      pack_credits: 50,
    };
    const result = normalizeBalanceResponse(balanceWithShortNames);
    expect(result).not.toBeNull();
    expect(result!.subscriptionCredits).toBe(150);
    expect(result!.packCredits).toBe(50);
  });

  test('minimal balance with just credits and tier works', () => {
    const result = normalizeBalanceResponse(MOCK_BALANCE_MINIMAL);
    expect(result).not.toBeNull();
    expect(result!.credits).toBe(30);
    expect(result!.tier).toBe('free');
    expect(result!.subscriptionCredits).toBeNull();
    expect(result!.packCredits).toBeNull();
    expect(result!.activePacks).toBeNull();
    expect(result!.nextRenewalAt).toBeNull();
  });

  test('null/undefined/missing credits returns null', () => {
    expect(normalizeBalanceResponse(null)).toBeNull();
    expect(normalizeBalanceResponse(undefined)).toBeNull();
    expect(normalizeBalanceResponse({ tier: 'pro' })).toBeNull(); // no credits field
  });

  test('data nesting is unwrapped', () => {
    const nested = { data: MOCK_BALANCE_DOCUMENTED };
    const result = normalizeBalanceResponse(nested);
    expect(result).not.toBeNull();
    expect(result!.credits).toBe(230);
  });
});

// ─── Test: History Normalization (real action values) ──────────

test.describe('History Normalization', () => {
  test('entries array is correctly normalized', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    expect(result).not.toBeNull();
    expect(result!.entries.length).toBe(7);
    expect(result!.total).toBe(100);
    expect(result!.hasMore).toBe(true);
  });

  test('action field preserves real backend value (not abstract category)', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    // The raw action should be the documented value, not "consume"
    expect(entries[0].action).toBe('chat_message');
    expect(entries[1].action).toBe('guided_consult');
    expect(entries[2].action).toBe('grant');
    expect(entries[3].action).toBe('refund');
    expect(entries[4].action).toBe('kundli_report');
    expect(entries[5].action).toBe('pack_purchase');
    expect(entries[6].action).toBe('subscription_cycle_reset');
  });

  test('actionCategory is correctly derived from action + creditsDelta', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    // Feature-specific actions → "usage" category
    expect(entries[0].actionCategory).toBe('usage');   // chat_message
    expect(entries[1].actionCategory).toBe('usage');   // guided_consult
    expect(entries[4].actionCategory).toBe('usage');   // kundli_report

    // Explicit grant → "grant" category
    expect(entries[2].actionCategory).toBe('grant');   // grant

    // Explicit refund → "refund" category
    expect(entries[3].actionCategory).toBe('refund');  // refund

    // Purchase → "purchase" category
    expect(entries[5].actionCategory).toBe('purchase'); // pack_purchase

    // Cycle reset → "grant" category
    expect(entries[6].actionCategory).toBe('grant');   // subscription_cycle_reset
  });

  test('featureKey is derived from action for feature-specific actions', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    // Feature-specific actions: action IS the feature key
    expect(entries[0].featureKey).toBe('chat_message');
    expect(entries[1].featureKey).toBe('guided_consult');
    expect(entries[4].featureKey).toBe('kundli_report');

    // Non-feature actions: featureKey falls back to 'unknown' when no explicit field
    // (since the documented entry doesn't have a feature_key field)
    // In practice the backend may add it, but the normalizer handles both.
  });

  test('featureNameEn/Hi fall back to ACTION_DISPLAY_NAMES when not in payload', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    // chat_message has no feature_name_en in the mock — should derive from ACTION_DISPLAY_NAMES
    expect(entries[0].featureNameEn).toBe('AI Chat');
    expect(entries[0].featureNameHi).toBe('AI चैट');

    // guided_consult
    expect(entries[1].featureNameEn).toBe('Guided Consult');
    expect(entries[1].featureNameHi).toBe('निर्देशित परामर्श');

    // grant
    expect(entries[2].featureNameEn).toBe('Credit Grant');
    expect(entries[2].featureNameHi).toBe('क्रेडिट अनुदान');

    // pack_purchase
    expect(entries[5].featureNameEn).toBe('Pack Purchase');
    expect(entries[5].featureNameHi).toBe('पैक खरीद');
  });

  test('feature_name_en from payload takes priority over ACTION_DISPLAY_NAMES', () => {
    // Payload with explicit feature_name fields should win
    const historyWithFeatureNames = {
      entries: [
        {
          id: 'entry_001',
          action: 'chat_message',
          feature_name_en: 'Custom Chat Name',
          feature_name_hi: 'कस्टम चैट',
          creditsDelta: -1,
          created_at: '2026-05-14T10:30:00Z',
        },
      ],
      total: 1,
      has_more: false,
    };
    const result = normalizeHistoryResponse(historyWithFeatureNames);
    const entry = result!.entries[0];
    expect(entry.featureNameEn).toBe('Custom Chat Name');
    expect(entry.featureNameHi).toBe('कस्टम चैट');
  });

  test('creditsDelta (camelCase, signed) maps correctly', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    // consume: negative delta
    expect(entries[0].creditsDelta).toBe(-2);   // chat_message
    expect(entries[1].creditsDelta).toBe(-5);   // guided_consult
    expect(entries[4].creditsDelta).toBe(-10);  // kundli_report

    // gain: positive delta
    expect(entries[2].creditsDelta).toBe(50);   // grant
    expect(entries[3].creditsDelta).toBe(2);    // refund
    expect(entries[5].creditsDelta).toBe(100);  // pack_purchase
    expect(entries[6].creditsDelta).toBe(300);  // subscription_cycle_reset
  });

  test('balanceAfter maps correctly (documented camelCase field)', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    expect(entries[0].balanceAfter).toBe(228);
    expect(entries[1].balanceAfter).toBe(223);
    expect(entries[2].balanceAfter).toBe(50);
    expect(entries[3].balanceAfter).toBe(230);
    expect(entries[4].balanceAfter).toBe(213);
    expect(entries[5].balanceAfter).toBe(313);
    expect(entries[6].balanceAfter).toBe(300);
  });

  test('sourceType maps correctly (documented camelCase field)', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    expect(entries[0].sourceType).toBe('subscription');
    expect(entries[1].sourceType).toBe('subscription');
    expect(entries[2].sourceType).toBe('admin');
    expect(entries[3].sourceType).toBe('refund');
    expect(entries[4].sourceType).toBe('subscription');
    expect(entries[5].sourceType).toBe('purchase');
    expect(entries[6].sourceType).toBe('subscription');
  });

  test('sourceId is preserved from documented payload', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    expect(entries[0].sourceId).toBe('sub_abc123');
    expect(entries[2].sourceId).toBe('admin_grant_xyz');
    expect(entries[5].sourceId).toBe('purch_xyz');
  });

  test('reservationStatus maps correctly (documented values: reserved, confirmed, refunded, expired)', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    // Most entries have no reservationStatus
    expect(entries[0].reservationStatus).toBeNull();
    expect(entries[1].reservationStatus).toBeNull();
    expect(entries[2].reservationStatus).toBeNull();

    // Refund has "refunded" (documented value, not "released")
    expect(entries[3].reservationStatus).toBe('refunded');

    // Kundli report has no reservationStatus
    expect(entries[4].reservationStatus).toBeNull();
  });

  test('snake_case credits_delta variant is also recognized (defensive)', () => {
    const historySnakeDelta = {
      entries: [
        {
          id: 'entry_snake',
          action: 'chat_message',
          credits_delta: -3,           // snake_case variant
          balance_after: 97,           // snake_case variant
          source_type: 'subscription', // snake_case variant
          created_at: '2026-05-14T12:00:00Z',
        },
      ],
      total: 1,
      has_more: false,
    };
    const result = normalizeHistoryResponse(historySnakeDelta);
    expect(result).not.toBeNull();
    expect(result!.entries[0].creditsDelta).toBe(-3);
    expect(result!.entries[0].balanceAfter).toBe(97);
    expect(result!.entries[0].sourceType).toBe('subscription');
  });

  test('creditsSpent is always positive magnitude regardless of action', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    // All creditsSpent values should be positive (magnitude)
    for (const entry of entries) {
      expect(entry.creditsSpent).toBeGreaterThanOrEqual(0);
    }

    // Specific values = |creditsDelta|
    expect(entries[0].creditsSpent).toBe(2);    // | -2 |
    expect(entries[1].creditsSpent).toBe(5);    // | -5 |
    expect(entries[2].creditsSpent).toBe(50);   // | 50 |
    expect(entries[4].creditsSpent).toBe(10);   // | -10 |
    expect(entries[5].creditsSpent).toBe(100);  // | 100 |
  });

  test('null/undefined input returns null', () => {
    expect(normalizeHistoryResponse(null)).toBeNull();
    expect(normalizeHistoryResponse(undefined)).toBeNull();
  });

  test('data nesting is unwrapped', () => {
    const nested = { data: MOCK_HISTORY_DOCUMENTED };
    const result = normalizeHistoryResponse(nested);
    expect(result).not.toBeNull();
    expect(result!.entries.length).toBe(7);
  });

  test('alternative key names (history, items, records) are tried', () => {
    const withHistoryKey = { history: MOCK_HISTORY_DOCUMENTED.entries, total: 5, has_more: false };
    const result1 = normalizeHistoryResponse(withHistoryKey);
    expect(result1).not.toBeNull();
    expect(result1!.entries.length).toBe(7);

    const withItemsKey = { items: MOCK_HISTORY_DOCUMENTED.entries, count: 5 };
    const result2 = normalizeHistoryResponse(withItemsKey);
    expect(result2).not.toBeNull();
    expect(result2!.entries.length).toBe(7);

    const withRecordsKey = { records: MOCK_HISTORY_DOCUMENTED.entries, total: 5, has_more: false };
    const result3 = normalizeHistoryResponse(withRecordsKey);
    expect(result3).not.toBeNull();
    expect(result3!.entries.length).toBe(7);
  });
});

// ─── Test: Positive/Negative Entry Detection ────────────────────

test.describe('Positive/Negative Ledger Entry Logic', () => {
  test('feature-specific actions are negative (credit losses) via creditsDelta sign', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    const usageEntries = entries.filter(e => e.actionCategory === 'usage');
    for (const entry of usageEntries) {
      expect(entry.creditsDelta).toBeLessThan(0);
    }
  });

  test('grant, refund, purchase, and cycle_reset entries are positive (credit gains)', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    const gainEntries = entries.filter(e => e.actionCategory === 'grant' || e.actionCategory === 'refund' || e.actionCategory === 'purchase');
    for (const entry of gainEntries) {
      expect(entry.creditsDelta).toBeGreaterThan(0);
    }
  });

  test('isPositiveEntry correctly identifies positive entries using creditsDelta', () => {
    const result = normalizeHistoryResponse(MOCK_HISTORY_DOCUMENTED);
    const entries = result!.entries;

    // Positive entries
    const gainEntries = entries.filter(e => e.actionCategory === 'grant' || e.actionCategory === 'refund' || e.actionCategory === 'purchase');
    for (const entry of gainEntries) {
      expect(isPositiveEntry(entry)).toBe(true);
    }

    // Negative entries (usage)
    const usageEntries = entries.filter(e => e.actionCategory === 'usage');
    for (const entry of usageEntries) {
      expect(isPositiveEntry(entry)).toBe(false);
    }
  });

  test('entries without explicit creditsDelta derive it from action + creditsSpent', () => {
    // Entry with no creditsDelta field — normalizer should derive it
    // Feature-specific action → negative delta
    const entryChatMessage = {
      id: 'entry_derived_1',
      action: 'chat_message',
      credits_spent: 3,
      created_at: '2026-05-14T12:00:00Z',
    };
    const history1 = { entries: [entryChatMessage], total: 1, has_more: false };
    const result1 = normalizeHistoryResponse(history1);
    expect(result1!.entries[0].creditsDelta).toBe(-3); // derived: feature action → negative

    // Grant action → positive delta
    const entryGrant = {
      id: 'entry_derived_2',
      action: 'grant',
      credits_spent: 10,
      created_at: '2026-05-14T12:00:00Z',
    };
    const history2 = { entries: [entryGrant], total: 1, has_more: false };
    const result2 = normalizeHistoryResponse(history2);
    expect(result2!.entries[0].creditsDelta).toBe(10); // derived: grant → positive
  });
});

// ─── Test: getActionCategory helper function ───────────────────

test.describe('getActionCategory helper', () => {
  test('feature-specific actions return "usage"', () => {
    expect(getActionCategory('chat_message')).toBe('usage');
    expect(getActionCategory('guided_consult')).toBe('usage');
    expect(getActionCategory('kundli_report')).toBe('usage');
    expect(getActionCategory('match_report')).toBe('usage');
    expect(getActionCategory('monthly_report')).toBe('usage');
    expect(getActionCategory('daily_horoscope_pro')).toBe('usage');
  });

  test('"grant" and "subscription_cycle_reset" return "grant"', () => {
    expect(getActionCategory('grant')).toBe('grant');
    expect(getActionCategory('subscription_cycle_reset')).toBe('grant');
  });

  test('"refund" returns "refund"', () => {
    expect(getActionCategory('refund')).toBe('refund');
  });

  test('"pack_purchase" returns "purchase"', () => {
    expect(getActionCategory('pack_purchase')).toBe('purchase');
  });

  test('unknown action falls back to creditsDelta sign', () => {
    // Positive delta → "grant"
    expect(getActionCategory('unknown_action', 5)).toBe('grant');
    // Negative delta → "usage"
    expect(getActionCategory('unknown_action', -3)).toBe('usage');
    // No delta → "usage"
    expect(getActionCategory('unknown_action')).toBe('usage');
  });
});

// ─── Test: CatalogResponse.reports is always present ──────────

test.describe('CatalogResponse.reports field', () => {
  test('empty input returns reports: []', () => {
    const result = normalizeCatalogResponse(null);
    expect(result.reports).toEqual([]);
  });

  test('catalog without reports returns reports: []', () => {
    const result = normalizeCatalogResponse(MOCK_CATALOG_SPLIT_KEYS);
    expect(result.reports).toEqual([]);
  });
});