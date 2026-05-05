import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Janam Kundli | AstraNavi',
  description: 'Generate your free, precise Vedic birth chart with 16 Varga charts, Dasha timelines, and Shadbala analysis.',
};

export default function KundliLayout({ children }: { children: React.ReactNode }) {
  return children;
}
