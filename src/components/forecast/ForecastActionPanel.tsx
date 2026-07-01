'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, MessageCircle, Lightbulb, AlertTriangle, Sparkles, Target } from 'lucide-react';
import type { ForecastArea } from '@/data/areaThemes';

type ForecastAlert = string | { simple: string; technical?: string };

interface ForecastActionPanelProps {
  area: ForecastArea | 'overall';
  colorHex: string;
  best?: string;
  worst?: string;
  average?: number;
  dominantPlanet?: string;
  dominantPlanetMeaning?: string;
  alerts?: ForecastAlert[];
  actionText?: string;
  periodLabel: string;
  t: (key: string) => string;
}

function SubHeading({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-foreground/55">
        {label}
      </span>
      <div className="h-[1px] flex-1 bg-white/5 relative">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

export default function ForecastActionPanel({
  area,
  colorHex,
  best,
  worst,
  average,
  dominantPlanet,
  dominantPlanetMeaning,
  alerts,
  actionText,
  periodLabel,
  t,
}: ForecastActionPanelProps) {
  const handleChatPrompt = (prompt: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('astranavi_pending_message', prompt);
    }
  };

  const cautionAlerts = React.useMemo(() => {
    if (!alerts) return [];
    const out: string[] = [];
    alerts.forEach(a => {
      const text = typeof a === 'object' ? a.simple : a;
      if (text && (text.toLowerCase().includes('avoid') || text.toLowerCase().includes('caution') || text.toLowerCase().includes('wait'))) {
        out.push(text);
      }
    });
    return out.slice(0, 2);
  }, [alerts]);

  const bestText = React.useMemo(() => {
    if (best) return best;
    if (!average) return '';
    if (average >= 70) return t('forecast.action.bestHigh');
    if (average >= 45) return t('forecast.action.bestStable');
    return t('forecast.action.bestLow');
  }, [best, average, t]);

  const worstText = React.useMemo(() => {
    if (worst) return worst;
    if (!average) return '';
    if (average >= 70) return t('forecast.action.worstHigh');
    if (average >= 45) return t('forecast.action.worstStable');
    return t('forecast.action.worstLow');
  }, [worst, average, t]);

  const opportunityText = bestText
    ? t('forecast.action.opportunityBody').replace('{best}', bestText)
    : t('forecast.action.opportunityDefault');
  const cautionText = worstText
    ? t('forecast.action.cautionBody').replace('{worst}', worstText)
    : cautionAlerts[0] || t('forecast.action.cautionDefault');
  const action = actionText || t('forecast.action.recommendedDefault');

  const prompt = t('forecast.action.chatPrompt')
    .replace('{area}', t(`horoscope.category${area.charAt(0).toUpperCase() + area.slice(1)}`))
    .replace('{period}', periodLabel);

  return (
    <div className="border-white/5 bg-surface shadow-xl rounded-[32px] p-6 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left: opportunities + caution */}
        <div className="lg:col-span-7 flex flex-col gap-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colorHex + '12' }}>
                  <Lightbulb className="w-4 h-4" style={{ color: colorHex }} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground/90">{t('forecast.action.opportunities')}</span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{opportunityText}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 flex flex-col gap-2.5"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground/90">{t('forecast.action.caution')}</span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed">{cautionText}</p>
            </motion.div>
          </div>

          {/* Key planetary influence */}
          {(dominantPlanet || dominantPlanetMeaning) && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5"
            >
              <SubHeading label={t('forecast.action.keyInfluence')} color={colorHex} />
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: colorHex + '12', borderColor: colorHex + '25' }}>
                  <Sparkles className="w-5 h-5" style={{ color: colorHex }} />
                </div>
                <div>
                  <span className="text-base font-headline font-bold text-foreground block mb-1">
                    {dominantPlanet || t('forecast.action.planetDefault')}
                  </span>
                  <p className="text-sm text-foreground/85 leading-relaxed">
                    {dominantPlanetMeaning || t('forecast.action.influenceDefault')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recommended action */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ borderColor: colorHex + '18', backgroundColor: colorHex + '05' }}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: colorHex + '12' }}>
                <Target className="w-5 h-5" style={{ color: colorHex }} />
              </div>
              <div>
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-foreground/55 block">{t('forecast.action.recommended')}</span>
                <p className="text-sm text-foreground/90 leading-relaxed">{action}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: Ask AI astrologer */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-[28px] border border-white/5 bg-white/[0.02] p-6 sm:p-7 flex flex-col gap-5 h-full justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-secondary" />
                </div>
                <span className="text-xs sm:text-sm font-bold text-foreground/90">{t('forecast.action.askAstrologer')}</span>
              </div>
              <p className="text-sm text-foreground/85 leading-relaxed mb-4">
                {t('forecast.action.askBody')}
              </p>
              <ul className="space-y-2.5">
                {[
                  t('forecast.action.askExample1'),
                  t('forecast.action.askExample2'),
                  t('forecast.action.askExample3'),
                ].map((ex, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="w-1 h-1 rounded-full mt-2 shrink-0" style={{ backgroundColor: colorHex }} />
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/chat"
              onClick={() => handleChatPrompt(prompt)}
              className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-white transition-all shadow-md hover:brightness-110 active:scale-[0.98]"
              style={{ backgroundColor: colorHex }}
            >
              {t('forecast.action.ctaChat')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
