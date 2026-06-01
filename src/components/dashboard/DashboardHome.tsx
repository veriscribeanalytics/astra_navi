"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  Briefcase,
  Calendar,
  Coins,
  Gem,
  Globe,
  Heart,
  Home,
  Lock,
  MessageSquare,
  Moon,
  Orbit,
  ShieldAlert,
  Sparkles,
  Star,
  Sun,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { usePaywallContext } from "@/context/PaywallContext";
import { useChat } from "@/context/ChatContext";
import { getTierLabel } from "@/types/billing";
import PaywallCard from "@/components/paywall/PaywallCard";
import type { PaywallFeatureKey, PaywallData } from "@/types/paywall";
import { useDailyHoroscope, useTranslation, useTransitsToday } from "@/hooks";
import { useGreeting } from "@/hooks/useGreeting";
import { LOCALE_BY_LANGUAGE } from "@/locales";
import { clientFetch } from "@/lib/apiClient";
import { getRashiData } from "@/lib/astrology";
import { isProfileComplete } from "@/lib/profileCompleteness";
import { AREA_LIST, AREA_THEMES, ForecastArea } from "@/data/areaThemes";
import type { ForecastDay } from "@/components/dashboard/MiniChart";
import Particles from "@/components/ui/Particles";
import { catmullRomToBezier, catmullRomArea } from "@/utils/chartCurve";
import type { HoroscopeData } from "@/types/horoscope";
import { useFamilyMembers } from "@/hooks/useFamily";
import { parseKundliStats } from "@/lib/kundliStats";
import { getAvatarImage } from "@/utils/avatarStyle";
import { computeFamilyMemberStatus } from "@/lib/familyStatus";

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

type ChatPrompt = {
  title: string;
  message: string;
};

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

function resolveAreaLabel(t: (key: string) => string, area: ForecastArea) {
  const key = `newDashboard.lifeAreas.${area}`;
  const translated = t(key);
  return translated && translated !== key ? translated : areaLabelFallback[area];
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

function formatRahuKaal(transits: ReturnType<typeof useTransitsToday>["data"]) {
  const rk = transits?.panchanga?.rahukaal;
  if (!rk) return "08:34 - 10:25";
  return `${rk.start} - ${rk.end}`;
}

function getScoreColor(score: number) {
  if (score >= 75) return "#34d399";
  if (score >= 60) return "#f6b400";
  return "#fb7185";
}

function RingScore({ score, size = 132, color }: { score: number; size?: number; color: string }) {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[42px] font-black leading-none tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="mt-1 text-sm font-semibold text-white/70">/100</span>
      </div>
    </div>
  );
}

function WeeklyOutlookChart({ days, colorHex }: { days: ForecastDay[]; colorHex: string }) {
  const W = 600;
  const H = 230;
  const PAD = { top: 26, right: 20, bottom: 44, left: 38 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Absolute 0-100 scale so the curve reads against fixed gridlines.
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
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[230px] w-full">
      <defs>
        <linearGradient id={`wk-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorHex} stopOpacity="0.4" />
          <stop offset="60%" stopColor={colorHex} stopOpacity="0.12" />
          <stop offset="100%" stopColor={colorHex} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y-axis gridlines + labels */}
      {[0, 25, 50, 75, 100].map((v) => {
        const y = yOf(v);
        return (
          <g key={v}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <text x={PAD.left - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.4)">{v}</text>
          </g>
        );
      })}

      {/* Today marker */}
      {todayX !== null && (
        <line x1={todayX} y1={PAD.top} x2={todayX} y2={PAD.top + plotH} stroke={colorHex} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
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
        style={{ filter: `drop-shadow(0 4px 10px ${colorHex}55)` }}
      />

      {/* Points + score labels + x-axis labels */}
      {points.map((p, i) => {
        const d = days[i];
        const isToday = i === todayIdx;
        const date = dt(d.date);
        return (
          <g key={i}>
            {isToday && <circle cx={p.x} cy={p.y} r="7" fill={colorHex} opacity="0.2" />}
            <circle cx={p.x} cy={p.y} r={isToday ? 4 : 3} fill={isToday ? colorHex : "#0a0829"} stroke={colorHex} strokeWidth="2" />
            <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="11" fontWeight={isToday ? 700 : 600} fill={isToday ? colorHex : "rgba(255,255,255,0.7)"}>
              {d.score}
            </text>
            <text x={p.x} y={H - 24} textAnchor="middle" fontSize="9.5" fontWeight={700} letterSpacing="0.5" fill={isToday ? colorHex : "rgba(255,255,255,0.45)"}>
              {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
            </text>
            <text x={p.x} y={H - 11} textAnchor="middle" fontSize="11" fontWeight={600} fill={isToday ? colorHex : "rgba(255,255,255,0.6)"}>
              {date.getDate()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function AreaRing({
  score,
  color,
  children,
  size = 80,
}: {
  score: number;
  color: string;
  children: React.ReactNode;
  size?: number;
}) {
  const radius = 33;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="5" />
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

function DarkPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[22px] border border-[#b98224]/30 bg-[#090826]/82 shadow-[0_18px_60px_rgba(0,0,0,0.24)] ${className}`}>
      {children}
    </section>
  );
}

