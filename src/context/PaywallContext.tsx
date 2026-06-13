'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { usePaywall } from '@/hooks/usePaywall';
import { clientFetch } from '@/lib/apiClient';
import { normalizeBalanceResponse, BalanceResponse, CatalogResponse, normalizeCatalogResponse } from '@/types/billing';
import {
  PaywallFeatureKey,
  PaywallData,
  PaywallFeatureMap,
} from '@/types/paywall';

interface PaywallContextType {
  /** Map of feature key → PaywallCheck result. Null until batch check completes. */
  features: PaywallFeatureMap | null;
  /** The user's current subscription tier. */
  tier: string | null;
  /** Total remaining credits across all features. */
  totalCredits: number | null;
  /** Full balance response object with subscription/pack breakdown, active packs, etc. */
  balance: BalanceResponse | null;
  /** Whether the batch check is currently loading. */
  isLoading: boolean;
  /** Whether the batch check has been completed at least once. */
  isLoaded: boolean;
  /** Check if a specific feature is blocked (accessible===false). */
  isFeatureBlocked: (feature: PaywallFeatureKey) => boolean;
  /** Get PaywallData for a specific feature (if accessible===false). */
  getFeaturePaywall: (feature: PaywallFeatureKey) => PaywallData | null;
  /** Force a refresh of the batch check. */
  refresh: () => Promise<void>;
  /** Monotonic counter bumped on every refresh(). Sibling billing sections
   *  (CurrentPlanSection, CreditHistory) include this in their effect deps so
   *  they refetch together after a purchase, instead of going stale until reload. */
  refreshVersion: number;
  /** Current paywall from any source (402 response, individual check, etc.). */
  activePaywall: PaywallData | null;
  /** Clear the active paywall state. */
  clearActivePaywall: () => void;
  /** Dynamically loaded catalog response. */
  catalog: CatalogResponse | null;
  /** Color of the user's current tier, dynamically retrieved from the catalog API. */
  tierColor: string;
  /** Resolve any subscription tier to its catalog color. */
  getTierColor: (tier?: string | null) => string;
}

const PaywallContext = createContext<PaywallContextType | undefined>(undefined);

const DEFAULT_TIER_COLORS: Record<string, string> = {
  free: '#6B7280',
  pro: '#7C3AED',
  premium: '#D97706',
};

export const PaywallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { checkAllFeatures, setPaywall } = usePaywall();
  const [features, setFeatures] = useState<PaywallFeatureMap | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [totalCredits, setTotalCredits] = useState<number | null>(null);
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePaywall, setActivePaywall] = useState<PaywallData | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const hasFetchedRef = useRef(false);

  // Batch check on dashboard load when user is authenticated
  const doBatchCheck = useCallback(async () => {
    if (!isLoggedIn) {
      setIsLoading(true);
      try {
        const catRes = await clientFetch('/api/entitlements/catalog');
        if (catRes.ok) {
          const catRaw = await catRes.json();
          setCatalog(normalizeCatalogResponse(catRaw));
        }
        setIsLoaded(true);
      } catch (err) {
        console.warn('[PaywallContext] Guest catalog fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(true);
    try {
      // Fetch catalog first
      try {
        const catRes = await clientFetch('/api/entitlements/catalog');
        if (catRes.ok) {
          const catRaw = await catRes.json();
          setCatalog(normalizeCatalogResponse(catRaw));
        }
      } catch (catErr) {
        console.warn('[PaywallContext] Catalog fetch failed:', catErr);
      }

      const result = await checkAllFeatures();
      if (result) {
        // Defensive: ensure features is an array before normalizing
        if (!result.features || !Array.isArray(result.features)) {
          console.warn('[PaywallContext] Batch check returned non-array features:', result);
        } else {
          // Normalize the backend features array into a feature_key → PaywallCheck map
          const map: Partial<PaywallFeatureMap> = {};
          for (const item of result.features) {
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
          setFeatures(map as PaywallFeatureMap);
        }
        setTier(result.tier || null);
        setTotalCredits(result.totalCredits ?? null);
      }

      // Fetch authoritative credit balance from /api/entitlements/balance
      // This is the primary source for totalCredits — paywall/features may not include it.
      try {
        const balRes = await clientFetch('/api/entitlements/balance');
        if (balRes.ok) {
          const balRaw = await balRes.json();
          const balData = normalizeBalanceResponse(balRaw);
          if (balData) {
            setTotalCredits(balData.credits);
            setBalance(balData);
            // Also update tier from balance if paywall/features didn't provide it
            if (!result?.tier) {
              setTier(balData.tier);
            }
          }
        }
      } catch (balErr) {
        // Balance fetch failure is non-critical; totalCredits from paywall/features is the fallback
        console.warn('[PaywallContext] Balance fetch failed, using paywall/features totalCredits:', balErr);
      }

      setIsLoaded(true);
      hasFetchedRef.current = true;
    } catch (err) {
      console.error('[PaywallContext] Batch check failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, checkAllFeatures]);

  // Auto-fetch on login
  useEffect(() => {
    if (authLoading) return;
    if (isLoggedIn && !hasFetchedRef.current) {
      doBatchCheck();
    }
    if (!isLoggedIn) {
      // For guest users, fetch catalog at least once so styles load
      doBatchCheck();
      // Reset on logout
      setFeatures(null);
      setTier(null);
      setTotalCredits(null);
      setBalance(null);
      setIsLoaded(false);
      setActivePaywall(null);
      hasFetchedRef.current = false;
    }
  }, [isLoggedIn, authLoading, doBatchCheck]);

  const isFeatureBlocked = useCallback((feature: PaywallFeatureKey): boolean => {
    if (!features) return false; // Not loaded yet → fail open
    const check = features[feature];
    if (!check) return false;
    return check.accessible === false;
  }, [features]);

  const getFeaturePaywall = useCallback((feature: PaywallFeatureKey): PaywallData | null => {
    if (!features) return null;
    const check = features[feature];
    if (!check) return null;
    if (check.accessible === false && check.paywall) return check.paywall;
    return null;
  }, [features]);

  const refresh = useCallback(async () => {
    hasFetchedRef.current = false;
    await doBatchCheck();
    // Signal sibling billing sections to refetch their own data (subscription,
    // packs, history) so the whole Plans page reflects the purchase together.
    setRefreshVersion(v => v + 1);
  }, [doBatchCheck]);

  const clearActivePaywall = useCallback(() => {
    setActivePaywall(null);
    setPaywall(null);
  }, [setPaywall]);

  const getTierColor = useCallback((requestedTier?: string | null) => {
    const normalizedTier = (requestedTier || 'free').toLowerCase();
    const catalogColor = catalog?.subscriptions.find(
      subscription => subscription.tier?.toLowerCase() === normalizedTier
    )?.color;

    return catalogColor || DEFAULT_TIER_COLORS[normalizedTier] || DEFAULT_TIER_COLORS.free;
  }, [catalog]);

  const tierColor = useMemo(() => getTierColor(tier), [getTierColor, tier]);

  return (
    <PaywallContext.Provider value={{
      features,
      tier,
      totalCredits,
      balance,
      isLoading,
      isLoaded,
      isFeatureBlocked,
      getFeaturePaywall,
      refresh,
      refreshVersion,
      activePaywall,
      clearActivePaywall,
      catalog,
      tierColor,
      getTierColor,
    }}>
      {children}
    </PaywallContext.Provider>
  );
};

export const usePaywallContext = () => {
  const context = useContext(PaywallContext);
  if (context === undefined) {
    throw new Error('usePaywallContext must be used within a PaywallProvider');
  }
  return context;
};
