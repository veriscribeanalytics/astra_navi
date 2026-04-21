'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DoshaStatus {
  hasDosha: boolean;
  isCancelled: boolean;
  cancellationReason?: string;
  severity: 'none' | 'low' | 'medium' | 'high';
}

interface MangalDoshaPanelProps {
  person1: DoshaStatus & { name: string };
  person2: DoshaStatus & { name: string };
  verdict: string;
  isCompatible: boolean;
}

export default function MangalDoshaPanel({ person1, person2, verdict, isCompatible }: MangalDoshaPanelProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-orange-500 bg-orange-500/10';
      case 'low': return 'text-amber-500 bg-amber-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  const getStatusBadge = (status: DoshaStatus) => {
    if (status.isCancelled) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold uppercase tracking-wider">
          <ShieldCheck size={12} />
          Cancelled
        </div>
      );
    }
    if (status.hasDosha) {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider">
          <ShieldAlert size={12} />
          Present
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-bold uppercase tracking-wider">
        <CheckCircle2 size={12} />
        Absent
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl border border-outline-variant/20 bg-surface/30 backdrop-blur-md overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-outline-variant/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
          <AlertTriangle className="text-secondary" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-headline font-bold text-foreground">
            Mangal Dosha Analysis
          </h3>
          <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-[0.2em]">
            Mars Compatibility Check
          </p>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Person 1 */}
          <div className="p-4 rounded-2xl bg-surface/40 border border-outline-variant/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">{person1.name}</span>
              {getStatusBadge(person1)}
            </div>
            {person1.hasDosha && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-foreground/30 font-bold uppercase tracking-widest">Severity</span>
                  <span className={`font-bold uppercase tracking-widest ${getSeverityColor(person1.severity).split(' ')[0]}`}>
                    {person1.severity}
                  </span>
                </div>
                {person1.isCancelled && person1.cancellationReason && (
                  <p className="text-[11px] text-blue-400 italic leading-snug">
                    {person1.cancellationReason}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Person 2 */}
          <div className="p-4 rounded-2xl bg-surface/40 border border-outline-variant/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground/40 uppercase tracking-widest">{person2.name}</span>
              {getStatusBadge(person2)}
            </div>
            {person2.hasDosha && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-foreground/30 font-bold uppercase tracking-widest">Severity</span>
                  <span className={`font-bold uppercase tracking-widest ${getSeverityColor(person2.severity).split(' ')[0]}`}>
                    {person2.severity}
                  </span>
                </div>
                {person2.isCancelled && person2.cancellationReason && (
                  <p className="text-[11px] text-blue-400 italic leading-snug">
                    {person2.cancellationReason}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Verdict */}
        <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
          isCompatible ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
        }`}>
          <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
            isCompatible ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {isCompatible ? <CheckCircle2 size={24} /> : <ShieldAlert size={24} />}
          </div>
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-widest mb-1 ${
              isCompatible ? 'text-green-500' : 'text-red-500'
            }`}>
              Compatibility Verdict
            </h4>
            <p className="text-sm text-foreground/80 leading-relaxed font-body">
              {verdict}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
