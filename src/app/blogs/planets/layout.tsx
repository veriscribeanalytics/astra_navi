import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Planets (Grahas) in Vedic Astrology | AstraNavi Blog",
  description:
    "Discover the 9 Navagraha of Vedic astrology — Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu — their qualities, rulerships, and influence on your birth chart.",
  openGraph: {
    title: "Planets (Grahas) in Vedic Astrology | AstraNavi Blog",
    description:
      "Discover the 9 Navagraha of Vedic astrology — Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu — their qualities, rulerships, and influence on your birth chart.",
  },
};

export default function PlanetsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
