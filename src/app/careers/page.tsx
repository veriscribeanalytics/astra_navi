import WorkInProgress from '@/components/WorkInProgress';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers at AstraNavi',
  robots: { index: false, follow: false },
};

export default function CareersPage() {
    return (
        <WorkInProgress 
            title="Careers at Astra Navi"
            description="Join our team and help us bring ancient wisdom to the modern world. Career opportunities and openings will be posted here soon!"
        />
    );
}
