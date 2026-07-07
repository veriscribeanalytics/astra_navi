'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Heart, Sparkles, Clock, AlertTriangle, Moon, Star, Activity,
    ShieldAlert, ShieldCheck, Lock, RefreshCw, TrendingUp, TrendingDown,
    MessageSquare, Users, Swords, Calendar, Loader2, ArrowRight,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useFamilyDashboard, useFamilyDashboardWeekly, familyAsk } from '@/hooks/useFamilyDashboard';
import { useToast } from '@/hooks/useToast';
import { usePaywallContext } from '@/context/PaywallContext';
import type { FamilyMember } from '@/types/family';
import type { PaywallData } from '@/types/paywall';
import {
    FAMILY_DASHBOARD_AREA_KEYS,
    FAMILY_DASHBOARD_AREA_LABEL_KEYS,
    familyDashboardBandHex,
    type FamilyDashboardArea,
    type FamilyDashboardAreaKey,
    type FamilyDashboardBandKey,
    type FamilyDashboardResponse,
    type FamilyDashboardTimeWindow,
    type FamilyDashboardWeeklyResponse,
} from '@/types/familyDashboard';
import PaywallCard from '@/components/paywall/PaywallCard';
import LockedPreview from '@/components/paywall/LockedPreview';
import { Skeleton } from '@/components/ui/Skeleton';
import BondWeeklyChart from '@/components/family/BondWeeklyChart';
import { LOCALE_BY_LANGUAGE } from '@/locales';

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const initialOf = (n?: string | null) => (n && n.trim() ? n.trim()[0].toUpperCase() : '?');

/**
 * Score-based tone colour + short word, per the Family Dashboard spec:
 *   65+ green (Favorable) · 50–64 gold (Balanced) · 35–49 orange (Needs Care) · <35 red (Needs Care).
 * Visible area colours follow the score so all six cards read consistently
 * with the "higher = better" framing.
 */
function scoreTone(score: number, t: (k: string) => string): { color: string; word: string } {
    if (score >= 65) return { color: '#3DD6A0', word: t('familyDashboard.toneFavorable') || 'Favorable' };
    if (score >= 50) return { color: '#E5A33A', word: t('familyDashboard.toneBalanced') || 'Balanced' };
    if (score >= 35) return { color: '#E0795A', word: t('familyDashboard.toneNeedsCare') || 'Needs Care' };
    return { color: '#D96B78', word: t('familyDashboard.toneNeedsCare') || 'Needs Care' };
}

/** Per-area lucide icon. Conflict uses Swords to match its "handling" framing. */
const AREA_ICONS: Record<FamilyDashboardAreaKey, React.ComponentType<{ className?: string }>> = {
    communication: MessageSquare,
    emotional_bond: Heart,
    trust: ShieldCheck,
    support: Heart,
    cooperation: Users,
    conflict_sensitivity: Swords,
};

function trendIcon(trend: string | undefined) {
    const t = (trend || '').toLowerCase();
    if (t === 'rising' || t === 'improving' || t === 'up') return <TrendingUp className="w-4 h-4" />;
    if (t === 'falling' || t === 'declining' || t === 'down') return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
}

/* ------------------------------------------------------------------ */
/* Bond score ring (large)                                              */
/* ------------------------------------------------------------------ */

