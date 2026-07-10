import CommunityClient from './CommunityClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Community | AstraNavi',
    description: 'Join the AstraNavi community — connect with fellow astrology enthusiasts, share insights, and explore Vedic wisdom together.',
};

export default function CommunityPage() {
    return <CommunityClient />;
}
