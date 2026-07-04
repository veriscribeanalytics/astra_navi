'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Heart, Coins, FileText, MessageCircle, Sparkles,
    Sun, Calendar, Compass, CheckCircle2, AlertCircle, TrendingUp, AlertTriangle,
    HandHeart, ArrowRight, ChevronDown, ChevronUp, BadgeCheck,
    Users, Star, Moon, Flower, Activity, Lock,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/hooks';
import { bandPalette } from '@/lib/familyStatus';
import type {
    FamilyCompatibilityResponse,
    FamilyCompatibilityFactor,
    FamilyCompatibilityAdvice,
} from '@/types/family';

/* ====================================================================== */
/* Shared helpers (single home — imported by FamilyClient too)            */
/* ====================================================================== */

const FAMILY_ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
    heart: Heart,
    star: Star,
    smile: Sparkles,
    sparkles: Sparkles,
    user: Users,
    users: Users,
    sun: Sun,
    moon: Moon,
    compass: Compass,
    flower: Flower,
    coins: Coins,
    activity: Activity,
};

export function getFamilyIcon(iconKey?: string | null): React.FC<{ className?: string }> {
    if (!iconKey) return Users;
    return FAMILY_ICON_MAP[iconKey.toLowerCase()] || Users;
}

/** Format a YYYY-MM-DD birth date as a local, human date (no timezone shift). */
export function formatDob(value: string | null | undefined): string {
    if (!value) return '—';
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;
    const [, y, m, day] = match;
    const dt = new Date(Number(y), Number(m) - 1, Number(day));
    if (Number.isNaN(dt.getTime())) return value;
    return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Format an HH:MM[:SS] birth time as 12-hour with AM/PM. */
export function formatTob(value: string | null | undefined): string {
    if (!value) return '—';
    const match = /^(\d{1,2}):(\d{2})/.exec(value);
    if (!match) return value;
    const h24 = Number(match[1]);
    const min = match[2];
    if (Number.isNaN(h24)) return value;
    const period = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${String(h12).padStart(2, '0')}:${min} ${period}`;
}

export function statusPalette(status: string): { text: string; bg: string; border: string; bar: string } {
    switch (status) {
        case 'strength':
            return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-400' };
        case 'tension':
            return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', bar: 'bg-orange-400' };
        case 'balanced':
        default:
            return { text: 'text-indigo-300', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', bar: 'bg-indigo-400' };
    }
}

export function confidencePalette(level: string): { text: string; bg: string; border: string } {
    switch (level) {
        case 'high':
            return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
        case 'low':
            return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
        case 'medium':
        default:
            return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    }
}

/** Unicode gender glyph; null when unknown (so the UI omits it rather than guessing). */
function genderSymbol(gender?: string | null): string | null {
    switch ((gender || '').toLowerCase()) {
        case 'male': return '♂';
        case 'female': return '♀';
        case 'other': return '⚧';
        default: return null;
    }
}

/* ====================================================================== */
/* Public types                                                           */
/* ====================================================================== */

export interface ReportSubject {
    name: string;
    /** Uppercased initial; '?' fallback. */
    initial: string;
    gender?: string | null;
    dob?: string | null;          // YYYY-MM-DD
    tob?: string | null;          // HH:MM
    pob?: string | null;
    avatar?: { iconKey: string; accentColor: string } | null;
    /** Linked connections render a verified badge. */
    verified?: boolean;
    /** false → degrade the panel (e.g. linked connections never expose birth data). */
    hasBirthDetails: boolean;
    /** Shown in place of birth details when hasBirthDetails is false. */
    relationshipLabel?: string;
}

export interface CompatibilityReportProps {
    you: ReportSubject;
    them: ReportSubject;
    data: FamilyCompatibilityResponse;
    /** Current credit balance for the "Credits: N" chip. */
    totalCredits: number | null;
    onRerun: () => void;
    onViewFullReport: () => void;
    askNaviHref: string;
    onBack: () => void;
    /** Optional edit affordance (member view only). */
    onEdit?: () => void;
    cached: boolean;
    /** alreadyPaidForPair && !cached → "Free re-run" (free re-translation). */
    freeRerun: boolean;
    rerunLoading: boolean;
    /** Connection-only chrome (SHARING_REQUIRED gate, stale-refresh CTA). */
    slotBelowActions?: React.ReactNode;
}

/* ====================================================================== */
/* Leaf components                                                        */
/* ====================================================================== */

function ReportHeader({ themName, onBack }: { themName: string; onBack: () => void }) {
    const { t } = useTranslation();
    return (
        <div className="space-y-4">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-[12px] text-on-surface-variant/70">
                <button
                    type="button"
                    onClick={onBack}
                    aria-label={t('common.back') || 'Back'}
                    className="w-7 h-7 rounded-lg border border-outline-variant/30 flex items-center justify-center text-on-surface-variant/70 hover:text-secondary hover:border-secondary/40 transition-colors shrink-0"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={onBack} className="hover:text-secondary transition-colors">
                    {t('family.breadcrumbRoot') || t('family.myFamily') || 'My Family'}
                </button>
                <span className="opacity-40">›</span>
                <span className="text-primary font-bold">{t('family.breadcrumbReport') || 'Compatibility Report'}</span>
            </div>

            {/* Title */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
                    <Heart className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold text-primary leading-tight">
                        {t('family.reportTitle') || 'Family Compatibility Report'}
                    </h1>
                    <p className="text-[12px] sm:text-sm text-on-surface-variant/85 truncate">
                        {(t('family.reportSubtitle') || 'Detailed report for you and {name}').replace('{name}', themName)}
                    </p>
                </div>
            </div>
        </div>
    );
}

function ActionBar({
    totalCredits, askNaviHref, onEdit, cached, freeRerun,
}: Pick<CompatibilityReportProps, 'totalCredits' | 'askNaviHref' | 'onEdit' | 'cached' | 'freeRerun'>) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {totalCredits != null && (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold text-secondary/90 bg-secondary/10 border border-secondary/20">
                    <Coins className="w-3.5 h-3.5" />
                    {(t('family.creditsChip') || 'Credits: {n}').replace('{n}', String(totalCredits))}
                </span>
            )}
            {cached && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-1">
                    Cached
                </span>
            )}
            {freeRerun && !cached && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-1">
                    Free re-run
                </span>
            )}

            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                {onEdit && (
                    <Button variant="ghost" size="sm" onClick={onEdit} leftIcon={<FileText className="w-3.5 h-3.5" />}>
                        Edit member
                    </Button>
                )}
                <Link href={askNaviHref}>
                    <Button variant="ghost" size="sm" leftIcon={<MessageCircle className="w-3.5 h-3.5" />}>
                        Ask Navi
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export function SubjectPanel({ subject, roleLabel, align }: { subject: ReportSubject; roleLabel: string; align: 'left' | 'right' }) {
    const { t } = useTranslation();
    const accent = subject.avatar?.accentColor || 'var(--secondary)';
    const symbol = genderSymbol(subject.gender);
    const isRight = align === 'right';

    const avatar = subject.avatar ? (
        <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 border"
            style={{ color: accent, borderColor: `${accent}33`, backgroundColor: `${accent}11` }}
        >
            {React.createElement(getFamilyIcon(subject.avatar.iconKey), { className: 'w-7 h-7' })}
        </div>
    ) : (
        <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 border text-xl font-bold"
            style={{ color: accent, borderColor: `${accent}33`, backgroundColor: `${accent}11` }}
        >
            {subject.initial}
        </div>
    );

    return (
        <div className={`flex items-center gap-3 sm:gap-4 min-w-0 ${isRight ? 'flex-row-reverse text-right' : 'text-left'}`}>
            {avatar}
            <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-on-surface-variant/75 font-bold">{roleLabel}</p>
                <div className={`flex items-center gap-1.5 ${isRight ? 'flex-row-reverse' : ''}`}>
                    <h3 className="text-lg sm:text-xl font-headline font-bold text-primary truncate">{subject.name}</h3>
                    {subject.verified && (
                        <BadgeCheck className="w-4 h-4 text-secondary shrink-0" aria-label={t('family.verifiedBadge') || 'Verified'} />
                    )}
                </div>

                {subject.hasBirthDetails ? (
                    <div className="mt-1 text-[12px] text-on-surface-variant/90">
                        {symbol && (
                            <span className="text-secondary/90 font-bold">{symbol}</span>
                        )}
                    </div>
                ) : (
                    <div className="mt-1 space-y-1">
                        {subject.relationshipLabel && (
                            <p className="text-[11px] uppercase tracking-wider text-secondary/90 font-bold">{subject.relationshipLabel}</p>
                        )}
                        {symbol && (
                            <p className="text-[12px] text-secondary/90 font-bold">{symbol}</p>
                        )}
                        <div className={`flex items-center gap-2 pt-0.5 ${isRight ? 'flex-row-reverse' : ''}`}>
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-300">
                                <AlertCircle className="w-3 h-3" />
                                {subject.verified
                                    ? 'Birth details not shared'
                                    : 'Birth details incomplete'}
                            </span>
                            {!subject.verified && (
                                <span className="text-[10px] font-bold text-secondary underline decoration-secondary/30 underline-offset-2">
                                    Add details
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export function HeroScore({ score, band }: { score: number; band: string }) {
    const { t } = useTranslation();
    const palette = bandPalette(band);
    const valid = Number.isFinite(score);
    const clamped = valid ? Math.max(0, Math.min(100, Math.round(score))) : null;
    return (
        <div className="flex flex-col items-center text-center px-2">
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant/80 font-bold">
                {t('family.overallCompatibility') || 'Overall Compatibility'}
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-4xl sm:text-5xl font-headline font-bold text-secondary tabular-nums leading-none">
                    {clamped ?? '—'}
                </span>
                <span className="text-base font-bold text-on-surface-variant/45">/ 100</span>
            </div>
            {band && (
                <span className={`mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${palette.bg} ${palette.text} ${palette.border}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {band}
                </span>
            )}
        </div>
    );
}

