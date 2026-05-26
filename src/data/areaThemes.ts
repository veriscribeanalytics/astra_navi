import React from "react";
import { Star, Sparkles, LucideProps } from "lucide-react";

export type ForecastArea = "career" | "health" | "love" | "finance" | "general" | "spiritual";

export interface AreaTheme {
  key: ForecastArea;
  color: string;
  bg: string;
  hex: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: React.ComponentType<any>;
}

const CareerIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  React.createElement("img", {
    src: "/icons/career.png",
    alt: "Career",
    ...props
  })
);

const HealthIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  React.createElement("img", {
    src: "/icons/health.png",
    alt: "Health",
    ...props
  })
);

const LoveIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  React.createElement("img", {
    src: "/icons/relationship.png",
    alt: "Relationship",
    ...props
  })
);

const FinanceIcon = (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
  React.createElement("img", {
    src: "/icons/finance.png",
    alt: "Finance",
    ...props
  })
);

const GeneralIcon = (props: LucideProps) => React.createElement(Star, props);
const SpiritualIcon = (props: LucideProps) => React.createElement(Sparkles, props);

export const AREA_THEMES: Record<ForecastArea, Omit<AreaTheme, "key">> = {
  career: { color: "text-orange-500", bg: "bg-orange-500/10", hex: "#f97316", icon: CareerIcon },
  health: { color: "text-green-500", bg: "bg-green-500/10", hex: "#22c55e", icon: HealthIcon },
  love: { color: "text-pink-500", bg: "bg-pink-500/10", hex: "#ec4899", icon: LoveIcon },
  finance: { color: "text-amber-500", bg: "bg-amber-500/10", hex: "#f59e0b", icon: FinanceIcon },
  general: { color: "text-secondary", bg: "bg-secondary/10", hex: "#c8991f", icon: GeneralIcon },
  spiritual: { color: "text-violet-500", bg: "bg-violet-500/10", hex: "#8b5cf6", icon: SpiritualIcon },
};

export const AREA_LIST: ForecastArea[] = ["love", "career", "finance", "health", "general", "spiritual"];
