'use client';

import React, { useState } from 'react';
import { Sparkles, Shield, ArrowRight, CheckCircle, Clock, Star, Zap, Crown, Gem } from 'lucide-react';
import { motion } from 'motion/react';
import { CatalogProduct, isSubscription, isCreditPack, getPricePeriod } from '@/types/billing';
import { useTranslation } from '@/hooks';

interface ProductCardProps {
  product: CatalogProduct;
  isHighlighted?: boolean;
  isCurrentPlan?: boolean;
  onSelect: (product: CatalogProduct) => void;
}

/** Tier → visual theme mapping. */
function getTierTheme(tier: string | undefined) {
  const t = (tier || '').toLowerCase();
  if (t === 'premium' || t === 'disciple') return {
    accent: 'from-amber-400 via-amber-500 to-yellow-300',
    glow: 'shadow-amber-500/20',
    ring: 'ring-amber-400/40',
    bg: 'bg-amber-500/[0.04]',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    icon: 'text-amber-400',
    iconBg: 'bg-amber-500/10 border-amber-400/25',
    tagGrad: 'from-amber-500 to-yellow-400',
    label: 'Premium',
  };
  if (t === 'pro' || t === 'devotee') return {
    accent: 'from-violet-400 via-purple-500 to-indigo-300',
    glow: 'shadow-purple-500/20',
    ring: 'ring-purple-400/40',
    bg: 'bg-purple-500/[0.04]',
    badge: 'bg-purple-500/15 text-purple-300 border-purple-400/30',
    icon: 'text-purple-400',
    iconBg: 'bg-purple-500/10 border-purple-400/25',
    tagGrad: 'from-purple-500 to-indigo-400',
    label: 'Pro',
  };
  return {
    accent: 'from-secondary/70 via-secondary to-secondary/40',
    glow: 'shadow-secondary/15',
    ring: 'ring-secondary/30',
    bg: 'bg-secondary/[0.03]',
    badge: 'bg-secondary/10 text-secondary border-secondary/25',
    icon: 'text-secondary',
    iconBg: 'bg-secondary/10 border-secondary/20',
    tagGrad: 'from-secondary to-secondary/60',
    label: 'Free',
  };
}

/** Subscription tier features with short descriptions. */
function getSubscriptionFeatures(tier: string, t: (key: string) => string): { label: string; highlight?: boolean }[] {
  const isPremium = (tier || '').toLowerCase() === 'premium';
  const base = [
    { label: t('plans.featureFullHoroscope') },
    { label: t('plans.featureTomorrowHoroscope') },
    { label: t('plans.featureMatchReport') },
    { label: isPremium ? t('plans.featureKundliPremium') : t('plans.featureKundliBasicPremium') },
  ];
  if (isPremium) {
    return [
      { label: t('plans.featureUnlimitedChat'), highlight: true },
      ...base,
      { label: t('plans.featureGuidedConsult') },
      { label: t('plans.featureDashaAnalysis') },
      { label: t('plans.featurePriorityAccess') },
    ];
  }
  return [
    { label: t('plans.featureExtendedChat'), highlight: true },
    ...base,
    { label: t('plans.featureBasicConsult') },
  ];
}

/** Credit pack features. */
function getCreditPackFeatures(credits: number, t: (key: string) => string): { label: string; highlight?: boolean }[] {
  const features: { label: string; highlight?: boolean }[] = [];
  if (credits >= 1) features.push({ label: `${credits} ${t('plans.featureChatMessages')}`, highlight: true });
  if (credits >= 5) features.push({ label: `${Math.floor(credits / 5)} ${t('plans.featureGuidedConsults')}` });
  if (credits >= 10) features.push({ label: `${Math.floor(credits / 10)} ${t('plans.featureMatchReports')}` });
  if (credits >= 3) features.push({ label: t('plans.featureHoroscopeAccess') });
  features.push({ label: `${t('plans.featureNoExpiry')} 30 ${t('plans.days')}` });
  return features;
}

