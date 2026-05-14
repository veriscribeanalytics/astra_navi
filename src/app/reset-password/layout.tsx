import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Password | AstraNavi',
  description: 'Set a new password for your AstraNavi account.',
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}