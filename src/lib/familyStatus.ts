import type { FamilyMember, FamilyCompatibilityPreflight, FamilyCompatibilityBand } from '@/types/family';
import type { FamilyReport } from '@/hooks/useFamily';

export type FamilyStatusKind = 'incomplete' | 'needsAttention' | 'stable' | 'new';

export interface FamilyMemberStatus {
    kind: FamilyStatusKind;
    labelKey: string;
    classes: string;
}

interface ComputeStatusInput {
    member: FamilyMember;
    preflight?: FamilyCompatibilityPreflight | null;
    reports?: FamilyReport[] | null;
    band?: FamilyCompatibilityBand | string | null;
}

function isIncomplete(m: FamilyMember): boolean {
    if (m.source === 'linked') return false; // linked synastry is computed server-side
    if (!m.dob || !m.tob || !m.pob) return true;
    if (m.latitude === 0 && m.longitude === 0) return true;
    return false;
}

function bandIsCaution(band: ComputeStatusInput['band']): boolean {
    return band === 'Challenging' || band === 'Average';
}

/**
 * Pick a single coarse status bucket for the dashboard pill. Returns null when
 * the member is freshly added and nothing has been analyzed yet — caller
 * should render no pill in that case.
 */
export function computeFamilyMemberStatus({
    member,
    preflight,
    reports,
    band,
}: ComputeStatusInput): FamilyMemberStatus | null {
    if (isIncomplete(member)) {
        return {
            kind: 'incomplete',
            labelKey: 'dashboard.familyStatusIncomplete',
            classes: 'bg-[#D96B78]/10 text-[#D96B78] border-[#D96B78]/30',
        };
    }

    if (preflight?.staleDataWarning || bandIsCaution(band)) {
        return {
            kind: 'needsAttention',
            labelKey: 'dashboard.familyStatusNeedsAttention',
            classes: 'bg-[#E5A33A]/10 text-[#E5A33A] border-[#E5A33A]/30',
        };
    }

    if (preflight?.cachedResultAvailable) {
        return {
            kind: 'stable',
            labelKey: 'dashboard.familyStatusStable',
            classes: 'bg-[#3DD6A0]/10 text-[#3DD6A0] border-[#3DD6A0]/30',
        };
    }

    if (reports && reports.length > 0) {
        return {
            kind: 'new',
            labelKey: 'dashboard.familyStatusNew',
            classes: 'bg-[#C9972E]/10 text-[#C9972E] border-[#C9972E]/30',
        };
    }

    return null;
}

export interface BandPalette {
    ring: string;
    text: string;
    bg: string;
    border: string;
}

/** Canonical band → tailwind colour mapping. Shared between /family and chat. */
export function bandPalette(band: string): BandPalette {
    switch (band) {
        case 'Excellent':
            return { ring: 'text-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
        case 'Good':
            return { ring: 'text-secondary', text: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30' };
        case 'Average':
            return { ring: 'text-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
        case 'Challenging':
            return { ring: 'text-orange-400', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
        default:
            return { ring: 'text-secondary', text: 'text-primary', bg: 'bg-secondary/10', border: 'border-secondary/30' };
    }
}

