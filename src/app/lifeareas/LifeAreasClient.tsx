'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePaywallContext } from '@/context/PaywallContext';
import PaywallCard from '@/components/paywall/PaywallCard';
import LockedPreview from '@/components/paywall/LockedPreview';
import type { PaywallData } from '@/types/paywall';
import { useDailyHoroscope, useTranslation } from '@/hooks';
import { clientFetch } from '@/lib/apiClient';
import { AREA_LIST, AREA_THEMES, ForecastArea } from '@/data/areaThemes';
import { getAreaPhaseMain, TEXT_COLORS, BRAND_GOLD } from '@/data/lifeAreaColors';
import { catmullRomToBezier, catmullRomArea } from '@/utils/chartCurve';
import { todayISO } from '@/utils/forecastError';
import type { HoroscopeData } from '@/types/horoscope';
import type { ForecastDay } from '@/components/dashboard/MiniChart';
import { useChat } from '@/context/ChatContext';
import { AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Sparkle
} from 'lucide-react';

interface ForecastData {
  area: ForecastArea;
  days: ForecastDay[];
  summary: {
    best_day: string;
    worst_day: string;
    average_score: number;
    trend: string;
  };
}

const areaLabelFallback: Record<ForecastArea, string> = {
  love: "Love",
  career: "Career",
  finance: "Finance",
  health: "Health",
  general: "General",
  spiritual: "Spiritual",
};

const areaDescriptions: Record<ForecastArea, string> = {
  love: "Strong connections and understanding.",
  career: "Good progress and recognition.",
  finance: "Stable flows, avoid impulsive spending.",
  health: "Focus on balance and consistent routines.",
  general: "Positive momentum in your overall journey.",
  spiritual: "Inner growth and clarity are strong.",
};

const PLANET_INFLUENCE_TEXT: Record<string, string> = {
  moon: "Governs emotions, intuition, and daily rhythm.",
  sun: "Highlights vitality, identity, and presence.",
  mercury: "Shapes communication, decisions, and mental clarity.",
  venus: "Influences relationships, harmony, and values.",
  mars: "Drives energy, initiative, and action.",
  jupiter: "Expands growth, wisdom, and opportunity.",
  saturn: "Brings discipline, boundaries, and lasting lessons.",
  rahu: "Amplifies desires and sudden, unconventional turns.",
  ketu: "Encourages release, detachment, and spiritual sight.",
};

const AREA_DEFAULT_PLANETS: Record<ForecastArea, string[]> = {
  love: ["Venus", "Moon"],
  career: ["Sun", "Saturn"],
  finance: ["Jupiter", "Venus"],
  health: ["Sun", "Mars"],
  general: ["Moon", "Jupiter"],
  spiritual: ["Ketu", "Jupiter"],
};

const AREA_QUESTIONS: Record<ForecastArea, string[]> = {
  general: [
    "What does today's chart say about my overall direction?",
    "Which life area needs my attention this week?",
  ],
  love: [
    "What can I do to improve my relationships this week?",
    "When is the best time for an important conversation?",
  ],
  career: [
    "What should I focus on to advance my career now?",
    "Is this a good week to ask for feedback or a raise?",
  ],
  finance: [
    "What financial habits will best support me this week?",
    "Should I avoid any major purchases right now?",
  ],
  health: [
    "What routines will best support my energy this week?",
    "Are there any health cautions in my current transits?",
  ],
  spiritual: [
    "What practices will deepen my spiritual growth now?",
    "Which planet is guiding my inner transformation?",
  ],
};

/**
 * Sample 7-day curve used ONLY inside the locked paywall preview, to show the
 * shape of the weekly chart without revealing real scores. This fake data must
 * never be shown to paid users, in skeletons, or anywhere outside a paywall.
 */
function buildSampleWeek(): ForecastDay[] {
  const scores = [62, 70, 58, 78, 66, 84, 72];
  const base = new Date();
  base.setDate(base.getDate() - 3);
  return scores.map((score, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return {
      date: iso,
      is_today: i === 3,
      score,
      text: "",
      dominant_planet: "",
      personalized_alerts: [],
    } as ForecastDay;
  });
}

function resolveAreaLabel(t: (key: string) => string, area: ForecastArea) {
  const key = `newDashboard.lifeAreas.${area}`;
  const translated = t(key);
  return translated && translated !== key ? translated : areaLabelFallback[area];
}

