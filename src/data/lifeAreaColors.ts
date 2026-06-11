import type { ForecastArea } from "./areaThemes";

export type ScorePhase = "BAD" | "WEAK" | "MIXED" | "GOOD" | "EXCELLENT";

export interface PhaseColor {
  main: string;
  glow: string;
}

export type AreaPalette = Record<ScorePhase, PhaseColor>;

export function getScorePhase(score: number): ScorePhase {
  if (score >= 80) return "EXCELLENT";
  if (score >= 65) return "GOOD";
  if (score >= 50) return "MIXED";
  if (score >= 35) return "WEAK";
  return "BAD";
}

export const LIFE_AREA_PALETTE: Record<ForecastArea, AreaPalette> = {
  general: {
    BAD:       { main: "#DC2626", glow: "#F87171" },
    WEAK:      { main: "#F97316", glow: "#FDBA74" },
    MIXED:     { main: "#F59E0B", glow: "#FBBF24" },
    GOOD:      { main: "#22C55E", glow: "#86EFAC" },
    EXCELLENT: { main: "#047857", glow: "#6EE7B7" },
  },
  love: {
    BAD:       { main: "#9F1239", glow: "#FB7185" },
    WEAK:      { main: "#E11D48", glow: "#FB7185" },
    MIXED:     { main: "#F43F5E", glow: "#FDA4AF" },
    GOOD:      { main: "#DB2777", glow: "#F472B6" },
    EXCELLENT: { main: "#EC4899", glow: "#F9A8D4" },
  },
  career: {
    BAD:       { main: "#334155", glow: "#64748B" },
    WEAK:      { main: "#475569", glow: "#94A3B8" },
    MIXED:     { main: "#2563EB", glow: "#60A5FA" },
    GOOD:      { main: "#3B82F6", glow: "#93C5FD" },
    EXCELLENT: { main: "#6366F1", glow: "#A5B4FC" },
  },
  finance: {
    BAD:       { main: "#78716C", glow: "#D6D3D1" },
    WEAK:      { main: "#A16207", glow: "#FACC15" },
    MIXED:     { main: "#059669", glow: "#34D399" },
    GOOD:      { main: "#16A34A", glow: "#6EE7B7" },
    EXCELLENT: { main: "#F59E0B", glow: "#FDE68A" },
  },
  health: {
    BAD:       { main: "#4D7C0F", glow: "#A3E635" },
    WEAK:      { main: "#0F766E", glow: "#2DD4BF" },
    MIXED:     { main: "#0D9488", glow: "#5EEAD4" },
    GOOD:      { main: "#14B8A6", glow: "#99F6E4" },
    EXCELLENT: { main: "#22C55E", glow: "#86EFAC" },
  },
  spiritual: {
    BAD:       { main: "#5B21B6", glow: "#A78BFA" },
    WEAK:      { main: "#7C3AED", glow: "#C4B5FD" },
    MIXED:     { main: "#8B5CF6", glow: "#DDD6FE" },
    GOOD:      { main: "#A855F7", glow: "#E9D5FF" },
    EXCELLENT: { main: "#6D28D9", glow: "#C4B5FD" },
  },
};

export function getAreaColor(area: ForecastArea, score: number): PhaseColor {
  const phase = getScorePhase(score);
  return LIFE_AREA_PALETTE[area][phase];
}

export function getAreaPhaseHex(area: ForecastArea, score: number): string {
  return getAreaColor(area, score).main;
}

export function getAreaPhaseGlow(area: ForecastArea, score: number): string {
  return getAreaColor(area, score).glow;
}