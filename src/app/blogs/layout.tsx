import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vedic Astrology Blog | AstraNavi",
  description:
    "Explore in-depth articles on Vedic astrology — houses, planets, nakshatras, yogas, and remedies. Ancient wisdom explained with modern clarity.",
  openGraph: {
    title: "Vedic Astrology Blog | AstraNavi",
    description:
      "Explore in-depth articles on Vedic astrology — houses, planets, nakshatras, yogas, and remedies. Ancient wisdom explained with modern clarity.",
  },
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
