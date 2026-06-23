'use client';

import React from 'react';
import {
    Heart, Coins, FileText, TrendingUp, AlertTriangle, CheckCircle2, AlertCircle, ArrowRight,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/hooks';
import { HeroScore, SubjectPanel, type ReportSubject } from '@/app/family/CompatibilityReport';
import type { CompatibilityLang, FamilyCompatibilitySummary, FamilyCompatibilityHighlight } from '@/types/family';

export interface CompatibilitySummaryCardProps {
    you: ReportSubject;
    them: ReportSubject;
    summary: FamilyCompatibilitySummary;
    /** Credits the detailed report will cost — shown on the CTA chip. */
    creditCost: number;
    onViewDetailed: () => void;
    detailedLoading: boolean;
    lang: CompatibilityLang;
    onLangChange: (l: CompatibilityLang) => void;
    langOptions: { value: CompatibilityLang; label: string }[];
    /** Connection-only chrome (e.g. SHARING_REQUIRED gate). */
    slotBelow?: React.ReactNode;
}

/** Free compatibility summary — the default view before the paid report.
 *  Reuses the report's HeroScore + SubjectPanel so it reads as the same surface. */
function HighlightList({
    title, icon, items, variant,
}: {
    title: string;
    icon: React.ReactNode;
    items: FamilyCompatibilityHighlight[];
    variant: 'strength' | 'tension';
}) {
    if (!items || items.length === 0) return null;
    const isStrength = variant === 'strength';
    const accent = isStrength ? 'text-emerald-400' : 'text-orange-400';
    const RowIcon = isStrength ? CheckCircle2 : AlertCircle;
    return (
        <div className="rounded-2xl border border-outline-variant/15 bg-surface-variant/20 p-4">
            <div className={`flex items-center gap-1.5 mb-2.5 ${accent}`}>
                {icon}
                <p className="text-[11px] font-bold uppercase tracking-widest">{title}</p>
            </div>
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
        </div>
    );
}

export default function CompatibilitySummaryCard({
    you, them, summary, creditCost, onViewDetailed, detailedLoading,
    lang, onLangChange, langOptions, slotBelow,
}: CompatibilitySummaryCardProps) {
    const { t } = useTranslation();
    const band = summary.band || '';
    const hasStrengths = !!(summary.strengths && summary.strengths.length > 0);
    const hasTensions = !!(summary.tension_points && summary.tension_points.length > 0);
    const hasHighlights = hasStrengths || hasTensions;

    return (
        <Card variant="default" padding="md" hoverable={false}>
            {/* Header row — title + Free badge */}
            <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-headline font-bold text-primary">
                    {t('family.summaryTitle') || 'Compatibility Summary'}
                </h3>
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    {t('family.summaryFreeBadge') || 'Free Summary'}
                </span>
            </div>

            {/* YOU vs THEM hero — tighter and visually connected */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-3">
                <div className="flex-1 min-w-0">
                    <SubjectPanel subject={you} roleLabel={t('family.youLabel') || 'You'} align="left" />
                </div>
                <div className="flex items-center justify-center gap-3 lg:px-2 order-first lg:order-none">
                    <div className="hidden lg:block h-px w-10 bg-secondary/25" />
                    <HeroScore score={summary.score} band={band} />
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

            {summary.verdict && (
                <p className="mt-4 pt-4 border-t border-outline-variant/15 text-[13px] text-on-surface-variant/95 leading-relaxed whitespace-pre-line">
                    {summary.verdict}
                </p>
            )}

            {/* Strengths + Tension points */}
            {hasHighlights && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <HighlightList
                        title={t('family.topStrengths') || 'Top Strengths'}
                        icon={<TrendingUp className="w-3.5 h-3.5" />}
                        items={summary.strengths}
                        variant="strength"
                    />
                    <HighlightList
                        title={t('family.tensionPoints') || 'Tension Points'}
                        icon={<AlertTriangle className="w-3.5 h-3.5" />}
                        items={summary.tension_points}
                        variant="tension"
                    />
                </div>
            )}

            {slotBelow}

            {/* CTA — view detailed (paid) report + language picker */}
            <div className="mt-4 pt-4 border-t border-outline-variant/15 flex flex-wrap items-end gap-3">
                <div className="flex flex-col items-start gap-1.5">
                    <Button
                        variant="primary"
                        onClick={onViewDetailed}
                        loading={detailedLoading}
                        leftIcon={<FileText className="w-4 h-4" />}
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                        {t('family.viewDetailedReport') || 'View Detailed Report'}
                    </Button>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary/90 bg-secondary/10 border border-secondary/20 rounded-full px-2 py-0.5">
                        <Coins className="w-3 h-3" />
                        {(t('family.detailedReportCredits') || 'Detailed report · {n} credits').replace('{n}', String(creditCost))}
                    </span>
                </div>

                <div className="flex flex-wrap gap-2 items-center sm:ml-auto">
                    <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-bold mr-1">{t('family.readIn') || 'Read in'}</span>
                    {langOptions.map((l) => (
                        <button
                            key={l.value}
                            type="button"
                            onClick={() => onLangChange(l.value)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                                lang === l.value
                                    ? 'bg-secondary text-white border-secondary'
                                    : 'bg-secondary/5 text-secondary border-secondary/20 hover:bg-secondary/10'
                            }`}
                        >
                            {l.label}
                        </button>
                    ))}
                </div>
            </div>
        </Card>
    );
}