const TIMEFRAME_TONES: Record<string, { label: string; classes: string }> = {
    today: { label: 'Favourable', classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    week: { label: 'Supportive', classes: 'bg-teal-500/10 text-teal-300 border-teal-500/30' },
    long: { label: 'Stable', classes: 'bg-sky-500/10 text-sky-300 border-sky-500/30' },
};

function TimeframeCards({ actions }: { actions: FamilyCompatibilityResponse['relationship_actions'] }) {
    const { t } = useTranslation();
    if (!actions) return null;
    const items = [
        { key: 'today', label: t('family.timeframeToday') || 'Today', text: actions.today, icon: <Sun className="w-5 h-5" /> },
        { key: 'week', label: t('family.timeframeThisWeek') || 'This Week', text: actions.this_week, icon: <Calendar className="w-5 h-5" /> },
        { key: 'long', label: t('family.timeframeLongTerm') || 'Long Term', text: actions.long_term, icon: <Compass className="w-5 h-5" /> },
    ].filter((it) => it.text?.trim());
    if (items.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {items.map((it) => {
                const tone = TIMEFRAME_TONES[it.key];
                return (
                    <Card key={it.key} variant="default" padding="md" hoverable={false}>
                        <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0">
                                {it.icon}
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-sm font-headline font-bold text-secondary">{it.label}</h4>
                                <p className="text-[13px] text-on-surface-variant/90 leading-relaxed mt-0.5">{it.text}</p>
                                {tone && (
                                    <span className={`mt-2 inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tone.classes}`}>
                                        {tone.label}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

function HighlightColumn({
    title, icon, items, variant,
}: {
    title: string;
    icon: React.ReactNode;
    items: FamilyCompatibilityResponse['strengths'];
    variant: 'strength' | 'tension';
}) {
    const { t } = useTranslation();
    const isStrength = variant === 'strength';
    const accent = isStrength ? 'text-emerald-400' : 'text-orange-400';
    const RowIcon = isStrength ? CheckCircle2 : AlertCircle;
    return (
        <div className="h-full rounded-2xl border border-outline-variant/15 bg-surface-variant/20 p-4">
            <div className={`flex items-center gap-1.5 mb-2.5 ${accent}`}>
                {icon}
                <p className="text-[11px] font-bold uppercase tracking-widest">{title}</p>
            </div>
            {items && items.length > 0 ? (
                <ul className="space-y-2">
                    {items.map((it, i) => (
                        <li key={i} className="flex items-start gap-2">
                            <RowIcon className={`w-4 h-4 shrink-0 mt-0.5 ${accent}`} />
                            <div className="min-w-0">
                                <p className="text-[13px] text-on-surface-variant/95 leading-snug">{it.factor}</p>
                                {it.text && it.text !== it.factor && (
                                    <p className="text-[11px] text-on-surface-variant/75 leading-snug mt-0.5">{it.text}</p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-[12px] text-on-surface-variant/65 italic">
                    {isStrength
                        ? (t('family.noStrengths') || 'No major strengths highlighted.')
                        : (t('family.noTensions') || 'No major tension points highlighted.')}
                </p>
            )}
        </div>
    );
}

function GuidancePanel({ advice }: { advice: FamilyCompatibilityAdvice }) {
    const { t } = useTranslation();
    return (
        <Card variant="default" padding="lg" hoverable={false} className="h-full">
            <div className="flex items-center gap-2 mb-4 text-secondary">
                <Sparkles className="w-4 h-4" />
                <h3 className="text-sm font-headline font-bold text-primary">{t('family.familyGuidance') || 'Family Guidance'}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AdviceCard icon={<MessageCircle className="w-3.5 h-3.5" />} label={t('family.guidanceCommunication') || 'Communication'} text={advice.communication_style} accent="text-sky-300" />
                <AdviceCard icon={<HandHeart className="w-3.5 h-3.5" />} label={t('family.guidanceBestSupport') || 'Best Support'} text={advice.best_support_method} accent="text-rose-300" />
                <AdviceCard icon={<Lock className="w-3.5 h-3.5" />} label={t('family.guidanceBoundaries') || 'Boundaries'} text={advice.boundaries_or_cautions} accent="text-amber-300" />
                <AdviceCard icon={<ArrowRight className="w-3.5 h-3.5" />} label={t('family.guidanceNextStep') || 'Next Step'} text={advice.next_step} accent="text-secondary" />
            </div>
        </Card>
    );
}

export function AdviceCard({
    icon, label, text, accent,
}: {
    icon: React.ReactNode;
    label: string;
    text: string;
    accent: string;
}) {
    if (!text?.trim()) return null;
    return (
        <div className="rounded-2xl border border-outline-variant/25 p-3 bg-surface-variant/10">
            <div className={`flex items-center gap-1.5 mb-1.5 ${accent}`}>
                {icon}
                <p className="text-[11px] font-bold">{label}</p>
            </div>
            <p className="text-[13px] text-on-surface-variant/90 leading-relaxed">{text}</p>
        </div>
    );
}

/** Factor Breakdown — a row per factor: name + sub-label, Impact pill, expand chevron
 *  revealing the summary/note. Score numbers are hidden until real per-factor scores
 *  are available. */
export function FactorsBreakdown({ factors }: { factors: FamilyCompatibilityFactor[] }) {
    const { t } = useTranslation();
    const [open, setOpen] = useState<Set<number>>(new Set());
    if (!factors?.length) return null;

    const toggle = (i: number) => setOpen((prev) => {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i); else next.add(i);
        return next;
    });

    const impactLabel = (status: string) => {
        switch (status) {
            case 'strength': return 'Strength';
            case 'tension': return 'Tension';
            default: return 'Balanced';
        }
    };

    return (
        <Card variant="default" padding="lg" hoverable={false}>
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-headline font-bold text-primary">{t('family.factorBreakdown') || 'Factor Breakdown'}</h3>
                <span className="text-[10px] text-on-surface-variant/70 font-bold">{factors.length}</span>
            </div>

            <div className="space-y-1.5">
                {factors.map((f, i) => {
                    const palette = statusPalette(f.status);
                    const isOpen = open.has(i);
                    const detail = f.summary || f.note || f.detail;
                    return (
                        <div key={f.name ?? f.key ?? i} className="rounded-2xl border border-outline-variant/20 bg-surface overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggle(i)}
                                className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left hover:bg-secondary/5 transition-colors"
                            >
                                {/* Factor name + sub-label */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${palette.bg} ${palette.border} ${palette.text}`}>
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[14px] font-bold text-primary truncate">
                                            {f.label || f.name || f.key || `Factor ${i + 1}`}
                                        </p>
                                        {detail && (
                                            <p className="text-[12px] text-on-surface-variant/75 truncate">{detail}</p>
                                        )}
                                    </div>
                                </div>
                                {/* Impact pill + chevron */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`inline-flex justify-center items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${palette.bg} ${palette.text} ${palette.border}`}>
                                        {impactLabel(f.status)}
                                    </span>
                                    {isOpen
                                        ? <ChevronUp className="w-4 h-4 text-on-surface-variant/70 shrink-0" />
                                        : <ChevronDown className="w-4 h-4 text-on-surface-variant/70 shrink-0" />}
                                </div>
                            </button>
                            {isOpen && detail && (
                                <div className="px-3 pb-3 pt-0 border-t border-outline-variant/15">
                                    <p className="mt-2 text-[13px] text-on-surface-variant/90 leading-relaxed">{detail}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

/* ====================================================================== */
/* Main report                                                            */
/* ====================================================================== */

export default function CompatibilityReport({
    you, them, data, totalCredits, onRerun: _onRerun, onViewFullReport: _onViewFullReport, askNaviHref, onEdit, onBack,
    cached, freeRerun, rerunLoading: _rerunLoading, slotBelowActions,
}: CompatibilityReportProps) {
    const { t } = useTranslation();
    const band = data.band || '';

    const hasStrengths = !!(data.strengths && data.strengths.length > 0);
    const hasTensions = !!(data.tension_points && data.tension_points.length > 0);
    const hasHighlights = hasStrengths || hasTensions;
    const hasAdvice = !!data.advice;

    return (
        <div className="space-y-6">
            <ReportHeader themName={them.name} onBack={onBack} />

            <ActionBar
                totalCredits={totalCredits}
                askNaviHref={askNaviHref}
                onEdit={onEdit}
                cached={cached}
                freeRerun={freeRerun}
            />

            {slotBelowActions}

            {/* YOU vs THEM hero */}
            <Card variant="default" padding="lg" hoverable={false}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-3">
                    <div className="flex-1 min-w-0">
                        <SubjectPanel subject={you} roleLabel={t('family.youLabel') || 'You'} align="left" />
                    </div>
                    <div className="flex items-center justify-center gap-3 lg:px-2 order-first lg:order-none">
                        <div className="hidden lg:block h-px w-10 bg-secondary/25" />
                        <HeroScore score={data.score} band={band} />
                        <div className="hidden lg:block h-px w-10 bg-secondary/25" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <SubjectPanel
                            subject={them}
                            roleLabel={them.relationshipLabel || (t('family.themLabel') || 'Them')}
                            align="right"
                        />
                    </div>
                </div>
                {data.verdict && (
                    <p className="mt-4 pt-4 border-t border-outline-variant/15 text-[13px] text-on-surface-variant/95 leading-relaxed whitespace-pre-line">
                        {data.verdict}
                    </p>
                )}
                {data.confidence?.note && (
                    <p className="mt-2 text-[11px] text-on-surface-variant/80 italic leading-relaxed border-l-2 border-outline-variant/30 pl-3">
                        {data.confidence.note}
                    </p>
                )}
            </Card>

            {/* Today / This Week / Long Term */}
            <TimeframeCards actions={data.relationship_actions} />

            {/* Strengths + Tensions / Guidance */}
            {(hasHighlights || hasAdvice) && (
                <div className="grid grid-cols-1 lg:grid-cols-5 items-stretch gap-4">
                    {hasHighlights && (
                        <div className={hasAdvice ? 'lg:col-span-3' : 'lg:col-span-5'}>
                            <Card variant="default" padding="md" hoverable={false} className="h-full">
                                <div className="grid h-full grid-cols-1 sm:grid-cols-2 items-stretch gap-4">
                                    <HighlightColumn
                                        title={t('family.topStrengths') || 'Top Strengths'}
                                        icon={<TrendingUp className="w-3.5 h-3.5" />}
                                        items={data.strengths}
                                        variant="strength"
                                    />
                                    <HighlightColumn
                                        title={t('family.tensionPoints') || 'Tension Points'}
                                        icon={<AlertTriangle className="w-3.5 h-3.5" />}
                                        items={data.tension_points}
                                        variant="tension"
                                    />
                                </div>
                            </Card>
                        </div>
                    )}
                    {hasAdvice && (
                        <div className={hasHighlights ? 'lg:col-span-2' : 'lg:col-span-5'}>
                            <GuidancePanel advice={data.advice!} />
                        </div>
                    )}
                </div>
            )}

            {/* Factor Breakdown */}
            {data.factors && data.factors.length > 0 && (
                <FactorsBreakdown factors={data.factors} />
            )}
        </div>
    );
}
