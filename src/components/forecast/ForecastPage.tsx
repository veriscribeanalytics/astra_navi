'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks';
import { clientFetch } from '@/lib/apiClient';
import { AREA_THEMES, AREA_LIST, ForecastArea } from '@/data/areaThemes';
import Card from '@/components/ui/Card';
import ForecastChart, { ChartPoint } from './ForecastChart';
import MonthGrid, { MonthData } from './MonthGrid';
import ForecastInsight from './ForecastInsight';
import ForecastSnapshot from './ForecastSnapshot';
import { TrendingUp, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

type TimeRange = '7d' | 'monthly' | 'yearly';

interface YearlyResponse {
  area: string;
  months: MonthData[];
  summary: { best_month: string; worst_month: string; average_score: number; trend: string };
}

interface WeeklyResponse {
  area: string;
  days: { date: string; is_today: boolean; score: number; text: string; dominant_planet: string; personalized_alerts: unknown[]; transits?: Record<string, { sign: string; house_from_lagna: number }> }[];
  summary: { best_day: string; worst_day: string; average_score: number; trend: string };
}

export default function ForecastPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { t, language } = useTranslation();

  const initialArea: ForecastArea = useMemo(() => {
    const a = searchParams.get('area');
    return (AREA_LIST as string[]).includes(a || '') ? (a as ForecastArea) : 'career';
  }, [searchParams]);
  const initialRange: TimeRange = useMemo(() => {
    const r = searchParams.get('range');
    return r === '7d' || r === 'yearly' ? r : 'monthly';
  }, [searchParams]);

  const [area, setArea] = useState<ForecastArea>(initialArea);
  const [range, setRange] = useState<TimeRange>(initialRange);
  const [loading, setLoading] = useState(true);
  const [yearlyData, setYearlyData] = useState<YearlyResponse | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?callbackUrl=/horoscope/forecast');
    }
  }, [authLoading, isLoggedIn, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (range === '7d') {
        const res = await clientFetch(`/api/forecast/${area}?days_back=3&days_forward=3&lang=${language}`);
        if (res.ok) {
          const data = await res.json();
          setWeeklyData(data);
          const today = data.days?.find((d: { is_today: boolean }) => d.is_today);
          setSelectedDay(today?.date || data.days?.[0]?.date || null);
        }
      } else {
        const res = await clientFetch(`/api/forecast/${area}/yearly?lang=${language}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setYearlyData(data);
          const current = data.months?.find((m: MonthData) => m.is_current);
          setSelectedMonth(current?.month || data.months?.[0]?.month || null);
        }
      }
    } catch (err) {
      console.error('[ForecastPage] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [area, range, language]);

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn, fetchData]);

  const theme = AREA_THEMES[area];

  const chartPoints: ChartPoint[] = useMemo(() => {
    if (range === '7d' && weeklyData?.days) {
      return weeklyData.days.map(d => ({
        label: d.date,
        score: d.score,
        isCurrent: d.is_today,
      }));
    }
    if (yearlyData?.months) {
      return yearlyData.months.map(m => ({
        label: m.month,
        score: m.score,
        isCurrent: m.is_current,
      }));
    }
    return [];
  }, [range, weeklyData, yearlyData]);

  const activeLabel = range === '7d' ? selectedDay : selectedMonth;

  const insightData = useMemo(() => {
    if (range === '7d' && weeklyData?.days && selectedDay) {
      const day = weeklyData.days.find(d => d.date === selectedDay);
      if (!day) return null;
      return { date: day.date, score: day.score, text: day.text, dominant_planet: day.dominant_planet, alerts: day.personalized_alerts as (string | { simple: string; technical?: string })[], transits: day.transits as Record<string, { sign: string; house_from_lagna?: number }> | undefined };
    }
    if (yearlyData?.months && selectedMonth) {
      const month = yearlyData.months.find(m => m.month === selectedMonth);
      if (!month) return null;
      return { month: month.month, score: month.score, text: month.text || '', dominant_planet: undefined, alerts: month.alerts as (string | { simple: string; technical?: string })[] | undefined, transits: month.transits as Record<string, { sign: string; house_from_lagna?: number }> | undefined };
    }
    return null;
  }, [range, weeklyData, yearlyData, selectedDay, selectedMonth]);

  const summary = range === '7d' ? weeklyData?.summary : yearlyData?.summary;

  if (authLoading || !isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)]">
      <div className="max-w-[1360px] 3xl:max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 3xl:py-16">
        {/* Header */}
        <div className="mb-6 sm:mb-10 lg:mb-12">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-secondary animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-[0.3em]">{t('forecast.title')}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl 3xl:text-6xl font-headline font-black tracking-tight text-foreground">{t('forecast.heading')}</h1>
        </div>

        {/* Area pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 sm:mb-6 pb-1">
          {AREA_LIST.map(a => {
            const th = AREA_THEMES[a];
            const Icon = th.icon;
            const active = area === a;
            return (
              <button key={a} onClick={() => setArea(a)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 cursor-pointer ${active ? `${th.bg} ${th.color} border border-current/20` : 'bg-surface border border-white/5 text-foreground/40 hover:text-foreground/70'}`}>
                <Icon className="w-4 h-4 animate-pulse" />
                {t(`horoscope.category${a.charAt(0).toUpperCase() + a.slice(1)}`)}
              </button>
            );
          })}
        </div>

        {/* Time range toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-surface border border-white/5 w-fit mb-6 sm:mb-8">
          {([['7d', t('forecast.weekly')], ['monthly', t('forecast.monthly')], ['yearly', t('forecast.yearly')]] as [TimeRange, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setRange(key)}
              className={`px-4 sm:px-6 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${range === key ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'text-foreground/30 hover:text-foreground/60'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}>
              <Sparkles className="w-8 h-8 text-secondary/40 animate-pulse" />
            </motion.div>
            <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest">{t('forecast.loading')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Observatory & Selection & Insight */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Chart */}
              <Card padding="none" className="!rounded-2xl sm:!rounded-[32px] overflow-hidden border-white/5 shadow-xl bg-surface/20">
                <div className="p-4 sm:p-8">
                  <div className="h-44 sm:h-56 lg:h-64 w-full">
                    <ForecastChart points={chartPoints} colorHex={theme.hex} activeLabel={activeLabel || undefined} />
                  </div>
                </div>
                {summary && (
                  <div className="px-4 sm:px-8 pb-4 sm:pb-6 flex flex-wrap gap-3 sm:gap-6 text-[10px] sm:text-[11px] font-bold border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-foreground/40">{t('forecast.best')}:</span><span className="text-foreground/70">{range === '7d' ? (summary as WeeklyResponse['summary']).best_day : (summary as YearlyResponse['summary']).best_month}</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-foreground/40">{t('forecast.worst')}:</span><span className="text-foreground/70">{range === '7d' ? (summary as WeeklyResponse['summary']).worst_day : (summary as YearlyResponse['summary']).worst_month}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-foreground/40">{t('forecast.avg')}:</span><span style={{ color: theme.hex }}>{summary.average_score}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-foreground/40">{t('forecast.trend')}:</span><span className="text-foreground/70 capitalize">{summary.trend === 'improving' ? '📈' : summary.trend === 'declining' ? '📉' : '➡️'} {summary.trend}</span></div>
                  </div>
                )}
              </Card>

              {/* Grid selector */}
              {range !== '7d' && yearlyData?.months && (
                <MonthGrid months={yearlyData.months} colorHex={theme.hex} selectedMonth={selectedMonth} onSelect={setSelectedMonth} />
              )}

              {range === '7d' && weeklyData?.days && (
                <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                  {weeklyData.days.map(day => {
                    const isSelected = selectedDay === day.date;
                    const dateObj = new Date(day.date + 'T00:00:00');
                    return (
                      <button key={day.date} onClick={() => setSelectedDay(day.date)}
                        className={`flex flex-col items-center p-1.5 sm:p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-surface shadow-lg' : 'bg-surface/30 border-white/5 hover:border-white/10'}`}
                        style={{ 
                          borderColor: isSelected ? theme.hex + '50' : undefined,
                          boxShadow: isSelected ? `0 0 16px ${theme.hex}20` : undefined
                        }}>
                        <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-wider ${isSelected ? '' : 'text-foreground/30'}`} style={{ color: isSelected ? theme.hex : undefined }}>
                          {day.is_today ? t('forecast.todayShort') : dateObj.toLocaleDateString('en', { weekday: 'short' })}
                        </span>
                        <span className={`text-base sm:text-xl lg:text-2xl font-headline font-bold ${isSelected ? 'text-foreground font-black' : 'text-foreground/40'}`}>{dateObj.getDate()}</span>
                        <span className="text-[8px] font-bold text-foreground/30">{day.score}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Insight */}
              <ForecastInsight data={insightData} colorHex={theme.hex} />
            </div>

            {/* Right Column: Sticky Cosmic Snapshot Panel */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <ForecastSnapshot 
                insight={insightData} 
                summary={summary ?? null} 
                range={range} 
                theme={theme} 
                t={t} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
