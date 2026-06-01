'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from '@/hooks';

export interface MonthData {
  month: string;
  score: number;
  is_current?: boolean;
  text?: string;
  alerts?: unknown[];
  transits?: Record<string, unknown>;
}

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export default function MonthGrid({ months, colorHex, selectedMonth, onSelect }: {
  months: MonthData[];
  colorHex: string;
  selectedMonth: string | null;
  onSelect: (month: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 sm:gap-3 lg:gap-4">
      {months.map((m) => {
        const date = new Date(m.month + '-01');
        const monthIdx = date.getMonth();
        const label = t(`forecast.monthsShort.${MONTH_KEYS[monthIdx]}`) || m.month.slice(5);
        const isSelected = selectedMonth === m.month;
        const isHigh = m.score >= 75;
        const isLow = m.score <= 45;

        return (
          <motion.button
            key={m.month}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(m.month)}
            className={`relative flex flex-col items-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer ${isSelected ? 'bg-surface shadow-lg' : 'bg-surface/30 border-white/5'}`}
            style={{ 
              borderColor: isSelected ? colorHex + '50' : undefined,
              boxShadow: isSelected ? `0 0 16px ${colorHex}20` : undefined
            }}
          >
            <span 
              className={`text-[9px] sm:text-[10px] lg:text-[11px] 3xl:text-xs font-black uppercase tracking-wider mb-1 ${isSelected ? '' : 'text-foreground/30'}`} 
              style={{ color: isSelected ? colorHex : undefined }}
            >
              {label}
            </span>
            <span className={`text-lg sm:text-2xl lg:text-3xl font-headline font-bold mb-1.5 ${isSelected ? 'text-foreground font-black' : 'text-foreground/40'}`}>
              {m.score}
            </span>
            <div className="w-full h-1 sm:h-1.5 rounded-full overflow-hidden bg-white/5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${m.score}%` }}
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: isSelected ? colorHex : (isHigh ? '#22c55e' : isLow ? '#ef4444' : '#94a3b840') }}
              />
            </div>
            {m.is_current && (
              <div 
                className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-surface bg-secondary shadow-sm animate-pulse" 
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
