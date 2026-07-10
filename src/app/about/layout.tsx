import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About AstraNavi | Vedic AI Astrology",
  description:
    "Learn about AstraNavi — where ancient Vedic astrology meets modern AI. Discover our mission to make cosmic wisdom accessible, personalized, and precise for everyone.",
  openGraph: {
    title: "About AstraNavi | Vedic AI Astrology",
    description:
      "Learn about AstraNavi — where ancient Vedic astrology meets modern AI. Discover our mission to make cosmic wisdom accessible, personalized, and precise for everyone.",
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
