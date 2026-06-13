'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Wallet, Sparkles, Clock, Package, Calendar, Crown, Zap } from 'lucide-react';
import Card from '@/components/ui/Card';
import { BalanceResponse, getTierLabel } from '@/types/billing';
import { useTranslation } from '@/hooks';
import { usePaywallContext } from '@/context/PaywallContext';

interface CreditBalanceCardProps {
  balance: BalanceResponse | null;
  isLoading?: boolean;
  variant?: 'full' | 'compact';
  className?: string;
}

/** Animated counter — counts from 0 to target with ease-out. */
function AnimatedCounter({ value, duration = 800 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (value === display) return;
    startTime.current = performance.now();
    const startVal = display;
    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (value - startVal) * eased);
      setDisplay(current);
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <>{display.toLocaleString()}</>;
}

export default function CreditBalanceCard({
  balance,
  isLoading = false,
  variant = 'full',
  className = '',
}: CreditBalanceCardProps) {
  const { t, language } = useTranslation();

  // ── Loading ──
  if (isLoading) {
    return variant === 'compact' ? (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 rounded-full bg-secondary/10 animate-pulse" />
        <span className="text-[10px] text-primary/30 animate-pulse">...</span>
      </div>
    ) : (
      <Card padding="md" className={`!rounded-[24px] ${className}`}>
        <div className="flex items-center justify-center py-6">
          <div className="space-y-3 w-full">
            <div className="h-4 w-32 bg-primary/[0.04] rounded-full animate-pulse mx-auto" />
            <div className="h-10 w-48 bg-primary/[0.04] rounded-full animate-pulse mx-auto" />
          </div>
        </div>
      </Card>
    );
  }

  if (!balance) return null;

  // ── Compact ──
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-secondary/10 border border-secondary/20">
          <Wallet className="w-3.5 h-3.5 text-secondary" />
          <span className="text-[10px] font-bold text-secondary tabular-nums">{balance.credits}</span>
        </div>
        <span className="text-[9px] font-bold text-primary/30 uppercase tracking-widest">
          {getTierLabel(balance.tier)}
        </span>
      </div>
    );
  }

  // ── Full ──
  const { catalog } = usePaywallContext();
  const hasBreakdown = balance.subscriptionCredits != null || balance.packCredits != null;
  const dateLocale = language === 'hi' ? 'hi-IN' : 'en-IN';
  const tierLabel = getTierLabel(balance.tier);
  const planTier = (balance.tier || '').toLowerCase();
  const isPremium = planTier === 'premium';
  const isPro = planTier === 'pro';
  const isFree = planTier === 'free' || !balance.tier;
  const hasExpiry = balance.nextRenewalAt || balance.tierExpiresAt || balance.creditsExpireAt || balance.nearestPackExpiry;

  const activeSub = catalog?.subscriptions.find(s => s.tier?.toLowerCase() === planTier);
  const planColor = activeSub?.color || (isPremium ? '#D97706' : isPro ? '#7C3AED' : '#6B7280');
  const CardIcon = isPremium ? Crown : isPro ? Crown : Wallet;

  return (
    <Card
      padding="md"
      variant="bordered"
      className={`!rounded-[24px] sm:!rounded-[28px] border-secondary/20 overflow-hidden relative ${className}`}
      style={{ '--plan-color': planColor } as React.CSSProperties}
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: `radial-gradient(ellipse 60% 120% at 15% 50%, var(--plan-color) 0%, transparent 70%),
            radial-gradient(ellipse 40% 100% at 85% 50%, var(--plan-color) 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        {/* ── Icon ── */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 bg-[var(--plan-color)]/10 border-[var(--plan-color)]/25 shadow-[0_0_30px_var(--plan-color)] text-[var(--plan-color)]">
          <CardIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" />
        </div>

        {/* ── Credit count + breakdown ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
              {t('plans.creditBalance')}
            </span>
            <span className="text-[7px] sm:text-[8px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full border bg-[var(--plan-color)]/10 text-[var(--plan-color)] border-[var(--plan-color)]/20">
              {tierLabel}
            </span>
          </div>

          <p className="text-2xl sm:text-3xl lg:text-4xl font-headline font-black text-primary tabular-nums tracking-tight">
            <AnimatedCounter value={balance.credits} />{' '}
            <span className="text-xs sm:text-sm font-medium text-primary/25">{t('plans.naviCredits')}</span>
          </p>

          {/* Breakdown */}
          {hasBreakdown && (
            <div className="flex items-center gap-3 sm:gap-4 mt-1.5 sm:mt-2.5 text-[10px] sm:text-[11px] text-primary/35 flex-wrap">
              {balance.subscriptionCredits != null && (
                <span className="inline-flex items-center gap-1 sm:gap-1.5">
                  <Zap className="w-3.5 h-3.5 shrink-0 text-secondary/60" />
                  <span className="font-bold text-secondary/70">{balance.subscriptionCredits}</span>
                  {t('plans.subscriptionCredits')}
                </span>
              )}
              {balance.packCredits != null && (
                <span className="inline-flex items-center gap-1 sm:gap-1.5">
                  <Package className="w-3 h-3 text-primary/20 shrink-0" />
                  <span className="font-bold text-primary/45">{balance.packCredits}</span>
                  {t('plans.packCredits')}
                </span>
              )}
            </div>
          )}

          {balance.activePackCount != null && balance.activePackCount > 0 && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-primary/25">
              <Package className="w-3 h-3 text-secondary/20 shrink-0" />
              <span>{balance.activePackCount} {t('plans.activePacks')}</span>
            </div>
          )}
        </div>

        {/* ── Expiry info — stacks on mobile, right-aligned on desktop ── */}
        {hasExpiry && (
          <div className="flex flex-row sm:flex-col gap-2 sm:gap-1.5 sm:text-right shrink-0 flex-wrap text-[10px] text-primary/30 w-full sm:w-auto">
            {balance.nextRenewalAt && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3 text-secondary/30 shrink-0" />
                <span className="hidden sm:inline">{t('plans.nextRenewal')}: </span>
                {new Date(balance.nextRenewalAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
              </span>
            )}
            {balance.tierExpiresAt && !balance.nextRenewalAt && (
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-secondary/30 shrink-0" />
                <span className="hidden sm:inline">{t('plans.subscriptionExpires')}: </span>
                {new Date(balance.tierExpiresAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
              </span>
            )}
            {balance.creditsExpireAt && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary/20 shrink-0" />
                <span className="hidden sm:inline">{t('plans.creditsExpire')}: </span>
                {new Date(balance.creditsExpireAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
              </span>
            )}
            {balance.nearestPackExpiry && (
              <span className="inline-flex items-center gap-1">
                <Package className="w-3 h-3 text-primary/20 shrink-0" />
                <span className="hidden sm:inline">{t('plans.nearestPackExpiry')}: </span>
                {new Date(balance.nearestPackExpiry).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