function BondRing({ score, color }: { score: number; color: string }) {
    const radius = 52;
    const circumference = 2 * Math.PI * radius;
    const pct = Math.max(0, Math.min(100, score));
    const offset = circumference - (pct / 100) * circumference;
    return (
        <div className="relative flex items-center justify-center" style={{ width: 168, height: 168 }}>
            <svg role="img" aria-label={`Bond score ${score} out of 100`} className="h-full w-full -rotate-90" viewBox="0 0 128 128">
                <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--outline-variant)" strokeOpacity="0.12" strokeWidth="9" />
                <circle cx="64" cy="64" r={radius} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" style={{ filter: `drop-shadow(0 0 12px ${color}40)` }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-black leading-none tabular-nums" style={{ color, fontSize: 56 }}>{score}</span>
                <span className="mt-1 text-sm font-bold text-foreground/55">/ 100</span>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Section shell                                                        */
/* ------------------------------------------------------------------ */

function SectionShell({
    title,
    icon,
    right,
    children,
    emphasis = 'medium',
}: {
    title: string;
    icon?: React.ReactNode;
    right?: React.ReactNode;
    children: React.ReactNode;
    /** Visual hierarchy: hero = strongest, medium = areas/weekly, low = supporting tiles. */
    emphasis?: 'hero' | 'medium' | 'low';
}) {
    const ring =
        emphasis === 'hero'
            ? 'border-secondary/30 bg-gradient-to-br from-surface via-surface to-secondary/[0.04] shadow-[0_16px_48px_0_rgba(0,0,0,0.45)]'
            : emphasis === 'low'
                ? 'border-white/[0.06] bg-surface/60'
                : 'border-white/[0.10] bg-surface shadow-[0_8px_32px_0_rgba(0,0,0,0.32)]';
    const pad = emphasis === 'hero' ? 'p-6 sm:p-7 md:p-8' : emphasis === 'low' ? 'p-5 sm:p-6' : 'p-6';
    return (
        <section className={`rounded-[28px] border ${ring} ${pad}`}>
            {title && (
                <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2.5 font-headline font-bold text-foreground" style={{ fontSize: 20 }}>
                        {icon && <span className="text-secondary">{icon}</span>}
                        {title}
                    </h2>
                    {right}
                </header>
            )}
            {children}
        </section>
    );
}

/* ------------------------------------------------------------------ */
/* HERO — Your Bond Today (combines 4 former sections)                  */
/* ------------------------------------------------------------------ */

function GuidanceTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col gap-1.5">
            <span className="text-[13px] font-bold uppercase tracking-wider text-foreground/55 flex items-center gap-1.5">{icon}{label}</span>
            <p className="text-[15px] leading-relaxed text-foreground/85">{value}</p>
        </div>
    );
}

function ChipPill({ chip }: { chip: { label: string; value: string } }) {
    return (
        <div className="flex-1 min-w-[120px] rounded-2xl border border-secondary/20 bg-secondary/[0.07] px-4 py-3 flex flex-col gap-0.5">
            <span className="text-[13px] font-bold uppercase tracking-wider text-secondary/80">{chip.label}</span>
            <span className="text-[16px] font-headline font-bold text-foreground leading-tight">{chip.value}</span>
        </div>
    );
}