export default function ProductCard({
  product,
  isHighlighted = false,
  isCurrentPlan = false,
  onSelect,
}: ProductCardProps) {
  const { t, language } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const isHindi = language === 'hi';

  const name = (isHindi && product.nameHi) ? product.nameHi : product.nameEn;
  const description = (isHindi && product.descriptionHi) ? product.descriptionHi : product.descriptionEn;
  const period = getPricePeriod(product);
  const isSub = isSubscription(product);
  const isPack = isCreditPack(product);

  const hasActiveSale = product.salePriceInr != null && product.saleEndsAt != null &&
    new Date(product.saleEndsAt) > new Date();
  const effectivePriceInr = hasActiveSale && product.salePriceInr != null ? product.salePriceInr : product.priceInr;
  const effectivePrice = product.currency === 'USD' && product.priceUsd
    ? `$${product.priceUsd}`
    : `₹${effectivePriceInr}`;
  const originalPrice = hasActiveSale ? `₹${product.priceInr}` : null;

  const tier = isSubscription(product) ? product.tier : undefined;
  const theme = getTierTheme(tier);
  const TierIcon = isCurrentPlan ? Crown : isHighlighted ? Gem : isSub ? Shield : Star;
  const features = isSub
    ? getSubscriptionFeatures(product.tier, t)
    : getCreditPackFeatures(product.credits, t);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative group h-full"
    >
      {/* Outer glow ring */}
      <div
        className={`absolute -inset-[1px] rounded-[24px] sm:rounded-[28px] bg-gradient-to-br ${theme.accent} opacity-0 blur-sm transition-all duration-700
          ${isHighlighted ? 'opacity-60' : ''}
          ${isHovered && !isHighlighted ? 'opacity-25' : ''}
        `}
      />

      {/* Card body */}
      <div
        className={`relative h-full flex flex-col rounded-[24px] sm:rounded-[28px] overflow-hidden border transition-all duration-500
          bg-surface/80 backdrop-blur-xl
          ${isHighlighted
            ? 'border-transparent shadow-2xl shadow-secondary/10'
            : isCurrentPlan
              ? 'border-secondary/25 shadow-lg shadow-secondary/5'
              : 'border-outline-variant/15 hover:border-outline-variant/30 shadow-sm hover:shadow-lg'
          }
        `}
      >
        {/* Subtle starfield */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 30%, rgba(200,136,10,0.9) 0.5px, transparent 0.5px),
              radial-gradient(circle at 70% 60%, rgba(200,136,10,0.7) 0.4px, transparent 0.4px),
              radial-gradient(circle at 45% 85%, rgba(180,130,200,0.6) 0.6px, transparent 0.6px),
              radial-gradient(circle at 85% 15%, rgba(200,136,10,0.5) 0.3px, transparent 0.3px)`,
            backgroundSize: '80px 80px, 100px 100px, 120px 120px, 90px 90px',
          }}
        />

        {/* Top decoration line */}
        <div className={`absolute top-0 left-4 sm:left-6 right-4 sm:right-6 h-[1px] bg-gradient-to-r from-transparent via-secondary/30 to-transparent transition-opacity duration-500 ${isHighlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`} />

        {/* Badges */}
        <div className="absolute top-0 right-0 flex gap-1.5 z-10">
          {hasActiveSale && (
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] py-1 sm:py-1.5 px-3 sm:px-4 rounded-bl-2xl shadow-lg">
              {t('plans.saleBadge')}
            </div>
          )}
          {(product.badge || product.isFeatured) && !hasActiveSale && (
            <div className={`bg-gradient-to-r ${theme.tagGrad} text-white text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] py-1 sm:py-1.5 px-3 sm:px-4 rounded-bl-2xl shadow-lg`}>
              {product.isFeatured ? t('plans.featuredBadge') : product.badge}
            </div>
          )}
        </div>

        {/* Current plan indicator */}
        {isCurrentPlan && (
          <div className="absolute top-0 left-0 z-10">
            <div className="bg-gradient-to-r from-primary to-primary/80 text-background text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] py-1 sm:py-1.5 px-3 sm:px-4 rounded-br-2xl shadow-lg">
              {t('plans.currentPlan')}
            </div>
          </div>
        )}

        {/* ═══ HEADER ═══ */}
        <div className={`p-4 sm:p-6 lg:p-8 border-b transition-colors duration-500 ${isHighlighted ? 'border-secondary/15' : 'border-outline-variant/8'}`}>
          {/* Icon + name + tier */}
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 border ${theme.iconBg} ${isHovered ? 'scale-110' : ''}`}>
              <TierIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${theme.icon}`} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-headline font-bold text-primary leading-tight truncate">{name}</h3>
              {isSub && product.tier && (
                <span className={`text-[7px] sm:text-[8px] font-black uppercase tracking-[0.15em] px-2 sm:px-2.5 py-0.5 rounded-full border ${theme.badge} inline-block mt-0.5 sm:mt-1`}>
                  {theme.label}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
            {originalPrice && (
              <span className="text-xs sm:text-sm text-primary/25 font-medium line-through decoration-primary/20">{originalPrice}</span>
            )}
            <span className={`text-3xl sm:text-4xl lg:text-5xl font-headline font-black tracking-tight bg-gradient-to-br ${theme.accent} bg-clip-text text-transparent`}>
              {effectivePrice}
            </span>
            <span className="text-xs sm:text-sm text-primary/40 font-medium whitespace-nowrap">{period}</span>
          </div>

          {/* Credits + validity — stacked on mobile, inline on desktop */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-3 sm:mt-4">
            {product.credits > 0 && (
              <div className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-all duration-300 ${theme.bg} ${isHighlighted ? 'shadow-[0_0_20px_rgba(200,136,10,0.06)]' : ''}`}>
                <Sparkles className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme.icon} shrink-0`} />
                <span className={`text-[11px] sm:text-xs font-bold ${theme.icon} whitespace-nowrap`}>
                  {product.credits} {t('plans.naviCredits')}{isSub ? (product.validityDays === 365 ? `/${t('plans.year')}` : `/${t('plans.month')}`) : ''}
                </span>
              </div>
            )}
            {isPack && product.validityDays && (
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl sm:rounded-2xl bg-primary/[0.02] border border-outline-variant/10">
                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary/25 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-bold text-primary/40 whitespace-nowrap">
                  {t('plans.featureNoExpiry')} {product.validityDays} {t('plans.days')}
                </span>
              </div>
            )}
          </div>

          {description && (
            <p className="text-[11px] sm:text-xs lg:text-sm text-primary/50 mt-3 leading-relaxed line-clamp-2">{description}</p>
          )}
        </div>

        {/* ═══ FEATURES ═══ */}
        <div className="p-4 sm:p-6 lg:p-8 flex-grow">
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary/20 mb-3 sm:mb-4">
            {isSub ? 'Includes' : 'Unlocks'}
          </p>
          <div className="space-y-2 sm:space-y-3">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-2.5 sm:gap-3 group/feat">
                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all duration-300 ${
                  feature.highlight
                    ? 'bg-secondary/15'
                    : isHighlighted ? 'bg-secondary/10' : 'bg-primary/[0.04] group-hover/feat:bg-secondary/10'
                }`}>
                  <CheckCircle className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-colors duration-300 ${
                    feature.highlight
                      ? 'text-secondary'
                      : isHighlighted ? 'text-secondary' : 'text-primary/25 group-hover/feat:text-secondary'
                  }`} />
                </div>
                <span className={`text-[12px] sm:text-sm leading-snug transition-colors duration-300 ${
                  feature.highlight
                    ? 'text-primary/90 font-bold'
                    : isHighlighted ? 'text-primary/80' : 'text-primary/60 group-hover/feat:text-primary/80'
                }`}>{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ CTA ═══ */}
        <div className="p-4 sm:p-6 lg:p-8 pt-0 mt-auto">
          <button
            onClick={() => onSelect(product)}
            disabled={isCurrentPlan}
            className={`w-full py-3 sm:py-3.5 lg:py-4 rounded-xl sm:rounded-2xl font-bold text-[11px] sm:text-xs lg:text-sm uppercase tracking-[0.12em] sm:tracking-[0.15em] transition-all duration-500 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2
              ${isCurrentPlan
                ? 'bg-primary/[0.04] text-primary/25 border border-outline-variant/15 cursor-default'
                : isHighlighted
                  ? `bg-gradient-to-r ${theme.accent} text-black shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]`
                  : `bg-transparent border border-outline-variant/30 text-primary/50 hover:text-primary hover:border-secondary/40 hover:bg-secondary/[0.02]`
              }
            `}
          >
            {isCurrentPlan ? (
              t('plans.currentPlanButton')
            ) : (
              <>
                {isSub ? t('plans.selectPlan') : t('plans.buyCredits')}
                <ArrowRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${isHighlighted ? 'group-hover:translate-x-1' : ''}`} />
              </>
            )}
          </button>
        </div>

        {/* Bottom decoration line */}
        <div className={`absolute bottom-0 left-4 sm:left-6 right-4 sm:right-6 h-[1px] bg-gradient-to-r from-transparent via-secondary/30 to-transparent transition-opacity duration-500 ${isHighlighted ? 'opacity-100' : 'opacity-0 group-hover:opacity-70'}`} />
      </div>
    </motion.div>
  );
}
