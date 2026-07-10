import WorkInProgress from '@/components/WorkInProgress';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop | AstraNavi',
  robots: { index: false, follow: false },
};

export default function ShopPage() {
    return (
        <WorkInProgress 
            title="E-Commerce Shop"
            description="Browse our collection of spiritual items, gemstones, and astrological products. Our shop is opening soon with exclusive offerings!"
        />
    );
}