function WindowTile({
    kind,
    window: w,
    t,
}: {
    kind: 'good' | 'alert';
    window: FamilyDashboardTimeWindow | null;
    t: (k: string) => string;
}) {
    const isGood = kind === 'good';
    const Icon = isGood ? Heart : AlertTriangle;

    // "No alert" reassurance state (positive/compact, not a big empty red card).
    if (!w) {
        if (isGood) {
            return (
                <div className="flex-1 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground/[0.05] text-foreground/40"><Heart className="h-4 w-4" /></span>
                    <div className="min-w-0">
                        <p className="text-[13px] font-bold text-foreground/65">{t('familyDashboard.timeGoodNone') || 'No standout connection window today.'}</p>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex-1 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"><ShieldCheck className="h-4 w-4" /></span>
                <div className="min-w-0">
                    <p className="text-[13px] font-bold text-foreground/80">{t('familyDashboard.timeAlertNone') || 'No major relationship alert today.'}</p>
                </div>
            </div>
        );
    }

    const accent = isGood ? '#3DD6A0' : '#E0795A';
    const title = isGood ? (t('familyDashboard.timeGoodTitle') || 'Good Connection Window') : (t('familyDashboard.timeAlertTitle') || 'Relationship Alert');
    return (
        <div className="flex-1 rounded-2xl border p-4 flex items-start gap-3 min-w-0" style={{ borderColor: `${accent}45`, background: `${accent}0f` }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${accent}22`, color: accent }}>
                <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
                <span className="block text-[13px] font-black uppercase tracking-widest" style={{ color: accent }}>{title}</span>
                <p className="mt-0.5 text-[15px] font-headline font-bold text-foreground leading-tight truncate">{w.label}</p>
                {w.advice && <p className="mt-1 text-[13px] leading-relaxed text-foreground/55 line-clamp-2">{w.advice}</p>}
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1.5">
                <span className="inline-flex items-center rounded-lg border px-2.5 py-1 text-[14px] font-bold tabular-nums" style={{ borderColor: `${accent}55`, color: accent, background: `${accent}14` }}>
                    {w.start}–{w.end}
                </span>
                {w.lord && (
                    <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[13px] font-bold uppercase tracking-wider" style={{ borderColor: `${accent}40`, color: accent }}>
                        <Star className="h-2.5 w-2.5" />{w.lord}
                    </span>
                )}
            </div>
        </div>
    );
}

function HeroBondCard({
    data,
    paywall,
    t,
}: {
    data: FamilyDashboardResponse;
    paywall: PaywallData | null;
    t: (k: string) => string;
}) {
    const accent = familyDashboardBandHex(data.bond.band_key);

    const pairLeft = data.user;
    const pairRight = data.member;

    const guidance = data.guidance;
    const hasProGuidance = !!(guidance.best_for || guidance.avoid || guidance.approach);

    return (
        <SectionShell
            title={t('familyDashboard.yourBondToday') || 'Your Bond Today'}
            icon={<Heart className="w-5 h-5" />}
            emphasis="hero"
            right={
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-[13px] font-bold uppercase tracking-wider text-secondary">
                        {cap(data.member.relationship_type)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-black uppercase tracking-wider" style={{ color: accent, background: `${accent}1a`, border: `1px solid ${accent}40` }}>
                        {data.bond.band}
                    </span>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,30fr)_minmax(0,70fr)] gap-6 lg:gap-8">
                {/* LEFT ~30% — score + pair */}
                <div className="flex flex-col items-center text-center gap-4">
                    <BondRing score={data.bond.score} color={accent} />
                    <div className="flex items-center justify-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 border border-secondary/20 text-[16px] font-headline font-bold text-secondary">{initialOf(pairLeft.name)}</span>
                            <div className="text-left">
                                <p className="text-[17px] font-headline font-bold text-foreground leading-tight">{pairLeft.name}</p>
                                <p className="text-[14px] uppercase tracking-wider text-foreground/55">{pairLeft.sign}</p>
                            </div>
                        </div>
                        <span className="text-foreground/35 text-lg">↔</span>
                        <div className="flex items-center gap-2">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 border border-secondary/20 text-[16px] font-headline font-bold text-secondary">{initialOf(pairRight.name)}</span>
                            <div className="text-left">
                                <p className="text-[17px] font-headline font-bold text-foreground leading-tight">{pairRight.name}</p>
                                <p className="text-[14px] uppercase tracking-wider text-foreground/55">{pairRight.sign}</p>
                            </div>
                        </div>
                    </div>

                    {/* Panchang line */}
                    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[13px] text-foreground/55">
                        <span className="inline-flex items-center gap-1"><Moon className="h-3.5 w-3.5" />{data.meta.panchanga.tithi}</span>
                        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" />{data.meta.panchanga.nakshatra}</span>
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{data.meta.panchanga.vaara}</span>
                    </div>
                    <p className="text-[13px] text-foreground/45 italic">
                        {data.meta.location_basis === 'birth'
                            ? (t('familyDashboard.locationBirth') || 'based on your birth location')
                            : (t('familyDashboard.locationFixed') || 'based on a default location')}
                    </p>
                </div>

                {/* RIGHT ~70% — guidance headline + chips + best/avoid/approach */}
                <div className="flex flex-col gap-5">
                    {/* Main guidance headline (free teaser is just the summary) */}
                    <div className="rounded-2xl border border-secondary/20 bg-secondary/[0.06] p-5 flex items-start gap-3">
                        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                        <p className="font-headline font-bold text-foreground leading-snug" style={{ fontSize: 22 }}>{guidance.summary}</p>
                    </div>

                    {/* Chips row (Pro+). Free → compact locked teaser inside the hero. */}
                    {data.chips && data.chips.length > 0 ? (
                        <div className="flex flex-wrap gap-3">
                            {data.chips.map((chip) => <ChipPill key={chip.key} chip={chip} />)}
                        </div>
                    ) : paywall ? (
                        <div className="rounded-2xl border border-dashed border-secondary/30 bg-secondary/[0.04] p-4 flex items-center justify-between gap-3">
                            <p className="text-[15px] text-foreground/65 flex-1">{t('familyDashboard.chipsUnlock') || 'Unlock bond theme, communication & shared mood with Pro.'}</p>
                            <Link href={`/plans?feature=full_daily_horoscope`} className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-secondary/40 bg-secondary/10 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20">
                                <Lock className="h-3.5 w-3.5" />{t('paywall.viewPlans') || 'View Plans'}
                            </Link>
                        </div>
                    ) : null}

                    {/* Best For / Avoid / Approach (Pro+). Free → single locked teaser. */}
                    {hasProGuidance ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {guidance.best_for && <GuidanceTile label={t('familyDashboard.guidanceBestFor') || 'Best For'} value={guidance.best_for} icon={<TrendingUp className="h-4 w-4 text-emerald-400" />} />}
                            {guidance.avoid && <GuidanceTile label={t('familyDashboard.guidanceAvoid') || 'Avoid'} value={guidance.avoid} icon={<ShieldAlert className="h-4 w-4 text-orange-400" />} />}
                            {guidance.approach && <GuidanceTile label={t('familyDashboard.guidanceApproach') || 'Approach'} value={guidance.approach} icon={<MessageSquare className="h-4 w-4 text-secondary" />} />}
                        </div>
                    ) : paywall ? (
                        <div className="rounded-2xl border border-dashed border-secondary/30 bg-secondary/[0.04] p-4 flex items-center justify-between gap-3">
                            <p className="text-[15px] text-foreground/65 flex-1">{t('familyDashboard.guidanceUnlock') || 'Unlock best-for, avoid & approach guidance with Pro.'}</p>
                            <Link href={`/plans?feature=full_daily_horoscope`} className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-secondary/40 bg-secondary/10 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20">
                                <Lock className="h-3.5 w-3.5" />{t('paywall.viewPlans') || 'View Plans'}
                            </Link>
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Bottom of hero — Connection Windows (was a giant separate section) */}
            <div className="mt-6 pt-6 border-t border-white/[0.08]">
                <div className="mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-secondary" />
                    <span className="text-[14px] font-bold uppercase tracking-wider text-foreground/65">{t('familyDashboard.timeTitle') || 'Connection Windows'}</span>
                    {data.time_triggers && (
                        <span
                            className="ml-auto inline-flex items-center gap-1 text-[13px] font-semibold uppercase tracking-wider text-foreground/35 cursor-help"
                            title={t('familyDashboard.horaSunriseHint') || 'Calculated using sunrise and sunset at your saved birth location.'}
                        >
                            {data.time_triggers.hora_mode === 'sunrise'
                                ? (t('familyDashboard.horaSunrise') || 'Vedic Hora (sunrise)')
                                : (t('familyDashboard.horaFixed') || 'Fixed time')}
                        </span>
                    )}
                </div>
                {data.time_triggers ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <WindowTile kind="good" window={data.time_triggers.good_connection} t={t} />
                        <WindowTile kind="alert" window={data.time_triggers.relationship_alert} t={t} />
                    </div>
                ) : paywall ? (
                    <div className="rounded-2xl border border-dashed border-secondary/30 bg-secondary/[0.04] p-4 flex items-center justify-between gap-3">
                        <p className="text-[15px] text-foreground/65 flex-1">{t('familyDashboard.timeUnlock') || 'Unlock good-connection & alert time windows with Pro.'}</p>
                        <Link href={`/plans?feature=full_daily_horoscope`} className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-secondary/40 bg-secondary/10 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20">
                            <Lock className="h-3.5 w-3.5" />{t('paywall.viewPlans') || 'View Plans'}
                        </Link>
                    </div>
                ) : null}
            </div>
        </SectionShell>
    );
}

/* ------------------------------------------------------------------ */
/* Relationship Areas — 3×2 card grid                                   */
/* ------------------------------------------------------------------ */

function AreaCard({ areaKey, area, t }: { areaKey: FamilyDashboardAreaKey; area: FamilyDashboardArea; t: (k: string) => string }) {
    const Icon = AREA_ICONS[areaKey];
    const harmony = Math.max(0, Math.min(100, area.value));
    const { color, word } = scoreTone(harmony, t);
    const isConflict = areaKey === 'conflict_sensitivity';

    // Conflict is shown as "Conflict Handling" (not "Conflict Sensitivity") so a
    // higher-is-better score doesn't read as contradictory.
    const labelKey = isConflict ? 'familyDashboard.areas.conflict_handling' : FAMILY_DASHBOARD_AREA_LABEL_KEYS[areaKey];
    const translated = t(labelKey);
    const title = translated && translated !== labelKey ? translated : cap(areaKey.replace(/_/g, ' '));

    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${color}1a`, color }}>
                    <Icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-headline font-bold text-foreground leading-tight truncate">{title}</p>
                </div>
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[16px] font-black tabular-nums" style={{ color }}>{harmony}<span className="text-foreground/45 text-[13px] font-bold">/100</span></span>
                <span className="text-[13px] font-bold" style={{ color }}>· {word}</span>
            </div>
            <div className="h-2 rounded-full bg-foreground/[0.08] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${harmony}%`, background: color }} />
            </div>
            <p className="text-[13px] leading-relaxed text-foreground/60 line-clamp-2">{area.insight}</p>
            {isConflict && area.level && (
                <p className="text-[13px] font-bold text-foreground/70">{area.level} {t('familyDashboard.riskLabel') || 'Risk'}</p>
            )}
            {isConflict && typeof area.risk_value === 'number' && (
                <p className="text-[13px] text-foreground/45">{t('familyDashboard.areasHarmony') || 'Harmony'} {harmony} · {t('familyDashboard.areasRisk') || 'Risk'} {area.risk_value}</p>
            )}
        </div>
    );
}

