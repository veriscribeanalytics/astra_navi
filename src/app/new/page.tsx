'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import NewDashboardClient from './NewDashboardClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { Sparkles, Compass, BookOpen } from 'lucide-react';

function NewDashboardContent() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
        </div>
        <p className="text-[14px] text-foreground/40 font-medium">Opening your dashboard...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <PublicFeatureLanding
        title="The New Dashboard"
        subtitle="Your Celestial Snapshot"
        description="Your full Vedic snapshot at a glance — score, transits, family, and your AI guides, in one place."
        hook="The positions of the Grahas and their constant movements shape the energy of every single day. The new dashboard serves as your daily Vedic portal, mapping real-time cosmic patterns onto your personal life areas, relationship charts, and daily schedules."
        icon={<Sparkles className="w-4 h-4" />}
        ctaLabel="Sign In"
        callbackUrl="/new"
        features={[
          {
            title: "Today's Energy Score",
            desc: "Get a real-time personalized score from 0-100 reflecting the aggregate planetary strength of your day.",
            icon: <Sparkles className="w-5 h-5" />
          },
          {
            title: "Panchang & Transits",
            desc: "Track active Tithi, Nakshatra, Yoga, Karana, and Rahu Kaal periods to align your actions with favorable timing.",
            icon: <Compass className="w-5 h-5" />
          },
          {
            title: "AI Astrology Guides",
            desc: "Consult specialized AI astrologers trained in Vedic systems, relationships, wealth, and KP branch.",
            icon: <BookOpen className="w-5 h-5" />
          }
        ]}
        benefits={[
          "Personalized daily scores powered by astronomical transits",
          "Compatibility scoring for friends and family members",
          "Mahadasha and Antardasha active planetary period parsing",
          "Direct consultations with specialized cosmic expert personas"
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
