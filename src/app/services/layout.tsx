import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Astrology Services | AstraNavi",
  description:
    "Discover AI-powered Vedic astrology services — Kundli generation, daily horoscopes, life-area forecasts, personalized remedies, and live consultations with AI astrologers.",
  openGraph: {
    title: "Astrology Services | AstraNavi",
    description:
      "Discover AI-powered Vedic astrology services — Kundli generation, daily horoscopes, life-area forecasts, personalized remedies, and live consultations with AI astrologers.",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
