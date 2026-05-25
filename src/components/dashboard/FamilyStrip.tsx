'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, ChevronRight } from 'lucide-react';
import {
  useFamilyMembers,
  useFamilyCompatibilityPreflight,
  useFamilyReports,
  useFamilyCompatibility,
  useTranslation,
} from '@/hooks';
import type { FamilyMember, FamilyCompatibilityBand } from '@/types/family';
import { computeFamilyMemberStatus } from '@/lib/familyStatus';

const formatRelationship = (rel: FamilyMember['relationshipType']): string =>
  rel ? rel.charAt(0).toUpperCase() + rel.slice(1) : '';

const initialOf = (name: string): string => {
  const trimmed = (name ?? '').trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
};

const FamilyMemberCard: React.FC<{ member: FamilyMember }> = ({ member }) => {
  const { t } = useTranslation();
  const { data: preflight, fetchPreflight } = useFamilyCompatibilityPreflight(member.id);
  const { data: reports } = useFamilyReports(member.id);
  const { data: compat, fetchCompatibility } = useFamilyCompatibility(member.id);

  useEffect(() => {
    fetchPreflight();
  }, [fetchPreflight]);

  // Only fetch the full compatibility (for the band) when preflight confirms a
  // fresh cached result exists — otherwise the call would either charge credits
  // or surface stale data.
  useEffect(() => {
    if (preflight?.cachedResultAvailable && !preflight.staleDataWarning) {
      fetchCompatibility('en');
    }
  }, [preflight?.cachedResultAvailable, preflight?.staleDataWarning, fetchCompatibility]);

  const status = computeFamilyMemberStatus({
    member,
    preflight,
    reports,
    band: (compat?.band as FamilyCompatibilityBand | undefined) ?? null,
  });

  return (
    <Link
      href={`/family?member=${member.id}`}
      className="group flex flex-col items-center text-center p-3 sm:p-4 rounded-[20px] bg-surface border border-outline-variant/20 hover:border-secondary/40 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(212,175,55,0.08)] transition-all duration-300"
      aria-label={`Open ${member.name}'s chart`}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center text-base sm:text-lg font-headline font-bold group-hover:scale-105 transition-transform">
        {initialOf(member.name)}
      </div>
      <p className="mt-3 w-full truncate text-[13px] sm:text-sm font-headline font-semibold text-foreground group-hover:text-secondary transition-colors">
        {member.name || '—'}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-widest text-foreground/40 font-bold">
        {formatRelationship(member.relationshipType)}
      </p>
      {status && (
        <span
          className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${status.classes}`}
        >
          {t(status.labelKey)}
        </span>
      )}
    </Link>
  );
};

const FamilyStrip: React.FC = () => {
  const { t } = useTranslation();
  const { data: members, isLoading } = useFamilyMembers();

  const showSkeleton = isLoading && !members;
  const isEmpty = !showSkeleton && (!members || members.length === 0);

  return (
    <section className="mt-12 sm:mt-20">
      <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:gap-4">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 sm:mb-3">
            <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-secondary to-transparent rounded-full" />
            <span className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-[0.4em] sm:tracking-[0.6em]">
              {t('dashboard.familyEyebrow')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-headline font-bold text-primary tracking-tight">
            {t('nav.myFamily')}
          </h2>
        </div>
        {!isEmpty && (
          <Link
            href="/family"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-foreground/40 hover:text-secondary uppercase tracking-widest transition-colors"
          >
            {t('dashboard.familyViewAll')}
            <ChevronRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col items-center p-3 sm:p-4 rounded-[20px] bg-surface border border-outline-variant/20"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-variant/20 animate-pulse" />
              <div className="mt-3 h-3 w-16 rounded bg-surface-variant/20 animate-pulse" />
              <div className="mt-2 h-2 w-10 rounded bg-surface-variant/20 animate-pulse" />
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <Link
          href="/family"
          className="group flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-5 sm:p-7 rounded-[24px] bg-surface border border-outline-variant/20 hover:border-secondary/40 hover:shadow-[0_8px_30px_rgba(212,175,55,0.08)] transition-all duration-500"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm sm:text-base font-headline font-bold text-foreground group-hover:text-secondary transition-colors">
              {t('dashboard.familyEmptyCta')}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-foreground/40 leading-relaxed">
              {t('nav.myFamilyDesc')}
            </p>
          </div>
          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-foreground/30 uppercase tracking-widest group-hover:text-secondary transition-colors shrink-0">
            {t('dashboard.familyAdd')}
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {members!.map((m) => (
            <FamilyMemberCard key={m.id} member={m} />
          ))}

          <Link
            href="/family"
            className="group flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-[20px] bg-transparent border border-dashed border-outline-variant/40 hover:border-secondary/40 hover:bg-secondary/[0.03] transition-all duration-300 min-h-[120px] sm:min-h-[140px]"
            aria-label={t('dashboard.familyAdd')}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-secondary/5 border border-secondary/15 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="mt-3 text-[11px] sm:text-xs font-bold text-foreground/50 uppercase tracking-widest group-hover:text-secondary transition-colors">
              {t('dashboard.familyAdd')}
            </p>
          </Link>
        </div>
      )}
    </section>
  );
};

export default FamilyStrip;
