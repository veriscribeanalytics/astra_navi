import type { ForecastArea } from "./areaThemes";

export type ScorePhase = "BAD" | "WEAK" | "MIXED" | "GOOD" | "EXCELLENT";

export interface AreaColorSet {
  main: string;
  glow: string;
  soft: string;
}

export interface StatusColorSet {
  main: string;
  bg: string;
  border: string;
}

export interface SignalBadgeSet {
  label: string;
  main: string;
  bg: string;
}

export interface BrandGoldSet {
  main: string;
  hover: string;
  soft: string;
  border: string;
}

export interface TextColorSet {
  heading: string;
  body: string;
  muted: string;
  faint: string;
}

export const AREA_COLORS: Record<"overall" | ForecastArea, AreaColorSet> = {
  overall: {
    main: "#818CF8",
    glow: "#C7D2FE",
    soft: "rgba(129, 140, 248, 0.14)",
  },
  general: {
    main: "#CBD5E1",
    glow: "#E2E8F0",
    soft: "rgba(203, 213, 225, 0.12)",
  },
  love: {
    main: "#F472B6",
    glow: "#F9A8D4",
    soft: "rgba(244, 114, 182, 0.14)",
  },
  career: {
    main: "#60A5FA",
    glow: "#93C5FD",
    soft: "rgba(96, 165, 250, 0.14)",
  },
  finance: {
    main: "#34D399",
    glow: "#A7F3D0",
    soft: "rgba(52, 211, 153, 0.14)",
  },
  health: {
    main: "#2DD4BF",
    glow: "#99F6E4",
    soft: "rgba(45, 212, 191, 0.14)",
  },
  spiritual: {
    main: "#A78BFA",
    glow: "#DDD6FE",
    soft: "rgba(167, 139, 250, 0.16)",
  },
};

export const STATUS_COLORS: Record<ScorePhase, StatusColorSet> = {
  BAD: {
    main: "#EF4444",
    bg: "rgba(239, 68, 68, 0.14)",
    border: "rgba(239, 68, 68, 0.28)",
  },
  WEAK: {
    main: "#F97316",
    bg: "rgba(249, 115, 22, 0.14)",
    border: "rgba(249, 115, 22, 0.28)",
  },
  MIXED: {
    main: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.14)",
    border: "rgba(245, 158, 11, 0.28)",
  },
  GOOD: {
    main: "#22C55E",
    bg: "rgba(34, 197, 94, 0.14)",
    border: "rgba(34, 197, 94, 0.28)",
  },
  EXCELLENT: {
    main: "#14B8A6",
    bg: "rgba(20, 184, 166, 0.14)",
    border: "rgba(20, 184, 166, 0.28)",
  },
};

export const SIGNAL_BADGES: Record<"BEST" | "STABLE" | "WORST", SignalBadgeSet> = {
  BEST: {
    label: "BEST TODAY",
    main: "#22C55E",
    bg: "rgba(34, 197, 94, 0.14)",
  },
  STABLE: {
    label: "STABLE THIS WEEK",
    main: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.14)",
  },
  WORST: {
    label: "NEEDS ATTENTION",
    main: "#EF4444",
    bg: "rgba(239, 68, 68, 0.14)",
  },
};

export const BRAND_GOLD: BrandGoldSet = {
  main: "#C9972E",
  hover: "#E0B85A",
  soft: "rgba(201, 151, 46, 0.12)",
  border: "rgba(201, 151, 46, 0.28)",
};

export const TEXT_COLORS: TextColorSet = {
  heading: "var(--text-heading)",
  body: "var(--text-body)",
  muted: "var(--text-muted)",
  faint: "var(--text-faint)",
};

export function getScorePhase(score: number): ScorePhase {
  if (score >= 80) return "EXCELLENT";
  if (score >= 65) return "GOOD";
  if (score >= 50) return "MIXED";
  if (score >= 35) return "WEAK";
  return "BAD";
}

export function getAreaMainColor(area: ForecastArea | "overall"): string {
  return AREA_COLORS[area].main;
}

export function getAreaGlowColor(area: ForecastArea | "overall"): string {
  return AREA_COLORS[area].glow;
}

export function getAreaSoftColor(area: ForecastArea | "overall"): string {
  return AREA_COLORS[area].soft;
}

export function getStatusColor(phase: ScorePhase): StatusColorSet {
  return STATUS_COLORS[phase];
}

export function getStatusMainColor(score: number): string {
  return STATUS_COLORS[getScorePhase(score)].main;
}

export function getStatusBgColor(score: number): string {
  return STATUS_COLORS[getScorePhase(score)].bg;
}

export function getStatusBorderColor(score: number): string {
  return STATUS_COLORS[getScorePhase(score)].border;
}

// Legacy compat — kept so existing callers still work, but area color is now
// the *identity* color (not rating-dependent).
export interface PhaseColor {
  main: string;
  glow: string;
}

export function getAreaColor(area: ForecastArea, score: number): PhaseColor {
  const ac = AREA_COLORS[area];
  return { main: ac.main, glow: ac.glow };
}

export function getAreaPhaseHex(area: ForecastArea, score: number): string {
  return AREA_COLORS[area].main;
}

export function getAreaPhaseGlow(area: ForecastArea, score: number): string {
  return AREA_COLORS[area].glow;
}