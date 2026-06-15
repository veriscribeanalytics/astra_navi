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
  Calendar,
  Check,
  ChevronRight,
  Coins,
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
import { AREA_COLORS, STATUS_COLORS, SIGNAL_BADGES, BRAND_GOLD, TEXT_COLORS, getScorePhase } from "@/data/lifeAreaColors";
import { PORTAL_COLORS } from "@/data/portalColors";
import type { ForecastDay } from "@/components/dashboard/MiniChart";
// import Particles from "@/components/ui/Particles";
import { catmullRomToBezier, catmullRomArea } from "@/utils/chartCurve";
import { todayISO } from "@/utils/forecastError";
import type { HoroscopeData } from "@/types/horoscope";
import DailyHoroscopeCardSkeleton from "@/components/dashboard/DailyHoroscopeCardSkeleton";
import {
  useFamilyMembers,
  useFamilyConnections,
  useFamilyCompatibilityPreflight,
  useFamilyReports,
  useFamilyCompatibility,
  useFamilyCompatibilitySummary,
  useFamilyConnectionCompatibility,
  useFamilyConnectionCompatibilitySummary,
  useFamilyConnectionCompatibilityPreflight,
} from "@/hooks/useFamily";
import { parseKundliStats } from "@/lib/kundliStats";
import { computeFamilyMemberStatus, bandPalette } from "@/lib/familyStatus";
import type { FamilyMember, FamilyConnection, FamilyCompatibilityBand } from "@/types/family";
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

function formatRahuKaal(transits: ReturnType<typeof useTransitsToday>["data"], horoscope?: HoroscopeData | null) {
  const rk = transits?.panchanga?.rahukaal || horoscope?.meta?.panchanga?.rahukaal;
  if (!rk) return "08:34 - 10:25";
  return `${rk.start} - ${rk.end}`;
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
        role="img"
        aria-label={`Weekly ${areaLabel} forecast chart`}
        viewBox={`0 0 ${W} ${H}`}
        className="h-[180px] w-full overflow-visible"
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
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--outline-variant)" strokeOpacity="0.08" strokeWidth="1" />
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
              <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="13" fontWeight="700" fill={isToday ? colorHex : "var(--foreground)"} opacity={isToday ? 1 : 0.95}>
                {d.score}
              </text>
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
  onRunCompatibility: () => void;
  isCompatibilityBlocked: boolean;
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
  const { getTierColor } = usePaywallContext();
  const lockColor = getTierColor(lockType);

  let title = t('newDashboard.familyFriends.addMember') || "Add Member";
  let subtitle = t('dashboard.familyAddSubtitle') || "Add family or friends to compare charts and emotional patterns.";
  let buttonText = t('newDashboard.familyFriends.addMember') || "ADD MEMBER";
  let bgClass = "bg-secondary/[0.01] border-secondary/35 hover:border-secondary/60 hover:bg-secondary/[0.04]";
  let textClass = "text-secondary";
  let buttonBorderClass = "border-secondary/50 group-hover:border-secondary group-hover:bg-secondary/10";

  if (isLocked) {
    if (lockType === 'pro') {
      title = "Get Pro to Unlock";
      subtitle = "Unlock up to 3 slots and get deeper insights.";
      buttonText = "GET PRO";
      bgClass = "bg-[var(--lock-color)]/[0.03] border-[var(--lock-color)]/25 hover:border-[var(--lock-color)]/55 hover:bg-[var(--lock-color)]/[0.06]";
      textClass = "text-[var(--lock-color)]";
      buttonBorderClass = "border-[var(--lock-color)]/40 group-hover:border-[var(--lock-color)] group-hover:bg-[var(--lock-color)]/10";
    } else {
      title = "Get Premium to Unlock";
      subtitle = "Unlock all 6 slots and unlimited cosmic compatibility.";
      buttonText = "GET PREMIUM";
      bgClass = "bg-[var(--lock-color)]/[0.03] border-[var(--lock-color)]/25 hover:border-[var(--lock-color)]/55 hover:bg-[var(--lock-color)]/[0.06]";
      textClass = "text-[var(--lock-color)]";
      buttonBorderClass = "border-[var(--lock-color)]/40 group-hover:border-[var(--lock-color)] group-hover:bg-[var(--lock-color)]/10";
    }
  }

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-5 text-center cursor-pointer transition-all min-h-[170px] ${bgClass}`}
      style={{ '--lock-color': lockColor } as React.CSSProperties}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed transition-transform group-hover:scale-105 ${
        isLocked ? 'border-[var(--lock-color)]/40 text-[var(--lock-color)]' : 'border-secondary/40 text-secondary/70'
      }`}>
        {isLocked ? <Lock className="h-5 w-5" /> : <Users className="h-6 w-6" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-foreground flex items-center justify-center gap-1.5 group-hover:text-secondary transition-colors">
          {title}
        </p>
        <p className="text-[10px] leading-relaxed text-foreground/45 max-w-[24ch] mx-auto">
          {subtitle}
        </p>
      </div>
      <span className={`flex items-center gap-1.5 rounded-full border bg-transparent px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-all ${textClass} ${buttonBorderClass}`}>
        {isLocked ? <Lock className="h-2.5 w-2.5" /> : <Users className="h-2.5 w-2.5" />}
        {buttonText}
      </span>
    </div>
  );
}

