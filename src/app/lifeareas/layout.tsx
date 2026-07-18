import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Life Areas Forecast | AstraMitra",
  description:
    "Explore your six key life areas — Career, Love, Finance, Health, Spiritual Growth, and General — with AI-powered Vedic transit scores, weekly trends, and personalized insights.",
  openGraph: {
    title: "Life Areas Forecast | AstraMitra",
    description:
      "Explore your six key life areas — Career, Love, Finance, Health, Spiritual Growth, and General — with AI-powered Vedic transit scores, weekly trends, and personalized insights.",
  },
};

export default function LifeAreasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
