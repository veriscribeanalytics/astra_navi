'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks';
import NewDashboardClient from './NewDashboardClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { Sparkles, Compass, BookOpen } from 'lucide-react';

function NewDashboardContent() {
  const { isLoggedIn, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
        </div>
        <p className="text-[14px] text-foreground/40 font-medium">{t('newDashboard.todaysEnergy.openingDashboard')}</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <PublicFeatureLanding
        title={t('newDashboard.landing.title')}
        subtitle={t('newDashboard.landing.subtitle')}
        description={t('newDashboard.landing.description')}
        hook={t('newDashboard.landing.hook')}
        icon={<Sparkles className="w-4 h-4" />}
        ctaLabel="Sign In"
        callbackUrl="/new"
        features={[
          {
            title: t('newDashboard.landing.feature1Title'),
            desc: t('newDashboard.landing.feature1Desc'),
            icon: <Sparkles className="w-5 h-5" />
          },
          {
            title: t('newDashboard.landing.feature2Title'),
            desc: t('newDashboard.landing.feature2Desc'),
            icon: <Compass className="w-5 h-5" />
          },
          {
            title: t('newDashboard.landing.feature3Title'),
            desc: t('newDashboard.landing.feature3Desc'),
            icon: <BookOpen className="w-5 h-5" />
          }
        ]}
        benefits={[
          t('newDashboard.landing.benefit1'),
          t('newDashboard.landing.benefit2'),
          t('newDashboard.landing.benefit3'),
          t('newDashboard.landing.benefit4')
        ]}
      />
    );
  }

  return <NewDashboardClient />;
}

export default function NewDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-[60vh]">
          <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
        </div>
      }
    >
      <NewDashboardContent />
    </Suspense>
  );
}
