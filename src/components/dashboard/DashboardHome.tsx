"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Calendar,
  ChevronRight,
  Coins,
  Flower2,
  Gem,
  Globe,
  Heart,
  Lock,
  MessageSquare,
  Moon,
  Orbit,
  Plus,
  ShieldAlert,
  Sparkles,
  Star,
  Sun,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { usePaywallContext } from "@/context/PaywallContext";
import { useChat } from "@/context/ChatContext";
import PaywallCard from "@/components/paywall/PaywallCard";
import LockedPreview from "@/components/paywall/LockedPreview";
import type { PaywallFeatureKey, PaywallData } from "@/types/paywall";
import { useDailyHoroscope, useTranslation, useTransitsToday } from "@/hooks";
import { useGreeting } from "@/hooks/useGreeting";
import { LOCALE_BY_LANGUAGE } from "@/locales";
import { clientFetch } from "@/lib/apiClient";
import { getRashiData } from "@/lib/astrology";
import { AREA_LIST, AREA_THEMES, ForecastArea } from "@/data/areaThemes";
import { getAreaPhaseMain, STATUS_COLORS, SIGNAL_BADGES, BRAND_GOLD, TEXT_COLORS, getScorePhase } from "@/data/lifeAreaColors";
import { PORTAL_COLORS } from "@/data/portalColors";

import type { ForecastDay } from "@/components/dashboard/MiniChart";
// import Particles from "@/components/ui/Particles";
import { catmullRomToBezier, catmullRomArea } from "@/utils/chartCurve";
import { todayISO } from "@/utils/forecastError";
import type { HoroscopeData } from "@/types/horoscope";
import DailyHoroscopeCardSkeleton from "@/components/dashboard/DailyHoroscopeCardSkeleton";
import ProfileImageUpload from "@/components/profile/ProfileImageUpload";
import {
  useFamilyMembers,
} from "@/hooks/useFamily";
import { useFamilyDashboard } from "@/hooks/useFamilyDashboard";
import { memberFromConnection } from "@/components/family/BondDashboardBody";
import { familyDashboardBandHex } from "@/types/familyDashboard";
import { parseKundliStats } from "@/lib/kundliStats";
import { computeFamilyMemberStatus } from "@/lib/familyStatus";
import type { FamilyMember, FamilyConnection } from "@/types/family";
import { familyRosterLimit } from "@/types/family";
import FamilyCapDialog from "@/components/family/FamilyCapDialog";

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

type WeeklyForecastApiDay = {
  date: string;
  is_today?: boolean;
  score: number;
  text?: string;
  dominant_planet?: string;
  alerts?: ForecastDay["personalized_alerts"];
  transits?: ForecastDay["transits"];
};

const areaLabelFallback: Record<ForecastArea, string> = {
  love: "Love",
  career: "Career",
  finance: "Finance",
  health: "Health",
  general: "General",
  spiritual: "Spiritual",
};

const DASHBOARD_SECTION_TITLE_CLASS = "font-headline text-xl font-bold leading-tight tracking-tight text-foreground";
const DASHBOARD_SECTION_SUBTITLE_CLASS = "mt-1 text-xs font-medium text-foreground/55";

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

function getAreaScore(horoscope: HoroscopeData | null, area: ForecastArea) {
  if (!horoscope) return 0;
  const scoreArea = horoscope?.score?.areas?.[area as keyof NonNullable<HoroscopeData["score"]>["areas"]];
  if (scoreArea && typeof scoreArea === "object" && "value" in scoreArea) return scoreArea.value;
  if (horoscope?.today_scores?.[area] != null) return horoscope.today_scores[area];

  const legacy = horoscope as unknown as {
    areas?: Record<string, { score?: number; text?: string }>;
  } | null;
  const legacyKey = area === "love" ? "relationships" : area === "finance" ? "finances" : area;
  return legacy?.areas?.[legacyKey]?.score ?? 0;
}

function getAreaInsight(horoscope: HoroscopeData | null, area: ForecastArea) {
  if (!horoscope) return "";
  const areasText = horoscope?.areas_text as Partial<Record<ForecastArea, { insight: string; tone: string }>> | undefined;
  const insight = areasText?.[area]?.insight;
  if (insight) return insight;
  const legacy = horoscope as unknown as {
    areas?: Record<string, { score?: number; text?: string }>;
  } | null;
  const legacyKey = area === "love" ? "relationships" : area === "finance" ? "finances" : area;
  return legacy?.areas?.[legacyKey]?.text || "";
}

function getAreaAction(horoscope: HoroscopeData | null, area: ForecastArea) {
  if (!horoscope) return "";
  if (area === "general") {
    const tip = horoscope?.tip;
    if (typeof tip === "string") return tip;
    return tip?.text || "";
  }
  const areasText = horoscope?.areas_text as Partial<Record<ForecastArea, { action?: string }>> | undefined;
  return areasText?.[area]?.action || "";
}

function formatRahuKaal(transits: ReturnType<typeof useTransitsToday>["data"], horoscope?: HoroscopeData | null) {
  const rk = transits?.panchanga?.rahukaal || horoscope?.meta?.panchanga?.rahukaal;
  if (!rk) return "08:34 - 10:25";
  return `${rk.start} - ${rk.end}`;
}

