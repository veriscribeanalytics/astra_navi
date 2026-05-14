'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Sparkles, X, CreditCard, ArrowRight, Shield, Star, Clock } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { PaywallData, SuggestedProduct } from '@/types/paywall';
import { useTranslation } from '@/hooks';

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

  // Pick title/description based on language
  const isHindi = language === 'hi';
  const title = (isHindi && paywall.titleHi) ? paywall.titleHi : paywall.title;
  const description = (isHindi && paywall.descriptionHi) ? paywall.descriptionHi : paywall.description;

  // The paywall icon (emoji) from backend, or fallback to Lock/Sparkles based on isSoft
  const paywallIcon = paywall.icon || null;

  // Suggested products (array per backend spec)
  const products: SuggestedProduct[] = paywall.suggestedProducts || [];

  // Build the CTA link: /plans?feature={featureKey}&product={firstProductId}
  const ctaHref = `/plans?feature=${encodeURIComponent(paywall.featureKey)}${
    products.length > 0 ? `&product=${encodeURIComponent(products[0].productId)}` : ''
  }`;

  // Helper: get product name based on language
  const getProductName = (product: SuggestedProduct) =>
    (isHindi && product.nameHi) ? product.nameHi : product.nameEn;

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
        className="!rounded-[24px] border-secondary/20 bg-gradient-to-b from-secondary/[0.05] to-surface relative overflow-hidden"
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-amber-500/[0.02] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center gap-4 py-2">
          {/* Icon + Badge */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-[0_0_20px_rgba(200,136,10,0.08)]">
              {paywallIcon ? (
                <span className="text-2xl">{paywallIcon}</span>
              ) : paywall.isSoft ? (
                <Sparkles className="w-7 h-7 text-secondary" />
              ) : (
                <Lock className="w-7 h-7 text-secondary" />
              )}
            </div>
            {paywall.badge && (
              <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-secondary/15 text-secondary border border-secondary/20">
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
                  ? `Credits: ${paywall.credits ?? 0} / ${paywall.creditsRequired ?? '?'}`
                  : `Required: ${paywall.creditsRequired} credits`}
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
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/[0.06] border border-secondary/10 hover:bg-secondary/[0.1] hover:border-secondary/20 transition-all group"
                >
                  {product.icon ? (
                    <span className="text-lg shrink-0">{product.icon}</span>
                  ) : (
                    <Shield className="w-4 h-4 text-secondary shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-secondary">{getProductName(product)}</p>
                    <div className="flex items-center gap-2">
                      {getProductPrice(product) && (
                        <p className="text-[10px] text-foreground/40 font-bold">{getProductPrice(product)}</p>
                      )}
                      {product.credits > 0 && (
                        <p className="text-[10px] text-foreground/30 font-bold">{product.credits} credits</p>
                      )}
                    </div>
                  </div>
                  {product.tier && (
                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/15">
                      {product.tier}
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-secondary/40 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          )}

          {/* Tier info */}
          {paywall.tier && (
            <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">
              Current tier: {paywall.tier}
            </p>
          )}

          {/* CTA Button — links to /plans */}
          <Button
            href={ctaHref}
            variant="primary"
            size="md"
            fullWidth
            className="mt-2 rounded-[16px]"
          >
            View Plans & Upgrade <ArrowRight className="w-4 h-4 ml-1" />
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
        className="relative rounded-[24px] overflow-hidden min-h-[280px]"
      >
        {/* Blurred backdrop overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface/80 via-surface/90 to-surface/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-4 p-6 text-center min-h-[280px]">
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/50 border border-outline-variant/20 flex items-center justify-center text-foreground/40 hover:text-foreground hover:border-secondary/30 transition-all z-20"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="w-12 h-12 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            {paywallIcon ? (
              <span className="text-xl">{paywallIcon}</span>
            ) : paywall.isSoft ? (
              <Sparkles className="w-6 h-6 text-secondary" />
            ) : (
              <Lock className="w-6 h-6 text-secondary" />
            )}
          </div>

          {paywall.badge && (
            <span className="text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/15">
              {paywall.badge}
            </span>
          )}

          <h3 className="text-base font-headline font-bold text-foreground leading-tight">{title}</h3>
          <p className="text-xs text-foreground/60 leading-relaxed">{description}</p>

          {(paywall.credits !== undefined || paywall.creditsRequired !== undefined) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-variant/20 border border-outline-variant/10">
              <CreditCard className="w-3.5 h-3.5 text-foreground/40" />
              <span className="text-[10px] font-bold text-foreground/50">
                {paywall.credits !== undefined
                  ? `${paywall.credits ?? 0}/${paywall.creditsRequired ?? '?'} credits`
                  : `${paywall.creditsRequired} credits required`}
              </span>
            </div>
          )}

          {/* Suggested products (first product only for overlay — space limited) */}
          {products.length > 0 && (
            <Link
              href={`/plans?feature=${encodeURIComponent(paywall.featureKey)}&product=${encodeURIComponent(products[0].productId)}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/[0.06] border border-secondary/10 hover:bg-secondary/[0.1] hover:border-secondary/20 transition-all group"
            >
              {products[0].icon ? (
                <span className="text-sm">{products[0].icon}</span>
              ) : (
                <Star className="w-3.5 h-3.5 text-secondary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-secondary">{getProductName(products[0])}</p>
                {getProductPrice(products[0]) && (
                  <p className="text-[9px] text-foreground/40 font-bold">{getProductPrice(products[0])}</p>
                )}
              </div>
              <ArrowRight className="w-3 h-3 text-secondary/40 group-hover:text-secondary transition-colors" />
            </Link>
          )}

          <Button href={ctaHref} variant="primary" size="sm" className="rounded-xl">
            View Plans <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-md bg-surface rounded-[24px] sm:rounded-[32px] border border-secondary/20 shadow-2xl overflow-hidden"
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
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-amber-500/[0.02] pointer-events-none" />

            <div className="relative z-10 p-6 sm:p-8 flex flex-col items-center text-center gap-5">
              {/* Icon + Badge */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-[0_0_30px_rgba(200,136,10,0.1)]">
                  {paywallIcon ? (
                    <span className="text-3xl">{paywallIcon}</span>
                  ) : paywall.isSoft ? (
                    <Sparkles className="w-8 h-8 text-secondary" />
                  ) : (
                    <Lock className="w-8 h-8 text-secondary" />
                  )}
                </div>
                {paywall.badge && (
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-secondary/15 text-secondary border border-secondary/20">
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
                      ? `Credits: ${paywall.credits ?? 0} / ${paywall.creditsRequired ?? '?'}`
                      : `Required: ${paywall.creditsRequired} credits`}
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
                      className="flex items-center gap-3 px-5 py-4 rounded-xl bg-secondary/[0.06] border border-secondary/10 hover:bg-secondary/[0.1] hover:border-secondary/20 transition-all w-full group"
                    >
                      {product.icon ? (
                        <span className="text-xl shrink-0">{product.icon}</span>
                      ) : (
                        <Shield className="w-5 h-5 text-secondary shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-secondary">{getProductName(product)}</p>
                        <div className="flex items-center gap-2">
                          {getProductPrice(product) && (
                            <p className="text-[10px] text-foreground/40 font-bold">{getProductPrice(product)}</p>
                          )}
                          {product.credits > 0 && (
                            <p className="text-[10px] text-foreground/30 font-bold">{product.credits} credits</p>
                          )}
                        </div>
                      </div>
                      {product.tier && (
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/15">
                          {product.tier}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-secondary/40 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Tier info */}
              {paywall.tier && (
                <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest">
                  Current tier: {paywall.tier}
                </p>
              )}

              {/* CTA Button — links to /plans */}
              <Button
                href={ctaHref}
                variant="primary"
                size="lg"
                fullWidth
                className="rounded-[16px] mt-2"
              >
                View Plans & Upgrade <ArrowRight className="w-4 h-4 ml-2" />
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