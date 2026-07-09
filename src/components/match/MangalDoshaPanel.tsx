'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface DoshaStatus {
  hasDosha: boolean;
  isCancelled: boolean;
  cancellationReason?: string | { technical: string; simple: string };
  severity: 'none' | 'low' | 'medium' | 'high';
}

interface MangalDoshaPanelProps {
  person1: DoshaStatus & { name: string };
  person2: DoshaStatus & { name: string };
  verdict: string | { technical: string; simple: string };
  isCompatible: boolean;
}

const SEVERITY_RANK: Record<string, number> = { none: 0, low: 1, medium: 2, high: 3 };

export default function MangalDoshaPanel({ person1, person2, verdict, isCompatible }: MangalDoshaPanelProps) {
  const { t } = useTranslation();

  // Only treat as a hard issue when at least one chart has a HIGH-severity
  // (uncancelled) dosha. A cancelled / absent pair is a *caution*, not a
  // rejection — so we frame it with amber rather than red.
  const severe =
    SEVERITY_RANK[person1.severity] >= SEVERITY_RANK.high ||
    SEVERITY_RANK[person2.severity] >= SEVERITY_RANK.high;
  const tone = isCompatible ? 'green' : severe ? 'red' : 'amber';

  const toneStyles = {
    green: {
      wrap: 'bg-green-500/5 border-green-500/20',
      icon: 'bg-green-500/10 text-green-500',
      label: 'text-green-500',
    },
    amber: {
      wrap: 'bg-amber-500/5 border-amber-500/20',
      icon: 'bg-amber-500/10 text-amber-500',
      label: 'text-amber-500',
    },
    red: {
      wrap: 'bg-red-500/5 border-red-500/20',
      icon: 'bg-red-500/10 text-red-500',
      label: 'text-red-500',
    },
  }[tone];

  const verdictLabel = isCompatible ? t('match.mangal.compatible') : severe ? t('match.mangal.important') : t('match.mangal.needsAttention');
  const verdictIcon = isCompatible ? <CheckCircle2 size={20} /> : severe ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />;

  const getStatusBadge = (status: DoshaStatus) => {
    if (status.isCancelled) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck size={12} />
          {t('match.mangal.cancelled')}
        </div>
      );
    }
    if (status.hasDosha) {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
          <ShieldAlert size={12} />
          {t('match.mangal.present')}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase tracking-wider">
        <CheckCircle2 size={12} />
        {t('match.mangal.absent')}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl border border-outline-variant/20 bg-surface overflow-hidden"
    >
      <div className="p-4 sm:p-5 border-b border-outline-variant/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
          <AlertTriangle className="text-secondary" size={18} />
        </div>
        <div>
          <h3 className="text-base font-headline font-bold text-foreground">
            {t('match.mangal.title')}
          </h3>
          <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-[0.2em]">
            {t('match.mangal.subtitle')}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Person 1 */}
          <div className="p-3 rounded-2xl bg-surface border border-outline-variant/10 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest truncate">{person1.name}</span>
              {getStatusBadge(person1)}
            </div>
            {person1.hasDosha && !person1.isCancelled && (
              <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
                <Info size={10} className="text-amber-500/60" />
                {t('match.mangal.severityLevels.' + person1.severity)}
              </div>
            )}
            {person1.isCancelled && person1.cancellationReason && (
              <p className="text-[11px] text-blue-400/80 italic leading-snug line-clamp-2">
                {typeof person1.cancellationReason === 'object' ? person1.cancellationReason.simple : person1.cancellationReason}
              </p>
            )}
          </div>

          {/* Person 2 */}
          <div className="p-3 rounded-2xl bg-surface border border-outline-variant/10 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest truncate">{person2.name}</span>
              {getStatusBadge(person2)}
            </div>
            {person2.hasDosha && !person2.isCancelled && (
              <div className="flex items-center gap-1.5 text-[10px] text-foreground/40">
                <Info size={10} className="text-amber-500/60" />
                {t('match.mangal.severityLevels.' + person2.severity)}
              </div>
            )}
            {person2.isCancelled && person2.cancellationReason && (
              <p className="text-[11px] text-blue-400/80 italic leading-snug line-clamp-2">
                {typeof person2.cancellationReason === 'object' ? person2.cancellationReason.simple : person2.cancellationReason}
              </p>
            )}
          </div>
        </div>

        {/* Verdict */}
        <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${toneStyles.wrap}`}>
          <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${toneStyles.icon}`}>
            {verdictIcon}
          </div>
          <div className="min-w-0">
            <h4 className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${toneStyles.label}`}>
              {verdictLabel}
            </h4>
            <p className="text-[13px] text-foreground/80 leading-relaxed font-body">
              {typeof verdict === 'object' ? verdict.simple : verdict}
            </p>
            {typeof verdict === 'object' && verdict.technical && (
              <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-widest mt-1">
                {verdict.technical}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
