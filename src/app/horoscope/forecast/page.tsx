'use client';

import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import ForecastPage from '@/components/forecast/ForecastPage';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { TrendingUp, Calendar, Compass, Sparkles } from 'lucide-react';

function ForecastContent() {
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
        title="Your Personal Vedic Forecast"
        subtitle="Weekly • Monthly • Yearly outlook"
        description="See how your Dasha periods and current transits shape your career, relationships, health, and finances — visualized as a 7-day, monthly, and full-year forecast personal to your chart."
        hook="In Jyotish, time itself is a planet. Mahadasha and Antardasha periods govern the chapters of your life, while transiting Grahas color each day, week, and month. AstraMitra distills these cycles into a forecast you can actually act on."
        icon={<TrendingUp className="w-4 h-4" />}
        ctaLabel="Sign in to See Your Forecast"
        callbackUrl="/horoscope/forecast"
        features={[
          {
            title: 'Multi-area scoring',
            desc: 'Independent forecasts for career, love, health, and finance — each tied to relevant houses and planetary lords.',
            icon: <Compass className="w-5 h-5" />,
          },
          {
            title: 'Daily, monthly, yearly',
            desc: 'Switch between a 7-day pulse, monthly grid, and 12-month outlook with one tap. Best and worst windows highlighted.',
            icon: <Calendar className="w-5 h-5" />,
          },
          {
            title: 'Transit-aware insights',
            desc: 'Reads the active Mahadasha, Antardasha, and current planetary transits — not generic sun-sign predictions.',
            icon: <Sparkles className="w-5 h-5" />,
          },
        ]}
        benefits={[
          'Forecasts grounded in your actual Lagna, Moon, and Dasha periods',
          'Best/worst day & month highlighted for easy planning',
          'Localized verdicts in English, Hindi, Korean and more',
          'Free to start — no card required',
        ]}
        vedicAuthority="Based on classical Dasha calculations & transit analysis"
      />
    );
  }

  return <ForecastPage />;
}

export default function ForecastRoute() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
      </div>
    }>
      <ForecastContent />
    </Suspense>
  );
}
