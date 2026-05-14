'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { CreditHistoryResponse, normalizeHistoryResponse, isPositiveEntry, ActionCategory, getActionCategoryLabel } from '@/types/billing';
import { Sparkles, Clock, MessageSquare, Globe, Heart, Brain, FileText, ArrowUpRight, ArrowDownRight, Filter, ShoppingCart, RotateCcw, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import { clientFetch } from '@/lib/apiClient';

/** Map feature key to icon. */
const featureIconMap: Record<string, React.ReactNode> = {
  chat_message: <MessageSquare className="w-4 h-4" />,
  full_daily_horoscope: <Globe className="w-4 h-4" />,
  tomorrow_horoscope: <Globe className="w-4 h-4" />,
  guided_consult: <Brain className="w-4 h-4" />,
  match_report: <Heart className="w-4 h-4" />,
  kundli_premium: <FileText className="w-4 h-4" />,
  kundli_report: <FileText className="w-4 h-4" />,
  monthly_report: <FileText className="w-4 h-4" />,
  daily_horoscope_pro: <Globe className="w-4 h-4" />,
  pack_purchase: <ShoppingCart className="w-4 h-4" />,
  grant: <Sparkles className="w-4 h-4" />,
  refund: <RotateCcw className="w-4 h-4" />,
  subscription_cycle_reset: <RefreshCw className="w-4 h-4" />,
};

/** Filter tab options using actionCategory values. */
const FILTER_OPTIONS: { key: ActionCategory | ''; labelKey: string }[] = [
  { key: '',          labelKey: 'plans.filterAll' },
  { key: 'usage',     labelKey: 'plans.filterConsume' },
  { key: 'grant',     labelKey: 'plans.filterGrant' },
  { key: 'refund',    labelKey: 'plans.filterRefund' },
  { key: 'purchase',  labelKey: 'plans.filterPurchase' },
];

interface CreditHistoryProps {
  /** Optional history override — if null, will fetch from API. */
  history?: CreditHistoryResponse | null;
  /** Max entries to show. */
  limit?: number;
  className?: string;
}

export default function CreditHistory({
  history,
  limit = 10,
  className = '',
}: CreditHistoryProps) {
  const { isLoggedIn } = useAuth();
  const { t, language } = useTranslation();
  const [fetchedHistory, setFetchedHistory] = useState<CreditHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActionCategory | ''>('');

  // Fetch history — don't send action param for category-based tabs
  // (backend only supports specific action values, not categories)
  useEffect(() => {
    if (!isLoggedIn) return;
    if (history) {
      setFetchedHistory(history);
      return;
    }

    setLoading(true);
    clientFetch(`/api/entitlements/history?limit=${limit}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setFetchedHistory(normalizeHistoryResponse(data));
      })
      .catch(err => console.warn('[CreditHistory] Fetch failed:', err))
      .finally(() => setLoading(false));
  }, [isLoggedIn, history, limit]);

  // Client-side filter by actionCategory
  const activeHistory = fetchedHistory || history;
  const allEntries = activeHistory?.entries || [];
  const filteredEntries = activeFilter
    ? allEntries.filter(e => e.actionCategory === activeFilter)
    : allEntries;

  // Date locale
  const dateLocale = language === 'hi' ? 'hi-IN' : 'en-IN';

  if (loading) {
    return (
      <Card padding="md" className={`!rounded-[24px] ${className}`}>
        <div className="space-y-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-12 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (!activeHistory || filteredEntries.length === 0) {
    return (
      <Card padding="md" variant="bordered" className={`!rounded-[24px] ${className}`}>
        <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
            <Clock className="w-6 h-6 text-secondary/40" />
          </div>
          <h3 className="text-sm font-headline font-bold text-foreground">{t('plans.noCreditHistory')}</h3>
          <p className="text-xs text-foreground/40 max-w-md">{t('plans.noCreditHistoryDesc')}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md" variant="bordered" className={`!rounded-[24px] ${className}`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-secondary" />
            <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">
              {t('plans.creditUsageHistory')}
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-foreground/30" />
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setActiveFilter(opt.key)}
                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg transition-colors ${
                  activeFilter === opt.key
                    ? 'bg-secondary/15 text-secondary border border-secondary/20'
                    : 'text-foreground/30 hover:text-foreground/50'
                }`}
              >
                {opt.key === '' ? t(opt.labelKey) : getActionCategoryLabel(opt.key as ActionCategory, t)}
              </button>
            ))}
          </div>
        </div>

        {/* Entries */}
        <AnimatePresence>
          {filteredEntries.map((entry, idx) => {
            const isPositive = isPositiveEntry(entry);
            const delta = entry.creditsDelta ?? (isPositive ? entry.creditsSpent : -entry.creditsSpent);

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                  isPositive
                    ? 'bg-emerald-500/[0.06] border-emerald-500/10'
                    : 'bg-surface-variant/20 border-outline-variant/10'
                }`}
              >
                {/* Feature icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isPositive
                    ? 'bg-emerald-500/10 text-emerald-500/70'
                    : 'bg-secondary/10 text-secondary'
                }`}>
                  {featureIconMap[entry.featureKey] || featureIconMap[entry.action] || <Sparkles className="w-4 h-4" />}
                </div>

                {/* Feature name + description */}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-foreground/80 truncate">
                    {language === 'hi' && entry.featureNameHi ? entry.featureNameHi : entry.featureNameEn}
                  </p>
                  <div className="flex items-center gap-2">
                    {entry.description && (
                      <p className="text-[10px] text-foreground/30 truncate">{entry.description}</p>
                    )}
                    {/* Source type badge */}
                    {entry.sourceType && (
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-foreground/5 text-foreground/25">
                        {entry.sourceType}
                      </span>
                    )}
                    {/* Reservation status badge */}
                    {entry.reservationStatus && entry.reservationStatus !== 'confirmed' && (
                      <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500/60">
                        {entry.reservationStatus}
                      </span>
                    )}
                  </div>
                </div>

                {/* Credits delta with sign */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-0.5">
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3 text-emerald-500/70" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 text-secondary/70" />
                    )}
                    <p className={`text-[12px] font-bold ${
                      isPositive ? 'text-emerald-500/80' : 'text-secondary'
                    }`}>
                      {delta > 0 ? `+${delta}` : delta}
                    </p>
                  </div>
                  {/* Balance after */}
                  {entry.balanceAfter != null && (
                    <p className="text-[9px] text-foreground/30 font-bold">
                      {entry.balanceAfter} {t('plans.balanceAfter')}
                    </p>
                  )}
                </div>

                {/* Date */}
                <div className="text-right shrink-0 min-w-[60px]">
                  <p className="text-[10px] text-foreground/30 font-bold">
                    {new Date(entry.createdAt).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Card>
  );
}