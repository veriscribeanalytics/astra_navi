'use client';

import React from 'react';
import { motion } from 'motion/react';
import type { MonthlyDay } from '@/types/forecast';
import { todayISO } from '@/utils/forecastError';
import { useTranslation } from '@/hooks';
import { ForecastArea } from '@/data/areaThemes';
import { getAreaPhaseMain } from '@/data/lifeAreaColors';

interface MonthlyDayGridProps {
  days: MonthlyDay[];
  colorHex: string;
  area: ForecastArea | 'overall';
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function jsWeekdayIndex(isoDate: string): number {
  const d = new Date(isoDate + 'T00:00:00');
  return d.getDay();
}

export default function MonthlyDayGrid({ days, colorHex, area, selectedDate, onSelect }: MonthlyDayGridProps) {
  const { t } = useTranslation();

  if (!days.length) return null;

  const today = todayISO();
  const leadingBlanks = jsWeekdayIndex(days[0].date);
  const trailingBlanks = 6 - jsWeekdayIndex(days[days.length - 1].date);

  return (
    <div className="flex flex-col gap-2">
      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 px-0.5">
        {WEEKDAY_KEYS.map((key, i) => (
          <div
            key={i}
            className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-center ${i === 0 || i === 6 ? 'text-foreground/45' : 'text-foreground/55'}`}
          >
            {t(`forecast.weekdays.${key}`)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <div key={`lead-${i}`} className="aspect-[4/3] sm:aspect-[1.25/1] rounded-lg sm:rounded-xl bg-surface border border-white/[0.04]" />
        ))}

        {days.map(day => {
          const isSelected = selectedDate === day.date;
          const isToday = day.date === today;
          const phaseColor = getAreaPhaseMain(area, day.score);
          const dayOfMonth = parseInt(day.date.slice(-2), 10) || day.date.slice(-2);
          let weekdayName = day.weekday;
          if (!weekdayName && day.date) {
            const dateObj = new Date(day.date + 'T00:00:00');
            const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            weekdayName = weekDays[dateObj.getDay()];
          }

          return (
            <motion.button
              key={day.date}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelect(day.date)}
              aria-label={t('forecast.ariaDay')
                .replace('{weekday}', weekdayName || '')
                .replace('{date}', day.date)
                .replace('{score}', String(day.score))}
              className={`relative flex flex-col items-center justify-between aspect-[4/3] sm:aspect-[1.25/1] py-1.5 sm:py-2 rounded-lg sm:rounded-xl border transition-all cursor-pointer overflow-hidden ${isSelected ? 'bg-surface shadow-lg' : 'bg-surface hover:bg-surface-variant/25 hover:border-white/15'}`}
              style={{
                borderColor: isSelected
                  ? colorHex + '90'
                  : isToday
                    ? colorHex + '70'
                    : 'rgba(255,255,255,0.08)',
                boxShadow: isSelected ? `0 0 20px ${colorHex}30, inset 0 0 0 1px ${colorHex}30` : undefined,
                backgroundColor: isSelected ? colorHex + '08' : isToday ? colorHex + '08' : undefined,
              }}
            >
              <div className="flex flex-col items-center leading-tight">
                <span
                  className={`text-xs sm:text-sm font-headline font-semibold leading-none ${isSelected ? 'text-foreground' : isToday ? '' : 'text-foreground/65'}`}
                  style={{ color: isToday && !isSelected ? colorHex : undefined }}
                >
                  {dayOfMonth}
                </span>
                {isToday && (
                  <span
                    className="text-[7px] sm:text-[8px] font-black uppercase tracking-wider mt-0.5"
                    style={{ color: colorHex }}
                  >
                    {t('forecast.today')}
                  </span>
                )}
              </div>
              <span
                className="text-[11px] sm:text-sm font-bold leading-none"
                style={{ color: isSelected ? colorHex : phaseColor }}
              >
                {day.score}
              </span>
              {/* Mini score bar at the bottom edge */}
              <div
                className="absolute bottom-0 left-0 h-[2px] rounded-full"
                style={{
                  width: `${Math.max(day.score, 6)}%`,
                  backgroundColor: isSelected ? colorHex : phaseColor + '80',
                }}
              />
            </motion.button>
          );
        })}

        {Array.from({ length: trailingBlanks }).map((_, i) => (
          <div key={`trail-${i}`} className="aspect-[4/3] sm:aspect-[1.25/1] rounded-lg sm:rounded-xl bg-surface border border-white/[0.04]" />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-1 px-1">
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorHex }} />
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-foreground/55">{t('forecast.today')}</span>
        </div>
      </div>
    </div>
  );
}
