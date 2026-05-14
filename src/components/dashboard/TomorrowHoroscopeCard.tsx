'use client';

import React, { useEffect, useState } from 'react';
import { clientFetch } from '@/lib/apiClient';
import Card from '@/components/ui/Card';
import { Sparkles, Lock, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from '@/hooks';
import { PaywallData } from '@/types/paywall';
import PaywallCard from '@/components/paywall/PaywallCard';

interface TomorrowData {
  sign?: string;
  date?: string;
  lang?: string;
  teaser?: boolean;
  message?: string;
  score?: { overall: number };
  tip?: string | { text: string; type: string };
  // Partial data for soft paywall
  paywall?: PaywallData;
}

export default function TomorrowHoroscopeCard({
  sign,
  userLoading,
}: {
  sign?: string;
  userLoading?: boolean;
}) {
  const { t, language } = useTranslation();
  const [data, setData] = useState<TomorrowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paywallData, setPaywallData] = useState<PaywallData | null>(null);

  useEffect(() => {
    if (userLoading) return;

    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('lang', language);
        if (sign) params.set('sign', sign);
        const url = '/api/tomorrow-horoscope?' + params.toString();

        setLoading(true);
        const res = await clientFetch(url);

        // 402 paywall — soft or hard block
        if (res.status === 402) {
          const ed = await res.json().catch(() => ({}));
          if (ed.paywall) {
            setPaywallData(ed.paywall as PaywallData);
            // Soft paywall may include partial teaser data
            if (ed.paywall.isSoft && ed.teaser) {
              setData({ teaser: true, message: ed.message, sign: ed.sign, date: ed.date, paywall: ed.paywall });
            }
            setError(null);
            setLoading(false);
            return;
          }
          setError('This feature requires an upgrade.');
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const ed = await res.json().catch(() => ({}));
          throw new Error(ed.error || 'Failed');
        }

        const result = await res.json();

        // Check for inline paywall in successful response (soft paywall with teaser)
        if (result.paywall) {
          setPaywallData(result.paywall as PaywallData);
          setData(result);
        } else if (result.teaser) {
          // Teaser for free users without paywall data — just show teaser message
          setData(result);
        } else {
          // Full data for Pro/Premium users
          setData(result);
        }
        setError(null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    })();
  }, [sign, userLoading, language]);

  // Hard paywall: fully blocked, show PaywallCard inline
  if (paywallData && !paywallData.isSoft && !data) {
    return <PaywallCard paywall={paywallData} variant="inline" />;
  }

  if (loading || userLoading) {
    return (
      <Card padding="md" className="!rounded-[24px] sm:!rounded-[32px]">
        <div className="h-24 flex flex-col items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 rounded-full border border-secondary/20"
          />
          <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest animate-pulse">
            {t('horoscope.tomorrowLoading') || 'Loading tomorrow\'s forecast...'}
          </p>
        </div>
      </Card>
    );
  }

  if (error && !data && !paywallData) {
    return (
      <Card padding="md" className="!rounded-[24px] sm:!rounded-[32px]">
        <div className="h-24 flex flex-col items-center justify-center gap-3">
          <Sparkles className="w-6 h-6 text-orange-500" />
          <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
            {t('horoscope.serviceUnavailable') || 'Tomorrow\'s forecast unavailable'}
          </p>
        </div>
      </Card>
    );
  }

  // Teaser mode: free user sees teaser message with paywall overlay
  const isTeaser = data?.teaser || (paywallData?.isSoft && !data?.score);

  return (
    <Card padding="none" className="!rounded-[24px] sm:!rounded-[32px] overflow-hidden relative bg-surface border-secondary/10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col h-full"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-secondary/[0.03] border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(200,136,10,0.1)]">
            <Calendar className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">
              {t('horoscope.tomorrowForecast') || 'Tomorrow\'s Forecast'}
            </span>
            <h3 className="text-lg font-headline font-bold text-foreground leading-tight mt-0.5">
              {data?.sign || sign || ''} — {data?.date || ''}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col items-center justify-center text-center gap-4 min-h-[120px] relative">
          {isTeaser ? (
            // Teaser + paywall overlay
            <>
              <Lock className="w-8 h-8 text-secondary/30 mb-2" />
              <p className="text-sm text-foreground/60 leading-relaxed">
                {data?.message || t('horoscope.tomorrowTeaser') || 'Unlock tomorrow\'s insights with a Pro plan. Plan your day with planetary guidance a day ahead.'}
              </p>
              {paywallData && (
                <PaywallCard paywall={paywallData} variant="inline" />
              )}
            </>
          ) : data?.score ? (
            // Full data for Pro/Premium users
            <>
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-[0_0_15px_rgba(200,136,10,0.1)]">
                <Sparkles className="w-7 h-7 text-secondary" />
              </div>
              <div className="text-3xl font-bold text-secondary">
                {data.score.overall}
              </div>
              <p className="text-sm text-foreground/60 leading-relaxed">
                {typeof data.tip === 'object' ? data.tip?.text : data.tip || t('horoscope.alignmentNeutral')}
              </p>
              <button
                className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1 hover:text-amber-500 transition-colors"
                onClick={() => {}}
              >
                {t('horoscope.detailedForecast') || 'Detailed Forecast'} <ArrowRight className="w-3 h-3" />
              </button>
            </>
          ) : (
            // Fallback: no data
            <p className="text-sm text-foreground/40">{t('horoscope.serviceUnavailable')}</p>
          )}
        </div>
      </motion.div>
    </Card>
  );
}