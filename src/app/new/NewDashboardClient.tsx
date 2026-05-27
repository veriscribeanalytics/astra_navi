'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useDailyHoroscope, useTransitsToday } from '@/hooks';

import TodaysEnergyCard from './components/TodaysEnergyCard';
import WeeklyChartCard from './components/WeeklyChartCard';
import LifeAreasGrid from './components/LifeAreasGrid';
import PanchangStrip from './components/PanchangStrip';
import CompatibilityCard from './components/CompatibilityCard';
import FamilyFriendsStrip from './components/FamilyFriendsStrip';
import MyChartCard from './components/MyChartCard';
import AiAstrologerStrip from './components/AiAstrologerStrip';

export default function NewDashboardClient() {
  const { user, isLoading: userLoading } = useAuth();
  const { data: horoscope, isLoading: horoscopeLoading } = useDailyHoroscope();
  const { data: transits, isLoading: transitsLoading } = useTransitsToday();

  const primaryLoading = horoscopeLoading || userLoading;

  return (
    <div className="relative w-full flex-grow bg-[var(--bg)] min-h-[calc(100dvh-var(--navbar-height,64px))] overflow-hidden">
      <div className="relative z-10 max-w-[680px] lg:max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-4 sm:space-y-5">
        {/* Lotus hero motif — sits above the first card as a glowing centerpiece. */}
        <div className="flex justify-center -mb-2 sm:-mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/lotus.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none w-[180px] sm:w-[220px] lg:w-[260px] drop-shadow-[0_0_40px_rgba(168,85,247,0.35)]"
          />
        </div>

        {/* §1 — Today's Energy Card */}
        <TodaysEnergyCard
          horoscope={horoscope}
          transits={transits}
          user={user}
          loading={primaryLoading}
        />

        {/* §2 — Weekly Chart Card */}
        <WeeklyChartCard />

        {/* §3 — Life Areas Grid */}
        <LifeAreasGrid
          horoscope={horoscope}
          loading={horoscopeLoading}
        />

        {/* §4 — Panchang Strip */}
        <PanchangStrip
          transits={transits}
          loading={transitsLoading}
        />

        {/* §5 — Compatibility Card */}
        <CompatibilityCard />

        {/* §6 — Family & Friends Strip */}
        <FamilyFriendsStrip />

        {/* §7 — My Chart Card */}
        <MyChartCard
          user={user}
          loading={userLoading}
        />

        {/* §8 — AI Astrologer Strip */}
        <AiAstrologerStrip />
      </div>
    </div>
  );
}
