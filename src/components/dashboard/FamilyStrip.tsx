'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Plus, Users, ChevronRight, Link2, Sparkles, ArrowRight } from 'lucide-react';
import {
  useFamilyMembers,
  useFamilyConnections,
  useFamilyCompatibilityPreflight,
  useFamilyReports,
  useFamilyCompatibility,
  useTranslation,
} from '@/hooks';
import type { FamilyMember, FamilyConnection, FamilyCompatibilityBand } from '@/types/family';
import { computeFamilyMemberStatus, bandPalette } from '@/lib/familyStatus';

const formatRelationship = (rel: FamilyMember['relationshipType']): string =>
  rel ? rel.charAt(0).toUpperCase() + rel.slice(1) : '';

const initialOf = (name: string): string => {
  const trimmed = (name ?? '').trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
};

const bandBarClass = (band?: string | null): string => {
  switch (band) {
    case 'Excellent':
      return 'bg-gradient-to-r from-emerald-400 via-emerald-400 to-teal-300 shadow-[0_0_12px_rgba(52,211,153,0.55)]';
    case 'Good':
      return 'bg-gradient-to-r from-secondary via-secondary to-amber-300 shadow-[0_0_12px_rgba(212,175,55,0.55)]';
    case 'Average':
      return 'bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(251,191,36,0.5)]';
    case 'Challenging':
      return 'bg-gradient-to-r from-orange-400 to-red-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]';
    default:
      return 'bg-gradient-to-r from-secondary to-amber-300 shadow-[0_0_10px_rgba(212,175,55,0.45)]';
  }
};

