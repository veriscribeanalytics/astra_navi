'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import MiniChart from '@/components/dashboard/MiniChart';
import { useTranslation } from '@/hooks';
import { clientFetch } from '@/lib/apiClient';
import { AREA_LIST, AREA_THEMES, ForecastArea } from '@/data/areaThemes';

interface ForecastDay {
  date: string;
  is_today: boolean;
  score: number;
  text: string;
  dominant_planet: string;
  personalized_alerts: (string | { technical: string; simple: string })[];
}

interface ForecastData {
  area: string;
  days: ForecastDay[];
  summary: {
    best_day: string;
    worst_day: string;
    average_score: number;
    trend: string;
  };
}

export default function WeeklyChartCard() {
  const { language, t } = useTranslation();
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState<ForecastArea>('general');

  useEffect(() => {
    setLoading(true);
    clientFetch(`/api/forecast/${area}?days_back=3&days_forward=3&lang=${language}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) setForecast(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load forecast', err);
        setLoading(false);
      });
  }, [language, area]);

  const activeTheme = AREA_THEMES[area];
  const activeAreaLabel = t(`newDashboard.lifeAreas.${area}`);

  const bestDayLabel = useMemo(() => {
    if (!forecast || !forecast.days || forecast.days.length === 0) return '—';
    try {
      const bestDateStr = forecast.summary?.best_day || forecast.days[0].date;
      const bestDayObj = forecast.days.find(d => d.date === bestDateStr);
      const scoreVal = bestDayObj ? bestDayObj.score : 0;
      
      const dateObj = new Date(bestDateStr + 'T00:00:00');
      const weekdayStr = dateObj.toLocaleDateString(language || 'en', { weekday: 'short' });
      return `${weekdayStr} ${scoreVal}`;
    } catch (e) {
      return '—';
    }
  }, [forecast, language]);

  const activeDateString = useMemo(() => {
    if (!forecast?.days) return undefined;
    const todayObj = forecast.days.find(d => d.is_today);
    return todayObj?.date;
  }, [forecast]);

  const areaSwitcher = (
    <div className="-mx-1 px-1 overflow-x-auto scrollbar-none" role="tablist" aria-label={t('newDashboard.weeklyChart.title')}>
      <div className="flex items-center gap-1.5 min-w-max">
        {AREA_LIST.map((a) => {
          const theme = AREA_THEMES[a];
          const isActive = a === area;
          const Icon = theme.icon;
          const isLucide = a === 'general' || a === 'spiritual';
          return (
            <button
              key={a}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setArea(a)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all ${
                isActive
                  ? `${theme.color} ${theme.bg} border-current/40 shadow-sm`
                  : 'text-foreground/55 border-outline-variant/25 hover:border-outline-variant/50 hover:text-foreground/75'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full overflow-hidden ${
                  isActive ? '' : 'opacity-70'
                }`}
              >
                <Icon className={isLucide ? 'w-3 h-3 fill-current' : 'w-full h-full object-cover'} />
              </span>
              {t(`newDashboard.lifeAreas.${a}`)}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (loading || !forecast) {
    return (
      <Card padding="md" className="!rounded-[24px]">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
              {t('newDashboard.weeklyChart.title')}
              <span className="ml-2 font-medium normal-case tracking-normal text-foreground/55">
                · {activeAreaLabel}
              </span>
            </span>
          </div>
          {areaSwitcher}
          <div className="h-24 bg-surface-variant/30 rounded-2xl w-full animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md" className="!rounded-[24px] border border-outline-variant/20 bg-surface">
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex justify-between items-center gap-3">
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground min-w-0 truncate">
            {t('newDashboard.weeklyChart.title')}
            <span className={`ml-2 font-medium normal-case tracking-normal ${activeTheme.color}`}>
              · {activeAreaLabel}
            </span>
          </span>
          <span className={`shrink-0 text-[11px] font-bold uppercase tracking-wider ${activeTheme.color}`}>
            {t('newDashboard.weeklyChart.best')}: {bestDayLabel}
          </span>
        </div>

        {/* Area switcher */}
        {areaSwitcher}

        {/* Line Chart */}
        <div className="w-full relative px-1">
          <MiniChart
            days={forecast.days}
            colorHex={activeTheme.hex}
            activeDate={activeDateString}
          />
        </div>

        {/* 7-column Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 text-center pt-2 border-t border-outline-variant/10 pl-[9.45%] pr-[3.94%]">
          {forecast.days.map(day => {
            const dateObj = new Date(day.date + 'T00:00:00');
            const dayLabel = day.is_today
              ? 'TOD'
              : dateObj.toLocaleDateString(language || 'en', { weekday: 'short' }).toUpperCase();

            return (
              <div key={day.date} className="flex flex-col items-center">
                <span
                  className={`text-[8px] font-bold uppercase tracking-wider ${
                    day.is_today ? activeTheme.color : 'text-foreground/30'
                  }`}
                >
                  {dayLabel}
                </span>
                <span
                  className={`text-[11px] font-headline font-bold mt-0.5 ${
                    day.is_today ? activeTheme.color : 'text-foreground/50'
                  }`}
                >
                  {day.score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
