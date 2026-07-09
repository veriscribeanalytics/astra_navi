'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks';
import { clientFetch } from '@/lib/apiClient';
import { usePaywallContext } from '@/context/PaywallContext';
import PaywallCard from '@/components/paywall/PaywallCard';
import { PaywallData } from '@/types/paywall';
import { AREA_THEMES, AREA_LIST, ForecastArea, AreaTheme } from '@/data/areaThemes';
import { getAreaPhaseMain, getAreaPhaseGlowColor, STATUS_COLORS } from '@/data/lifeAreaColors';
import Card from '@/components/ui/Card';
import ForecastChart, { ChartPoint } from './ForecastChart';
import ForecastActionPanel from './ForecastActionPanel';
import MonthGrid, { MonthData } from './MonthGrid';
import ForecastInsight from './ForecastInsight';
import MonthlyDayGrid from './MonthlyDayGrid';
import { TrendingUp, AlertTriangle, RotateCw, X, ChevronLeft, ChevronRight, Sparkles, Gauge, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { resolveTone } from '@/utils/forecastTones';
import type { WeeklyForecastResponse, MonthlyForecastResponse, YearlyForecastResponse } from '@/types/forecast';
import { todayISO, currentMonthISO } from '@/utils/forecastError';

type TimeRange = '7d' | 'monthly' | 'yearly';

// "overall" is a combined forecast (backend weighted combine of the six life
// areas, general counts double). It is served by the same /[area] routes and
// reuses the same response shape — only the area key differs. It is NOT part of
// /api/forecast/all/weekly, so it is requested separately here.
type ForecastAreaWithOverall = ForecastArea | 'overall';

type AreaThemeShape = { color: string; bg: string; hex: string; icon: AreaTheme['icon'] };

const OVERALL_THEME: AreaThemeShape = { color: 'text-[#2FD3A0]', bg: 'bg-[#2FD3A0]/10', hex: '#2FD3A0', icon: Gauge };

// Overall first (combined outlook), then the six life areas.
const FORECAST_AREA_KEYS: ForecastAreaWithOverall[] = ['overall', ...AREA_LIST];
const FORECAST_PILLS: { key: ForecastAreaWithOverall; theme: AreaThemeShape }[] = [
  { key: 'overall', theme: OVERALL_THEME },
  ...AREA_LIST.map((a) => ({ key: a as ForecastAreaWithOverall, theme: AREA_THEMES[a] })),
];

function getAreaTheme(area: ForecastAreaWithOverall): AreaThemeShape {
  return area === 'overall' ? OVERALL_THEME : AREA_THEMES[area];
}

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

  const initialArea: ForecastAreaWithOverall = useMemo(() => {
    const a = searchParams.get('area');
    return (FORECAST_AREA_KEYS as string[]).includes(a || '') ? (a as ForecastAreaWithOverall) : 'general';
  }, [searchParams]);
  const initialRange: TimeRange = useMemo(() => {
    const r = searchParams.get('range');
    return r === 'monthly' || r === 'yearly' ? r : '7d';
  }, [searchParams]);

  const [area, setArea] = useState<ForecastAreaWithOverall>(initialArea);
  const [range, setRange] = useState<TimeRange>(initialRange);
  const [detailModalData, setDetailModalData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [yearlyData, setYearlyData] = useState<YearlyResponse | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyResponse | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  // Shared by 7d (weekly days) and monthly (every day in the month).
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [yearlyPaywall, setYearlyPaywall] = useState<PaywallData | null>(null);

  // Pagination cursor state: date (for weekly) or month (for monthly)
  const [cursor, setCursor] = useState<string | null>(null);



  // Reset pagination cursor when changing range or area
  useEffect(() => {
    setCursor(null);
    setYearlyPaywall(null);
  }, [area, range]);

  // Cache by `${area}|${range}|${lang}|${cursor}`. Distinct keys for 7d (weekly), monthly, and yearly.
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  // Tracks the in-flight request so a slow earlier response (e.g. after the
  // user switches area/range) can't overwrite a newer selection's data.
  const abortRef = useRef<AbortController | null>(null);
  const cacheKeyFor = useCallback((a: ForecastAreaWithOverall, r: TimeRange, lang: string, cur: string | null): string => {
    return `${a}|${r}|${lang}|${cur || 'default'}`;
  }, []);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push('/login?callbackUrl=/horoscope/forecast');
    }
  }, [authLoading, isLoggedIn, router]);

  const fetchData = useCallback(async () => {
    const key = cacheKeyFor(area, range, language, cursor);
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
        const dateStr = cursor || todayISO();
        const res = await clientFetch(`/api/forecast/${area}/weekly?date=${dateStr}&lang=${language}`, { signal: controller.signal });
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
        const month = cursor || currentMonthISO();
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
        if (res.status === 402) {
          const ed = await res.json().catch(() => ({}));
          setYearlyPaywall((ed?.paywall as PaywallData) || null);
          setYearlyData(null);
          setError(false);
          return;
        }
        if (res.ok) {
          const data: YearlyResponse = await res.json();
          setYearlyData(data);
          setYearlyPaywall(null);
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
  }, [area, range, language, cacheKeyFor, selectedDay, cursor]);

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn, fetchData]);

  // Abort any in-flight forecast request when the page unmounts.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const theme = getAreaTheme(area);

  const { tier, isFeatureBlocked, getFeaturePaywall } = usePaywallContext();
  const userTier = (tier || 'free').toLowerCase();
  const isFree = userTier === 'free';

  // Does the currently-selected range actually have data?
  const hasRealData = useMemo(() => {
    if (range === '7d') return !!weeklyData?.days?.length;
    if (range === 'monthly') return !!monthlyData?.days?.length;
    return !!yearlyData?.months?.length;
  }, [range, weeklyData, monthlyData, yearlyData]);

  // Is this view blocked/paywalled?
  const isBlocked = useMemo(() => {
    if (isFree) {
      if (range === 'yearly') {
        return true; // Yearly is strictly Pro/Premium
      }
      // For 7d and monthly: blocked if fetch failed (error) OR no data is returned OR explicitly blocked by backend
      if (error || !hasRealData || isFeatureBlocked('full_daily_horoscope')) {
        return true;
      }
    }
    return false;
  }, [isFree, range, error, hasRealData, isFeatureBlocked]);

  const mockWeeklyData = useMemo((): WeeklyResponse => ({
    area: area,
    period: 'weekly',
    period_label: 'June 10 - June 16, 2026',
    overview: {
      title: 'Weekly Transit Outlook',
      text: 'Planetary alignments indicate an active week with significant shifts in your energy cycles. Focus on stability and alignment.',
      tone: 'steady',
      key_theme: 'focus'
    },
    navigation: { previous: null, next: null, can_go_previous: false, can_go_next: false, limit: { from: '', to: '' } },
    days: [
      { date: '2026-06-10', weekday: 'Wed', score: 80, text: 'Strong lunar support enhances clarity and decision making.', dominant_planet: 'Moon' },
      { date: '2026-06-11', weekday: 'Thu', score: 75, text: 'Jupiter transit brings positive guidance in communication.', dominant_planet: 'Jupiter' },
      { date: '2026-06-12', weekday: 'Fri', score: 85, text: 'Vibrant energy. Excellent time for creative undertakings.', dominant_planet: 'Venus' },
      { date: '2026-06-13', weekday: 'Sat', score: 60, text: 'Saturn energy suggests caution in financial decisions.', dominant_planet: 'Saturn' },
      { date: '2026-06-14', weekday: 'Sun', score: 70, text: 'Sun alignment brings clarity to personal goals.', dominant_planet: 'Sun' },
      { date: '2026-06-15', weekday: 'Mon', score: 90, text: 'Peak alignment. Favorable for new initiatives.', dominant_planet: 'Mercury' },
      { date: '2026-06-16', weekday: 'Tue', score: 65, text: 'Mars energy suggests avoiding conflicts today.', dominant_planet: 'Mars' }
    ],
    summary: { best_day: 'Monday', worst_day: 'Saturday', average_score: 75, trend: 'improving' }
  }), [area]);

  const mockMonthlyData = useMemo((): MonthlyResponse => ({
    area: area,
    period: 'monthly',
    period_label: 'June 2026',
    overview: {
      title: 'Monthly Cycle Summary',
      text: 'A constructive month ahead with favorable planetary transits supporting your personal and professional growth.',
      tone: 'positive',
      key_theme: 'growth'
    },
    navigation: { previous: null, next: null, can_go_previous: false, can_go_next: false, limit: { from: '', to: '' } },
    weeks: [],
    days: Array.from({ length: 30 }, (_, i) => ({
      date: `2026-06-${String(i + 1).padStart(2, '0')}`,
      weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][(i + 3) % 7], // 2026-06-01 is Monday
      score: 60 + Math.floor(Math.sin(i) * 25),
      text: 'Favorable cosmic trends support development.'
    })),
    summary: { best_day: 'June 15', worst_day: 'June 4', average_score: 72, trend: 'steady' }
  }), [area]);

  const mockYearlyData = useMemo((): YearlyResponse => ({
    area: area,
    period: 'yearly',
    period_label: '2026 Yearly Forecast',
    overview: {
      title: 'Annual Alignment Overview',
      text: 'Your solar return and major Dasha transits highlight career progression and spiritual expansion as key pillars for this year.',
      tone: 'buoyant',
      key_theme: 'expansion'
    },
    navigation: { previous: null, next: null, can_go_previous: false, can_go_next: false, limit: { from: '', to: '' } },
    months: [
      { month: '2026-01', label: 'January', score: 70, is_current: false, text: 'New foundations.' },
      { month: '2026-02', label: 'February', score: 75, is_current: false, text: 'Growth cycle.' },
      { month: '2026-03', label: 'March', score: 85, is_current: false, text: 'Peak alignment.' },
      { month: '2026-04', label: 'April', score: 60, is_current: false, text: 'Reflective period.' },
      { month: '2026-05', label: 'May', score: 65, is_current: false, text: 'Action phase.' },
      { month: '2026-06', label: 'June', score: 80, is_current: true, text: 'Constructive shifts.' },
      { month: '2026-07', label: 'July', score: 70, is_current: false, text: 'Stabilization.' },
      { month: '2026-08', label: 'August', score: 55, is_current: false, text: 'Caution advised.' },
      { month: '2026-09', label: 'September', score: 90, is_current: false, text: 'Exceptional progress.' },
      { month: '2026-10', label: 'October', score: 75, is_current: false, text: 'Creative expansion.' },
      { month: '2026-11', label: 'November', score: 80, is_current: false, text: 'Harvest cycle.' },
      { month: '2026-12', label: 'December', score: 65, is_current: false, text: 'Review and wrap.' }
    ],
    summary: { best_month: 'September', worst_month: 'August', average_score: 72, trend: 'improving' }
  }), [area]);

  const activeWeekly = useMemo(() => {
    if (isBlocked && !weeklyData) return mockWeeklyData;
    return weeklyData;
  }, [isBlocked, weeklyData, mockWeeklyData]);

  const activeMonthly = useMemo(() => {
    if (isBlocked && !monthlyData) return mockMonthlyData;
    return monthlyData;
  }, [isBlocked, monthlyData, mockMonthlyData]);

  const activeYearly = useMemo(() => {
    if (isBlocked && !yearlyData) return mockYearlyData;
    return yearlyData;
  }, [isBlocked, yearlyData, mockYearlyData]);

  const openDayDetailModal = useCallback((dayDate: string) => {
    if (range === '7d' && activeWeekly?.days) {
      const day = activeWeekly.days.find(d => d.date === dayDate);
      if (day) {
        setDetailModalData({
          date: day.date,
          score: day.score,
          text: day.text,
          dominant_planet: day.dominant_planet,
          alerts: (day.alerts || day.personalized_alerts) as any,
          transits: day.transits as any,
          mood: (day as any).mood,
          lucky_color: (day as any).lucky_color,
          lucky_number: (day as any).lucky_number,
          dominant_planet_meaning: (day as any).dominant_planet_meaning,
          weekday: day.weekday,
        });
      }
    } else if (range === 'monthly' && activeMonthly?.days) {
      const day = activeMonthly.days.find(d => d.date === dayDate);
      if (day) {
        setDetailModalData({
          date: day.date,
          score: day.score,
          text: day.text || '',
          dominant_planet: undefined,
          alerts: day.alerts as any,
          transits: day.transits as any,
        });
      }
    }
  }, [range, activeWeekly, activeMonthly]);

  const openMonthDetailModal = useCallback((monthName: string) => {
    if (range === 'yearly' && activeYearly?.months) {
      const month = activeYearly.months.find(m => m.month === monthName);
      if (month) {
        setDetailModalData({
          month: month.month,
          score: month.score,
          text: month.text || '',
          dominant_planet: undefined,
          alerts: month.alerts as any,
          transits: month.transits as any,
        });
      }
    }
  }, [range, activeYearly]);

  // Set default selected day/month when blocked and using mock data
  useEffect(() => {
    if (isBlocked) {
      if (range === '7d') {
        setSelectedDay('2026-06-10');
      } else if (range === 'monthly') {
        setSelectedDay('2026-06-10');
      } else if (range === 'yearly') {
        setSelectedMonth('2026-06');
      }
    }
  }, [isBlocked, range]);

  const fallbackPaywall: PaywallData = useMemo(() => {
    const isYearly = range === 'yearly';
    return {
      featureKey: 'full_daily_horoscope',
      isSoft: true,
      title: isYearly ? "Yearly Forecast is Premium" : "Unlock Personal Forecasts",
      description: isYearly
        ? "Access 12-month Vedic forecast tracking planetary periods (Dasha) and transits for your chart. Only for Premium users."
        : "Get personalized daily, weekly, and monthly Vedic forecasts mapped to your planetary periods and houses.",
      badge: isYearly ? "Premium" : "Pro",
      icon: "🔒",
      suggestedProducts: [
        {
          productId: "sub_pro_monthly",
          productType: "subscription",
          nameEn: "Pro Monthly",
          credits: 0,
          tier: "pro",
          priceInr: 199,
          currency: "INR"
        }
      ]
    };
  }, [range]);

  const activePaywall = getFeaturePaywall('full_daily_horoscope') || fallbackPaywall;

  const chartPoints: ChartPoint[] = useMemo(() => {
    if (range === '7d' && activeWeekly?.days) {
      return activeWeekly.days.map(d => {
        let weekdayKey = (d.weekday || '').slice(0, 3).toLowerCase();
        if (!weekdayKey && d.date) {
          const dateObj = new Date(d.date + 'T00:00:00');
          const weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          weekdayKey = weekDays[dateObj.getDay()];
        }
        const weekdayShort = t(`forecast.weekdays.${weekdayKey}`).toUpperCase();
        return {
          label: d.date,
          score: d.score,
          isCurrent: d.is_today || d.date === todayISO(),
          displayLabel: weekdayShort,
        };
      });
    }
    if (range === 'monthly' && activeMonthly?.days) {
      const today = todayISO();
      return activeMonthly.days.map(d => {
        const dateObj = new Date(d.date + 'T00:00:00');
        const dayOfMonth = dateObj.getDate();
        const showLabel = dayOfMonth === 1 || dayOfMonth % 5 === 0;
        return {
          label: d.date,
          score: d.score,
          isCurrent: d.date === today,
          displayLabel: showLabel ? dayOfMonth.toString() : '',
        };
      });
    }
    if (range === 'yearly' && activeYearly?.months) {
      return activeYearly.months.map(m => {
        const dateObj = new Date(m.month + '-01T00:00:00');
        const monthIdx = dateObj.getMonth();
        const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const labelStr = t(`forecast.monthsShort.${monthKeys[monthIdx]}`).toUpperCase();
        return {
          label: m.month,
          score: m.score,
          isCurrent: m.is_current,
          displayLabel: labelStr,
        };
      });
    }
    return [];
  }, [range, activeWeekly, activeMonthly, activeYearly, t]);

  const activeLabel = range === 'yearly' ? selectedMonth : selectedDay;

  const insightData = useMemo(() => {
    if (range === '7d' && activeWeekly?.days && selectedDay) {
      const day = activeWeekly.days.find(d => d.date === selectedDay);
      if (!day) return null;
      return {
        date: day.date,
        score: day.score,
        text: day.text,
        dominant_planet: day.dominant_planet,
        alerts: (day.alerts || day.personalized_alerts) as (string | { simple: string; technical?: string })[],
        transits: day.transits as Record<string, { sign: string; house_from_lagna?: number }> | undefined,
        mood: (day as any).mood,
        lucky_color: (day as any).lucky_color,
        lucky_number: (day as any).lucky_number,
        dominant_planet_meaning: (day as any).dominant_planet_meaning,
        weekday: day.weekday,
      };
    }
    if (range === 'monthly' && activeMonthly?.days && selectedDay) {
      const day = activeMonthly.days.find(d => d.date === selectedDay);
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
    if (range === 'yearly' && activeYearly?.months && selectedMonth) {
      const month = activeYearly.months.find(m => m.month === selectedMonth);
      if (!month) return null;
      return { month: month.month, score: month.score, text: month.text || '', dominant_planet: undefined, alerts: month.alerts as (string | { simple: string; technical?: string })[] | undefined, transits: month.transits as Record<string, { sign: string; house_from_lagna?: number }> | undefined };
    }
    return null;
  }, [range, activeWeekly, activeMonthly, activeYearly, selectedDay, selectedMonth]);

  const summary = range === '7d' ? activeWeekly?.summary : range === 'monthly' ? activeMonthly?.summary : activeYearly?.summary;

  // Area color now shifts with the period's average score (area × phase).
  const areaHex = getAreaPhaseMain(area, summary?.average_score ?? 0);
  const areaGlow = getAreaPhaseGlowColor(area, summary?.average_score ?? 0);

  const activeOverview = useMemo(() => {
    if (range === '7d') return activeWeekly?.overview;
    if (range === 'monthly') return activeMonthly?.overview;
    return activeYearly?.overview;
  }, [range, activeWeekly, activeMonthly, activeYearly]);

  const activeNavigation = useMemo(() => {
    if (range === '7d') return activeWeekly?.navigation;
    if (range === 'monthly') return activeMonthly?.navigation;
    return activeYearly?.navigation;
  }, [range, activeWeekly, activeMonthly, activeYearly]);

  const activePeriodLabel = useMemo(() => {
    if (range === '7d') return activeWeekly?.period_label;
    if (range === 'monthly') return activeMonthly?.period_label;
    return activeYearly?.period_label;
  }, [range, activeWeekly, activeMonthly, activeYearly]);

  const handlePrevious = useCallback((prevCursor: string) => {
    setCursor(prevCursor);
  }, []);

  const handleNext = useCallback((nextCursor: string) => {
    setCursor(nextCursor);
  }, []);

  const friendlyDateLabel = useCallback((value?: string) => {
    if (!value) return '—';
    const parsed = new Date(value.includes('T') ? value : value + 'T00:00:00');
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString(language || 'en', { weekday: 'short', day: 'numeric', month: 'short' });
    }
    return value;
  }, [language]);

  // Does the currently-selected range actually have data to render?
  const hasData =
    range === '7d' ? !!activeWeekly?.days?.length
    : range === 'monthly' ? !!activeMonthly?.days?.length
    : !!activeYearly?.months?.length;

  if (authLoading || !isLoggedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)]">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-10 3xl:py-16">
        {/* Header */}
        <div className="mb-3 flex flex-col items-center text-center">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-headline font-black tracking-tight text-foreground">{t('forecast.heading')}</h1>
          </div>
        </div>

        {/* Time range toggle */}
        <div className="flex gap-1 p-1 rounded-xl bg-surface border border-white/5 w-fit mx-auto mb-4">
          {([
            ['7d', 'This Week'],
            ['monthly', 'This Month'],
            ['yearly', 'This Year']
          ] as [TimeRange, string][]).map(([key, label]) => (
            <button key={key} onClick={() => setRange(key)}
              className={`px-4 sm:px-6 py-2.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer min-h-[42px] ${range === key ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'text-foreground/55 hover:text-foreground/90'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Area pills */}
        <div className="flex gap-2 overflow-x-auto justify-start md:justify-center scrollbar-hide mb-6 pb-1">
          {FORECAST_PILLS.map(({ key: a, theme: th }) => {
            const Icon = th.icon;
            const active = area === a;
            return (
              <button key={a} onClick={() => setArea(a)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0 cursor-pointer min-h-[46px] ${active ? `${th.bg} ${th.color} border border-current/20` : 'bg-surface border border-white/5 text-foreground/65 hover:text-foreground/95 hover:border-white/15'}`}>
                <Icon className="w-4 h-4 animate-pulse" />
                {a === 'overall' ? (t('horoscope.categoryOverall') || 'Overall') : t(`horoscope.category${a.charAt(0).toUpperCase() + a.slice(1)}`)}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex flex-col gap-6 animate-pulse" aria-busy="true" aria-label={t('forecast.loading')}>
            {/* Overview & Chart Card Skeleton */}
            <Card padding="none" className="!rounded-2xl sm:!rounded-[32px] overflow-hidden border-white/5 shadow-xl bg-surface">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="h-6 w-32 rounded bg-surface-variant/25" />
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-full bg-surface-variant/20 animate-pulse" />
                    <div className="space-y-2 flex-grow">
                      <div className="h-5 w-2/3 rounded bg-surface-variant/25" />
                      <div className="h-4 w-full rounded bg-surface-variant/15" />
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-7 h-44 sm:h-56 lg:h-64 w-full rounded-xl bg-surface-variant/15" />
              </div>
            </Card>

            {/* Days Breakdown Skeleton */}
            <Card padding="lg" className="border-white/5 bg-surface !rounded-[32px]">
              <div className="h-5 w-48 rounded bg-surface-variant/25 mb-6" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {[0, 1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-32 rounded-xl bg-surface-variant/10 border border-white/5" />
                ))}
              </div>
            </Card>
          </div>
        ) : (range === 'yearly' && yearlyPaywall && !yearlyData) ? (
          <div className="flex justify-center py-8">
            <div className="w-full max-w-md">
              <PaywallCard paywall={yearlyPaywall} variant="inline" />
            </div>
          </div>
        ) : (error && !isBlocked) ? (
          <Card padding="lg" className="border-white/5 bg-surface flex flex-col items-center justify-center text-center gap-4 py-16 sm:py-24">
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
        ) : (!hasData && !isBlocked) ? (
          <Card padding="lg" className="border-white/5 bg-surface flex flex-col items-center justify-center text-center gap-4 py-16 sm:py-24">
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
          <div className="relative">
            <div className={`flex flex-col gap-6 transition-all duration-300 ${isBlocked ? 'filter blur-md select-none pointer-events-none' : ''}`}>
              
              {/* Card 1: Overview & Chart */}
              {activeOverview && activeNavigation && (
                <Card padding="none" className="!rounded-2xl sm:!rounded-[32px] overflow-hidden border-white/5 shadow-xl bg-surface relative">
                  {range === 'monthly' ? (
                    /* Monthly layout: col1 = calendar, col2 = 2 rows (ratings top, chart bottom) */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 p-6 sm:p-8 items-start">

                      {/* Left Column: Monthly Outlook Calendar */}
                      <div className="lg:col-span-6 flex flex-col gap-4 pr-0 lg:pr-6 lg:border-r border-white/5">
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className="px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] shrink-0"
                            style={{ color: areaHex, backgroundColor: areaHex + '12' }}
                          >
                            {activePeriodLabel}
                          </span>
                          {/* Arrow Navigation */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={() => activeNavigation.can_go_previous && activeNavigation.previous && handlePrevious(activeNavigation.previous)}
                              disabled={!activeNavigation.can_go_previous}
                              aria-label={t('forecast.previous')}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-white/5 bg-surface flex items-center justify-center transition-all hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ChevronLeft className="w-5 h-5 text-foreground/75" />
                            </button>
                            <button
                              onClick={() => activeNavigation.can_go_next && activeNavigation.next && handleNext(activeNavigation.next)}
                              disabled={!activeNavigation.can_go_next}
                              aria-label={t('forecast.next')}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-white/5 bg-surface flex items-center justify-center transition-all hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ChevronRight className="w-5 h-5 text-foreground/75" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-sm font-bold text-foreground/65 uppercase tracking-widest mb-2">Monthly Outlook</h3>
                        {activeMonthly?.days && (
                          <MonthlyDayGrid
                            days={activeMonthly.days}
                            colorHex={areaHex}
                            area={area}
                            selectedDate={selectedDay}
                            onSelect={openDayDetailModal}
                          />
                        )}
                      </div>

                      {/* Right Column: Row 1 = ratings, Row 2 = chart */}
                      <div className="lg:col-span-6 flex flex-col justify-between pl-0 lg:pl-6 mt-6 lg:mt-0">

                        {/* Row 1: Score ring, title/description and compact stats */}
                        <div className="flex flex-col gap-5 pb-6 border-b border-white/5">
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
                            {/* Score ring */}
                            <div className="sm:col-span-4 flex flex-col items-center justify-center">
                              <div className="relative w-36 h-36 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                                  <circle cx="48" cy="48" r="40" className="stroke-white/[0.04] fill-none" strokeWidth="6" />
                                  <circle
                                    cx="48" cy="48" r="40"
                                    className="fill-none transition-all duration-1000"
                                    strokeWidth="6" strokeLinecap="round"
                                    style={{
                                      stroke: areaHex,
                                      strokeDasharray: '251.3',
                                      strokeDashoffset: (251.3 - (251.3 * (summary?.average_score ?? 0)) / 100).toString(),
                                      filter: `drop-shadow(0 0 8px ${areaGlow}50)`
                                    }}
                                  />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center">
                                  <span className="text-4xl font-headline font-black" style={{ color: areaHex }}>{summary?.average_score ?? 0}</span>
                                  <span className="text-[10px] font-bold text-foreground/55 uppercase tracking-widest mt-1">/ 100</span>
                                </div>
                              </div>
                              <div className="text-[11px] font-bold text-foreground/55 uppercase tracking-widest text-center mt-2">Avg Score</div>
                            </div>

                            {/* Title, description and chips */}
                            <div className="sm:col-span-8 flex flex-col gap-3 text-center sm:text-left">
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                {activeOverview.tone && (
                                  <span
                                    className="px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                                    style={{ color: resolveTone(activeOverview.tone, areaHex).color, backgroundColor: resolveTone(activeOverview.tone, areaHex).color + '12' }}
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: resolveTone(activeOverview.tone, areaHex).color }} />
                                    {t(resolveTone(activeOverview.tone, areaHex).labelKey) || activeOverview.tone}
                                  </span>
                                )}
                                {activeOverview.key_theme && (
                                  <span className="px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center gap-1.5 bg-white/[0.03] border border-white/5 text-foreground/80">
                                    <Sparkles className="w-3.5 h-3.5" style={{ color: areaHex }} />
                                    <span className="capitalize">{activeOverview.key_theme}</span>
                                  </span>
                                )}
                              </div>
                              <h2 className="text-xl sm:text-2xl font-headline font-bold text-foreground leading-tight tracking-tight">
                                {activeOverview.title}
                              </h2>
                              <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
                                {activeOverview.text}
                              </p>
                            </div>
                          </div>

                          {/* Compact summary stats */}
                          {summary && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
                              <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/50">{t('forecast.best')}</span>
                                <span className="text-sm sm:text-base font-bold text-foreground/90">{(range as string) === 'yearly' ? (summary as YearlyResponse['summary']).best_month : friendlyDateLabel((summary as WeeklyResponse['summary'] | MonthlyResponse['summary']).best_day)}</span>
                              </div>
                              <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/50">{t('forecast.worst')}</span>
                                <span className="text-sm sm:text-base font-bold text-foreground/90">{(range as string) === 'yearly' ? (summary as YearlyResponse['summary']).worst_month : friendlyDateLabel((summary as WeeklyResponse['summary'] | MonthlyResponse['summary']).worst_day)}</span>
                              </div>
                              <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/50">{t('forecast.avg')}</span>
                                <span className="text-sm sm:text-base font-bold" style={{ color: areaHex }}>{summary.average_score}</span>
                              </div>
                              <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-foreground/50">{t('forecast.trend')}</span>
                                <span className="text-sm sm:text-base font-bold text-foreground/90 capitalize">{summary.trend === 'improving' ? '📈' : summary.trend === 'declining' ? '📉' : '➡️'} {summary.trend}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Row 2: Chart */}
                        <div className="h-72 sm:h-80 lg:h-96 w-full pt-5">

                          <ForecastChart
                            points={chartPoints}
                            colorHex={areaHex}
                            activeLabel={activeLabel || undefined}
                            onSelect={(d) => { setSelectedDay(d); openDayDetailModal(d); }}
                          />
                        </div>

                      </div>
                    </div>
                  ) : (
                    /* Weekly / Yearly layout: col1 = rating + info, col2 = chart */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 p-6 sm:p-8 items-start">

                      {/* Left Column: Rating circle + title/description + badges/stats */}
                      <div className="lg:col-span-6 flex flex-col gap-5 pr-0 lg:pr-6 lg:border-r border-white/5 justify-between h-full">

                        <div className="flex flex-col gap-4">
                          <div className="flex items-center justify-between gap-3">
                            <span
                              className="px-2.5 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] shrink-0"
                              style={{ color: areaHex, backgroundColor: areaHex + '12' }}
                            >
                              {range === '7d' ? 'Weekly Overview' : activePeriodLabel}
                            </span>
                            {/* Arrow Navigation */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => activeNavigation.can_go_previous && activeNavigation.previous && handlePrevious(activeNavigation.previous)}
                                disabled={!activeNavigation.can_go_previous}
                                aria-label={t('forecast.previous')}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-white/5 bg-surface flex items-center justify-center transition-all hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <ChevronLeft className="w-5 h-5 text-foreground/75" />
                              </button>
                              <button
                                onClick={() => activeNavigation.can_go_next && activeNavigation.next && handleNext(activeNavigation.next)}
                                disabled={!activeNavigation.can_go_next}
                                aria-label={t('forecast.next')}
                                className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-white/5 bg-surface flex items-center justify-center transition-all hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              >
                                <ChevronRight className="w-5 h-5 text-foreground/75" />
                              </button>
                            </div>
                          </div>

                          {/* Tone & Theme Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            {activeOverview.tone && (
                              <span
                                className="px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                                style={{ color: resolveTone(activeOverview.tone, areaHex).color, backgroundColor: resolveTone(activeOverview.tone, areaHex).color + '12' }}
                              >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: resolveTone(activeOverview.tone, areaHex).color }} />
                                {t(resolveTone(activeOverview.tone, areaHex).labelKey) || activeOverview.tone}
                              </span>
                            )}
                            {activeOverview.key_theme && (
                              <span className="px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-bold flex items-center gap-1.5 bg-white/[0.03] border border-white/5 text-foreground/80">
                                <Sparkles className="w-3.5 h-3.5" style={{ color: areaHex }} />
                                <span className="capitalize">{activeOverview.key_theme}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Avg score circle + title + description */}
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pt-3">
                          <div className="shrink-0">
                            <div className="relative w-36 h-36 flex items-center justify-center">
                              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                                <circle cx="48" cy="48" r="40" className="stroke-white/[0.04] fill-none" strokeWidth="6" />
                                <circle
                                  cx="48" cy="48" r="40"
                                  className="fill-none transition-all duration-1000"
                                  strokeWidth="6" strokeLinecap="round"
                                  style={{
                                    stroke: areaHex,
                                    strokeDasharray: '251.3',
                                    strokeDashoffset: (251.3 - (251.3 * (summary?.average_score ?? 0)) / 100).toString(),
                                    filter: `drop-shadow(0 0 8px ${areaGlow}50)`
                                  }}
                                />
                              </svg>
                              <div className="absolute flex flex-col items-center justify-center">
                                <span className="text-4xl font-headline font-black" style={{ color: areaHex }}>{summary?.average_score ?? 0}</span>
                                <span className="text-[10px] font-bold text-foreground/55 uppercase tracking-widest mt-1">/ 100</span>
                              </div>
                            </div>
                            <div className="text-[11px] font-bold text-foreground/55 uppercase tracking-widest text-center mt-2">Avg Score</div>
                          </div>
                          <div className="flex-grow space-y-3 text-center sm:text-left">
                            <h2 className="text-xl sm:text-2xl font-headline font-bold text-foreground leading-tight tracking-tight">
                              {activeOverview.title}
                            </h2>
                            <p className="text-sm sm:text-base text-foreground/85 leading-relaxed">
                              {activeOverview.text}
                            </p>
                          </div>
                        </div>

                        {summary && (
                          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] font-bold pt-4 border-t border-white/5 mt-auto">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: areaHex }} />
                              <span className="text-foreground/55">{t('forecast.best')}:</span>
                              <span className="text-foreground/80">{(range as string) === 'yearly' ? (summary as YearlyResponse['summary']).best_month : (summary as WeeklyResponse['summary'] | MonthlyResponse['summary']).best_day}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: STATUS_COLORS.BAD.main }} />
                              <span className="text-foreground/55">{t('forecast.worst')}:</span>
                              <span className="text-foreground/80">{(range as string) === 'yearly' ? (summary as YearlyResponse['summary']).worst_month : (summary as WeeklyResponse['summary'] | MonthlyResponse['summary']).worst_day}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-foreground/55">{t('forecast.avg')}:</span>
                              <span style={{ color: areaHex }}>{summary.average_score}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-foreground/55">{t('forecast.trend')}:</span>
                              <span className="text-foreground/80 capitalize">{summary.trend === 'improving' ? '📈' : summary.trend === 'declining' ? '📉' : '➡️'} {summary.trend}</span>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Right Column: Chart */}
                      <div className="lg:col-span-6 flex flex-col justify-between pl-0 lg:pl-6 mt-6 lg:mt-0 w-full h-full">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <h3 className="text-sm font-bold text-foreground/65 uppercase tracking-widest">Outlook Chart</h3>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => activeNavigation.can_go_previous && activeNavigation.previous && handlePrevious(activeNavigation.previous)}
                              disabled={!activeNavigation.can_go_previous}
                              aria-label={t('forecast.previous')}
                              className="w-9 h-9 rounded-lg border border-white/5 bg-surface flex items-center justify-center transition-all hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ChevronLeft className="w-5 h-5 text-foreground/75" />
                            </button>
                            <button
                              onClick={() => activeNavigation.can_go_next && activeNavigation.next && handleNext(activeNavigation.next)}
                              disabled={!activeNavigation.can_go_next}
                              aria-label={t('forecast.next')}
                              className="w-9 h-9 rounded-lg border border-white/5 bg-surface flex items-center justify-center transition-all hover:border-white/15 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <ChevronRight className="w-5 h-5 text-foreground/75" />
                            </button>
                          </div>
                        </div>
                        <div className="h-72 sm:h-[22rem] lg:h-96 w-full pt-2">
                          <ForecastChart
                            points={chartPoints}
                            colorHex={areaHex}
                            activeLabel={activeLabel || undefined}
                            onSelect={range === 'yearly' ? (m) => setSelectedMonth(m) : (d) => { setSelectedDay(d); openDayDetailModal(d); }}
                          />
                        </div>
                      </div>

                    </div>
                  )}

                </Card>
              )}

              {/* Card 2: 7 Days Breakdown (or monthly/yearly grids) */}
              {range === '7d' && activeWeekly?.days && (
                <Card className="border-white/5 bg-surface shadow-xl !rounded-[32px] p-6 sm:p-8">
                  <h3 className="text-lg font-headline font-bold text-foreground mb-6">7-Day Breakdown</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {activeWeekly.days.map(day => {
                      const today = todayISO();
                      const isToday = day.date === today;
                      let weekdayKey = (day.weekday || '').slice(0, 3).toLowerCase();
                      if (!weekdayKey && day.date) {
                        const dateObj = new Date(day.date + 'T00:00:00');
                        const weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                        weekdayKey = weekDays[dateObj.getDay()];
                      }
                      const weekdayShort = t(`forecast.weekdays.${weekdayKey}`).toUpperCase();
                      const dayOfMonth = parseInt(day.date.slice(-2), 10) || day.date.slice(-2);
                      const dateObj = new Date(day.date + 'T00:00:00');
                      const friendlyDate = dateObj.toLocaleDateString(language || 'en', { weekday: 'short', day: 'numeric', month: 'short' });

                      return (
                        <button
                          key={day.date}
                          onClick={() => isToday ? openDayDetailModal(day.date) : setSelectedDay(day.date)}
                          className={`flex flex-col justify-between items-center p-5 rounded-2xl border transition-all text-center gap-4 cursor-pointer ${isToday ? 'bg-surface border-secondary/30 shadow-md hover:border-secondary/50' : 'bg-surface-variant/5 border-white/5 hover:border-white/15 hover:bg-surface-variant/10'}`}
                          style={{
                            boxShadow: isToday ? `0 0 20px ${getAreaPhaseMain(area, day.score)}15` : undefined,
                          }}
                        >
                          <div className="space-y-1">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isToday ? 'text-secondary' : 'text-foreground/65'}`}>
                              {isToday ? 'TODAY' : weekdayShort}
                            </span>
                            <h4 className="text-xl font-headline font-black text-foreground leading-none">{dayOfMonth}</h4>
                            <p className="text-[10px] font-bold text-foreground/55">{friendlyDate}</p>
                          </div>

                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl font-headline font-black" style={{ color: getAreaPhaseMain(area, day.score) }}>{day.score}</span>
                            <span className="text-[8px] font-bold text-foreground/55 uppercase tracking-widest">Score</span>
                          </div>

                          {isToday ? (
                            <span className="w-full py-2 bg-secondary/10 border border-secondary/30 text-secondary rounded-xl text-[10px] font-black uppercase tracking-widest">
                              View Details
                            </span>
                          ) : (
                            <span className="w-full py-2 flex items-center justify-center gap-1 text-foreground/45 group-hover:text-foreground/70 transition-colors">
                              <ChevronRightIcon className="w-4 h-4" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* New: Weekly guidance + AI astrologer CTA */}
              {range === '7d' && activeWeekly?.days && (
                <ForecastActionPanel
                  area={area}
                  colorHex={areaHex}
                  best={(summary as WeeklyResponse['summary'])?.best_day}
                  worst={(summary as WeeklyResponse['summary'])?.worst_day}
                  average={summary?.average_score}
                  dominantPlanet={insightData?.dominant_planet}
                  dominantPlanetMeaning={(insightData as any)?.dominant_planet_meaning}
                  alerts={insightData?.alerts}
                  actionText={activeOverview?.text}
                  periodLabel={activePeriodLabel || ''}
                  t={t}
                />
              )}

              {/* Monthly calendar is now embedded inside Card 1 for range === 'monthly' */}

              {range === 'yearly' && activeYearly?.months && (
                <Card className="border-white/5 bg-surface shadow-xl !rounded-[32px] p-6 sm:p-8">
                  <h3 className="text-lg font-headline font-bold text-foreground mb-6">Yearly Outlook</h3>
                  <MonthGrid
                    months={activeYearly.months}
                    colorHex={areaHex}
                    area={area}
                    selectedMonth={selectedMonth}
                    onSelect={openMonthDetailModal}
                  />
                </Card>
              )}

            </div>

            {/* Paywall Overlay */}
            {isBlocked && (
              <div className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-8 bg-black/10 rounded-[32px] sm:rounded-[40px] pointer-events-auto">
                <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
                  <PaywallCard paywall={activePaywall} variant="inline" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Popup Modal */}
      <AnimatePresence>
        {detailModalData && (
          <div
            onClick={() => setDetailModalData(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md cursor-pointer"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`relative w-full ${range === '7d' ? 'lg:max-w-[66.666vw]' : 'max-w-2xl'} bg-surface border border-white/10 rounded-[32px] shadow-2xl text-left overflow-y-auto max-h-[90vh] cursor-default p-6 sm:p-8`}
            >
              <button
                onClick={() => setDetailModalData(null)}
                className="absolute top-6 right-6 z-10 p-2 rounded-full bg-white/5 hover:bg-white/10 text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <ForecastInsight data={detailModalData} colorHex={areaHex} isWide={range === '7d'} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
