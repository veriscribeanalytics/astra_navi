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
      <div className="relative z-10 max-w-[680px] lg:max-w-[1100px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-4 sm:space-y-5">
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

        {/*
          At 2xl+ the dashboard becomes three independent blocks stacked vertically:
            ┌──────────────┬───────────┐
            │   energy     │  weekly   │  <- hero (left) + right stack
            │   (hero)     │  panchang │
            │              │  compat   │
            ├──────────────┴───────────┤
            │       life areas         │  <- full-width
            ├─────────────┬────────────┤
            │   family    │  mychart   │  <- paired 2-col
            ├─────────────┴────────────┤
            │       ai astrologer      │  <- full-width
            └──────────────────────────┘
          The right column is a nested flex-col so its three cards keep their
          natural heights side-by-side with the hero (no fragile row-span math).
          Below 2xl everything collapses to a single-column space-y rhythm.
        */}

        {/* Top block — hero (left) + Weekly/Panchang/Compatibility stack (right) */}
        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-4 sm:gap-5 2xl:items-stretch">
          {/* §1 — Today's Energy Card (hero) */}
          <TodaysEnergyCard
            horoscope={horoscope}
            transits={transits}
            user={user}
            loading={primaryLoading}
          />

          {/* Right stack */}
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* §2 — Weekly Chart Card */}
            <WeeklyChartCard />

            {/* §4 — Panchang Strip */}
            <PanchangStrip
              transits={transits}
              loading={transitsLoading}
            />

            {/* §5 — Compatibility Card */}
            <CompatibilityCard />
          </div>
        </div>

        {/* §3 — Life Areas Grid (full-width) */}
        <LifeAreasGrid
          horoscope={horoscope}
          loading={horoscopeLoading}
        />

        {/* §6 + §7 — Family & Friends + My Chart (paired 2-col at 2xl) */}
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-4 sm:gap-5 2xl:items-stretch">
          <FamilyFriendsStrip />

          <MyChartCard
            user={user}
            loading={userLoading}
          />
        </div>

        {/* §8 — AI Astrologer Strip (full-width) */}
        <AiAstrologerStrip />
      </div>
    </div>
  );
}
