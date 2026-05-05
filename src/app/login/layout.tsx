import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | AstraNavi',
  description: 'Sign in to your AstraNavi account and unlock your personalized Vedic astrological insights.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
