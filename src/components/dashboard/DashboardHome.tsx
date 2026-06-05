"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { AREA_LIST, AREA_THEMES, ForecastArea } from "@/data/areaThemes";
import type { ForecastDay } from "@/components/dashboard/MiniChart";
import Particles from "@/components/ui/Particles";
import { catmullRomToBezier, catmullRomArea } from "@/utils/chartCurve";
import type { HoroscopeData } from "@/types/horoscope";
import {
  useFamilyMembers,
  useFamilyConnections,
  useFamilyCompatibilityPreflight,
  useFamilyReports,
  useFamilyCompatibility,
} from "@/hooks/useFamily";
import { parseKundliStats } from "@/lib/kundliStats";
import { computeFamilyMemberStatus, bandPalette } from "@/lib/familyStatus";
import type { FamilyMember, FamilyConnection, FamilyCompatibilityBand } from "@/types/family";

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
  if (score >= 75) return "var(--flare-gold)";
  if (score >= 60) return "var(--secondary)";
  return "var(--outline-variant)";
}

function RingScore({ score, size = 132, color }: { score: number; size?: number; color: string }) {
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg role="img" aria-label={`Overall score: ${score} out of 100`} className="h-full w-full -rotate-90" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={radius} fill="none" stroke="var(--outline-variant)" strokeOpacity="0.08" strokeWidth="8" />
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
        <span className="text-[42px] 3xl:text-[54px] font-black leading-none tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="mt-1 text-sm font-semibold text-foreground/70">/100</span>
      </div>
    </div>
  );
}

function WeeklyOutlookChart({ days, colorHex, areaLabel }: { days: ForecastDay[]; colorHex: string; areaLabel: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        if (width > 0) {
          setW(width);
        }
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

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
    <div ref={containerRef} className="w-full">
      {/* Visually hidden text alternative for screen readers (WCAG 1.1.1) */}
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

      <svg
        aria-hidden="true"
        viewBox={`0 0 ${W} ${H}`}
        className="h-[230px] w-full"
      >
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
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--outline-variant)" strokeOpacity="0.08" strokeWidth="1" />
              <text x={PAD.left - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="var(--on-surface-variant)" opacity="0.4">{v}</text>
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
              <circle cx={p.x} cy={p.y} r={isToday ? 4 : 3} fill={isToday ? colorHex : "var(--surface)"} stroke={colorHex} strokeWidth="2" />
              <text x={p.x} y={p.y - 11} textAnchor="middle" fontSize="11" fontWeight={isToday ? 700 : 600} fill={isToday ? colorHex : "var(--foreground)"} opacity={isToday ? undefined : 0.7}>
                {d.score}
              </text>
              <text x={p.x} y={H - 24} textAnchor="middle" fontSize="9.5" fontWeight={700} letterSpacing="0.5" fill={isToday ? colorHex : "var(--on-surface-variant)"} opacity={isToday ? undefined : 0.45}>
                {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
              </text>
              <text x={p.x} y={H - 11} textAnchor="middle" fontSize="11" fontWeight={600} fill={isToday ? colorHex : "var(--foreground)"} opacity={isToday ? undefined : 0.6}>
                {date.getDate()}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
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

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
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

function DarkPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`dark-glass rounded-[22px] shadow-[var(--card-shadow)] ${className}`}>
      {children}
    </section>
  );
}

const formatRelationship = (rel?: string | null): string =>
  rel ? rel.charAt(0).toUpperCase() + rel.slice(1) : "";

const initialOf = (name?: string | null): string => {
  const trimmed = (name ?? "").trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
};

interface FamilyCardActionProps {
  t: (key: string) => string;
  onRunCompatibility: () => void;
  isCompatibilityBlocked: boolean;
}

