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
  border: string;
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

type AreaPhasePair = Pick<AreaColorSet, "main" | "glow">;

// Each area now carries its own 5-step phase gradient (area × phase). The color
// is rating-dependent again: an area's hue shifts as its score moves through the
// BAD → EXCELLENT bands. See getScorePhase() for the cutoffs.
export const AREA_PHASE_COLORS: Record<"overall" | ForecastArea, Record<ScorePhase, AreaPhasePair>> = {
  // Semantic score colours: green (positive), amber (caution), rose (alert)
  overall: {
    BAD: { main: "#F05B68", glow: "#F05B68" },
    WEAK: { main: "#D9A136", glow: "#D9A136" },
    MIXED: { main: "#D9A136", glow: "#D9A136" },
    GOOD: { main: "#2FD3A0", glow: "#2FD3A0" },
    EXCELLENT: { main: "#2FD3A0", glow: "#2FD3A0" },
  },
  // Traffic light
  general: {
    BAD: { main: "#DC2626", glow: "#F87171" },
    WEAK: { main: "#F97316", glow: "#FDBA74" },
    MIXED: { main: "#F59E0B", glow: "#FBBF24" },
    GOOD: { main: "#22C55E", glow: "#86EFAC" },
    EXCELLENT: { main: "#047857", glow: "#6EE7B7" },
  },
  // Pink / rose
  love: {
    BAD: { main: "#BE123C", glow: "#FB7185" },
    WEAK: { main: "#E11D48", glow: "#FB7185" },
    MIXED: { main: "#F43F5E", glow: "#FDA4AF" },
    GOOD: { main: "#DB2777", glow: "#F472B6" },
    EXCELLENT: { main: "#BE185D", glow: "#F9A8D4" },
  },
  // Slate → blue / indigo
  career: {
    BAD: { main: "#334155", glow: "#64748B" },
    WEAK: { main: "#475569", glow: "#94A3B8" },
    MIXED: { main: "#2563EB", glow: "#60A5FA" },
    GOOD: { main: "#3B82F6", glow: "#93C5FD" },
    EXCELLENT: { main: "#6366F1", glow: "#A5B4FC" },
  },
  // Stone → gold → emerald
  finance: {
    BAD: { main: "#78716C", glow: "#D6D3D1" },
    WEAK: { main: "#A16207", glow: "#FACC15" },
    MIXED: { main: "#059669", glow: "#34D399" },
    GOOD: { main: "#16A34A", glow: "#6EE7B7" },
    EXCELLENT: { main: "#065F46", glow: "#34D399" },
  },
  // Grey → lime → teal
  health: {
    BAD: { main: "#4B5563", glow: "#9CA3AF" },
    WEAK: { main: "#4D7C0F", glow: "#A3E635" },
    MIXED: { main: "#0F766E", glow: "#2DD4BF" },
    GOOD: { main: "#0D9488", glow: "#5EEAD4" },
    EXCELLENT: { main: "#14B8A6", glow: "#99F6E4" },
  },
  // Violet → purple
  spiritual: {
    BAD: { main: "#3B0764", glow: "#6D28D9" },
    WEAK: { main: "#5B21B6", glow: "#A78BFA" },
    MIXED: { main: "#7C3AED", glow: "#C4B5FD" },
    GOOD: { main: "#8B5CF6", glow: "#C4B5FD" },
    EXCELLENT: { main: "#6D28D9", glow: "#DDD6FE" },
  },
};

export const STATUS_COLORS: Record<ScorePhase, StatusColorSet> = {
  BAD: {
    main: "#F05B68",
    bg: "rgba(240, 91, 104, 0.14)",
    border: "rgba(240, 91, 104, 0.28)",
  },
  WEAK: {
    main: "#D9A136",
    bg: "rgba(217, 161, 54, 0.14)",
    border: "rgba(217, 161, 54, 0.28)",
  },
  MIXED: {
    main: "#D9A136",
    bg: "rgba(217, 161, 54, 0.14)",
    border: "rgba(217, 161, 54, 0.28)",
  },
  GOOD: {
    main: "#2FD3A0",
    bg: "rgba(47, 211, 160, 0.14)",
    border: "rgba(47, 211, 160, 0.28)",
  },
  EXCELLENT: {
    main: "#2FD3A0",
    bg: "rgba(47, 211, 160, 0.14)",
    border: "rgba(47, 211, 160, 0.28)",
  },
};

export const SIGNAL_BADGES: Record<"BEST" | "STABLE" | "WORST", SignalBadgeSet> = {
  BEST: {
    label: "BEST TODAY",
    main: "#35CFA0",
    bg: "rgba(53, 207, 160, 0.14)",
    border: "rgba(53, 207, 160, 0.28)",
  },
  STABLE: {
    label: "STABLE THIS WEEK",
    main: "#9A72D8",
    bg: "rgba(154, 114, 216, 0.14)",
    border: "rgba(154, 114, 216, 0.28)",
  },
  WORST: {
    label: "NEEDS ATTENTION",
    main: "#E16272",
    bg: "rgba(225, 98, 114, 0.14)",
    border: "rgba(225, 98, 114, 0.28)",
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

// The phase used for an area's *identity* color when no score is available
// (icons, neutral chrome). GOOD reads as the area's "signature" hue.
const IDENTITY_PHASE: ScorePhase = "GOOD";

export function getAreaPhaseColors(area: ForecastArea | "overall", score: number): AreaPhasePair {
  return AREA_PHASE_COLORS[area][getScorePhase(score)];
}

export function getAreaPhaseMain(area: ForecastArea | "overall", score: number): string {
  return getAreaPhaseColors(area, score).main;
}

export function getAreaPhaseGlowColor(area: ForecastArea | "overall", score: number): string {
  return getAreaPhaseColors(area, score).glow;
}

export function getAreaMainColor(area: ForecastArea | "overall"): string {
  return AREA_PHASE_COLORS[area][IDENTITY_PHASE].main;
}

export function getAreaGlowColor(area: ForecastArea | "overall"): string {
  return AREA_PHASE_COLORS[area][IDENTITY_PHASE].glow;
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

// Legacy compat — area color is now rating-dependent again (area × phase),
// so these correctly honor the score that was always passed in.
export interface PhaseColor {
  main: string;
  glow: string;
}

export function getAreaColor(area: ForecastArea, score: number): PhaseColor {
  return getAreaPhaseColors(area, score);
}

export function getAreaPhaseHex(area: ForecastArea, score: number): string {
  return getAreaPhaseColors(area, score).main;
}

export function getAreaPhaseGlow(area: ForecastArea, score: number): string {
  return getAreaPhaseColors(area, score).glow;
}