function AreasSection({
    data,
    paywall,
    t,
}: {
    data: FamilyDashboardResponse;
    paywall: PaywallData | null;
    t: (k: string) => string;
}) {
    const full = data.relationship_areas;
    const summary = data.areas_summary;

    // "Most Balanced" duplicates "Strongest" when the same area is both highest
    // and closest to 60 — in that case drop the third chip so we don't show the
    // same area twice. Never invent a different area; just use fewer chips.
    const summaryChips = [
        { item: summary.strongest, label: t('familyDashboard.areasStrongest') || 'Strongest', accent: '#3DD6A0' },
        { item: summary.needs_care, label: t('familyDashboard.areasNeedsCare') || 'Needs Care', accent: '#E0795A' },
        { item: summary.stable, label: t('familyDashboard.areasStable') || 'Most Balanced', accent: '#E5A33A' },
    ].filter((chip, _i, arr) => {
        // Drop "Most Balanced" if it points at the same area as "Strongest".
        const strongest = arr[0];
        if (chip.label !== (t('familyDashboard.areasStable') || 'Most Balanced')) return true;
        return chip.item.key !== strongest.item.key;
    });
    const chipCols = summaryChips.length >= 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2';

    return (
        <SectionShell
            title={t('familyDashboard.areasTitle') || 'Relationship Areas at a Glance'}
            icon={<Activity className="w-5 h-5" />}
            emphasis="medium"
        >
            {/* Summary chips */}
            <div className={`grid grid-cols-1 ${chipCols} gap-3 mb-5`}>
                {summaryChips.map(({ item, label, accent }) => {
                    const lk = FAMILY_DASHBOARD_AREA_LABEL_KEYS[item.key as FamilyDashboardAreaKey];
                    const name = t(lk);
                    const areaLabel = name && name !== lk ? name : cap(item.key.replace(/_/g, ' '));
                    return (
                        <div key={label} className="rounded-2xl border p-3.5 flex items-center gap-3" style={{ borderColor: `${accent}40`, background: `${accent}0d` }}>
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0" style={{ background: `${accent}1a`, color: accent }}>
                                <Star className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-[13px] font-bold uppercase tracking-wider" style={{ color: accent }}>{label}</p>
                                <p className="text-[15px] font-headline font-bold text-foreground truncate">{areaLabel}</p>
                            </div>
                            <span className="ml-auto text-[16px] font-black tabular-nums shrink-0" style={{ color: accent }}>{item.value}</span>
                        </div>
                    );
                })}
            </div>

            {full ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {FAMILY_DASHBOARD_AREA_KEYS.map((key) => (
                        <AreaCard key={key} areaKey={key} area={full[key]} t={t} />
                    ))}
                </div>
            ) : (
                <div className="min-h-[170px]">
                    <LockedPreview
                        message={t('familyDashboard.areasUnlock') || 'Unlock all six relationship areas with Pro'}
                        subMessage={t('familyDashboard.areasUnlockSub') || 'Communication, emotional bond, trust, support, cooperation & conflict handling — with daily insights.'}
                        ctas={paywall ? [{ label: t('paywall.viewPlans') || 'View Plans', href: `/plans?feature=full_daily_horoscope` }] : undefined}
                    />
                </div>
            )}
        </SectionShell>
    );
}

