'use client';

import React from 'react';
import type { WeeklyDay } from '@/types/forecast';
import { todayISO } from '@/utils/forecastError';
import { useTranslation } from '@/hooks';

interface WeekStripProps {
  days: WeeklyDay[];
  colorHex: string;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

export default function WeekStrip({ days, colorHex, selectedDate, onSelect }: WeekStripProps) {
  const { t } = useTranslation();
  const today = todayISO();
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-3">
      {days.map(day => {
        const isSelected = selectedDate === day.date;
        const isToday = day.date === today;
        let weekdayKey = (day.weekday || '').slice(0, 3).toLowerCase();
        if (!weekdayKey && day.date) {
          const dateObj = new Date(day.date + 'T00:00:00');
          const weekDays = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          weekdayKey = weekDays[dateObj.getDay()];
        }
        const weekdayShort = t(`forecast.weekdays.${weekdayKey}`).toUpperCase();
        const dayOfMonth = parseInt(day.date.slice(-2), 10) || day.date.slice(-2);

        return (
          <button
            key={day.date}
            onClick={() => onSelect(day.date)}
            className={`flex flex-col items-center p-1.5 sm:p-3 lg:scale-110 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-surface shadow-lg' : 'bg-surface border-white/5 hover:bg-surface-variant/25'}`}
            style={{
              borderColor: isSelected ? colorHex + '50' : undefined,
              boxShadow: isSelected ? `0 0 32px ${colorHex}25` : undefined,
            }}
          >
            <span
              className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-wider ${isSelected ? '' : 'text-foreground/30'}`}
              style={{ color: isSelected ? colorHex : undefined }}
            >
              {isToday ? t('forecast.todayShort').toUpperCase() : weekdayShort}
            </span>
            <span className={`text-base sm:text-xl lg:text-2xl 3xl:text-3xl font-headline font-bold ${isSelected ? 'text-foreground' : 'text-foreground/40'}`}>
              {dayOfMonth}
            </span>
            <span className="text-[8px] font-bold text-foreground/30">{day.score}</span>
          </button>
        );
      })}
    </div>
  );
}
