'use client';

import React from 'react';
import { Wallet, Sparkles, Clock, Package, Calendar } from 'lucide-react';
import Card from '@/components/ui/Card';
import { BalanceResponse, getTierLabel } from '@/types/billing';
import { useTranslation } from '@/hooks';

interface CreditBalanceCardProps {
  balance: BalanceResponse | null;
  isLoading?: boolean;
  /** Compact variant for navbar dropdowns and small spaces. */
  variant?: 'full' | 'compact';
  /** Optional className for the outer wrapper. */
  className?: string;
}

export default function CreditBalanceCard({
  balance,
  isLoading = false,
  variant = 'full',
  className = '',
}: CreditBalanceCardProps) {
  const { t, language } = useTranslation();

  if (isLoading) {
    return variant === 'compact' ? (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="w-4 h-4 rounded-full bg-secondary/10 animate-pulse" />
        <span className="text-[10px] text-foreground/30 animate-pulse">...</span>
      </div>
    ) : (
      <Card padding="md" className={`!rounded-[24px] ${className}`}>
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 rounded-full bg-secondary/10 animate-pulse" />
        </div>
      </Card>
    );
  }

  if (!balance) {
    return null;
  }

  // ── Compact variant ── (for Navbar dropdown, dashboard header badge)
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-secondary/10 border border-secondary/20">
          <Wallet className="w-3.5 h-3.5 text-secondary" />
          <span className="text-[10px] font-bold text-secondary tabular-nums">
            {balance.credits}
          </span>
        </div>
        <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest">
          {getTierLabel(balance.tier)}
        </span>
      </div>
    );
  }

  // ── Full variant ── (for Plans page, Profile page)
  // Determine whether to show the breakdown row
  const hasBreakdown = balance.subscriptionCredits != null || balance.packCredits != null;

  // Date locale
  const dateLocale = language === 'hi' ? 'hi-IN' : 'en-IN';

  return (
    <Card padding="md" variant="bordered" className={`!rounded-[24px] border-secondary/20 ${className}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        {/* Icon */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(200,136,10,0.08)]">
          <Wallet className="w-6 h-6 sm:w-7 sm:h-7 text-secondary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
              {t('plans.creditBalance')}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/15">
              {getTierLabel(balance.tier)}
            </span>
          </div>
          <p className="text-2xl sm:text-3xl font-headline font-bold text-foreground tabular-nums">
            {balance.credits} <span className="text-sm text-foreground/40 font-medium">{t('plans.naviCredits')}</span>
          </p>

          {/* Credit breakdown: subscription credits + pack credits */}
          {hasBreakdown && (
            <div className="flex items-center gap-3 mt-2 text-[11px] text-foreground/50">
              {balance.subscriptionCredits != null && (
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-secondary/50 shrink-0" />
                  <span className="font-bold text-secondary/70">{balance.subscriptionCredits}</span>
                  <span>{t('plans.subscriptionCredits')}</span>
                </div>
              )}
              {balance.packCredits != null && (
                <div className="flex items-center gap-1.5">
                  <Package className="w-3 h-3 text-foreground/30 shrink-0" />
                  <span className="font-bold text-foreground/60">{balance.packCredits}</span>
                  <span>{t('plans.packCredits')}</span>
                </div>
              )}
            </div>
          )}

          {/* Active packs summary */}
          {(balance.activePackCount != null && balance.activePackCount > 0) && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-foreground/40">
              <Package className="w-3 h-3 text-secondary/30 shrink-0" />
              <span>{balance.activePackCount} {t('plans.activePacks')}</span>
            </div>
          )}
        </div>

        {/* Expiry / renewal info */}
        {(balance.nextRenewalAt || balance.tierExpiresAt || balance.creditsExpireAt || balance.nearestPackExpiry) && (
          <div className="flex flex-col gap-1 text-right shrink-0">
            {/* Cycle end / next renewal */}
            {balance.nextRenewalAt && (
              <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
                <Calendar className="w-3 h-3 text-secondary/40" />
                <span>{t('plans.nextRenewal')}: {new Date(balance.nextRenewalAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
            {/* Subscription expiry */}
            {balance.tierExpiresAt && !balance.nextRenewalAt && (
              <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
                <Sparkles className="w-3 h-3 text-secondary/40" />
                <span>{t('plans.subscriptionExpires')}: {new Date(balance.tierExpiresAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
            {/* Credits expiry */}
            {balance.creditsExpireAt && (
              <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
                <Clock className="w-3 h-3 text-foreground/30" />
                <span>{t('plans.creditsExpire')}: {new Date(balance.creditsExpireAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
            {/* Nearest pack expiry */}
            {balance.nearestPackExpiry && (
              <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
                <Package className="w-3 h-3 text-foreground/30" />
                <span>{t('plans.nearestPackExpiry')}: {new Date(balance.nearestPackExpiry).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}