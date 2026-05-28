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
      <div className="relative z-10 max-w-[680px] lg:max-w-[1100px] 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-4 sm:space-y-5 2xl:space-y-0">
        {/* Lotus hero motif — sits above the first card as a glowing centerpiece. */}
        <div className="flex justify-center -mb-2 sm:-mb-3 2xl:mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/lotus.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none select-none w-[180px] sm:w-[220px] lg:w-[260px] drop-shadow-[0_0_40px_rgba(168,85,247,0.35)]"
          />
        </div>

        {/*
          2xl+ uses a 2-column "hero-left" grid:
            ┌──────────────┬───────────┐
            │   energy     │  weekly   │
            │   (hero,     ├───────────┤
            │   spans 3    │  panchang │
            │   rows)      ├───────────┤
            │              │  compat   │
            ├──────────────┴───────────┤
            │       life areas         │
            ├─────────────┬────────────┤
            │   family    │  mychart   │
            ├─────────────┴────────────┤
            │       ai astrologer      │
            └──────────────────────────┘
          Below 2xl this falls back to the existing single-column space-y rhythm.
        */}
        <div
          className="2xl:grid 2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] 2xl:gap-5 2xl:auto-rows-min space-y-4 sm:space-y-5 2xl:space-y-0"
        >
          {/* §1 — Today's Energy Card (hero, spans 3 rows on 2xl) */}
          <div className="2xl:row-span-3 2xl:col-start-1">
            <TodaysEnergyCard
              horoscope={horoscope}
              transits={transits}
              user={user}
              loading={primaryLoading}
            />
          </div>

          {/* §2 — Weekly Chart Card (right column row 1) */}
          <div className="2xl:col-start-2 2xl:row-start-1">
            <WeeklyChartCard />
          </div>

          {/* §4 — Panchang Strip (right column row 2) */}
          <div className="2xl:col-start-2 2xl:row-start-2">
            <PanchangStrip
              transits={transits}
              loading={transitsLoading}
            />
          </div>

          {/* §5 — Compatibility Card (right column row 3) */}
          <div className="2xl:col-start-2 2xl:row-start-3">
            <CompatibilityCard />
          </div>

          {/* §3 — Life Areas Grid (full-width row) */}
          <div className="2xl:col-span-2 2xl:row-start-4">
            <LifeAreasGrid
              horoscope={horoscope}
              loading={horoscopeLoading}
            />
          </div>

          {/* §6 — Family & Friends Strip (paired with My Chart on 2xl) */}
          <div className="2xl:col-start-1 2xl:row-start-5">
            <FamilyFriendsStrip />
          </div>

          {/* §7 — My Chart Card (paired with Family on 2xl) */}
          <div className="2xl:col-start-2 2xl:row-start-5">
            <MyChartCard
              user={user}
              loading={userLoading}
            />
          </div>

          {/* §8 — AI Astrologer Strip (full-width row) */}
          <div className="2xl:col-span-2 2xl:row-start-6">
            <AiAstrologerStrip />
          </div>
        </div>
      </div>
    </div>
  );
}
