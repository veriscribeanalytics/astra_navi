import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | AstraMitra',
  description: 'Read the AstraMitra Privacy Policy — how we collect, use, and protect your personal data and astrological information.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
