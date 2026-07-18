import CommunityClient from './CommunityClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Community | AstraMitra',
    description: 'Join the AstraMitra community — connect with fellow astrology enthusiasts, share insights, and explore Vedic wisdom together.',
};

export default function CommunityPage() {
    return <CommunityClient />;
}
