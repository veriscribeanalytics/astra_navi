import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vedic Remedies | AstraNavi Blog",
  description:
    "Explore time-tested Vedic remedies — gemstones, mantras, rituals, and lifestyle adjustments — to strengthen beneficial planets and mitigate challenging placements.",
  openGraph: {
    title: "Vedic Remedies | AstraNavi Blog",
    description:
      "Explore time-tested Vedic remedies — gemstones, mantras, rituals, and lifestyle adjustments — to strengthen beneficial planets and mitigate challenging placements.",
  },
};

export default function RemediesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
