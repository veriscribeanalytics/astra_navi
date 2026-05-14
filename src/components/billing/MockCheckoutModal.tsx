'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Shield, ArrowRight, Clock, Tag } from 'lucide-react';
import Button from '@/components/ui/Button';
import { CatalogProduct, isSubscription, formatProductPrice, getPricePeriod, getTierLabel } from '@/types/billing';
import { useTranslation } from '@/hooks';

// ─── Checkout Handler Interface ────────────────────────────────
//
// This interface defines the contract for payment provider integration.
// When Razorpay, App Store, or Play Store checkout is ready, implement
// this interface and inject it via the `checkoutHandler` prop.
//
// Example future implementations:
//   - RazorpayCheckoutHandler: opens Razorpay modal, handles payment callbacks
//   - AppStoreCheckoutHandler: uses StoreKit 2 in-app purchase flow
//   - PlayStoreCheckoutHandler: uses Google Play BillingClient flow
//
// Until a handler is provided, the modal stays in "coming soon" mode.

export interface CheckoutHandler {
  /** Unique identifier for the payment provider. */
  providerId: string;
  /** Display name for the provider (e.g. "Razorpay", "App Store"). */
  providerName: string;
  /** Initiate checkout for the given product. Returns a promise that resolves on success. */
  initiateCheckout: (product: CatalogProduct) => Promise<CheckoutResult>;
}

export interface CheckoutResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

// ─── MockCheckoutModal Component ───────────────────────────────

interface MockCheckoutModalProps {
  /** Whether the modal is open. */
  isOpen: boolean;
  /** Close handler. */
  onClose: () => void;
  /** The product the user selected. */
  product: CatalogProduct | null;
  /** Optional checkout handler. When provided, the "coming soon" notice is replaced with the real checkout flow. */
  checkoutHandler?: CheckoutHandler | null;
}

export default function MockCheckoutModal({
  isOpen,
  onClose,
  product,
  checkoutHandler,
}: MockCheckoutModalProps) {
  const { t, language } = useTranslation();
  const isHindi = language === 'hi';

  // Checkout state
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [checkoutError, setCheckoutError] = React.useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = React.useState(false);

  if (!product) return null;

  const name = (isHindi && product.nameHi) ? product.nameHi : product.nameEn;
  const price = formatProductPrice(product);
  const period = getPricePeriod(product);
  const isSub = isSubscription(product);

  // Determine if sale is active
  const hasActiveSale = product.salePriceInr != null && product.saleEndsAt != null &&
    new Date(product.saleEndsAt) > new Date();
  const salePrice = hasActiveSale && product.salePriceInr != null
    ? `₹${product.salePriceInr}`
    : null;

  // Handle checkout initiation
  const handleCheckout = async () => {
    if (!checkoutHandler) return;

    setCheckoutLoading(true);
    setCheckoutError(null);
    setCheckoutSuccess(false);

    try {
      const result = await checkoutHandler.initiateCheckout(product);
      if (result.success) {
        setCheckoutSuccess(true);
      } else {
        setCheckoutError(result.error || 'Checkout failed');
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Determine button state
  const hasRealCheckout = !!checkoutHandler;
  const buttonDisabled = !hasRealCheckout || checkoutLoading || checkoutSuccess;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md bg-surface rounded-[24px] sm:rounded-[32px] border border-secondary/20 shadow-2xl overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-variant/30 flex items-center justify-center hover:bg-surface-variant/50 transition-colors z-50 group"
            >
              <X className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
            </button>

            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-amber-500/[0.02] pointer-events-none" />

            <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center text-center gap-5">
              {/* Icon */}
              <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-[0_0_30px_rgba(200,136,10,0.1)]">
                {product.icon ? (
                  <span className="text-3xl">{product.icon}</span>
                ) : isSub ? (
                  <Shield className="w-8 h-8 text-secondary" />
                ) : (
                  <Sparkles className="w-8 h-8 text-secondary" />
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl font-headline font-bold text-foreground leading-tight">
                {name}
              </h3>

              {/* Type badge */}
              <span className="text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/15">
                {isSub ? t('plans.subscription') : t('plans.creditPack')}
              </span>

              {/* Price + Credits */}
              <div className="w-full space-y-2">
                {/* Sale price (if active) */}
                {hasActiveSale && salePrice && (
                  <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15">
                    <span className="text-[12px] font-bold text-foreground/60">
                      <Tag className="w-3 h-3 inline mr-1" />
                      {t('plans.saleBadge')}
                    </span>
                    <span className="text-[14px] font-bold text-emerald-500">
                      {salePrice}{period}
                      <span className="text-[10px] text-foreground/30 ml-1.5 line-through">{price}{period}</span>
                    </span>
                  </div>
                )}

                {/* Regular price (or non-sale) */}
                {!hasActiveSale && (
                  <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-secondary/[0.06] border border-secondary/10">
                    <span className="text-[12px] font-bold text-foreground/60">{t('plans.price')}</span>
                    <span className="text-[14px] font-bold text-secondary">{price}{period}</span>
                  </div>
                )}

                <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-surface-variant/20 border border-outline-variant/10">
                  <span className="text-[12px] font-bold text-foreground/60">{t('plans.credits')}</span>
                  <span className="text-[14px] font-bold text-foreground">{product.credits} {t('plans.naviCredits')}</span>
                </div>

                {/* Validity */}
                {product.validityDays && (
                  <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-surface-variant/20 border border-outline-variant/10">
                    <span className="text-[12px] font-bold text-foreground/60">{t('plans.validity')}</span>
                    <span className="text-[14px] font-bold text-foreground/80">
                      {isSub ? (product.validityDays === 365 ? t('plans.oneYear') : t('plans.oneMonth')) : `${product.validityDays} ${t('plans.days')}`}
                    </span>
                  </div>
                )}

                {/* Tier */}
                {isSub && product.tier && (
                  <div className="flex items-center justify-between px-5 py-3 rounded-xl bg-surface-variant/20 border border-outline-variant/10">
                    <span className="text-[12px] font-bold text-foreground/60">{t('plans.tier')}</span>
                    <span className="text-[14px] font-bold text-secondary">{getTierLabel(product.tier)}</span>
                  </div>
                )}
              </div>

              {/* Checkout status messages */}
              {checkoutSuccess && (
                <div className="w-full px-5 py-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 text-center">
                  <span className="text-[11px] font-bold text-emerald-500">Checkout successful!</span>
                </div>
              )}
              {checkoutError && (
                <div className="w-full px-5 py-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 text-center">
                  <span className="text-[11px] font-bold text-red-500">{checkoutError}</span>
                </div>
              )}

              {/* Coming Soon Notice (only when no real checkout handler) */}
              {!hasRealCheckout && (
                <div className="w-full px-5 py-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/20 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500/70" />
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.15em]">
                      {t('plans.paymentComingSoon')}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/40 leading-relaxed">
                    {t('plans.paymentIntegrationNotice')}
                  </p>
                </div>
              )}

              {/* Buy Button */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="rounded-[16px] mt-2"
                disabled={buttonDisabled}
                onClick={hasRealCheckout ? handleCheckout : undefined}
              >
                {checkoutSuccess ? (
                  '✓ Done'
                ) : checkoutLoading ? (
                  'Processing...'
                ) : hasRealCheckout ? (
                  <>
                    {t('plans.buyCredits')} via {checkoutHandler.providerName} <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    {t('plans.buyButtonDisabled')} <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {/* Back to Plans link */}
              <button
                onClick={onClose}
                className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest hover:text-foreground/60 transition-colors"
              >
                {t('plans.backToPlans')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}