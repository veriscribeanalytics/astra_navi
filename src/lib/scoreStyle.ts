import { STATUS_COLORS, getScorePhase, type ScorePhase } from "@/data/lifeAreaColors";

export interface ScoreStyleResult {
  color: string;
  bg: string;
  hex: string;
  label: string;
}

export function getScoreStyle(score: number, t: (k: string) => string): ScoreStyleResult {
  const phase: ScorePhase = getScorePhase(score);
  const sc = STATUS_COLORS[phase];

  const labelMap: Record<ScorePhase, string> = {
    EXCELLENT: t("horoscope.excellent"),
    GOOD: t("horoscope.good"),
    MIXED: t("horoscope.fair"),
    WEAK: t("horoscope.low"),
    BAD: t("horoscope.low"),
  };

  return {
    color: `text-[${sc.main}]`,
    bg: `bg-[${sc.bg}]`,
    hex: sc.main,
    label: labelMap[phase],
  };
}