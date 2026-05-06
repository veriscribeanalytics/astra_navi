import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guided Consultations | AstraNavi',
  description: 'Experience a structured house-by-house analysis of your birth chart. Get strategic clarity on Career, Marriage, and Wealth with Vedic logic.',
};

export default function ConsultLayout({ children }: { children: React.ReactNode }) {
  return children;
}
