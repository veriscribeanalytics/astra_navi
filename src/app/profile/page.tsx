import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'My Celestial Profile | AstraNavi',
  description: 'Manage your birth coordinates to ensure your cosmic readings are always perfectly aligned.',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
      </div>
    }>
      <ProfileClient />
    </Suspense>
  );
}