/* ------------------------------------------------------------------ */
/* Weekly Bond — smaller chart + 4 compact summary cards                */
/* ------------------------------------------------------------------ */

function SummaryStat({ label, value, icon, accent }: { label: string; value: string; icon?: React.ReactNode; accent?: string }) {
    return (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 flex flex-col gap-1">
            <span className="text-[13px] font-bold uppercase tracking-wider text-foreground/55 flex items-center gap-1.5">{icon}{label}</span>
            <span className="text-[16px] font-headline font-bold capitalize" style={accent ? { color: accent } : undefined}>{value}</span>
        </div>
    );
}

function WeeklyBondSection({
    weekly,
    loading,
    degraded,
    paywall,
    t,
    locale,
}: {
    weekly: FamilyDashboardWeeklyResponse | null;
    loading: boolean;
    degraded: boolean;
    paywall: PaywallData | null;
    t: (k: string) => string;
    locale: string;
}) {
    const chartHex = weekly ? familyDashboardBandHex(weekly.days[0]?.band_key as FamilyDashboardBandKey | undefined) : '#E5A33A';

    // "Stable week" reassurance when variation is very low.
    const stableMsg = useMemo(() => {
        if (!weekly || weekly.days.length < 2) return '';
        const scores = weekly.days.map((d) => d.score);
        const span = Math.max(...scores) - Math.min(...scores);
        if (span > 8) return '';
        const band = weekly.days.find((d) => d.is_today)?.band || '';
        const key = 'familyDashboard.stableWeek';
        const base = t(key) || 'Stable week — your bond remains consistently supportive.';
        return band ? `${base.replace(/supportive\.?$/i, '').trim()} ${band.toLowerCase()}.` : base;
    }, [weekly, t]);

    // Human-readable date range, e.g. "29 Jun – 5 Jul 2026" (spec: never raw ISO).
    const rangeLabel = useMemo(() => {
        if (!weekly?.range) return '';
        const parse = (s: string) => {
            const d = new Date(s + 'T00:00:00');
            return Number.isNaN(d.getTime()) ? null : d;
        };
        const f = parse(weekly.range.from);
        const l = parse(weekly.range.to);
        if (!f || !l) return `${weekly.range.from} – ${weekly.range.to}`;
        const sameYear = f.getFullYear() === l.getFullYear();
        const optsFrom: Intl.DateTimeFormatOptions = sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' };
        const optsTo: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        return `${f.toLocaleDateString(locale, optsFrom)} – ${l.toLocaleDateString(locale, optsTo)}`;
    }, [weekly, locale]);

    return (
        <SectionShell
            title={t('familyDashboard.weeklyTitle') || 'Your Bond This Week'}
            icon={<Calendar className="w-5 h-5" />}
            emphasis="medium"
            right={rangeLabel ? (
                <span className="text-[13px] font-bold uppercase tracking-wider text-foreground/50">{rangeLabel}</span>
            ) : undefined}
        >
            {loading ? (
                <Skeleton height={320} />
            ) : degraded ? (
                <p className="text-[15px] text-foreground/55 py-8 text-center">{t('familyDashboard.degradedBody') || 'Transit calculation is temporarily unavailable. Please try again later.'}</p>
            ) : weekly ? (
                <div className="space-y-5">
                    <BondWeeklyChart data={weekly} colorHex={chartHex} stable={stableMsg} locale={locale} />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <SummaryStat label={t('familyDashboard.weeklyBest') || 'Best Day'} value={weekly.summary.best_day} icon={<TrendingUp className="w-4 h-4 text-emerald-400" />} />
                        <SummaryStat label={t('familyDashboard.weeklyWorst') || 'Toughest Day'} value={weekly.summary.worst_day} icon={<TrendingDown className="w-4 h-4 text-orange-400" />} />
                        <SummaryStat label={t('familyDashboard.weeklyAverage') || 'Average'} value={String(weekly.summary.average_score)} icon={<Activity className="w-4 h-4 text-foreground/55" />} />
                        <SummaryStat label={t('familyDashboard.weeklyTrend') || 'Trend'} value={weekly.summary.trend || '—'} icon={trendIcon(weekly.summary.trend)} />
                    </div>
                    {weekly.summary.best_day_note ? (
                        <div className="rounded-2xl border border-secondary/20 bg-secondary/[0.06] p-4 flex items-start gap-2.5">
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                            <p className="text-[15px] leading-relaxed text-foreground/80">{weekly.summary.best_day_note}</p>
                        </div>
                    ) : paywall ? (
                        <div className="rounded-2xl border border-dashed border-secondary/30 bg-secondary/[0.04] p-4 flex items-center justify-between gap-3">
                            <p className="text-[15px] text-foreground/65 flex-1">{t('familyDashboard.weeklyNoteUnlock') || 'Unlock the best-day guidance note with Pro.'}</p>
                            <Link href={`/plans?feature=full_daily_horoscope`} className="shrink-0 inline-flex items-center gap-1 rounded-xl border border-secondary/40 bg-secondary/10 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20">
                                <Lock className="h-3.5 w-3.5" />{t('paywall.viewPlans') || 'View Plans'}
                            </Link>
                        </div>
                    ) : null}
                </div>
            ) : null}
        </SectionShell>
    );
}

