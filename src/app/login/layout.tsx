import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | AstraMitra',
  description: 'Sign in to your AstraMitra account and unlock your personalized Vedic astrological insights.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
