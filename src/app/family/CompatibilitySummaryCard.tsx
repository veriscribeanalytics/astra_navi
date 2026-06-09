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
        <div className="min-w-0">
            <div className={`flex items-center gap-1.5 mb-3 ${accent}`}>
                {icon}
                <p className="text-[11px] font-bold uppercase tracking-widest">{title}</p>
            </div>
            <ul className="space-y-2.5">
                {items.map((it, i) => (
                    <li key={i} className="flex items-start gap-2">
                        <RowIcon className={`w-4 h-4 shrink-0 mt-0.5 ${accent}`} />
                        <div className="min-w-0">
                            <p className="text-[13px] text-on-surface-variant/90 leading-snug">{it.factor}</p>
                            {it.text && it.text !== it.factor && (
                                <p className="text-[11px] text-on-surface-variant/60 leading-snug mt-0.5">{it.text}</p>
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
        <Card variant="default" padding="lg" hoverable={false}>
            {/* Header row — title + Free badge */}
            <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-secondary" />
                <h3 className="text-sm font-headline font-bold text-primary">
                    {t('family.summaryTitle') || 'Compatibility Summary'}
                </h3>
                <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2 py-0.5">
                    {t('family.summaryFreeBadge') || 'Free'}
                </span>
            </div>

            {/* YOU vs THEM hero — mirrors the paid report */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-6 lg:gap-4">
                <SubjectPanel subject={you} roleLabel={t('family.youLabel') || 'You'} align="left" />
                <div className="flex justify-center lg:px-6 lg:border-x lg:border-outline-variant/15">
                    <HeroScore score={summary.score} band={band} />
                </div>
                <SubjectPanel
                    subject={them}
                    roleLabel={them.relationshipLabel || (t('family.themLabel') || 'Them')}
                    align="right"
                />
            </div>

            {summary.verdict && (
                <p className="mt-5 pt-5 border-t border-outline-variant/15 text-[13px] text-on-surface-variant/85 leading-relaxed whitespace-pre-line">
                    {summary.verdict}
                </p>
            )}

            {/* Strengths + Tension points */}
            {hasHighlights && (
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
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
            <div className="mt-6 pt-5 border-t border-outline-variant/15 flex flex-wrap items-center gap-3">
                <Button
                    variant="primary"
                    onClick={onViewDetailed}
                    loading={detailedLoading}
                    leftIcon={<FileText className="w-4 h-4" />}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                    {t('family.viewDetailedReport') || 'View Detailed Report'}
                </Button>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-secondary/85 bg-secondary/10 border border-secondary/20 rounded-full px-2 py-1">
                    <Coins className="w-3 h-3" /> {(t('family.creditChipN') || '{n} credits').replace('{n}', String(creditCost))}
                </span>

                <div className="flex flex-wrap gap-2 items-center sm:ml-auto">
                    {langOptions.map((l) => (
                        <button
                            key={l.value}
                            type="button"
                            onClick={() => onLangChange(l.value)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border ${
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
