'use client';

import React from 'react';
import { motion } from 'motion/react';
import type { MonthlyWeek } from '@/types/forecast';
import { useTranslation } from '@/hooks';
import { LOCALE_BY_LANGUAGE } from '@/locales';

interface MonthlyWeekCardsProps {
  weeks: MonthlyWeek[];
  colorHex: string;
  selectedWeekStart: string | null;
  onSelect: (startDate: string) => void;
}

function formatRange(start: string, end: string, language: string): string {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return `${start} – ${end}`;
  const localeStr = LOCALE_BY_LANGUAGE[language] || 'en-IN';
  const sameMonth = s.getMonth() === e.getMonth();
  const sm = s.toLocaleDateString(localeStr, { month: 'short' });
  const em = e.toLocaleDateString(localeStr, { month: 'short' });
  if (sameMonth) return `${sm} ${s.getDate()} – ${e.getDate()}`;
  return `${sm} ${s.getDate()} – ${em} ${e.getDate()}`;
}

export default function MonthlyWeekCards({ weeks, colorHex, selectedWeekStart, onSelect }: MonthlyWeekCardsProps) {
  const { t, language } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3 lg:gap-4">
      {weeks.map(week => {
        const isSelected = selectedWeekStart === week.start_date;
        const isHigh = week.score >= 75;
        const isLow = week.score <= 45;

        return (
          <motion.button
            key={week.start_date}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(week.start_date)}
            className={`relative flex flex-col items-start gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer text-left ${isSelected ? 'bg-surface shadow-lg' : 'bg-surface/30 border-white/5'}`}
            style={{
              borderColor: isSelected ? colorHex + '50' : undefined,
              boxShadow: isSelected ? `0 0 32px ${colorHex}25` : undefined,
            }}
          >
            <span
              className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider"
              style={{ color: isSelected ? colorHex : 'rgb(var(--color-foreground) / 0.3)' }}
            >
              {t('forecast.weekLabel').replace('{n}', String(week.week_index))}
            </span>
            <span className={`text-2xl sm:text-3xl font-headline font-bold ${isSelected ? 'text-foreground' : 'text-foreground/50'}`}>
              {week.score}
            </span>
            <div className="w-full h-1 sm:h-1.5 rounded-full overflow-hidden bg-white/5 relative">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${week.score}%` }}
                className="absolute inset-0 rounded-full"
                style={{ backgroundColor: isSelected ? colorHex : isHigh ? '#22c55e' : isLow ? '#ef4444' : '#94a3b840' }}
              />
            </div>
            <span className="text-[10px] sm:text-[11px] text-foreground/40 font-bold">
              {formatRange(week.start_date, week.end_date, language)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
