'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import MonthlyDayGrid from './MonthlyDayGrid';
import WeekStrip from './WeekStrip';
import { TrendingUp, AlertTriangle, RotateCw } from 'lucide-react';
import type { WeeklyForecastResponse, MonthlyForecastResponse, YearlyForecastResponse } from '@/types/forecast';
import { todayISO, currentMonthISO } from '@/utils/forecastError';

type TimeRange = '7d' | 'monthly' | 'yearly';

interface WeeklyResponse extends Omit<WeeklyForecastResponse, 'days'> {
  days: (WeeklyForecastResponse['days'][number] & { is_today?: boolean; personalized_alerts?: (string | { simple: string; technical?: string })[] })[];
  summary: { best_day: string; worst_day: string; average_score: number; trend: string };
}

interface MonthlyResponse extends MonthlyForecastResponse {
  summary: { best_day: string; worst_day: string; average_score: number; trend: string };
}

interface YearlyResponse extends YearlyForecastResponse {
  summary: { best_month: string; worst_month: string; average_score: number; trend: string };
}

type CacheEntry =
  | { kind: 'weekly'; data: WeeklyResponse; timestamp: number }
  | { kind: 'monthly'; data: MonthlyResponse; timestamp: number }
  | { kind: 'yearly'; data: YearlyResponse; timestamp: number };

