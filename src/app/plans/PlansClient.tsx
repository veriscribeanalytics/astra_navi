'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { RazorpayCheckoutHandler } from '@/components/billing/RazorpayCheckoutHandler';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Clock, Shield, Star } from 'lucide-react';
import Card from '@/components/ui/Card';
import CreditBalanceCard from '@/components/billing/CreditBalanceCard';
import ProductCatalog from '@/components/billing/ProductCatalog';
import CreditHistory from '@/components/billing/CreditHistory';
import MockCheckoutModal from '@/components/billing/MockCheckoutModal';
import CurrentPlanSection from '@/components/billing/CurrentPlanSection';
import { CatalogProduct, BalanceResponse } from '@/types/billing';
import { useAuth } from '@/context/AuthContext';
import { usePaywallContext } from '@/context/PaywallContext';
import { useTranslation } from '@/hooks';

export default function PlansClient() {
  const { isLoggedIn, user } = useAuth();
  const { tier, totalCredits, balance, isLoading: paywallLoading, refresh: refreshPaywall } = usePaywallContext();
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const razorpayHandler = useMemo(() => {
    if (!isLoggedIn) return null;
    return new RazorpayCheckoutHandler(
      {
        name: user?.name,
        email: user?.email,
        phoneNumber: (user as any)?.phoneNumber || '',
      },
      async () => {
        await refreshPaywall();
      }
    );
  }, [isLoggedIn, user, refreshPaywall]);

  // Highlight product from query params: ?product=pro_monthly or ?feature=chat_message
  const highlightProductId = searchParams?.get('product') || null;
  const highlightFeature = searchParams?.get('feature') || null;

  // State
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // Use PaywallContext's balance directly (it fetches from /api/entitlements/balance),
  // with a fallback constructed from tier + totalCredits
  const effectiveBalance: BalanceResponse | null = balance || (isLoggedIn ? {
    credits: totalCredits ?? 0,
    tier: tier || user?.tier || 'free',
  } : null);

  // Balance loading state from PaywallContext
  const balanceLoading = isLoggedIn && paywallLoading && !balance;

  // When user selects a product → open mock checkout
  const handleSelectProduct = useCallback((product: CatalogProduct) => {
    setSelectedProduct(product);
    setShowCheckout(true);
  }, []);

  return (
    <div className="min-h-screen pt-4 sm:pt-8 pb-10 sm:pb-16 flex flex-col relative z-10">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center px-4 max-w-3xl mx-auto mb-6 sm:mb-10 space-y-3 sm:space-y-4"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-[1px] w-8 bg-secondary/30 hidden sm:block" />
          <Sparkles className="w-5 h-5 text-secondary" />
          <div className="h-[1px] w-8 bg-secondary/30 hidden sm:block" />
        </div>
        <h1 className="text-3xl sm:text-5xl font-headline font-bold text-primary">
          {t('plans.title')}
        </h1>
        <p className="text-sm sm:text-lg text-primary/70 max-w-2xl mx-auto">
          {t('plans.subtitle')}
        </p>

        {/* Highlighted feature message */}
        {highlightFeature && (
          <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary/[0.06] border border-secondary/10 mt-2">
            <Shield className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[11px] font-bold text-secondary">
              {t('plans.upgradeForFeature')} {highlightFeature}
            </span>
            <ArrowRight className="w-3 h-3 text-secondary/40" />
          </div>
        )}
      </motion.div>

      {/* ─── Credit Balance (for logged-in users) ─── */}
      {isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl 2xl:max-w-6xl mx-auto px-4 mb-6 sm:mb-8 w-full"
        >
          <CreditBalanceCard
            balance={effectiveBalance}
            isLoading={balanceLoading}
            variant="full"
          />
        </motion.div>
      )}

      {/* ─── Current Plan & Packs (for logged-in users) ─── */}
      {isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="max-w-4xl 2xl:max-w-6xl mx-auto px-4 mb-6 sm:mb-8 w-full"
        >
          <CurrentPlanSection />
        </motion.div>
      )}

      {/* ─── Product Catalog ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-4xl 2xl:max-w-6xl 3xl:max-w-[1600px] mx-auto px-4 mb-8 sm:mb-12 w-full"
      >
        <ProductCatalog
          highlightProductId={highlightProductId ?? undefined}
          currentTier={effectiveBalance?.tier ?? undefined}
          onSelectProduct={handleSelectProduct}
        />
      </motion.div>

      {/* ─── Credit Usage History (for logged-in users) ─── */}
      {isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl 2xl:max-w-6xl mx-auto px-4 mb-8 sm:mb-12 w-full"
        >
          <CreditHistory limit={10} />
        </motion.div>
      )}

      {/* ─── Beta / Coming Soon Notice ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="max-w-4xl 2xl:max-w-6xl 3xl:max-w-[1600px] mx-auto px-4 w-full"
      >
        <Card padding="lg" variant="bordered" className="text-center border-secondary/20 !p-5 sm:!p-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-secondary" />
            <h3 className="text-xl sm:text-2xl font-headline font-bold text-primary">{t('plans.betaNoticeTitle')}</h3>
          </div>
          <p className="text-xs sm:text-base text-primary/70 leading-relaxed">
            {t('plans.betaNoticeDesc')}
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/[0.06] border border-secondary/10">
              <Star className="w-3 h-3 text-secondary" />
              <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{t('plans.earlyAdopter')}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ─── Mock Checkout Modal ─── */}
      <MockCheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        product={selectedProduct}
        checkoutHandler={razorpayHandler}
      />
    </div>
  );
}