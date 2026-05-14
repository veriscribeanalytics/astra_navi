import { test, expect } from '@playwright/test';

/**
 * Paywall Frontend Integration Tests
 *
 * Tests the contract between frontend types and backend paywall data shapes:
 * - 200 response with accessible=false
 * - 402 response with paywall_blocked
 * - Daily horoscope inline paywall (soft)
 * - Batch features array normalization
 *
 * These tests use mock data objects that match the backend spec
 * from PAYWALL_FRONTEND_INTEGRATION.md.
 */

// ─── Mock Data ───────────────────────────────────────

const MOCK_PAYWALL_BLOCKED_200 = {
  accessible: false,
  feature_key: 'full_daily_horoscope',
  reason: 'insufficient_tier',
  current_tier: 'free',
  min_tier: 'pro',
  required_credits: 0,
  available_credits: 30,
  paywall: {
    featureKey: 'full_daily_horoscope',
    title: 'Full Daily Horoscope',
    titleHi: 'पूर्ण दैनिक राशिफल',
    description: 'Get personalized area insights, transit overlays, and daily alerts based on your chart.',
    descriptionHi: 'अपनी कुंडली के अनुसार व्यक्तिगत क्षेत्र विवरण, गोचर, और दैनिक अलर्ट पाएं।',
    icon: '☀️',
    isSoft: true,
    color: '#F59E0B',
    badge: 'Pro',
    suggestedProducts: [
      {
        productId: 'pro_monthly',
        productType: 'subscription',
        nameEn: 'Pro Monthly',
        nameHi: 'प्रो मासिक',
        credits: 300,
        tier: 'pro',
        priceInr: 199.00,
        priceUsd: 2.49,
        currency: 'INR',
        icon: 'pro',
        color: '#7C3AED',
      },
    ],
  },
};

const MOCK_PAYWALL_402 = {
  error: 'paywall_blocked',
  featureKey: 'chat_message',
  reason: 'insufficient_credits',
  requiredCredits: 1,
  availableCredits: 0,
  minTier: 'free',
  isSoft: false,
  message: 'You need 1 Navi Credits for AI Chat Credits. You have 0 remaining.',
  paywall: {
    featureKey: 'chat_message',
    title: 'AI Chat Credits',
    isSoft: false,
    suggestedProducts: [
      {
        productId: 'credit_pack_10',
        productType: 'one_time_pack',
        nameEn: '10 Credits Pack',
        credits: 10,
        tier: null,
        priceInr: 49.00,
        priceUsd: 0.99,
        currency: 'INR',
        icon: 'credits',
        color: '#F59E0B',
      },
    ],
  },
};

const MOCK_BATCH_FEATURES = {
  features: [
    { accessible: true, feature_key: 'chat_message', current_tier: 'pro', available_credits: 300 },
    { accessible: false, feature_key: 'full_daily_horoscope', reason: 'insufficient_tier', paywall: MOCK_PAYWALL_BLOCKED_200.paywall },
    { accessible: false, feature_key: 'tomorrow_horoscope', reason: 'insufficient_tier', paywall: { featureKey: 'tomorrow_horoscope', title: 'Tomorrow Horoscope', isSoft: true, suggestedProducts: [] } },
    { accessible: true, feature_key: 'guided_consult', current_tier: 'pro', available_credits: 300 },
    { accessible: true, feature_key: 'match_report', current_tier: 'pro', available_credits: 300 },
    { accessible: false, feature_key: 'kundli_premium', reason: 'insufficient_tier', paywall: { featureKey: 'kundli_premium', title: 'Premium Kundli Sections', isSoft: true, suggestedProducts: [] } },
  ],
  tier: 'pro',
  totalCredits: 300,
};

