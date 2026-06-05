'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Sparkles, Star, Shield } from 'lucide-react';
import ProductCard from '@/components/billing/ProductCard';
import { CatalogResponse, CatalogProduct, normalizeCatalogResponse } from '@/types/billing';
import { useTranslation } from '@/hooks';
import { clientFetch } from '@/lib/apiClient';

interface ProductCatalogProps {
  /** The product ID to highlight (from URL query param). */
  highlightProductId?: string;
  /** The user's current tier (to mark current plan). */
  currentTier?: string | null;
  /** Handler when user selects a product. */
  onSelectProduct: (product: CatalogProduct) => void;
  /** Optional catalog override — if null, will fetch from API. */
  catalog?: CatalogResponse | null;
  /** Loading state override. */
  isLoading?: boolean;
  /** Optional product_type filter: 'subscription' or 'one_time_pack' or 'one_time_report'. */
  productTypeFilter?: string;
  /** When true, include inactive/hidden products (e.g. test plans). */
  showInactive?: boolean;
}

export default function ProductCatalog({
  highlightProductId,
  currentTier,
  onSelectProduct,
  catalog,
  isLoading = false,
  productTypeFilter,
  showInactive = false,
}: ProductCatalogProps) {
  const { t, language } = useTranslation();
  const [fetchedCatalog, setFetchedCatalog] = useState<CatalogResponse | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  // Fetch catalog if not provided — pass lang for localized names
  useEffect(() => {
    if (catalog) {
      setFetchedCatalog(catalog);
      return;
    }

    setFetchLoading(true);
    const params = new URLSearchParams();
    if (language) params.set('lang', language);
    if (productTypeFilter) params.set('product_type', productTypeFilter);
    if (showInactive) params.set('include_inactive', 'true');
    const query = params.toString() ? `?${params.toString()}` : '';

    clientFetch(`/api/entitlements/catalog${query}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setFetchedCatalog(normalizeCatalogResponse(data, { showInactive }));
      })
      .catch(err => console.warn('[ProductCatalog] Failed to fetch catalog:', err))
      .finally(() => setFetchLoading(false));
  }, [catalog, language, productTypeFilter, showInactive]);

  const activeCatalog = fetchedCatalog || catalog;
  const loading = isLoading || fetchLoading;

  // Auto-highlight featured products when no explicit highlightProductId
  const autoHighlightId = useMemo(() => {
    if (highlightProductId) return highlightProductId;
    // Find the first is_featured product across all types
    const allProducts = [
      ...(activeCatalog?.subscriptions || []),
      ...(activeCatalog?.creditPacks || []),
      ...(activeCatalog?.reports || []),
    ];
    const featured = allProducts.find(p => p.isFeatured);
    return featured?.productId || null;
  }, [highlightProductId, activeCatalog]);

  // If no catalog data available, show placeholder
  if (!loading && !activeCatalog) {
    return (
      <div className="text-center py-12">
        <Sparkles className="w-8 h-8 text-secondary/40 mx-auto mb-4" />
        <p className="text-sm text-foreground/40">{t('plans.catalogUnavailable')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Subscriptions skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-secondary/40" />
            <h3 className="text-sm font-bold text-foreground/40 uppercase tracking-widest">{t('plans.subscriptions')}</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-[400px] rounded-[24px] bg-surface border border-outline-variant/10 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Filter by productTypeFilter if specified
  const subscriptions = (activeCatalog?.subscriptions || []).filter(
    _s => !productTypeFilter || productTypeFilter === 'subscription'
  );
  const creditPacks = (activeCatalog?.creditPacks || []).filter(
    _p => !productTypeFilter || productTypeFilter === 'one_time_pack'
  );
  const reports = (activeCatalog?.reports || []).filter(
    _r => !productTypeFilter || productTypeFilter === 'one_time_report'
  );

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* ─── Subscription Plans ─── */}
      {subscriptions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-secondary" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-secondary uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                {t('plans.subscriptions')}
              </h3>
              <p className="text-[10px] sm:text-xs text-primary/35 mt-0.5 hidden sm:block">
                Recurring plans with monthly credits, full feature access, and priority support
              </p>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-secondary/15 to-transparent ml-1 sm:ml-2" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {subscriptions.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                isHighlighted={autoHighlightId === product.productId}
                isCurrentPlan={currentTier?.toLowerCase() === product.tier?.toLowerCase()}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Credit Packs ─── */}
      {creditPacks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-secondary" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-secondary uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                {t('plans.creditPacks')}
              </h3>
              <p className="text-[10px] sm:text-xs text-primary/35 mt-0.5 hidden sm:block">
                One-time credit bundles — buy what you need, use anytime
              </p>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-secondary/15 to-transparent ml-1 sm:ml-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {creditPacks.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                isHighlighted={autoHighlightId === product.productId}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── One-Time Reports ─── */}
      {reports.length > 0 && (
        <section>
          <div className="flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-secondary" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-secondary uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                {t('plans.oneTimeReports')}
              </h3>
              <p className="text-[10px] sm:text-xs text-primary/35 mt-0.5 hidden sm:block">
                Detailed Vedic reports generated from your exact birth chart
              </p>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-secondary/15 to-transparent ml-1 sm:ml-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {reports.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                isHighlighted={autoHighlightId === product.productId}
                onSelect={onSelectProduct}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Fallback ─── */}
      {subscriptions.length === 0 && creditPacks.length === 0 && reports.length === 0 && (
        <div className="text-center py-12 sm:py-16">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-secondary/20 mx-auto mb-4" />
          <p className="text-sm text-primary/30">{t('plans.noProductsAvailable')}</p>
        </div>
      )}
    </div>
  );
}