/** Dashboard family-member card backed by real member data + compatibility status. */
function DashboardFamilyMemberCard({ member, t, onRunCompatibility, isCompatibilityBlocked }: { member: FamilyMember } & FamilyCardActionProps) {
  const { data: preflight, fetchPreflight } = useFamilyCompatibilityPreflight(member.id);
  const { data: reports } = useFamilyReports(member.id);
  const { data: compat, fetchCompatibility } = useFamilyCompatibility(member.id);
  const { data: summary } = useFamilyCompatibilitySummary(member.id, 'en');

  useEffect(() => {
    if (member.id) {
      fetchPreflight();
    }
  }, [member.id, fetchPreflight]);

  useEffect(() => {
    if (preflight?.cachedResultAvailable && !preflight.staleDataWarning && member.id) {
      fetchCompatibility('en');
    }
  }, [preflight?.cachedResultAvailable, preflight?.staleDataWarning, fetchCompatibility, member.id]);

  const activeBand = (compat?.band ?? summary?.band) as FamilyCompatibilityBand | undefined;
  const activeScore = compat?.score ?? summary?.score;

  const status = computeFamilyMemberStatus({
    member,
    preflight,
    reports,
    band: activeBand ?? null,
  });

  const hasScore = typeof activeScore === "number";
  const scorePct = hasScore ? Math.max(0, Math.min(100, Math.round(activeScore!))) : null;
  const ringColor = activeBand === 'Excellent' ? '#34d399' :
                    activeBand === 'Good' ? '#fbbf24' :
                    activeBand === 'Average' ? '#fb923c' :
                    activeBand === 'Challenging' ? '#f87171' : '#a78bfa';

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[28px] border border-outline-variant/8 bg-surface">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Avatar + Name / Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10 border border-secondary/20 text-xl font-headline font-bold text-secondary">
              {initialOf(member.name)}
            </div>
            {/* Status indicator dot */}
            {status?.kind === 'stable' && (
              <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-surface bg-emerald-400" />
            )}
            {status?.kind === 'needsAttention' && (
              <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-surface bg-amber-400" />
            )}
            {status?.kind === 'incomplete' && (
              <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-surface bg-red-400" />
            )}
          </div>

          <div className="min-w-0 flex flex-col">
            <h4 className="truncate font-headline text-base font-bold text-foreground">
              {member.name || "—"}
            </h4>
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/45 mt-0.5">
              <span className="capitalize">{formatRelationship(member.relationshipType)}</span>
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

        {/* Right Side: Circular Match Gauge */}
        {scorePct !== null && (
          <div className="shrink-0">
            <AreaRing score={scorePct} color={ringColor} size={64} label="Match Score">
              <span className="text-xs sm:text-sm font-black leading-none tabular-nums" style={{ color: ringColor }}>
                {scorePct}
              </span>
            </AreaRing>
          </div>
        )}
      </div>

      {/* Middle Row: Teaser / Description Box */}
      {scorePct !== null && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-secondary/10 bg-secondary/[0.03] text-left">
          <Sparkles className="h-4 w-4 text-secondary shrink-0 mt-0.5 animate-pulse" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            {compat?.relationship_actions?.today || compat?.verdict || summary?.verdict || t('dashboard.familyNoVerdict') || "Steady bond today. Good energy for conversations and shared decisions."}
          </p>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex items-center justify-between gap-3 mt-1.5">
        <button
          onClick={onRunCompatibility}
          className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border border-amber-500/20 shadow-md transition-all font-bold uppercase tracking-wider text-[10px] py-2.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isCompatibilityBlocked ? <Lock className="h-3.5 w-3.5 shrink-0" /> : <Sparkles className="h-3.5 w-3.5 shrink-0" />}
          {t('dashboard.familyRunCompatibility') || "Run Compatibility"}
        </button>

        <Link
          href={`/family?member=${member.id}`}
          className="text-secondary hover:text-secondary-hover font-bold uppercase tracking-wider text-[10px] py-2.5 px-2 flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
        >
          <span>{t('dashboard.familyViewBond') || "View Bond"}</span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        </Link>
      </div>
    </div>
  );
}

