'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import MiniChart from '@/components/dashboard/MiniChart';
import { useTranslation } from '@/hooks';
import { clientFetch } from '@/lib/apiClient';

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

  useEffect(() => {
    setLoading(true);
    clientFetch(`/api/forecast/general?days_back=3&days_forward=3&lang=${language}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) setForecast(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load forecast', err);
        setLoading(false);
      });
  }, [language]);

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

  if (loading || !forecast) {
    return (
      <Card padding="md" className="!rounded-[24px]">
        <div className="space-y-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-surface-variant/30 rounded w-1/4" />
            <div className="h-4 bg-surface-variant/30 rounded w-1/6" />
          </div>
          <div className="h-24 bg-surface-variant/30 rounded-2xl w-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md" className="!rounded-[24px] border border-outline-variant/20 bg-surface">
      <div className="space-y-3">
        {/* Header Row */}
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
            {t('newDashboard.weeklyChart.title')}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
            {t('newDashboard.weeklyChart.best')}: {bestDayLabel}
          </span>
        </div>

        {/* Line Chart */}
        <div className="w-full relative px-1">
          <MiniChart
            days={forecast.days}
            colorHex="#c8991f"
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
                <span className={`text-[8px] font-bold uppercase tracking-wider ${day.is_today ? 'text-secondary' : 'text-foreground/30'}`}>
                  {dayLabel}
                </span>
                <span className={`text-[11px] font-headline font-bold mt-0.5 ${day.is_today ? 'text-secondary' : 'text-foreground/50'}`}>
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
