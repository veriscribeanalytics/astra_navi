import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vedic Zodiac Signs (Rashis) | AstraNavi',
  description: 'Explore the 12 Vedic moon signs. Understand your psychological traits, strengths, and karmic tendencies according to Jyotish Shastra.',
};

export default function RashisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
