'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Info } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useTranslation } from '@/hooks';
import { AREA_LIST, AREA_THEMES, ForecastArea } from '@/data/areaThemes';
import { getScoreStyle } from '@/lib/scoreStyle';
import type { HoroscopeData } from '@/types/horoscope';

interface Props {
  horoscope: HoroscopeData | null;
  loading: boolean;
}

export default function LifeAreasGrid({ horoscope, loading }: Props) {
  const { t } = useTranslation();
  const [legendOpen, setLegendOpen] = useState(false);

  if (loading) {
    return (
      <Card padding="md" className="!rounded-[24px]">
        <div className="space-y-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-surface-variant/30 rounded w-1/4" />
            <div className="h-4 bg-surface-variant/30 rounded w-1/6" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-16 bg-surface-variant/30 rounded-2xl w-full" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Derived sub-label status map
  const getSubLabel = (area: ForecastArea, score: number | undefined): string => {
    if (score === undefined) {
      if (area === 'spiritual') return t('newDashboard.lifeAreas.comingSoon');
      return '—';
    }

    switch (area) {
      case 'career':
        if (score >= 70) return t('newDashboard.lifeAreas.statusSteadyProgress');
        if (score >= 50) return t('newDashboard.lifeAreas.statusStayFocused');
        return t('newDashboard.lifeAreas.statusPatienceNeeded');
      case 'love':
        if (score >= 70) return t('newDashboard.lifeAreas.statusHarmonious');
        if (score >= 50) return t('newDashboard.lifeAreas.statusMixedSignals');
        return t('newDashboard.lifeAreas.statusNeedsAttention');
      case 'finance':
        if (score >= 70) return t('newDashboard.lifeAreas.statusBuilding');
        if (score >= 50) return t('newDashboard.lifeAreas.statusManageWisely');
        return t('newDashboard.lifeAreas.statusSpendMindfully');
      case 'health':
        if (score >= 70) return t('newDashboard.lifeAreas.statusGood');
        if (score >= 50) return t('newDashboard.lifeAreas.statusSteady');
        return t('newDashboard.lifeAreas.statusMindYourRoutine');
      case 'general':
        return t('newDashboard.lifeAreas.statusCosmicEnergy');
      case 'spiritual':
        return t('newDashboard.lifeAreas.statusIdealForMeditation');
      default:
        return '—';
    }
  };

  return (
    <div className="space-y-3">
      {/* Header Row */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
            {t('newDashboard.lifeAreas.title')}
          </span>
          <button
            type="button"
            onClick={() => setLegendOpen((o) => !o)}
            aria-expanded={legendOpen}
            aria-label={t('newDashboard.lifeAreas.bandLegendTitle')}
            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-foreground/45 hover:text-secondary hover:bg-secondary/10 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <Link
          href="/horoscope/forecast"
          className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1 hover:gap-1.5 transition-all"
        >
          {t('newDashboard.lifeAreas.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {legendOpen && (
        <div className="rounded-2xl border border-outline-variant/20 bg-surface/60 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/60">
            {t('newDashboard.lifeAreas.bandLegendTitle')}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-foreground/70">
            <li className="flex items-center gap-1.5"><span className="font-bold tabular-nums text-emerald-500 w-12">80-100</span>{t('newDashboard.lifeAreas.bandVerySupportive')}</li>
            <li className="flex items-center gap-1.5"><span className="font-bold tabular-nums text-emerald-400 w-12">65-79</span>{t('newDashboard.lifeAreas.bandSupportive')}</li>
            <li className="flex items-center gap-1.5"><span className="font-bold tabular-nums text-amber-400 w-12">50-64</span>{t('newDashboard.lifeAreas.bandMixed')}</li>
            <li className="flex items-center gap-1.5"><span className="font-bold tabular-nums text-orange-400 w-12">35-49</span>{t('newDashboard.lifeAreas.bandCaution')}</li>
            <li className="flex items-center gap-1.5"><span className="font-bold tabular-nums text-red-400 w-12">0-34</span>{t('newDashboard.lifeAreas.bandFriction')}</li>
          </ul>
          <p className="text-[10px] italic text-foreground/50 leading-relaxed pt-1 border-t border-outline-variant/10">
            {t('newDashboard.lifeAreas.bandLegendNote')}
          </p>
        </div>
      )}

      {/* Grid of 6 Area Tiles */}
      <div className="grid grid-cols-2 gap-3">
        {AREA_LIST.map(area => {
          const theme = AREA_THEMES[area];
          let score: number | undefined = undefined;

          // Extract score from horoscope areas
          if (horoscope?.score?.areas) {
            const areaObj = horoscope.score.areas[area as keyof typeof horoscope.score.areas];
            if (areaObj && typeof areaObj === 'object' && 'value' in areaObj) {
              score = areaObj.value;
            } else if (typeof areaObj === 'number') {
              score = areaObj;
            }
          }

          const hasScore = score !== undefined && score > 0;
          const scoreStyle = hasScore ? getScoreStyle(score!, t) : null;
          const subLabel = getSubLabel(area, score);

          // Icon Component
          const AreaIcon = theme.icon;
          const isLucide = area === 'general' || area === 'spiritual';

          return (
            <Link key={area} href={`/horoscope/forecast?area=${area}`}>
              <div className="rounded-2xl border border-outline-variant/20 bg-surface hover:bg-secondary/[0.03] transition-all duration-300 p-3 flex items-center justify-between cursor-pointer min-w-0 h-[72px]">
                {/* Left Side: Icon & Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`shrink-0 flex items-center justify-center rounded-xl h-10 w-10 border overflow-hidden ${theme.color} ${theme.bg} border-current/25`}>
                    <AreaIcon className={isLucide ? "w-5 h-5 fill-current" : "w-full h-full object-cover"} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-foreground truncate">
                      {t(`newDashboard.lifeAreas.${area}`)}
                    </div>
                    <div className="text-[10px] text-foreground/40 font-medium truncate mt-0.5">
                      {subLabel}
                    </div>
                  </div>
                </div>

                {/* Right Side: Score & Chevron */}
                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  <span className={`text-[18px] font-headline font-bold tabular-nums ${scoreStyle ? scoreStyle.color : 'text-foreground/20'}`}>
                    {hasScore ? score : '—'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-foreground/35" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
