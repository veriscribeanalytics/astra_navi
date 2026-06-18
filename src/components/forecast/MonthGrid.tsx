'use client';

import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from '@/hooks';
import { ForecastArea } from '@/data/areaThemes';
import { getAreaPhaseMain } from '@/data/lifeAreaColors';

export interface MonthData {
  month: string;
  score: number;
  is_current?: boolean;
  text?: string;
  alerts?: unknown[];
  transits?: Record<string, unknown>;
}

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export default function MonthGrid({ months, colorHex, area, selectedMonth, onSelect }: {
  months: MonthData[];
  colorHex: string;
  area: ForecastArea;
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
        const phaseColor = getAreaPhaseMain(area, m.score);

        return (
          <motion.button
            key={m.month}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(m.month)}
            className={`relative flex flex-col items-center p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer ${isSelected ? 'bg-surface shadow-lg' : 'bg-surface border-white/5 hover:bg-surface-variant/25'}`}
            style={{ 
              borderColor: isSelected ? colorHex + '50' : phaseColor + '25',
              boxShadow: isSelected ? `0 0 16px ${colorHex}20` : `0 0 8px ${phaseColor}10`
            }}
          >
            <span 
              className={`text-[9px] sm:text-[10px] lg:text-[11px] 3xl:text-xs font-black uppercase tracking-wider mb-1 ${isSelected ? '' : 'text-foreground/30'}`} 
              style={{ color: isSelected ? colorHex : undefined }}
            >
              {label}
            </span>
            <span className={`text-lg sm:text-2xl lg:text-3xl font-headline font-bold mb-1.5 ${isSelected ? 'text-foreground font-black' : ''}`}
              style={{ color: isSelected ? undefined : phaseColor }}
            >
              {m.score}
            </span>
            <div className="w-full h-1 sm:h-1.5 rounded-full overflow-hidden bg-white/5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${m.score}%` }}
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: isSelected ? colorHex : phaseColor }}
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