// 10-minute client-side TTL: long enough that flipping tabs back and forth
// doesn't refetch, short enough that a same-session day-rollover still picks
// up fresh data when the user reopens.
const FORECAST_CACHE_TTL = 10 * 60 * 1000;

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
  const [error, setError] = useState(false);
  const [yearlyData, setYearlyData] = useState<YearlyResponse | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  // Shared by 7d (weekly days) and monthly (every day in the month).
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Cache by `${area}|${range}|${lang}`. Distinct keys for 7d (weekly), monthly, and yearly.
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  // Tracks the in-flight request so a slow earlier response (e.g. after the
  // user switches area/range) can't overwrite a newer selection's data.
  const abortRef = useRef<AbortController | null>(null);
  const cacheKeyFor = useCallback((a: ForecastArea, r: TimeRange, lang: string): string => {
    return `${a}|${r}|${lang}`;
  }, []);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?callbackUrl=/horoscope/forecast');
    }
  }, [authLoading, isLoggedIn, router]);

  const fetchData = useCallback(async () => {
    const key = cacheKeyFor(area, range, language);
    const cached = cacheRef.current.get(key);
    if (cached && Date.now() - cached.timestamp < FORECAST_CACHE_TTL) {
      if (cached.kind === 'weekly') {
        setWeeklyData(cached.data);
        const today = cached.data.days?.find(d => d.is_today || d.date === todayISO());
        setSelectedDay(today?.date || cached.data.days?.[0]?.date || null);
      } else if (cached.kind === 'monthly') {
        setMonthlyData(cached.data);
        // Preserve user's previously-selected day if it still exists in this month,
        // otherwise default to today (if in range) or the first day of the month.
        const hasSelected = cached.data.days?.some(d => d.date === selectedDay);
        if (!hasSelected) {
          const today = todayISO();
          const todayInMonth = cached.data.days?.find(d => d.date === today);
          setSelectedDay(todayInMonth?.date || cached.data.days?.[0]?.date || null);
        }
      } else if (cached.kind === 'yearly') {
        setYearlyData(cached.data);
        const current = cached.data.months?.find(m => m.is_current);
        setSelectedMonth(current?.month || cached.data.months?.[0]?.month || null);
      }
      setError(false);
      setLoading(false);
      return;
    }

    // Abort any request still in flight for a previous area/range/language.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(false);
    try {
      if (range === '7d') {
        const res = await clientFetch(`/api/forecast/${area}?days_back=3&days_forward=3&lang=${language}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (res.ok) {
          const data: WeeklyResponse = await res.json();
          setWeeklyData(data);
          const today = data.days?.find(d => d.is_today || d.date === todayISO());
          setSelectedDay(today?.date || data.days?.[0]?.date || null);
          cacheRef.current.set(key, { kind: 'weekly', data, timestamp: Date.now() });
        } else {
          setError(true);
        }
      } else if (range === 'monthly') {
        const month = currentMonthISO();
        const res = await clientFetch(`/api/forecast/${area}/monthly?month=${month}&lang=${language}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (res.ok) {
          const data: MonthlyResponse = await res.json();
          setMonthlyData(data);
          // Default to today if it's in this month, otherwise the first day.
          const today = todayISO();
          const todayInMonth = data.days?.find(d => d.date === today);
          setSelectedDay(todayInMonth?.date || data.days?.[0]?.date || null);
          cacheRef.current.set(key, { kind: 'monthly', data, timestamp: Date.now() });
        } else {
          setError(true);
        }
      } else {
        const res = await clientFetch(`/api/forecast/${area}/yearly?lang=${language}`, { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (res.ok) {
          const data: YearlyResponse = await res.json();
          setYearlyData(data);
          const current = data.months?.find(m => m.is_current);
          setSelectedMonth(current?.month || data.months?.[0]?.month || null);
          cacheRef.current.set(key, { kind: 'yearly', data, timestamp: Date.now() });
        } else {
          setError(true);
        }
      }
    } catch (err) {
      // Ignore aborts — a newer request has superseded this one.
      if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
        return;
      }
      console.error('[ForecastPage] fetch error:', err);
      setError(true);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [area, range, language, cacheKeyFor, selectedDay]);

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn, fetchData]);

  // Abort any in-flight forecast request when the page unmounts.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const theme = AREA_THEMES[area];

  const chartPoints: ChartPoint[] = useMemo(() => {
    if (range === '7d' && weeklyData?.days) {
      return weeklyData.days.map(d => ({
        label: d.date,
        score: d.score,
        isCurrent: d.is_today || d.date === todayISO(),
      }));
    }
    if (range === 'monthly' && monthlyData?.days) {
      const today = todayISO();
      return monthlyData.days.map(d => ({
        label: d.date,
        score: d.score,
        isCurrent: d.date === today,
      }));
    }
    if (range === 'yearly' && yearlyData?.months) {
      return yearlyData.months.map(m => ({
        label: m.month,
        score: m.score,
        isCurrent: m.is_current,
      }));
    }
    return [];
  }, [range, weeklyData, monthlyData, yearlyData]);

  const activeLabel = range === 'yearly' ? selectedMonth : selectedDay;

  const insightData = useMemo(() => {
    if (range === '7d' && weeklyData?.days && selectedDay) {
      const day = weeklyData.days.find(d => d.date === selectedDay);
      if (!day) return null;
      return { date: day.date, score: day.score, text: day.text, dominant_planet: day.dominant_planet, alerts: (day.alerts || day.personalized_alerts) as (string | { simple: string; technical?: string })[], transits: day.transits as Record<string, { sign: string; house_from_lagna?: number }> | undefined };
    }
    if (range === 'monthly' && monthlyData?.days && selectedDay) {
      const day = monthlyData.days.find(d => d.date === selectedDay);
      if (!day) return null;
      return {
        date: day.date,
        score: day.score,
        text: day.text || '',
        dominant_planet: undefined,
        alerts: day.alerts as (string | { simple: string; technical?: string })[] | undefined,
        transits: day.transits as Record<string, { sign: string; house_from_lagna?: number }> | undefined,
      };
    }
    if (range === 'yearly' && yearlyData?.months && selectedMonth) {
      const month = yearlyData.months.find(m => m.month === selectedMonth);
      if (!month) return null;
      return { month: month.month, score: month.score, text: month.text || '', dominant_planet: undefined, alerts: month.alerts as (string | { simple: string; technical?: string })[] | undefined, transits: month.transits as Record<string, { sign: string; house_from_lagna?: number }> | undefined };
    }
    return null;
  }, [range, weeklyData, monthlyData, yearlyData, selectedDay, selectedMonth]);

  const summary = range === '7d' ? weeklyData?.summary : range === 'monthly' ? monthlyData?.summary : yearlyData?.summary;

  // Does the currently-selected range actually have data to render?
  const hasData =
    range === '7d' ? !!weeklyData?.days?.length
    : range === 'monthly' ? !!monthlyData?.days?.length
    : !!yearlyData?.months?.length;

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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-pulse" aria-busy="true" aria-label={t('forecast.loading')}>
            {/* Left column skeleton */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Chart card skeleton */}
              <Card padding="none" className="!rounded-2xl sm:!rounded-[32px] overflow-hidden border-white/5 shadow-xl bg-surface/20">
                <div className="p-4 sm:p-8">
                  <div className="h-44 sm:h-56 lg:h-64 w-full rounded-xl bg-surface-variant/15" />
                </div>
                <div className="px-4 sm:px-8 pb-4 sm:pb-6 flex flex-wrap gap-3 sm:gap-6 border-t border-white/5 pt-4">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-surface-variant/30" />
                      <div className="h-3 w-20 rounded bg-surface-variant/20" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Grid selector skeleton — mirrors weekly day strip, monthly day grid, or yearly month grid */}
              {range === '7d' && (
                <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
                  {[0, 1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="flex flex-col items-center p-1.5 sm:p-3 rounded-xl border border-white/5 bg-surface/30 gap-1.5">
                      <div className="h-2.5 w-8 rounded bg-surface-variant/20" />
                      <div className="h-6 w-6 rounded bg-surface-variant/25" />
                      <div className="h-2 w-5 rounded bg-surface-variant/15" />
                    </div>
                  ))}
                </div>
              )}
              {range === 'monthly' && (
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="aspect-square sm:aspect-[1.15] rounded-lg sm:rounded-xl border border-white/5 bg-surface/30" />
                  ))}
                </div>
              )}
              {range === 'yearly' && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="h-20 sm:h-24 rounded-xl border border-white/5 bg-surface/30" />
                  ))}
                </div>
              )}

              {/* Insight skeleton */}
              <Card padding="none" className="!rounded-2xl sm:!rounded-[32px] overflow-hidden border-white/5 bg-surface/20">
                <div className="p-4 sm:p-6 space-y-3">
                  <div className="h-4 w-32 rounded bg-surface-variant/25" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-surface-variant/15" />
                    <div className="h-3 w-11/12 rounded bg-surface-variant/15" />
                    <div className="h-3 w-3/4 rounded bg-surface-variant/15" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Right column skeleton (Snapshot) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <Card padding="none" className="!rounded-2xl sm:!rounded-[32px] overflow-hidden border-white/5 bg-surface/20">
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="h-3 w-20 rounded bg-surface-variant/25" />
                  <div className="h-8 w-2/3 rounded bg-surface-variant/25" />
                  <div className="h-px w-full bg-white/5" />
                  {[0, 1, 2].map(i => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-2.5 w-16 rounded bg-surface-variant/20" />
                      <div className="h-3 w-full rounded bg-surface-variant/15" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        ) : error ? (
          <Card padding="lg" className="border-white/5 bg-surface/20 flex flex-col items-center justify-center text-center gap-4 py-16 sm:py-24">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h2 className="text-base sm:text-lg font-headline font-bold text-foreground">{t('forecast.errorTitle')}</h2>
              <p className="text-xs sm:text-sm text-foreground/50">{t('forecast.errorBody')}</p>
            </div>
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              {t('forecast.retry')}
            </button>
          </Card>
        ) : !hasData ? (
          <Card padding="lg" className="border-white/5 bg-surface/20 flex flex-col items-center justify-center text-center gap-4 py-16 sm:py-24">
            <div className="w-14 h-14 rounded-full bg-surface-variant/15 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-foreground/30" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h2 className="text-base sm:text-lg font-headline font-bold text-foreground">{t('forecast.emptyTitle')}</h2>
              <p className="text-xs sm:text-sm text-foreground/50">{t('forecast.emptyBody')}</p>
            </div>
            <button
              onClick={() => fetchData()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider bg-secondary/10 text-secondary border border-secondary/20 hover:bg-secondary/20 transition-all cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              {t('forecast.retry')}
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Observatory & Selection & Insight */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Chart */}
              <Card padding="none" className="!rounded-2xl sm:!rounded-[32px] overflow-hidden border-white/5 shadow-xl bg-surface/20">
                <div className="p-4 sm:p-8">
                  <div className="h-44 sm:h-56 lg:h-64 w-full">
                    <ForecastChart
                      points={chartPoints}
                      colorHex={theme.hex}
                      activeLabel={activeLabel || undefined}
                      onSelect={range === 'yearly' ? setSelectedMonth : setSelectedDay}
                    />
                  </div>
                </div>
                {summary && (
                  <div className="px-4 sm:px-8 pb-4 sm:pb-6 flex flex-wrap gap-3 sm:gap-6 text-[10px] sm:text-[11px] font-bold border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-foreground/40">{t('forecast.best')}:</span><span className="text-foreground/70">{range === 'yearly' ? (summary as YearlyResponse['summary']).best_month : (summary as WeeklyResponse['summary'] | MonthlyResponse['summary']).best_day}</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /><span className="text-foreground/40">{t('forecast.worst')}:</span><span className="text-foreground/70">{range === 'yearly' ? (summary as YearlyResponse['summary']).worst_month : (summary as WeeklyResponse['summary'] | MonthlyResponse['summary']).worst_day}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-foreground/40">{t('forecast.avg')}:</span><span style={{ color: theme.hex }}>{summary.average_score}</span></div>
                    <div className="flex items-center gap-1.5"><span className="text-foreground/40">{t('forecast.trend')}:</span><span className="text-foreground/70 capitalize">{summary.trend === 'improving' ? '📈' : summary.trend === 'declining' ? '📉' : '➡️'} {summary.trend}</span></div>
                  </div>
                )}
              </Card>

              {/* Grid selector */}
              {range === '7d' && weeklyData?.days && (
                <WeekStrip days={weeklyData.days} colorHex={theme.hex} selectedDate={selectedDay} onSelect={setSelectedDay} />
              )}

              {range === 'monthly' && monthlyData?.days && (
                <MonthlyDayGrid days={monthlyData.days} colorHex={theme.hex} selectedDate={selectedDay} onSelect={setSelectedDay} />
              )}

              {range === 'yearly' && yearlyData?.months && (
                <MonthGrid months={yearlyData.months} colorHex={theme.hex} selectedMonth={selectedMonth} onSelect={setSelectedMonth} />
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
