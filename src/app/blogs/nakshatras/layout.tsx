import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nakshatras | AstraNavi Blog",
  description:
    "Deep dive into the 27 Nakshatras (lunar mansions) of Vedic astrology — their symbolism, ruling deities, and how they refine personality and compatibility predictions.",
  openGraph: {
    title: "Nakshatras | AstraNavi Blog",
    description:
      "Deep dive into the 27 Nakshatras (lunar mansions) of Vedic astrology — their symbolism, ruling deities, and how they refine personality and compatibility predictions.",
  },
};

export default function NakshatrasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