const BondEnergyBar: React.FC<{ score?: number | null; band?: string | null }> = ({ score, band }) => {
  const palette = bandPalette(band ?? '');
  const pct = Math.max(0, Math.min(100, Math.round(score ?? 0)));
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/60">
          Bond energy
        </span>
        <span className={`text-[13px] font-headline font-bold tabular-nums ${palette.text}`}>
          {pct}
          <span className="text-foreground/50 text-[10px] font-body ml-0.5">/100</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-foreground/[0.08] overflow-hidden">
        <div
          className={`h-full rounded-full ${bandBarClass(band)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {band && (
        <p className={`text-[10px] font-bold uppercase tracking-widest ${palette.text}`}>
          {band}
        </p>
      )}
    </div>
  );
};

const BondEnergyHint: React.FC<{ label: string }> = ({ label }) => (
  <div className="space-y-1.5">
    <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/55">
      Bond energy
    </span>
    <div className="h-2 rounded-full bg-foreground/[0.06] overflow-hidden">
      <div className="h-full w-1/3 rounded-full bg-foreground/[0.18] animate-pulse" />
    </div>
    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/55">
      {label}
    </p>
  </div>
);

const FamilyMemberCard: React.FC<{ member: FamilyMember }> = ({ member }) => {
  const { t } = useTranslation();
  const { data: preflight, fetchPreflight } = useFamilyCompatibilityPreflight(member.id);
  const { data: reports } = useFamilyReports(member.id);
  const { data: compat, fetchCompatibility } = useFamilyCompatibility(member.id);

  useEffect(() => {
    fetchPreflight();
  }, [fetchPreflight]);

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

  const hasCompat = typeof compat?.score === 'number';

  return (
    <Link
      href={`/family?member=${member.id}`}
      className="group flex flex-col p-5 rounded-[24px] bg-surface border border-outline-variant/20 hover:border-secondary/40 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(212,175,55,0.10)] transition-all duration-300"
      aria-label={`Open ${member.name}'s bond`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center text-lg font-headline font-bold shrink-0 group-hover:scale-105 transition-transform">
          {initialOf(member.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[15px] font-headline font-bold text-foreground group-hover:text-secondary transition-colors">
            {member.name || '—'}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-widest text-foreground/55 font-bold">
            {formatRelationship(member.relationshipType)}
          </p>
        </div>
        {status && (
          <span
            className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest ${status.classes}`}
          >
            {t(status.labelKey)}
          </span>
        )}
      </div>

      <div className="flex-1 min-h-[58px] mb-4">
        {hasCompat ? (
          <BondEnergyBar score={compat?.score} band={compat?.band} />
        ) : status?.kind === 'incomplete' ? (
          <BondEnergyHint label={t('dashboard.familyStatusIncomplete')} />
        ) : (
          <BondEnergyHint label={t('dashboard.familyRunCompatibility')} />
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15">
        <span className="text-[11px] font-bold text-foreground/60 group-hover:text-secondary uppercase tracking-widest transition-colors">
          {t('dashboard.familyViewBond')}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-foreground/30 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
};

const FamilyConnectionCard: React.FC<{ connection: FamilyConnection }> = ({ connection }) => {
  const { t } = useTranslation();
  return (
    <Link
      href="/family"
      className="group flex flex-col p-5 rounded-[24px] bg-surface border border-outline-variant/20 hover:border-secondary/40 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(212,175,55,0.10)] transition-all duration-300"
      aria-label={`Open ${connection.otherName}'s connection`}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center text-lg font-headline font-bold shrink-0 group-hover:scale-105 transition-transform">
          {initialOf(connection.otherName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="truncate text-[15px] font-headline font-bold text-foreground group-hover:text-secondary transition-colors">
            {connection.otherName || '—'}
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-widest text-foreground/55 font-bold">
            {formatRelationship(connection.iSeeThemAs)}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-widest text-secondary bg-secondary/10 border-secondary/30">
          <Link2 className="w-2.5 h-2.5" />
          Linked
        </span>
      </div>

      <div className="flex-1 min-h-[58px] mb-4">
        <BondEnergyHint label={t('dashboard.familyCompatibilityPending')} />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/15">
        <span className="text-[11px] font-bold text-foreground/60 group-hover:text-secondary uppercase tracking-widest transition-colors">
          {t('dashboard.familyViewBond')}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-foreground/30 group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
};

const AddMemberCard: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Link
      href="/family"
      className="group relative flex flex-col items-center justify-center p-5 rounded-[24px] bg-gradient-to-br from-secondary/5 via-surface to-surface border border-secondary/25 hover:border-secondary/60 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(212,175,55,0.18)] transition-all duration-300 min-h-[200px]"
      aria-label={t('dashboard.familyAdd')}
    >
      <div className="absolute inset-0 rounded-[24px] bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.10),transparent_60%)] pointer-events-none" aria-hidden />
      <div className="w-14 h-14 rounded-2xl bg-secondary/15 border border-secondary/30 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
        <Plus className="w-7 h-7" />
      </div>
      <p className="text-[14px] font-headline font-bold text-foreground group-hover:text-secondary transition-colors">
        {t('dashboard.familyAdd')}
      </p>
      <p className="mt-1.5 text-[11px] text-foreground/60 leading-relaxed text-center max-w-[26ch]">
        {t('dashboard.familyAddSubtitle')}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-[10px] font-bold uppercase tracking-widest group-hover:bg-secondary/20 transition-colors">
        <Sparkles className="w-3 h-3" />
        Add
      </span>
    </Link>
  );
};

const FamilyStrip: React.FC = () => {
  const { t } = useTranslation();
  const { data: members, isLoading } = useFamilyMembers();
  const { data: connections, isLoading: connectionsLoading } = useFamilyConnections();

  const showSkeleton = (isLoading && !members) || (connectionsLoading && !connections);
  const hasMembers = !!members && members.length > 0;
  const hasConnections = !!connections && connections.length > 0;
  const isEmpty = !showSkeleton && !hasMembers && !hasConnections;

  return (
    <section className="mt-12 sm:mt-20 mx-auto max-w-6xl">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="text-center sm:text-left max-w-2xl">
          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
            <div className="w-1 h-5 sm:h-6 bg-gradient-to-b from-secondary to-transparent rounded-full" />
            <span className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-[0.4em] sm:tracking-[0.6em]">
              {t('dashboard.familyEyebrow')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-headline font-bold text-primary tracking-tight mb-2">
            {t('nav.myFamily')}
          </h2>
          <p className="text-[12px] sm:text-[13px] text-foreground/60 leading-relaxed">
            {t('dashboard.familySubtitle')}
          </p>
        </div>
        {!isEmpty && (
          <div className="flex items-center justify-center sm:justify-end gap-2 shrink-0">
            <Link
              href="/family"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-full border border-outline-variant/30 text-[11px] font-bold text-foreground/50 hover:text-secondary hover:border-secondary/40 uppercase tracking-widest transition-colors"
            >
              {t('dashboard.familyViewAll')}
              <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              href="/family"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 text-[11px] font-bold uppercase tracking-widest transition-colors"
            >
              <Plus className="w-3 h-3" />
              {t('dashboard.familyAdd')}
            </Link>
          </div>
        )}
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col p-5 rounded-[24px] bg-surface border border-outline-variant/20 min-h-[200px]"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-surface-variant/20 animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-surface-variant/20 animate-pulse" />
                  <div className="h-2 w-16 rounded bg-surface-variant/20 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2 flex-1">
                <div className="h-2 w-20 rounded bg-surface-variant/20 animate-pulse" />
                <div className="h-1.5 w-full rounded bg-surface-variant/20 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : isEmpty ? (
        <Link
          href="/family"
          className="group flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-6 sm:p-8 rounded-[28px] bg-gradient-to-br from-secondary/5 via-surface to-surface border border-secondary/25 hover:border-secondary/50 hover:shadow-[0_12px_40px_rgba(212,175,55,0.12)] transition-all duration-500"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-secondary shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm sm:text-base font-headline font-bold text-foreground group-hover:text-secondary transition-colors">
              {t('dashboard.familyEmptyCta')}
            </p>
            <p className="mt-1 text-[11px] sm:text-xs text-foreground/60 leading-relaxed">
              {t('dashboard.familySubtitle')}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary/15 border border-secondary/30 text-secondary text-[10px] font-bold uppercase tracking-widest shrink-0 group-hover:bg-secondary/25 transition-colors">
            <Plus className="w-3 h-3" />
            {t('dashboard.familyAdd')}
          </span>
        </Link>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members?.map((m) => (
            <FamilyMemberCard key={`m-${m.id}`} member={m} />
          ))}
          {connections?.map((c) => (
            <FamilyConnectionCard key={`c-${c.connectionId}`} connection={c} />
          ))}
          <AddMemberCard />
        </div>
      )}
    </section>
  );
};

export default FamilyStrip;
