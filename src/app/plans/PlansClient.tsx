'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { RazorpayCheckoutHandler } from '@/components/billing/RazorpayCheckoutHandler';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, Clock, Shield, Star, FlaskConical, Compass } from 'lucide-react';
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
  const { t, language } = useTranslation();
  const searchParams = useSearchParams();

  const razorpayHandler = useMemo(() => {
    if (!isLoggedIn) return null;
    return new RazorpayCheckoutHandler(
      {
        name: user?.name,
        email: user?.email,
        phoneNumber: (user as any)?.phoneNumber || '',
      },
      language || 'en',
      async () => { await refreshPaywall(); }
    );
  }, [isLoggedIn, user, language, refreshPaywall]);

  const highlightProductId = searchParams?.get('product') || null;
  const highlightFeature = searchParams?.get('feature') || null;
  // Test mode (₹1 test plans) must be explicitly enabled via env — a URL param
  // alone must never expose test SKUs in production.
  const isTestMode = searchParams?.get('test') === '1'
    && process.env.NEXT_PUBLIC_ENABLE_TEST_PLANS === '1';

  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const effectiveBalance: BalanceResponse | null = balance || (isLoggedIn ? {
    credits: totalCredits ?? 0,
    tier: tier || user?.tier || 'free',
  } : null);

  const balanceLoading = isLoggedIn && paywallLoading && !balance;

  const handleSelectProduct = useCallback((product: CatalogProduct) => {
    setSelectedProduct(product);
    setShowCheckout(true);
  }, []);

  return (
    <div className="min-h-screen pt-4 sm:pt-8 pb-10 sm:pb-16 flex flex-col relative z-10">
      {/* ═══════════════════════════════════════════════════════════
          HERO HEADER — cosmic, dramatic, premium
          ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="text-center px-4 max-w-4xl mx-auto mb-8 sm:mb-12 relative"
      >
        {/* Decorative cosmic ring — smaller on mobile */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[400px] h-[280px] sm:h-[400px] pointer-events-none opacity-[0.04] sm:opacity-[0.06]"
          style={{
            background: 'radial-gradient(circle, rgba(200,136,10,0.4) 0%, transparent 60%)',
            filter: 'blur(60px)',
          }}
        />

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="h-[1px] w-8 sm:w-10 lg:w-16 bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
          <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl sm:rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-[0_0_20px_rgba(200,136,10,0.1)]">
            <Compass className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-secondary" />
          </div>
          <div className="h-[1px] w-8 sm:w-10 lg:w-16 bg-gradient-to-r from-transparent via-secondary/40 to-transparent" />
        </div>

        {/* Headline — scales smoothly across breakpoints */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl 3xl:text-7xl font-headline font-black text-primary leading-[1.05] tracking-tight mb-3 sm:mb-4 px-2">
          {t('plans.title')}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-base lg:text-lg text-primary/50 max-w-xl sm:max-w-2xl mx-auto leading-relaxed mb-5 sm:mb-6 px-2">
          {t('plans.subtitle')}
        </p>

        {/* Highlighted feature banner */}
        {highlightFeature && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-secondary/[0.05] border border-secondary/15 shadow-[0_0_30px_rgba(200,136,10,0.04)]"
          >
            <Shield className="w-4 h-4 text-secondary" />
            <span className="text-xs font-bold text-secondary">
              {t('plans.upgradeForFeature')} {highlightFeature}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-secondary/40" />
          </motion.div>
        )}

        {/* Test mode indicator */}
        {isTestMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500/[0.06] border border-amber-500/15 mt-3"
          >
            <FlaskConical className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-500 uppercase tracking-[0.15em]">
              {t('plans.testModeBanner')}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          BALANCE + CURRENT PLAN (logged-in users)
          ═══════════════════════════════════════════════════════════ */}
      {isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl 2xl:max-w-6xl mx-auto px-4 mb-5 sm:mb-6 w-full"
        >
          <CreditBalanceCard
            balance={effectiveBalance}
            isLoading={balanceLoading}
            variant="full"
          />
        </motion.div>
      )}

      {isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl 2xl:max-w-6xl mx-auto px-4 mb-8 sm:mb-10 w-full"
        >
          <CurrentPlanSection />
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          PRODUCT CATALOG
          ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl 2xl:max-w-6xl 3xl:max-w-[1600px] mx-auto px-4 mb-10 sm:mb-14 w-full"
      >
        <ProductCatalog
          highlightProductId={highlightProductId ?? (isTestMode ? 'test_pro_1_inr' : undefined)}
          currentTier={effectiveBalance?.tier ?? undefined}
          onSelectProduct={handleSelectProduct}
          showInactive={isTestMode}
        />
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          CREDIT HISTORY
          ═══════════════════════════════════════════════════════════ */}
      {isLoggedIn && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl 2xl:max-w-6xl mx-auto px-4 mb-10 sm:mb-14 w-full"
        >
          <CreditHistory limit={10} />
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          BETA / EARLY ADOPTER NOTICE
          ═══════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl 2xl:max-w-6xl 3xl:max-w-[1600px] mx-auto px-4 w-full"
      >
        <Card padding="lg" variant="bordered" className="text-center border-secondary/20 !p-5 sm:!p-8 lg:!p-10 overflow-hidden relative">
          {/* Inner glow */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              background: 'radial-gradient(ellipse 60% 80% at 50% 30%, rgba(200,136,10,0.8) 0%, transparent 70%)',
            }}
          />

          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-[0_0_25px_rgba(200,136,10,0.1)]">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-secondary" />
              </div>
            </div>

            <h3 className="text-lg sm:text-2xl lg:text-3xl font-headline font-bold text-primary mb-2 sm:mb-3">
              {t('plans.betaNoticeTitle')}
            </h3>

            <p className="text-xs sm:text-sm lg:text-base text-primary/55 leading-relaxed max-w-2xl mx-auto mb-4 sm:mb-5">
              {t('plans.betaNoticeDesc')}
            </p>

            <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-secondary/[0.05] border border-secondary/15">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-secondary" />
                <span className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-[0.1em]">
                  {t('plans.earlyAdopter')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-primary/[0.03] border border-outline-variant/15">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary/35" />
                <span className="text-[10px] sm:text-xs font-bold text-primary/45 uppercase tracking-[0.1em]">
                  DPDP Act 2023 Compliant
                </span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ═══════════════════════════════════════════════════════════
          CHECKOUT MODAL
          ═══════════════════════════════════════════════════════════ */}
      <MockCheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        product={selectedProduct}
        checkoutHandler={razorpayHandler}
      />
    </div>
  );
}
