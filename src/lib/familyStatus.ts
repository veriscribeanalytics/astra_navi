import type { FamilyMember } from '@/types/family';
import type { FamilyDashboardBandKey, FamilyDashboardResponse } from '@/types/familyDashboard';

export type FamilyStatusKind = 'incomplete' | 'needsAttention' | 'stable';

export interface FamilyMemberStatus {
    kind: FamilyStatusKind;
    labelKey: string;
    classes: string;
}

interface ComputeStatusInput {
    member: FamilyMember;
    /** Daily bond dashboard payload. The status pill is now derived from the
     *  member's `bond.band_key` (the daily reading) — the only family report
     *  surface left after the compatibility endpoints were retired. Null while
     *  the dashboard is still loading. */
    dashboard?: FamilyDashboardResponse | null;
}

function isIncomplete(m: FamilyMember): boolean {
    if (m.source === 'linked') return false; // linked synastry is computed server-side
    if (!m.dob || !m.tob || !m.pob) return true;
    if (m.latitude === 0 && m.longitude === 0) return true;
    return false;
}

/** Band keys that read as "needs care" on the dashboard pill. */
const ATTENTION_BANDS: ReadonlySet<FamilyDashboardBandKey> = new Set([
    'sensitive',
    'caution',
    'tense',
]);

/**
 * Pick a single coarse status bucket for the dashboard pill, derived from the
 * daily bond dashboard. Returns null when there's nothing to show yet.
 *
 * Precedence: the **dashboard wins**. A successfully-computed bond
 * (`dashboard.bond.band_key` present) is the authoritative "it's working"
 * signal — we classify by band and never report "incomplete", even if the
 * frontend's copy of the member's birth fields looks sparse (e.g. coordinates
 * stuck at 0,0, or a time-unknown entry the backend still resolved). Only when
 * the dashboard has no band_key do we fall back to the member-fields heuristic
 * to flag a genuinely incomplete manual entry.
 */
export function computeFamilyMemberStatus({
    member,
    dashboard,
}: ComputeStatusInput): FamilyMemberStatus | null {
    const bandKey = dashboard?.bond?.band_key;

    if (bandKey && ATTENTION_BANDS.has(bandKey)) {
        return {
            kind: 'needsAttention',
            labelKey: 'dashboard.familyStatusNeedsAttention',
            classes: 'bg-[#E5A33A]/10 text-[#E5A33A] border-[#E5A33A]/30',
        };
    }
    if (bandKey) {
        return {
            kind: 'stable',
            labelKey: 'dashboard.familyStatusStable',
            classes: 'bg-[#3DD6A0]/10 text-[#3DD6A0] border-[#3DD6A0]/30',
        };
    }

    // No dashboard band yet — only surface "Incomplete" for a manual entry that
    // genuinely can't be computed. Linked entries are server-computed, so they
    // show no pill until the dashboard loads.
    if (isIncomplete(member)) {
        return {
            kind: 'incomplete',
            labelKey: 'dashboard.familyStatusIncomplete',
            classes: 'bg-[#D96B78]/10 text-[#D96B78] border-[#D96B78]/30',
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

/** Canonical `band_key` → tailwind colour mapping, shared by the family cards,
 *  the dashboard strip, and the weekly chart accents. The old compatibility
 *  vocabulary (Excellent / Good / Average / Challenging) is gone — always key
 *  styling off the dashboard `band_key` (harmonious / supportive / balanced /
 *  sensitive / caution / tense). */
export function bandPalette(bandKey: string | null | undefined): BandPalette {
    switch (bandKey) {
        case 'harmonious':
            return { ring: 'text-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
        case 'supportive':
            return { ring: 'text-teal-300', text: 'text-teal-300', bg: 'bg-teal-500/10', border: 'border-teal-500/30' };
        case 'balanced':
            return { ring: 'text-secondary', text: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30' };
        case 'sensitive':
            return { ring: 'text-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' };
        case 'caution':
            return { ring: 'text-orange-400', text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
        case 'tense':
            return { ring: 'text-red-400', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' };
        default:
            return { ring: 'text-secondary', text: 'text-primary', bg: 'bg-secondary/10', border: 'border-secondary/30' };
    }
}
