'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface InsightData {
  month?: string;
  date?: string;
  score: number;
  text: string;
  dominant_planet?: string;
  alerts?: (string | { simple: string; technical?: string })[];
  transits?: Record<string, { sign: string; house_from_lagna?: number }>;
  mood?: string | { value: string; type: string };
  lucky_color?: string;
  lucky_number?: number;
  dominant_planet_meaning?: string;
  weekday?: string;
}

const SubHeader = ({ label, color }: { label: string; color: string }) => (
  <div className="flex items-center gap-3.5 mb-3">
    <span className="text-[10px] lg:text-[11px] 3xl:text-xs font-black uppercase tracking-[0.25em] text-foreground/60">
      {label}
    </span>
    <div className="h-[1px] flex-1 bg-white/5 relative">
      <div 
        className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full animate-pulse" 
        style={{ backgroundColor: color }}
      />
    </div>
  </div>
);

export default function ForecastInsight({ data, colorHex, isWide = false }: { data: InsightData | null; colorHex: string; isWide?: boolean }) {
  const { t } = useTranslation();
  if (!data) return null;

  const displayLabel = data.month
    ? new Date(data.month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : data.date || '';

  const hasRightColumn = data.mood || data.lucky_color || data.lucky_number != null || (data.transits && Object.keys(data.transits).length > 0);

  const leftColumnContent = (
    <div className="flex flex-col gap-6">
      {/* Main Forecast */}
      {data.text && (
        <div>
          <SubHeader label={t('forecast.mainForecast')} color={colorHex} />
          <p className="text-[14px] sm:text-base lg:text-lg text-foreground/90 leading-relaxed font-medium italic">
            &ldquo;{data.text}&rdquo;
          </p>
        </div>
      )}

      {/* What It Means */}
      {data.dominant_planet && (
        <div>
          <SubHeader label={t('forecast.whatItMeans')} color={colorHex} />
          <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
            {data.dominant_planet_meaning || t('forecast.whatItMeansBody')
              .replace('{planet}', data.dominant_planet || '')
              .replace('{score}', String(data.score))}
          </p>
        </div>
      )}

      {/* Alerts */}
      {data.alerts && data.alerts.length > 0 && (
        <div>
          <SubHeader label={t('forecast.alerts')} color={colorHex} />
          <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-2.5">
            {data.alerts.slice(0, 4).map((alert, i) => {
              const text = typeof alert === 'object' ? alert.simple : alert;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: colorHex }} />
                  <span className="text-[12px] text-foreground/85 leading-snug">{text}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const rightColumnContent = (
    <div className="flex flex-col gap-6">
      {/* Day Attributes: Mood, Lucky Color, Lucky Number */}
      {(data.mood || data.lucky_color || data.lucky_number != null) && (
        <div className="grid grid-cols-3 gap-3 border-t border-b border-white/5 py-4">
          {data.mood && (
            <div className="flex flex-col p-2.5 rounded-xl bg-white/[0.01] border border-white/5 text-center sm:text-left">
              <span className="text-[8px] sm:text-[9px] font-black text-foreground/45 uppercase tracking-wider">{t('forecast.mood')}</span>
              <span className="text-xs sm:text-sm font-bold text-foreground/85 mt-0.5 capitalize">
                {typeof data.mood === 'object' ? data.mood.value : data.mood}
              </span>
            </div>
          )}
          {data.lucky_color && (
            <div className="flex flex-col p-2.5 rounded-xl bg-white/[0.01] border border-white/5 text-center sm:text-left">
              <span className="text-[8px] sm:text-[9px] font-black text-foreground/45 uppercase tracking-wider">{t('forecast.luckyColor')}</span>
              <span className="text-xs sm:text-sm font-bold text-foreground/85 mt-0.5">{data.lucky_color}</span>
            </div>
          )}
          {data.lucky_number != null && (
            <div className="flex flex-col p-2.5 rounded-xl bg-white/[0.01] border border-white/5 text-center sm:text-left">
              <span className="text-[8px] sm:text-[9px] font-black text-foreground/45 uppercase tracking-wider">{t('forecast.luckyNumber')}</span>
              <span className="text-xs sm:text-sm font-bold text-foreground/85 mt-0.5">{data.lucky_number}</span>
            </div>
          )}
        </div>
      )}

      {/* Planet Reason */}
      {data.transits && Object.keys(data.transits).length > 0 && (
        <div>
          <SubHeader label={t('forecast.planetReason')} color={colorHex} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            {Object.entries(data.transits).map(([planet, tObj]) => (
              <div key={planet} className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors">
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
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Eyebrow and Title */}
      <div className="flex items-center justify-between pr-10">
        <div>
          <span className="text-[9px] sm:text-[11px] font-black text-secondary uppercase tracking-[0.2em] block mb-0.5 animate-pulse">
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
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center animate-pulse">
              <Sparkles className="w-4 h-4 text-secondary" />
            </div>
          </div>
        )}
      </div>

      {isWide && hasRightColumn ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          <div className="lg:col-span-7">
            {leftColumnContent}
          </div>
          <div className="lg:col-span-5">
            {rightColumnContent}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {leftColumnContent}
          {rightColumnContent}
        </div>
      )}
    </div>
  );
}
