'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Heart, Star, ChevronRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useTranslation, useFamilyMembers, useFamilyCompatibilityPreflight, useFamilyCompatibility } from '@/hooks';
import { bandPalette } from '@/lib/familyStatus';

export default function CompatibilityCard() {
  const { t } = useTranslation();
  const { data: members, isLoading: membersLoading } = useFamilyMembers();

  // Find partner member
  const defaultMember = useMemo(() => {
    if (!members) return null;
    const partnerLike = members.find(m =>
      m.relationshipType === 'spouse'
    );
    // If no spouse, take first available member
    return partnerLike || members[0] || null;
  }, [members]);

  const memberId = defaultMember?.id || null;

  const { data: preflight, fetchPreflight } = useFamilyCompatibilityPreflight(memberId);
  const { data: compat, fetchCompatibility } = useFamilyCompatibility(memberId);

  useEffect(() => {
    if (memberId) {
      fetchPreflight();
    }
  }, [memberId, fetchPreflight]);

  useEffect(() => {
    if (preflight?.cachedResultAvailable && !preflight.staleDataWarning && memberId) {
      fetchCompatibility('en');
    }
  }, [preflight?.cachedResultAvailable, preflight?.staleDataWarning, fetchCompatibility, memberId]);

  const hasCompat = compat && typeof compat.score === 'number';

  if (membersLoading) {
    return (
      <Card padding="md" className="!rounded-[24px]">
        <div className="space-y-4 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-surface-variant/30 rounded w-1/4" />
            <div className="h-4 bg-surface-variant/30 rounded w-1/6" />
          </div>
          <div className="h-28 bg-surface-variant/30 rounded-2xl w-full" />
        </div>
      </Card>
    );
  }

  // If no members, or no compatibility score cached/fetched, show the empty state
  if (!defaultMember || !hasCompat) {
    return (
      <div className="space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
            {t('newDashboard.compatibility.title')}
          </span>
          <Link
            href="/kundli/match"
            className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            {t('newDashboard.compatibility.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Empty State Card */}
        <Card padding="md" className="!rounded-[24px] border border-outline-variant/20 bg-surface">
          <div className="flex flex-col items-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
              <Heart className="w-6 h-6 fill-current" />
            </div>
            <h3 className="text-[15px] font-headline font-bold text-foreground">
              {t('newDashboard.compatibility.emptyTitle')}
            </h3>
            <p className="text-[12px] text-foreground/50 mt-1 max-w-[280px]">
              {t('newDashboard.compatibility.emptyBody')}
            </p>
            <Link href="/kundli/match" className="mt-4">
              <button className="px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gradient-to-r from-secondary to-amber-500 text-background hover:brightness-105 transition-all shadow-sm">
                {t('newDashboard.compatibility.emptyCta')}
              </button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // Populated State
  const score = compat.score;
  const band = compat.band || 'Good';
  const palette = bandPalette(band);

  const starRating = (() => {
    switch (band) {
      case 'Excellent': return 5;
      case 'Good': return 4;
      case 'Average': return 3.5;
      case 'Challenging': return 2.5;
      default: return 4;
    }
  })();

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, idx) => {
          const value = idx + 1;
          const isFilled = value <= rating;
          const isHalf = !isFilled && (value - 0.5 <= rating);
          return (
            <Star
              key={idx}
              className={`w-3 h-3 ${
                isFilled
                  ? 'text-secondary fill-secondary'
                  : isHalf
                  ? 'text-secondary fill-secondary opacity-65'
                  : 'text-foreground/20'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
          {t('newDashboard.compatibility.title')}
        </span>
        <Link
          href="/kundli/match"
          className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1 hover:gap-1.5 transition-all"
        >
          {t('newDashboard.compatibility.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Populated Compatibility Card */}
      <Card padding="none" className="!rounded-[24px] border border-outline-variant/20 bg-surface overflow-hidden">
        <div className="flex min-w-0">
          {/* Left Third: Silhouette Art Box */}
          <div className="w-[88px] sm:w-[120px] shrink-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent flex items-center justify-center border-r border-outline-variant/10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-md">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-current animate-pulse" />
            </div>
          </div>

          {/* Middle Column: Scores & Stars */}
          <div className="flex-grow p-3.5 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-foreground/40">
              {defaultMember.name}&apos;s {t('newDashboard.compatibility.matchSuffix')}
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-[20px] font-headline font-bold text-foreground tabular-nums">
                {score}
              </span>
              <span className="text-[10px] font-bold text-foreground/35 uppercase">
                {t('newDashboard.compatibility.outOf')}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-widest ml-2 ${palette.bg} ${palette.text} ${palette.border}`}>
                {band} {t('newDashboard.compatibility.matchSuffix')}
              </span>
            </div>

            {/* Criteria Stars */}
            <div className="space-y-1.5 mt-3 pt-2.5 border-t border-outline-variant/10">
              <div className="flex justify-between items-center text-[10px] font-medium">
                <span className="text-foreground/50">{t('newDashboard.compatibility.harmony')}</span>
                {renderStars(starRating)}
              </div>
              <div className="flex justify-between items-center text-[10px] font-medium">
                <span className="text-foreground/50">{t('newDashboard.compatibility.trust')}</span>
                {renderStars(starRating)}
              </div>
              <div className="flex justify-between items-center text-[10px] font-medium">
                <span className="text-foreground/50">{t('newDashboard.compatibility.understanding')}</span>
                {renderStars(starRating)}
              </div>
            </div>
          </div>

          {/* Right Third: Minimal Zodiac SVG Frame (Hidden on smallest viewports, shown on sm:) */}
          <div className="hidden sm:flex w-[100px] shrink-0 items-center justify-center p-3">
            <svg viewBox="0 0 100 100" className="w-20 h-20 text-secondary opacity-25">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
              <Heart className="w-5 h-5 x-[40] y-[40] text-secondary fill-secondary/20" x="40" y="40" />
              {Array.from({ length: 12 }).map((_, idx) => {
                const angle = (idx * 30 * Math.PI) / 180;
                const x = 50 + 38 * Math.cos(angle);
                const y = 50 + 38 * Math.sin(angle);
                return (
                  <circle key={idx} cx={x} cy={y} r="1.5" fill="currentColor" />
                );
              })}
            </svg>
          </div>
        </div>
      </Card>
    </div>
  );
}