function RingScore({ score, size = 132, color, className }: { score: number; size?: number; color: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Track the actual rendered size so the inner number/label text scales with
  // the (possibly responsive) circle — the SVG itself already scales via its
  // viewBox, but the absolutely-positioned text uses pixel font sizes.
  const [px, setPx] = useState(size);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setPx(w);
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      ref={containerRef}
      className={className ? `relative shrink-0 aspect-square ${className}` : "relative shrink-0 aspect-square"}
      style={className ? undefined : { width: size, height: size }}
    >
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
        <span className="font-black leading-none tabular-nums" style={{ color, fontSize: px * 0.28 }}>
          {score}
        </span>
        <span className="font-semibold text-foreground/70" style={{ fontSize: px * 0.1, marginTop: px * 0.02 }}>/100</span>
      </div>
    </div>
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

  const H = 180;
  const PAD = { top: 10, right: 20, bottom: 30, left: 20 };
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
        className="h-[180px] w-full overflow-visible"
      >
        <defs>
          <linearGradient id={`wk-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colorHex} stopOpacity="0.14" />
            <stop offset="50%" stopColor={colorHex} stopOpacity="0.05" />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Y-axis gridlines + labels */}
        {[0, 25, 50, 75, 100].map((v) => {
          const y = yOf(v);
          return (
            <g key={v}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#C4B5FD" strokeOpacity="0.08" strokeWidth="1" />
              <text x={PAD.left - 15} y={y + 3.5} textAnchor="end" fontSize="12" fontWeight="700" fill="var(--foreground)" opacity="0.85">{v}</text>
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
                <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill={isToday ? colorHex : "var(--foreground)"} opacity={isToday ? 1 : 0.95}>
                  {d.score}
                </text>
              )}
              <text x={p.x} y={H - 16} textAnchor="middle" fontSize="12" fontWeight="800" letterSpacing="0.5" fill={isToday ? colorHex : "var(--foreground)"} opacity={isToday ? 1 : 0.85}>
                {date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}
              </text>
              <text x={p.x} y={H - 3} textAnchor="middle" fontSize="13" fontWeight="700" fill={isToday ? colorHex : "var(--foreground)"} opacity={isToday ? 1 : 0.95}>
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

  const isDefaultSize = size === 80;

  return (
    <div
      className={isDefaultSize ? "relative mx-auto shrink-0 w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] md:w-[80px] md:h-[80px]" : "relative mx-auto shrink-0"}
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

function DarkPanel({ children, className = "", style, borderVariant }: { children: React.ReactNode; className?: string; style?: React.CSSProperties; borderVariant?: 'muted' | 'glow-premium' | 'gradient-cosmic' | 'top-gold' | 'dashed-locked' }) {
  const variantClass = borderVariant ? `border-${borderVariant}` : '';
  const shadowClass = borderVariant ? '' : 'shadow-[var(--card-shadow)]';
  return (
    <section className={`dark-glass rounded-[22px] ${shadowClass} ${variantClass} ${className}`} style={style}>
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

const getPlanetImage = (name?: string | null): string => {
  const n = (name || "").toLowerCase().trim();
  if (n.includes("sun")) return "/icons/planets/sun.png";
  if (n.includes("moon")) return "/icons/planets/moon.png";
  if (n.includes("mars")) return "/icons/planets/mars.png";
  if (n.includes("mercury")) return "/icons/planets/mercury.png";
  if (n.includes("jupiter")) return "/icons/planets/jupiter.png";
  if (n.includes("venus")) return "/icons/planets/venus.png";
  if (n.includes("saturn")) return "/icons/planets/saturn.png";
  return "/icons/planets/jupiter.png";
};

interface FamilyCardActionProps {
  t: (key: string) => string;
}

function DashboardAddMemberCard({
  onClick,
  isLocked,
  lockType
}: {
  onClick?: () => void;
  isLocked?: boolean;
  lockType?: 'pro' | 'premium'
}) {
  const { t } = useTranslation();
  const lockedCtaLabel = lockType === 'pro' ? "Add more with Pro" : "Add more with Premium";

  const title = t('newDashboard.familyFriends.addMember') || "Add Member";
  const buttonText = t('newDashboard.familyFriends.addMember') || "ADD MEMBER";
  const gold = '#C9972E';
  let bgClass = "bg-[#C9972E]/1 border-[#C9972E]/25 hover:border-[#C9972E]/40 hover:bg-[#C9972E]/3";
  const textClass = "text-[#C9972E]";
  const buttonBorderClass = "border-[#C9972E]/30 group-hover:border-[#C9972E]/50 group-hover:bg-[#C9972E]/8";

  if (isLocked) {
    bgClass = "bg-[#20163B]/30 border-[#C9972E]/20 hover:border-[#C9972E]/35";
  }

  if (isLocked) {
    return (
      <div
        onClick={onClick}
        className={`group relative min-h-[210px] cursor-pointer overflow-hidden rounded-2xl border p-4 text-center transition-all ${bgClass}`}
      >
        <div className="pointer-events-none select-none blur-[3px] opacity-70" aria-hidden="true">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C9972E]/25 bg-[#20163B] font-headline text-xl font-bold text-[#C9972E]">
                  N
                </div>
              </div>
              <div className="min-w-0 text-left">
                <p className="truncate font-headline text-base font-bold tracking-tight text-[#F4EFE7]/75">New bond</p>
                <p className="mt-0.5 text-[10px] font-bold text-[#928BA5]">Invite pending</p>
              </div>
            </div>
            <AreaRing score={74} color={gold} size={64} label="Locked bond preview">
              <span className="text-xs font-black leading-none tabular-nums" style={{ color: gold }}>
                74
              </span>
            </AreaRing>
          </div>

          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#F4EFE7]/8 bg-[#20163B] p-3.5 text-left">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#C9972E]" />
            <p className="text-xs leading-relaxed text-[#C8C3D6]/80">
              Your shared energy preview appears here after a member is added.
            </p>
          </div>
        </div>

        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#150B2D]/88 px-4 backdrop-blur-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#C9972E]/40 bg-[#20163B] text-[#C9972E] shadow-[0_0_24px_rgba(0,0,0,0.35)]">
            <Lock className="h-6 w-6" />
          </div>
          <p className="max-w-[20ch] text-sm font-bold leading-snug text-[#F4EFE7]">
            Add more members
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9972E]/30 bg-[#C9972E]/8 px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[#C9972E] transition-all group-hover:border-[#C9972E]/45 group-hover:bg-[#C9972E]/12">
            <Plus className="h-3 w-3" />
            {lockedCtaLabel}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group relative min-h-[210px] cursor-pointer overflow-hidden rounded-2xl border border-dashed p-4 text-center transition-all ${bgClass}`}
    >
      <div className="pointer-events-none select-none blur-[3px] opacity-70" aria-hidden="true">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#C9972E]/25 bg-[#20163B] font-headline text-xl font-bold text-[#C9972E]">
                N
              </div>
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate font-headline text-base font-bold tracking-tight text-[#F4EFE7]/75">New member</p>
              <p className="mt-0.5 text-[10px] font-bold text-[#928BA5]">Bond preview</p>
            </div>
          </div>
          <AreaRing score={72} color={gold} size={64} label="Member preview">
            <span className="text-xs font-black leading-none tabular-nums" style={{ color: gold }}>
              72
            </span>
          </AreaRing>
        </div>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-[#F4EFE7]/8 bg-[#20163B] p-3.5 text-left">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#C9972E]" />
          <p className="text-xs leading-relaxed text-[#C8C3D6]/80">
            Add someone to reveal your daily bond insight.
          </p>
        </div>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#150B2D]/70 px-4 backdrop-blur-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[#C9972E]/40 bg-[#20163B] text-[#C9972E] shadow-[0_0_24px_rgba(0,0,0,0.3)] transition-transform group-hover:scale-105">
          <Plus className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold leading-snug text-[#F4EFE7] group-hover:text-[#C9972E] transition-colors">
            {title}
          </p>
          <p className="max-w-[20ch] text-[10px] font-semibold leading-relaxed text-[#928BA5]">
            Add someone to reveal the score.
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full border border-[#C9972E]/30 bg-transparent px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-all ${textClass} ${buttonBorderClass}`}>
          <Users className="h-3 w-3" />
          {buttonText}
        </span>
      </div>
    </div>
  );
}

/** Dashboard family-member card backed by real member data + the daily bond dashboard. */
function DashboardFamilyMemberCard({ member, t }: { member: FamilyMember } & FamilyCardActionProps) {
  const { language } = useTranslation();
  // Daily bond dashboard drives the card preview (free teaser — zero credits).
  const { data: dashboard, isLoading } = useFamilyDashboard(member, language);

  const status = computeFamilyMemberStatus({ member, dashboard: dashboard ?? null });

  const rawScore = dashboard?.bond?.score;
  const hasScore = typeof rawScore === "number";
  const scorePct = hasScore ? Math.max(0, Math.min(100, Math.round(rawScore!))) : null;
  const bandKey = dashboard?.bond?.band_key;
  const ringColor = bandKey ? familyDashboardBandHex(bandKey) : '#C9972E';
  const verdict = dashboard?.today_message;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-[28px] border border-[#F4EFE7]/8 bg-[#180F32]">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 max-[400px]:flex-col max-[400px]:items-stretch max-[400px]:gap-2.5">
        {/* Left Side: Avatar + Name / Info */}
        <div className="flex items-center gap-3 min-w-0 max-[400px]:justify-center">
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#20163B] border border-[#C9972E]/25 text-xl font-headline font-bold text-[#C9972E]">
              {initialOf(member.name)}
            </div>
            {/* Status indicator dot */}
            {status?.kind === 'stable' && (
              <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-[#180F32] bg-[#3DD6A0]" />
            )}
            {status?.kind === 'needsAttention' && (
              <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-[#180F32] bg-[#E5A33A]" />
            )}
            {status?.kind === 'incomplete' && (
              <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-[#180F32] bg-[#D96B78]" />
            )}
          </div>

          <div className="min-w-0 flex flex-col">
            <h4 className="truncate font-headline text-base font-bold tracking-tight text-[#F4EFE7]">
              {member.name || "—"}
            </h4>
            <p className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold text-[#928BA5] mt-0.5 max-[400px]:justify-center">
              <span className="truncate capitalize">{member.relationshipType ? formatRelationship(member.relationshipType) : t('family.relationshipNotSet') || 'Connection'}</span>
              {status && (
                <>
                  <span>•</span>
                  <span className={status.classes.split(' ').filter(c => !c.startsWith('bg-') && !c.startsWith('border-')).join(' ')}>
                    {t(status.labelKey)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Circular Bond Gauge */}
        {scorePct !== null && (
          <div className="shrink-0 max-[400px]:mx-auto">
            <AreaRing score={scorePct} color={ringColor} size={64} label="Bond Score">
              <span className="text-xs sm:text-sm font-black leading-none tabular-nums" style={{ color: ringColor }}>
                {scorePct}
              </span>
            </AreaRing>
          </div>
        )}
      </div>

      {/* Middle Row: Teaser / Description Box */}
      {scorePct !== null && verdict && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-[#F4EFE7]/8 bg-[#20163B] text-left">
          <Sparkles className="h-4 w-4 text-[#C9972E] shrink-0 mt-0.5 animate-pulse" />
          <p className="text-xs text-[#C8C3D6] leading-relaxed">{verdict}</p>
        </div>
      )}
      {scorePct === null && isLoading && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-[#F4EFE7]/8 bg-[#20163B] text-left">
          <Sparkles className="h-4 w-4 text-[#C9972E] shrink-0 mt-0.5 animate-pulse" />
          <p className="text-xs text-[#C8C3D6] leading-relaxed">{t('dashboard.familyNoVerdict') || "Reading today's bond…"}</p>
        </div>
      )}

      {/* Footer Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mt-1.5 max-[400px]:flex-col">
        <Link
          href={`/family?member=${member.id}${member.source ? `&source=${member.source}` : ''}`}
          className="flex-1 max-[400px]:w-full rounded-xl bg-gradient-to-r from-[#C9972E] to-[#A57E23] hover:from-[#B58A2B] hover:to-[#96731F] text-white border border-[#C9972E]/30 shadow-md transition-all font-bold uppercase tracking-wider text-[10px] py-2.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>{t('dashboard.familyViewBond') || "View Bond"}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>
    </div>
  );
}

/** Dashboard card for a linked connection (another user who shares with you). */
function DashboardConnectionCard({ connection, t }: { connection: FamilyConnection } & FamilyCardActionProps) {
  const { language } = useTranslation();
  // Daily bond dashboard drives the card preview (free teaser — zero credits).
  // memberFromConnection routes the dashboard hook to /connections/{id}/dashboard.
  const member = memberFromConnection(connection);
  const { data: dashboard, isLoading } = useFamilyDashboard(member, language);

  const status = computeFamilyMemberStatus({ member, dashboard: dashboard ?? null });

  const rawScore = dashboard?.bond?.score;
  const hasScore = typeof rawScore === "number";
  const scorePct = hasScore ? Math.max(0, Math.min(100, Math.round(rawScore!))) : null;
  const bandKey = dashboard?.bond?.band_key;
  const ringColor = bandKey ? familyDashboardBandHex(bandKey) : '#C9972E';
  const statusDotColor = bandKey ? familyDashboardBandHex(bandKey) : '#C9972E';
  const verdict = dashboard?.today_message;

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-[28px] border border-[#F4EFE7]/8 bg-[#180F32]">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 max-[400px]:flex-col max-[400px]:items-stretch max-[400px]:gap-2.5">
        {/* Left Side: Avatar + Name / Info */}
        <div className="flex items-center gap-3 min-w-0 max-[400px]:justify-center">
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#20163B] border border-[#C9972E]/25 text-xl font-headline font-bold text-[#C9972E]">
              {initialOf(connection.otherName)}
            </div>
            <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-[#180F32]" style={{ backgroundColor: statusDotColor }} />
          </div>

          <div className="min-w-0 flex flex-col">
            <h4 className="truncate font-headline text-base font-bold tracking-tight text-[#F4EFE7]">
              {connection.otherName || "—"}
            </h4>
            <p className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold text-[#928BA5] mt-0.5 max-[400px]:justify-center">
              <span className="truncate capitalize">{formatRelationship(connection.iSeeThemAs)}</span>
              {status && (
                <>
                  <span>•</span>
                  <span className={status.classes.split(' ').filter(c => !c.startsWith('bg-') && !c.startsWith('border-')).join(' ')}>
                    {t(status.labelKey)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Side: Circular Bond Gauge */}
        {scorePct !== null && (
          <div className="shrink-0 max-[400px]:mx-auto">
            <AreaRing score={scorePct} color={ringColor} size={64} label="Bond Score">
              <span className="text-xs sm:text-sm font-black leading-none tabular-nums" style={{ color: ringColor }}>
                {scorePct}
              </span>
            </AreaRing>
          </div>
        )}
      </div>

      {/* Middle Row: Teaser / Description Box */}
      {scorePct !== null && verdict && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-[#F4EFE7]/8 bg-[#20163B] text-left">
          <Sparkles className="h-4 w-4 text-[#C9972E] shrink-0 mt-0.5 animate-pulse" />
          <p className="text-xs text-[#C8C3D6] leading-relaxed">{verdict}</p>
        </div>
      )}
      {scorePct === null && isLoading && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-[#F4EFE7]/8 bg-[#20163B] text-left">
          <Sparkles className="h-4 w-4 text-[#C9972E] shrink-0 mt-0.5 animate-pulse" />
          <p className="text-xs text-[#C8C3D6] leading-relaxed">{t('dashboard.familyNoVerdict') || "Reading today's bond…"}</p>
        </div>
      )}

      {/* Footer Button */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mt-1.5 max-[400px]:flex-col">
        <Link
          href="/family"
          className="flex-1 max-[400px]:w-full rounded-xl bg-gradient-to-r from-[#C9972E] to-[#A57E23] hover:from-[#B58A2B] hover:to-[#96731F] text-white border border-[#C9972E]/30 shadow-md transition-all font-bold uppercase tracking-wider text-[10px] py-2.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          <span>{t('dashboard.familyViewBond') || "View Bond"}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const tr = useCallback(
    (key: string, fallback: string, params?: Record<string, string | number>) => {
      const translated = params ? t(key, params) : t(key);
      return translated && translated !== key ? translated : fallback;
    },
    [t]
  );
  const greeting = t(useGreeting());
  const { user, refreshProfile, isLoading: userLoading } = useAuth();
  const { tier, isLoaded: paywallLoaded, isFeatureBlocked, getFeaturePaywall } = usePaywallContext();
  const isFree = useMemo(() => (tier || 'free').toLowerCase() === 'free', [tier]);
  const [activePaywallData, setActivePaywallData] = useState<PaywallData | null>(null);
  const { data: horoscope, isLoading: horoscopeLoading, profileLocationRequired } = useDailyHoroscope();
  const { data: transits } = useTransitsToday();
  const { setSelectedAvatarId, avatars } = useChat();
  const [activeArea, setActiveArea] = useState<ForecastArea>("career");
  const [allWeeklyForecasts, setAllWeeklyForecasts] = useState<Record<ForecastArea, ForecastData | null>>({
    general: null,
    love: null,
    career: null,
    finance: null,
    health: null,
    spiritual: null,
  });
  const [allForecastsLoading, setAllForecastsLoading] = useState(false);
  const forecast = allWeeklyForecasts[activeArea];
  const forecastLoading = allForecastsLoading;
  const [isPanchangModalOpen, setIsPanchangModalOpen] = useState(false);
  const [isRahuKaalModalOpen, setIsRahuKaalModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isAdviceModalOpen, setIsAdviceModalOpen] = useState(false);
  const hasAnalyzedRef = useRef<string | null>(null);
  const [capDialog, setCapDialog] = useState<{ open: boolean; limit?: number; currentTier?: string; message?: string } | null>(null);

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
    if (
      paywallLoaded &&
      (isFree || (isFeatureBlocked('full_daily_horoscope') && getFeaturePaywall('full_daily_horoscope')))
    ) {
      setAllForecastsLoading(false);
      return;
    }
    const date = todayISO();
    // Per-user, per-lang, per-day key so a refresh restores instantly without
    // refetching (the 6-area data used to vanish on reload and re-fan-out 6
    // requests, tripping the per-user rate limit → 429s).
    const cacheKey = `astramitra_weekly_forecasts:${user?.email || "anon"}:${language}:${date}`;
    const WEEKLY_CACHE_TTL = 10 * 60 * 1000;

    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { timestamp: number; forecasts: Record<ForecastArea, ForecastData | null> };
        if (Date.now() - parsed.timestamp < WEEKLY_CACHE_TTL) {
          setAllWeeklyForecasts(parsed.forecasts);
          setAllForecastsLoading(false);
          return;
        }
      }
    } catch {
      /* corrupt/unavailable sessionStorage — fall through to fetch */
    }

    setAllForecastsLoading(true);

    const mapForecast = (area: ForecastArea, data: unknown): ForecastData | null => {
      const forecast = data as
        | {
            area?: ForecastArea;
            days?: WeeklyForecastApiDay[];
            summary?: ForecastData["summary"];
          }
        | null
        | undefined;
      if (!forecast || !Array.isArray(forecast.days)) return null;
      return {
        area: forecast.area || area,
        days: forecast.days.map((d) => ({
          date: d.date,
          is_today: d.is_today ?? (d.date === date),
          score: d.score,
          text: d.text || "",
          dominant_planet: d.dominant_planet || "",
          personalized_alerts: d.alerts || [],
          transits: d.transits,
        })),
        summary: forecast.summary || {
          best_day: "",
          worst_day: "",
          average_score: 70,
          trend: "stable",
        },
      };
    };

    (async () => {
      const emptyForecasts: Record<ForecastArea, ForecastData | null> = {
        general: null,
        love: null,
        career: null,
        finance: null,
        health: null,
        spiritual: null,
      };
      try {
        const res = await clientFetch(`/api/forecast/all/weekly?date=${date}&lang=${language}`);
        if (res.ok) {
          const payload = (await res.json()) as { forecasts?: Partial<Record<ForecastArea, unknown>> };
          const newForecasts = { ...emptyForecasts };
          AREA_LIST.forEach((area) => {
            newForecasts[area] = mapForecast(area, payload?.forecasts?.[area]);
          });
          setAllWeeklyForecasts(newForecasts);
          try {
            sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), forecasts: newForecasts }));
          } catch {
            /* sessionStorage full/unavailable - non-fatal */
          }
        } else {
          setAllWeeklyForecasts(emptyForecasts);
        }
      } catch (err) {
        console.warn("[GptDashboard] Failed to fetch weekly forecasts:", err);
        setAllWeeklyForecasts(emptyForecasts);
      } finally {
        setAllForecastsLoading(false);
      }
    })();
  }, [language, isFree, paywallLoaded, isFeatureBlocked, getFeaturePaywall, user?.email]);

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

  const userName = user?.name?.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || t("common.user");
  const overallScore = useMemo(() => {
    if (!horoscope) return 0;
    // score.overall is the backend's authoritative weighted combine
    // (general counts double). Do NOT average the six areas on the client —
    // that would diverge from the daily and the /forecast/overall numbers.
    const apiOverall = horoscope.score?.overall ?? horoscope.overall_score;
    return typeof apiOverall === "number" ? Math.round(apiOverall) : 0;
  }, [horoscope]);
  const overallPhaseHex = getAreaPhaseMain("overall", overallScore);
  // Sample-only week for the locked weekly-chart paywall preview (never shown to
  // paid users or as real data — see buildSampleWeek).
  const sampleWeek = useMemo(() => buildSampleWeek(), []);
  // Only the *initial* fetch (no data yet) should show skeletons. Once the
  // request settles we render real scores, or the graceful fallback numbers if
  // the backend returned nothing — never the fabricated 73/70 *during* loading
  // (that placeholder-then-real swap is the "wrong data then correct" flash).
  const scoreLoading = horoscopeLoading && !horoscope;
  const fullDailyHoroscopeBlocked =
    paywallLoaded && (isFree || isFeatureBlocked('full_daily_horoscope'));
  const hasWeeklyForecasts = Object.values(allWeeklyForecasts).some((f) => f !== null);
  const lifeAreasLoading =
    scoreLoading ||
    !paywallLoaded ||
    (!fullDailyHoroscopeBlocked && (allForecastsLoading || !hasWeeklyForecasts));
  const rashiLoading = userLoading || (!user?.moonSign && !user?.sunSign && !user?.lagnaSign);
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

  const allItems = useMemo(() => {
    const membersList = familyMembers || [];
    return membersList.map(m => ({ type: 'member' as const, id: String(m.id), source: m.source, data: m }));
  }, [familyMembers]);

  const slots = useMemo(() => {
    const result: Array<
      | { type: 'member'; id: string; source: 'manual' | 'linked'; data: FamilyMember }
      | { type: 'connection'; id: string; data: FamilyConnection }
      | { type: 'add'; isLocked: boolean; lockType?: 'pro' | 'premium' }
    > = [];

    const tierLower = (tier || 'free').toLowerCase();
    // Dashboard grid shows up to 6 cards. The number that are *unlocked* comes
    // from the shared familyRosterLimit spec (Free: 1, Pro: 6, Premium:
    // unlimited → clamped to 6 for the display grid). Any slot beyond the
    // unlocked limit renders as a locked "add" card driving an upgrade.
    const rosterLimit = familyRosterLimit(tier);
    const unlockedLimit = rosterLimit == null ? 6 : Math.min(rosterLimit, 6);

    for (let i = 0; i < unlockedLimit; i++) {
      if (i < allItems.length) {
        result.push(allItems[i]);
      } else {
        result.push({ type: 'add', isLocked: false });
      }
    }

    for (let i = unlockedLimit; i < 6; i++) {
      let lockType: 'pro' | 'premium' = 'premium';
      if (tierLower === 'free' && i < 3) {
        lockType = 'pro';
      }
      result.push({ type: 'add', isLocked: true, lockType });
    }

    return result;
  }, [allItems, tier]);
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
        desc: apiAvatar.description || `Get personalized guidance for your ${activeAreaLabel.toLowerCase()} journey`,
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
  }, [activeArea, avatars, activeAreaLabel]);

  const activeTrigger = useMemo(() => {
    if (!horoscope?.time_triggers || horoscope.time_triggers.length === 0) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const parseTimeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return (h || 0) * 60 + (m || 0);
    };

    const currentTriggers = horoscope.time_triggers.filter((trigger) => {
      const startMin = parseTimeToMinutes(trigger.start);
      const endMin = parseTimeToMinutes(trigger.end);
      return currentMinutes >= startMin && currentMinutes <= endMin;
    });

    if (currentTriggers.length > 0) {
      return currentTriggers[0];
    }

    const upcomingTriggers = horoscope.time_triggers
      .filter((trigger) => {
        const startMin = parseTimeToMinutes(trigger.start);
        return currentMinutes < startMin;
      })
      .sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));

    if (upcomingTriggers.length > 0) {
      return upcomingTriggers[0];
    }

    return null;
  }, [horoscope]);

  const isRahuKaalEnded = useMemo(() => {
    const rk = transits?.panchanga?.rahukaal || horoscope?.meta?.panchanga?.rahukaal;
    if (!rk || !rk.end) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [h, m] = rk.end.split(":").map(Number);
    const endMinutes = (h || 0) * 60 + (m || 0);

    return currentMinutes > endMinutes;
  }, [transits, horoscope]);

  const lifeAreas = useMemo(() => {
    const mapped = AREA_LIST.map((area) => ({
      area,
      label: resolveAreaLabel(t, area),
      score: getAreaScore(horoscope, area),
      insight: getAreaInsight(horoscope, area),
      theme: AREA_THEMES[area],
    }));

    const generalItem = mapped.find((item) => item.area === "general");
    const otherItems = mapped
      .filter((item) => item.area !== "general")
      .sort((a, b) => b.score - a.score);

    return generalItem ? [generalItem, ...otherItems] : otherItems;
  }, [horoscope, t]);

  const stabilitySortedAreas = useMemo(() => {
    const list = AREA_LIST.map((area) => {
      const forecastData = allWeeklyForecasts[area];
      if (!forecastData || !forecastData.days || forecastData.days.length === 0) {
        return { area, diff: 70 };
      }
      
      const scores = forecastData.days.map((d) => d.score);
      const sum = scores.reduce((a, b) => a + b, 0);
      const weeklyAvg = sum / scores.length;
      
      const absDeviations = scores.map((s) => Math.abs(s - weeklyAvg));
      const sumDeviations = absDeviations.reduce((a, b) => a + b, 0);
      const meanAbsDeviation = sumDeviations / scores.length;
      
      return { area, diff: meanAbsDeviation };
    });

    // Sort by absolute weekly deviation ascending (lower deviation is more stable)
    return list.sort((a, b) => a.diff - b.diff).map((item) => item.area);
  }, [allWeeklyForecasts]);

  const dashboardLifeAreas = useMemo(() => {
    if (lifeAreas.length === 0) return [];

    const sortedScores = [...lifeAreas].sort((a, b) => b.score - a.score);
    const bestItem = sortedScores[0];
    const worstItem = sortedScores[sortedScores.length - 1];

    const middleItem = sortedScores[Math.floor((sortedScores.length - 1) / 2)];
    const stableAreaName = fullDailyHoroscopeBlocked
      ? middleItem?.area
      : stabilitySortedAreas.find(
          (area) => area !== bestItem?.area && area !== worstItem?.area
        );

    const stableItem = lifeAreas.find((item) => item.area === stableAreaName);

    const result = [];

    // 1. Best Card (Left)
    if (bestItem) {
      result.push({
        ...bestItem,
        badge: SIGNAL_BADGES.BEST.label,
        arrow: "up",
        badgeColor: `text-[${SIGNAL_BADGES.BEST.main}] bg-[${SIGNAL_BADGES.BEST.bg}] border-[${SIGNAL_BADGES.BEST.border}]`,
        badgeStyle: { color: SIGNAL_BADGES.BEST.main, backgroundColor: SIGNAL_BADGES.BEST.bg, borderColor: SIGNAL_BADGES.BEST.border },
      });
    }

    if (stableItem) {
      result.push({
        ...stableItem,
        badge: SIGNAL_BADGES.STABLE.label,
        arrow: "side",
        badgeColor: `text-[${SIGNAL_BADGES.STABLE.main}] bg-[${SIGNAL_BADGES.STABLE.bg}] border-[${SIGNAL_BADGES.STABLE.border}]`,
        badgeStyle: { color: SIGNAL_BADGES.STABLE.main, backgroundColor: SIGNAL_BADGES.STABLE.bg, borderColor: SIGNAL_BADGES.STABLE.border },
      });
    }

    if (worstItem && worstItem.area !== bestItem?.area) {
      result.push({
        ...worstItem,
        badge: SIGNAL_BADGES.WORST.label,
        arrow: "down",
        badgeColor: `text-[${SIGNAL_BADGES.WORST.main}] bg-[${SIGNAL_BADGES.WORST.bg}] border-[${SIGNAL_BADGES.WORST.border}]`,
        badgeStyle: { color: SIGNAL_BADGES.WORST.main, backgroundColor: SIGNAL_BADGES.WORST.bg, borderColor: SIGNAL_BADGES.WORST.border },
      });
    }

    return result;
  }, [fullDailyHoroscopeBlocked, lifeAreas, stabilitySortedAreas]);

  // Set default activeArea to the Stable area on load
  const hasSetDefaultActiveRef = useRef(false);
  useEffect(() => {
    if (hasSetDefaultActiveRef.current) return;
    if (!horoscope || lifeAreas.length === 0) return;

    const sortedScores = [...lifeAreas].sort((a, b) => b.score - a.score);
    const bestItem = sortedScores[0];
    const worstItem = sortedScores[sortedScores.length - 1];
    const stableAreaName = fullDailyHoroscopeBlocked
      ? sortedScores[Math.floor((sortedScores.length - 1) / 2)]?.area
      : stabilitySortedAreas.find(
          (area) => area !== bestItem?.area && area !== worstItem?.area
        );

    if (
      stableAreaName &&
      (fullDailyHoroscopeBlocked || (!allForecastsLoading && hasWeeklyForecasts))
    ) {
      setActiveArea(stableAreaName);
      hasSetDefaultActiveRef.current = true;
    }
  }, [
    allForecastsLoading,
    fullDailyHoroscopeBlocked,
    hasWeeklyForecasts,
    stabilitySortedAreas,
    lifeAreas,
    horoscope,
  ]);

  const activeAreaHex = useMemo(() => {
    return AREA_THEMES[activeArea].hex;
  }, [activeArea]);

  const activeAreaInsight = useMemo(() => {
    const rawInsight = getAreaInsight(horoscope, activeArea);
    if (!rawInsight) return "";
    const dotIndex = rawInsight.indexOf(".");
    if (dotIndex === -1) return rawInsight;
    return rawInsight.substring(0, dotIndex + 1);
  }, [horoscope, activeArea]);

  const activeAreaNotes = useMemo(() => {
    if (activeArea === "general") {
      return horoscope?.current_state?.derived_from || [];
    }
    const notes = horoscope?.areas_text?.[activeArea as keyof typeof horoscope.areas_text]?.personal_notes;
    return Array.isArray(notes) ? notes : [];
  }, [horoscope, activeArea]);

  const activeAreaTone = useMemo(() => {
    if (activeArea === "general") return "neutral";
    return horoscope?.areas_text?.[activeArea as keyof typeof horoscope.areas_text]?.tone || "neutral";
  }, [horoscope, activeArea]);

  const activeAreaAction = useMemo(() => getAreaAction(horoscope, activeArea), [horoscope, activeArea]);

  const topLifeArea = [...lifeAreas].sort((a, b) => b.score - a.score)[0];
  const rawHeadline =
    horoscope?.alerts?.primary?.simple ||
    "Your current planetary period is on your side - act on the bigger plan now.";
  const headline =
    rawHeadline === "Your current planetary period is on your side - act on the bigger plan now."
      ? t('newDashboard.todaysEnergy.defaultHeadline')
      : rawHeadline;

  if (profileLocationRequired && !horoscope) {
    return (
      <div className="min-h-[calc(100dvh-var(--navbar-height,64px)-100px)] bg-background px-4 py-10 text-foreground">
        <DarkPanel className="mx-auto max-w-xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10">
            <ShieldAlert className="h-7 w-7 text-secondary" />
          </div>
          <h1 className="font-headline text-2xl font-bold tracking-tight leading-tight">Exact birth location required</h1>
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
    <div className="gpt-dashboard-shell safe-bottom-buffer relative min-h-[calc(100dvh-var(--navbar-height,64px)-100px)] overflow-x-hidden bg-transparent text-foreground">
      {/* Custom local background particles and gradients removed to follow the global layout background */}

      <div className="relative z-10 mx-auto max-w-[1760px] px-4 py-4 max-[360px]:px-3 sm:px-6 sm:py-6 lg:px-8 2xl:max-w-[2100px] 3xl:max-w-[2400px]">
        <header className="mb-6 grid gap-5 max-[360px]:gap-3 xl:grid-cols-[minmax(0,1fr)_580px] xl:items-center">
          {/* Column 1: Left Column with 2 Rows */}
          <div className="flex flex-col gap-2 w-full">
            {/* Row 1: Date/Panchang & Career Score */}
            <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 w-full pb-1">
              <div className="flex flex-wrap items-center gap-3 label-sm text-foreground/58">
                <span aria-hidden="true" className="h-px w-12 bg-secondary/50" />
                <span>{currentDate}</span>
              </div>
              <div>
                {scoreLoading ? (
                  <div className="h-5 w-64 animate-pulse rounded bg-surface-variant/[0.06]" />
                ) : topLifeArea && (
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                    {topLifeArea.score >= 80
                      ? <>{topLifeArea.label} {t('newDashboard.todaysEnergy.topAreaStrongest')} <span className="font-black" style={{ color: '#2FD3A0' }}>{topLifeArea.score}%</span></>
                      : <>{t('newDashboard.todaysEnergy.topAreaFocus')}: <span className="font-black" style={{ color: AREA_THEMES[topLifeArea.area].hex }}>{topLifeArea.label}</span> · <span className="font-black" style={{ color: '#2FD3A0' }}>{topLifeArea.score}%</span></>
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Greeting */}
            <div className="flex items-center gap-4 w-full">
              <ProfileImageUpload size={52} className="hidden sm:flex" editable={false} />
              <h1 className="font-headline text-[30px] font-bold leading-tight tracking-tight break-words max-[360px]:text-[24px] sm:text-[42px] 3xl:text-[56px]">
                {greeting},{" "}
                <span style={{ color: TEXT_COLORS.heading }}>
                  {userLoading ? "..." : userName}
                </span>
              </h1>
            </div>
          </div>

          {/* Column 2: Right Column with Rashis Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:min-w-[360px] xl:max-w-[580px]">
            {rashiLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 rounded-xl border border-[#C4B5FD]/10 bg-[#130B29] px-1.5 py-1 text-center sm:min-w-[110px] sm:flex-row sm:gap-2.5 sm:px-2.5 sm:text-left animate-pulse"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#130B29] border border-[#C9972E]/20 sm:h-[38px] sm:w-[38px]" />
                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="h-1 w-8 rounded bg-[#C9972E]/20" />
                    <div className="h-2.5 w-12 rounded bg-[#F4EFE7]/10" />
                  </div>
                </div>
              ))
            ) : (
              [
                { label: t('dashboard.moonSign'), data: moonSign, fallback: "Leo" },
                { label: t('dashboard.sunSign'), data: sunSign, fallback: "Libra" },
                { label: t('dashboard.ascendant'), data: ascendantSign, fallback: "Leo" },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.data?.id ? `/rashis?sign=${item.data.id}` : "/rashis"}
                  aria-label={`${item.label}: ${item.data?.name || item.fallback}`}
                  className="group flex flex-col items-center gap-1 rounded-xl border border-[#C4B5FD]/10 bg-[#130B29] px-1.5 py-1 text-center transition hover:border-[#C9972E]/28 sm:min-w-[110px] sm:flex-row sm:gap-2.5 sm:px-2.5 sm:text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#C9972E]/25 bg-[#130B29] sm:h-[38px] sm:w-[38px]">
                    {item.data?.icon ? (
                      <Image src={item.data.icon} alt={item.data.name} width={24} height={24} className="h-5.5 w-5.5 object-contain sm:h-6.5 sm:w-6.5" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-[#C9972E] sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#928BA5] sm:text-[8.5px]">{item.label}</p>
                    <p className="mt-0.5 truncate font-headline text-xs font-bold text-[#F4EFE7] sm:text-[14.5px]">{item.data?.name || item.fallback}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </header>

        {scoreLoading ? (
          <DailyHoroscopeCardSkeleton />
        ) : (
          <div className="relative z-10 grid gap-6 min-[1280px]:grid-cols-2 min-[1280px]:items-start">
            {/* Left Card: Your Day Today */}
            <DarkPanel 
              className="py-4.5 px-4 sm:py-5.5 sm:px-5 flex flex-col gap-4"
              borderVariant="glow-premium"
            >
              <div className="flex flex-col gap-4 w-full">
              {/* Combined Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
                <div>
                  <h2 className={DASHBOARD_SECTION_TITLE_CLASS}>
                    Your Day Today
                  </h2>
                </div>
                
                {/* Lucky items & Mood - smaller than header */}
                <div className="flex flex-wrap items-center gap-2 text-[13px] max-[360px]:text-[11px] font-bold text-[#C8C3D6] justify-center md:justify-end">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9972E]/12 bg-[#241744] px-2.5 py-1">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-br from-purple-400 to-purple-700" />
                    {t('newDashboard.cosmicInsight.luckyColor')}: {(horoscope?.lucky?.color || horoscope?.lucky_color) ?? "Deep Purple"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9972E]/12 bg-[#241744] px-2.5 py-1">
                    <Star className="h-3 w-3 text-[#C9972E]" />
                    {t('newDashboard.cosmicInsight.luckyNumber')}: {(horoscope?.lucky?.number ?? horoscope?.lucky_number) ?? "7"}
                  </span>
                  {horoscope?.mood && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9972E]/12 bg-[#241744] px-2.5 py-1">
                      <span className="h-2 w-2 rounded-full bg-[#9B6DDE]" />
                      Cosmic Mood: {typeof horoscope.mood === 'object' ? horoscope.mood.value : horoscope.mood}
                    </span>
                  )}
                </div>
              </div>

              {/* Left Side Content */}
              <div className="flex-grow flex flex-col gap-3">
                {/* Headline + [Tree with Score | Guidance] */}

                  <div className="flex flex-col gap-3">

                    {/* Overall Score — mobile only (placed before headline) */}
                    <button
                      type="button"
                      onClick={() => router.push("/horoscope/forecast?area=overall")}
                      aria-label={`${t('newDashboard.todaysEnergy.title')} — overall ${overallScore}. View overall forecast`}
                      title="View overall forecast"
                      className="flex lg:hidden flex-col items-center justify-center gap-3 py-4 cursor-pointer group"
                    >
                      <RingScore score={overallScore} color={overallPhaseHex} size={120} className="w-[min(54vw,160px)]" />
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.16em]"
                        style={{
                          color: STATUS_COLORS[getScorePhase(overallScore)].main,
                          backgroundColor: STATUS_COLORS[getScorePhase(overallScore)].bg,
                          borderColor: STATUS_COLORS[getScorePhase(overallScore)].border,
                        }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[getScorePhase(overallScore)].main }} />
                        {scoreBand}
                      </span>
                    </button>

                    {/* Headline + Advice — spans full width */}
                    <div className="px-1">
                      <h2 className="font-headline text-xl font-bold leading-tight tracking-tight sm:text-2xl">{headline}</h2>
                      {horoscope?.current_state?.advice_now && (
                        <button
                          onClick={() => setIsAdviceModalOpen(true)}
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary hover:text-secondary/80 transition-colors cursor-pointer text-left w-fit"
                        >
                          Today&apos;s Advice for You <ArrowRight className="inline h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Row: Cosmic Tree | Guidance box */}
                    <div className="grid flex-grow gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-stretch">
                      {/* Overall Score — desktop only (mobile renders it at the top of this section) */}
                      <button
                        type="button"
                        onClick={() => router.push("/horoscope/forecast?area=overall")}
                        aria-label={`${t('newDashboard.todaysEnergy.title')} — overall ${overallScore}. View overall forecast`}
                        title="View overall forecast"
                        className="hidden lg:flex flex-col items-center justify-center gap-3 h-full cursor-pointer group"
                      >
                        <RingScore
                          score={overallScore}
                          color={overallPhaseHex}
                          size={150}
                          className="w-full max-w-[200px] xl:max-w-[225px] 2xl:max-w-[255px] min-[1920px]:max-w-[290px]"
                        />
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] xl:text-xs font-black uppercase tracking-[0.16em]"
                          style={{
                            color: STATUS_COLORS[getScorePhase(overallScore)].main,
                            backgroundColor: STATUS_COLORS[getScorePhase(overallScore)].bg,
                            borderColor: STATUS_COLORS[getScorePhase(overallScore)].border,
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[getScorePhase(overallScore)].main }} />
                          {scoreBand}
                        </span>
                      </button>

                      {/* Guidance bordered box */}
                      <div className="flex flex-col gap-3 rounded-2xl border border-purple-400/15 bg-surface-variant/[0.05] p-4 h-full">
                        <p className="label-secondary">Guidance For Today</p>
                        <p className="text-sm leading-relaxed text-foreground/75">
                          {horoscope?.guidance?.summary || (
                            <span className="italic text-foreground/40">Personalized guidance will appear here soon.</span>
                          )}
                        </p>

                        {/* Best For / Avoid / Approach mini-cards (horizontal) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="flex items-center gap-2.5 rounded-xl border border-[#2FD3A0]/20 bg-[#2FD3A0]/4 p-2.5">
                            <Target className="h-5 w-5 shrink-0 text-[#2FD3A0]" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-[#928BA5]">Best For:</p>
                              <p className="truncate text-xs font-bold text-[#F4EFE7]">{horoscope?.guidance?.best_for || "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 rounded-xl border border-[#F05B68]/20 bg-[#F05B68]/4 p-2.5">
                            <Ban className="h-5 w-5 shrink-0 text-[#F05B68]" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-[#928BA5]">Avoid:</p>
                              <p className="truncate text-xs font-bold text-[#F4EFE7]">{horoscope?.guidance?.avoid || "—"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5 rounded-xl border border-[#9B6DDE]/20 bg-[#9B6DDE]/4 p-2.5">
                            <Flower2 className="h-5 w-5 shrink-0 text-[#9B6DDE]" />
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold text-[#928BA5]">Approach:</p>
                              <p className="truncate text-xs font-bold text-[#F4EFE7]">{horoscope?.guidance?.approach || "—"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Choose AI Astrologer CTA — gold color preserved */}
                        <button
                          onClick={() => {
                            if (isFeatureBlocked('chat_message') && getFeaturePaywall('chat_message')) {
                              setActivePaywallData(getFeaturePaywall('chat_message')!);
                              return;
                            }
                            localStorage.removeItem("astramitra_pending_message");
                            router.push("/chat");
                          }}
                          className="mt-auto w-full flex items-center gap-3 max-[360px]:gap-2 rounded-2xl border border-[#C9972E]/25 bg-[#B88924] py-3 px-4 max-[360px]:px-3 text-left text-[#1A0E32] hover:bg-[#C9972E] transition duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C9972E]/50"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1A0E32]/10 text-[#1A0E32]">
                            <Sparkles className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-grow">
                            <h4 className="text-sm font-bold text-[#1A0E32]">Choose AI Astrologer to Talk</h4>
                            <p className="mt-0.5 truncate text-[11px] text-[#1A0E32]/80">Talk to your personal guide.</p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-[#1A0E32]/70 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>

                {/* Good Time & Rahu Kaal Cards */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-surface-variant/[0.035] py-3 px-4 text-left">
                    <div className="flex items-start gap-4 max-[360px]:gap-2 w-full border border-[#C9972E]/15 bg-[#130B29] rounded-2xl p-4">
                      <Sun className="h-8 w-8 shrink-0 text-[#2FD3A0]" />
                      <div className="flex-grow min-w-0">
                        <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#2FD3A0] mb-2">{t('newDashboard.todaysEnergy.goodTime')}</p>
                        {activeTrigger ? (
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold text-sm text-[#F4EFE7]">{activeTrigger.label}</span>
                                <span className="text-[11px] font-black text-[#2FD3A0] bg-[#2FD3A0]/10 px-2 py-0.5 rounded-full shrink-0">{activeTrigger.start} - {activeTrigger.end}</span>
                              </div>
                              <p className="mt-1 text-xs text-[#C8C3D6] leading-normal">{activeTrigger.advice}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="mt-2 text-lg font-bold text-[#F4EFE7]">19:00 - 20:00</p>
                            <p className="mt-1 text-sm leading-6 text-[#C8C3D6]">{t('newDashboard.todaysEnergy.goodTimeDesc')}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-surface-variant/[0.035] py-3 px-4 text-left">
                    <div className="flex items-start gap-4 max-[360px]:gap-2 w-full border border-[#C9972E]/15 bg-[#130B29] rounded-2xl p-4">
                      <AlertTriangle className="h-8 w-8 shrink-0 fill-[#F05B68]/15 text-[#F05B68]" />
                      <div className="flex-grow min-w-0 ">
                        <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#F05B68] mb-2">
                          {`${t('newDashboard.panchang.rahuKaal')} / ${t('newDashboard.todaysEnergy.alertTime')}`}
                        </p>
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-sm text-[#F4EFE7]">{t('newDashboard.panchang.rahuKaal')}</span>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            isRahuKaalEnded
                              ? "text-[#928BA5] bg-[#241744]"
                              : "text-[#F05B68] bg-[#F05B68]/10"
                          }`}>
                            {formatRahuKaal(transits, horoscope)}
                          </span>
                        </div>
                        {horoscope?.alerts?.secondary && horoscope.alerts.secondary.length > 0 ? (
                          <div className="mt-3">
                            <button
                              onClick={() => setIsRahuKaalModalOpen(true)}
                              className="text-[11px] font-bold uppercase tracking-wider text-[#F05B68] hover:text-[#F05B68]/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Details</span>
                              <ChevronRight className="h-3.5 w-3.5 text-[#F05B68] shrink-0" />
                            </button>
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-[#C8C3D6] leading-normal">{t('newDashboard.todaysEnergy.cautionTimeDesc')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
              </div>
            </DarkPanel>

            {/* Right Card: Your Life Areas */}
          <DarkPanel
            className="py-3.5 px-4 sm:py-4.5 sm:px-5 flex flex-col gap-4"
            borderVariant="gradient-cosmic"
            >
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-4">
              {/* Sub-header for Current Week */}
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-2">
                <div>
                  <h2 className={DASHBOARD_SECTION_TITLE_CLASS}>
                    {t('newDashboard.currentWeek.title') || "Your Life Areas"}
                  </h2>
                  <p className={DASHBOARD_SECTION_SUBTITLE_CLASS}>
                    Today&apos;s strongest and weakest signals
                  </p>
                </div>
                <Link
                  href="/lifeareas"
                  className="shrink-0 text-[10px] font-black uppercase tracking-[0.12em] px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                  style={{
                    color: BRAND_GOLD.main,
                    borderColor: BRAND_GOLD.border,
                    backgroundColor: BRAND_GOLD.soft,
                  }}
                >
                  <span>View All</span>
                  <ArrowRight className="h-3 w-3" style={{ color: BRAND_GOLD.main }} />
                </Link>
              </div>

              {/* Life Areas grid acting as the activeArea selector */}
              {lifeAreasLoading ? (
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-variant/[0.04] border border-outline-variant/8" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {dashboardLifeAreas.map(({ area, label, score, theme, badge, badgeStyle, arrow }) => {
                    const Icon = theme.icon;
                    const cardColorHex = AREA_THEMES[area].hex;
                    const isLucide = area === "general" || area === "spiritual";
                    const isSelected = activeArea === area;
                    return (
                      <button
                        key={area}
                        data-testid={`dashboard-life-area-${area}`}
                        onClick={() => setActiveArea(area)}
                        className={`group flex flex-col items-center rounded-2xl border py-2 px-1.5 sm:py-2.5 sm:px-3 text-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${
                          isSelected
                            ? "bg-[#21153C] text-[#F4EFE7]"
                            : "border-white/20 bg-surface/80 text-[#F4EFE7]/75 hover:border-white/40 hover:bg-surface-variant"
                        }`}
                        style={{
                          borderColor: isSelected ? `${cardColorHex}73` : undefined,
                          boxShadow: isSelected ? `0 0 18px ${cardColorHex}14` : undefined,
                        }}
                      >
                        <div className={isSelected ? "opacity-100" : "opacity-60"}>
                          <AreaRing score={score} color={cardColorHex} label={label}>
                            <span
                              className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center overflow-hidden rounded-full"
                              style={{ color: cardColorHex }}
                            >
                              <Icon className={isLucide ? "h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" : "h-4.5 w-4.5 sm:h-5 sm:w-5 object-cover"} />
                            </span>
                            <span className="text-sm sm:text-base font-black leading-none tabular-nums" style={{ color: cardColorHex }}>
                              {score}
                            </span>
                          </AreaRing>
                        </div>
                        <p className="mt-2 font-headline text-xs font-bold leading-tight">{label}</p>
                        {badge && (
                          <span className={`mt-1.5 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.06em] px-1.5 py-0.5 rounded border ${isSelected ? 'opacity-100' : 'opacity-60'}`} style={badgeStyle}>
                            {arrow === "up" && <span className="text-[9px] leading-none">▲</span>}
                            {arrow === "side" && <span className="text-[9px] leading-none">◆</span>}
                            {arrow === "down" && <span className="text-[9px] leading-none">▼</span>}
                            <span>{badge}</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                  </div>
                )}
                </div>

                {/* Grid layout: Insight on Left, Chart on Right (40% / 60% ratio) */}
                <div className="grid gap-4 lg:grid-cols-[2fr_3fr] lg:items-start pt-0 mt-3">
                  {/* Left Column: Selected Area Insight */}
                  <div className="relative space-y-3 text-left bg-surface-variant/[0.035] py-3 px-4 rounded-2xl min-h-[150px]">
                    {isFeatureBlocked('full_daily_horoscope') && getFeaturePaywall('full_daily_horoscope') ? (
                      <LockedPreview
                        className="min-h-[170px]"
                        message={tr('paywall.unlockInsight', "Unlock to read your personalized insight")}
                        ctas={[
                          {
                            label: tr('newDashboard.todaysEnergy.openForecast', `Open ${activeAreaLabel} Forecast`, { area: activeAreaLabel }),
                            href: `/plans?feature=full_daily_horoscope`,
                          },
                          {
                            label: tr('newDashboard.todaysEnergy.personalNotesBtn', "Personalized Notes"),
                            href: `/plans?feature=full_daily_horoscope`,
                          },
                        ]}
                      >
                        {/* Sample (non-real) faded insight lines — scoped to paywall only. */}
                        <div className="space-y-2.5 py-1">
                          <p className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: activeAreaHex }}>
                            {activeAreaLabel} {t('newDashboard.insight') || "Insight"}
                          </p>
                          <p className="text-sm leading-relaxed text-foreground/75">
                            Practice giving without a fixed expectation. Spending energy on patterns keeps the night calm and your focus steady.
                          </p>
                        </div>
                      </LockedPreview>
                    ) : lifeAreasLoading ? (
                      <div className="space-y-2">
                        <div className="h-3.5 w-24 rounded bg-surface-variant/20 animate-pulse" />
                        <div className="h-2 w-full rounded bg-surface-variant/20 animate-pulse" />
                        <div className="h-2 w-full rounded bg-surface-variant/20 animate-pulse" />
                        <div className="h-2 w-2/3 rounded bg-surface-variant/20 animate-pulse" />
                      </div>
                    ) : activeAreaInsight ? (
                      <>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-[0.15em] mb-2" style={{ color: activeAreaHex }}>
                            {activeAreaLabel} {t('newDashboard.insight') || "Insight"}
                          </h4>
                          <p className="text-sm leading-relaxed text-foreground/75">
                            {activeAreaInsight}
                          </p>
                          {activeAreaAction && (
                            <div className="mt-2.5 flex items-start gap-2 rounded-xl border px-3 py-2" style={{ borderColor: `${activeAreaHex}33`, backgroundColor: `${activeAreaHex}0d` }}>
                              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: activeAreaHex }} />
                              <p className="text-xs leading-relaxed text-foreground/80">
                                <span className="font-black uppercase tracking-wider" style={{ color: activeAreaHex }}>{tr('newDashboard.todaysEnergy.actionLabel', "Do this")}: </span>
                                {activeAreaAction}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="mt-auto pt-2 flex flex-row gap-3 w-full">
                          {(activeAreaNotes.length > 0 || activeAreaTone) && (
                          <button
                            onClick={() => setIsNotesModalOpen(true)}
                            className="w-full flex items-center justify-center gap-1.5 text-center rounded-xl border border-[#F4EFE7]/15 bg-[#241744] px-3 py-2.5 text-[11px] font-black uppercase tracking-wider text-[#C8C3D6] transition-all hover:bg-[#2a1d45] cursor-pointer"
                          >
                            {t('newDashboard.todaysEnergy.personalNotesBtn') || "Personalized Notes"}
                            <ChevronRight className="h-3.5 w-3.5 text-[#928BA5]" />
                          </button>
                          )}
                        </div>
                         {/* Right Card: Ask Navi / Arya / Meera / Anand / Vidya / Rishi */}
                         <button
                           onClick={() => {
                             if (isFeatureBlocked('chat_message') && getFeaturePaywall('chat_message')) {
                               setActivePaywallData(getFeaturePaywall('chat_message')!);
                               return;
                             }
                             setSelectedAvatarId(activeAvatar.avatarId);
                             localStorage.setItem(
                               "astramitra_pending_message",
                               `I want to consult with ${activeAvatar.name} about my ${activeAreaLabel.toLowerCase()} area.`
                             );
                             router.push("/chat");
                           }}
                            className="group relative w-full flex flex-col gap-2 rounded-2xl border border-[var(--area-color)]/35 bg-[#21153C] py-3 px-4 max-[360px]:px-3 text-left transition hover:bg-[var(--area-color)]/12 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--area-color)]/50"
                           style={{ '--area-color': activeAreaHex } as React.CSSProperties}
                         >
                           <div className="flex items-center justify-between gap-2">
                             <span className="inline-flex items-center gap-1 text-[10px] font-black text-[var(--area-color)] uppercase tracking-wide">
                               Recommended
                             </span>
                             <ArrowRight className="h-4 w-4 text-[var(--area-color)] shrink-0 transition-transform group-hover:translate-x-0.5" />
                           </div>
                           <div className="flex items-center gap-3 min-w-0">
                             <div className="flex flex-col items-center shrink-0">
                               <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[var(--area-color)]/30">
                                 <Image
                                   src={activeAvatar.imageUrl}
                                   alt={activeAvatar.name}
                                   fill
                                   className="object-cover"
                                 />
                               </div>
                               <span className="mt-1 text-[12px] font-bold leading-none text-[#AFA8C0]">
                                 {activeAvatar.name}
                               </span>
                             </div>
                             <div className="min-w-0">
                                <h4 className="font-bold text-lg max-[360px]:text-base text-[#F4EFE7] break-words">
                                  Ask me about {activeAreaLabel}
                                </h4>
                                <p className="text-[13px] max-[360px]:text-xs text-[#AFA8C0]">Talk to your personal guide.</p>
                             </div>
                           </div>
                         </button>
                      </>
                    ) : (
                      <p className="text-sm text-foreground/50 italic">
                        Select an area below to view insights.
                      </p>
                    )}
                  </div>

                  {/* Right Column: Weekly Chart */}
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <h4 className="text-xs font-black uppercase tracking-[0.15em] text-secondary text-left">
                        {t('newDashboard.currentWeekChartTitle') || "Current Week"}
                      </h4>
                      <Link
                        href={`/horoscope/forecast?area=${activeArea}`}
                        className="shrink-0 flex items-center justify-center text-center rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all"
                        style={{
                          color: activeAreaHex,
                          borderWidth: "1px",
                          borderStyle: "solid",
                          borderColor: `${activeAreaHex}4d`,
                          backgroundColor: `${activeAreaHex}0d`,
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${activeAreaHex}1a`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = `${activeAreaHex}0d`; }}
                      >
                        {t('newDashboard.todaysEnergy.openForecast', { area: activeAreaLabel }) || `Open ${activeAreaLabel} Forecast`}
                      </Link>
                    </div>
                    <div className="relative rounded-2xl overflow-hidden w-full bg-surface-variant/[0.035] px-4 py-4 min-h-[230px] flex flex-col justify-center">
                      {isFeatureBlocked('full_daily_horoscope') && getFeaturePaywall('full_daily_horoscope') ? (
                        <LockedPreview
                          compact
                          className="min-h-[190px]"
                          message={tr('paywall.unlockWeeklyTrend', "Unlock to see your 7-day trend")}
                          ctas={[{ label: tr('paywall.viewPlans', "View Plans"), href: `/plans?feature=full_daily_horoscope` }]}
                        >
                          {/* Sample (non-real) preview curve — scoped to the paywall only. */}
                          <WeeklyOutlookChart
                            days={sampleWeek}
                            colorHex={AREA_THEMES[activeArea].hex}
                            areaLabel={resolveAreaLabel(t, activeArea)}
                            lockedPreview
                          />
                        </LockedPreview>
                      ) : forecastLoading || !forecast ? (
                        <div className="h-[180px] animate-pulse rounded-2xl bg-surface-variant/[0.04]" />
                      ) : (
                        <WeeklyOutlookChart days={forecast.days} colorHex={AREA_THEMES[activeArea].hex} areaLabel={resolveAreaLabel(t, activeArea)} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
          </DarkPanel>
          </div>
        )}
      </div>

      {/* FAMILY + CHART SNAPSHOT — 2 Column Row */}
      <div className="relative z-10 mx-auto max-w-[1760px] px-4 sm:px-6 lg:px-8 2xl:max-w-[2100px] 3xl:max-w-[2400px]">
        <div className="grid grid-cols-1 gap-6 min-[1280px]:grid-cols-[3fr_2fr] min-[1280px]:items-stretch">

          {/* LEFT — Family Compatibility */}
          <DarkPanel
            className="p-4 sm:p-6 flex flex-col gap-4 !bg-[var(--panel-bg)]"
            borderVariant="muted"
          >
            <div className="flex flex-col gap-4 w-full">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 max-[400px]:flex-col max-[400px]:items-stretch max-[400px]:gap-3">
                <div className="flex items-center gap-3 min-w-0 max-[400px]:justify-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#C9972E]/10 border border-[#C9972E]/25">
                    <Users className="h-5 w-5 text-[#C9972E]" />
                  </div>
                  <div className="min-w-0 max-[400px]:text-center">
                    <h2 className="font-headline text-xl font-bold leading-tight tracking-tight text-[#F4EFE7]">
                      <span className="md:hidden">{t('newDashboard.familyFriends.compatibilityTitleShort') || "Family"}</span>
                      <span className="hidden md:inline">{t('newDashboard.familyFriends.compatibilityTitle') || "Your Compatibility with Friends & Family Today"}</span>
                    </h2>
                    <p className="text-[9px] text-[#928BA5] mt-0.5 uppercase tracking-[0.14em] font-bold">
                      <span className="md:hidden">{t('newDashboard.familyFriends.compatibilitySubtitleShort') || "Bonds & alignment"}</span>
                      <span className="hidden md:inline">{t('newDashboard.familyFriends.compatibilitySubtitle') || "Cosmic bonds & energy alignment"}</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4 shrink-0 max-[400px]:justify-center">
                  <button
                    onClick={() => {
                      if (isFree && allItems.length >= 1) {
                        setCapDialog({ open: true, currentTier: tier ?? undefined, limit: 1 });
                      } else if (tier?.toLowerCase() === 'pro' && allItems.length >= 6) {
                        setCapDialog({ open: true, currentTier: tier ?? undefined, limit: 6 });
                      } else {
                        router.push('/family');
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#C9972E] hover:text-[#C9972E]/80 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('newDashboard.familyFriends.addMember') || "Add Member"}</span>
                    <span className="sm:hidden">{t('family.addShort') || "Add"}</span>
                  </button>
                  <span className="h-3 w-px bg-[#F4EFE7]/15" aria-hidden="true" />
                  <Link
                    href="/family"
                    aria-label={t('newDashboard.familyFriends.title') || 'View all family'}
                    className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#C8C3D6] hover:text-[#C9972E] transition-colors"
                  >
                    {t('newDashboard.lifeAreas.viewAll') || "View All"} <ArrowRight className="inline h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {familyLoading && !familyMembers ? (
                  [0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-[#F4EFE7]/6 bg-[#180F32] animate-pulse">
                      <div className="flex flex-col items-center gap-2.5 shrink-0">
                        <div className="h-12 w-12 rounded-full bg-[#20163B]" />
                        <div className="h-4 w-12 rounded bg-[#20163B]" />
                      </div>
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-3 w-28 rounded bg-[#20163B]" />
                        <div className="h-2 w-16 rounded bg-[#20163B]" />
                        <div className="h-5 w-full rounded bg-[#20163B] mt-2" />
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {slots.map((slot, index) => {
                      if (slot.type === 'member') {
                        return (
                          <DashboardFamilyMemberCard
                            key={`m-${slot.source}-${slot.id}`}
                            member={slot.data}
                            t={t}
                          />
                        );
                      } else if (slot.type === 'connection') {
                        return (
                          <DashboardConnectionCard
                            key={`c-${slot.id}`}
                            connection={slot.data}
                            t={t}
                          />
                        );
                      } else {
                        return (
                          <DashboardAddMemberCard
                            key={`add-${index}`}
                            isLocked={slot.isLocked}
                            lockType={slot.lockType}
                            onClick={() => {
                              if (slot.isLocked) {
                                if (slot.lockType === 'pro') {
                                  setCapDialog({
                                    open: true,
                                    currentTier: tier ?? undefined,
                                    limit: 3,
                                    message: "Upgrade to Pro to unlock up to 3 family members, or Premium for unlimited access."
                                  });
                                } else {
                                  setCapDialog({
                                    open: true,
                                    currentTier: tier ?? undefined,
                                    limit: 6,
                                    message: "Upgrade to Premium to unlock all 6 family slots on your dashboard and enjoy unlimited cosmic bonds."
                                  });
                                }
                              } else {
                                router.push('/family');
                              }
                            }}
                          />
                        );
                      }
                    })}
                  </>
                )}
              </div>
            </div>
          </DarkPanel>

          {/* RIGHT — Chart Snapshot (40%) */}
          <DarkPanel 
            className="p-6 flex flex-col justify-between !bg-[var(--panel-bg)]"
            borderVariant="muted"
          >
            <div className="flex flex-col gap-4 w-full h-full justify-between">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <Orbit className="h-5 w-5 text-[#C9972E]" />
                  </div>
                  <h2 className={DASHBOARD_SECTION_TITLE_CLASS}>{t('newDashboard.chartSnapshot')}</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    ...(mahadashaSub
                      ? [{ label: t('newDashboard.myChart.mahadasha') || "Major period", sublabel: mahadashaSub, subtext: mahadashaRange, requiresFeature: 'kundli_premium' as PaywallFeatureKey }]
                      : horoscope?.planetary?.active_dasha
                        ? [{ label: t('newDashboard.myChart.mahadasha') || "Major period", sublabel: horoscope.planetary.active_dasha, requiresFeature: 'kundli_premium' as PaywallFeatureKey }]
                        : [{ label: t('newDashboard.myChart.mahadasha') || "Major period", sublabel: "Calculating…" }]),
                    ...(antardashaSub
                      ? [{ label: t('newDashboard.myChart.antardasha') || "Sub-period", sublabel: antardashaSub, subtext: antardashaRange, requiresFeature: 'kundli_premium' as PaywallFeatureKey }]
                      : [{ label: t('newDashboard.myChart.antardasha') || "Sub-period", sublabel: "Calculating…" }]),
                    (horoscope?.planetary?.dominant_planet
                      ? { label: "Dominant Planet", sublabel: horoscope.planetary.dominant_planet }
                      : { label: "Dominant Planet", sublabel: "Calculating…" }),
                  ].map((item, idx) => {
                    const isBlocked = item.requiresFeature ? isFeatureBlocked(item.requiresFeature) : false;
                    const paywallData = item.requiresFeature ? getFeaturePaywall(item.requiresFeature) : null;
                    const planetImg = getPlanetImage(item.sublabel);
                    const lockedPreviewText = idx === 0 ? "Planetary period" : "Sub-period insight";

                    return (
                      <div
                        key={idx}
                        role="button"
                        tabIndex={0}
                        aria-label={isBlocked ? `${t('newDashboard.unlock')} ${item.label}` : `${t('newDashboard.view')} ${item.label}`}
                        onClick={() => {
                          if (isBlocked && paywallData) { setActivePaywallData(paywallData); return; }
                          router.push('/kundli');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (isBlocked && paywallData) { setActivePaywallData(paywallData); return; }
                            router.push('/kundli');
                          }
                        }}
                        className="relative flex min-h-[150px] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-[#C4B5FD]/10 bg-[#190F33] p-3 text-left transition-all hover:border-[#C9972E]/28"
                      >
                        {isBlocked ? (
                          <>
                            <div className="pointer-events-none flex w-full items-center gap-3 blur-[4px]" aria-hidden="true">
                              <Image
                                src={idx === 0 ? "/icons/planets/saturn.png" : "/icons/planets/moon.png"}
                                alt=""
                                width={64}
                                height={64}
                                className="h-16 w-16 shrink-0 object-contain opacity-70"
                              />
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[#928BA5]">{item.label}</p>
                                <p className="mt-1 font-headline text-base font-bold text-[#F4EFE7]">{lockedPreviewText}</p>
                              </div>
                            </div>
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#150B2D]/70 px-3 backdrop-blur-sm">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-[#C9972E]/40 bg-[#190F33] text-[#C9972E] shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                                <Lock className="h-5 w-5" />
                              </div>
                              <p className="text-[11px] font-black uppercase tracking-wider text-[#C9972E]">Unlock chart detail</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="relative shrink-0">
                              <Image
                                src={planetImg}
                                alt={item.sublabel || "Planet"}
                                width={64}
                                height={64}
                                className="h-16 w-16 object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-[#928BA5] truncate">{item.label}</p>
                              <p className="mt-1 font-headline text-base font-bold text-[#F4EFE7] truncate">
                                {item.sublabel}
                              </p>
                              {item.subtext && (
                                <p className="text-[10px] text-[#AFA8C0] truncate mt-0.5">
                                  {item.subtext}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cosmic Snapshot Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    label: "Nakshatra (Birth Star)",
                    value: kundliStats?.nakshatra || "Calculating…",
                    subtext: kundliStats?.nakshatraLord ? `Lord: ${kundliStats.nakshatraLord}` : "Astrological Star",
                    icon: <Star className="h-4 w-4 text-[#9B6DDE]" />,
                    color: "#9B6DDE"
                  },
                  {
                    label: "Moon Phase",
                    value: kundliStats?.moonPhase || "Calculating…",
                    subtext: "Current Lunar Cycle",
                    icon: <Moon className="h-4 w-4 text-[#9B6DDE]" />,
                    color: "#9B6DDE"
                  },
                  {
                    label: "Dasha Time Remaining",
                    value: kundliStats?.dashaRemaining || "Calculating…",
                    subtext: "Active Dasha Period",
                    icon: <Gem className="h-4 w-4 text-[#C9972E]" />,
                    color: "#C9972E",
                    requiresFeature: 'kundli_premium' as PaywallFeatureKey
                  },
                  {
                    label: "Lucky Elements",
                    value: horoscope?.lucky_color || horoscope?.lucky?.color ? `${horoscope.lucky_color || horoscope.lucky?.color}` : "Calculating…",
                    subtext: horoscope?.lucky_number || horoscope?.lucky?.number ? `Lucky Number: ${horoscope.lucky_number || horoscope.lucky?.number}` : "Daily Alignment",
                    icon: <Sparkles className="h-4 w-4 text-[#C9972E]" />,
                    color: "#C9972E"
                  }
                ].map((stat, sIdx) => {
                  const isBlocked = stat.requiresFeature ? isFeatureBlocked(stat.requiresFeature) : false;
                  const paywallData = stat.requiresFeature ? getFeaturePaywall(stat.requiresFeature) : null;
                  const accent = stat.color as string;
                  return (
                    <div
                      key={sIdx}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (isBlocked && paywallData) { setActivePaywallData(paywallData); return; }
                        router.push('/kundli');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (isBlocked && paywallData) { setActivePaywallData(paywallData); return; }
                          router.push('/kundli');
                        }
                      }}
                      className="relative flex min-h-[110px] cursor-pointer items-center gap-3 overflow-hidden rounded-2xl border border-[#C4B5FD]/10 bg-[#190F33] p-3 text-left transition-all hover:border-[#C9972E]/28"
                    >
                      {isBlocked ? (
                        <>
                          <div className="pointer-events-none flex min-w-0 flex-1 items-center gap-3 blur-[4px]" aria-hidden="true">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#C9972E]/20 bg-[#C9972E]/10">
                              {stat.icon}
                            </div>
                            <div className="min-w-0 leading-tight">
                              <p className="text-[9px] font-bold uppercase tracking-wider text-[#928BA5]">{stat.label}</p>
                              <p className="mt-1 font-headline text-xs font-bold text-[#F4EFE7]">Timeline insight</p>
                              <p className="mt-0.5 text-[9px] text-[#AFA8C0]">Premium chart timing</p>
                            </div>
                          </div>
                          <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 bg-[#150B2D]/70 px-3 backdrop-blur-sm">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-[#C9972E]/40 bg-[#190F33] text-[#C9972E]">
                              <Lock className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-[#C9972E]">Unlock timing</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--accent)]/20 bg-[var(--accent)]/10" style={{ '--accent': accent } as React.CSSProperties}>
                            {stat.icon}
                          </div>
                          <div className="min-w-0 leading-tight">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-[#928BA5]">{stat.label}</p>
                            <p className="font-headline text-sm font-bold text-[#F4EFE7] truncate mt-1">{stat.value}</p>
                            <p className="text-[10px] text-[#AFA8C0] truncate mt-0.5">{stat.subtext}</p>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <Link
              href="/kundli"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#C9972E]/30 bg-[#C9972E]/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-[#C9972E] transition-all hover:bg-[#C9972E]/15"
            >
              <Sparkles className="h-4 w-4" />
              {t('newDashboard.myChart.exploreFullAnalysis')}
            </Link>
          </DarkPanel>

        </div>
      </div>

      {/* EXPLORE YOUR COSMIC NETWORK SECTION */}
      <div className="relative z-10 mx-auto max-w-[1760px] px-4 py-10 sm:px-6 lg:px-8 2xl:max-w-[2100px] 3xl:max-w-[2400px]">
        {/* Section Header */}
        <div className="mb-6 text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="label-secondary">{t('newDashboard.guidanceHub')}</span>
          </div>
          <h2 className="font-headline text-[32px] font-bold leading-tight tracking-tight text-[#F4EFE7] max-[360px]:text-[26px] sm:text-[42px] 3xl:text-[56px]">
            {t('newDashboard.exploreCosmicNetwork')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#AAA3B8]">
            {t('newDashboard.cosmicNetworkDesc')}
          </p>
        </div>

        <div>
          {/* MEET YOUR AI ASTROLOGERS */}
          <DarkPanel className="p-6" borderVariant="top-gold">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center">
                  <div aria-hidden="true" className="h-2 w-2 rotate-45 border border-secondary bg-secondary/20" />
                </div>
                <h3 className="label-sm">{t('newDashboard.meetYourAiAstrologers')}</h3>
              </div>
              <Link href="/chat" aria-label={t('newDashboard.meetYourAiAstrologers')} className="text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-secondary">
                {t('newDashboard.lifeAreas.viewAll')} <ArrowRight className="inline h-3 w-3" />
              </Link>
            </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
                  <div key={guide.name} className={`group flex h-full flex-col items-center rounded-[22px] border border-transparent bg-transparent px-3 py-4 text-center transition-all hover:border-[#C9972E]/20 hover:bg-white/[0.025] ${isLocked ? 'opacity-60' : ''}`}>
                    <div className="flex flex-col items-center">
                      <div className={`relative h-[92px] w-[92px] max-[360px]:h-[72px] max-[360px]:w-[72px] overflow-hidden rounded-full border-[3px] bg-surface transition-all ${isLocked ? 'border-[#C4B5FD]/20' : 'border-[#C9972E]/50 group-hover:border-[#C9972E]'}`}>
                        <Image
                          src={guide.img}
                          alt={guide.name}
                          width={92}
                          height={92}
                          className="h-full w-full object-cover saturate-[0.9]"
                        />
                        <div className="pointer-events-none absolute inset-0 rounded-full bg-[#241744]/25" />
                        {isLocked && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px]">
                            <Lock className="h-6 w-6 text-[#F4EFE7]/80" />
                          </div>
                        )}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#C9972E]/40 bg-[#190F33] px-2.5 py-1 text-[9px] font-bold text-[#C9972E] shadow-sm">
                        <Coins className="h-2.5 w-2.5" />
                        {guide.credits} {guide.credits === 1 ? 'credit/message' : 'credits/message'}
                      </div>
                    </div>
                    <h4 className="mb-1 mt-3 font-headline text-base max-[360px]:text-sm font-bold tracking-tight leading-tight text-[#F4EFE7] break-words">{guide.name}</h4>
                    <p className="mb-2 text-[11px] max-[360px]:text-[10px] font-black uppercase tracking-[0.13em] text-[#AFA8C0]">{guide.role}</p>
                    <p className="mb-3 line-clamp-2 flex-1 text-[11px] leading-relaxed text-[#AAA3B8]">{guide.desc}</p>
                    <button
                      onClick={() => {
                        if (isLocked && paywallData) {
                          setActivePaywallData(paywallData);
                          return;
                        }
                        setSelectedAvatarId(guide.avatarId);
                        router.push("/chat");
                      }}
                      className={`mt-auto inline-flex w-full max-w-[148px] items-center justify-center gap-1.5 rounded-xl border px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                        isLocked
                          ? 'border-[#C4B5FD]/20 bg-transparent text-[#AFA8C0] cursor-pointer hover:bg-white/5 hover:text-[#F4EFE7]'
                          : 'border-[#C9972E]/50 bg-transparent text-[#C9972E] hover:border-[#C9972E] hover:bg-[#C9972E] hover:text-[#170C2D]'
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

        </div>

        {/* COSMIC PORTALS — Full Width */}
        <DarkPanel className="mt-8 p-6" borderVariant="muted">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-5 w-5 items-center justify-center">
                <div aria-hidden="true" className="h-2 w-2 rotate-45 border border-secondary bg-secondary/20" />
              </div>
              <h3 className="label-sm">{t('dashboard.cosmicPortals')}</h3>
            </div>
            <Link href="/chat" aria-label={t('newDashboard.exploreAllPortals')} className="text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-secondary">
              {t('newDashboard.exploreAllPortals')} <ArrowRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[
              { key: 'chat', icon: <MessageSquare className="h-5 w-5" />, title: t('dashboard.consultNaviAi'), desc: t('newDashboard.portalChatDesc'), action: t('dashboard.consultAi'), href: "/chat", featured: true, requiresFeature: 'chat_message' as PaywallFeatureKey },
              { key: 'kundli', icon: <Globe className="h-5 w-5" />, title: t('dashboard.janamKundli'), desc: t('dashboard.janamKundliDesc'), action: t('dashboard.openChart'), href: "/kundli", requiresFeature: 'kundli_premium' as PaywallFeatureKey },
              { key: 'match', icon: <Heart className="h-5 w-5" />, title: t('dashboard.soulmateSync'), desc: t('newDashboard.portalSoulmateDesc'), action: t('dashboard.analyzeMatch'), href: "/kundli/match", requiresFeature: 'match_report' as PaywallFeatureKey },
              { key: 'forecast', icon: <Sun className="h-5 w-5" />, title: t('dashboard.dailyPulse'), desc: t('newDashboard.portalPulseDesc'), action: t('newDashboard.viewToday'), href: "/horoscope/forecast", requiresFeature: 'full_daily_horoscope' as PaywallFeatureKey },
              { key: 'rashi', icon: <Orbit className="h-5 w-5" />, title: t('newDashboard.rashiLibrary'), desc: t('newDashboard.portalRashiDesc'), action: t('dashboard.openLibrary'), href: "/rashis" },
              { key: 'sessions', icon: <Sparkles className="h-5 w-5" />, title: t('dashboard.sessions'), desc: t('newDashboard.portalSessionsDesc'), action: t('dashboard.joinSession'), href: "/consult", requiresFeature: 'guided_consult' as PaywallFeatureKey },
            ].map((portal, idx) => {
              const accent = PORTAL_COLORS[portal.key];
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
                  className={`group relative flex flex-col gap-3 rounded-2xl border bg-surface p-5 max-[360px]:p-4 transition-all cursor-pointer ${
                    portal.featured
                      ? 'border-[rgba(196,181,253,0.12)]'
                      : 'border-[rgba(196,181,253,0.10)]'
                  } ${
                    isLocked
                      ? 'opacity-60 hover:border-[rgba(196,181,253,0.12)]'
                      : 'hover:-translate-y-0.5 hover:border-[#D3A83D]/25 hover:bg-surface-variant/30'
                  }`}
                >
                  {/* Featured / Most Popular label */}
                  {portal.featured && (
                    <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-[#D3A83D]/40 bg-[#D3A83D]/12 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-[#D3A83D]">
                      <Sparkles className="h-2.5 w-2.5" />
                      Most Popular
                    </div>
                  )}

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
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(196,181,253,0.12)] bg-[#21163D] transition-colors group-hover:border-[rgba(196,181,253,0.18)]"
                    style={{ color: accent }}
                  >
                    {portal.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1.5 font-headline text-base max-[360px]:text-sm font-bold tracking-tight leading-tight text-[#F4EFE7] break-words">{portal.title}</h4>
                    <p className="line-clamp-3 text-[11px] max-[360px]:text-[10px] leading-relaxed text-[#AAA3B8]">{portal.desc}</p>
                  </div>
                  <button
                    className={`mt-auto flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                      portal.featured
                        ? 'border-[#D3A83D] bg-[#D3A83D] text-[#150B2D] hover:bg-[#E8C456] hover:border-[#E8C456]'
                        : 'border-[rgba(201,151,46,0.38)] bg-transparent text-[#D3A83D] hover:border-[#D3A83D] hover:bg-[#D3A83D]/8'
                    }`}
                  >
                    {isLocked && <Lock className="h-3 w-3 mr-1 shrink-0" />}
                    {isLocked ? t('newDashboard.unlock') : portal.action} <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </DarkPanel>
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

      <FamilyCapDialog
        open={!!capDialog}
        onClose={() => setCapDialog(null)}
        currentTier={capDialog?.currentTier || tier || 'free'}
        limit={capDialog?.limit || 1}
      />

      <AnimatePresence>
        {isPanchangModalOpen && (
          <motion.div
            className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPanchangModalOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsPanchangModalOpen(false);
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 15, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-[28px] border border-outline-variant/15 bg-surface p-6 shadow-2xl"
            >
              <button
                onClick={() => setIsPanchangModalOpen(false)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-foreground/70 transition hover:bg-white/12 hover:text-foreground"
                aria-label="Close panchang modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary">
                <Calendar className="h-6 w-6" />
              </div>

              <h2 className="font-headline text-2xl font-bold tracking-tight leading-tight mb-1">
                {t('newDashboard.panchang.title')}
              </h2>
              <p className="text-sm text-foreground/60 mb-6">
                Daily astronomical configurations for today
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: t('newDashboard.panchang.tithi'), value: transits?.panchanga?.tithi || horoscope?.meta?.panchanga?.tithi || "Purnima", icon: <Moon className="h-5 w-5 text-secondary" />, desc: "Lunar day based on moon's elongation" },
                  { label: t('newDashboard.panchang.vara'), value: transits?.panchanga?.vara || horoscope?.meta?.panchanga?.vaara || "Shanivaar", icon: <Calendar className="h-5 w-5 text-amber-500" />, desc: "Day of the week named after ruler planet" },
                  { label: t('newDashboard.panchang.nakshatra'), value: transits?.panchanga?.nakshatra || horoscope?.meta?.panchanga?.nakshatra || "Anuradha", icon: <Star className="h-5 w-5 text-emerald-400" />, desc: "Lunar mansion / stellar constellation" },
                  { label: t('newDashboard.panchang.yoga'), value: transits?.panchanga?.yoga || horoscope?.meta?.panchanga?.yoga || "Shiva", icon: <Sparkles className="h-5 w-5 text-violet-400" />, desc: "Auspicious alignment of Sun and Moon" },
                  { label: t('newDashboard.panchang.karana'), value: transits?.panchanga?.karana || horoscope?.meta?.panchanga?.karana || "Vishti", icon: <Gem className="h-5 w-5 text-rose-400" />, desc: "Half of a tithi / active biological influence" },
                ].map((item) => (
                  <div key={item.label} className="flex gap-3 items-start rounded-2xl border border-outline-variant/10 bg-surface-variant/[0.02] p-4 transition hover:bg-surface-variant/[0.04]">
                    <div className="mt-0.5 shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-foreground/45">{item.label}</p>
                      <p className="mt-1 text-base font-bold text-foreground truncate">{item.value}</p>
                      <p className="mt-0.5 text-[11px] text-foreground/50 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsPanchangModalOpen(false)}
                  className="w-full sm:w-auto rounded-xl bg-secondary px-6 py-3 text-sm font-black uppercase text-on-primary transition hover:bg-secondary-hover hover:scale-[1.02] active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRahuKaalModalOpen && (
          <motion.div
            className="fixed inset-0 z-[10050] flex items-start justify-center overflow-y-auto p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsRahuKaalModalOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsRahuKaalModalOpen(false);
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 15, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-[28px] border border-outline-variant/15 bg-surface p-6 shadow-2xl"
            >
              <button
                onClick={() => setIsRahuKaalModalOpen(false)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-foreground/70 transition hover:bg-white/12 hover:text-foreground"
                aria-label="Close details modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>

              <h2 className="font-headline text-2xl font-bold tracking-tight leading-tight mb-1">
                {t('newDashboard.panchang.rahuKaal')} & Alerts
              </h2>
              <p className="text-sm text-foreground/60 mb-6">
                Caution periods and active astrological factors for today
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary mb-2">
                    {t('newDashboard.panchang.rahuKaal')} Timing
                  </h3>
                  <div className="rounded-xl border border-outline-variant/10 bg-surface-variant/[0.02] p-4 flex justify-between items-center">
                    <span className="font-bold text-sm text-foreground">{t('newDashboard.panchang.rahuKaal')}</span>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full shrink-0 ${
                      isRahuKaalEnded
                        ? "text-foreground/40 bg-surface-variant/20"
                        : "text-red-500 bg-red-500/10"
                    }`}>
                      {formatRahuKaal(transits, horoscope)}
                    </span>
                  </div>
                </div>

                {horoscope?.alerts?.secondary && horoscope.alerts.secondary.length > 0 && (
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.16em] text-secondary mb-2">
                      Astrological Caution Points
                    </h3>
                    <div className="space-y-2.5">
                      {horoscope.alerts.secondary.map((alert, idx) => (
                        <div key={idx} className="flex gap-3 items-start rounded-xl border border-outline-variant/10 bg-surface-variant/[0.02] p-3 transition hover:bg-surface-variant/[0.04]">
                          <span className="text-amber-500 mt-1 shrink-0">•</span>
                          <div className="min-w-0">
                            {alert.simple && <p className="text-xs font-bold text-foreground leading-relaxed">{alert.simple}</p>}
                            {alert.technical && <p className="mt-0.5 text-[10px] text-foreground/40 italic">{alert.technical}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsRahuKaalModalOpen(false)}
                  className="w-full sm:w-auto rounded-xl bg-secondary px-6 py-3 text-sm font-black uppercase text-on-primary transition hover:bg-secondary-hover hover:scale-[1.02] active:scale-[0.98]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotesModalOpen && (
          <motion.div
            className="fixed inset-0 z-[10050] flex items-start justify-center overflow-y-auto p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsNotesModalOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsNotesModalOpen(false);
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 15, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-[28px] border border-white/30 bg-surface p-6 shadow-2xl"
            >
              <button
                onClick={() => setIsNotesModalOpen(false)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-foreground/70 transition hover:bg-white/12 hover:text-foreground"
                aria-label="Close notes modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div
                className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  color: activeAreaHex,
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: `${activeAreaHex}4d`,
                  backgroundColor: `${activeAreaHex}1a`,
                }}
              >
                <Sparkles className="h-6 w-6" />
              </div>

              <h2 className="font-headline text-2xl font-bold tracking-tight leading-tight mb-1">
                Personalized Notes
              </h2>
              <p className="text-xs text-foreground/50 mb-4 uppercase tracking-wider">
                {activeAreaLabel} Outlook
              </p>

              <div className="space-y-4 text-left">
                {activeArea === "general" ? (
                  <div className="space-y-4">
                    {/* Personal Focus Points */}
                    {activeAreaNotes.length > 0 && (
                      <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.16em] mb-2" style={{ color: activeAreaHex }}>
                          Personal Focus Points
                        </h3>
                        <div className="rounded-2xl border border-white/10 bg-surface-variant/[0.02] p-4 space-y-2 text-sm text-foreground/80 leading-relaxed">
                          {activeAreaNotes.map((note, idx) => (
                            <p key={idx}>{note}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Celestial Insights */}
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.16em] mb-2" style={{ color: activeAreaHex }}>
                        Celestial Insights
                      </h3>
                      <div className="rounded-2xl border border-white/10 bg-surface-variant/[0.02] p-4 space-y-3 text-sm text-foreground/80 leading-relaxed">
                        {(transits?.notableTransits?.length
                          ? transits.notableTransits
                          : horoscope?.astro_explanations?.items?.map(item => item.simple) || [
                              t('newDashboard.notableTransits.jupiter'),
                              t('newDashboard.notableTransits.saturn'),
                              t('newDashboard.notableTransits.rahu'),
                              t('newDashboard.notableTransits.ketu'),
                            ]
                        ).slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-start">
                            <span aria-hidden="true" className="mt-0.5" style={{ color: activeAreaHex }}>•</span>
                            <p className="flex-1">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Personal Notes for other categories */
                  activeAreaNotes.length > 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-surface-variant/[0.02] p-4 space-y-2 text-sm text-foreground/80 leading-relaxed">
                      {activeAreaNotes.map((note, idx) => (
                        <p key={idx}>{note}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-foreground/50 italic">No personal notes available.</p>
                  )
                )}

                {activeAreaTone && (
                  <div className="flex items-center gap-2 pt-3">
                    <span className="font-bold text-sm text-foreground/50">Cosmic Tone:</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.12em] px-2.5 py-1 rounded-full shrink-0 ${
                      activeAreaTone === "positive"
                        ? "text-[#35CFA0] bg-[#35CFA0]/10 border border-[#35CFA0]/20"
                        : activeAreaTone === "negative" || activeAreaTone === "caution"
                        ? "text-[#E16272] bg-[#E16272]/10 border border-[#E16272]/20"
                        : "text-foreground/45 bg-surface-variant/30 border border-white/5"
                    }`}>
                      {activeAreaTone}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsNotesModalOpen(false)}
                  className="w-full sm:w-auto rounded-xl bg-secondary px-6 py-3 text-sm font-black uppercase text-on-primary transition hover:bg-secondary-hover hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAdviceModalOpen && (
          <motion.div
            className="fixed inset-0 z-[10050] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAdviceModalOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsAdviceModalOpen(false);
            }}
            role="dialog"
            aria-modal="true"
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div
              initial={{ y: 20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 15, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-[28px] border border-white/30 bg-surface p-6 shadow-2xl"
            >
              <button
                onClick={() => setIsAdviceModalOpen(false)}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-foreground/70 transition hover:bg-white/12 hover:text-foreground"
                aria-label="Close advice modal"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-secondary/30 bg-secondary/10 text-secondary">
                <Sparkles className="h-6 w-6" />
              </div>

              <h2 className="font-headline text-2xl font-bold tracking-tight leading-tight mb-1">
                Today&apos;s Advice
              </h2>
              <p className="text-xs text-foreground/50 mb-6 uppercase tracking-wider">
                Cosmic Guidance for You
              </p>

              <div className="rounded-2xl border border-white/10 bg-surface-variant/[0.02] p-4 text-sm text-foreground/80 leading-relaxed text-left">
                {horoscope?.current_state?.advice_now}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsAdviceModalOpen(false)}
                  className="w-full sm:w-auto rounded-xl bg-secondary px-6 py-3 text-sm font-black uppercase text-on-primary transition hover:bg-secondary-hover hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
