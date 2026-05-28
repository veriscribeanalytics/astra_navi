'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useTranslation, useFamilyMembers, useFamilyCompatibilityPreflight, useFamilyCompatibility, useFamilyReports } from '@/hooks';
import { bandPalette, computeFamilyMemberStatus } from '@/lib/familyStatus';
import type { FamilyMember } from '@/types/family';

// Encapsulated fetching mini-card for each family member
const FamilyMemberMiniCard: React.FC<{ member: FamilyMember }> = ({ member }) => {
  const { t } = useTranslation();
  const { data: preflight, fetchPreflight } = useFamilyCompatibilityPreflight(member.id);
  const { data: compat, fetchCompatibility } = useFamilyCompatibility(member.id);
  const { data: reports } = useFamilyReports(member.id);

  useEffect(() => {
    if (member.id) {
      fetchPreflight();
    }
  }, [member.id, fetchPreflight]);

  useEffect(() => {
    if (preflight?.cachedResultAvailable && !preflight.staleDataWarning && member.id) {
      fetchCompatibility('en');
    }
  }, [preflight?.cachedResultAvailable, preflight?.staleDataWarning, fetchCompatibility, member.id]);

  const score = compat?.score;
  const band = compat?.band || 'Good';
  const palette = bandPalette(band);
  const initial = member.name ? member.name.charAt(0).toUpperCase() : '👤';

  const status = computeFamilyMemberStatus({
    member,
    preflight,
    reports,
    band,
  });

  // Format relationship title compactly
  const formatCompactRelation = (rel: string): string => {
    switch (rel) {
      case 'spouse': return t('newDashboard.familyFriends.relationshipPartner');
      case 'mother': return t('newDashboard.familyFriends.relationshipMother');
      case 'father': return t('newDashboard.familyFriends.relationshipFather');
      case 'sibling': return t('newDashboard.familyFriends.relationshipSibling');
      case 'friend': return t('newDashboard.familyFriends.relationshipFriend');
      case 'son': return t('newDashboard.familyFriends.relationshipSon');
      case 'daughter': return t('newDashboard.familyFriends.relationshipDaughter');
      default: return t('newDashboard.familyFriends.relationshipFamily');
    }
  };

  return (
    <Link
      href={`/family?member=${member.id}`}
      className="relative w-[104px] h-[155px] shrink-0 flex flex-col items-center justify-between p-2.5 border border-outline-variant/20 rounded-2xl bg-surface hover:border-secondary/30 transition-all text-center group shadow-sm pt-4"
    >
      {/* Centered top status badge */}
      {status && (
        <div className="absolute top-1 left-0 right-0 flex justify-center">
          <span className={`px-1.5 py-0.25 rounded border text-[6px] font-black uppercase tracking-wider leading-none scale-[0.85] origin-center ${status.classes}`}>
            {t(status.labelKey)}
          </span>
        </div>
      )}

      {/* Avatar Circle */}
      <div className="w-12 h-12 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary text-base font-headline font-bold group-hover:scale-105 transition-transform shrink-0">
        {initial}
      </div>

      {/* Details */}
      <div className="min-w-0 w-full mt-1.5 flex-grow flex flex-col justify-center">
        <div className="text-[12px] font-bold text-foreground truncate w-full group-hover:text-secondary transition-colors">
          {member.name}
        </div>
        <div className="text-[9px] uppercase tracking-widest text-foreground/45 font-bold truncate w-full mt-0.5">
          {formatCompactRelation(member.relationshipType)}
        </div>
      </div>

      {/* Compatibility Badge or Fallback */}
      <div className="w-full mt-1.5 pt-1.5 border-t border-outline-variant/10 shrink-0">
        {score !== undefined ? (
          <div className="flex flex-col items-center">
            <span className={`text-[13px] font-headline font-bold leading-none ${palette.text}`}>
              {score}%
            </span>
            <span className={`text-[7px] font-black uppercase tracking-wider mt-0.5 ${palette.text}`}>
              {band}
            </span>
          </div>
        ) : (
          <div className="text-[8px] font-black uppercase tracking-widest text-foreground/30 py-0.5 leading-none">
            {t('newDashboard.familyFriends.locked')}
          </div>
        )}
      </div>
    </Link>
  );
};

export default function FamilyFriendsStrip() {
  const { t } = useTranslation();
  const { data: members, isLoading } = useFamilyMembers();

  if (isLoading) {
    return (
      <Card padding="md" className="!rounded-[24px] 2xl:h-full 2xl:flex 2xl:flex-col">
        <div className="space-y-3 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-4 bg-surface-variant/30 rounded w-1/4" />
            <div className="h-4 bg-surface-variant/30 rounded w-1/6" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none flex-nowrap">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[155px] w-[104px] shrink-0 bg-surface-variant/30 rounded-2xl" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Display first 4 members
  const displayedMembers = members ? members.slice(0, 4) : [];

  return (
    <div className="space-y-3 2xl:h-full 2xl:flex 2xl:flex-col">
      {/* Header */}
      <div className="flex justify-between items-center">
        <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
          {t('newDashboard.familyFriends.title')}
        </span>
        <Link
          href="/family"
          className="text-[11px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1 hover:gap-1.5 transition-all"
        >
          {t('newDashboard.familyFriends.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Scroll View */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none flex-nowrap -mx-4 px-4 sm:mx-0 sm:px-0 2xl:flex-1 2xl:items-stretch">
        <div className="flex gap-3 shrink-0">
          {/* Display loaded family member cards */}
          {displayedMembers.map(member => (
            <FamilyMemberMiniCard key={member.id} member={member} />
          ))}

          {/* "+ Add Member" card appended at the end */}
          <Link
            href="/family"
            className="w-[104px] h-[155px] shrink-0 flex flex-col items-center justify-center p-3 border border-dashed border-outline-variant/30 hover:border-secondary/40 rounded-2xl bg-surface/20 transition-all text-center cursor-pointer shadow-sm group"
          >
            <div className="w-10 h-10 rounded-full border border-dashed border-outline-variant/40 group-hover:border-secondary/40 flex items-center justify-center text-foreground/40 group-hover:text-secondary transition-colors shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40 mt-3 group-hover:text-secondary transition-colors leading-tight">
              {t('newDashboard.familyFriends.addMember')}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
