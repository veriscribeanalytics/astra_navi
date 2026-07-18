import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Out | AstraMitra',
  description: 'Sign out from your AstraMitra account.',
};

export default function LogoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}