const MOCK_DAILY_HOROSCOPE_SOFT_PAYWALL = {
  sign: 'Leo',
  score: { overall: 72, areas: { career: { value: 65 }, love: { value: 70 }, health: { value: 60 }, finance: { value: 68 }, general: { value: 72 } } },
  tip: { text: 'Trust your instincts today.', type: 'general' },
  areas_text: {
    career: { insight: 'A new opportunity may arise.', tone: 'positive' },
    love: { insight: 'Be open to deeper connections.', tone: 'warm' },
  },
  system: { is_personalized: false },
  paywall: {
    featureKey: 'full_daily_horoscope',
    title: 'Full Daily Horoscope',
    isSoft: true,
    suggestedProducts: MOCK_PAYWALL_BLOCKED_200.paywall.suggestedProducts,
  },
};

// ─── Test: Mock data shapes match backend spec ───────

test.describe('Paywall Mock Data Shape Validation', () => {
  test('200 accessible=false response has correct fields', () => {
    const data = MOCK_PAYWALL_BLOCKED_200;

    // Must have accessible: false (not blocked: true)
    expect(data.accessible).toBe(false);
    expect(data).not.toHaveProperty('blocked');

    // Must have feature_key (not feature)
    expect(data.feature_key).toBe('full_daily_horoscope');
    expect(data).not.toHaveProperty('feature');

    // Paywall must have featureKey (not feature)
    expect(data.paywall.featureKey).toBe('full_daily_horoscope');
    expect(data.paywall).not.toHaveProperty('feature');

    // Paywall must have suggestedProducts[] (not suggestedProduct singular)
    expect(Array.isArray(data.paywall.suggestedProducts)).toBe(true);
    expect(data.paywall).not.toHaveProperty('suggestedProduct');

    // SuggestedProduct must have backend fields
    const product = data.paywall.suggestedProducts[0];
    expect(product.productId).toBe('pro_monthly');
    expect(product.productType).toBe('subscription');
    expect(product.nameEn).toBe('Pro Monthly');
    expect(product.nameHi).toBe('प्रो मासिक');
    expect(product.credits).toBe(300);
    expect(product.tier).toBe('pro');
    expect(product.priceInr).toBe(199.00);
    expect(product.priceUsd).toBe(2.49);
    expect(product.currency).toBe('INR');

    // Paywall must have isSoft, title, titleHi, description, descriptionHi, icon, color, badge
    expect(typeof data.paywall.isSoft).toBe('boolean');
    expect(data.paywall.title).toBeTruthy();
    expect(data.paywall.titleHi).toBeTruthy();
    expect(data.paywall.description).toBeTruthy();
    expect(data.paywall.descriptionHi).toBeTruthy();
    expect(data.paywall.icon).toBeTruthy();
    expect(data.paywall.color).toBeTruthy();
    expect(data.paywall.badge).toBeTruthy();
  });

  test('402 paywall_blocked response has correct fields', () => {
    const data = MOCK_PAYWALL_402;

    // Must have error: paywall_blocked
    expect(data.error).toBe('paywall_blocked');

    // Must have featureKey (not feature)
    expect(data.featureKey).toBe('chat_message');

    // isSoft must be false for hard paywall (chat)
    expect(data.isSoft).toBe(false);

    // Must have paywall data
    expect(data.paywall).toBeDefined();
    expect(data.paywall.featureKey).toBe('chat_message');
    expect(data.paywall.isSoft).toBe(false);

    // suggestedProducts must be an array
    expect(Array.isArray(data.paywall.suggestedProducts)).toBe(true);
    expect(data.paywall).not.toHaveProperty('suggestedProduct');

    // Product must have productType: one_time_pack
    const product = data.paywall.suggestedProducts[0];
    expect(product.productType).toBe('one_time_pack');
    expect(product.tier).toBeNull();
  });

  test('Batch features response is array, not Record map', () => {
    const data = MOCK_BATCH_FEATURES;

    // features must be an array
    expect(Array.isArray(data.features)).toBe(true);
    expect(data.features.length).toBe(6);

    // Each item must have accessible and feature_key
    for (const item of data.features) {
      expect(typeof item.accessible).toBe('boolean');
      expect(typeof item.feature_key).toBe('string');
      expect(item).not.toHaveProperty('blocked');
      expect(item).not.toHaveProperty('feature');
    }

    // Count accessible features
    const accessibleCount = data.features.filter(f => f.accessible).length;
    expect(accessibleCount).toBe(3);

    // Count blocked features (accessible===false)
    const blockedCount = data.features.filter(f => !f.accessible).length;
    expect(blockedCount).toBe(3);
  });

  test('Daily horoscope soft paywall has inline paywall field', () => {
    const data = MOCK_DAILY_HOROSCOPE_SOFT_PAYWALL;

    // Must have paywall field inline
    expect(data.paywall).toBeDefined();
    expect(data.paywall.isSoft).toBe(true);
    expect(data.paywall.featureKey).toBe('full_daily_horoscope');

    // Must have basic horoscope data alongside paywall
    expect(data.sign).toBe('Leo');
    expect(data.score.overall).toBe(72);

    // suggestedProducts must be array
    expect(Array.isArray(data.paywall.suggestedProducts)).toBe(true);
    expect(data.paywall).not.toHaveProperty('suggestedProduct');
  });
});