export default function DashboardHome() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useTranslation();
  const greeting = t(useGreeting());
  const { user, refreshProfile, isLoading: userLoading, profileComplete, profileFetched } = useAuth();
  const { tier, totalCredits, isLoaded: paywallLoaded, isFeatureBlocked, getFeaturePaywall } = usePaywallContext();
  const [activePaywallData, setActivePaywallData] = useState<PaywallData | null>(null);
  const { data: horoscope, isLoading: horoscopeLoading, profileLocationRequired } = useDailyHoroscope();
  const { data: transits, isLoading: transitsLoading } = useTransitsToday();
  const { setSelectedAvatarId } = useChat();
  const [activeArea, setActiveArea] = useState<ForecastArea>("general");
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<ChatPrompt | null>(null);
  const hasAnalyzedRef = useRef<string | null>(null);
  const redirectedRef = useRef(false);

  const profileCompleteFromFields = isProfileComplete({
    name: user?.name,
    dob: user?.dob,
    tob: user?.tob,
    pob: user?.pob,
    birthLatitude: user?.birthLatitude,
    birthLongitude: user?.birthLongitude,
    birthTimezoneName: user?.birthTimezoneName,
  });

  useEffect(() => {
    if (userLoading || !user?.email || hasAnalyzedRef.current === user.email) return;

    if (profileFetched && !profileComplete && !profileCompleteFromFields && !redirectedRef.current && pathname !== "/profile") {
      const timer = setTimeout(() => {
        if (!profileComplete && !profileCompleteFromFields && !redirectedRef.current) {
          redirectedRef.current = true;
          router.push(`/profile?onboarding=true&return=${encodeURIComponent(pathname || "/")}`);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }

    const hasBirthDetails =
      user.dob &&
      user.tob &&
      user.pob &&
      typeof user.birthLatitude === "number" &&
      typeof user.birthLongitude === "number";
    const hasSigns = user.moonSign || user.sunSign || user.lagnaSign;
    const hasAstrologyData = !!user.astrologyData;

    if (hasBirthDetails && !hasSigns && !hasAstrologyData) {
      hasAnalyzedRef.current = user.email;
      clientFetch("/api/analyze-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force_refresh: false }),
      })
        .then(async (res) => {
          if (res.ok) await refreshProfile();
        })
        .catch((err) => console.warn("[GptDashboard] Auto analyze-full failed:", err));
    }
  }, [
    user?.email,
    user?.name,
    user?.dob,
    user?.tob,
    user?.pob,
    user?.birthLatitude,
    user?.birthLongitude,
    user?.birthTimezoneName,
    user?.moonSign,
    user?.sunSign,
    user?.lagnaSign,
    user?.astrologyData,
    userLoading,
    refreshProfile,
    profileComplete,
    profileCompleteFromFields,
    profileFetched,
    router,
    pathname,
  ]);

  useEffect(() => {
    setForecastLoading(true);
    clientFetch(`/api/forecast/${activeArea}?days_back=3&days_forward=3&lang=${language}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.days)) {
          setForecast(data);
        } else {
          setForecast(null);
        }
      })
      .catch((err) => console.warn("[GptDashboard] Weekly forecast failed:", err))
      .finally(() => setForecastLoading(false));
  }, [activeArea, language]);

  const currentDate = useMemo(
    () =>
      new Date().toLocaleDateString(LOCALE_BY_LANGUAGE[language] || "en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [language]
  );

  const userName = user?.name || user?.email?.split("@")[0] || t("common.user");
  const overallScore = horoscope?.score?.overall ?? horoscope?.overall_score ?? 73;
  const scoreColor = getScoreColor(overallScore);
  const scoreBand = overallScore >= 75
    ? (t('newDashboard.todaysEnergy.bandFavorable') || "Favorable")
    : overallScore >= 60
      ? (t('newDashboard.todaysEnergy.bandBalanced') || "Balanced")
      : (t('newDashboard.todaysEnergy.bandCaution') || "Caution");
  const moonSign = getRashiData(user?.moonSign || horoscope?.user?.sign || horoscope?.sign || "Leo");
  const sunSign = getRashiData(user?.sunSign || "Libra");
  const ascendantSign = getRashiData(user?.lagnaSign || "Leo");
  const activeAreaLabel = resolveAreaLabel(t, activeArea);
  const bestDay = useMemo(() => {
    const day = forecast?.days?.reduce<ForecastDay | null>((best, item) => (!best || item.score > best.score ? item : best), null);
    if (!day) return "Thu 74";
    const label = new Date(day.date + "T00:00:00").toLocaleDateString(LOCALE_BY_LANGUAGE[language] || "en-IN", { weekday: "short" });
    return `${label} ${day.score}`;
  }, [forecast, language]);

  const askInChat = useCallback((title: string, message: string) => {
    setPendingPrompt({ title, message });
  }, []);

  const confirmChat = useCallback(() => {
    if (!pendingPrompt) return;
    localStorage.setItem("astranavi_pending_message", pendingPrompt.message);
    setPendingPrompt(null);
    router.push("/chat");
  }, [pendingPrompt, router]);

  const lifeAreas = AREA_LIST.map((area) => ({
    area,
    label: resolveAreaLabel(t, area),
    score: getAreaScore(horoscope, area),
    insight: getAreaInsight(horoscope, area),
    theme: AREA_THEMES[area],
  }));

  const topLifeArea = [...lifeAreas].sort((a, b) => b.score - a.score)[0];
  const rawHeadline =
    horoscope?.alerts?.primary?.simple ||
    "Your current planetary period is on your side - act on the bigger plan now.";
  const headline =
    rawHeadline === "Your current planetary period is on your side - act on the bigger plan now."
      ? (t('newDashboard.todaysEnergy.defaultHeadline') || rawHeadline)
      : rawHeadline;

  const rawSubtitle =
    (typeof horoscope?.tip === "string"
      ? horoscope.tip
      : horoscope?.tip?.text) ||
    "This is a powerful window to build momentum, make thoughtful moves, and align with your greater purpose.";
  const subtitle =
    rawSubtitle === "This is a powerful window to build momentum, make thoughtful moves, and align with your greater purpose."
      ? (t('newDashboard.todaysEnergy.defaultSubtitle') || rawSubtitle)
      : rawSubtitle;

  if (profileLocationRequired && !horoscope) {
    return (
      <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[#06061f] px-4 py-10 text-white">
        <DarkPanel className="mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#f2b233]/30 bg-[#f2b233]/10">
            <ShieldAlert className="h-7 w-7 text-[#f2b233]" />
          </div>
          <h1 className="font-headline text-2xl font-bold">Exact birth location required</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Please confirm your exact birth location and timezone in your profile for personalized horoscope calculations.
          </p>
          <button
            onClick={() => router.push("/profile?onboarding=true&return=/")}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#f2b233] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#08071f]"
          >
            Confirm birth location <ArrowRight className="h-4 w-4" />
          </button>
        </DarkPanel>
      </div>
    );
  }

  return (
    <div className="gpt-dashboard-shell relative min-h-[calc(100dvh-var(--navbar-height,64px))] overflow-x-hidden bg-[#05051c] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(154,67,67,0.38),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(61,49,123,0.38),transparent_34%),linear-gradient(180deg,#070828_0%,#060521_48%,#080622_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <Particles
          particleCount={260}
          particleColors={["#ffd27a", "#ffffff", "#a78bd2"]}
          particleBaseSize={70}
          particleSpread={11}
          speed={0.08}
          alphaParticles
          disableRotation={false}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1760px] px-5 py-6 sm:px-8 lg:px-10 2xl:max-w-[2100px] min-[2560px]:max-w-[94%]">
        <header className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3 text-[12px] font-bold uppercase tracking-[0.24em] text-white/58">
              <span className="h-px w-12 bg-[#d99b23]/50" />
              <span>{currentDate}</span>
              {paywallLoaded && (
                <Link href="/plans" className="inline-flex items-center gap-2 rounded-full border border-[#d99b23]/20 bg-[#d99b23]/10 px-3 py-1.5 tracking-normal text-[#e6ad2f]">
                  <Wallet className="h-3.5 w-3.5" />
                  <span className="text-sm font-black">{totalCredits ?? 0}</span>
                  <span className="text-[10px] uppercase text-white/40">{t('plans.naviCredits') || "Navi Credits"}</span>
                  <span className="rounded-full bg-[#d99b23]/10 px-2 py-0.5 text-[10px] uppercase text-[#e6ad2f]">{getTierLabel(tier || "free")}</span>
                </Link>
              )}
            </div>
            <h1 className="mt-4 font-headline text-[30px] font-bold leading-tight tracking-tight sm:text-[42px]">
              {greeting},{" "}
              <span className="bg-gradient-to-r from-[#ffcf66] via-[#f5a500] to-[#dd8d00] bg-clip-text text-transparent">
                {userLoading ? "..." : userName}
              </span>
            </h1>
            {topLifeArea && (
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-white">
                <Star className="h-4 w-4 fill-[#ffc83d] text-[#ffc83d]" />
                {t('newDashboard.todaysEnergy.scoreImpressive', { label: topLifeArea.label }) || `Your ${topLifeArea.label} Score is Impressive!`} <span className="font-black text-[#34d399]">{topLifeArea.score}%</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: t('dashboard.moonSign') || "Moon Sign", data: moonSign, fallback: "Leo" },
              { label: t('dashboard.sunSign') || "Sun Sign", data: sunSign, fallback: "Libra" },
              { label: t('dashboard.ascendant') || "Ascendant", data: ascendantSign, fallback: "Leo" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.data?.id ? `/rashis?sign=${item.data.id}` : "/rashis"}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.035] px-2 py-3 text-center transition hover:border-[#d99b23]/40 hover:bg-[#d99b23]/8 sm:min-w-[185px] sm:flex-row sm:gap-4 sm:px-4 sm:text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d99b23]/25 bg-[#05051c] sm:h-[58px] sm:w-[58px]">
                  {item.data?.icon ? (
                    <Image src={item.data.icon} alt={item.data.name} width={34} height={34} className="h-7 w-7 object-contain sm:h-9 sm:w-9" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-[#d99b23] sm:h-6 sm:w-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/55 sm:text-[11px] sm:tracking-[0.22em]">{item.label}</p>
                  <p className="mt-0.5 truncate font-headline text-sm font-bold text-white sm:mt-1 sm:text-lg">{item.data?.name || item.fallback}</p>
                </div>
              </Link>
            ))}
          </div>
        </header>

        <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="space-y-5">
            <DarkPanel className="p-5 sm:p-7">
              <div className="grid gap-6 lg:grid-cols-[170px_minmax(0,1fr)_190px] lg:items-center">
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <p className="text-[13px] font-black uppercase tracking-[0.2em] text-[#ffc43d]">{t('newDashboard.todaysEnergy.title') || "Today's Energy"}</p>
                  <div className="mt-5">
                    <RingScore score={overallScore} color={scoreColor} />
                  </div>
                  <span
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]"
                    style={{ color: scoreColor, backgroundColor: `${scoreColor}1f` }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: scoreColor }} />
                    {scoreBand}
                  </span>
                </div>

                <div>
                  <h2 className="font-headline text-2xl font-bold leading-snug sm:text-[28px]">{headline}</h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-white/62">{subtitle}</p>
                </div>

                <div className="hidden justify-center lg:flex">
                  <Image src="/images/lotus.svg" alt="" width={180} height={130} className="drop-shadow-[0_0_30px_rgba(168,85,247,0.45)]" />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { label: moonSign?.name || "Leo", icon: <Orbit className="h-4 w-4" /> },
                  { label: `${ascendantSign?.name || "Leo"} ${t('newDashboard.todaysEnergy.rising') || "Rising"}`, icon: <Moon className="h-4 w-4" /> },
                  { label: transits?.panchanga?.tithi || "Purnima", prefix: t('newDashboard.panchang.tithi') || "Tithi" },
                  { label: transits?.panchanga?.nakshatra || "Anuradha", prefix: t('newDashboard.panchang.nakshatra') || "Nakshatra" },
                ].map((chip) => (
                  <div key={`${chip.prefix || chip.label}-${chip.label}`} className="inline-flex items-center gap-2 rounded-full bg-[#21164d]/70 px-4 py-2 text-sm font-bold text-white">
                    {"icon" in chip && chip.icon}
                    {"prefix" in chip && <span className="text-[11px] uppercase tracking-[0.18em] text-white/45">{chip.prefix}</span>}
                    <span>{chip.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex items-start gap-4">
                    <Sun className="h-8 w-8 shrink-0 text-[#34d399]" />
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#34d399]">{t('newDashboard.todaysEnergy.goodTime') || "Good Time"}</p>
                      <p className="mt-2 text-lg font-bold">19:00 - 20:00</p>
                      <p className="mt-1 text-sm leading-6 text-white/58">{t('newDashboard.todaysEnergy.goodTimeDesc') || "Auspicious window for important work and decisions."}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-8 w-8 shrink-0 fill-[#ffb400]/15 text-[#ffb400]" />
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-[#ffb400]">
                        {t('newDashboard.panchang.rahuKaal') && t('newDashboard.todaysEnergy.alertTime')
                          ? `${t('newDashboard.panchang.rahuKaal')} / ${t('newDashboard.todaysEnergy.alertTime')}`
                          : "Rahu Kaal / Caution Window"}
                      </p>
                      <p className="mt-2 text-lg font-bold">{formatRahuKaal(transits)}</p>
                      <p className="mt-1 text-sm leading-6 text-white/58">{t('newDashboard.todaysEnergy.cautionTimeDesc') || "Avoid starting new work or making major commitments."}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => askInChat(t('newDashboard.todaysEnergy.aiChat') || "Ask Navi", t('newDashboard.todaysEnergy.explainMsg', { score: overallScore }) || `Explain today's energy for me. My overall score is ${overallScore}.`)}
                  className="rounded-full border border-[#f2ad1d]/60 px-5 py-3 text-sm font-black uppercase tracking-wider text-[#ffc43d] transition hover:bg-[#f2ad1d]/10"
                >
                  {t('newDashboard.todaysEnergy.aiChat') || "Ask Navi"}
                </button>
                <Link
                  href="/horoscope/forecast"
                  className="rounded-full bg-gradient-to-r from-[#f9a900] via-[#ffbd16] to-[#de8b00] px-5 py-3 text-center text-sm font-black uppercase tracking-wider text-[#08071f] transition hover:brightness-110"
                >
                  {t('newDashboard.todaysEnergy.fullReading') || "Full Reading"}
                </Link>
              </div>
            </DarkPanel>

            <section className="space-y-3">
              <h2 className="text-[14px] font-bold uppercase tracking-[0.22em] text-white/70">{t('newDashboard.lifeAreas.title') || "Life Areas"}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {lifeAreas.map(({ area, label, score, insight, theme }) => {
                  const Icon = theme.icon;
                  const color = getScoreColor(score);
                  const isLucide = area === "general" || area === "spiritual";
                  return (
                    <Link
                      key={area}
                      href={`/horoscope/forecast?area=${area}`}
                      className="group rounded-2xl border border-white/10 bg-[#0a0829]/78 p-4 text-center transition hover:-translate-y-0.5 hover:border-[#d99b23]/35 hover:bg-[#100b35]"
                    >
                      <AreaRing score={score} color={color}>
                        <span
                          className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full"
                          style={{ color }}
                        >
                          <Icon className={isLucide ? "h-3.5 w-3.5 fill-current" : "h-5 w-5 object-cover"} />
                        </span>
                        <span className="text-base font-black leading-none tabular-nums" style={{ color }}>
                          {score}
                        </span>
                      </AreaRing>
                      <p className="mt-3 font-headline text-lg font-bold">{label}</p>
                      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-white/58">{insight}</p>
                    </Link>
                  );
                })}
              </div>
            </section>

            <DarkPanel className="grid gap-4 p-5 md:grid-cols-[160px_1fr_1fr_1fr_1fr]">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-[#ffc43d]" />
                <div>
                  <p className="text-[13px] font-black uppercase tracking-[0.16em]">{t('newDashboard.celestial') || "Celestial"}</p>
                  <p className="text-[13px] font-black uppercase tracking-[0.16em]">{t('newDashboard.insights') || "Insights"}</p>
                </div>
              </div>
              {(transits?.notableTransits?.length ? transits.notableTransits : [
                t('newDashboard.notableTransits.jupiter') || "Jupiter's transit enhances your gains and stabilizes growth.",
                t('newDashboard.notableTransits.saturn') || "Saturn's transit tests your discipline and builds resilience.",
                t('newDashboard.notableTransits.rahu') || "Rahu's transit destabilizes old patterns - stay grounded.",
                t('newDashboard.notableTransits.ketu') || "Ketu supports letting go and releasing attachments.",
              ]).slice(0, 4).map((item, idx) => (
                <p key={idx} className="border-white/10 text-sm leading-6 text-white/65 md:border-l md:pl-5">
                  <span className="mr-2 text-[#ffc43d]">•</span>
                  {item}
                </p>
              ))}
            </DarkPanel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-1">
            <div className="space-y-5">
              <DarkPanel className="p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-[14px] font-black uppercase tracking-[0.22em]">{t('newDashboard.weeklyChart.title') || "Weekly Chart"}</h2>
                  <p className="text-[12px] font-black uppercase tracking-wider text-[#ffc43d]">{t('newDashboard.weeklyChart.best') || "Best Day"}: {bestDay}</p>
                </div>
                <div className="mb-5 overflow-x-auto">
                  <div className="flex min-w-max gap-2">
                    {AREA_LIST.map((area) => {
                      const theme = AREA_THEMES[area];
                      const Icon = theme.icon;
                      const isLucide = area === "general" || area === "spiritual";
                      const selected = activeArea === area;
                      return (
                        <button
                          key={area}
                          onClick={() => setActiveArea(area)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                            selected
                              ? "border-[#d99b23]/45 bg-[#d99b23]/12 text-[#ffc43d]"
                              : "border-white/10 bg-white/[0.025] text-white/70 hover:border-white/20"
                          }`}
                        >
                          <Icon className={isLucide ? "h-4 w-4 fill-current" : "h-4 w-4 object-cover"} />
                          {resolveAreaLabel(t, area)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="relative min-h-[230px] rounded-2xl overflow-hidden">
                  {isFeatureBlocked('full_daily_horoscope') && getFeaturePaywall('full_daily_horoscope') ? (
                    <PaywallCard paywall={getFeaturePaywall('full_daily_horoscope')!} variant="overlay" />
                  ) : forecastLoading || !forecast ? (
                    <div className="h-[230px] animate-pulse rounded-2xl bg-white/[0.04]" />
                  ) : (
                    <WeeklyOutlookChart days={forecast.days} colorHex={AREA_THEMES[activeArea].hex} />
                  )}
                </div>
              </DarkPanel>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] min-[2560px]:grid-cols-[minmax(0,1fr)_480px]">
                <div className="space-y-5">
                  <DarkPanel className="p-5">
                    <h2 className="mb-4 text-[14px] font-black uppercase tracking-[0.22em]">{t('newDashboard.panchang.title') || "Panchang Today"}</h2>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {[
                        { label: t('newDashboard.panchang.tithi') || "Tithi", value: transits?.panchanga?.tithi || "Purnima", icon: <Moon className="h-4 w-4 text-[#ffc43d]" /> },
                        { label: t('newDashboard.panchang.vara') || "Vara", value: transits?.panchanga?.vara || "Shanivaar", icon: <Calendar className="h-4 w-4 text-[#f59e0b]" /> },
                        { label: t('newDashboard.panchang.nakshatra') || "Nakshatra", value: transits?.panchanga?.nakshatra || "Anuradha", icon: <Star className="h-4 w-4 text-[#34d399]" /> },
                        { label: t('newDashboard.panchang.yoga') || "Yoga", value: transits?.panchanga?.yoga || "Shiva", icon: <Sparkles className="h-4 w-4 text-[#a78bfa]" /> },
                        { label: t('newDashboard.panchang.karana') || "Karana", value: transits?.panchanga?.karana || "Vishti", icon: <Gem className="h-4 w-4 text-[#fb7185]" /> },
                        { label: t('newDashboard.panchang.rahuKaal') || "Rahu Kaal", value: formatRahuKaal(transits), icon: <AlertTriangle className="h-4 w-4 text-[#ffc43d]" /> },
                      ].map((chip) => (
                        <div key={chip.label} className="flex min-h-[82px] flex-col items-center justify-between rounded-xl border border-white/10 bg-white/[0.025] p-2 text-center">
                          {chip.icon}
                          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/45">{chip.label}</p>
                          <p className="w-full truncate font-headline text-[12px] font-bold">{chip.value}</p>
                        </div>
                      ))}
                    </div>
                  </DarkPanel>

                  <DarkPanel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#8b5cf6]/20">
                        <Heart className="h-7 w-7 fill-[#a78bfa]/20 text-[#a78bfa]" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-black uppercase tracking-[0.16em]">{t('newDashboard.compatibility.title') || "Compatibility & Match"}</h3>
                        <p className="mt-1 max-w-lg text-sm leading-6 text-white/58">{t('newDashboard.compatibility.desc') || "Discover your cosmic compatibility with anyone. Find harmony in relationships."}</p>
                      </div>
                    </div>
                    <Link href="/kundli/match" className="rounded-xl bg-[#ffc022] px-5 py-3 text-center text-sm font-black uppercase text-[#08071f]">
                      {t('newDashboard.compatibility.emptyCta') || "Start a Match"}
                    </Link>
                  </DarkPanel>

                  {/* DAILY COSMIC INSIGHT */}
                  <DarkPanel className="p-6">
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Sun className="h-5 w-5 text-[#ffc43d]" />
                        <h3 className="text-[13px] font-black uppercase tracking-[0.24em] text-white">{t('newDashboard.cosmicInsight.title') || "Daily Cosmic Insight"}</h3>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#ffc43d]">
                        {t('horoscope.today') || "Today"} • {horoscope?.meta?.date_display || horoscope?.date_display || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="relative mb-6 px-2 py-3">
                      <span className="absolute -left-2 -top-3 select-none font-serif text-[56px] leading-none text-[#ffc43d]">&ldquo;</span>
                      <p className="relative px-6 text-[13px] leading-relaxed text-white/75">
                        {(typeof horoscope?.tip === 'object' ? horoscope.tip?.text : horoscope?.tip) || "A day to align your actions with your higher purpose. Trust the timing of the universe and take one step forward with clarity."}
                      </p>
                      <span className="absolute -bottom-6 -right-2 select-none font-serif text-[56px] leading-none text-[#ffc43d]">&rdquo;</span>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-3">
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 rounded-2xl border border-white/8 bg-[#0a0a1f] p-3 text-center sm:text-left min-w-0 w-full">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 shadow-[0_0_16px_rgba(168,85,247,0.6)]" />
                        </div>
                        <div className="min-w-0 flex flex-col items-center sm:items-start w-full">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">{t('newDashboard.cosmicInsight.luckyColor') || "Lucky Color"}</p>
                          <p className="font-headline text-[12px] sm:text-sm font-bold text-white mt-0.5 sm:mt-1 truncate max-w-full text-center sm:text-left">
                            {(horoscope?.lucky?.color || horoscope?.lucky_color) ?? "Deep Purple"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 rounded-2xl border border-white/8 bg-[#0a0a1f] p-3 text-center sm:text-left min-w-0 w-full">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#d99b23]/40 bg-[#d99b23]/20 text-lg font-black text-[#ffc43d]">
                          {(horoscope?.lucky?.number || horoscope?.lucky_number) ?? "7"}
                        </div>
                        <div className="min-w-0 flex flex-col items-center sm:items-start w-full">
                          <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">{t('newDashboard.cosmicInsight.luckyNumber') || "Lucky Number"}</p>
                          <p className="font-headline text-[12px] sm:text-sm font-bold text-white mt-0.5 sm:mt-1 truncate max-w-full text-center sm:text-left">
                            {typeof (horoscope?.lucky?.number || horoscope?.lucky_number) === 'number'
                              ? (horoscope?.lucky?.number || horoscope?.lucky_number)
                              : ((horoscope?.lucky?.number || horoscope?.lucky_number) ?? "Seven")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DarkPanel>
                </div>

                <DarkPanel className="hidden sm:block p-5">
                  <div className="mb-4 flex items-start gap-3">
                    <Sparkles className="mt-1 h-7 w-7 text-[#ffc43d]" />
                    <div>
                      <h2 className="font-headline text-2xl font-bold">{t('dashboard.consultNaviAi') || "Consult Navi AI"}</h2>
                      <p className="text-sm text-white/55">{t('dashboard.vedicWisdomPowered') || "Vedic wisdom powered by advanced AI."}</p>
                    </div>
                  </div>

                  <p className="mb-3 text-[12px] font-black uppercase tracking-[0.2em] text-[#ffc43d]">{t('dashboard.askAbout') || "Ask About"}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: t("topicPills.careerFinance") || "Career & Finance", icon: <Briefcase className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                      { label: t("topicPills.loveMarriage") || "Love & Marriage", icon: <Heart className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                      { label: t("topicPills.healthWellness") || "Health & Wellness", icon: <Activity className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                      { label: t("topicPills.travelRelocation") || "Travel & Relocation", icon: <Home className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                      { label: t("topicPills.muhuratTiming") || "Muhurat & Timing", icon: <Calendar className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                      { label: t("topicPills.currentTransits") || "Current Transits", icon: <Orbit className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                    ].map((item) => {
                      const isBlocked = isFeatureBlocked(item.requiresFeature);
                      const paywallData = getFeaturePaywall(item.requiresFeature);

                      return (
                        <button
                          key={item.label}
                          onClick={() => {
                            if (isBlocked && paywallData) {
                              setActivePaywallData(paywallData);
                              return;
                            }
                            askInChat(item.label, `I want guidance about ${item.label.toLowerCase()} based on today's horoscope.`);
                          }}
                          className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-white/78 transition relative overflow-hidden ${
                            isBlocked
                              ? "border border-white/5 bg-white/[0.015] text-white/40 cursor-pointer hover:bg-white/5"
                              : "bg-white/[0.045] hover:bg-[#d99b23]/12 hover:text-[#ffc43d]"
                          }`}
                        >
                          <span className={isBlocked ? "text-white/30" : "text-[#ffc43d]"}>{item.icon}</span>
                          <span className="flex-1 truncate">{item.label}</span>
                          {isBlocked && <Lock className="h-3.5 w-3.5 text-white/35 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mb-3 mt-6 text-[12px] font-black uppercase tracking-[0.2em] text-[#ffc43d]">{t('newDashboard.deepDive.title') || "Deep Dive"}</p>
                  <div className="space-y-3">
                    {[
                      t('newDashboard.deepDive.deepDiveQ1') || "Analyze my weekly forecast in detail",
                      t('newDashboard.deepDive.deepDiveQ2', { area: activeAreaLabel }) || `Why is my ${activeAreaLabel} score at its current level?`,
                      t('newDashboard.deepDive.deepDiveQ3') || "Give me a quick action to improve my score",
                    ].map((question) => {
                      const isBlocked = isFeatureBlocked('chat_message');
                      const paywallData = getFeaturePaywall('chat_message');

                      return (
                        <button
                          key={question}
                          onClick={() => {
                            if (isBlocked && paywallData) {
                              setActivePaywallData(paywallData);
                              return;
                            }
                            askInChat(t('newDashboard.deepDive.title') || "Deep Dive", question);
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                            isBlocked
                              ? "border-white/5 bg-white/[0.01] text-white/40 cursor-pointer"
                              : "border-white/10 bg-white/[0.025] text-white/78 hover:border-[#d99b23]/35 hover:text-[#ffc43d]"
                          }`}
                        >
                          <span className="truncate flex-1">{question}</span>
                          {isBlocked ? (
                            <Lock className="h-3.5 w-3.5 text-white/30 shrink-0" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-[#ffc43d] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      if (isFeatureBlocked('chat_message') && getFeaturePaywall('chat_message')) {
                        setActivePaywallData(getFeaturePaywall('chat_message')!);
                        return;
                      }
                      setSelectedAvatarId("navi");
                      askInChat(t('chatWithNavi') || "Chat with Navi", t('newDashboard.todaysEnergy.discussMsg') || "I want to discuss my dashboard and today's horoscope.");
                    }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d99b23]/60 px-4 py-3 text-sm font-black uppercase tracking-wider text-[#ffc43d] transition hover:bg-[#d99b23]/10"
                  >
                    {isFeatureBlocked('chat_message') ? <Lock className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    {t('chatWithNavi') || "Chat with Navi"}
                  </button>
                </DarkPanel>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXPLORE YOUR COSMIC NETWORK SECTION */}
      <div className="relative z-10 mx-auto max-w-[1760px] px-5 py-12 sm:px-8 lg:px-10 2xl:max-w-[2100px] min-[2560px]:max-w-[94%]">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-[#ffc43d]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#ffc43d]">{t('newDashboard.guidanceHub') || "Your Guidance Hub"}</span>
          </div>
          <h2 className="font-headline text-[32px] font-bold leading-tight tracking-tight text-white sm:text-[42px]">
            {t('newDashboard.exploreCosmicNetwork') || "Explore Your Cosmic Network"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/55">
            {t('newDashboard.cosmicNetworkDesc') || "Connect with expert guides, explore your chart, understand your bonds, and access powerful astrological tools."}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            {/* MEET YOUR AI ASTROLOGERS */}
            <DarkPanel className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <div className="h-2 w-2 rotate-45 border border-[#ffc43d] bg-[#ffc43d]/20" />
                  </div>
                  <h3 className="text-[13px] font-black uppercase tracking-[0.24em] text-white">{t('newDashboard.meetYourAiAstrologers') || "Meet Your AI Astrologers"}</h3>
                </div>
                <Link href="/chat" className="text-[11px] font-bold uppercase tracking-wider text-[#ffc43d] hover:text-[#e6ad2f]">
                  {t('newDashboard.lifeAreas.viewAll') || "View All"} <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { name: "Navi", role: t('newDashboard.guides.navi.role') || "General Vedic Guide", desc: t('newDashboard.guides.navi.desc') || "Balanced Vedic guidance for love, work, timing & life.", credits: 1, avatarId: "navi", img: "/images/avatars/NAVI_AVATAR.jpeg" },
                  { name: "Arya", role: t('newDashboard.guides.arya.role') || "Career Mentor", desc: t('newDashboard.guides.arya.desc') || "Guidance for jobs, skills, promotion & work decisions.", credits: 2, avatarId: "career_mentor", img: "/images/avatars/ARYA_AVATAR.jpeg" },
                  { name: "Meera", role: t('newDashboard.guides.meera.role') || "Relationship Guide", desc: t('newDashboard.guides.meera.desc') || "Insights for love, marriage, compatibility & emotions.", credits: 2, avatarId: "relationship_guide", img: "/images/avatars/MEERA_AVATAR.jpeg" },
                  { name: "Anand", role: t('newDashboard.guides.anand.role') || "Health Advisor", desc: t('newDashboard.guides.anand.desc') || "Understand vitality, well-being & health patterns.", credits: 2, avatarId: "spiritual_guide", img: "/images/avatars/ANAND_AVATAR.jpeg" },
                  { name: "Vidya", role: t('newDashboard.guides.vidya.role') || "Financial Astrologer", desc: t('newDashboard.guides.vidya.desc') || "Wealth, investments & financial stability insights.", credits: 2, avatarId: "finance_mentor", img: "/images/avatars/VIDYA_AVATAR.jpeg" },
                  { name: "Rishi", role: t('newDashboard.guides.rishi.role') || "Deep Chart Sage", desc: t('newDashboard.guides.rishi.desc') || "Advanced chart synthesis for deep spiritual insights.", credits: 3, avatarId: "astro_sage", img: "/images/avatars/RISHI_AVATAR.jpeg" },
                ].map((guide) => {
                  const isLocked = isFeatureBlocked('chat_message');
                  const paywallData = getFeaturePaywall('chat_message');

                  return (
                    <div key={guide.name} className={`group flex flex-col items-center text-center ${isLocked ? 'opacity-60' : ''}`}>
                      <div className="relative mb-4">
                        <div className={`h-[92px] w-[92px] overflow-hidden rounded-full border-[3px] bg-[#0a0829] transition-all ${
                          isLocked
                            ? 'border-white/20'
                            : 'border-[#d99b23]/50 group-hover:border-[#d99b23]/80 group-hover:shadow-[0_0_28px_rgba(217,155,35,0.4)]'
                        }`}>
                          <Image
                            src={guide.img}
                            alt={guide.name}
                            width={92}
                            height={92}
                            className="h-full w-full object-cover"
                          />
                          {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                              <Lock className="h-6 w-6 text-white/80" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-[#d99b23]/40 bg-[#0a0a1f] px-2.5 py-1 text-[9px] font-bold text-[#ffc43d] shadow-lg">
                          <Coins className="h-2.5 w-2.5" />
                          {guide.credits} {guide.credits > 1 ? (t('dashboard.creditPlural') || 'credits') : (t('dashboard.creditSingular') || 'credit')}
                        </div>
                      </div>
                      <h4 className="mb-1 mt-1 font-headline text-base font-bold text-white">{guide.name}</h4>
                      <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.15em] text-white/40">{guide.role}</p>
                      <p className="mb-3 line-clamp-2 min-h-[32px] text-[10.5px] leading-relaxed text-white/45">{guide.desc}</p>
                      <button
                        onClick={() => {
                          if (isLocked && paywallData) {
                            setActivePaywallData(paywallData);
                            return;
                          }
                          setSelectedAvatarId(guide.avatarId);
                          askInChat(t('chatWithNavi') || `Chat with ${guide.name}`, `I want to consult with ${guide.name} about my chart.`);
                        }}
                        className={`flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                          isLocked
                            ? 'border-white/20 bg-transparent text-white/50 cursor-pointer hover:bg-white/5'
                            : 'border-[#d99b23]/50 bg-transparent text-[#ffc43d] hover:border-[#d99b23]/70 hover:bg-[#d99b23]/10'
                        }`}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="h-3 w-3" />
                            {t('newDashboard.guides.locked') || "Locked"}
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-3 w-3" />
                            {t('dashboard.startChat') || "Start Chat"}
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </DarkPanel>

            {/* MY FAMILY & BONDS */}
            <DarkPanel className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-[#fb7185]" />
                  <h3 className="text-[13px] font-black uppercase tracking-[0.24em] text-white">{t('newDashboard.familyFriends.title') || "Family & Friends"}</h3>
                </div>
                <Link href="/family" className="text-[11px] font-bold uppercase tracking-wider text-[#ffc43d] hover:text-[#e6ad2f]">
                  {t('newDashboard.lifeAreas.viewAll') || "View All"} <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Example family members */}
                <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#0a0a1f] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d99b23]/20 text-xl font-bold text-[#ffc43d]">
                      C
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-headline text-sm font-bold text-white">Chandrakant</h4>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{t('newDashboard.familyFriends.relationshipSibling') || "Sibling"}</p>
                    </div>
                  </div>
                  <span className="inline-block self-start rounded-md bg-[#ffb400]/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#ffb400]">
                    {t('dashboard.familyStatusNeedsAttention') || "Needs Attention"}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/family" className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/60 transition-all hover:border-[#d99b23]/30 hover:text-[#ffc43d]">
                      {t('dashboard.familyViewBond') || "View Bond"}
                    </Link>
                    <button
                      onClick={() => {
                        if (isFeatureBlocked('family_compatibility') && getFeaturePaywall('family_compatibility')) {
                          setActivePaywallData(getFeaturePaywall('family_compatibility')!);
                          return;
                        }
                        router.push('/kundli/match');
                      }}
                      className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/60 transition-all hover:border-[#d99b23]/30 hover:text-[#ffc43d]"
                    >
                      {isFeatureBlocked('family_compatibility') ? <Lock className="inline h-3 w-3 mr-1 shrink-0" /> : null}
                      {t('dashboard.familyRunCompatibility') || "Run Compatibility"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#0a0a1f] p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#34d399]/20 text-xl font-bold text-[#34d399]">
                      A
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-headline text-sm font-bold text-white">Ankit Prasad</h4>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{t('newDashboard.familyFriends.relationshipFriend') || "Friend"}</p>
                    </div>
                  </div>
                  <span className="inline-block self-start rounded-md bg-[#34d399]/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#34d399]">
                    {t('newDashboard.linked') || "✓ Linked"}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <Link href="/family" className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/60 transition-all hover:border-[#d99b23]/30 hover:text-[#ffc43d]">
                      {t('dashboard.familyViewBond') || "View Bond"}
                    </Link>
                    <button
                      onClick={() => {
                        if (isFeatureBlocked('family_compatibility') && getFeaturePaywall('family_compatibility')) {
                          setActivePaywallData(getFeaturePaywall('family_compatibility')!);
                          return;
                        }
                        router.push('/kundli/match');
                      }}
                      className="rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/60 transition-all hover:border-[#d99b23]/30 hover:text-[#ffc43d]"
                    >
                      {isFeatureBlocked('family_compatibility') ? <Lock className="inline h-3 w-3 mr-1 shrink-0" /> : null}
                      {t('dashboard.familyRunCompatibility') || "Run Compatibility"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#d99b23]/30 bg-[#d99b23]/5 p-4 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#d99b23]/40 text-[#ffc43d]">
                    <Users className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-bold text-white">{t('newDashboard.familyFriends.addMember') || "Add Member"}</p>
                    <p className="text-[10px] leading-relaxed text-white/40">{t('dashboard.familyAddSubtitle') || "Add family or friends to compare charts"}</p>
                  </div>
                  <button className="flex items-center gap-1.5 rounded-xl border-2 border-[#d99b23]/50 bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#ffc43d] transition-all hover:border-[#d99b23]/70 hover:bg-[#d99b23]/10">
                    <Users className="h-3 w-3" />
                    {t('newDashboard.familyFriends.addMember') || "Add Member"}
                  </button>
                </div>
              </div>
            </DarkPanel>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-8">
            {/* MY CHART SNAPSHOT */}
            <DarkPanel className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <Orbit className="h-5 w-5 text-[#60a5fa]" />
                  </div>
                  <h3 className="text-[13px] font-black uppercase tracking-[0.24em] text-white">{t('newDashboard.chartSnapshot') || "My Chart Snapshot"}</h3>
                </div>
                <Link href="/kundli" className="text-[11px] font-bold uppercase tracking-wider text-[#ffc43d] hover:text-[#e6ad2f]">
                  {t('newDashboard.myChart.viewDetails') || "View Details"} <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { label: t('newDashboard.myChart.yourKundli') || "Kundli", sublabel: `${ascendantSign?.name || "Leo"} ${t('dashboard.ascendant') || "Ascendant"}`, icon: <Orbit className="h-4 w-4" />, href: "/kundli", color: "#60a5fa" },
                  { label: t('newDashboard.myChart.mahadasha') || "Mahadasha", sublabel: "Rahu", subtext: "May 2026 — May 2044", icon: <Activity className="h-4 w-4" />, href: "/kundli", color: "#fbbf24", requiresFeature: 'kundli_premium' as PaywallFeatureKey },
                  { label: t('newDashboard.myChart.antardasha') || "Antardasha", sublabel: "Rahu", subtext: "May 2026 — Jan 2028", icon: <Sparkles className="h-4 w-4" />, href: "/kundli", color: "#a78bfa", requiresFeature: 'kundli_premium' as PaywallFeatureKey },
                ].map((item, idx) => {
                  const isBlocked = item.requiresFeature ? isFeatureBlocked(item.requiresFeature) : false;
                  const paywallData = item.requiresFeature ? getFeaturePaywall(item.requiresFeature) : null;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (isBlocked && paywallData) {
                          setActivePaywallData(paywallData);
                          return;
                        }
                        router.push(item.href);
                      }}
                      className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0a0a1f] p-4 transition-all hover:border-[#d99b23]/30 hover:bg-[#0f0d2a] cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                          style={{ backgroundColor: `${item.color}1f`, color: item.color }}
                        >
                          {item.icon}
                        </div>
                        <div className={isBlocked ? "blur-[2.5px] select-none opacity-50 transition-all duration-300" : ""}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">{item.label}</p>
                          <p className="font-headline text-sm font-bold text-white">{item.sublabel}</p>
                          {item.subtext && <p className="text-[10px] text-white/35">{item.subtext}</p>}
                        </div>
                      </div>
                      <button className="flex items-center gap-1 rounded-xl border border-[#d99b23]/40 bg-[#d99b23]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ffc43d] shrink-0">
                        {isBlocked ? <Lock className="h-3 w-3 mr-0.5" /> : null}
                        {isBlocked ? (t('newDashboard.unlock') || 'Unlock') : (t('newDashboard.view') || 'View')} <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/kundli"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#d99b23]/50 bg-[#d99b23]/10 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#ffc43d] transition-all hover:border-[#d99b23]/70 hover:bg-[#d99b23]/15"
              >
                <Sparkles className="h-4 w-4" />
                {t('newDashboard.myChart.exploreFullAnalysis') || "Explore Full Analysis"}
              </Link>
            </DarkPanel>


          </div>
        </div>

        {/* COSMIC PORTALS — Full Width */}
        <DarkPanel className="mt-8 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center">
                <div className="h-2 w-2 rotate-45 border border-[#ffc43d] bg-[#ffc43d]/20" />
              </div>
              <h3 className="text-[13px] font-black uppercase tracking-[0.24em] text-white">{t('dashboard.cosmicPortals') || "Cosmic Portals"}</h3>
            </div>
            <Link href="/chat" className="text-[11px] font-bold uppercase tracking-wider text-[#ffc43d] hover:text-[#e6ad2f]">
              {t('newDashboard.exploreAllPortals') || "Explore All Portals"} <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { icon: <MessageSquare className="h-5 w-5" />, title: t('dashboard.consultNaviAi') || "Chat with Navi", desc: t('newDashboard.portalChatDesc') || "Ask anything about your Kundli, Dashas, transits, or life guidance.", action: t('dashboard.consultAi') || "Consult AI", href: "/chat", color: "#ffc43d", requiresFeature: 'chat_message' as PaywallFeatureKey },
              { icon: <Globe className="h-5 w-5" />, title: t('dashboard.janamKundli') || "Janam Kundli", desc: t('dashboard.janamKundliDesc') || "Detailed birth chart & planetary analysis based on Vedic wisdom.", action: t('dashboard.openChart') || "Open Chart", href: "/kundli", color: "#60a5fa", requiresFeature: 'kundli_premium' as PaywallFeatureKey },
              { icon: <Heart className="h-5 w-5" />, title: t('dashboard.soulmateSync') || "Soulmate Sync", desc: t('newDashboard.portalSoulmateDesc') || "Match compatibility using Guna Milan & karmic insights.", action: t('dashboard.analyzeMatch') || "Analyze Match", href: "/kundli/match", color: "#fb7185", requiresFeature: 'match_report' as PaywallFeatureKey },
              { icon: <Sun className="h-5 w-5" />, title: t('dashboard.dailyPulse') || "Daily Pulse", desc: t('newDashboard.portalPulseDesc') || "Real-time Tithi, Yoga & Vedic energies for your day.", action: t('newDashboard.viewToday') || "View Today", href: "/horoscope/forecast", color: "#34d399", requiresFeature: 'full_daily_horoscope' as PaywallFeatureKey },
              { icon: <Orbit className="h-5 w-5" />, title: t('newDashboard.rashiLibrary') || "Rashi Library", desc: t('newDashboard.portalRashiDesc') || "Explore all 12 zodiac signs with detailed traits & insights.", action: t('dashboard.openLibrary') || "Open Library", href: "/rashis", color: "#a78bfa" },
              { icon: <Sparkles className="h-5 w-5" />, title: t('dashboard.sessions') || "Sessions", desc: t('newDashboard.portalSessionsDesc') || "Join live sessions & interact with experts and seekers.", action: t('dashboard.joinSession') || "Join Session", href: "/consult", color: "#f59e0b", requiresFeature: 'guided_consult' as PaywallFeatureKey },
            ].map((portal, idx) => {
              const isLocked = portal.requiresFeature ? isFeatureBlocked(portal.requiresFeature) : false;
              const paywallData = portal.requiresFeature ? getFeaturePaywall(portal.requiresFeature) : null;
              const showProBadge = portal.requiresFeature && isLocked && paywallData?.isSoft;
              const showCreditBadge = portal.requiresFeature && isLocked && !paywallData?.isSoft;

              return (
                <div
                  key={idx}
                  onClick={(e) => {
                    if (isLocked && paywallData) {
                      e.preventDefault();
                      setActivePaywallData(paywallData);
                    } else {
                      router.push(portal.href);
                    }
                  }}
                  className={`group relative flex flex-col gap-3 rounded-2xl border border-white/8 bg-[#0a0a1f] p-5 transition-all cursor-pointer ${
                    isLocked ? 'opacity-60 hover:border-white/10' : 'hover:-translate-y-0.5 hover:border-[#d99b23]/30 hover:bg-[#0f0d2a]'
                  }`}
                >
                  {/* Pro Badge */}
                  {showProBadge && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-[#ffc43d] to-[#f59e0b] px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#0a0a1f]">
                      <Zap className="h-2.5 w-2.5" />
                      Pro
                    </div>
                  )}

                  {/* Credit Badge */}
                  {showCreditBadge && paywallData?.creditsRequired && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-[#d99b23]/40 bg-[#d99b23]/15 px-2 py-0.5 text-[8px] font-bold text-[#ffc43d]">
                      <Coins className="h-2.5 w-2.5" />
                      {paywallData.creditsRequired}
                    </div>
                  )}

                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl border"
                    style={{ backgroundColor: `${portal.color}1f`, borderColor: `${portal.color}33`, color: portal.color }}
                  >
                    {portal.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1.5 font-headline text-base font-bold text-white">{portal.title}</h4>
                    <p className="line-clamp-3 text-[11px] leading-relaxed text-white/45">{portal.desc}</p>
                  </div>
                  <button
                    className={`mt-auto flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all`}
                    style={{ borderColor: `${portal.color}50`, backgroundColor: 'transparent', color: portal.color }}
                  >
                    {isLocked && <Lock className="h-3 w-3 mr-1 shrink-0" />}
                    {isLocked ? (t('newDashboard.unlock') || 'Unlock') : portal.action} <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </DarkPanel>

        {/* Privacy Footer */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-center text-[11px] text-white/30">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>{t('newDashboard.privacy.protected') || "Your data is private and protected."}</span>
          </div>
          <span>•</span>
          <span>{t('newDashboard.privacy.secure') || "Secure"}</span>
          <span>•</span>
          <span>{t('newDashboard.privacy.encrypted') || "Encrypted"}</span>
          <span>•</span>
          <span>{t('newDashboard.privacy.trusted') || "Trusted by thousands"}</span>
        </div>
      </div>

      <AnimatePresence>
        {pendingPrompt && (
          <motion.div
            className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPendingPrompt(null)}
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 18, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-[28px] border border-[#d99b23]/30 bg-[#090826] p-6 shadow-2xl"
            >
              <button
                onClick={() => setPendingPrompt(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-white/70 hover:bg-white/12"
                aria-label="Close chat confirmation"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#d99b23]/30 bg-[#d99b23]/10 text-[#ffc43d]">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h2 className="font-headline text-2xl font-bold">{t('newDashboard.todaysEnergy.askNaviInChat') || "Ask Navi in chat?"}</h2>
              <p className="mt-2 text-sm leading-6 text-white/60">{t('newDashboard.todaysEnergy.askNaviConfirmDesc') || "Navi will open chat with this question so you can continue from there."}</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffc43d]">{pendingPrompt.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/82">{pendingPrompt.message}</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button onClick={() => setPendingPrompt(null)} className="rounded-2xl border border-white/12 px-4 py-3 text-sm font-bold text-white/75 hover:bg-white/8">
                  {t('newDashboard.todaysEnergy.stayHere') || "Stay here"}
                </button>
                <button onClick={confirmChat} className="rounded-2xl bg-[#ffc022] px-4 py-3 text-sm font-black text-[#08071f]">
                  {t('newDashboard.todaysEnergy.openChat') || "Open chat"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
