import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Houses in Vedic Astrology | AstraMitra Blog",
  description:
    "Explore the 12 Bhavas (houses) of Vedic astrology — their meanings, significations, and how they shape every area of your life from personality to spirituality.",
  openGraph: {
    title: "Houses in Vedic Astrology | AstraMitra Blog",
    description:
      "Explore the 12 Bhavas (houses) of Vedic astrology — their meanings, significations, and how they shape every area of your life from personality to spirituality.",
  },
};

export default function HousesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