function getUserLocale(language: string) {
  if (language === "ko") return "ko-KR";
  if (language === "hi") return "hi-IN";
  return "en-GB";
}

function formatShortDayDate(dateStr: string, language: string) {
  const d = new Date(dateStr + "T00:00:00");
  const locale = getUserLocale(language);
  const weekday = d.toLocaleDateString(locale, { weekday: "short" });
  const day = d.getDate();
  const month = d.toLocaleDateString(locale, { month: "short" });
  return `${weekday}, ${day} ${month}`;
}

function getAreaScore(horoscope: HoroscopeData | null, area: ForecastArea) {
  const scoreArea = horoscope?.score?.areas?.[area as keyof NonNullable<HoroscopeData["score"]>["areas"]];
  if (scoreArea && typeof scoreArea === "object" && "value" in scoreArea) return scoreArea.value;
  if (horoscope?.today_scores?.[area] != null) return horoscope.today_scores[area];

  const legacy = horoscope as unknown as {
    areas?: Record<string, { score?: number; text?: string }>;
  } | null;
  const legacyKey = area === "love" ? "relationships" : area === "finance" ? "finances" : area;
  return legacy?.areas?.[legacyKey]?.score ?? (area === "spiritual" ? 76 : 70);
}

function getAreaInsight(horoscope: HoroscopeData | null, area: ForecastArea) {
  const areasText = horoscope?.areas_text as Partial<Record<ForecastArea, { insight: string; tone: string }>> | undefined;
  const insight = areasText?.[area]?.insight;
  if (insight) return insight;
  const legacy = horoscope as unknown as {
    areas?: Record<string, { score?: number; text?: string }>;
  } | null;
  const legacyKey = area === "love" ? "relationships" : area === "finance" ? "finances" : area;
  return legacy?.areas?.[legacyKey]?.text || areaDescriptions[area];
}

function getAreaAction(horoscope: HoroscopeData | null, area: ForecastArea) {
  if (area === "general") {
    const tip = horoscope?.tip;
    if (typeof tip === "string") return tip;
    return tip?.text || "";
  }
  const areasText = horoscope?.areas_text as Partial<Record<ForecastArea, { action?: string }>> | undefined;
  return areasText?.[area]?.action || "";
}

function AreaRing({
  score,
  color,
  children,
  size = 80,
  label,
}: {
  score: number;
  color: string;
  children: React.ReactNode;
  size?: number;
  label?: string;
}) {
  const radius = 33;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  const isDefaultSize = size === 80;

  return (
    <div
      className={isDefaultSize ? "relative mx-auto shrink-0 w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] md:w-[80px] md:h-[80px] animate-fade-in" : "relative mx-auto shrink-0 animate-fade-in"}
      style={isDefaultSize ? undefined : { width: size, height: size }}
    >
      <svg
        role="img"
        aria-label={label ? `${label} score: ${score} out of 100` : `Score: ${score} out of 100`}
        className="h-full w-full -rotate-90"
        viewBox="0 0 76 76"
      >
        <circle cx="38" cy="38" r={radius} fill="none" stroke="var(--outline-variant)" strokeOpacity="0.09" strokeWidth="5" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">{children}</div>
    </div>
  );
}

function DarkPanel({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <section className={`dark-glass rounded-[22px] shadow-[var(--card-shadow)] ${className}`} style={style}>
      {children}
    </section>
  );
}

