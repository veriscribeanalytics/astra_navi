import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | AstraNavi',
  description: 'Read the AstraNavi Terms of Service — our policies on usage, payments, subscriptions, and data handling.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
