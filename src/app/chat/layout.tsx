import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consult Navi — AI Vedic Guide | AstraNavi',
  description: 'Instant, private, and chart-aware astrological guidance. Navi is your 24/7 Vedic companion for clarity on career, love, and life.',
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}