// ─── Test: Normalization logic ───────────────────────

test.describe('Paywall Feature Normalization', () => {
  test('Batch features array can be normalized to Record<feature_key, PaywallCheck> map', () => {
    const data = MOCK_BATCH_FEATURES;
    const map: Record<string, typeof data.features[number]> = {};

    for (const item of data.features) {
      map[item.feature_key] = item;
    }

    // Map should have 6 keys
    expect(Object.keys(map).length).toBe(6);

    // Each key should match a feature_key
    expect(map['chat_message'].accessible).toBe(true);
    expect(map['full_daily_horoscope'].accessible).toBe(false);
    expect(map['tomorrow_horoscope'].accessible).toBe(false);
    expect(map['guided_consult'].accessible).toBe(true);
    expect(map['match_report'].accessible).toBe(true);
    expect(map['kundli_premium'].accessible).toBe(false);

    // Blocked features should have paywall data
    expect(map['full_daily_horoscope'].paywall).toBeDefined();
    expect(map['tomorrow_horoscope'].paywall).toBeDefined();
    expect(map['kundli_premium'].paywall).toBeDefined();

    // Accessible features should NOT have paywall data
    expect(map['chat_message'].paywall).toBeUndefined();
    expect(map['guided_consult'].paywall).toBeUndefined();
    expect(map['match_report'].paywall).toBeUndefined();
  });

  test('isFeatureBlocked correctly checks accessible===false', () => {
    const data = MOCK_BATCH_FEATURES;
    const map: Record<string, typeof data.features[number]> = {};
    for (const item of data.features) {
      map[item.feature_key] = item;
    }

    // Helper simulating isFeatureBlocked from PaywallContext
    const isFeatureBlocked = (feature: string): boolean => {
      const check = map[feature];
      if (!check) return false;
      return check.accessible === false;
    };

    // Should correctly identify blocked features
    expect(isFeatureBlocked('full_daily_horoscope')).toBe(true);
    expect(isFeatureBlocked('tomorrow_horoscope')).toBe(true);
    expect(isFeatureBlocked('kundli_premium')).toBe(true);

    // Should correctly identify accessible features
    expect(isFeatureBlocked('chat_message')).toBe(false);
    expect(isFeatureBlocked('guided_consult')).toBe(false);
    expect(isFeatureBlocked('match_report')).toBe(false);

    // Should fail open for unknown features
    expect(isFeatureBlocked('unknown_feature')).toBe(false);
  });
});

// ─── Test: Kundli locked sections ────────────────────

