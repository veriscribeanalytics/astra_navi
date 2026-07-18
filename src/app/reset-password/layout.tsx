import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | AstraMitra',
  description: 'Set a new password for your AstraMitra account.',
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}