'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Sparkles, Shield, ArrowRight, CheckCircle, Clock, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { CatalogProduct, isSubscription, isCreditPack, getPricePeriod } from '@/types/billing';
import { useTranslation } from '@/hooks';

interface ProductCardProps {
  product: CatalogProduct;
  /** Whether this product is highlighted (from query param). */
  isHighlighted?: boolean;
  /** Whether this is the user's current plan. */
  isCurrentPlan?: boolean;
  /** Handler when user clicks the buy/select button. */
  onSelect: (product: CatalogProduct) => void;
}

export default function ProductCard({
  product,
  isHighlighted = false,
  isCurrentPlan = false,
  onSelect,
}: ProductCardProps) {
  const { t, language } = useTranslation();
  const isHindi = language === 'hi';

  // Pick name/description based on language
  const name = (isHindi && product.nameHi) ? product.nameHi : product.nameEn;
  const description = (isHindi && product.descriptionHi) ? product.descriptionHi : product.descriptionEn;
  const period = getPricePeriod(product);

  const isSub = isSubscription(product);
  const isPack = isCreditPack(product);

  // Determine effective price (sale price if active sale)
  const hasActiveSale = product.salePriceInr != null && product.saleEndsAt != null &&
    new Date(product.saleEndsAt) > new Date();
  const effectivePriceInr = hasActiveSale && product.salePriceInr != null ? product.salePriceInr : product.priceInr;
  const effectivePrice = product.currency === 'USD' && product.priceUsd
    ? `$${product.priceUsd}`
    : `₹${effectivePriceInr}`;
  const originalPrice = hasActiveSale ? `₹${product.priceInr}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <Card
        padding="none"
        className={`h-full flex flex-col relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${
          isHighlighted
            ? 'border-secondary/50 shadow-xl shadow-secondary/5 ring-2 ring-secondary/30'
            : isCurrentPlan
              ? 'border-secondary/30 ring-1 ring-secondary/20'
              : 'border-outline-variant/20'
        }`}
      >
        {/* Badge — show featured, sale, or custom badge */}
        {(product.badge || product.isFeatured || hasActiveSale) && (
          <div className="absolute top-0 right-0">
            <div className="bg-secondary text-white text-[10px] font-bold uppercase tracking-widest py-1 px-4 rounded-bl-xl shadow-lg">
              {hasActiveSale ? t('plans.saleBadge') : product.isFeatured ? t('plans.featuredBadge') : product.badge}
            </div>
          </div>
        )}

        {/* Current plan indicator */}
        {isCurrentPlan && (
          <div className="absolute top-0 left-0">
            <div className="bg-foreground text-background text-[9px] font-black uppercase tracking-widest py-1 px-3 rounded-br-xl shadow-lg">
              {t('plans.currentPlan')}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-outline-variant/10">
          <div className="flex items-center gap-2 mb-3">
            {product.icon ? (
              <span className="text-lg">{product.icon}</span>
            ) : isSub ? (
              <Shield className="w-4 h-4 text-secondary" />
            ) : (
              <Star className="w-4 h-4 text-secondary" />
            )}
            <h3 className="text-lg font-headline font-bold text-primary">{name}</h3>
          </div>

          {/* Tier badge for subscriptions */}
          {isSub && product.tier && (
            <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/15 mb-3 inline-block">
              {product.tier.toUpperCase()}
            </span>
          )}

          <div className="flex items-baseline gap-1">
            {originalPrice && (
              <span className="text-sm text-foreground/30 font-medium line-through mr-1">{originalPrice}</span>
            )}
            <span className="text-3xl sm:text-4xl font-bold text-primary">{effectivePrice}</span>
            <span className="text-sm text-on-surface-variant/60 font-medium">{period}</span>
          </div>

          {/* Credits info */}
          {product.credits > 0 && (
            <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-secondary/[0.06] border border-secondary/10">
              <Sparkles className="w-3.5 h-3.5 text-secondary shrink-0" />
              <span className="text-[11px] font-bold text-secondary">
                {product.credits} {t('plans.naviCredits')}{isSub ? (product.validityDays === 365 ? `/${t('plans.year')}` : `/${t('plans.month')}`) : ''}
              </span>
            </div>
          )}

          {/* Validity for credit packs */}
          {isPack && product.validityDays && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-surface-variant/20 border border-outline-variant/10">
              <Clock className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
              <span className="text-[11px] font-bold text-foreground/50">
                {t('plans.featureNoExpiry')} {product.validityDays} {t('plans.days')}
              </span>
            </div>
          )}

          {/* Description */}
          {description && (
            <p className="text-xs text-on-surface-variant/60 mt-3 leading-relaxed">{description}</p>
          )}
        </div>

        {/* Features / Details */}
        <div className="p-6 sm:p-8 flex-grow">
          {isSub ? (
            // Subscription: show tier benefits
            <div className="space-y-3">
              {getSubscriptionFeatures(product.tier, t).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-secondary' : 'text-secondary/40'}`} />
                  <span className="text-sm text-on-surface-variant/80 leading-snug">{feature}</span>
                </div>
              ))}
            </div>
          ) : (
            // Credit pack: show use cases
            <div className="space-y-3">
              {getCreditPackFeatures(product.credits, t).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle className={`w-4 h-4 shrink-0 ${isHighlighted ? 'text-secondary' : 'text-secondary/40'}`} />
                  <span className="text-sm text-on-surface-variant/80 leading-snug">{feature}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="p-6 sm:p-8 pt-0 mt-auto">
          <Button
            variant={isHighlighted || isCurrentPlan ? 'primary' : 'secondary'}
            fullWidth
            size="lg"
            className={`rounded-[16px] ${isHighlighted ? 'gold-gradient shadow-lg' : ''}`}
            onClick={() => onSelect(product)}
            disabled={isCurrentPlan}
          >
            {isCurrentPlan ? t('plans.currentPlanButton') : (
              <>
                {isSub ? t('plans.selectPlan') : t('plans.buyCredits')} <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

/** Get feature descriptions for a subscription tier. */
function getSubscriptionFeatures(tier: string, t: (key: string) => string): string[] {
  if (tier.toLowerCase() === 'premium') {
    return [
      t('plans.featureUnlimitedChat'),
      t('plans.featureFullHoroscope'),
      t('plans.featureTomorrowHoroscope'),
      t('plans.featureGuidedConsult'),
      t('plans.featureMatchReport'),
      t('plans.featureKundliPremium'),
      t('plans.featureDashaAnalysis'),
      t('plans.featurePriorityAccess'),
    ];
  }
  // Pro tier
  return [
    t('plans.featureExtendedChat'),
    t('plans.featureFullHoroscope'),
    t('plans.featureTomorrowHoroscope'),
    t('plans.featureBasicConsult'),
    t('plans.featureMatchReport'),
    t('plans.featureKundliBasicPremium'),
  ];
}

/** Get feature descriptions for a credit pack. */
function getCreditPackFeatures(credits: number, t: (key: string) => string): string[] {
  const features: string[] = [];
  if (credits >= 1) features.push(`${credits} ${t('plans.featureChatMessages')}`);
  if (credits >= 5) features.push(`${Math.floor(credits / 5)} ${t('plans.featureGuidedConsults')}`);
  if (credits >= 10) features.push(`${Math.floor(credits / 10)} ${t('plans.featureMatchReports')}`);
  if (credits >= 3) features.push(t('plans.featureHoroscopeAccess'));
  features.push(`${t('plans.featureNoExpiry')} 30 ${t('plans.days')}`);
  return features;
}