function WeeklyOutlookChart({
  days,
  colorHex,
  areaLabel,
  lockedPreview = false,
}: {
  days: ForecastDay[];
  colorHex: string;
  areaLabel: string;
  lockedPreview?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setW(width);
        }
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const H = 200;
  const PAD = { top: 10, right: 20, bottom: 36, left: 24 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const xOf = (i: number) => PAD.left + (i / Math.max(1, days.length - 1)) * plotW;
  const yOf = (s: number) => PAD.top + (1 - s / 100) * plotH;

  const points = days.map((d, i) => ({ x: xOf(i), y: yOf(d.score) }));
  const linePath = catmullRomToBezier(points);
  const areaPath = catmullRomArea(points, PAD.top + plotH);

  const todayIdx = days.findIndex((d) => d.is_today);
  const todayX = todayIdx !== -1 ? points[todayIdx].x : null;
  const gid = colorHex.replace("#", "");
  const dt = (s: string) => new Date(s + "T00:00:00");

  return (
    <div ref={containerRef} className="w-full">
      {/* Visually hidden text alternative for screen readers (WCAG 1.1.1) */}
      {!lockedPreview && (
        <div
          style={{
            position: "absolute",
            width: "1px",
            height: "1px",
            padding: 0,
            margin: "-1px",
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        >
          <h3>Weekly {areaLabel} Forecast Data</h3>
          <ul>
            {days.map((d) => {
              const date = dt(d.date);
              const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
              return (
                <li key={d.date}>
                  {weekday}, {date.getDate()}: {d.score} out of 100{d.is_today ? " (Today)" : ""}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <svg
        role="img"
        aria-label={lockedPreview ? `Locked weekly ${areaLabel} forecast preview` : `Weekly ${areaLabel} forecast chart`}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[200px] w-full overflow-visible"
      >
        <defs>
          <linearGradient id={`wk-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorHex} stopOpacity="0.18" />
            <stop offset="60%" stopColor={colorHex} stopOpacity="0.06" />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines + labels */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--outline-variant)" strokeOpacity="0.12" strokeWidth="1" />
              <text x={PAD.left - 15} y={y + 4} textAnchor="end" fontSize="13" fontWeight="700" fill="var(--foreground)" opacity="0.92">{v}</text>
            </g>
          );
        })}

        {/* Today marker */}
        {todayX !== null && (
          <line x1={todayX} y1={PAD.top} x2={todayX} y2={PAD.top + plotH} stroke={colorHex} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" />
        )}

        {/* Area + line */}
        <path d={areaPath} fill={`url(#wk-${gid})`} />
        <path
          d={linePath}
          fill="none"
          stroke={colorHex}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 4px 10px ${colorHex}25)` }}
        />

        {/* Points + score labels + x-axis labels */}
        {points.map((p, i) => {
          const d = days[i];
          const isToday = i === todayIdx;
          const date = dt(d.date);
          return (
            <g key={i}>
              {isToday && <circle cx={p.x} cy={p.y} r="7" fill={colorHex} opacity="0.2" />}
              <circle cx={p.x} cy={p.y} r={isToday ? 4 : 3} fill={isToday ? colorHex : "var(--surface)"} stroke={colorHex} strokeWidth="2" />
              {!lockedPreview && (
                <text x={p.x} y={p.y - 13} textAnchor="middle" fontSize="14" fontWeight="700" fill={isToday ? colorHex : "var(--foreground)"} opacity={isToday ? 1 : 1}>
                  {d.score}
                </text>
              )}
              <text x={p.x} y={H - 18} textAnchor="middle" fontSize="13" fontWeight="800" letterSpacing="0.5" fill={isToday ? colorHex : "var(--foreground)"} opacity={isToday ? 1 : 0.9}>
                {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
              </text>
              <text x={p.x} y={H - 4} textAnchor="middle" fontSize="14" fontWeight="700" fill={isToday ? colorHex : "var(--foreground)"} opacity={isToday ? 1 : 1}>
                {date.getDate()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function LifeAreasClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useTranslation();
  const { isFeatureBlocked, getFeaturePaywall } = usePaywallContext();
  const { setSelectedAvatarId, avatars } = useChat();
  const [activePaywallData, setActivePaywallData] = useState<PaywallData | null>(null);

  const { data: horoscope, isLoading: horoscopeLoading } = useDailyHoroscope();

  const sampleWeek = useMemo(() => buildSampleWeek(), []);

  const tr = React.useCallback(
    (key: string, fallback: string, params?: Record<string, string | number>) => {
      const translated = params ? t(key, params) : t(key);
      return translated && translated !== key ? translated : fallback;
    },
    [t]
  );

  // Retrieve selected area from query params if present, else default to 'general'
  const initialArea = useMemo(() => {
    const areaQuery = searchParams.get('area');
    return (AREA_LIST as string[]).includes(areaQuery || '') ? (areaQuery as ForecastArea) : 'general';
  }, [searchParams]);

  const [activeArea, setActiveArea] = useState<ForecastArea>(initialArea);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);

  // Sync activeArea with URL changes
  useEffect(() => {
    setActiveArea(initialArea);
  }, [initialArea]);

  // Fetch forecast data on activeArea change
  useEffect(() => {
    if (isFeatureBlocked('full_daily_horoscope') && getFeaturePaywall('full_daily_horoscope')) {
      return;
    }
    const date = todayISO();
    setForecastLoading(true);
    clientFetch(`/api/forecast/${activeArea}/weekly?date=${date}&lang=${language}`)
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json() as {
            area: ForecastArea;
            days?: ForecastDay[];
            summary?: ForecastData["summary"];
          };
          const mappedForecast: ForecastData = {
            area: data.area,
            days: (data.days || []).map((d) => ({
              ...d,
              is_today: d.date === date,
            })),
            summary: data.summary || {
              best_day: "",
              worst_day: "",
              average_score: 70,
              trend: "stable",
            },
          };
          setForecast(mappedForecast);
        } else {
          setForecast(null);
        }
      })
      .catch((err) => console.warn("[LifeAreasPage] Weekly forecast failed:", err))
      .finally(() => setForecastLoading(false));
  }, [activeArea, language, isFeatureBlocked, getFeaturePaywall]);

  const lifeAreas = useMemo(() => {
    return AREA_LIST.map((area) => ({
      area,
      label: resolveAreaLabel(t, area),
      score: getAreaScore(horoscope, area),
      insight: getAreaInsight(horoscope, area),
      theme: AREA_THEMES[area],
    }));
  }, [horoscope, t]);

  const activeAreaLabel = useMemo(() => resolveAreaLabel(t, activeArea), [t, activeArea]);
  const activeAreaHex = useMemo(() => getAreaPhaseMain(activeArea, getAreaScore(horoscope, activeArea)), [activeArea, horoscope]);

  const activeAreaInsight = useMemo(() => {
    const rawInsight = getAreaInsight(horoscope, activeArea);
    if (!rawInsight) return "";
    return rawInsight;
  }, [horoscope, activeArea]);

  const activeAreaAction = useMemo(() => getAreaAction(horoscope, activeArea), [horoscope, activeArea]);

  const activeAreaNotes = useMemo(() => {
    if (activeArea === "general") {
      return horoscope?.current_state?.derived_from || [];
    }
    const notes = horoscope?.areas_text?.[activeArea as keyof typeof horoscope.areas_text]?.personal_notes;
    return Array.isArray(notes) ? notes : [];
  }, [horoscope, activeArea]);

  const isLocked = useMemo(() => isFeatureBlocked('full_daily_horoscope') && !!getFeaturePaywall('full_daily_horoscope'), [isFeatureBlocked, getFeaturePaywall]);

  const bestDay = useMemo(() => {
    if (!forecast?.days?.length) return null;
    return forecast.days.reduce<ForecastDay | null>(
      (acc, item) => (!acc || item.score > acc.score ? item : acc),
      null
    );
  }, [forecast]);

  const challengingDay = useMemo(() => {
    if (!forecast?.days?.length) return null;
    return forecast.days.reduce<ForecastDay | null>(
      (acc, item) => (!acc || item.score < acc.score ? item : acc),
      null
    );
  }, [forecast]);

  const bestDayLabel = useMemo(() => {
    if (!bestDay) return "";
    return formatShortDayDate(bestDay.date, language);
  }, [bestDay, language]);

  const challengingDayLabel = useMemo(() => {
    if (challengingDay) return formatShortDayDate(challengingDay.date, language);
    if (forecast?.summary?.worst_day) {
      const d = new Date(forecast.summary.worst_day);
      if (!isNaN(d.getTime())) return formatShortDayDate(forecast.summary.worst_day, language);
    }
    return forecast?.summary?.worst_day || "";
  }, [challengingDay, forecast, language]);

  const dominantPlanets = useMemo(() => {
    const seen = new Set<string>();
    forecast?.days?.forEach((d) => {
      if (d.dominant_planet) seen.add(d.dominant_planet);
    });
    const list = Array.from(seen);
    return list.length ? list : AREA_DEFAULT_PLANETS[activeArea];
  }, [forecast, activeArea]);

  // AI assistant avatar to display for "Ask Navi" context
  const activeAvatar = useMemo(() => {
    const AREA_TO_AVATAR_ID: Record<string, string> = {
      general: "navi",
      career: "career_mentor",
      love: "relationship_guide",
      health: "spiritual_guide",
      finance: "finance_mentor",
      spiritual: "astro_sage",
    };

    const targetId = AREA_TO_AVATAR_ID[activeArea] || "navi";
    const apiAvatar = avatars?.find((a) => a.avatarId === targetId);

    // Resolves /static/avatars/ paths to the local public /images/avatars/*.jpeg files
    const getSafeImageUrl = (url?: string, name?: string) => {
      const defaultName = name || "navi";
      if (!url) {
        return `/images/avatars/${defaultName.toUpperCase()}_AVATAR.jpeg`;
      }
      if (url.startsWith('/static/avatars/')) {
        const filename = url.substring(url.lastIndexOf('/') + 1);
        const basename = filename.substring(0, filename.lastIndexOf('.'));
        return `/images/avatars/${basename}.jpeg`;
      }
      return url;
    };

    if (apiAvatar) {
      return {
        avatarId: apiAvatar.avatarId,
        name: apiAvatar.name,
        title: apiAvatar.title || "AI Astrologer",
        imageUrl: getSafeImageUrl(apiAvatar.imageUrl, apiAvatar.name),
        desc: apiAvatar.description || `Get personalized guidance for your ${activeArea.toLowerCase()} journey`,
      };
    }

    switch (activeArea) {
      case "career":
        return {
          avatarId: "career_mentor",
          name: "Arya",
          title: "Career Mentor",
          imageUrl: "/images/avatars/ARYA_AVATAR.jpeg",
          desc: "Get personalized guidance for your career path",
        };
      case "love":
        return {
          avatarId: "relationship_guide",
          name: "Meera",
          title: "Relationship Guide",
          imageUrl: "/images/avatars/MEERA_AVATAR.jpeg",
          desc: "Get personalized guidance for your relationships",
        };
      case "finance":
        return {
          avatarId: "finance_mentor",
          name: "Vidya",
          title: "Finance Mentor",
          imageUrl: "/images/avatars/VIDYA_AVATAR.jpeg",
          desc: "Get personalized guidance for your wealth and assets",
        };
      case "health":
        return {
          avatarId: "spiritual_guide",
          name: "Anand",
          title: "Health Guide",
          imageUrl: "/images/avatars/ANAND_AVATAR.jpeg",
          desc: "Get personalized guidance for your health and vitality",
        };
      case "spiritual":
        return {
          avatarId: "astro_sage",
          name: "Rishi",
          title: "Deep Chart Sage",
          imageUrl: "/images/avatars/RISHI_AVATAR.jpeg",
          desc: "Get personalized guidance for your spiritual growth",
        };
      case "general":
      default:
        return {
          avatarId: "navi",
          name: "Navi",
          title: "General Vedic Guide",
          imageUrl: "/images/avatars/NAVI_AVATAR.jpeg",
          desc: "Get personalized guidance for your overall journey",
        };
    }
  }, [activeArea, avatars]);

  const handleAskQuestion = (question: string) => {
    if (isFeatureBlocked('chat_message') && getFeaturePaywall('chat_message')) {
      setActivePaywallData(getFeaturePaywall('chat_message')!);
      return;
    }
    setSelectedAvatarId(activeAvatar.avatarId);
    localStorage.setItem(
      "astramitra_pending_message",
      question
    );
    router.push("/chat");
  };

  if (horoscopeLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
        <p className="text-[14px] text-foreground/40 font-medium">Loading your cosmic dimensions...</p>
      </div>
    );
  }

  return (
    <div className="gpt-dashboard-shell safe-bottom-buffer relative min-h-[calc(100dvh-var(--navbar-height,64px)-24px)] overflow-x-hidden bg-transparent text-foreground">
      <div className="relative z-10 mx-auto max-w-[1760px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 2xl:max-w-[2100px] 3xl:max-w-[2400px] w-full flex flex-col gap-8">

        {/* Header Navigation */}
        <header className="flex flex-col gap-2.5">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-foreground/60 hover:text-secondary transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-headline text-[26px] sm:text-[34px] font-bold leading-tight tracking-tight flex items-center gap-2">
                <Sparkle className="w-6 h-6 fill-current" style={{ color: BRAND_GOLD.main }} />
                <span style={{ color: TEXT_COLORS.heading }}>Your Life Areas</span>
              </h1>
              <p className="mt-1 mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed" style={{ color: TEXT_COLORS.muted }}>
                Detailed Vedic insights, transit impacts, and weekly cycles across all key areas.
              </p>
            </div>
          </div>
        </header>

        {/* 6 Grid Cards selector */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 w-full">
          {lifeAreas.map(({ area, label, score, theme }) => {
            const Icon = theme.icon;
            const phaseHex = getAreaPhaseMain(area, score);
            const isLucide = area === "general" || area === "spiritual";
            const isSelected = activeArea === area;

            return (
              <button
                key={area}
                type="button"
                data-testid={`life-area-teaser-${area}`}
                aria-label={`${label}: ${score} out of 100`}
                onClick={() => {
                  setActiveArea(area);
                  // Update URL query parameter without triggering full reload
                  const newParams = new URLSearchParams(window.location.search);
                  newParams.set('area', area);
                  router.replace(`${window.location.pathname}?${newParams.toString()}`);
                }}
                className={`group flex flex-col items-center rounded-2xl border py-2.5 px-1.5 sm:py-3 sm:px-3 text-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${
                  isSelected
                    ? "bg-surface opacity-100 shadow-lg scale-[1.02] border-2"
                    : "border-white/15 bg-surface/[0.85] hover:border-white/30 hover:bg-surface"
                }`}
                style={{
                  borderColor: isSelected ? `${phaseHex}60` : undefined,
                  boxShadow: isSelected ? `0 0 16px ${phaseHex}28` : undefined,
                }}
              >
                <div className={isSelected ? "opacity-100" : "opacity-[0.68]"}>
                  <AreaRing score={score} color={phaseHex} label={label}>
                    <span
                      className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center overflow-hidden rounded-full"
                      style={{ color: phaseHex }}
                    >
                      <Icon className={isLucide ? "h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" : "h-4.5 w-4.5 sm:h-5 sm:w-5 object-cover"} />
                    </span>
                    <span className="text-sm sm:text-base font-black leading-none tabular-nums" style={{ color: phaseHex }}>
                      <span data-testid={`life-area-score-${area}`}>{score}</span>
                    </span>
                  </AreaRing>
                </div>
                <p className={isSelected ? "mt-2.5 font-headline text-xs sm:text-sm font-bold leading-tight text-foreground" : "mt-2.5 font-headline text-xs sm:text-sm font-bold leading-tight text-foreground/80"}>
                  {label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Similar Layout to Dashboard - Insight on Left, Chart on Right */}
        <DarkPanel className="p-5 sm:p-6 flex flex-col gap-6 min-h-[540px] lg:min-h-[760px]">

          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${activeAreaHex}15`, color: activeAreaHex }}
            >
              {React.createElement(AREA_THEMES[activeArea].icon, {
                className: activeArea === "general" || activeArea === "spiritual" ? "h-4 w-4 fill-current" : "h-5 w-5 object-cover"
              })}
            </span>
            <h2 className="font-headline text-lg font-bold text-foreground">
              {activeAreaLabel} Overview & Cycles
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(380px,37%)_1fr] lg:items-stretch w-full grow">

            {/* Left Column: Details, Personalized Notes & Ask Navi */}
            <div className="flex flex-col justify-between gap-6 bg-surface-variant/[0.025] py-5 px-5 rounded-2xl border border-white/5">
              <div className="relative space-y-5 text-left">
                {isLocked ? (
                  <LockedPreview
                    className="min-h-[170px]"
                    message={tr('paywall.unlockInsight', "Unlock to read your personalized insight")}
                    ctas={[
                      {
                        label: tr('paywall.viewPlans', "View Plans"),
                        href: `/plans?feature=full_daily_horoscope`,
                      },
                    ]}
                  >
                    {/* Sample (non-real) faded insight lines — scoped to paywall only. */}
                    <div className="space-y-2.5 py-1">
                      <p className="text-[12px] font-black uppercase tracking-[0.15em]" style={{ color: activeAreaHex }}>
                        {activeAreaLabel} Insight
                      </p>
                      <p className="text-[15px] leading-relaxed text-foreground/85">
                        Practice giving without a fixed expectation. Spending energy on patterns keeps the night calm and your focus steady.
                      </p>
                    </div>
                  </LockedPreview>
                ) : activeAreaInsight ? (
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-[0.15em] mb-2.5" style={{ color: activeAreaHex }}>
                      Astrological Analysis
                    </h4>
                    <p className="text-[15px] leading-relaxed text-foreground/90">
                      {activeAreaInsight}
                    </p>
                    {activeAreaAction && (
                      <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: activeAreaHex }} />
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.15em] mb-0.5" style={{ color: TEXT_COLORS.muted }}>
                            Today&apos;s Action
                          </p>
                          <p className="text-[15px] leading-relaxed text-foreground/90">
                            {activeAreaAction}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[15px] text-foreground/40 italic">
                    Select a life area above to view cosmic insights.
                  </p>
                )}

                {/* Why Score is High/Low & Personalized Notes rendered Inline */}
                {!isLocked && activeAreaNotes.length > 0 && (
                  <div className="mt-5 p-4 rounded-xl border border-secondary/15 bg-secondary/5 space-y-3">
                    <h5 className="text-[12px] font-black uppercase tracking-wider flex items-center gap-1.5" style={{ color: TEXT_COLORS.muted }}>
                      <Sparkles className="w-3.5 h-3.5" style={{ color: BRAND_GOLD.main }} />
                      Personalized Transit Notes
                    </h5>
                    <ul className="text-[13px] text-foreground/85 space-y-2 list-disc pl-4 leading-relaxed">
                      {activeAreaNotes.map((note: string, i: number) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Ask Avatar Button integration */}
              <div className="mt-4 pt-3 border-t border-white/5 w-full">
                <button
                  onClick={() => handleAskQuestion(`I want to consult with ${activeAvatar.name} about my ${activeAreaLabel.toLowerCase()} area prediction: ${activeAreaInsight}`)}
                  className="group w-full flex items-center justify-between gap-3 rounded-2xl bg-surface border border-white/[0.08] py-4 px-4 text-left hover:border-secondary/20 hover:bg-surface-variant/[0.25] transition duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10">
                      <Image
                        src={activeAvatar.imageUrl}
                        alt={activeAvatar.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[13px] text-foreground">
                          Ask {activeAvatar.name} about {activeAreaLabel}
                        </span>
                        <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide">
                          RECOMMENDED
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground/60 mt-0.5 truncate max-w-[200px] md:max-w-[190px] xl:max-w-[230px] 2xl:max-w-[280px]">
                        {activeAvatar.desc}
                      </p>
                    </div>
                  </div>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.04] border border-white/10 group-hover:bg-secondary/15 group-hover:border-secondary/30 transition-colors">
                    <ArrowRight className="h-4 w-4 text-secondary opacity-80 group-hover:opacity-100 transition-opacity" />
                  </span>
                </button>
              </div>

            </div>

            {/* Right Column: Weekly Outlook Chart & Stats */}
            <div className="flex flex-col justify-between gap-6 bg-surface-variant/[0.025] py-5 px-5 rounded-2xl border border-white/5">

              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.15em] text-left" style={{ color: TEXT_COLORS.muted }}>
                    7-Day Outlook Trend
                  </h4>
                  {bestDayLabel && (
                    <div className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border bg-secondary/5 border-secondary/20 text-foreground/80">
                      <Sparkles className="w-3 h-3 text-secondary" />
                      Best Day: <span className="text-secondary">{bestDayLabel}</span>
                    </div>
                  )}
                </div>
                <div className="relative rounded-2xl overflow-hidden w-full bg-surface-variant/[0.035] px-4 py-4 min-h-[230px] flex flex-col justify-center border border-white/5">
                  {isLocked ? (
                    <LockedPreview
                      compact
                      className="min-h-[190px]"
                      message={tr('paywall.unlockWeeklyTrend', "Unlock to see your 7-day trend")}
                      ctas={[{ label: tr('paywall.viewPlans', "View Plans"), href: `/plans?feature=full_daily_horoscope` }]}
                    >
                      {/* Sample (non-real) preview curve — scoped to the paywall only. */}
                      <WeeklyOutlookChart
                        days={sampleWeek}
                        colorHex={activeAreaHex}
                        areaLabel={resolveAreaLabel(t, activeArea)}
                        lockedPreview
                      />
                    </LockedPreview>
                  ) : forecastLoading || !forecast ? (
                    <div className="h-[200px] animate-pulse rounded-2xl bg-surface-variant/[0.04]" />
                  ) : (
                    <WeeklyOutlookChart days={forecast.days} colorHex={activeAreaHex} areaLabel={activeAreaLabel} />
                  )}
                </div>
              </div>

              {!isLocked && forecast && forecast.summary && (
                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-[11px] uppercase font-black tracking-wider text-foreground/50">Average Score</p>
                    <p className="text-lg font-black text-foreground mt-0.5">{Math.round(forecast.summary.average_score)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-[11px] uppercase font-black tracking-wider text-foreground/50">Outlook Trend</p>
                    <p className="text-lg font-black mt-0.5 capitalize text-secondary">{forecast.summary.trend || "stable"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-[11px] uppercase font-black tracking-wider text-foreground/50">Challenging Day</p>
                    <p className="text-base sm:text-lg font-black mt-0.5 text-rose-400">
                      {challengingDayLabel || "N/A"}
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>

        </DarkPanel>

        {/* Bottom utility sections — fill unused lower space with useful context */}
        {!isLocked && (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Key Planetary Influences */}
            <DarkPanel className="p-5 sm:p-6 flex flex-col gap-3">
              <h4 className="text-[12px] font-black uppercase tracking-[0.15em]" style={{ color: TEXT_COLORS.muted }}>
                Key Planetary Influences
              </h4>
              <ul className="space-y-3">
                {dominantPlanets.map((planet, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black uppercase" style={{ backgroundColor: `${activeAreaHex}18`, color: activeAreaHex }}>
                      {planet.slice(0, 1)}
                    </span>
                    <div>
                      <p className="text-[13px] font-bold text-foreground capitalize">{planet}</p>
                      <p className="text-[12px] text-foreground/65 leading-relaxed">
                        {PLANET_INFLUENCE_TEXT[planet.toLowerCase()] || "Influencing the current cycle."}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </DarkPanel>

            {/* Weekly Opportunities & Cautions */}
            <DarkPanel className="p-5 sm:p-6 flex flex-col gap-3">
              <h4 className="text-[12px] font-black uppercase tracking-[0.15em]" style={{ color: TEXT_COLORS.muted }}>
                Weekly Opportunities & Cautions
              </h4>
              <ul className="space-y-3 text-[13px] leading-relaxed text-foreground/90">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: activeAreaHex }} />
                  <span>
                    <span className="font-semibold text-foreground">Best window to act:</span>{" "}
                    {bestDayLabel ? (
                      <span className="font-semibold" style={{ color: activeAreaHex }}>{bestDayLabel}</span>
                    ) : (
                      "Mid-week shows the strongest momentum."
                    )}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-rose-400" />
                  <span>
                    <span className="font-semibold text-foreground">Caution day:</span>{" "}
                    {challengingDayLabel ? challengingDayLabel : "Keep energy steady and avoid rushed decisions."}
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 bg-secondary" />
                  <span>
                    <span className="font-semibold text-foreground">Trend:</span>{" "}
                    {forecast?.summary?.trend
                      ? `${forecast.summary.trend.charAt(0).toUpperCase() + forecast.summary.trend.slice(1)} energy across the week.`
                      : "Stable energy across the week."}
                  </span>
                </li>
              </ul>
            </DarkPanel>

            {/* Related questions for AI astrologer */}
            <DarkPanel className="p-5 sm:p-6 flex flex-col gap-3">
              <h4 className="text-[12px] font-black uppercase tracking-[0.15em]" style={{ color: TEXT_COLORS.muted }}>
                Ask Navi About {activeAreaLabel}
              </h4>
              <div className="flex flex-col gap-2.5">
                {(AREA_QUESTIONS[activeArea] || AREA_QUESTIONS.general).map((question, i) => (
                  <button
                    key={i}
                    onClick={() => handleAskQuestion(question)}
                    className="text-left text-[13px] leading-snug text-foreground/85 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3 hover:bg-secondary/5 hover:border-secondary/20 hover:text-foreground transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleAskQuestion(`I want to consult with ${activeAvatar.name} about my ${activeAreaLabel.toLowerCase()} area prediction: ${activeAreaInsight}`)}
                className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl border border-secondary/20 bg-secondary/5 px-4 py-2.5 text-[12px] font-black uppercase tracking-wider text-secondary hover:bg-secondary/10 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask a custom question
              </button>
            </DarkPanel>
          </div>
        )}

      </div>
      <AnimatePresence>
        {activePaywallData && (
          <PaywallCard
            paywall={activePaywallData}
            variant="modal"
            onClose={() => setActivePaywallData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
