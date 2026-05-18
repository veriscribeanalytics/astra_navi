'use client';

import React from 'react';
import { Sparkles, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from '@/hooks';

interface InsightData {
  month?: string;
  date?: string;
  score: number;
  text: string;
  dominant_planet?: string;
  alerts?: (string | { simple: string; technical?: string })[];
  transits?: Record<string, { sign: string; house_from_lagna?: number }>;
}

export default function ForecastInsight({ data, colorHex }: { data: InsightData | null; colorHex: string }) {
  const { t } = useTranslation();
  if (!data) return null;

  const displayLabel = data.month
    ? new Date(data.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : data.date || '';

  return (
    <motion.div
      key={data.month || data.date}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-8 rounded-2xl sm:rounded-[32px] bg-surface/40 border border-white/5 shadow-xl"
    >
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <span className="text-[9px] sm:text-[11px] font-black text-secondary uppercase tracking-[0.2em] block mb-0.5">
            {t('horoscope.detailedInsight')}
          </span>
          <h4 className="text-lg sm:text-2xl font-headline font-bold text-foreground">{displayLabel}</h4>
        </div>
        {data.dominant_planet && (
          <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[7px] sm:text-[8px] font-bold text-foreground/30 uppercase">{t('horoscope.dominantForce')}</span>
              <span className="text-[10px] sm:text-xs font-bold text-foreground/80">{data.dominant_planet}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
          </div>
        )}
      </div>

      {data.text && (
        <p className="text-[14px] sm:text-base text-foreground/90 leading-relaxed font-medium mb-6">
          &ldquo;{data.text}&rdquo;
        </p>
      )}

      {data.alerts && data.alerts.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-surface-variant/10 border border-outline-variant/10">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-outline-variant/10">
            <Info className="w-3.5 h-3.5" style={{ color: colorHex }} />
            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Alerts</span>
          </div>
          <div className="space-y-2.5">
            {data.alerts.slice(0, 4).map((alert, i) => {
              const text = typeof alert === 'object' ? alert.simple : alert;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: colorHex }} />
                  <span className="text-[12px] text-foreground/60 leading-snug">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.transits && Object.keys(data.transits).length > 0 && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[9px] sm:text-[11px] font-black text-foreground/20 uppercase tracking-[0.3em] whitespace-nowrap">{t('horoscope.planetaryAlignment')}</span>
            <div className="h-[1px] w-full bg-white/5" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {Object.entries(data.transits).map(([planet, tObj]) => (
              <div key={planet} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="flex flex-col">
                  <span className="text-[8px] sm:text-[9px] font-black text-foreground/40 uppercase tracking-widest">{planet}</span>
                  <span className="text-[11px] sm:text-xs font-bold text-secondary">{tObj.sign}</span>
                </div>
                {tObj.house_from_lagna !== undefined && (
                  <div className="flex flex-col items-end">
                    <span className="text-[7px] font-bold text-foreground/20 uppercase">{t('horoscope.house')}</span>
                    <span className="text-[11px] font-headline font-bold text-foreground/60">{tObj.house_from_lagna}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
