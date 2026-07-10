import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Consult AI Astrologers | AstraNavi",
  description:
    "Chat with AI Vedic astrologers — Navi, Arya, Meera, Anand, Vidya, and Rishi — each specializing in career, relationships, health, finance, and deep chart analysis.",
  openGraph: {
    title: "Consult AI Astrologers | AstraNavi",
    description:
      "Chat with AI Vedic astrologers — Navi, Arya, Meera, Anand, Vidya, and Rishi — each specializing in career, relationships, health, finance, and deep chart analysis.",
  },
};

export default function AstrologersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
