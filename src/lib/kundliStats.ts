import type { AstrologyData, DashaPeriod } from '@/types/horoscope';

export interface KundliStats {
  lagnaSign?: string;
  nakshatra?: string;
  nakshatraLord?: string;
  activeDasha?: string;
  dashaRemaining?: string;
  moonPhase?: string;
  mahaPlanet?: string;
  mahaStart?: string;
  mahaEnd?: string;
  antaPlanet?: string;
  antaStart?: string;
  antaEnd?: string;
}

export function parseKundliStats(raw: unknown): KundliStats | null {
  if (!raw) return null;
  try {
    const data: AstrologyData = typeof raw === 'string' ? JSON.parse(raw) : (raw as AstrologyData);
    const stats: KundliStats = {};

    const houses = data.houses || data.chart?.houses;
    if (Array.isArray(houses)) {
      stats.lagnaSign = houses.find((h) => h.house === 1)?.sign;
    }

    const nak = data.nakshatra;
    stats.nakshatra = typeof nak === 'object' && nak !== null ? (nak.value || nak.name) : nak;
    if (stats.nakshatra && typeof stats.nakshatra !== 'string') stats.nakshatra = String(stats.nakshatra);

    const lord = data.nakshatraLord;
    stats.nakshatraLord = typeof lord === 'object' && lord !== null ? (lord.value || lord.name) : lord;
    if (stats.nakshatraLord && typeof stats.nakshatraLord !== 'string') stats.nakshatraLord = String(stats.nakshatraLord);

    const moonPhase = typeof data.moonPhase === 'object' ? data.moonPhase?.value : data.moonPhase;
    if (typeof moonPhase === 'string') stats.moonPhase = moonPhase;

    const dasha = data.dasha || data.planetary?.active_dasha;
    if (dasha) {
      if (typeof dasha === 'string') {
        stats.activeDasha = dasha;
        const parts = dasha.split('-');
        if (parts.length > 0) stats.mahaPlanet = parts[0];
        if (parts.length > 1) stats.antaPlanet = parts[1];
      } else {
        let active = dasha.active;
        
        // Fallback: parse raw nested current structure
        if ((!active || !active.length) && dasha.current && typeof dasha.current === 'object') {
          const rawCurrent = dasha.current as unknown as Record<string, Record<string, unknown>>;
          const activeArr: DashaPeriod[] = [];
          if (rawCurrent.mahadasha) {
            const md = rawCurrent.mahadasha;
            activeArr.push({
              type: 'Mahadasha',
              planet: (md.planet as string) || '',
              start: (md.start as string) || '',
              end: (md.end_date as string) || (md.end as string) || ''
            });
          }
          if (rawCurrent.antardasha) {
            const ad = rawCurrent.antardasha;
            activeArr.push({
              type: 'Antardasha',
              planet: (ad.planet as string) || '',
              start: (ad.start as string) || '',
              end: (ad.end_date as string) || (ad.end as string) || ''
            });
          }
          active = activeArr;
        }

        if (Array.isArray(active) && active.length > 0) {
          const maha = active.find((p) => p.type === 'Mahadasha');
          const anta = active.find((p) => p.type === 'Antardasha');
          
          if (maha) {
            stats.mahaPlanet = maha.planet;
            stats.mahaStart = maha.start;
            stats.mahaEnd = maha.end_date || maha.end;
          }
          if (anta) {
            stats.antaPlanet = anta.planet;
            stats.antaStart = anta.start;
            stats.antaEnd = anta.end_date || anta.end;
          }
        }

        let dashaName = dasha.currentMahaDasha || dasha.current || dasha.value;
        let dashaRemaining = dasha.remaining;

        if ((!dashaName || typeof dashaName === 'object') && Array.isArray(active) && active.length > 0) {
          const maha = active.find((p) => p.type === 'Mahadasha') || active[0];
          const anta = active.find((p) => p.type === 'Antardasha');
          dashaName = anta ? `${maha.planet}-${anta.planet}` : maha.planet;
          
          if (!dashaRemaining && (maha.end || maha.end_date)) {
            const end = new Date(maha.end || maha.end_date!);
            const now = new Date();
            const remDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
            dashaRemaining = remDays > 365 ? `${(remDays / 365).toFixed(1)} years` : `${remDays} days`;
          }
        }

        // If after checking active array, we still don't have mahaPlanet or antaPlanet, try splitting dashaName if it is a string
        if (typeof dashaName === 'string') {
          const parts = dashaName.split('-');
          if (!stats.mahaPlanet && parts.length > 0) stats.mahaPlanet = parts[0];
          if (!stats.antaPlanet && parts.length > 1) stats.antaPlanet = parts[1];
        } else if (dashaName && typeof dashaName === 'object') {
          const rawObj = dashaName as Record<string, unknown>;
          const planetVal = (rawObj.planet as string) || (rawObj.name as string) || (rawObj.value as string);
          if (planetVal) {
            const parts = planetVal.split('-');
            if (!stats.mahaPlanet && parts.length > 0) stats.mahaPlanet = parts[0];
            if (!stats.antaPlanet && parts.length > 1) stats.antaPlanet = parts[1];
          }
        }

        stats.activeDasha = typeof dashaName === 'string' ? dashaName : (dashaName && typeof dashaName === 'object' ? ((dashaName as Record<string, unknown>).planet as string) : undefined);
        stats.dashaRemaining = dashaRemaining;
      }
    }

    return Object.keys(stats).length ? stats : null;
  } catch (e) {
    console.error('Failed to parse kundli stats', e);
    return null;
  }
}
