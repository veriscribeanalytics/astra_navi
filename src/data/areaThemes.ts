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
  career: { color: "text-blue-400", bg: "bg-blue-400/10", hex: "#60A5FA", icon: CareerIcon },
  health: { color: "text-[#24C7A5]", bg: "bg-[#24C7A5]/10", hex: "#24C7A5", icon: HealthIcon },
  love: { color: "text-[#F0527D]", bg: "bg-[#F0527D]/10", hex: "#F0527D", icon: LoveIcon },
  finance: { color: "text-emerald-400", bg: "bg-emerald-400/10", hex: "#34D399", icon: FinanceIcon },
  general: { color: "text-[#D9A12E]", bg: "bg-[#D9A12E]/10", hex: "#D9A12E", icon: GeneralIcon },
  spiritual: { color: "text-violet-400", bg: "bg-violet-400/10", hex: "#A78BFA", icon: SpiritualIcon },
};

export const AREA_LIST: ForecastArea[] = ["general", "love", "career", "finance", "health", "spiritual"];