/* ------------------------------------------------------------------ */
/* Empty / degraded / sharing states                                    */
/* ------------------------------------------------------------------ */

function DegradedState({ onRetry, t }: { onRetry: () => void; t: (k: string) => string }) {
    return (
        <div className="rounded-[28px] border border-orange-500/25 bg-orange-500/[0.06] p-6 flex flex-col items-center text-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20"><AlertTriangle className="h-6 w-6" /></span>
            <h3 className="text-lg font-headline font-bold text-foreground">{t('familyDashboard.degradedTitle') || 'Bond reading unavailable'}</h3>
            <p className="text-[15px] text-foreground/60 max-w-md leading-relaxed">{t('familyDashboard.degradedBody') || 'Transit calculation is temporarily unavailable. Please try again later.'}</p>
            <button onClick={onRetry} className="inline-flex items-center gap-1.5 rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20">
                <RefreshCw className="h-4 w-4" />{t('familyDashboard.degradedRetry') || 'Try again'}
            </button>
        </div>
    );
}

function SharingRequiredState({ t }: { t: (k: string) => string }) {
    return (
        <div className="rounded-[28px] border border-secondary/25 bg-secondary/[0.06] p-6 flex flex-col items-center text-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary border border-secondary/20"><ShieldAlert className="h-6 w-6" /></span>
            <h3 className="text-lg font-headline font-bold text-foreground">{t('familyDashboard.sharingTitle') || 'Sharing required'}</h3>
            <p className="text-[15px] text-foreground/60 max-w-md leading-relaxed">{t('familyDashboard.sharingBody') || 'Enable two-way sharing with this connection to view their bond dashboard.'}</p>
            <Link href="/family" className="inline-flex items-center gap-1.5 rounded-xl border border-secondary/40 bg-secondary/10 px-4 py-2 text-[13px] font-bold uppercase tracking-wider text-secondary hover:bg-secondary/20">
                <Users className="h-4 w-4" />{t('familyDashboard.sharingManage') || 'Manage connection'}
            </Link>
        </div>
    );
}

