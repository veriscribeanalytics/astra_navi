'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { Package, Calendar, Shield, Crown, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import { clientFetch } from '@/lib/apiClient';

// ─── Types for subscription and packs responses ──────────────

/** User's active subscription details (from /api/entitlements/subscription). */
interface SubscriptionDetails {
  id: string;
  planTier: string;           // "pro" or "premium"
  productId: string;          // e.g. "sub_pro_monthly"
  status: string;             // "active" | "cancelled" | "expired"
  provider: string;           // "razorpay" | "manual" | "admin" | "google_play" | "app_store" | "system"
  creditsMonthly: number;
  creditsUsed: number;
  creditsRemaining: number;
  cycleStart: string;         // ISO datetime
  cycleEnd: string;           // ISO datetime
  startedAt: string;          // ISO datetime
}

/** User's active credit pack (from /api/entitlements/packs). */
interface PackDetails {
  id: string;
  productId: string;
  productName: string;
  creditsTotal: number;
  creditsRemaining: number;
  status: string;             // "active" | "exhausted" | "expired"
  amountPaid: number | null;
  purchasedAt: string;        // ISO datetime
  expiresAt: string | null;   // ISO datetime
}

// ─── Normalize helpers ────────────────────────────────────────

function normalizeSubscription(raw: Record<string, unknown>): SubscriptionDetails | null {
  if (!raw || typeof raw !== 'object') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = raw as any;
  // The backend returns a nested "subscription" key
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
  const { t, language } = useTranslation();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [packs, setPacks] = useState<PackDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

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
  }, [isLoggedIn]);

  const dateLocale = language === 'hi' ? 'hi-IN' : 'en-IN';

  if (!isLoggedIn) return null;
  if (loading) {
    return (
      <Card padding="md" variant="bordered" className="!rounded-[24px]">
        <div className="space-y-3">
          {[0, 1].map(i => (
            <div key={i} className="h-10 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  const hasSubscription = subscription && subscription.status === 'active';
  const activePacks = packs.filter(p => p.status === 'active');

  if (!hasSubscription && activePacks.length === 0) return null;

  return (
    <Card padding="md" variant="bordered" className="!rounded-[24px] border-secondary/20">
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-secondary" />
          <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">
            {t('plans.currentPlan')}
          </span>
        </div>

        {/* Active subscription */}
        {hasSubscription ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/[0.04] border border-secondary/10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-secondary/10 text-secondary">
              <Crown className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-foreground/80">
                {t('plans.currentSubscription')}: {subscription.productId}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-foreground/40">
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-secondary/50" />
                  {subscription.creditsRemaining}/{subscription.creditsMonthly} {t('plans.naviCredits')}
                </span>
                {subscription.cycleEnd && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-secondary/40" />
                    {t('plans.nextRenewal')}: {new Date(subscription.cycleEnd).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/15">
              {subscription.planTier}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] text-foreground/30">
            <span>{t('plans.noSubscription')}</span>
          </div>
        )}

        {/* Active packs */}
        {activePacks.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
              <Package className="w-3 h-3 text-secondary/30" />
              <span>{t('plans.currentCreditPacks')}</span>
            </div>
            {activePacks.map(pack => (
              <div key={pack.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-surface-variant/20 border border-outline-variant/10">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-foreground/5 text-foreground/40">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-foreground/70">{pack.productName}</p>
                  <div className="flex items-center gap-2 text-[9px] text-foreground/30">
                    <span>{pack.creditsRemaining}/{pack.creditsTotal} {t('plans.naviCredits')}</span>
                    {pack.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {t('plans.packExpires')}: {new Date(pack.expiresAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-foreground/5 text-foreground/25">
                  {pack.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] text-foreground/30">
            <span>{t('plans.noCreditPacks')}</span>
          </div>
        )}
      </div>
    </Card>
  );
}