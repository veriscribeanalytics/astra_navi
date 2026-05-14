import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Out | AstraNavi',
  description: 'Sign out from your AstraNavi account.',
};

export default function LogoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}