'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import LifeAreasClient from './LifeAreasClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { TrendingUp, Compass, Calendar, Sparkles } from 'lucide-react';

function LifeAreasContent() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <PublicFeatureLanding
        title="Your Cosmic Life Areas"
        subtitle="Explore all 6 life areas in depth"
        description="See how transits and planetary cycles influence your Career, Love, Finance, Health, Spiritual Growth, and General well-being."
        hook="Ancient Vedic astrology maps the influence of the heavens onto distinct areas of human experience. Explore your real-time scores, detailed daily insights, weekly trends, and personalized notes for each dimension of life."
        icon={<TrendingUp className="w-4 h-4" />}
        ctaLabel="Explore My Life Areas"
        callbackUrl="/lifeareas"
        features={[
          {
            title: '6 Key Life Dimensions',
            desc: 'Get specialized scores and guidance for General, Love, Career, Finance, Health, and Spiritual paths.',
            icon: <Compass className="w-5 h-5" />,
          },
          {
            title: 'Weekly Outlook Graphs',
            desc: 'Track the rising and falling energy trends over a 7-day window for each area.',
            icon: <Calendar className="w-5 h-5" />,
          },
          {
            title: 'Personalized Notes & AI',
            desc: 'Read deeper astrological annotations and consult Navi directly for personalized remedies.',
            icon: <Sparkles className="w-5 h-5" />,
          },
        ]}
        benefits={[
          'Detailed explanations of positive and negative transits',
          'Interactive active area selector with full detail view',
          'Direct integration with Navi chat assistant for instant guidance',
          'Calculations grounded in your specific Vedic birth chart',
        ]}
        vedicAuthority="Calculated using houses, planetary transits, and Ashtakoota considerations"
      />
    );
  }

  return <LifeAreasClient />;
}

export default function LifeAreasRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    }>
      <LifeAreasContent />
    </Suspense>
  );
}
