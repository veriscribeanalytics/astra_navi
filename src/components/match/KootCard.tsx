'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface KootCardProps {
  name: string;
  sanskritName: string;
  meaning: string;
  obtained: number;
  max: number;
  detail: string | { technical: string; simple: string };
  delay?: number;
}

export default function KootCard({
  name, sanskritName, meaning, obtained, max, detail, delay = 0,
}: KootCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const ratio = max > 0 ? obtained / max : 0;
  const percentage = ratio * 100;

  const isObject = typeof detail === 'object' && detail !== null;
  const simpleText = isObject ? detail.simple : detail;
  const techText = isObject ? detail.technical : null;

  const status = percentage >= 75 ? 'Strong' : percentage >= 50 ? 'Average' : 'Weak';
  const statusColor =
    percentage >= 75 ? 'text-green-500' : percentage >= 50 ? 'text-amber-500' : 'text-red-500';
  const barColor =
    percentage >= 75 ? 'bg-green-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const pillColor =
    percentage >= 75
      ? 'text-green-500 border-green-500/20 bg-green-500/5'
      : percentage >= 50
        ? 'text-amber-500 border-amber-500/20 bg-amber-500/5'
        : 'text-red-500 border-red-500/20 bg-red-500/5';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`rounded-2xl border bg-surface transition-all duration-300 overflow-hidden ${
        isExpanded ? 'border-outline-variant/30 shadow-md' : 'border-outline-variant/10 hover:border-outline-variant/25'
      }`}
    >
      <div
        className="p-4 sm:p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-headline font-bold text-foreground leading-tight">
              {name}
            </h3>
            <p className="mt-0.5 text-[11px] font-bold text-foreground/35 uppercase tracking-wider">
              {sanskritName} <span className="text-foreground/20">·</span>{' '}
              <span className={statusColor}>{status}</span>
            </p>
          </div>
          <div className={`shrink-0 px-2.5 py-1 rounded-lg border text-xs font-bold ${pillColor}`}>
            {obtained}/{max}
          </div>
        </div>

        <p className="mt-2.5 text-[12px] text-foreground/55 leading-snug font-body line-clamp-2">
          {meaning}
        </p>

        <div className="mt-3 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: delay + 0.2, duration: 0.8, ease: 'easeOut' as const }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>

        <div className="mt-2 flex justify-end">
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-foreground/30"
          >
            <ChevronDown size={16} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-outline-variant/10 mt-1 flex flex-col gap-2">
              <p className="text-sm text-foreground/70 leading-relaxed font-body">
                {simpleText}
              </p>
              {techText && (
                <p className="text-[10px] text-foreground/25 font-bold uppercase tracking-widest mt-1">
                  {techText}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
