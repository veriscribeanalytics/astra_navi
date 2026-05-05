import type { Metadata } from 'next';
import WorkInProgress from '@/components/WorkInProgress';

export const metadata: Metadata = {
  title: 'Support | AstraNavi',
  description: 'Get help with your AstraNavi account or reach our support team.',
};

export default function SupportPage() {
    return (
        <WorkInProgress 
            title="Contact Support"
            description="Need help? Our support system is being set up to provide you with the best assistance. For urgent matters, please check back soon!"
        />
    );
}