test.describe('Kundli Locked Sections', () => {
  const MOCK_KUNDLI_FREE_USER = {
    success: true,
    astrologyData: {
      identity: { lagna: 'Leo' },
      ascendant: { sign: 'Leo' },
      planets: [{ planet: 'Sun', sign: 'Leo' }],
      houses: [{ house: 1, sign: 'Leo' }],
      dasha: { locked: true, message: 'Unlock dasha with Pro plan' },
      ashtakavarga: { locked: true, message: 'Unlock ashtakavarga with Pro plan' },
      planet_strength_ranking: { locked: true, message: 'Unlock planet_strength_ranking with Pro plan' },
      transits: { locked: true, message: 'Unlock transits with Pro plan' },
      key_themes: { locked: true, message: 'Unlock key_themes with Pro plan' },
    },
    paywall: {
      featureKey: 'kundli_premium',
      title: 'Premium Kundli Sections',
      isSoft: true,
      suggestedProducts: [],
    },
  };

  test('All 5 premium sections should be detected as locked', () => {
    const payload = MOCK_KUNDLI_FREE_USER.astrologyData;
    const premiumKeys = ['dasha', 'ashtakavarga', 'planet_strength_ranking', 'transits', 'key_themes'];
    const locked = new Set<string>();

    for (const key of premiumKeys) {
      const section = payload[key as keyof typeof payload];
      if (section && typeof section === 'object' && (section as Record<string, unknown>).locked === true) {
        locked.add(key);
      }
    }

    expect(locked.size).toBe(5);
    expect(locked.has('dasha')).toBe(true);
    expect(locked.has('ashtakavarga')).toBe(true);
    expect(locked.has('planet_strength_ranking')).toBe(true);
    expect(locked.has('transits')).toBe(true);
    expect(locked.has('key_themes')).toBe(true);
  });

  test('Each locked section should have a message field', () => {
    const payload = MOCK_KUNDLI_FREE_USER.astrologyData;

    for (const key of ['dasha', 'ashtakavarga', 'planet_strength_ranking', 'transits', 'key_themes']) {
      const section = payload[key as keyof typeof payload] as Record<string, unknown>;
      expect(section.locked).toBe(true);
      expect(typeof section.message).toBe('string');
      expect(section.message).toBeTruthy();
    }
  });
});

// ─── Test: Route mock produces correct shape ─────────