/** Dashboard family-member card backed by real member data + compatibility status. */
function DashboardFamilyMemberCard({ member, t, onRunCompatibility, isCompatibilityBlocked }: { member: FamilyMember } & FamilyCardActionProps) {
  const { data: preflight } = useFamilyCompatibilityPreflight(member.id);
  const { data: reports } = useFamilyReports(member.id);
  const { data: compat } = useFamilyCompatibility(member.id);

  const status = computeFamilyMemberStatus({
    member,
    preflight,
    reports,
    band: (compat?.band as FamilyCompatibilityBand | undefined) ?? null,
  });

  const hasScore = typeof compat?.score === "number";
  const scorePct = hasScore ? Math.max(0, Math.min(100, Math.round(compat!.score))) : null;
  const scorePalette = bandPalette(compat?.band ?? "");

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/8 bg-surface p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary/20 text-xl font-bold text-secondary">
          {initialOf(member.name)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-headline text-sm font-bold text-foreground">{member.name || "—"}</h4>
          <p className="label-sm text-[10px] tracking-wider text-foreground/35">{formatRelationship(member.relationshipType)}</p>
        </div>
        {scorePct !== null && (
          <div className="shrink-0 text-right">
            <span className={`font-headline text-lg font-bold tabular-nums leading-none ${scorePalette.text}`}>
              {scorePct}
              <span className="ml-0.5 text-[10px] font-body text-foreground/40">%</span>
            </span>
          </div>
        )}
      </div>
      {status && (
        <span className={`inline-block self-start rounded-md border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${status.classes}`}>
          {t(status.labelKey)}
        </span>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Link href={`/family?member=${member.id}`} className="rounded-lg border border-outline-variant/10 bg-surface-variant/[0.02] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-foreground/60 transition-all hover:border-secondary/30 hover:text-secondary">
          {t('dashboard.familyViewBond')}
        </Link>
        <button
          onClick={onRunCompatibility}
          className="rounded-lg border border-outline-variant/10 bg-surface-variant/[0.02] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-foreground/60 transition-all hover:border-secondary/30 hover:text-secondary"
        >
          {isCompatibilityBlocked ? <Lock className="inline h-3 w-3 mr-1 shrink-0" /> : null}
          {t('dashboard.familyRunCompatibility')}
        </button>
      </div>
    </div>
  );
}

/** Dashboard card for a linked connection (another user who shares with you). */
function DashboardConnectionCard({ connection, t, onRunCompatibility, isCompatibilityBlocked }: { connection: FamilyConnection } & FamilyCardActionProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-outline-variant/8 bg-surface p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-xl font-bold text-emerald-400">
          {initialOf(connection.otherName)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-headline text-sm font-bold text-foreground">{connection.otherName || "—"}</h4>
          <p className="label-sm text-[10px] tracking-wider text-foreground/35">{formatRelationship(connection.iSeeThemAs)}</p>
        </div>
      </div>
      <span className="inline-block self-start rounded-md bg-emerald-400/15 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-400">
        {t('newDashboard.linked')}
      </span>
      <div className="grid grid-cols-2 gap-2">
        <Link href="/family" className="rounded-lg border border-outline-variant/10 bg-surface-variant/[0.02] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-foreground/60 transition-all hover:border-secondary/30 hover:text-secondary">
          {t('dashboard.familyViewBond')}
        </Link>
        <button
          onClick={onRunCompatibility}
          className="rounded-lg border border-outline-variant/10 bg-surface-variant/[0.02] px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-foreground/60 transition-all hover:border-secondary/30 hover:text-secondary"
        >
          {isCompatibilityBlocked ? <Lock className="inline h-3 w-3 mr-1 shrink-0" /> : null}
          {t('dashboard.familyRunCompatibility')}
        </button>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const greeting = t(useGreeting());
  const { user, refreshProfile, isLoading: userLoading } = useAuth();
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

  useEffect(() => {
    if (userLoading || !user?.email || hasAnalyzedRef.current === user.email) return;

    // NOTE: incomplete-profile → onboarding redirect now lives in the global
    // <OnboardingGate /> (mounted in the root layout) so it fires on every
    // landing route, not just the dashboard. This effect only handles the
    // astrology auto-analysis below.

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
  // Only the *initial* fetch (no data yet) should show skeletons. Once the
  // request settles we render real scores, or the graceful fallback numbers if
  // the backend returned nothing — never the fabricated 73/70 *during* loading
  // (that placeholder-then-real swap is the "wrong data then correct" flash).
  const scoreLoading = horoscopeLoading && !horoscope;
  const scoreBand = overallScore >= 75
    ? t('newDashboard.todaysEnergy.bandFavorable')
    : overallScore >= 60
      ? t('newDashboard.todaysEnergy.bandBalanced')
      : t('newDashboard.todaysEnergy.bandCaution');
  const moonSign = getRashiData(user?.moonSign || horoscope?.user?.sign || horoscope?.sign || "Leo");
  const sunSign = getRashiData(user?.sunSign || "Libra");
  const ascendantSign = getRashiData(user?.lagnaSign || "Leo");

  // Real family + chart data (replaces the previously-hardcoded placeholders).
  const { data: familyMembers, isLoading: familyLoading } = useFamilyMembers();
  const { data: familyConnections, isLoading: connectionsLoading } = useFamilyConnections();
  const kundliStats = useMemo(() => parseKundliStats(user?.astrologyData), [user?.astrologyData]);

  // Format a dasha period like "May 2026 — May 2044" from ISO/loose date strings.
  const formatDashaRange = useCallback(
    (start?: string, end?: string): string | undefined => {
      const fmt = (d?: string) => {
        if (!d) return null;
        const parsed = new Date(d.length <= 10 ? `${d}T00:00:00` : d);
        if (Number.isNaN(parsed.getTime())) return null;
        return parsed.toLocaleDateString(LOCALE_BY_LANGUAGE[language] || "en-IN", { month: "short", year: "numeric" });
      };
      const s = fmt(start);
      const e = fmt(end);
      if (s && e) return `${s} — ${e}`;
      return s || e || undefined;
    },
    [language]
  );

  const mahadashaSub = kundliStats?.mahaPlanet;
  const mahadashaRange = formatDashaRange(kundliStats?.mahaStart, kundliStats?.mahaEnd);
  const antardashaSub = kundliStats?.antaPlanet;
  const antardashaRange = formatDashaRange(kundliStats?.antaStart, kundliStats?.antaEnd);

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
      ? t('newDashboard.todaysEnergy.defaultHeadline')
      : rawHeadline;

  const rawSubtitle =
    (typeof horoscope?.tip === "string"
      ? horoscope.tip
      : horoscope?.tip?.text) ||
    "This is a powerful window to build momentum, make thoughtful moves, and align with your greater purpose.";
  const subtitle =
    rawSubtitle === "This is a powerful window to build momentum, make thoughtful moves, and align with your greater purpose."
      ? t('newDashboard.todaysEnergy.defaultSubtitle')
      : rawSubtitle;

  if (profileLocationRequired && !horoscope) {
    return (
      <div className="min-h-[calc(100dvh-var(--navbar-height,64px)-100px)] bg-background px-4 py-10 text-foreground">
        <DarkPanel className="mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10">
            <ShieldAlert className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="font-headline text-2xl font-bold">Exact birth location required</h1>
          <p className="mt-3 text-sm leading-6 text-foreground/60">
            Please confirm your exact birth location and timezone in your profile for personalized horoscope calculations.
          </p>
          <button
            onClick={() => router.push("/profile?onboarding=true&return=/")}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-5 py-3 text-sm font-black uppercase tracking-wider text-on-primary"
          >
            Confirm birth location <ArrowRight className="h-4 w-4" />
          </button>
        </DarkPanel>
      </div>
    );
  }

  return (
    <div className="gpt-dashboard-shell safe-bottom-buffer relative min-h-[calc(100dvh-var(--navbar-height,64px)-100px)] overflow-x-hidden bg-background text-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,color-mix(in_srgb,var(--secondary)_38%,transparent),transparent_28%),radial-gradient(circle_at_88%_12%,color-mix(in_srgb,var(--accent)_38%,transparent),transparent_34%),linear-gradient(180deg,var(--surface)_0%,var(--background)_48%,var(--surface)_100%)]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-80">
        <Particles
          particleCount={260}
          particleColors={["var(--flare-gold)", "var(--foreground)", "var(--flare-lavender)"]}
          particleBaseSize={70}
          particleSpread={11}
          speed={0.08}
          alphaParticles
          disableRotation={false}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1760px] px-5 py-6 sm:px-8 lg:px-10 2xl:max-w-[2100px] 3xl:max-w-[2400px]">
        <header className="mb-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3 label-sm tracking-[0.24em] text-foreground/58">
              <span aria-hidden="true" className="h-px w-12 bg-secondary/50" />
              <span>{currentDate}</span>
              {paywallLoaded && (
                <Link href="/plans" className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5 tracking-normal text-secondary">
                  <Wallet className="h-3.5 w-3.5" />
                  <span className="text-sm font-black">{totalCredits ?? 0}</span>
                  <span className="text-[10px] uppercase text-foreground/40">{t('plans.naviCredits')}</span>
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] uppercase text-secondary">{getTierLabel(tier || "free")}</span>
                </Link>
              )}
            </div>
            <h1 className="mt-4 font-headline text-[30px] font-bold leading-tight tracking-tight sm:text-[42px] 3xl:text-[56px]">
              {greeting},{" "}
              <span className="bg-gradient-to-r from-[var(--flare-gold)] via-secondary to-[var(--secondary)] bg-clip-text text-transparent">
                {userLoading ? "..." : userName}
              </span>
            </h1>
            {scoreLoading ? (
              <div className="mt-2 h-5 w-64 animate-pulse rounded bg-surface-variant/[0.06]" />
            ) : topLifeArea && (
              <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Star className="h-4 w-4 fill-secondary text-secondary" />
                {t('newDashboard.todaysEnergy.scoreImpressive', { label: topLifeArea.label })} <span className="font-black text-emerald-400">{topLifeArea.score}%</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: t('dashboard.moonSign'), data: moonSign, fallback: "Leo" },
              { label: t('dashboard.sunSign'), data: sunSign, fallback: "Libra" },
              { label: t('dashboard.ascendant'), data: ascendantSign, fallback: "Leo" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.data?.id ? `/rashis?sign=${item.data.id}` : "/rashis"}
                aria-label={`${item.label}: ${item.data?.name || item.fallback}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-outline-variant/12 bg-surface-variant/[0.035] px-2 py-3 text-center transition hover:border-secondary/40 hover:bg-secondary/8 sm:min-w-[185px] sm:flex-row sm:gap-4 sm:px-4 sm:text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-secondary/25 bg-background sm:h-[58px] sm:w-[58px]">
                  {item.data?.icon ? (
                    <Image src={item.data.icon} alt={item.data.name} width={34} height={34} className="h-7 w-7 object-contain sm:h-9 sm:w-9" />
                  ) : (
                    <Sparkles className="h-5 w-5 text-secondary sm:h-6 sm:w-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-foreground/55 sm:text-[11px] sm:tracking-[0.22em]">{item.label}</p>
                  <p className="mt-0.5 truncate font-headline text-sm font-bold text-foreground sm:mt-1 sm:text-lg">{item.data?.name || item.fallback}</p>
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
                  <p className="label-secondary font-black tracking-[0.2em]">{t('newDashboard.todaysEnergy.title')}</p>
                  {scoreLoading ? (
                    <>
                      <div className="mt-5 h-[132px] w-[132px] shrink-0 animate-pulse rounded-full bg-surface-variant/[0.06]" />
                      <div className="mt-4 h-7 w-28 animate-pulse rounded-full bg-surface-variant/[0.06]" />
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                <div>
                  <h2 className="font-headline text-2xl font-bold leading-snug sm:text-[28px] 3xl:text-[38px]">{headline}</h2>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-foreground/62">{subtitle}</p>
                </div>

                <div className="hidden justify-center lg:flex">
                  <Image src="/images/lotus.svg" alt="" width={180} height={130} className="drop-shadow-[0_0_30px_rgba(168,85,247,0.45)]" />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {[
                  { label: moonSign?.name || "Leo", icon: <Orbit className="h-4 w-4" /> },
                  { label: `${ascendantSign?.name || "Leo"} ${t('newDashboard.todaysEnergy.rising')}`, icon: <Moon className="h-4 w-4" /> },
                  { label: transits?.panchanga?.tithi || "Purnima", prefix: t('newDashboard.panchang.tithi') },
                  { label: transits?.panchanga?.nakshatra || "Anuradha", prefix: t('newDashboard.panchang.nakshatra') },
                ].map((chip) => (
                  <div key={`${chip.prefix || chip.label}-${chip.label}`} className="inline-flex items-center gap-2 rounded-full bg-surface-variant/70 px-4 py-2 text-sm font-bold text-foreground">
                    {"icon" in chip && chip.icon}
                    {"prefix" in chip && <span className="text-[11px] uppercase tracking-[0.18em] text-foreground/45">{chip.prefix}</span>}
                    <span>{chip.label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-outline-variant/10 bg-surface-variant/[0.035] p-5">
                  <div className="flex items-start gap-4">
                    <Sun className="h-8 w-8 shrink-0 text-emerald-400" />
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-emerald-400">{t('newDashboard.todaysEnergy.goodTime')}</p>
                      <p className="mt-2 text-lg font-bold">19:00 - 20:00</p>
                      <p className="mt-1 text-sm leading-6 text-foreground/58">{t('newDashboard.todaysEnergy.goodTimeDesc')}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-outline-variant/10 bg-surface-variant/[0.035] p-5">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-8 w-8 shrink-0 fill-amber-400/15 text-amber-400" />
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-amber-400">
                        {`${t('newDashboard.panchang.rahuKaal')} / ${t('newDashboard.todaysEnergy.alertTime')}`}
                      </p>
                      <p className="mt-2 text-lg font-bold">{formatRahuKaal(transits)}</p>
                      <p className="mt-1 text-sm leading-6 text-foreground/58">{t('newDashboard.todaysEnergy.cautionTimeDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => askInChat(t('newDashboard.todaysEnergy.aiChat'), t('newDashboard.todaysEnergy.explainMsg', { score: overallScore }))}
                  className="rounded-full border border-secondary/60 px-5 py-3 text-sm font-black uppercase tracking-wider text-secondary transition hover:bg-secondary/10"
                >
                  {t('newDashboard.todaysEnergy.aiChat')}
                </button>
                <Link
                  href="/horoscope/forecast"
                  className="rounded-full bg-gradient-to-r from-[var(--secondary)] via-[var(--flare-gold)] to-[var(--secondary)] px-5 py-3 text-center text-sm font-black uppercase tracking-wider text-on-primary transition hover:brightness-110"
                >
                  {t('newDashboard.todaysEnergy.fullReading')}
                </Link>
              </div>
            </DarkPanel>

            <section className="space-y-3">
              <h2 className="text-[14px] font-bold uppercase tracking-[0.22em] text-foreground/70">{t('newDashboard.lifeAreas.title')}</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                {scoreLoading
                  ? AREA_LIST.map((area) => (
                      <div key={area} className="rounded-2xl border border-outline-variant/10 bg-surface/78 p-4 text-center">
                        <div className="mx-auto h-20 w-20 animate-pulse rounded-full bg-surface-variant/[0.06]" />
                        <div className="mx-auto mt-3 h-5 w-16 animate-pulse rounded bg-surface-variant/[0.06]" />
                        <div className="mx-auto mt-2 h-3 w-full animate-pulse rounded bg-surface-variant/[0.06]" />
                      </div>
                    ))
                  : lifeAreas.map(({ area, label, score, insight, theme }) => {
                  const Icon = theme.icon;
                  const color = getScoreColor(score);
                  const isLucide = area === "general" || area === "spiritual";
                  return (
                    <Link
                      key={area}
                      href={`/horoscope/forecast?area=${area}`}
                      className="group rounded-2xl border border-outline-variant/10 bg-surface/78 p-4 text-center transition hover:-translate-y-0.5 hover:border-secondary/35 hover:bg-surface-variant"
                    >
                      <AreaRing score={score} color={color} label={label}>
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
                      <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-foreground/58">{insight}</p>
                    </Link>
                  );
                })}
              </div>
            </section>

            <DarkPanel className="grid gap-4 p-5 md:grid-cols-[160px_1fr_1fr_1fr_1fr]">
              <div className="flex items-center gap-3">
                <Sparkles className="h-8 w-8 text-secondary" />
                <div>
                  <p className="label-sm font-black tracking-[0.16em]">{t('newDashboard.celestial')}</p>
                  <p className="label-sm font-black tracking-[0.16em]">{t('newDashboard.insights')}</p>
                </div>
              </div>
              {(transits?.notableTransits?.length ? transits.notableTransits : [
                t('newDashboard.notableTransits.jupiter'),
                t('newDashboard.notableTransits.saturn'),
                t('newDashboard.notableTransits.rahu'),
                t('newDashboard.notableTransits.ketu'),
              ]).slice(0, 4).map((item, idx) => (
                <p key={idx} className="border-outline-variant/10 text-sm leading-6 text-foreground/65 md:border-l md:pl-5">
                  <span aria-hidden="true" className="mr-2 text-secondary">•</span>
                  {item}
                </p>
              ))}
            </DarkPanel>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-1">
            <div className="space-y-5">
              <DarkPanel className="p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h2 className="text-[14px] font-black uppercase tracking-[0.22em]">{t('newDashboard.weeklyChart.title')}</h2>
                  <p className="label-secondary font-black">{t('newDashboard.weeklyChart.best')}: {bestDay}</p>
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
                          aria-pressed={selected}
                          aria-label={resolveAreaLabel(t, area)}
                          onClick={() => setActiveArea(area)}
                          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                            selected
                              ? "border-secondary/45 bg-secondary/12 text-secondary"
                              : "border-outline-variant/10 bg-surface-variant/[0.025] text-foreground/70 hover:border-outline-variant/20"
                          }`}
                        >
                          <Icon className={isLucide ? "h-4 w-4 fill-current" : "h-4 w-4 object-cover"} />
                          {resolveAreaLabel(t, area)}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={`relative rounded-2xl overflow-hidden ${
                  isFeatureBlocked('full_daily_horoscope') && getFeaturePaywall('full_daily_horoscope')
                    ? 'min-h-[320px]'
                    : 'min-h-[230px]'
                }`}>
                  {isFeatureBlocked('full_daily_horoscope') && getFeaturePaywall('full_daily_horoscope') ? (
                    <PaywallCard paywall={getFeaturePaywall('full_daily_horoscope')!} variant="overlay" />
                  ) : forecastLoading || !forecast ? (
                    <div className="h-[230px] animate-pulse rounded-2xl bg-surface-variant/[0.04]" />
                  ) : (
                    <WeeklyOutlookChart days={forecast.days} colorHex={AREA_THEMES[activeArea].hex} areaLabel={resolveAreaLabel(t, activeArea)} />
                  )}
                </div>
              </DarkPanel>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] min-[2560px]:grid-cols-[minmax(0,1fr)_480px]">
                <div className="space-y-5">
                  <DarkPanel className="p-5">
                    <h2 className="mb-4 text-[14px] font-black uppercase tracking-[0.22em]">{t('newDashboard.panchang.title')}</h2>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {[
                        { label: t('newDashboard.panchang.tithi'), value: transits?.panchanga?.tithi || "Purnima", icon: <Moon className="h-4 w-4 text-secondary" /> },
                        { label: t('newDashboard.panchang.vara'), value: transits?.panchanga?.vara || "Shanivaar", icon: <Calendar className="h-4 w-4 text-amber-500" /> },
                        { label: t('newDashboard.panchang.nakshatra'), value: transits?.panchanga?.nakshatra || "Anuradha", icon: <Star className="h-4 w-4 text-emerald-400" /> },
                        { label: t('newDashboard.panchang.yoga'), value: transits?.panchanga?.yoga || "Shiva", icon: <Sparkles className="h-4 w-4 text-violet-400" /> },
                        { label: t('newDashboard.panchang.karana'), value: transits?.panchanga?.karana || "Vishti", icon: <Gem className="h-4 w-4 text-rose-400" /> },
                        { label: t('newDashboard.panchang.rahuKaal'), value: formatRahuKaal(transits), icon: <AlertTriangle className="h-4 w-4 text-secondary" /> },
                      ].map((chip) => (
                        <div key={chip.label} className="flex min-h-[82px] flex-col items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-variant/[0.025] p-2 text-center">
                          {chip.icon}
                          <p className="label-sm text-[9px] tracking-[0.14em] text-foreground/45">{chip.label}</p>
                          <p className="w-full truncate 3xl:whitespace-normal font-headline text-[12px] font-bold">{chip.value}</p>
                        </div>
                      ))}
                    </div>
                  </DarkPanel>

                  <DarkPanel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/20">
                        <Heart className="h-7 w-7 fill-violet-400/20 text-violet-400" />
                      </div>
                      <div>
                        <h3 className="text-[14px] font-black uppercase tracking-[0.16em]">{t('newDashboard.compatibility.title')}</h3>
                        <p className="mt-1 max-w-lg text-sm leading-6 text-foreground/58">{t('newDashboard.compatibility.desc')}</p>
                      </div>
                    </div>
                    <Link href="/kundli/match" className="rounded-xl bg-secondary px-5 py-3 text-center text-sm font-black uppercase text-on-primary">
                      {t('newDashboard.compatibility.emptyCta')}
                    </Link>
                  </DarkPanel>

                  {/* DAILY COSMIC INSIGHT */}
                  <DarkPanel className="p-6">
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Sun className="h-5 w-5 text-secondary" />
                        <h3 className="label-sm font-black tracking-[0.24em]">{t('newDashboard.cosmicInsight.title')}</h3>
                      </div>
                      <span className="shrink-0 label-secondary text-[10px]">
                        {t('horoscope.today')} • {horoscope?.meta?.date_display || horoscope?.date_display || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="relative mb-6 px-2 py-3">
                      <span aria-hidden="true" className="absolute -left-2 -top-3 select-none font-serif text-[56px] leading-none text-secondary">&ldquo;</span>
                      <p className="relative px-6 text-[13px] leading-relaxed text-foreground/75">
                        {(typeof horoscope?.tip === 'object' ? horoscope.tip?.text : horoscope?.tip) || "A day to align your actions with your higher purpose. Trust the timing of the universe and take one step forward with clarity."}
                      </p>
                      <span aria-hidden="true" className="absolute -bottom-6 -right-2 select-none font-serif text-[56px] leading-none text-secondary">&rdquo;</span>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-3">
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 rounded-2xl border border-outline-variant/8 bg-surface p-3 text-center sm:text-left min-w-0 w-full">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-700 shadow-[0_0_16px_rgba(168,85,247,0.6)]" />
                        </div>
                        <div className="min-w-0 flex flex-col items-center sm:items-start w-full">
                          <p className="label-sm text-[9px] tracking-wider text-foreground/35">{t('newDashboard.cosmicInsight.luckyColor')}</p>
                          <p className="font-headline text-[12px] sm:text-sm font-bold text-foreground mt-0.5 sm:mt-1 truncate max-w-full text-center sm:text-left">
                            {(horoscope?.lucky?.color || horoscope?.lucky_color) ?? "Deep Purple"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 rounded-2xl border border-outline-variant/8 bg-surface p-3 text-center sm:text-left min-w-0 w-full">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-secondary/40 bg-secondary/20 text-lg font-black text-secondary">
                          {(horoscope?.lucky?.number || horoscope?.lucky_number) ?? "7"}
                        </div>
                        <div className="min-w-0 flex flex-col items-center sm:items-start w-full">
                          <p className="label-sm text-[9px] tracking-wider text-foreground/35">{t('newDashboard.cosmicInsight.luckyNumber')}</p>
                          <p className="font-headline text-[12px] sm:text-sm font-bold text-foreground mt-0.5 sm:mt-1 truncate max-w-full text-center sm:text-left">
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
                    <Sparkles className="mt-1 h-7 w-7 text-secondary" />
                    <div>
                      <h2 className="font-headline text-2xl font-bold">{t('dashboard.consultNaviAi')}</h2>
                      <p className="text-sm text-foreground/55">{t('dashboard.vedicWisdomPowered')}</p>
                    </div>
                  </div>

                  <p className="mb-3 label-secondary font-black tracking-[0.2em]">{t('dashboard.askAbout')}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: t("topicPills.careerFinance"), icon: <Briefcase className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                      { label: t("topicPills.loveMarriage"), icon: <Heart className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                      { label: t("topicPills.healthWellness"), icon: <Activity className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                      { label: t("topicPills.travelRelocation"), icon: <Home className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                      { label: t("topicPills.muhuratTiming"), icon: <Calendar className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
                      { label: t("topicPills.currentTransits"), icon: <Orbit className="h-4 w-4" />, requiresFeature: 'guided_consult' as PaywallFeatureKey },
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
                          className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold text-foreground/78 transition relative overflow-hidden ${
                            isBlocked
                              ? "border border-outline-variant/5 bg-surface-variant/[0.015] text-foreground/40 cursor-pointer hover:bg-white/5"
                              : "bg-surface-variant/[0.045] hover:bg-secondary/12 hover:text-secondary"
                          }`}
                        >
                          <span className={isBlocked ? "text-foreground/30" : "text-secondary"}>{item.icon}</span>
                          <span className="flex-1 truncate 3xl:whitespace-normal">{item.label}</span>
                          {isBlocked && <Lock className="h-3.5 w-3.5 text-foreground/35 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mb-3 mt-6 label-secondary font-black tracking-[0.2em]">{t('newDashboard.deepDive.title')}</p>
                  <div className="space-y-3">
                    {[
                      t('newDashboard.deepDive.deepDiveQ1'),
                      t('newDashboard.deepDive.deepDiveQ2', { area: activeAreaLabel }),
                      t('newDashboard.deepDive.deepDiveQ3'),
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
                            askInChat(t('newDashboard.deepDive.title'), question);
                          }}
                          className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                            isBlocked
                              ? "border-outline-variant/5 bg-white/[0.01] text-foreground/40 cursor-pointer"
                              : "border-outline-variant/10 bg-surface-variant/[0.025] text-foreground/78 hover:border-secondary/35 hover:text-secondary"
                          }`}
                        >
                          <span className="truncate flex-1 3xl:whitespace-normal">{question}</span>
                          {isBlocked ? (
                            <Lock className="h-3.5 w-3.5 text-foreground/30 shrink-0" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-secondary shrink-0" />
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
                      askInChat(t('chatWithNavi'), t('newDashboard.todaysEnergy.discussMsg'));
                    }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-secondary/60 px-4 py-3 text-sm font-black uppercase tracking-wider text-secondary transition hover:bg-secondary/10"
                  >
                    {isFeatureBlocked('chat_message') ? <Lock className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    {t('chatWithNavi')}
                  </button>
                </DarkPanel>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXPLORE YOUR COSMIC NETWORK SECTION */}
      <div className="relative z-10 mx-auto max-w-[1760px] px-5 py-12 sm:px-8 lg:px-10 2xl:max-w-[2100px] 3xl:max-w-[2400px]">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="label-secondary text-[10px] font-black tracking-[0.3em]">{t('newDashboard.guidanceHub')}</span>
          </div>
          <h2 className="font-headline text-[32px] font-bold leading-tight tracking-tight text-foreground sm:text-[42px] 3xl:text-[56px]">
            {t('newDashboard.exploreCosmicNetwork')}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/55">
            {t('newDashboard.cosmicNetworkDesc')}
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
                    <div aria-hidden="true" className="h-2 w-2 rotate-45 border border-secondary bg-secondary/20" />
                  </div>
                  <h3 className="label-sm font-black tracking-[0.24em]">{t('newDashboard.meetYourAiAstrologers')}</h3>
                </div>
                <Link href="/chat" aria-label={t('newDashboard.meetYourAiAstrologers')} className="text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-secondary">
                  {t('newDashboard.lifeAreas.viewAll')} <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { name: "Navi", role: t('newDashboard.guides.navi.role'), desc: t('newDashboard.guides.navi.desc'), credits: 1, avatarId: "navi", img: "/images/avatars/NAVI_AVATAR.jpeg" },
                  { name: "Arya", role: t('newDashboard.guides.arya.role'), desc: t('newDashboard.guides.arya.desc'), credits: 2, avatarId: "career_mentor", img: "/images/avatars/ARYA_AVATAR.jpeg" },
                  { name: "Meera", role: t('newDashboard.guides.meera.role'), desc: t('newDashboard.guides.meera.desc'), credits: 2, avatarId: "relationship_guide", img: "/images/avatars/MEERA_AVATAR.jpeg" },
                  { name: "Anand", role: t('newDashboard.guides.anand.role'), desc: t('newDashboard.guides.anand.desc'), credits: 2, avatarId: "spiritual_guide", img: "/images/avatars/ANAND_AVATAR.jpeg" },
                  { name: "Vidya", role: t('newDashboard.guides.vidya.role'), desc: t('newDashboard.guides.vidya.desc'), credits: 2, avatarId: "finance_mentor", img: "/images/avatars/VIDYA_AVATAR.jpeg" },
                  { name: "Rishi", role: t('newDashboard.guides.rishi.role'), desc: t('newDashboard.guides.rishi.desc'), credits: 3, avatarId: "astro_sage", img: "/images/avatars/RISHI_AVATAR.jpeg" },
                ].map((guide) => {
                  const isLocked = isFeatureBlocked('chat_message');
                  const paywallData = getFeaturePaywall('chat_message');

                  return (
                    <div key={guide.name} className={`group flex flex-col items-center text-center ${isLocked ? 'opacity-60' : ''}`}>
                      <div className="relative mb-4">
                        <div className={`h-[92px] w-[92px] overflow-hidden rounded-full border-[3px] bg-surface transition-all ${
                          isLocked
                            ? 'border-outline-variant/20'
                            : 'border-secondary/50 group-hover:border-secondary/80 group-hover:gold-glow'
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
                              <Lock className="h-6 w-6 text-foreground/80" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border border-secondary/40 bg-surface px-2.5 py-1 text-[9px] font-bold text-secondary shadow-lg">
                          <Coins className="h-2.5 w-2.5" />
                          {guide.credits} {guide.credits > 1 ? t('dashboard.creditPlural') : t('dashboard.creditSingular')}
                        </div>
                      </div>
                      <h4 className="mb-1 mt-1 font-headline text-base font-bold text-foreground">{guide.name}</h4>
                      <p className="mb-2 label-sm text-[9px] tracking-[0.15em] text-foreground/40">{guide.role}</p>
                      <p className="mb-3 line-clamp-2 min-h-[32px] 3xl:min-h-[40px] text-[10.5px] 3xl:text-[14px] leading-relaxed text-foreground/45">{guide.desc}</p>
                      <button
                        onClick={() => {
                          if (isLocked && paywallData) {
                            setActivePaywallData(paywallData);
                            return;
                          }
                          setSelectedAvatarId(guide.avatarId);
                          askInChat(t('chatWithNavi'), `I want to consult with ${guide.name} about my chart.`);
                        }}
                        className={`flex items-center gap-1.5 rounded-xl border-2 px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                          isLocked
                            ? 'border-outline-variant/20 bg-transparent text-foreground/50 cursor-pointer hover:bg-white/5'
                            : 'border-secondary/50 bg-transparent text-secondary hover:border-secondary/70 hover:bg-secondary/10'
                        }`}
                      >
                        {isLocked ? (
                          <>
                            <Lock className="h-3 w-3" />
                            {t('newDashboard.guides.locked')}
                          </>
                        ) : (
                          <>
                            <MessageSquare className="h-3 w-3" />
                            {t('dashboard.startChat')}
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
                  <Heart className="h-5 w-5 text-rose-400" />
                  <h3 className="label-sm font-black tracking-[0.24em]">{t('newDashboard.familyFriends.title')}</h3>
                </div>
                <Link href="/family" aria-label={t('newDashboard.familyFriends.title')} className="text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-secondary">
                  {t('newDashboard.lifeAreas.viewAll')} <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {familyLoading && !familyMembers && connectionsLoading && !familyConnections ? (
                  [0, 1].map((i) => (
                    <div key={i} className="flex flex-col gap-3 rounded-2xl border border-outline-variant/8 bg-surface p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 rounded-full bg-surface-variant/20 animate-pulse" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 rounded bg-surface-variant/20 animate-pulse" />
                          <div className="h-2 w-16 rounded bg-surface-variant/20 animate-pulse" />
                        </div>
                      </div>
                      <div className="h-5 w-24 rounded bg-surface-variant/20 animate-pulse" />
                    </div>
                  ))
                ) : (
                  <>
                    {familyMembers?.map((m) => {
                      const blocked = isFeatureBlocked('family_compatibility');
                      return (
                        <DashboardFamilyMemberCard
                          key={`m-${m.id}`}
                          member={m}
                          t={t}
                          isCompatibilityBlocked={blocked}
                          onRunCompatibility={() => {
                            const pw = getFeaturePaywall('family_compatibility');
                            if (blocked && pw) { setActivePaywallData(pw); return; }
                            router.push(`/family?member=${m.id}&run=1`);
                          }}
                        />
                      );
                    })}
                    {familyConnections?.map((c) => {
                      const blocked = isFeatureBlocked('family_compatibility');
                      return (
                        <DashboardConnectionCard
                          key={`c-${c.connectionId}`}
                          connection={c}
                          t={t}
                          isCompatibilityBlocked={blocked}
                          onRunCompatibility={() => {
                            const pw = getFeaturePaywall('family_compatibility');
                            if (blocked && pw) { setActivePaywallData(pw); return; }
                            router.push('/family');
                          }}
                        />
                      );
                    })}
                  </>
                )}

                <Link
                  href="/family"
                  className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-secondary/30 bg-secondary/5 p-4 text-center transition-all hover:border-secondary/50"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-secondary/40 text-secondary">
                    <Users className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-bold text-foreground">{t('newDashboard.familyFriends.addMember')}</p>
                    <p className="text-[10px] leading-relaxed text-foreground/40">{t('dashboard.familyAddSubtitle')}</p>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-xl border-2 border-secondary/50 bg-transparent px-4 py-2 text-[10px] font-black uppercase tracking-wider text-secondary transition-all hover:border-secondary/70 hover:bg-secondary/10">
                    <Users className="h-3 w-3" />
                    {t('newDashboard.familyFriends.addMember')}
                  </span>
                </Link>
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
                    <Orbit className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="label-sm font-black tracking-[0.24em]">{t('newDashboard.chartSnapshot')}</h3>
                </div>
                <Link href="/kundli" aria-label={t('newDashboard.myChart.viewDetails')} className="text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-secondary">
                  {t('newDashboard.myChart.viewDetails')} <ArrowRight className="inline h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-3">
                {[
                  { label: t('newDashboard.myChart.yourKundli'), sublabel: `${ascendantSign?.name || "Leo"} ${t('dashboard.ascendant')}`, icon: <Orbit className="h-4 w-4" />, href: "/kundli", color: "#60a5fa" },
                  ...(mahadashaSub
                    ? [{ label: t('newDashboard.myChart.mahadasha'), sublabel: mahadashaSub, subtext: mahadashaRange, icon: <Activity className="h-4 w-4" />, href: "/kundli", color: "var(--flare-gold)", requiresFeature: 'kundli_premium' as PaywallFeatureKey }]
                    : []),
                  ...(antardashaSub
                    ? [{ label: t('newDashboard.myChart.antardasha'), sublabel: antardashaSub, subtext: antardashaRange, icon: <Sparkles className="h-4 w-4" />, href: "/kundli", color: "var(--flare-lavender)", requiresFeature: 'kundli_premium' as PaywallFeatureKey }]
                    : []),
                ].map((item, idx) => {
                  const isBlocked = item.requiresFeature ? isFeatureBlocked(item.requiresFeature) : false;
                  const paywallData = item.requiresFeature ? getFeaturePaywall(item.requiresFeature) : null;

                  return (
                    <div
                      key={idx}
                      role="button"
                      tabIndex={0}
                      aria-label={isBlocked ? `${t('newDashboard.unlock')} ${item.label}` : `${t('newDashboard.view')} ${item.label}`}
                      onClick={() => {
                        if (isBlocked && paywallData) {
                          setActivePaywallData(paywallData);
                          return;
                        }
                        router.push(item.href);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (isBlocked && paywallData) {
                            setActivePaywallData(paywallData);
                            return;
                          }
                          router.push(item.href);
                        }
                      }}
                      className="flex items-center justify-between rounded-2xl border border-outline-variant/8 bg-surface p-4 transition-all hover:border-secondary/30 hover:bg-surface-variant cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0"
                          style={{ backgroundColor: `${item.color}1f`, color: item.color }}
                        >
                          {item.icon}
                        </div>
                        <div className={isBlocked ? "blur-[2.5px] select-none opacity-50 transition-all duration-300" : ""}>
                          <p className="label-sm text-[10px] tracking-wider text-foreground/35">{item.label}</p>
                          <p className="font-headline text-sm font-bold text-foreground">{item.sublabel}</p>
                          {item.subtext && <p className="text-[10px] text-foreground/35">{item.subtext}</p>}
                        </div>
                      </div>
                      <button className="flex items-center gap-1 rounded-xl border border-secondary/40 bg-secondary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-secondary shrink-0">
                        {isBlocked ? <Lock className="h-3 w-3 mr-0.5" /> : null}
                        {isBlocked ? t('newDashboard.unlock') : t('newDashboard.view')} <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
              <Link
                href="/kundli"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-secondary/50 bg-secondary/10 px-4 py-3 text-[11px] font-black uppercase tracking-wider text-secondary transition-all hover:border-secondary/70 hover:bg-secondary/15"
              >
                <Sparkles className="h-4 w-4" />
                {t('newDashboard.myChart.exploreFullAnalysis')}
              </Link>
            </DarkPanel>


          </div>
        </div>

        {/* COSMIC PORTALS — Full Width */}
        <DarkPanel className="mt-8 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center">
                <div aria-hidden="true" className="h-2 w-2 rotate-45 border border-secondary bg-secondary/20" />
              </div>
              <h3 className="label-sm font-black tracking-[0.24em]">{t('dashboard.cosmicPortals')}</h3>
            </div>
            <Link href="/chat" aria-label={t('newDashboard.exploreAllPortals')} className="text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-secondary">
              {t('newDashboard.exploreAllPortals')} <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { icon: <MessageSquare className="h-5 w-5" />, title: t('dashboard.consultNaviAi'), desc: t('newDashboard.portalChatDesc'), action: t('dashboard.consultAi'), href: "/chat", color: "var(--secondary)", requiresFeature: 'chat_message' as PaywallFeatureKey },
              { icon: <Globe className="h-5 w-5" />, title: t('dashboard.janamKundli'), desc: t('dashboard.janamKundliDesc'), action: t('dashboard.openChart'), href: "/kundli", color: "#60a5fa", requiresFeature: 'kundli_premium' as PaywallFeatureKey },
              { icon: <Heart className="h-5 w-5" />, title: t('dashboard.soulmateSync'), desc: t('newDashboard.portalSoulmateDesc'), action: t('dashboard.analyzeMatch'), href: "/kundli/match", color: "#fb7185", requiresFeature: 'match_report' as PaywallFeatureKey },
              { icon: <Sun className="h-5 w-5" />, title: t('dashboard.dailyPulse'), desc: t('newDashboard.portalPulseDesc'), action: t('newDashboard.viewToday'), href: "/horoscope/forecast", color: "#34d399", requiresFeature: 'full_daily_horoscope' as PaywallFeatureKey },
              { icon: <Orbit className="h-5 w-5" />, title: t('newDashboard.rashiLibrary'), desc: t('newDashboard.portalRashiDesc'), action: t('dashboard.openLibrary'), href: "/rashis", color: "var(--flare-lavender)" },
              { icon: <Sparkles className="h-5 w-5" />, title: t('dashboard.sessions'), desc: t('newDashboard.portalSessionsDesc'), action: t('dashboard.joinSession'), href: "/consult", color: "var(--flare-gold)", requiresFeature: 'guided_consult' as PaywallFeatureKey },
            ].map((portal, idx) => {
              const isLocked = portal.requiresFeature ? isFeatureBlocked(portal.requiresFeature) : false;
              const paywallData = portal.requiresFeature ? getFeaturePaywall(portal.requiresFeature) : null;
              const showProBadge = portal.requiresFeature && isLocked && paywallData?.isSoft;
              const showCreditBadge = portal.requiresFeature && isLocked && !paywallData?.isSoft;

              return (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  aria-label={portal.title}
                  onClick={(e) => {
                    if (isLocked && paywallData) {
                      e.preventDefault();
                      setActivePaywallData(paywallData);
                    } else {
                      router.push(portal.href);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (isLocked && paywallData) {
                        setActivePaywallData(paywallData);
                      } else {
                        router.push(portal.href);
                      }
                    }
                  }}
                  className={`group relative flex flex-col gap-3 rounded-2xl border border-outline-variant/8 bg-surface p-5 transition-all cursor-pointer ${
                    isLocked ? 'opacity-60 hover:border-outline-variant/10' : 'hover:-translate-y-0.5 hover:border-secondary/30 hover:bg-surface-variant'
                  }`}
                >
                  {/* Pro Badge */}
                  {showProBadge && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-secondary to-amber-500 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-on-primary">
                      <Zap className="h-2.5 w-2.5" />
                      Pro
                    </div>
                  )}

                  {/* Credit Badge */}
                  {showCreditBadge && paywallData?.creditsRequired && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-secondary/40 bg-secondary/15 px-2 py-0.5 text-[8px] font-bold text-secondary">
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
                    <h4 className="mb-1.5 font-headline text-base font-bold text-foreground">{portal.title}</h4>
                    <p className="line-clamp-3 text-[11px] leading-relaxed text-foreground/45">{portal.desc}</p>
                  </div>
                  <button
                    className={`mt-auto flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all`}
                    style={{ borderColor: `${portal.color}50`, backgroundColor: 'transparent', color: portal.color }}
                  >
                    {isLocked && <Lock className="h-3 w-3 mr-1 shrink-0" />}
                    {isLocked ? t('newDashboard.unlock') : portal.action} <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </DarkPanel>

        {/* Privacy Footer */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4 text-center text-[11px] text-foreground/30">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>{t('newDashboard.privacy.protected')}</span>
          </div>
          <span>•</span>
          <span>{t('newDashboard.privacy.secure')}</span>
          <span>•</span>
          <span>{t('newDashboard.privacy.encrypted')}</span>
          <span>•</span>
          <span>{t('newDashboard.privacy.trusted')}</span>
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
            onKeyDown={(e) => {
              if (e.key === 'Escape') setPendingPrompt(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chat-confirm-title"
          >
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
            <motion.div
              initial={{ y: 18, scale: 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 12, scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-[28px] border border-secondary/30 bg-surface p-6 shadow-2xl"
            >
              <button
                autoFocus
                onClick={() => setPendingPrompt(null)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-foreground/70 hover:bg-white/12"
                aria-label="Close chat confirmation"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h2 id="chat-confirm-title" className="font-headline text-2xl font-bold">{t('newDashboard.todaysEnergy.askNaviInChat')}</h2>
              <p className="mt-2 text-sm leading-6 text-foreground/60">{t('newDashboard.todaysEnergy.askNaviConfirmDesc')}</p>
              <div className="mt-4 rounded-2xl border border-outline-variant/10 bg-surface-variant/[0.035] p-4">
                <p className="label-secondary text-[11px] font-black tracking-[0.2em]">{pendingPrompt.title}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/82">{pendingPrompt.message}</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button onClick={() => setPendingPrompt(null)} className="rounded-2xl border border-outline-variant/12 px-4 py-3 text-sm font-bold text-foreground/75 hover:bg-white/8">
                  {t('newDashboard.todaysEnergy.stayHere')}
                </button>
                <button onClick={confirmChat} className="rounded-2xl bg-secondary px-4 py-3 text-sm font-black text-on-primary">
                  {t('newDashboard.todaysEnergy.openChat')}
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
