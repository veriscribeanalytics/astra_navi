import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password | AstraMitra',
  description: 'Reset your AstraMitra account password to regain access to your personalized Vedic astrology insights.',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}