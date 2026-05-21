'use client';

import type { Metadata } from 'next';
import { useTranslation } from '@/hooks';
import WorkInProgress from '@/components/WorkInProgress';

// Note: Metadata cannot be used in client components
// Static metadata is kept but should be migrated to generateMetadata in a server component wrapper if needed

export default function SupportPage() {
    const { t } = useTranslation();

    return (
        <WorkInProgress
            title={t('support.title')}
            description={t('support.description')}
        />
    );
}
