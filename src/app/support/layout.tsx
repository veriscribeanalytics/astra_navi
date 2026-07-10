import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support & Help Center | AstraNavi',
  description: 'Get help with AstraNavi — find answers to common questions, contact support, and resolve account or billing issues.',
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
