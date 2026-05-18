import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forecast | Astra Navi",
  description: "Monthly and yearly astrological forecasts powered by Vedic astrology",
};

export default function HoroscopeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
