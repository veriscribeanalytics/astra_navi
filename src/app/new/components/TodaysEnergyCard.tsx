'use client';

import React from 'react';
import Link from 'next/link';
import { Moon, AlertTriangle, Compass } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useTranslation } from '@/hooks';
import { getRashiData } from '@/lib/astrology';
import { getScoreStyle } from '@/lib/scoreStyle';
import type { User } from '@/context/AuthContext';
import type { HoroscopeData } from '@/types/horoscope';
import type { TransitsTodayData } from '@/hooks/useTransitsToday';

interface Props {
  horoscope: HoroscopeData | null;
  transits: TransitsTodayData | null;
  user: User | null;
  loading: boolean;
}

export default function TodaysEnergyCard({ horoscope, transits, user, loading }: Props) {
  const { t } = useTranslation();

  if (loading || !user) {
    return (
      <Card padding="md" className="!rounded-[24px]">
        <div className="space-y-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-24 h-24 rounded-full bg-surface-variant/30 shrink-0" />
            <div className="flex-grow space-y-2 pt-2">
              <div className="h-4 bg-surface-variant/30 rounded w-1/4" />
              <div className="h-6 bg-surface-variant/30 rounded w-3/4" />
              <div className="h-4 bg-surface-variant/30 rounded w-1/2" />
            </div>
          </div>
          <div className="h-8 bg-surface-variant/30 rounded-full w-full" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-surface-variant/30 rounded-2xl" />
            <div className="h-16 bg-surface-variant/30 rounded-2xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="h-10 bg-surface-variant/30 rounded-full" />
            <div className="h-10 bg-surface-variant/30 rounded-full" />
          </div>
        </div>
      </Card>
    );
  }

  const score = horoscope?.score?.overall ?? 70;
  const ratingInfo = getScoreStyle(score, t);

  // SVG Ring Math
  const radius = 32;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Sign chips data
  const moonSignName = user.moonSign ? (getRashiData(user.moonSign)?.en || user.moonSign) : '—';
  const lagnaSignName = user.lagnaSign ? (getRashiData(user.lagnaSign)?.en || user.lagnaSign) : '—';
  const tithiName = transits?.panchanga?.tithi || '—';
  const nakshatraName = transits?.panchanga?.nakshatra || '—';

  // Fallbacks for good and alert times
  const timeTriggers = horoscope?.time_triggers || [];
  
  // Good Time: First trigger of type 'growth'
  const goodTrigger = timeTriggers.find(t => t.type === 'growth');
  const goodTimeText = goodTrigger ? `${goodTrigger.start} - ${goodTrigger.end}` : '—';

  // Alert Time: First trigger of type 'caution' or 'challenging', falling back to Rahu Kaal
  const alertTrigger = timeTriggers.find(t => t.type === 'caution' || t.type === 'challenging');
  let alertTimeText = '—';
  if (alertTrigger) {
    alertTimeText = `${alertTrigger.start} - ${alertTrigger.end}`;
  } else if (transits?.panchanga?.rahukaal) {
    const rk = transits.panchanga.rahukaal;
    alertTimeText = `${rk.start} - ${rk.end}`;
  }

  const alertLabel = alertTrigger ? alertTrigger.label : (transits?.panchanga?.rahukaal ? t('newDashboard.panchang.rahuKaal') : t('newDashboard.todaysEnergy.alertTime'));

  // Overall Headline: First alert simple, or default
  const headline = horoscope?.alerts?.primary?.simple || t('newDashboard.lifeAreas.statusCosmicEnergy');
  
  // Tagline: Tip text or default
  let tagline = '';
  if (horoscope?.tip) {
    tagline = typeof horoscope.tip === 'string' ? horoscope.tip : horoscope.tip.text;
  }

  return (
    <Card padding="md" className="!rounded-[24px] border border-outline-variant/20 bg-surface">
      <div className="space-y-4">
        {/* Top Row: Score Circle and Header text */}
        <div className="flex gap-4 items-center sm:items-start">
          {/* SVG Circular Score Ring */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center bg-surface-variant/10 rounded-full">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-surface-variant/30"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                stroke={ratingInfo.hex}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[18px] sm:text-[20px] font-headline font-bold text-foreground tabular-nums">
                {score}
              </span>
              <span className="text-[8px] sm:text-[9px] uppercase tracking-wider text-foreground/40 font-bold">
                / 100
              </span>
            </div>
          </div>

          {/* Right text column */}
          <div className="flex-grow pt-1 min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
              {t('newDashboard.todaysEnergy.title')}
            </div>
            <h1 className="text-[16px] sm:text-[22px] font-headline font-bold tracking-tight text-foreground truncate-2-lines mt-1 leading-tight">
              {headline}
            </h1>
            {tagline && (
              <p className="text-[12px] text-foreground/50 truncate-1-line mt-1">
                {tagline}
              </p>
            )}
          </div>
        </div>

        {/* 4 Sign Chips: Moon sign, Rising, Tithi, Nakshatra (horizontally scrollable on overflow) */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 shrink-0">
            {/* Moon Sign */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-variant/40 border border-outline-variant/10 text-[11px] font-bold text-foreground">
              <Moon className="w-3 h-3 text-secondary shrink-0" />
              <span>{moonSignName}</span>
            </div>

            {/* Lagna (Ascendant) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-variant/40 border border-outline-variant/10 text-[11px] font-bold text-foreground">
              <Compass className="w-3 h-3 text-purple-400 shrink-0" />
              <span>{lagnaSignName} Rising</span>
            </div>

            {/* Tithi */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-variant/40 border border-outline-variant/10 text-[11px] font-bold text-foreground">
              <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/40 shrink-0">TITHI</span>
              <span className="truncate max-w-[120px]">{tithiName}</span>
            </div>

            {/* Nakshatra */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-variant/40 border border-outline-variant/10 text-[11px] font-bold text-foreground">
              <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/40 shrink-0">NAKSHATRA</span>
              <span className="truncate max-w-[120px]">{nakshatraName}</span>
            </div>
          </div>
        </div>

        {/* Good/Alert Time Row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Good Time Card */}
          <div className="border border-outline-variant/20 rounded-2xl bg-surface-variant/15 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-green-500">
              <Moon className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em]">
                {t('newDashboard.todaysEnergy.goodTime')}
              </span>
            </div>
            <div className="text-[14px] font-headline font-bold text-foreground mt-2 truncate tabular-nums">
              {goodTimeText}
            </div>
          </div>

          {/* Alert Time Card */}
          <div className="border border-outline-variant/20 rounded-2xl bg-surface-variant/15 p-3 flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-amber-500">
              <AlertTriangle className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] truncate">
                {alertLabel}
              </span>
            </div>
            <div className="text-[14px] font-headline font-bold text-foreground mt-2 truncate tabular-nums">
              {alertTimeText}
            </div>
          </div>
        </div>

        {/* CTA Buttons row */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Link href="/chat" className="w-full">
            <button className="w-full py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider border border-secondary/30 bg-secondary/5 text-secondary hover:bg-secondary/10 transition-colors shadow-sm">
              {t('newDashboard.todaysEnergy.aiChat')}
            </button>
          </Link>
          <Link href="/horoscope/forecast" className="w-full">
            <button className="w-full py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider bg-gradient-to-r from-secondary via-amber-500 to-secondary text-background hover:brightness-105 transition-all shadow-md">
              {t('newDashboard.todaysEnergy.fullReading')}
            </button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
