import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonBlock, SkeletonText } from '@/components/ui/Skeleton';

function SkeletonDarkPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`dark-glass rounded-[22px] shadow-[var(--card-shadow)] ${className}`}>
      {children}
    </section>
  );
}

export default function DailyHoroscopeCardSkeleton() {
  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      {/* LEFT COLUMN */}
      <div className="space-y-5">
        {/* TODAY'S ENERGY SKELETON */}
        <SkeletonDarkPanel className="p-5 sm:p-7">
          <div className="grid gap-6 lg:grid-cols-[170px_minmax(0,1fr)_190px] lg:items-center">
            {/* Ring Score Area */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              <Skeleton height={10} width={100} className="mb-4" />
              <div className="relative mt-2">
                <SkeletonCircle size={132} className="shrink-0" />
                <div className="absolute inset-[-10%] rounded-full bg-secondary/5 blur-xl animate-pulse" />
              </div>
              <Skeleton height={20} width={90} className="mt-4 rounded-full" />
              <div className="mt-3 flex items-center justify-center gap-2 lg:justify-start">
                <Skeleton height={18} width={100} className="rounded-full" />
                <Skeleton height={18} width={80} className="rounded-full" />
              </div>
            </div>

            {/* Headline Text Area */}
            <div className="space-y-3">
              <Skeleton height={24} className="w-full" />
              <Skeleton height={24} className="w-5/6" />
              <Skeleton height={24} className="w-4/5" />
            </div>

            {/* Lotus Image Area */}
            <div className="hidden justify-center lg:flex">
              <SkeletonBlock height={120} className="w-[150px] rounded-2xl" />
            </div>
          </div>

          {/* Times Grid (Good Time, Alert Time) */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-variant/[0.035] p-5">
              <div className="flex items-start gap-4">
                <SkeletonCircle size={32} className="shrink-0 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <Skeleton height={10} width={80} />
                  <Skeleton height={16} width={120} />
                  <SkeletonText lines={2} />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-variant/[0.035] p-5">
              <div className="flex items-start gap-4">
                <SkeletonCircle size={32} className="shrink-0 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <Skeleton height={10} width={80} />
                  <Skeleton height={16} width={120} />
                  <SkeletonText lines={2} />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SkeletonBlock height={44} className="rounded-full" />
            <SkeletonBlock height={44} className="rounded-full" />
          </div>
        </SkeletonDarkPanel>

        {/* LIFE AREAS SKELETON */}
        <section className="space-y-3">
          <Skeleton height={14} width={120} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-outline-variant/10 bg-surface/80 p-4 text-center">
                <SkeletonCircle size={48} className="mx-auto" />
                <Skeleton height={14} width={70} className="mx-auto mt-3" />
                <SkeletonText lines={2} className="mt-2" />
              </div>
            ))}
          </div>
        </section>

        {/* CELESTIAL INSIGHTS SKELETON */}
        <SkeletonDarkPanel className="grid gap-4 p-5 md:grid-cols-[160px_1fr_1fr_1fr_1fr]">
          <div className="flex items-center gap-3">
            <SkeletonCircle size={32} className="shrink-0" />
            <div className="space-y-1">
              <Skeleton height={10} width={60} />
              <Skeleton height={10} width={50} />
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-outline-variant/10 md:border-l md:pl-5 space-y-2">
              <Skeleton height={12} className="w-full" />
              <Skeleton height={12} className="w-2/3" />
            </div>
          ))}
        </SkeletonDarkPanel>
      </div>

      {/* RIGHT COLUMN */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-1">
        <div className="space-y-5">
          {/* WEEKLY OUTLOOK SKELETON */}
          <SkeletonDarkPanel className="p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <Skeleton height={14} width={150} />
              <Skeleton height={12} width={100} />
            </div>
            <div className="mb-5 overflow-x-auto">
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} height={36} width={90} className="rounded-xl shrink-0" />
                ))}
              </div>
            </div>
            <div className="min-h-[230px] flex items-end justify-between px-2 pt-4 border-t border-outline-variant/10">
              {/* Simulate a Bar / Line Chart representation */}
              {Array.from({ length: 7 }).map((_, i) => {
                const heightVal = 40 + (i * 20) % 80;
                return (
                  <div key={i} className="flex flex-col items-center gap-2 w-full h-[150px] justify-end">
                    <Skeleton height={heightVal} className="w-1/2 rounded-t-lg" />
                    <Skeleton height={10} width={30} />
                  </div>
                );
              })}
            </div>
          </SkeletonDarkPanel>

          {/* COMPATIBILITY SKELETON */}
          <SkeletonDarkPanel className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <SkeletonCircle size={56} className="shrink-0" />
              <div className="space-y-2">
                <Skeleton height={14} width={120} />
                <Skeleton height={12} width={250} className="hidden sm:block" />
                <Skeleton height={12} width={180} className="sm:hidden" />
              </div>
            </div>
            <SkeletonBlock height={44} className="w-full sm:w-40 rounded-xl" />
          </SkeletonDarkPanel>
        </div>
      </div>
    </div>
  );
}
