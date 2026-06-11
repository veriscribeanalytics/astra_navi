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
  career: { color: "text-blue-500", bg: "bg-blue-500/10", hex: "#3B82F6", icon: CareerIcon },
  health: { color: "text-teal-500", bg: "bg-teal-500/10", hex: "#14B8A6", icon: HealthIcon },
  love: { color: "text-pink-600", bg: "bg-pink-600/10", hex: "#DB2777", icon: LoveIcon },
  finance: { color: "text-green-600", bg: "bg-green-600/10", hex: "#16A34A", icon: FinanceIcon },
  general: { color: "text-amber-500", bg: "bg-amber-500/10", hex: "#F59E0B", icon: GeneralIcon },
  spiritual: { color: "text-purple-500", bg: "bg-purple-500/10", hex: "#A855F7", icon: SpiritualIcon },
};

export const AREA_LIST: ForecastArea[] = ["general", "love", "career", "finance", "health", "spiritual"];