/** Dashboard card for a linked connection (another user who shares with you). */
function DashboardConnectionCard({ connection, t, onRunCompatibility, isCompatibilityBlocked }: { connection: FamilyConnection } & FamilyCardActionProps) {
  const { data: preflight, fetchPreflight } = useFamilyConnectionCompatibilityPreflight(connection.connectionId);
  const { data: compat, fetchCompatibility } = useFamilyConnectionCompatibility(connection.connectionId);
  const { data: summary } = useFamilyConnectionCompatibilitySummary(connection.connectionId, 'en');

  useEffect(() => {
    if (connection.connectionId) {
      fetchPreflight();
    }
  }, [connection.connectionId, fetchPreflight]);

  useEffect(() => {
    if (preflight?.cachedResultAvailable && !preflight.staleDataWarning && connection.connectionId) {
      fetchCompatibility('en');
    }
  }, [preflight?.cachedResultAvailable, preflight?.staleDataWarning, fetchCompatibility, connection.connectionId]);

  const activeBand = (compat?.band ?? summary?.band) as FamilyCompatibilityBand | undefined;
  const activeScore = compat?.score ?? summary?.score;

  const hasScore = typeof activeScore === "number";
  const scorePct = hasScore ? Math.max(0, Math.min(100, Math.round(activeScore!))) : null;
  const ringColor = activeBand === 'Excellent' ? '#34d399' :
                    activeBand === 'Good' ? '#fbbf24' :
                    activeBand === 'Average' ? '#fb923c' :
                    activeBand === 'Challenging' ? '#f87171' : '#a78bfa';

  return (
    <div className="flex flex-col gap-4 p-5 rounded-[28px] border border-outline-variant/8 bg-surface">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Avatar + Name / Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xl font-headline font-bold text-emerald-400">
              {initialOf(connection.otherName)}
            </div>
            {/* Green indicator dot at the bottom right */}
            <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full border-2 border-surface bg-emerald-400" />
          </div>

          <div className="min-w-0 flex flex-col">
            <h4 className="truncate font-headline text-base font-bold text-foreground">
              {connection.otherName || "—"}
            </h4>
            <p className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/45 mt-0.5">
              <span className="capitalize">{formatRelationship(connection.iSeeThemAs)}</span>
            </p>
          </div>
        </div>

        {/* Right Side: Circular Match Gauge */}
        {scorePct !== null && (
          <div className="shrink-0">
            <AreaRing score={scorePct} color={ringColor} size={64} label="Match Score">
              <span className="text-xs sm:text-sm font-black leading-none tabular-nums" style={{ color: ringColor }}>
                {scorePct}
              </span>
            </AreaRing>
          </div>
        )}
      </div>

      {/* Middle Row: Teaser / Description Box */}
      {scorePct !== null && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-secondary/10 bg-secondary/[0.03] text-left">
          <Sparkles className="h-4 w-4 text-secondary shrink-0 mt-0.5 animate-pulse" />
          <p className="text-xs text-foreground/80 leading-relaxed">
            {compat?.relationship_actions?.today || compat?.verdict || summary?.verdict || t('dashboard.familyNoVerdict') || "Steady bond today. Good energy for conversations and shared decisions."}
          </p>
        </div>
      )}

      {/* Footer Buttons */}
      <div className="flex items-center justify-between gap-3 mt-1.5">
        <button
          onClick={onRunCompatibility}
          className="flex-1 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border border-amber-500/20 shadow-md transition-all font-bold uppercase tracking-wider text-[10px] py-2.5 px-3 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {isCompatibilityBlocked ? <Lock className="h-3.5 w-3.5 shrink-0" /> : <Sparkles className="h-3.5 w-3.5 shrink-0" />}
          {t('dashboard.familyRunCompatibility') || "Run Compatibility"}
        </button>

        <Link
          href="/family"
          className="text-secondary hover:text-secondary-hover font-bold uppercase tracking-wider text-[10px] py-2.5 px-2 flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
        >
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
  const greeting = t(useGreeting());
  const { user, refreshProfile, isLoading: userLoading } = useAuth();
  const { tier, totalCredits, isLoaded: paywallLoaded, isFeatureBlocked, getFeaturePaywall } = usePaywallContext();
  const isFree = useMemo(() => (tier || 'free').toLowerCase() === 'free', [tier]);
  const [activePaywallData, setActivePaywallData] = useState<PaywallData | null>(null);
  const { data: horoscope, isLoading: horoscopeLoading, profileLocationRequired } = useDailyHoroscope();
  const { data: transits, isLoading: transitsLoading } = useTransitsToday();
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
  const [pendingPrompt, setPendingPrompt] = useState<ChatPrompt | null>(null);
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
    setAllForecastsLoading(true);

    Promise.all(
      AREA_LIST.map(async (area) => {
        try {
          const res = await clientFetch(`/api/forecast/${area}/weekly?date=${date}&lang=${language}`);
          if (res.ok) {
            const data = await res.json();
            if (data && Array.isArray(data.days)) {
              return {
                area,
                data: {
                  area: data.area as ForecastArea,
                  days: data.days.map((d: any) => ({
                    date: d.date,
                    is_today: d.is_today ?? (d.date === date),
                    score: d.score,
                    text: d.text || "",
                    dominant_planet: d.dominant_planet || "",
                    personalized_alerts: d.alerts || [],
                    transits: d.transits,
                  })),
                  summary: data.summary || {
                    best_day: "",
                    worst_day: "",
                    average_score: 70,
                    trend: "stable",
                  },
                },
              };
            }
          }
        } catch (err) {
          console.warn(`[GptDashboard] Failed to fetch forecast for ${area}:`, err);
        }
        return { area, data: null };
      })
    ).then((results) => {
      const newForecasts = {} as Record<ForecastArea, ForecastData | null>;
      results.forEach(({ area, data }) => {
        newForecasts[area] = data;
      });
      setAllWeeklyForecasts(newForecasts);
      setAllForecastsLoading(false);
    });
  }, [language, isFree, paywallLoaded, isFeatureBlocked, getFeaturePaywall]);

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
  const overallScore = useMemo(() => {
    if (!horoscope) return 0;
    const scores = AREA_LIST.map((area) => getAreaScore(horoscope, area));
    const sum = scores.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / AREA_LIST.length);
  }, [horoscope]);
  const overallPhaseHex = AREA_COLORS.overall.main;
  const overallPhaseGlow = AREA_COLORS.overall.glow;
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
  const { data: familyConnections, isLoading: connectionsLoading } = useFamilyConnections();

  const allItems = useMemo(() => {
    const membersList = familyMembers || [];
    const connectionsList = familyConnections || [];
    const mappedMembers = membersList.map(m => ({ type: 'member' as const, id: String(m.id), data: m }));
    const mappedConnections = connectionsList.map(c => ({ type: 'connection' as const, id: String(c.connectionId), data: c }));
    return [...mappedMembers, ...mappedConnections];
  }, [familyMembers, familyConnections]);

  const slots = useMemo(() => {
    const result: Array<
      | { type: 'member'; id: string; data: FamilyMember }
      | { type: 'connection'; id: string; data: FamilyConnection }
      | { type: 'add'; isLocked: boolean; lockType?: 'pro' | 'premium' }
    > = [];

    const tierLower = (tier || 'free').toLowerCase();
    let unlockedLimit = 1;
    if (tierLower === 'premium') {
      unlockedLimit = 6;
    } else if (tierLower === 'pro') {
      unlockedLimit = 3;
    }

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
  const bestDay = useMemo(() => {
    const day = forecast?.days?.reduce<ForecastDay | null>((best, item) => (!best || item.score > best.score ? item : best), null);
    if (!day) return "Thu 74";
    const label = new Date(day.date + "T00:00:00").toLocaleDateString(LOCALE_BY_LANGUAGE[language] || "en-IN", { weekday: "short" });
    return `${label} ${day.score}`;
  }, [forecast, language]);

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
  }, [horoscope?.time_triggers]);

  const isRahuKaalEnded = useMemo(() => {
    const rk = transits?.panchanga?.rahukaal || horoscope?.meta?.panchanga?.rahukaal;
    if (!rk || !rk.end) return false;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [h, m] = rk.end.split(":").map(Number);
    const endMinutes = (h || 0) * 60 + (m || 0);

    return currentMinutes > endMinutes;
  }, [transits, horoscope]);

  const askInChat = useCallback((title: string, message: string) => {
    setPendingPrompt({ title, message });
  }, []);

  const confirmChat = useCallback(() => {
    if (!pendingPrompt) return;
    localStorage.setItem("astranavi_pending_message", pendingPrompt.message);
    setPendingPrompt(null);
    router.push("/chat");
  }, [pendingPrompt, router]);

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
        badgeColor: `text-[${SIGNAL_BADGES.BEST.main}] bg-[${SIGNAL_BADGES.BEST.bg}] border-[rgba(34,197,94,0.28)]`,
        badgeStyle: { color: SIGNAL_BADGES.BEST.main, backgroundColor: SIGNAL_BADGES.BEST.bg, borderColor: "rgba(34,197,94,0.28)" },
      });
    }

    if (stableItem) {
      result.push({
        ...stableItem,
        badge: SIGNAL_BADGES.STABLE.label,
        arrow: "side",
        badgeColor: `text-[${SIGNAL_BADGES.STABLE.main}] bg-[${SIGNAL_BADGES.STABLE.bg}] border-[rgba(56,189,248,0.28)]`,
        badgeStyle: { color: SIGNAL_BADGES.STABLE.main, backgroundColor: SIGNAL_BADGES.STABLE.bg, borderColor: "rgba(56,189,248,0.28)" },
      });
    }

    if (worstItem && worstItem.area !== bestItem?.area) {
      result.push({
        ...worstItem,
        badge: SIGNAL_BADGES.WORST.label,
        arrow: "down",
        badgeColor: `text-[${SIGNAL_BADGES.WORST.main}] bg-[${SIGNAL_BADGES.WORST.bg}] border-[rgba(239,68,68,0.28)]`,
        badgeStyle: { color: SIGNAL_BADGES.WORST.main, backgroundColor: SIGNAL_BADGES.WORST.bg, borderColor: "rgba(239,68,68,0.28)" },
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
    return AREA_COLORS[activeArea].main;
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
    <div className="gpt-dashboard-shell safe-bottom-buffer relative min-h-[calc(100dvh-var(--navbar-height,64px)-100px)] overflow-x-hidden bg-transparent text-foreground">
      {/* Custom local background particles and gradients removed to follow the global layout background */}

      <div className="relative z-10 mx-auto max-w-[1760px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 2xl:max-w-[2100px] 3xl:max-w-[2400px]">
        <header className="mb-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_580px] xl:items-center">
          {/* Column 1: Left Column with 2 Rows */}
          <div className="flex flex-col gap-2 w-full">
            {/* Row 1: Date/Panchang & Career Score */}
            <div className="flex flex-wrap items-center justify-start gap-x-8 gap-y-2 w-full pb-1">
              <div className="flex flex-wrap items-center gap-3 label-sm tracking-[0.24em] text-foreground/58">
                <span aria-hidden="true" className="h-px w-12 bg-secondary/50" />
                <span>{currentDate}</span>
                <span>•</span>
                <button
                  onClick={() => setIsPanchangModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-full border border-secondary/35 bg-secondary/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-secondary hover:bg-secondary/20 hover:border-secondary/50 transition cursor-pointer active:scale-95 shrink-0"
                >
                  <Calendar className="h-3 w-3 text-secondary shrink-0" />
                  <span>{t('newDashboard.panchang.title')}</span>
                  <ChevronRight className="h-3 w-3 text-secondary shrink-0" />
                </button>
              </div>
              <div>
                {scoreLoading ? (
                  <div className="h-5 w-64 animate-pulse rounded bg-surface-variant/[0.06]" />
                ) : topLifeArea && (
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Star className="h-4 w-4 fill-secondary text-secondary" />
                    {topLifeArea.score >= 80
                      ? <>{topLifeArea.label} {t('newDashboard.todaysEnergy.topAreaStrongest')} <span className="font-black text-emerald-400">{topLifeArea.score}%</span></>
                      : <>{t('newDashboard.todaysEnergy.topAreaFocus')}: <span className="font-black" style={{ color: AREA_THEMES[topLifeArea.area].hex }}>{topLifeArea.label}</span> · <span className="font-black text-emerald-400">{topLifeArea.score}%</span></>
                    }
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Greeting */}
            <div className="w-full">
              <h1 className="font-headline text-[30px] font-bold leading-tight tracking-tight sm:text-[42px] 3xl:text-[56px]">
                {greeting},{" "}
                <span style={{ color: TEXT_COLORS.heading }}>
                  {userLoading ? "..." : userName}
                </span>
              </h1>
            </div>
          </div>

          {/* Column 2: Right Column with Rashis Grid */}
          <div className="grid grid-cols-3 gap-3 w-full sm:min-w-[360px] xl:max-w-[580px]">
            {rashiLoading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 rounded-xl border border-outline-variant/12 bg-surface-variant/[0.035] px-1.5 py-1 text-center sm:min-w-[110px] sm:flex-row sm:gap-2.5 sm:px-2.5 sm:text-left animate-pulse"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-variant/20 sm:h-[38px] sm:w-[38px]" />
                  <div className="min-w-0 space-y-1 flex-1">
                    <div className="h-1 w-8 rounded bg-surface-variant/20" />
                    <div className="h-2.5 w-12 rounded bg-surface-variant/20" />
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
                  className="group flex flex-col items-center gap-1 rounded-xl border border-outline-variant/12 bg-surface-variant/[0.035] px-1.5 py-1 text-center transition hover:border-secondary/40 hover:bg-secondary/8 sm:min-w-[110px] sm:flex-row sm:gap-2.5 sm:px-2.5 sm:text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-secondary/25 bg-background sm:h-[38px] sm:w-[38px]">
                    {item.data?.icon ? (
                      <Image src={item.data.icon} alt={item.data.name} width={24} height={24} className="h-5.5 w-5.5 object-contain sm:h-6.5 sm:w-6.5" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-secondary sm:h-4 sm:w-4" />
                    )}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[7px] font-black uppercase tracking-[0.12em] text-foreground/50 sm:text-[8.5px]">{item.label}</p>
                    <p className="mt-0.5 truncate font-headline text-xs font-bold text-foreground sm:text-[14.5px]">{item.data?.name || item.fallback}</p>
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
                  <h2 className="text-xl font-headline font-bold" style={{ color: TEXT_COLORS.heading }}>
                    Your Day Today
                  </h2>
                </div>
                
                {/* Lucky items & Mood - smaller than header */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-foreground/70 justify-center md:justify-end">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-variant/70 px-2.5 py-1">
                    <span className="h-2 w-2 rounded-full bg-gradient-to-br from-purple-400 to-purple-700" />
                    {t('newDashboard.cosmicInsight.luckyColor')}: {(horoscope?.lucky?.color || horoscope?.lucky_color) ?? "Deep Purple"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-variant/70 px-2.5 py-1">
                    <Star className="h-3 w-3 text-secondary" />
                    {t('newDashboard.cosmicInsight.luckyNumber')}: {(horoscope?.lucky?.number ?? horoscope?.lucky_number) ?? "7"}
                  </span>
                  {horoscope?.mood && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-variant/70 px-2.5 py-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Cosmic Mood: {typeof horoscope.mood === 'object' ? horoscope.mood.value : horoscope.mood}
                    </span>
                  )}
                </div>
              </div>

              {/* Left Side Content */}
              <div className="flex-grow flex flex-col gap-3">
                {/* 3-column Grid for Ratings, Advice, Lotus */}
                <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_190px] lg:items-stretch">
                  {/* Ratings Card */}
                  <div className="flex flex-col items-center text-center lg:items-start lg:text-left bg-surface-variant/[0.035] py-3 px-4 rounded-2xl h-full justify-center">
                    <p className="label-secondary font-black tracking-[0.2em]">{t('newDashboard.todaysEnergy.title')}</p>
                    <div className="mt-3">
                      <RingScore score={overallScore} color={overallPhaseHex} />
                    </div>
                    <span
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]"
                      style={{
                        color: STATUS_COLORS[getScorePhase(overallScore)].main,
                        backgroundColor: STATUS_COLORS[getScorePhase(overallScore)].bg,
                        borderColor: STATUS_COLORS[getScorePhase(overallScore)].border,
                      }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[getScorePhase(overallScore)].main }} />
                      {scoreBand}
                    </span>
                  </div>

                  {/* Advice Card */}
                  <div className="space-y-3 bg-surface-variant/[0.035] py-3 px-4 rounded-2xl h-full flex flex-col justify-center text-left">
                    <h2 className="font-headline text-lg font-bold leading-snug sm:text-xl">{headline}</h2>
                    {horoscope?.current_state?.advice_now && (
                      <button
                        onClick={() => setIsAdviceModalOpen(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary hover:text-secondary/80 transition-colors cursor-pointer text-left w-fit"
                      >
                        Today's Advice for You <ArrowRight className="inline h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Lotus Card */}
                  <div className="hidden justify-center lg:flex items-center bg-surface-variant/[0.035] py-3 px-4 rounded-2xl h-full">
                    <Image src="/images/lotus.svg" alt="" width={130} height={90} className="drop-shadow-[0_0_30px_rgba(168,85,247,0.18)]" />
                  </div>
                </div>

                {/* Good Time & Rahu Kaal Cards */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-surface-variant/[0.035] py-3 px-4 text-left">
                    <div className="flex items-start gap-4 w-full">
                      <Sun className="h-8 w-8 shrink-0 text-emerald-400" />
                      <div className="flex-grow min-w-0">
                        <p className="text-[12px] font-black uppercase tracking-[0.22em] text-emerald-400 mb-2">{t('newDashboard.todaysEnergy.goodTime')}</p>
                        {activeTrigger ? (
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="font-bold text-sm text-foreground">{activeTrigger.label}</span>
                                <span className="text-[11px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full shrink-0">{activeTrigger.start} - {activeTrigger.end}</span>
                              </div>
                              <p className="mt-1 text-xs text-foreground/58 leading-normal">{activeTrigger.advice}</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="mt-2 text-lg font-bold">19:00 - 20:00</p>
                            <p className="mt-1 text-sm leading-6 text-foreground/58">{t('newDashboard.todaysEnergy.goodTimeDesc')}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-surface-variant/[0.035] py-3 px-4 text-left">
                    <div className="flex items-start gap-4 w-full">
                      <AlertTriangle className="h-8 w-8 shrink-0 fill-amber-400/15 text-amber-400" />
                      <div className="flex-grow min-w-0">
                        <p className="text-[12px] font-black uppercase tracking-[0.22em] text-amber-400 mb-2">
                          {`${t('newDashboard.panchang.rahuKaal')} / ${t('newDashboard.todaysEnergy.alertTime')}`}
                        </p>
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">{t('newDashboard.panchang.rahuKaal')}</span>
                          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                            isRahuKaalEnded
                              ? "text-foreground/40 bg-surface-variant/20"
                              : "text-red-500 bg-red-500/10"
                          }`}>
                            {formatRahuKaal(transits, horoscope)}
                          </span>
                        </div>
                        {horoscope?.alerts?.secondary && horoscope.alerts.secondary.length > 0 ? (
                          <div className="mt-3">
                            <button
                              onClick={() => setIsRahuKaalModalOpen(true)}
                              className="text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-secondary/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Details</span>
                              <ChevronRight className="h-3.5 w-3.5 text-secondary shrink-0" />
                            </button>
                          </div>
                        ) : (
                          <p className="mt-1 text-xs text-foreground/58 leading-normal">{t('newDashboard.todaysEnergy.cautionTimeDesc')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Astrologers Section */}
                <div className="space-y-3 mt-auto pt-2">
                  <div className="grid w-full grid-cols-1 items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1.3fr)]">
                    {/* Left Card: Choose from AI Astrologers */}
                    <button
                      onClick={() => {
                        if (isFeatureBlocked('chat_message') && getFeaturePaywall('chat_message')) {
                          setActivePaywallData(getFeaturePaywall('chat_message')!);
                          return;
                        }
                        localStorage.removeItem("astranavi_pending_message");
                        router.push("/chat");
                      }}
                      className="w-full flex items-center gap-3 rounded-2xl border border-purple-500/30 bg-purple-950/10 py-3 px-4 text-left hover:bg-purple-950/20 transition duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black uppercase tracking-[0.15em] text-purple-400">
                          CHOOSE FROM AI ASTROLOGERS
                        </h4>
                        <p className="mt-0.5 truncate text-[11px] text-foreground/50">
                          Browse and select your personal guide
                        </p>
                      </div>
                    </button>

                    {/* OR Separator Column */}
                    <div className="flex items-center justify-center py-1 md:py-0">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface border border-white/20 text-[9px] font-black text-foreground/60 shadow-lg">
                        OR
                      </span>
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
                          "astranavi_pending_message",
                          `I want to consult with ${activeAvatar.name} about my ${activeAreaLabel.toLowerCase()} area.`
                        );
                        router.push("/chat");
                      }}
                      className="w-full flex items-center justify-between gap-3 rounded-2xl bg-surface-variant/[0.035] py-3 px-4 text-left hover:bg-white/[0.02] transition duration-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/20"
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
                            <span className="font-bold text-xs text-foreground">
                              Ask {activeAvatar.name} about {activeAreaLabel}
                            </span>
                            <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full shrink-0 uppercase tracking-wide">
                              RECOMMENDED
                            </span>
                          </div>
                          <p className="text-[10px] text-foreground/50 mt-0.5 truncate max-w-[200px] md:max-w-[190px] xl:max-w-[230px] 2xl:max-w-[280px]">
                            {activeAvatar.desc}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-foreground/45 shrink-0 ml-auto" />
                    </button>
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
                    <h3 className="text-[14px] font-black uppercase tracking-[0.22em]" style={{ color: TEXT_COLORS.heading }}>
                    {t('newDashboard.currentWeek.title') || "Your Life Areas"}
                  </h3>
                  <p className="mt-1 text-xs font-medium" style={{ color: TEXT_COLORS.muted }}>
                    Today's strongest and weakest signals
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
                    const cardColorHex = AREA_COLORS[area].main;
                    const isLucide = area === "general" || area === "spiritual";
                    const isSelected = activeArea === area;
                    return (
                      <button
                        key={area}
                        data-testid={`dashboard-life-area-${area}`}
                        onClick={() => setActiveArea(area)}
                        className={`group flex flex-col items-center rounded-2xl border py-2 px-1.5 sm:py-2.5 sm:px-3 text-center transition-all duration-300 hover:-translate-y-0.5 cursor-pointer ${
                        isSelected
                          ? "bg-white/[0.04] opacity-100"
                          : "border-white/30 bg-surface/80 hover:border-white/50 hover:bg-surface-variant opacity-40 hover:opacity-80"
                        }`}
                        style={{
                          borderColor: isSelected ? `${cardColorHex}60` : undefined,
                          boxShadow: isSelected ? `0 0 20px ${cardColorHex}30` : undefined,
                        }}
                      >
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
                          <p className="mt-2 font-headline text-xs font-bold leading-tight">{label}</p>
                          {badge && (
                            <span className={`mt-1.5 inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.06em] px-1.5 py-0.5 rounded border`} style={badgeStyle}>
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
                      <PaywallCard paywall={getFeaturePaywall('full_daily_horoscope')!} variant="overlay" />
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
                        </div>

                        <div className="mt-auto pt-2 flex flex-row gap-3 w-full">
                          <Link
                            href={`/horoscope/forecast?area=${activeArea}`}
                            className="flex-1 flex items-center justify-center text-center rounded-xl px-3 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all"
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

                          {(activeAreaNotes.length > 0 || activeAreaTone) && (
                            <button
                              onClick={() => setIsNotesModalOpen(true)}
                              className="flex-1 flex items-center justify-center text-center rounded-xl px-3 py-2.5 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                              style={{
                                color: activeAreaHex,
                                borderWidth: "1px",
                                borderStyle: "solid",
                                borderColor: `${activeAreaHex}4d`,
                                backgroundColor: `${activeAreaHex}0d`,
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${activeAreaHex}1a`; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${activeAreaHex}0d`; }}
                            >
                              {t('newDashboard.todaysEnergy.personalNotesBtn') || "Personalized Notes"}
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-foreground/50 italic">
                        Select an area below to view insights.
                      </p>
                    )}
                  </div>

                  {/* Right Column: Weekly Chart */}
                  <div className="w-full">
                    <h4 className="text-xs font-black uppercase tracking-[0.15em] text-secondary mb-2 text-left">
                      {t('newDashboard.currentWeekChartTitle') || "Current Week"}
                    </h4>
                    <div className="relative rounded-2xl overflow-hidden w-full bg-surface-variant/[0.035] px-4 py-4 min-h-[230px] flex flex-col justify-center">
                      {isFeatureBlocked('full_daily_horoscope') && getFeaturePaywall('full_daily_horoscope') ? (
                        <PaywallCard paywall={getFeaturePaywall('full_daily_horoscope')!} variant="overlay" />
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
            className="p-6 flex flex-col gap-4"
            borderVariant="muted"
          >
            <div className="flex flex-col gap-4 w-full">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-400/10 border border-rose-400/20">
                    <Heart className="h-5 w-5 text-rose-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-headline text-sm sm:text-base font-bold text-foreground truncate">
                      {t('newDashboard.familyFriends.compatibilityTitle') || "Your Compatibility with Friends & Family Today"}
                    </h2>
                    <p className="text-[9px] text-foreground/40 mt-0.5 uppercase tracking-[0.14em] font-bold truncate">
                      {t('newDashboard.familyFriends.compatibilitySubtitle') || "Cosmic bonds & energy alignment"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
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
                    className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-secondary hover:text-secondary/80 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t('newDashboard.familyFriends.addMember') || "Add Member"}</span>
                    <span className="sm:hidden">{t('family.addShort') || "Add"}</span>
                  </button>
                  <span className="h-3 w-px bg-outline-variant/30" aria-hidden="true" />
                  <Link
                    href="/family"
                    aria-label={t('newDashboard.familyFriends.title')}
                    className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-foreground/75 hover:text-secondary transition-colors"
                  >
                    {t('newDashboard.lifeAreas.viewAll') || "View All"} <ArrowRight className="inline h-3 w-3" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {familyLoading && !familyMembers && connectionsLoading && !familyConnections ? (
                  [0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl border border-outline-variant/8 bg-surface animate-pulse">
                      <div className="flex flex-col items-center gap-2.5 shrink-0">
                        <div className="h-12 w-12 rounded-full bg-surface-variant/20" />
                        <div className="h-4 w-12 rounded bg-surface-variant/20" />
                      </div>
                      <div className="flex-1 space-y-3 py-1">
                        <div className="h-3 w-28 rounded bg-surface-variant/20" />
                        <div className="h-2 w-16 rounded bg-surface-variant/20" />
                        <div className="h-5 w-full rounded bg-surface-variant/20 mt-2" />
                      </div>
                    </div>
                  ))
                ) : (
                  <>
                    {slots.map((slot, index) => {
                      if (slot.type === 'member') {
                        const blocked = isFeatureBlocked('family_compatibility');
                        return (
                          <DashboardFamilyMemberCard
                            key={`m-${slot.id}`}
                            member={slot.data}
                            t={t}
                            isCompatibilityBlocked={blocked}
                            onRunCompatibility={() => {
                              const pw = getFeaturePaywall('family_compatibility');
                              if (blocked && pw) { setActivePaywallData(pw); return; }
                              router.push(`/family?member=${slot.id}&run=1`);
                            }}
                          />
                        );
                      } else if (slot.type === 'connection') {
                        const blocked = isFeatureBlocked('family_compatibility');
                        return (
                          <DashboardConnectionCard
                            key={`c-${slot.id}`}
                            connection={slot.data}
                            t={t}
                            isCompatibilityBlocked={blocked}
                            onRunCompatibility={() => {
                              const pw = getFeaturePaywall('family_compatibility');
                              if (blocked && pw) { setActivePaywallData(pw); return; }
                              router.push('/family');
                            }}
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
            className="p-6 flex flex-col justify-between"
            borderVariant="muted"
          >
            <div className="flex flex-col gap-4 w-full h-full justify-between">
              <div>
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
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ...(mahadashaSub
                      ? [{ label: t('newDashboard.myChart.mahadasha'), sublabel: mahadashaSub, subtext: mahadashaRange, requiresFeature: 'kundli_premium' as PaywallFeatureKey }]
                      : horoscope?.planetary?.active_dasha
                        ? [{ label: t('newDashboard.myChart.mahadasha'), sublabel: horoscope.planetary.active_dasha, requiresFeature: 'kundli_premium' as PaywallFeatureKey }]
                        : [{ label: t('newDashboard.myChart.mahadasha'), sublabel: "..." }]),
                    ...(antardashaSub
                      ? [{ label: t('newDashboard.myChart.antardasha'), sublabel: antardashaSub, subtext: antardashaRange, requiresFeature: 'kundli_premium' as PaywallFeatureKey }]
                      : [{ label: t('newDashboard.myChart.antardasha'), sublabel: "..." }]),
                    (horoscope?.planetary?.dominant_planet
                      ? { label: "Dominant Planet", sublabel: horoscope.planetary.dominant_planet }
                      : { label: "Dominant Planet", sublabel: "..." }),
                  ].map((item, idx) => {
                    const isBlocked = item.requiresFeature ? isFeatureBlocked(item.requiresFeature) : false;
                    const paywallData = item.requiresFeature ? getFeaturePaywall(item.requiresFeature) : null;
                    const planetImg = getPlanetImage(item.sublabel);

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
                        className="relative flex flex-col items-center justify-center rounded-2xl border border-outline-variant/8 bg-surface p-3 transition-all hover:border-secondary/30 hover:bg-surface-variant cursor-pointer text-center min-h-[140px]"
                      >
                        {isBlocked && (
                          <div className="absolute top-2 right-2 text-secondary bg-surface/80 rounded-full p-1 border border-outline-variant/10 shadow-sm z-10">
                            <Lock className="h-3 w-3" />
                          </div>
                        )}
                        <div className="relative mb-2 shrink-0">
                          <img
                            src={planetImg}
                            alt={item.sublabel || "Planet"}
                            className="h-12 w-12 object-contain"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center min-w-0 w-full">
                          <p className="text-[10px] font-bold tracking-wider text-foreground/45 uppercase truncate">{item.label}</p>
                          <p className={`font-headline text-sm sm:text-base font-bold text-foreground truncate mt-0.5 ${isBlocked ? "blur-[2px] select-none opacity-50" : ""}`}>
                            {item.sublabel}
                          </p>
                          {item.subtext && (
                            <p className={`text-[9px] sm:text-[10px] text-foreground/45 truncate mt-0.5 ${isBlocked ? "blur-[2.5px] select-none opacity-50" : ""}`}>
                              {item.subtext}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cosmic Snapshot Details (fills the empty space) */}
              <div className="flex-1 flex flex-col justify-center py-4 border-t border-outline-variant/8 mt-4">
                <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40 uppercase mb-3 text-left">
                  Cosmic Alignment Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      label: "Nakshatra (Birth Star)",
                      value: kundliStats?.nakshatra || "...",
                      subtext: kundliStats?.nakshatraLord ? `Lord: ${kundliStats.nakshatraLord}` : "Astrological Star",
                      icon: <Star className="h-4 w-4 text-amber-400" />
                    },
                    {
                      label: "Moon Phase",
                      value: kundliStats?.moonPhase || "...",
                      subtext: "Current Lunar Cycle",
                      icon: <Moon className="h-4 w-4 text-purple-400" />
                    },
                    {
                      label: "Dasha Time Remaining",
                      value: kundliStats?.dashaRemaining || "...",
                      subtext: "Active Dasha Period",
                      icon: <Gem className="h-4 w-4 text-emerald-400" />,
                      requiresFeature: 'kundli_premium' as PaywallFeatureKey
                    },
                    {
                      label: "Lucky Elements",
                      value: horoscope?.lucky_color || horoscope?.lucky?.color ? `${horoscope.lucky_color || horoscope.lucky?.color}` : "...",
                      subtext: horoscope?.lucky_number || horoscope?.lucky?.number ? `Lucky Number: ${horoscope.lucky_number || horoscope.lucky?.number}` : "Daily Alignment",
                      icon: <Sparkles className="h-4 w-4 text-blue-400" />
                    }
                  ].map((stat, sIdx) => {
                    const isBlocked = stat.requiresFeature ? isFeatureBlocked(stat.requiresFeature) : false;
                    const paywallData = stat.requiresFeature ? getFeaturePaywall(stat.requiresFeature) : null;
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
                        className="relative flex gap-3 rounded-2xl border border-outline-variant/8 bg-surface-variant/[0.02] p-3 text-left transition-all hover:border-secondary/35 hover:bg-surface-variant/4 cursor-pointer"
                      >
                        {isBlocked && (
                          <div className="absolute top-2 right-2 text-secondary bg-surface/80 rounded-full p-0.5 border border-outline-variant/10 shadow-sm z-10">
                            <Lock className="h-2.5 w-2.5" />
                          </div>
                        )}
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-surface-variant/10 border border-outline-variant/8">
                          {stat.icon}
                        </div>
                        <div className="min-w-0 leading-tight">
                          <p className="text-[9px] font-bold text-foreground/45 uppercase tracking-wider">{stat.label}</p>
                          <p className={`font-headline text-xs font-bold text-foreground truncate mt-1 ${isBlocked ? "blur-[2px] select-none opacity-50" : ""}`}>{stat.value}</p>
                          <p className={`text-[9px] text-foreground/45 truncate mt-0.5 ${isBlocked ? "blur-[2px] select-none opacity-50" : ""}`}>{stat.subtext}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
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

      {/* EXPLORE YOUR COSMIC NETWORK SECTION */}
      <div className="relative z-10 mx-auto max-w-[1760px] px-4 py-12 sm:px-6 lg:px-8 2xl:max-w-[2100px] 3xl:max-w-[2400px]">
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

        <div>
          {/* MEET YOUR AI ASTROLOGERS */}
            <DarkPanel className="p-6" borderVariant="top-gold">
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

        </div>

        {/* COSMIC PORTALS — Full Width */}
        <DarkPanel className="mt-8 p-6" borderVariant="muted">
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
              { icon: <Globe className="h-5 w-5" />, title: t('dashboard.janamKundli'), desc: t('dashboard.janamKundliDesc'), action: t('dashboard.openChart'), href: "/kundli", color: PORTAL_COLORS.kundli, requiresFeature: 'kundli_premium' as PaywallFeatureKey },
              { icon: <Heart className="h-5 w-5" />, title: t('dashboard.soulmateSync'), desc: t('newDashboard.portalSoulmateDesc'), action: t('dashboard.analyzeMatch'), href: "/kundli/match", color: PORTAL_COLORS.match, requiresFeature: 'match_report' as PaywallFeatureKey },
              { icon: <Sun className="h-5 w-5" />, title: t('dashboard.dailyPulse'), desc: t('newDashboard.portalPulseDesc'), action: t('newDashboard.viewToday'), href: "/horoscope/forecast", color: PORTAL_COLORS.forecast, requiresFeature: 'full_daily_horoscope' as PaywallFeatureKey },
              { icon: <Orbit className="h-5 w-5" />, title: t('newDashboard.rashiLibrary'), desc: t('newDashboard.portalRashiDesc'), action: t('dashboard.openLibrary'), href: "/rashis", color: PORTAL_COLORS.rashi },
              { icon: <Sparkles className="h-5 w-5" />, title: t('dashboard.sessions'), desc: t('newDashboard.portalSessionsDesc'), action: t('dashboard.joinSession'), href: "/consult", color: PORTAL_COLORS.sessions, requiresFeature: 'guided_consult' as PaywallFeatureKey },
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
            className="fixed inset-0 z-[10050] flex items-start justify-center overflow-y-auto p-4 sm:items-center"
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

              <h2 className="font-headline text-2xl font-bold mb-1">
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

              <h2 className="font-headline text-2xl font-bold mb-1">
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

              <h2 className="font-headline text-2xl font-bold mb-1">
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
                        ? "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20"
                        : activeAreaTone === "negative" || activeAreaTone === "caution"
                        ? "text-red-400 bg-red-400/10 border border-red-400/20"
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

              <h2 className="font-headline text-2xl font-bold mb-1">
                Today's Advice
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
