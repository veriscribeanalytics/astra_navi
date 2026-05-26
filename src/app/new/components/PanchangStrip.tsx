'use client';

import React from 'react';
import { Moon, Calendar, Star, Sparkles, Gem, AlertTriangle } from 'lucide-react';
import Card from '@/components/ui/Card';
import { useTranslation } from '@/hooks';
import type { TransitsTodayData } from '@/hooks/useTransitsToday';

interface Props {
  transits: TransitsTodayData | null;
  loading: boolean;
}

export default function PanchangStrip({ transits, loading }: Props) {
  const { t } = useTranslation();

  if (loading || !transits) {
    return (
      <Card padding="md" className="!rounded-[24px]">
        <div className="space-y-3 animate-pulse">
          <div className="h-4 bg-surface-variant/30 rounded w-1/4" />
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-nowrap">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-[72px] w-[90px] shrink-0 bg-surface-variant/30 rounded-xl" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  const p = transits.panchanga;

  // Format Rahu Kaal compactly (e.g. "8:00 AM - 9:30 AM" to "8-9:30 AM")
  const formatRahuKaal = (): string => {
    if (!p.rahukaal || !p.rahukaal.start) return '—';
    try {
      const cleanTime = (tStr: string) => {
        // e.g. "08:30 AM" -> "8:30 AM", "09:00 AM" -> "9 AM"
        const [time, amp] = tStr.split(' ');
        const [hr, min] = time.split(':');
        const hrNum = parseInt(hr, 10);
        const minNum = parseInt(min, 10);
        const minPart = minNum > 0 ? `:${min}` : '';
        return `${hrNum}${minPart} ${amp}`;
      };

      const startF = cleanTime(p.rahukaal.start);
      const endF = cleanTime(p.rahukaal.end);
      
      // If both are same AM/PM, combine: "8 - 9:30 AM"
      const startAmp = startF.split(' ')[1];
      const endAmp = endF.split(' ')[1];
      const startVal = startF.split(' ')[0];
      
      if (startAmp === endAmp) {
        return `${startVal}-${endF}`;
      }
      return `${startF}-${endF}`;
    } catch (e) {
      return `${p.rahukaal.start}-${p.rahukaal.end}`;
    }
  };

  const panchangChips = [
    {
      key: 'tithi',
      icon: <Moon className="w-4 h-4 text-secondary fill-secondary/20" />,
      label: t('newDashboard.panchang.tithi'),
      value: p.tithi || '—'
    },
    {
      key: 'vara',
      icon: <Calendar className="w-4 h-4 text-orange-400" />,
      label: t('newDashboard.panchang.vara'),
      value: p.vara || '—'
    },
    {
      key: 'nakshatra',
      icon: <Star className="w-4 h-4 text-green-400 fill-green-400/20" />,
      label: t('newDashboard.panchang.nakshatra'),
      value: p.nakshatra || '—'
    },
    {
      key: 'yoga',
      icon: <Sparkles className="w-4 h-4 text-violet-400" />,
      label: t('newDashboard.panchang.yoga'),
      value: p.yoga || '—'
    },
    {
      key: 'karana',
      icon: <Gem className="w-4 h-4 text-pink-400" />,
      label: t('newDashboard.panchang.karana'),
      value: p.karana || '—'
    },
    {
      key: 'rahuKaal',
      icon: <AlertTriangle className="w-4 h-4 text-amber-500 fill-amber-500/10" />,
      label: t('newDashboard.panchang.rahuKaal'),
      value: formatRahuKaal()
    }
  ];

  return (
    <div className="space-y-3">
      {/* Header */}
      <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-foreground">
        {t('newDashboard.panchang.title')}
      </span>

      {/* Responsive Grid layout for even spacing */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5 w-full">
        {panchangChips.map(chip => (
          <div
            key={chip.key}
            className="w-full h-[76px] border border-outline-variant/20 rounded-xl bg-surface p-2 flex flex-col justify-between items-center text-center hover:border-secondary/20 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-surface-variant/30 shrink-0">
              {chip.icon}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-foreground/45 truncate w-full">
              {chip.label}
            </div>
            <div className="text-[11px] font-headline font-bold text-foreground truncate w-full leading-tight">
              {chip.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
