'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { ForecastOverview as OverviewData, ForecastNavigation } from '@/types/forecast';
import { resolveTone } from '@/utils/forecastTones';

interface ForecastOverviewProps {
  periodLabel: string;
  overview: OverviewData;
  navigation: ForecastNavigation;
  colorHex: string;
  onPrevious: (cursor: string) => void;
  onNext: (cursor: string) => void;
  t: (key: string) => string;
}

export default function ForecastOverview({
  periodLabel,
  overview,
  navigation,
  colorHex,
  onPrevious,
  onNext,
  t,
}: ForecastOverviewProps) {
  const tone = overview.tone;
  const { color: toneColor, labelKey } = resolveTone(tone, colorHex);
  const toneLabel = labelKey ? t(labelKey) : tone;

  const handlePrev = () => {
    if (navigation.can_go_previous && navigation.previous) {
      onPrevious(navigation.previous);
    }
  };

  const handleNext = () => {
    if (navigation.can_go_next && navigation.next) {
      onNext(navigation.next);
    }
  };

  return (
    <motion.div
      key={overview.title}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-5 sm:p-7 lg:p-8 rounded-2xl sm:rounded-[28px] bg-surface border border-white/5 shadow-lg flex flex-col gap-4 overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-40 h-40 rounded-full -mr-20 -mt-20 blur-[80px] pointer-events-none"
        style={{ backgroundColor: colorHex + '14' }}
      />
      <div className="flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] shrink-0"
            style={{ color: colorHex, backgroundColor: colorHex + '12' }}
          >
            {periodLabel}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-foreground/30 truncate hidden sm:inline">
            {t('forecast.overviewLabel')}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handlePrev}
            disabled={!navigation.can_go_previous}
            aria-label={t('forecast.previous')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/5 bg-surface flex items-center justify-center transition-all hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-foreground/70" />
          </button>
          <button
            onClick={handleNext}
            disabled={!navigation.can_go_next}
            aria-label={t('forecast.next')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border border-white/5 bg-surface flex items-center justify-center transition-all hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-foreground/70" />
          </button>
        </div>
      </div>

      <h2 className="relative z-10 text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-foreground leading-tight tracking-tight">
        {overview.title}
      </h2>

      <p className="relative z-10 text-[13px] sm:text-sm lg:text-base text-foreground/70 leading-relaxed">
        {overview.text}
      </p>

      <div className="relative z-10 flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
        {toneLabel && (
          <span
            className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: toneColor, backgroundColor: toneColor + '12' }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: toneColor }} />
            {toneLabel}
          </span>
        )}
        {overview.key_theme && (
          <span className="px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 bg-white/[0.03] border border-white/5 text-foreground/70">
            <Sparkles className="w-3 h-3 text-secondary/70" />
            <span className="capitalize">{overview.key_theme}</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}
