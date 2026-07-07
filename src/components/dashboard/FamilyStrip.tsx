'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Users, ChevronRight, Link2, Sparkles, ArrowRight, Lock } from 'lucide-react';
import {
  useFamilyMembers,
  useFamilyConnections,
  useTranslation,
  usePaywallContext,
} from '@/hooks';
import { useFamilyDashboard } from '@/hooks/useFamilyDashboard';
import type { FamilyMember, FamilyConnection } from '@/types/family';
import { computeFamilyMemberStatus, bandPalette } from '@/lib/familyStatus';
import FamilyCapDialog from '@/components/family/FamilyCapDialog';

const formatRelationship = (rel: FamilyMember['relationshipType'] | null | undefined): string =>
  rel ? rel.charAt(0).toUpperCase() + rel.slice(1) : '';

const initialOf = (name: string): string => {
  const trimmed = (name ?? '').trim();
  return trimmed ? trimmed[0].toUpperCase() : '?';
};

/** Bar fill keyed off the dashboard `band_key` — reuses the canonical band
 *  palette so there's a single band → colour source (no duplicate map). */
const bandBarClass = (bandKey?: string | null): string => {
  const palette = bandPalette(bandKey);
  return `${palette.bg} ${palette.text}`;
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
  const { t, language } = useTranslation();
  // Daily bond dashboard drives the card preview (free teaser — zero credits).
  const { data: dashboard, isLoading } = useFamilyDashboard(member, language);

  const status = computeFamilyMemberStatus({ member, dashboard: dashboard ?? null });

  const hasBond = typeof dashboard?.bond?.score === 'number';

  return (
    <Link
      href={`/family?member=${member.id}&source=${member.source}`}
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
            {member.relationshipType ? formatRelationship(member.relationshipType) : (t('family.relationshipNotSet') || 'Connection')}
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
        {hasBond ? (
          <BondEnergyBar score={dashboard?.bond?.score} band={dashboard?.bond?.band_key} />
        ) : status?.kind === 'incomplete' ? (
          <BondEnergyHint label={t('dashboard.familyStatusIncomplete')} />
        ) : (
          <BondEnergyHint label={isLoading ? (t('dashboard.familyCompatibilityPending') || 'Reading today’s bond…') : (t('dashboard.familyRunCompatibility') || 'View bond')} />
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

const AddMemberCard: React.FC<{ onClick?: () => void; isLocked?: boolean; lockType?: 'pro' | 'premium' }> = ({ onClick, isLocked, lockType }) => {
  const { t } = useTranslation();
  const { getTierColor } = usePaywallContext();
  const lockColor = getTierColor(lockType);

  let title = t('dashboard.familyAdd') || "Add Member";
  let subtitle = t('dashboard.familyAddSubtitle') || "Add family or friends to compare charts and emotional patterns.";
  let buttonText = "Add";
  let borderClass = "border-secondary/25 hover:border-secondary/60";
  let bgClass = "bg-gradient-to-br from-secondary/5 via-surface to-surface";

  if (isLocked) {
    borderClass = "border-[var(--lock-color)]/30 hover:border-[var(--lock-color)]/60";
    bgClass = "bg-[var(--lock-color)]/[0.03]";
    buttonText = lockType === 'pro' ? "Get Pro" : "Get Premium";
    title = lockType === 'pro' ? "Get Pro to Unlock" : "Get Premium to Unlock";
    subtitle = lockType === 'pro' ? "Unlock up to 3 slots." : "Unlock all 6 slots.";
  }

  const content = (
    <>
      <div
        className="absolute inset-0 rounded-[24px] pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${isLocked ? 'var(--lock-color)' : 'rgba(212,175,55,0.10)'} 0%, transparent 60%)`, opacity: isLocked ? 0.08 : 1 }}
        aria-hidden
      />
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform mb-3 ${
        isLocked
          ? 'bg-[var(--lock-color)]/10 border border-[var(--lock-color)]/30 text-[var(--lock-color)]'
          : 'bg-secondary/15 border border-secondary/30 text-secondary'
      }`}>
        {isLocked ? <Lock className="w-6 h-6" /> : <Plus className="w-7 h-7" />}
      </div>
      <p className="text-[14px] font-headline font-bold text-foreground group-hover:text-secondary transition-colors">
        {title}
      </p>
      <p className="mt-1.5 text-[11px] text-foreground/60 leading-relaxed text-center max-w-[26ch]">
        {subtitle}
      </p>
      <span className={`mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors ${
        isLocked
          ? 'bg-[var(--lock-color)]/10 border border-[var(--lock-color)]/30 text-[var(--lock-color)] group-hover:bg-[var(--lock-color)]/20'
          : 'bg-secondary/10 border border-secondary/30 text-secondary group-hover:bg-secondary/20'
      }`}>
        {isLocked ? <Lock className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
        {buttonText}
      </span>
    </>
  );

  if (isLocked) {
    return (
      <div
        onClick={onClick}
        className={`group relative flex flex-col items-center justify-center p-5 rounded-[24px] border hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(212,175,55,0.1)] transition-all duration-300 min-h-[200px] cursor-pointer ${borderClass} ${bgClass}`}
        style={{ '--lock-color': lockColor } as React.CSSProperties}
        aria-label={title}
      >
        {content}
      </div>
    );
  }

  return (
    <Link
      href="/family"
      className={`group relative flex flex-col items-center justify-center p-5 rounded-[24px] border hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(212,175,55,0.18)] transition-all duration-300 min-h-[200px] ${borderClass} ${bgClass}`}
      aria-label={title}
    >
      {content}
    </Link>
  );
};

const FamilyStrip: React.FC = () => {
  const { t } = useTranslation();
  const { tier } = usePaywallContext();
  const { data: members, isLoading } = useFamilyMembers();
  // /connections returns all active connections, each carrying `isFamily`.
  // Family links are capped; the rest are uncapped extras.
  const { data: allConnections, isLoading: connectionsLoading } = useFamilyConnections();
  const linkedFamily = React.useMemo(() => (allConnections ?? []).filter(c => c.isFamily), [allConnections]);
  const friendConnections = React.useMemo(() => (allConnections ?? []).filter(c => !c.isFamily), [allConnections]);
  // Merged list (family first) for the empty/has-content checks only.
  const connections = [...linkedFamily, ...friendConnections];
  const connectionsLoaded = allConnections !== null;
  const [capDialog, setCapDialog] = React.useState<{ open: boolean; limit?: number; currentTier?: string; message?: string } | null>(null);

  const showSkeleton = (isLoading && !members) || (connectionsLoading && !connectionsLoaded);
  const hasMembers = !!members && members.length > 0;
  const hasConnections = connections.length > 0;
  const isEmpty = !showSkeleton && !hasMembers && !hasConnections;

  // Items that count against the tier slot cap: manual members + family-kind links.
  // Friends are uncapped and injected separately into `slots` below.
    // /api/family/members already includes linked family connections, so we no
    // longer need to merge a separate family-connections list here. Key every
    // item by (source, id) because manual member ids can collide with connection ids.
    const allItems = React.useMemo(() => {
        const membersList = members || [];
        return membersList.map(m => ({ type: 'member' as const, id: String(m.id), source: m.source, data: m }));
    }, [members]);

  const isFree = React.useMemo(() => (tier || 'free').toLowerCase() === 'free', [tier]);

    const slots = React.useMemo(() => {
        const result: Array<
            | { type: 'member'; id: string; source: 'manual' | 'linked'; data: FamilyMember }
            | { type: 'connection'; id: string; data: FamilyConnection }
            | { type: 'add'; isLocked: boolean; lockType?: 'pro' | 'premium' }
        > = [];

    const tierLower = (tier || 'free').toLowerCase();
    let unlockedLimit = 1;
    if (tierLower === 'premium') {
      unlockedLimit = 6;
    } else if (tierLower === 'pro') {
      unlockedLimit = 3;
    }

    for (let i = 0; i < unlockedLimit; i++) {
      if (i < allItems.length) {
        result.push(allItems[i]);
      } else {
        result.push({ type: 'add', isLocked: false });
      }
    }

    // Friends never consume a slot — append them as uncapped real cards.
    for (const c of (friendConnections ?? [])) {
      result.push({ type: 'connection', id: String(c.connectionId), data: c });
    }

    for (let i = unlockedLimit; i < 6; i++) {
      let lockType: 'pro' | 'premium' = 'premium';
      if (tierLower === 'free' && i < 3) {
        lockType = 'pro';
      }
      result.push({ type: 'add', isLocked: true, lockType });
    }

    return result;
  }, [allItems, friendConnections, tier]);

  return (
    <section className="mt-12 sm:mt-20 mx-auto max-w-6xl">
      <div className="text-center mb-6 sm:mb-10">
        <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
          <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-secondary to-transparent rounded-full" />
          <span className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-[0.4em] sm:tracking-[0.6em]">
            {t('dashboard.familyEyebrow')}
          </span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-headline font-bold text-primary tracking-tight leading-tight">
          {t('nav.myFamily')}
        </h2>
        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-foreground/40 max-w-md mx-auto leading-relaxed px-4">
          {t('dashboard.familySubtitle')}
        </p>
        {!isEmpty && (
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              onClick={() => {
                if (isFree && allItems.length >= 1) {
                  setCapDialog({
                    open: true,
                    currentTier: tier ?? undefined,
                    limit: 1,
                    message: "Upgrade to Pro to unlock up to 3 family members, or Premium for unlimited access."
                  });
                } else if (tier?.toLowerCase() === 'pro' && allItems.length >= 6) {
                  setCapDialog({
                    open: true,
                    currentTier: tier ?? undefined,
                    limit: 6,
                    message: "Upgrade to Premium to unlock all 6 family slots on your dashboard and enjoy unlimited cosmic bonds."
                  });
                } else {
                  window.location.href = '/family';
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 text-[11px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              {t('dashboard.familyAdd')}
            </button>
            <Link
              href="/family"
              aria-label={t('dashboard.familyViewAll') || 'View all family'}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-outline-variant/30 text-[11px] font-bold text-foreground/50 hover:text-secondary hover:border-secondary/40 uppercase tracking-widest transition-colors"
            >
              {t('dashboard.familyViewAll')}
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {showSkeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
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
          {slots.map((slot, index) => {
            if (slot.type === 'member') {
              return <FamilyMemberCard key={`m-${slot.source}-${slot.id}`} member={slot.data} />;
            } else if (slot.type === 'connection') {
              return <FamilyConnectionCard key={`c-${slot.id}`} connection={slot.data} />;
            } else {
              return (
                <AddMemberCard
                  key={`add-${index}`}
                  isLocked={slot.isLocked}
                  lockType={slot.lockType}
                  onClick={() => {
                    if (slot.isLocked) {
                      if (slot.lockType === 'pro') {
                         setCapDialog({
                           open: true,
                           currentTier: tier ?? undefined,
                           limit: 3,
                           message: "Upgrade to Pro to unlock up to 3 family members, or Premium for unlimited access."
                         });
                       } else {
                         setCapDialog({
                           open: true,
                           currentTier: tier ?? undefined,
                           limit: 6,
                          message: "Upgrade to Premium to unlock all 6 family slots on your dashboard and enjoy unlimited cosmic bonds."
                        });
                      }
                    }
                  }}
                />
              );
            }
          })}
        </div>
      )}

      <FamilyCapDialog
        open={!!capDialog}
        onClose={() => setCapDialog(null)}
        currentTier={capDialog?.currentTier || tier || 'free'}
        limit={capDialog?.limit || 1}
        message={capDialog?.message}
      />
    </section>
  );
};

export default FamilyStrip;