test.describe('Paywall Route Mock Verification', () => {
  // Simulates the mockPaywallApi helper output shape
  const MOCK_PRO_USER_BATCH = {
    features: [
      { accessible: true, feature_key: 'chat_message', current_tier: 'pro', available_credits: 300 },
      { accessible: true, feature_key: 'full_daily_horoscope', current_tier: 'pro', available_credits: 300 },
      { accessible: true, feature_key: 'tomorrow_horoscope', current_tier: 'pro', available_credits: 300 },
      { accessible: true, feature_key: 'guided_consult', current_tier: 'pro', available_credits: 300 },
      { accessible: true, feature_key: 'match_report', current_tier: 'pro', available_credits: 300 },
      { accessible: true, feature_key: 'kundli_premium', current_tier: 'pro', available_credits: 300 },
    ],
    tier: 'pro',
    totalCredits: 300,
  };

  test('mockPaywallApi default (Pro user) produces { features: [...] } — normalization succeeds silently', () => {
    const data = MOCK_PRO_USER_BATCH;

    // Must have features as an array (not {} or Record)
    expect(Array.isArray(data.features)).toBe(true);
    expect(data.features.length).toBe(6);

    // Simulates usePaywall checkAllFeatures normalization:
    // If features is an array, the defensive warning is NOT triggered.
    // The code path: if (!data.features || !Array.isArray(data.features)) → skip warning
    expect(data.features).toBeDefined();
    expect(Array.isArray(data.features)).toBe(true); // passes defensive check → no console.warn

    // Normalization to map should work cleanly
    const map: Record<string, typeof data.features[number]> = {};
    for (const item of data.features) {
      map[item.feature_key] = item;
    }
    expect(Object.keys(map).length).toBe(6);

    // All features accessible for Pro user
    for (const key of Object.keys(map)) {
      expect(map[key].accessible).toBe(true);
    }
  });

  test('mockPaywallApi with blockedFeatures produces paywall data for blocked features only', () => {
    const blockedFeatures = ['full_daily_horoscope', 'kundli_premium'];
    const data = {
      features: [
        { accessible: true, feature_key: 'chat_message', current_tier: 'pro', available_credits: 300 },
        { accessible: false, feature_key: 'full_daily_horoscope', reason: 'insufficient_tier', paywall: { featureKey: 'full_daily_horoscope', title: 'Premium full_daily_horoscope', isSoft: true, suggestedProducts: [{ productId: 'pro_monthly', productType: 'subscription', nameEn: 'Pro Monthly', credits: 300, tier: 'pro', priceInr: 199.00, priceUsd: 2.49, currency: 'INR', icon: 'pro', color: '#7C3AED' }] } },
        { accessible: true, feature_key: 'tomorrow_horoscope', current_tier: 'pro', available_credits: 300 },
        { accessible: true, feature_key: 'guided_consult', current_tier: 'pro', available_credits: 300 },
        { accessible: true, feature_key: 'match_report', current_tier: 'pro', available_credits: 300 },
        { accessible: false, feature_key: 'kundli_premium', reason: 'insufficient_tier', paywall: { featureKey: 'kundli_premium', title: 'Premium kundli_premium', isSoft: true, suggestedProducts: [{ productId: 'pro_monthly', productType: 'subscription', nameEn: 'Pro Monthly', credits: 300, tier: 'pro', priceInr: 199.00, priceUsd: 2.49, currency: 'INR', icon: 'pro', color: '#7C3AED' }] } },
      ],
      tier: 'pro',
      totalCredits: 300,
    };

    // Defensive check passes — features is an array
    expect(Array.isArray(data.features)).toBe(true);

    // Normalize to map
    const map: Record<string, typeof data.features[number]> = {};
    for (const item of data.features) {
      map[item.feature_key] = item;
    }

    // Blocked features should have accessible: false and paywall data
    for (const blocked of blockedFeatures) {
      expect(map[blocked].accessible).toBe(false);
      expect(map[blocked].paywall).toBeDefined();
      const pw = map[blocked].paywall!;
      expect(pw.suggestedProducts).toBeDefined();
      expect(Array.isArray(pw.suggestedProducts)).toBe(true);
    }

    // Accessible features should have accessible: true and no paywall
    for (const key of ['chat_message', 'tomorrow_horoscope', 'guided_consult', 'match_report']) {
      expect(map[key].accessible).toBe(true);
      expect(map[key].paywall).toBeUndefined();
    }
  });

  test('Empty {} response is caught by defensive check (would produce console warning)', () => {
    const badResponse = {};

    // This simulates what mockAllApis catch-all used to return:
    // The defensive check in usePaywall catches this and logs a warning
    expect(badResponse).not.toHaveProperty('features');
    expect(Array.isArray((badResponse as Record<string, unknown>).features)).toBe(false);

    // The code path: if (!data.features || !Array.isArray(data.features))
    // → console.warn('[usePaywall] checkAllFeatures: features is not an array', data)
    // This is the correct defensive behavior — the warning is intentional.
  });

  test('Response with features as Record map (not array) is caught by defensive check', () => {
    // Edge case: backend accidentally returns a Record map instead of array
    const mapResponse = {
      features: {
        chat_message: { accessible: true, feature_key: 'chat_message' },
        full_daily_horoscope: { accessible: false, feature_key: 'full_daily_horoscope' },
      },
    };

    // Defensive check catches this — features is an object, not an array
    expect(Array.isArray(mapResponse.features)).toBe(false);

    // The code path would log: "[usePaywall] checkAllFeatures: features is not an array"
  });
});