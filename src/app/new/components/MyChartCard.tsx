'use client';

import React from 'react';
import Link from 'next/link';
import { Orbit, Sparkles, ChevronRight, UserCheck } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useTranslation } from '@/hooks';
import { parseKundliStats } from '@/lib/kundliStats';
import type { User } from '@/context/AuthContext';

interface Props {
  user: User | null;
  loading: boolean;
}

export default function MyChartCard({ user, loading }: Props) {
  const { t } = useTranslation();

  if (loading || !user) {
    return (
      <Card padding="md" className="!rounded-[24px] 2xl:h-full 2xl:flex 2xl:flex-col">
        <div className="space-y-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-surface-variant/30 rounded w-1/4" />
            <div className="h-4 bg-surface-variant/30 rounded w-1/6" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="h-20 bg-surface-variant/30 rounded-xl" />
            <div className="h-20 bg-surface-variant/30 rounded-xl" />
            <div className="h-20 bg-surface-variant/30 rounded-xl" />
          </div>
          <div className="h-10 bg-surface-variant/30 rounded-full w-full" />
        </div>
      </Card>
    );
  }

  const stats = parseKundliStats(user.astrologyData);

  // If astrology data is missing, render the empty onboarding card
  if (!stats) {
    return (
      <div className="space-y-3 2xl:h-full 2xl:flex 2xl:flex-col">
        {/* Header */}
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
            {t('newDashboard.myChart.title')}
          </span>
          <Link
            href="/profile?onboarding=true"
            className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            {t('newDashboard.myChart.viewDetails')} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Empty State Onboarding Card */}
        <Card padding="md" className="!rounded-[24px] border border-outline-variant/20 bg-surface 2xl:flex-1 2xl:flex 2xl:flex-col">
          <div className="flex flex-col items-center text-center p-4 2xl:flex-1 2xl:justify-center">
            <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary mb-3">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-[15px] font-headline font-bold text-foreground">
              {t('newDashboard.myChart.emptyTitle')}
            </h3>
            <p className="text-[12px] text-foreground/50 mt-1 max-w-[280px]">
              {t('newDashboard.myChart.emptyBody')}
            </p>
            <Link href="/profile?onboarding=true" className="mt-4">
              <button className="px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-secondary to-amber-500 text-background hover:brightness-105 transition-all shadow-sm">
                {t('newDashboard.myChart.emptyCta')}
              </button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Formatting dates helper
  const formatDateRange = (startStr?: string, endStr?: string): string => {
    if (!endStr) return '—';
    try {
      const endObj = new Date(endStr);
      const endFormatted = endObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (startStr) {
        const startObj = new Date(startStr);
        const startFormatted = startObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return `${startFormatted} — ${endFormatted}`;
      }
      return `${t('newDashboard.myChart.periodEndsPrefix')} ${endFormatted}`;
    } catch (e) {
      return '—';
    }
  };

  const mahaTime = formatDateRange(stats.mahaStart, stats.mahaEnd);
  const antaTime = formatDateRange(stats.antaStart, stats.antaEnd);

  return (
    <div className="space-y-3 2xl:h-full 2xl:flex 2xl:flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
          {t('newDashboard.myChart.title')}
        </span>
        <Link
          href="/kundli"
          className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1 hover:gap-1.5 transition-all"
        >
          {t('newDashboard.myChart.viewDetails')} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Populated Chart Card */}
      <Card padding="md" className="!rounded-[24px] border border-outline-variant/20 bg-surface 2xl:flex-1 2xl:flex 2xl:flex-col">
        <div className="space-y-4 2xl:flex-1 2xl:flex 2xl:flex-col 2xl:justify-between 2xl:gap-6">
          {/* Three side-by-side tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Tile 1: Your Kundli */}
            <Link
              href="/kundli"
              className="flex flex-col items-center justify-between p-2 border border-outline-variant/20 rounded-xl bg-surface-variant/10 text-center hover:border-secondary/30 transition-all h-[110px]"
            >
              {/* Mini stylized SVG grid representing a chart */}
              <div className="w-8 h-8 opacity-40 text-foreground shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-7 h-7" stroke="currentColor" fill="none" strokeWidth="1.5">
                  <rect x="2" y="2" width="36" height="36" />
                  <line x1="2" y1="2" x2="38" y2="38" />
                  <line x1="38" y1="2" x2="2" y2="38" />
                  <line x1="20" y1="2" x2="20" y2="38" />
                  <line x1="2" y1="20" x2="38" y2="20" />
                </svg>
              </div>
              <div className="w-full">
                <div className="text-[9px] font-bold uppercase tracking-widest text-foreground/45 truncate">
                  {t('newDashboard.myChart.yourKundli')}
                </div>
                <div className="text-[11px] font-headline font-bold text-foreground truncate mt-0.5">
                  {stats.lagnaSign ? `${stats.lagnaSign}` : '—'}
                </div>
              </div>
            </Link>

            {/* Tile 2: Mahadasha */}
            <Link
              href="/kundli"
              className="flex flex-col items-center justify-between p-2 border border-outline-variant/20 rounded-xl bg-surface-variant/10 text-center hover:border-secondary/30 transition-all h-[110px] w-full min-w-0"
            >
              <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                <Orbit className="w-4 h-4" />
              </div>
              <div className="w-full min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-widest text-foreground/45 truncate">
                  {t('newDashboard.myChart.mahadasha')}
                </div>
                <div className="text-[11px] font-headline font-bold text-foreground truncate mt-0.5">
                  {stats.mahaPlanet ? stats.mahaPlanet : '—'}
                </div>
                <div className="text-[7.5px] font-medium text-foreground/40 truncate mt-0.5 tabular-nums">
                  {mahaTime}
                </div>
              </div>
            </Link>

            {/* Tile 3: Antardasha */}
            <Link
              href="/kundli"
              className="flex flex-col items-center justify-between p-2 border border-outline-variant/20 rounded-xl bg-surface-variant/10 text-center hover:border-secondary/30 transition-all h-[110px] w-full min-w-0"
            >
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="w-full min-w-0">
                <div className="text-[9px] font-bold uppercase tracking-widest text-foreground/45 truncate">
                  {t('newDashboard.myChart.antardasha')}
                </div>
                <div className="text-[11px] font-headline font-bold text-foreground truncate mt-0.5">
                  {stats.antaPlanet ? stats.antaPlanet : '—'}
                </div>
                <div className="text-[7.5px] font-medium text-foreground/40 truncate mt-0.5 tabular-nums">
                  {antaTime}
                </div>
              </div>
            </Link>
          </div>

          {/* Full-width CTA below */}
          <Link href="/kundli" className="w-full block pt-1">
            <button className="w-full py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider bg-gradient-to-r from-secondary/20 to-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/25 transition-all shadow-sm flex items-center justify-center gap-1">
              {t('newDashboard.myChart.exploreFullAnalysis')} <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
