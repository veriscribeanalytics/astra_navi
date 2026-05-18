import { Trophy, Sun, Heart, Gem } from "lucide-react";

export type ForecastArea = "career" | "health" | "love" | "finance";

export interface AreaTheme {
  key: ForecastArea;
  color: string;
  bg: string;
  hex: string;
  icon: typeof Trophy;
}

export const AREA_THEMES: Record<ForecastArea, Omit<AreaTheme, "key">> = {
  career: { color: "text-orange-500", bg: "bg-orange-500/10", hex: "#f97316", icon: Trophy },
  health: { color: "text-green-500", bg: "bg-green-500/10", hex: "#22c55e", icon: Sun },
  love: { color: "text-pink-500", bg: "bg-pink-500/10", hex: "#ec4899", icon: Heart },
  finance: { color: "text-amber-500", bg: "bg-amber-500/10", hex: "#f59e0b", icon: Gem },
};

export const AREA_LIST: ForecastArea[] = ["career", "love", "health", "finance"];
