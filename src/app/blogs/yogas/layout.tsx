import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Yogas in Vedic Astrology | AstraMitra Blog",
  description:
    "Understand powerful Vedic Yogas — Raja Yoga, Gaja Kesari, Dhana Yoga, and more — how they form in your chart and what they mean for your destiny.",
  openGraph: {
    title: "Yogas in Vedic Astrology | AstraMitra Blog",
    description:
      "Understand powerful Vedic Yogas — Raja Yoga, Gaja Kesari, Dhana Yoga, and more — how they form in your chart and what they mean for your destiny.",
  },
};

export default function YogasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
