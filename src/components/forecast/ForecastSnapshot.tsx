'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { Sparkles, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface InsightData {
  month?: string;
  date?: string;
  score: number;
  text: string;
  dominant_planet?: string;
  alerts?: (string | { simple: string; technical?: string })[];
  transits?: Record<string, { sign: string; house_from_lagna?: number }>;
}

interface SummaryData {
  best_month?: string;
  worst_month?: string;
  best_day?: string;
  worst_day?: string;
  average_score?: number;
  trend?: string;
}

interface ForecastSnapshotProps {
  insight: InsightData | null;
  summary: SummaryData | null;
  range: '7d' | 'monthly' | 'yearly';
  theme: {
    hex: string;
    bg: string;
    color: string;
  };
  t: (key: string) => string;
}

export default function ForecastSnapshot({ insight, summary, range, theme, t }: ForecastSnapshotProps) {
  const score = insight ? insight.score : (summary?.average_score ?? 50);

  const deriveLabel = (s: number) => {
    if (s >= 70) return t('forecast.labelFavorable');
    if (s >= 45) return t('forecast.labelStable');
    return t('forecast.labelChallenging');
  };

  const label = deriveLabel(score);

  // Stats
  const dominantPlanet = insight?.dominant_planet || '—';
  const bestDay = range === '7d' ? (summary?.best_day || '—') : (summary?.best_month || '—');
  const challengingDay = range === '7d' ? (summary?.worst_day || '—') : (summary?.worst_month || '—');

  // Suggestion text
  let suggestion = '';
  if (insight?.alerts && insight.alerts.length > 0) {
    const firstAlert = insight.alerts[0];
    suggestion = typeof firstAlert === 'object' ? firstAlert.simple : firstAlert;
  } else if (insight?.text) {
    suggestion = insight.text.slice(0, 140) + (insight.text.length > 140 ? '...' : '');
  } else {
    suggestion = t('forecast.snapshot.defaultSuggestion');
  }

  // Pre-filled chat prompts
  const whyPrompt = t('forecast.snapshot.whyPrompt').replace('{score}', String(score));
  const planPrompt = t('forecast.snapshot.planPrompt');

  const handleCtaClick = (prompt: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('astranavi_pending_message', prompt);
    }
  };

  return (
    <Card padding="lg" className="border-white/5 bg-surface/30 backdrop-blur-md shadow-xl flex flex-col gap-6 overflow-hidden relative">
      {/* Title */}
      <div>
        <span className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-[0.25em] block mb-1">
          {t('forecast.todaysSnapshot')}
        </span>
      </div>

      {/* Score Circle & Label */}
      <div className="flex flex-col items-center justify-center py-4 relative">
        <div className="relative flex items-center justify-center w-36 h-36 rounded-full border border-white/5 bg-white/[0.01]">
          <div 
            className="absolute inset-0 rounded-full blur-xl opacity-20 transition-all duration-500" 
            style={{ backgroundColor: theme.hex }}
          />
          <div className="flex flex-col items-center justify-center text-center">
            <span 
              className="text-5xl lg:text-6xl 3xl:text-7xl font-headline font-black transition-all duration-300 animate-pulse"
              style={{ color: theme.hex }}
            >
              {score}
            </span>
            <span className="text-[10px] lg:text-[11px] 3xl:text-xs font-bold uppercase tracking-wider text-foreground/30 mt-0.5">
              / 100
            </span>
          </div>
        </div>
        <span 
          className="text-xs sm:text-sm font-bold uppercase tracking-wider text-center mt-4 transition-all duration-300"
          style={{ color: theme.hex }}
        >
          {label}
        </span>
      </div>

      {/* Stat Rows */}
      <div className="space-y-3.5 border-t border-b border-white/5 py-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] lg:text-[11px] 3xl:text-xs font-bold uppercase text-foreground/40 tracking-wider">
            {t('horoscope.dominantForce')}
          </span>
          <span className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-secondary animate-pulse" />
            {dominantPlanet}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] lg:text-[11px] 3xl:text-xs font-bold uppercase text-foreground/40 tracking-wider">
            {t('forecast.bestDay')}
          </span>
          <span className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-green-500" />
            {bestDay}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] lg:text-[11px] 3xl:text-xs font-bold uppercase text-foreground/40 tracking-wider">
            {t('forecast.challengingDay')}
          </span>
          <span className="text-xs sm:text-sm font-bold text-foreground/80 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-bounce" />
            {challengingDay}
          </span>
        </div>
      </div>

      {/* Suggestion Box */}
      <div 
        className="p-4 rounded-xl border flex flex-col gap-1.5 transition-all duration-300"
        style={{ 
          borderColor: theme.hex + '15', 
          backgroundColor: theme.hex + '05' 
        }}
      >
        <span 
          className="text-[9px] lg:text-[10px] 3xl:text-[11px] font-black uppercase tracking-[0.2em]"
          style={{ color: theme.hex }}
        >
          {t('forecast.naviSuggestion')}
        </span>
        <p className="text-[11px] lg:text-xs text-foreground/75 leading-relaxed">
          {suggestion}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-2 mt-2">
        <Link 
          href="/chat"
          onClick={() => handleCtaClick(whyPrompt)}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider text-white transition-all shadow-md hover:brightness-110 active:scale-[0.98]"
          style={{ backgroundColor: theme.hex }}
        >
          {t('forecast.ctaAskNavi')}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link 
          href="/chat"
          onClick={() => handleCtaClick(planPrompt)}
          className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider border transition-all hover:bg-white/[0.02] active:scale-[0.98]"
          style={{ 
            borderColor: theme.hex + '30',
            color: theme.hex 
          }}
        >
          {t('forecast.ctaPlanDay')}
        </Link>
      </div>
    </Card>
  );
}
