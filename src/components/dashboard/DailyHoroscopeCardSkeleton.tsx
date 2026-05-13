import React from 'react';
import { Skeleton, SkeletonCircle, SkeletonBlock, SkeletonText } from '@/components/ui/Skeleton';

export default function DailyHoroscopeCardSkeleton() {
    return (
        <div className="flex flex-col h-full">
            {/* Highlight Banner Skeleton */}
            <div className="bg-secondary/5 border-b border-secondary/10 px-6 py-2">
                <Skeleton height={14} className="w-2/3 mx-auto sm:mx-0" />
            </div>

            {/* HERO SECTION Skeleton */}
            <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-secondary/[0.03] border-b border-white/5">
                <div className="lg:col-span-8 flex items-center gap-5">
                    <SkeletonBlock height={64} className="w-16 h-16 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-3">
                        <Skeleton height={14} width={120} />
                        <SkeletonText lines={2} className="text-xl" />
                    </div>
                </div>
                <div className="lg:col-span-4 flex items-center justify-center lg:justify-end gap-6 lg:border-l border-white/5 lg:pl-8">
                    <div className="relative">
                        <SkeletonCircle size={96} className="sm:w-24 sm:h-24" />
                        <div className="absolute inset-[-10%] rounded-full bg-secondary/5 blur-xl animate-pulse" />
                    </div>
                    <div className="hidden lg:flex flex-col gap-2">
                        <SkeletonBlock height={40} className="w-32 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* HEADER & STATS Skeleton (Unified) */}
            <div className="px-6 sm:px-8 py-5 border-b border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 flex flex-col justify-between">
                    <div>
                        <Skeleton height={12} width={140} className="mb-2" />
                        <Skeleton height={32} width={200} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <Skeleton height={10} width={40} />
                            <Skeleton height={16} width={80} />
                        </div>
                        <div className="space-y-2">
                            <Skeleton height={10} width={40} />
                            <Skeleton height={16} width={80} />
                        </div>
                        <div className="space-y-2">
                            <Skeleton height={10} width={40} />
                            <Skeleton height={16} width={80} />
                        </div>
                        <div className="space-y-2">
                            <Skeleton height={10} width={40} />
                            <Skeleton height={16} width={80} />
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <SkeletonBlock height={140} className="w-full rounded-[20px]" />
                </div>
            </div>

            {/* CATEGORY SCORES Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-5 p-5 sm:p-7 border-outline-variant/10 border-b md:border-r last:border-r-0">
                        <SkeletonBlock height={80} className="w-20 rounded-[28px] shrink-0" />
                        <div className="flex-1 space-y-3">
                            <Skeleton height={32} width={80} />
                            <SkeletonText lines={2} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
