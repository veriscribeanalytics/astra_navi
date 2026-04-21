import type { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'My Celestial Profile | AstraNavi',
  description: 'Manage your birth coordinates to ensure your cosmic readings are always perfectly aligned.',
};

export default function ProfilePage() {
  return <ProfileClient />;
}
