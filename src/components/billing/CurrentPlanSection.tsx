'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { Package, Calendar, Shield, Crown, Zap, Star, Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import { usePaywallContext } from '@/context/PaywallContext';
import { clientFetch } from '@/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────

interface SubscriptionDetails {
  id: string;
  planTier: string;
  productId: string;
  status: string;
  provider: string;
  creditsMonthly: number;
  creditsUsed: number;
  creditsRemaining: number;
  cycleStart: string;
  cycleEnd: string;
  startedAt: string;
}

interface PackDetails {
  id: string;
  productId: string;
  productName: string;
  creditsTotal: number;
  creditsRemaining: number;
  status: string;
  amountPaid: number | null;
  purchasedAt: string;
  expiresAt: string | null;
}

// ─── Normalize helpers ────────────────────────────────────────

function normalizeSubscription(raw: Record<string, unknown>): SubscriptionDetails | null {
  if (!raw || typeof raw !== 'object') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = raw as any;
  const sub = s.subscription && typeof s.subscription === 'object' ? s.subscription : s;
  if (!sub.id) return null;
  return {
    id: sub.id,
    planTier: sub.plan_tier || sub.planTier || sub.tier || 'free',
    productId: sub.product_id || sub.productId || '',
    status: sub.status || 'active',
    provider: sub.provider || 'system',
    creditsMonthly: sub.credits_monthly || sub.creditsMonthly || 0,
    creditsUsed: sub.credits_used || sub.creditsUsed || 0,
    creditsRemaining: sub.credits_remaining || sub.creditsRemaining || 0,
    cycleStart: sub.cycle_start || sub.cycleStart || '',
    cycleEnd: sub.cycle_end || sub.cycleEnd || '',
    startedAt: sub.started_at || sub.startedAt || '',
  };
}

function normalizePacks(raw: Record<string, unknown>): PackDetails[] {
  if (!raw || typeof raw !== 'object') return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = raw as any;
  const packArray = Array.isArray(p.packs) ? p.packs : Array.isArray(p) ? p : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return packArray.map((pk: any) => ({
    id: pk.id || 'unknown',
    productId: pk.product_id || pk.productId || '',
    productName: pk.product_name || pk.productName || 'Credit Pack',
    creditsTotal: pk.credits_total || pk.creditsTotal || 0,
    creditsRemaining: pk.credits_remaining || pk.creditsRemaining || 0,
    status: pk.status || 'active',
    amountPaid: pk.amount_paid ?? pk.amountPaid ?? null,
    purchasedAt: pk.purchased_at || pk.purchasedAt || '',
    expiresAt: pk.expires_at ?? pk.expiresAt ?? null,
  }));
}

// ─── Component ────────────────────────────────────────────────

export default function CurrentPlanSection() {
  const { isLoggedIn } = useAuth();
  const { refreshVersion } = usePaywallContext();
  const { t, language } = useTranslation();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [packs, setPacks] = useState<PackDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      clientFetch('/api/entitlements/subscription')
        .then(res => res.ok ? res.json() : null)
        .then(data => data ? normalizeSubscription(data) : null)
        .catch(() => null),
      clientFetch('/api/entitlements/packs')
        .then(res => res.ok ? res.json() : null)
        .then(data => data ? normalizePacks(data) : [])
        .catch(() => []),
    ]).then(([sub, pk]) => {
      setSubscription(sub);
      setPacks(pk);
      setLoading(false);
    });
    // refreshVersion bumps after a successful purchase (PaywallContext.refresh),
    // re-running this fetch so the plan/packs reflect the new purchase immediately.
  }, [isLoggedIn, refreshVersion]);

  const dateLocale = language === 'hi' ? 'hi-IN' : 'en-IN';

  if (!isLoggedIn) return null;
  if (loading) {
    return (
      <Card padding="md" variant="bordered" className="!rounded-[28px] border-secondary/20">
        <div className="space-y-3">
          {[0, 1].map(i => (
            <div key={i} className="h-12 rounded-2xl bg-primary/[0.03] animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  const hasSubscription = subscription && subscription.status === 'active';
  const activePacks = packs.filter(p => p.status === 'active');
  if (!hasSubscription && activePacks.length === 0) return null;

  const { catalog } = usePaywallContext();
  const planTier = (subscription?.planTier || '').toLowerCase();
  const isPremium = planTier === 'premium';
  const isPro = planTier === 'pro';
  const isFree = planTier === 'free' || !subscription;

  const TierIcon = isPremium ? Crown : isPro ? Sparkles : Shield;

  const activeSub = catalog?.subscriptions.find(s => s.tier?.toLowerCase() === planTier);
  const planColor = activeSub?.color || (isPremium ? '#D97706' : isPro ? '#7C3AED' : '#6B7280');

  return (
    <Card
      padding="md"
      variant="bordered"
      className="!rounded-[28px] border-secondary/20 overflow-hidden relative"
      style={{ '--plan-color': planColor } as React.CSSProperties}
    >
      {/* Subtle inner glow */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          background: `radial-gradient(ellipse 50% 100% at 10% 50%, var(--plan-color) 0%, transparent 70%)`,
        }}
      />

      <div className="relative space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-[var(--plan-color)]/10 border border-[var(--plan-color)]/20">
            <Star className="w-3.5 h-3.5 text-secondary" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary">
            {t('plans.currentPlan')}
          </span>
          <div className="h-[1px] flex-1 bg-gradient-to-r from-secondary/15 to-transparent" />
        </div>

        {/* Active subscription */}
        {hasSubscription ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-500 bg-[var(--plan-color)]/[0.03] border-[var(--plan-color)]/15">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-[var(--plan-color)]/10 border-[var(--plan-color)]/25 text-[var(--plan-color)]">
              <TierIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-primary/80">
                {t('plans.currentSubscription')}: <span className="text-secondary">{subscription.productId}</span>
              </p>
              <div className="flex items-center gap-3 text-[10px] text-primary/35 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-secondary/50" />
                  {subscription.creditsRemaining}/{subscription.creditsMonthly} {t('plans.naviCredits')}
                </span>
                {subscription.cycleEnd && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary/25" />
                    {t('plans.nextRenewal')}: {new Date(subscription.cycleEnd).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border bg-[var(--plan-color)]/10 text-[var(--plan-color)] border-[var(--plan-color)]/20">
              {subscription.planTier}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] text-primary/25">
            <span>{t('plans.noSubscription')}</span>
          </div>
        )}

        {/* Active packs */}
        {activePacks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-primary/30">
              <Package className="w-3 h-3 text-secondary/25" />
              <span>{t('plans.currentCreditPacks')}</span>
            </div>
            {activePacks.map(pack => (
              <div key={pack.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/[0.02] border border-outline-variant/10 hover:border-outline-variant/20 transition-all duration-300">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/[0.04] border border-outline-variant/10">
                  <Package className="w-3.5 h-3.5 text-primary/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-primary/60">{pack.productName}</p>
                  <div className="flex items-center gap-2 text-[9px] text-primary/25">
                    <span>{pack.creditsRemaining}/{pack.creditsTotal} {t('plans.naviCredits')} {t('plans.packRemaining')}</span>
                    {pack.expiresAt && (
                      <span className="flex items-center gap-1">
                        · {t('plans.packExpires')}: {new Date(pack.expiresAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[7px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md bg-primary/[0.04] text-primary/20">
                  {pack.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
