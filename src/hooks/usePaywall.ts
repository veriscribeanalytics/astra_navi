'use client';

import { useState, useCallback } from 'react';
import { clientFetch } from '@/lib/apiClient';
import {
  PaywallData,
  PaywallFeatureKey,
  PaywallCheck,
  PaywallFeaturesResponse,
  PaywallFeatureMap,
} from '@/types/paywall';

/**
 * usePaywall — hook for checking feature entitlements before premium actions.
 *
 * Provides:
 * - checkFeature(featureKey): Checks a single feature, returns PaywallCheck.
 * - checkAllFeatures(): Fetches all feature statuses in one batch call.
 * - normalizeFeatureMap(): Converts the backend features[] array into a Record<featureKey, PaywallCheck> map.
 * - paywall: The most recent PaywallData from any check.
 */
export function usePaywall() {
  const [paywall, setPaywall] = useState<PaywallData | null>(null);
  const [featureMap, setFeatureMap] = useState<PaywallFeatureMap | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Check a single feature's entitlement status.
   * Returns PaywallCheck: { accessible, feature_key, paywall? }
   * If accessible===false, also sets the local paywall state.
   */
  const checkFeature = useCallback(async (featureKey: PaywallFeatureKey): Promise<PaywallCheck> => {
    setIsLoading(true);
    try {
      const res = await clientFetch(`/api/entitlements/paywall?feature=${encodeURIComponent(featureKey)}`);

      if (res.status === 402) {
        // Feature is blocked — parse paywall data from the 402 response
        const data = await res.json();
        const pw = data.paywall as PaywallData;
        setPaywall(pw);
        return {
          accessible: false,
          feature_key: featureKey,
          reason: data.reason,
          current_tier: data.current_tier,
          min_tier: data.min_tier,
          required_credits: data.required_credits ?? data.requiredCredits,
          available_credits: data.available_credits ?? data.availableCredits,
          paywall: pw,
        };
      }

      if (!res.ok) {
        // Other error — treat as accessible (fail open)
        console.warn('[usePaywall] checkFeature returned status', res.status);
        return { accessible: true, feature_key: featureKey };
      }

      const data = await res.json();
      // Backend may return { accessible: false, paywall: {...} } even on 200
      if (data.accessible === false && data.paywall) {
        setPaywall(data.paywall as PaywallData);
        return data as PaywallCheck;
      }

      // Feature is allowed
      setPaywall(null);
      return { accessible: true, feature_key: featureKey };
    } catch (err) {
      console.error('[usePaywall] checkFeature error:', err);
      // Fail open on network errors
      return { accessible: true, feature_key: featureKey };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Batch check all feature entitlements.
   * Backend returns { features: [...] } array.
   * Returns full PaywallFeaturesResponse and stores normalized map in local state.
   */
  const checkAllFeatures = useCallback(async (): Promise<PaywallFeaturesResponse | null> => {
    setIsLoading(true);
    try {
      const res = await clientFetch('/api/entitlements/paywall/features');

      if (!res.ok) {
        console.warn('[usePaywall] checkAllFeatures returned status', res.status);
        return null;
      }

      const data = await res.json() as PaywallFeaturesResponse;

      // Defensive: ensure features is an array (backend may return error objects)
      if (!data.features || !Array.isArray(data.features)) {
        console.warn('[usePaywall] checkAllFeatures: features is not an array', data);
        return null;
      }

      // Normalize the backend features array into a feature_key → PaywallCheck map
      const map: Partial<PaywallFeatureMap> = {};
      for (const item of data.features) {
        const key = item.feature_key as PaywallFeatureKey;
        map[key] = {
          accessible: item.accessible,
          feature_key: key,
          reason: item.reason,
          current_tier: item.current_tier,
          min_tier: item.min_tier,
          required_credits: item.required_credits,
          available_credits: item.available_credits,
          paywall: item.paywall,
        };
      }
      setFeatureMap(map as PaywallFeatureMap);

      return data;
    } catch (err) {
      console.error('[usePaywall] checkAllFeatures error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear the local paywall state (e.g. after navigating away).
   */
  const clearPaywall = useCallback(() => {
    setPaywall(null);
  }, []);

  return {
    paywall,
    featureMap,
    isLoading,
    checkFeature,
    checkAllFeatures,
    clearPaywall,
    setPaywall,
  };
}