function SkeletonBlockSet() {
    return (
        <div className="space-y-5">
            <Skeleton height={360} />
            <Skeleton height={180} />
            <Skeleton height={360} />
        </div>
    );
}

function hardGatePaywall(t: (k: string) => string): PaywallData {
    return {
        featureKey: 'full_daily_horoscope',
        isSoft: true,
        title: t('familyDashboard.hardGateTitle') || 'Unlock the full bond dashboard',
        description: t('familyDashboard.hardGateBody') || 'Upgrade to Pro to reveal bond themes, time windows, all six relationship areas, and the weekly best-day note.',
        badge: 'Pro',
        tier: 'pro',
    };
}

/* ====================================================================== */
/* Reusable body — embed inside the family member/connection detail views  */
/* ====================================================================== */

export default function BondDashboardBody({ member }: { member: FamilyMember }) {
    const { t, language } = useTranslation();
    const router = useRouter();
    const { isFeatureBlocked } = usePaywallContext();
    const featureBlocked = isFeatureBlocked('full_daily_horoscope');

    const { data, isLoading, error, degraded, paywall, sharingRequired, refetch } = useFamilyDashboard(member, language);
    const weekly = useFamilyDashboardWeekly(member, language);

    const { error: toastError } = useToast();
    const [asking, setAsking] = useState(false);

    const handleAsk = async () => {
        if (asking) return;
        setAsking(true);
        try {
            const result = await familyAsk(member);
            if (!result.ok || !result.data) {
                if (result.sharingRequired) {
                    toastError(t('familyDashboard.sharingBody') || 'Enable two-way sharing with this connection to view their bond dashboard.');
                } else {
                    toastError(result.error || (t('familyDashboard.askError') || 'Could not start the conversation.'));
                }
                return;
            }
            const chatId = result.data.chat.id;
            const prefill = result.data.starter.prefill;
            try {
                sessionStorage.setItem('astranavi_family_prefill', JSON.stringify({ chatId, prefill }));
            } catch { /* sessionStorage unavailable — non-fatal */ }
            router.push(`/chat?id=${encodeURIComponent(chatId)}`);
        } catch {
            toastError(t('familyDashboard.askError') || 'Could not start the conversation.');
        } finally {
            setAsking(false);
        }
    };

    const locale = LOCALE_BY_LANGUAGE[language] || 'en-IN';
    const formattedDate = useMemo(() => {
        if (!data?.meta?.date) return null;
        const d = new Date(data.meta.date + 'T00:00:00');
        if (Number.isNaN(d.getTime())) return null;
        return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }, [data, locale]);

    return (
        // Capped width so the dashboard doesn't stretch across a wide monitor;
        // leaves the rest of the family detail view untouched.
        <div className="w-full max-w-[1520px] mx-auto space-y-5 sm:space-y-6">
            {formattedDate && (
                <div className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-foreground/45">
                    <Calendar className="h-3.5 w-3.5" />{formattedDate}
                </div>
            )}

            {paywall && <PaywallCard paywall={paywall} variant="inline" />}

            {sharingRequired ? (
                <SharingRequiredState t={t} />
            ) : degraded && !data ? (
                <DegradedState onRetry={refetch} t={t} />
            ) : isLoading && !data ? (
                <SkeletonBlockSet />
            ) : error && !data ? (
                <div className="rounded-[28px] border border-red-500/25 bg-red-500/[0.06] p-5 text-[15px] text-red-400 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />{error}
                </div>
            ) : data ? (
                <>
                    {/* HERO — combines bond + guidance + chips + connection windows */}
                    <HeroBondCard data={data} paywall={paywall} t={t} />

                    {/* Relationship Areas (3×2 grid) */}
                    <AreasSection data={data} paywall={paywall} t={t} />

                    {/* Your Bond This Week (smaller chart) */}
                    <WeeklyBondSection weekly={weekly.data} loading={weekly.isLoading} degraded={weekly.degraded} paywall={weekly.paywall ?? paywall} t={t} locale={locale} />

                    {/* Ask Navi — gold primary CTA only */}
                    <button
                        type="button"
                        onClick={handleAsk}
                        disabled={asking}
                        className="group w-full flex items-center justify-between gap-4 rounded-[24px] border border-secondary/50 bg-gradient-to-r from-secondary via-amber-500 to-secondary p-6 shadow-[0_12px_40px_0_rgba(212,175,55,0.25)] hover:shadow-[0_16px_50px_0_rgba(212,175,55,0.35)] transition-all disabled:opacity-70 disabled:cursor-wait"
                        aria-label={t('familyDashboard.askCta') || 'Ask about this relationship'}
                    >
                        <div className="flex items-center gap-4 min-w-0">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 border border-white/25 text-white group-hover:scale-105 transition-transform">
                                {asking ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                            </span>
                            <div className="min-w-0 text-left">
                                <p className="text-lg font-headline font-bold text-white leading-tight">
                                    {t('familyDashboard.askCta') || 'Ask Navi About This Relationship'}
                                </p>
                                <p className="text-[15px] text-white/80 mt-0.5 leading-relaxed">
                                    {t('familyDashboard.askCtaSub') || 'Get guidance using both family charts.'}
                                </p>
                            </div>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-white/20 border border-white/30 px-4 py-2.5 text-[13px] font-black uppercase tracking-wider text-white group-hover:bg-white/30 transition-colors">
                            {t('familyDashboard.askCtaBtn') || 'Ask'}<ArrowRight className="h-4 w-4" />
                        </span>
                    </button>
                </>
            ) : null}

            {featureBlocked && data && !paywall && (
                <PaywallCard paywall={hardGatePaywall(t)} variant="inline" />
            )}
        </div>
    );
}

/**
 * Build a minimal `FamilyMember` from a `FamilyConnection` so the bond-dashboard
 * hooks route to `/connections/{connectionId}/*` (sharing-gated). Used by the
 * connection detail view to embed {@link BondDashboardBody}.
 */
export function memberFromConnection(connection: {
    connectionId: number;
    otherName: string;
    iSeeThemAs: FamilyMember['relationshipType'];
}): FamilyMember {
    return {
        id: connection.connectionId,
        source: 'linked',
        name: connection.otherName,
        relationshipType: connection.iSeeThemAs,
        gender: 'other',
        connectionId: connection.connectionId,
    };
}
