'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles, X, CreditCard, ArrowRight, Shield, Star, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PaywallData, SuggestedProduct } from '@/types/paywall';
import { useTranslation, useFocusTrap } from '@/hooks';
import { usePaywallContext } from '@/context/PaywallContext';

interface PaywallCardProps {
  paywall: PaywallData;
  /** Display variant: inline = embedded, overlay = partial overlay, modal = full-screen overlay. */
  variant?: 'inline' | 'overlay' | 'modal';
  /** Close handler (only used for modal/overlay variants). */
  onClose?: () => void;
}

/**
 * Reusable PaywallCard — renders a paywall prompt based on PaywallData.
 *
 * - isSoft=true: shows a partial content overlay / locked section prompt.
 * - isSoft=false: blocks the feature fully with a hard paywall card.
 *
 * Uses backend-provided title, titleHi, description, descriptionHi, badge.
 * If the current frontend language is Hindi, prefers Hindi fields.
 *
 * Renders suggestedProducts[] array with nameEn/nameHi, priceInr/priceUsd.
 * Each suggested product links to /plans?product={productId}.
 * CTA button routes to /plans?feature={featureKey} (and ?product= if suggested).
 */
export default function PaywallCard({ paywall, variant = 'inline', onClose }: PaywallCardProps) {
  const { t, language } = useTranslation();
  const { getTierColor } = usePaywallContext();
  const modalRef = useFocusTrap<HTMLDivElement>(variant === 'modal');

  // Pick title/description based on language, check local translations first
  const isHindi = language === 'hi';
  
  // Clean up title to generate a potential custom section lookup key
  const sanitizedTitleKey = paywall.title ? paywall.title.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  
  const customTitleKey = `paywall.custom.${sanitizedTitleKey}.title`;
  const customTitleVal = sanitizedTitleKey ? t(customTitleKey) : '';
  const customTitle = (customTitleVal && customTitleVal !== customTitleKey) ? customTitleVal : '';

  const customDescKey = `paywall.custom.${sanitizedTitleKey}.description`;
  const customDescVal = sanitizedTitleKey ? t(customDescKey) : '';
  const customDesc = (customDescVal && customDescVal !== customDescKey) ? customDescVal : '';

  // Feature key standard translations
  const featureTitleKey = `paywall.features.${paywall.featureKey}.title`;
  const featureTitleVal = t(featureTitleKey);
  const featureTitle = (featureTitleVal && featureTitleVal !== featureTitleKey) ? featureTitleVal : '';

  const featureDescKey = `paywall.features.${paywall.featureKey}.description`;
  const featureDescVal = t(featureDescKey);
  const featureDesc = (featureDescVal && featureDescVal !== featureDescKey) ? featureDescVal : '';

  // Resolution order: custom localized -> feature localized -> backend language-specific -> default backend English
  const title = customTitle || featureTitle || ((isHindi && paywall.titleHi) ? paywall.titleHi : paywall.title);
  const description = customDesc || featureDesc || ((isHindi && paywall.descriptionHi) ? paywall.descriptionHi : paywall.description);

  // The paywall icon (emoji) from backend, or fallback to Lock/Sparkles based on isSoft
  const paywallIcon = paywall.icon || null;

  // Suggested products (array per backend spec)
  const products: SuggestedProduct[] = paywall.suggestedProducts || [];
  const currentTierColor = getTierColor(paywall.tier);
  const getProductTierColor = (product: SuggestedProduct) => product.color || getTierColor(product.tier);
  const badgeTier = ['free', 'pro', 'premium'].find(
    tier => paywall.badge?.toLowerCase().includes(tier)
  );
  const paywallTierColor = paywall.color || getTierColor(badgeTier || products[0]?.tier);

  // Build the CTA link: /plans?feature={featureKey}&product={firstProductId}
  const ctaHref = `/plans?feature=${encodeURIComponent(paywall.featureKey)}${
    products.length > 0 ? `&product=${encodeURIComponent(products[0].productId)}` : ''
  }`;

  // Helper: get product name based on language/dictionary
  const getProductName = (product: SuggestedProduct) => {
    const key = `paywall.products.${product.productId}`;
    const localizedName = t(key);
    if (localizedName && localizedName !== key) return localizedName;
    return (isHindi && product.nameHi) ? product.nameHi : product.nameEn;
  };

  // Helper: format product price
  const getProductPrice = (product: SuggestedProduct) => {
    if (product.priceInr && product.currency === 'INR') return `₹${product.priceInr}`;
    if (product.priceUsd) return `$${product.priceUsd}`;
    if (product.priceInr) return `₹${product.priceInr}`;
    return null;
  };

  // ─── Inline variant ───
  if (variant === 'inline') {
    return (
      <Card
        padding="md"
        variant="bordered"
        hoverable={false}
        className="!rounded-[24px] border-[var(--paywall-tier-color)]/25 bg-surface relative overflow-hidden"
        style={{ '--paywall-tier-color': paywallTierColor } as React.CSSProperties}
      >
        {/* Subtle background glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06]"
          style={{ background: 'radial-gradient(circle at top, var(--paywall-tier-color), transparent 65%)' }}
        />

        <div className="relative z-10 flex flex-col items-center text-center gap-4 py-2">
          {/* Icon + Badge */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--paywall-tier-color)]/10 border border-[var(--paywall-tier-color)]/20 text-[var(--paywall-tier-color)] flex items-center justify-center">
              {paywallIcon ? (
                <span className="text-2xl">{paywallIcon}</span>
              ) : paywall.isSoft ? (
                <Sparkles className="w-7 h-7" />
              ) : (
                <Lock className="w-7 h-7" />
              )}
            </div>
            {paywall.badge && (
              <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-[var(--paywall-tier-color)]/15 text-[var(--paywall-tier-color)] border border-[var(--paywall-tier-color)]/20">
                {paywall.badge}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-headline font-bold text-foreground leading-tight">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-foreground/60 leading-relaxed max-w-md">
            {description}
          </p>

          {/* Credits info */}
          {(paywall.credits !== undefined || paywall.creditsRequired !== undefined) && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-variant/20 border border-outline-variant/10">
              <CreditCard className="w-4 h-4 text-foreground/40" />
              <span className="text-[11px] font-bold text-foreground/50">
                {paywall.credits !== undefined
                  ? `${t('paywall.credits') || "Credits"}: ${paywall.credits ?? 0} / ${paywall.creditsRequired ?? '?'}`
                  : `${t('paywall.required') || "Required"}: ${paywall.creditsRequired} ${t('paywall.creditPlural') || "credits"}`}
              </span>
            </div>
          )}

          {/* Suggested products (array) — each links to /plans */}
          {products.length > 0 && (
            <div className="space-y-2 w-full">
              {products.map((product) => (
                <Link
                  key={product.productId}
                  href={`/plans?feature=${encodeURIComponent(paywall.featureKey)}&product=${encodeURIComponent(product.productId)}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--product-tier-color)]/[0.06] border border-[var(--product-tier-color)]/15 hover:bg-[var(--product-tier-color)]/[0.1] hover:border-[var(--product-tier-color)]/30 transition-all group"
                  style={{ '--product-tier-color': getProductTierColor(product) } as React.CSSProperties}
                >
                  {product.icon ? (
                    <span className="text-lg shrink-0">{product.icon}</span>
                  ) : (
                    <Shield className="w-4 h-4 text-[var(--product-tier-color)] shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-[var(--product-tier-color)]">{getProductName(product)}</p>
                    <div className="flex items-center gap-2">
                      {getProductPrice(product) && (
                        <p className="text-[10px] text-foreground/40 font-bold">{getProductPrice(product)}</p>
                      )}
                      {product.credits > 0 && (
                        <p className="text-[10px] text-foreground/30 font-bold">
                          {product.credits} {product.credits === 1 ? (t('paywall.creditSingle') || "credit") : (t('paywall.creditPlural') || "credits")}
                        </p>
                      )}
                    </div>
                  </div>
                  {product.tier && (
                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--product-tier-color)]/10 text-[var(--product-tier-color)] border border-[var(--product-tier-color)]/20">
                      {product.tier}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-[var(--product-tier-color)]/40 group-hover:text-[var(--product-tier-color)] group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          )}

          {/* Tier info */}
          {paywall.tier && (
            <p
              className="text-[10px] font-bold uppercase tracking-widest text-[var(--current-tier-color)]"
              style={{ '--current-tier-color': currentTierColor } as React.CSSProperties}
            >
              {t('paywall.currentTier') ? t('paywall.currentTier').replace('{tier}', paywall.tier) : `Current tier: ${paywall.tier}`}
            </p>
          )}

          {/* CTA Button — links to /plans */}
          <Button
            href={ctaHref}
            variant="primary"
            size="md"
            fullWidth
            className="mt-2 rounded-[16px]"
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {t('paywall.viewPlansUpgrade') || "View Plans & Upgrade"}
          </Button>

          {/* Payment notice */}
          <div className="flex items-center gap-1.5 text-[9px] text-foreground/25 font-bold uppercase tracking-widest">
            <Clock className="w-3 h-3 text-foreground/20" />
            {t('plans.paymentComingSoon')}
          </div>
        </div>
      </Card>
    );
  }

  // ─── Overlay variant ───
  if (variant === 'overlay') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative rounded-[24px] overflow-hidden min-h-[230px]"
        style={{ '--paywall-tier-color': paywallTierColor } as React.CSSProperties}
      >
        {/* Blurred backdrop overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-surface/90 to-surface/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-3 p-4 sm:p-5 text-center min-h-[230px]">
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/80 border border-outline-variant/20 flex items-center justify-center text-foreground/40 hover:text-foreground hover:border-secondary/30 transition-all z-20"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Symbol + Pro Badge in one row */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--paywall-tier-color)]/10 border border-[var(--paywall-tier-color)]/20 text-[var(--paywall-tier-color)] flex items-center justify-center">
              {paywallIcon ? (
                <span className="text-lg">{paywallIcon}</span>
              ) : paywall.isSoft ? (
                <Sparkles className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            {paywall.badge && (
              <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-[var(--paywall-tier-color)]/10 text-[var(--paywall-tier-color)] border border-[var(--paywall-tier-color)]/20">
                {paywall.badge}
              </span>
            )}
          </div>

          <h3 className="text-base font-headline font-bold text-foreground leading-tight">{title}</h3>
          <p className="text-xs text-foreground/60 leading-relaxed max-w-sm">{description}</p>

          {(paywall.credits !== undefined || paywall.creditsRequired !== undefined) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-variant/20 border border-outline-variant/10">
              <CreditCard className="w-3.5 h-3.5 text-foreground/40" />
              <span className="text-[10px] font-bold text-foreground/50">
                {paywall.credits !== undefined
                  ? `${paywall.credits ?? 0}/${paywall.creditsRequired ?? '?'} ${t('paywall.creditPlural') || "credits"}`
                  : `${paywall.creditsRequired} ${t('paywall.creditsRequiredLabel') || "credits required"}`}
              </span>
            </div>
          )}

          {/* Both buttons in one row */}
          <div className="flex flex-row items-stretch justify-center gap-3 w-full max-w-[360px] mt-1">
            {products.length > 0 && (
              <Link
                href={`/plans?feature=${encodeURIComponent(paywall.featureKey)}&product=${encodeURIComponent(products[0].productId)}`}
                className="flex-1 flex items-center justify-between gap-2 px-3 py-1.5 rounded-[24px] bg-[var(--product-tier-color)]/[0.06] border border-[var(--product-tier-color)]/15 hover:bg-[var(--product-tier-color)]/[0.1] hover:border-[var(--product-tier-color)]/30 transition-all group text-left min-h-[44px]"
                style={{ '--product-tier-color': getProductTierColor(products[0]) } as React.CSSProperties}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {products[0].icon ? (
                    <span className="text-sm shrink-0">{products[0].icon}</span>
                  ) : (
                    <Star className="w-3.5 h-3.5 text-[var(--product-tier-color)] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[var(--product-tier-color)] truncate">
                      {getProductName(products[0])}
                    </p>
                    {getProductPrice(products[0]) && (
                      <p className="text-[9px] text-foreground/40 font-bold">{getProductPrice(products[0])}</p>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--product-tier-color)]/40 group-hover:text-[var(--product-tier-color)] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            )}

            <Button
              href={ctaHref}
              variant="primary"
              size="sm"
              className={`flex items-center justify-center font-bold text-[11px] tracking-wider uppercase px-4 ${products.length > 0 ? 'flex-1' : 'w-auto'}`}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {t('paywall.viewPlans') || "View Plans"}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Modal variant ───
  if (variant === 'modal') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md bg-surface rounded-[24px] sm:rounded-[32px] border border-[var(--paywall-tier-color)]/25 shadow-2xl overflow-hidden"
            style={{ '--paywall-tier-color': paywallTierColor } as React.CSSProperties}
          >
            {/* Close */}
            {onClose && (
              <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-variant/30 flex items-center justify-center hover:bg-surface-variant/50 transition-colors z-50 group"
              >
                <X className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
              </button>
            )}

            {/* Background glow */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.06]"
              style={{ background: 'radial-gradient(circle at top, var(--paywall-tier-color), transparent 65%)' }}
            />

            <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center text-center gap-5">
              {/* Icon + Badge */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[var(--paywall-tier-color)]/10 border border-[var(--paywall-tier-color)]/20 text-[var(--paywall-tier-color)] flex items-center justify-center">
                  {paywallIcon ? (
                    <span className="text-3xl">{paywallIcon}</span>
                  ) : paywall.isSoft ? (
                    <Sparkles className="w-8 h-8" />
                  ) : (
                    <Lock className="w-8 h-8" />
                  )}
                </div>
                {paywall.badge && (
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-[var(--paywall-tier-color)]/15 text-[var(--paywall-tier-color)] border border-[var(--paywall-tier-color)]/20">
                    {paywall.badge}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="text-xl font-headline font-bold text-foreground leading-tight">
                {title}
              </h3>

              {/* Description */}
              <p className="text-sm text-foreground/60 leading-relaxed max-w-sm">
                {description}
              </p>

              {/* Credits info */}
              {(paywall.credits !== undefined || paywall.creditsRequired !== undefined) && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-variant/20 border border-outline-variant/10">
                  <CreditCard className="w-4 h-4 text-foreground/40" />
                  <span className="text-[11px] font-bold text-foreground/50">
                    {paywall.credits !== undefined
                      ? `${t('paywall.credits') || "Credits"}: ${paywall.credits ?? 0} / ${paywall.creditsRequired ?? '?'}`
                      : `${t('paywall.required') || "Required"}: ${paywall.creditsRequired} ${t('paywall.creditPlural') || "credits"}`}
                  </span>
                </div>
              )}

              {/* Suggested products (array) — each links to /plans */}
              {products.length > 0 && (
                <div className="space-y-2 w-full">
                  {products.map((product) => (
                    <Link
                      key={product.productId}
                      href={`/plans?feature=${encodeURIComponent(paywall.featureKey)}&product=${encodeURIComponent(product.productId)}`}
                      className="flex items-center gap-3 px-5 py-4 rounded-xl bg-[var(--product-tier-color)]/[0.06] border border-[var(--product-tier-color)]/15 hover:bg-[var(--product-tier-color)]/[0.1] hover:border-[var(--product-tier-color)]/30 transition-all w-full group"
                      style={{ '--product-tier-color': getProductTierColor(product) } as React.CSSProperties}
                    >
                      {product.icon ? (
                        <span className="text-xl shrink-0">{product.icon}</span>
                      ) : (
                        <Shield className="w-5 h-5 text-[var(--product-tier-color)] shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-[var(--product-tier-color)]">{getProductName(product)}</p>
                        <div className="flex items-center gap-2">
                          {getProductPrice(product) && (
                            <p className="text-[10px] text-foreground/40 font-bold">{getProductPrice(product)}</p>
                          )}
                          {product.credits > 0 && (
                            <p className="text-[10px] text-foreground/30 font-bold">
                              {product.credits} {product.credits === 1 ? (t('paywall.creditSingle') || "credit") : (t('paywall.creditPlural') || "credits")}
                            </p>
                          )}
                        </div>
                      </div>
                      {product.tier && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--product-tier-color)]/10 text-[var(--product-tier-color)] border border-[var(--product-tier-color)]/20">
                          {product.tier}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-[var(--product-tier-color)]/40 group-hover:text-[var(--product-tier-color)] group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Tier info */}
              {paywall.tier && (
                <p
                  className="text-[10px] font-bold uppercase tracking-widest text-[var(--current-tier-color)]"
                  style={{ '--current-tier-color': currentTierColor } as React.CSSProperties}
                >
                  {t('paywall.currentTier') ? t('paywall.currentTier').replace('{tier}', paywall.tier) : `Current tier: ${paywall.tier}`}
                </p>
              )}

              {/* CTA Button — links to /plans */}
              <Button
                href={ctaHref}
                variant="primary"
                size="lg"
                fullWidth
                className="rounded-[16px] mt-2"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('paywall.viewPlansUpgrade') || "View Plans & Upgrade"}
              </Button>

              {/* Payment notice */}
              <div className="flex items-center gap-1.5 text-[9px] text-foreground/25 font-bold uppercase tracking-widest">
                <Clock className="w-3 h-3 text-foreground/20" />
                {t('plans.paymentComingSoon')}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
}
