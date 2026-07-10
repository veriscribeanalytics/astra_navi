import { useState, useEffect, useCallback, useRef } from 'react';
import { clientFetch } from '@/lib/apiClient';
import { useTranslation } from './useTranslation';
import type { HoroscopeData } from '@/types/horoscope';

interface Options {
  sign?: string;
  isGeneral?: boolean;
}

// The daily horoscope flips at 00:00 and 18:00 IST (evening reading). IST is a
// fixed UTC+5:30 offset with no DST, so we derive the boundary by shifting the
// epoch and reading UTC fields — never from device-local time.
const IST_OFFSET_MS = 330 * 60 * 1000;

/** Stable key for the current IST date + daypart, e.g. "2026-07-10:pm". */
function istDaypartKey(nowMs: number): string {
  const ist = new Date(nowMs + IST_OFFSET_MS);
  const date = ist.toISOString().slice(0, 10); // IST wall-clock date
  const daypart = ist.getUTCHours() >= 18 ? 'pm' : 'am';
  return `${date}:${daypart}`;
}

/** Epoch ms of the next 00:00 or 18:00 IST boundary strictly after nowMs. */
function nextBoundaryMs(nowMs: number): number {
  const ist = new Date(nowMs + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const d = ist.getUTCDate();
  const boundaryIstMs = ist.getUTCHours() < 18
    ? Date.UTC(y, m, d, 18, 0, 0)     // today 18:00 IST
    : Date.UTC(y, m, d + 1, 0, 0, 0); // next midnight IST
  return boundaryIstMs - IST_OFFSET_MS;
}

export function useDailyHoroscope({ sign, isGeneral }: Options = {}) {
  const { language } = useTranslation();
  const [data, setData] = useState<HoroscopeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileLocationRequired, setProfileLocationRequired] = useState(false);
  const lastUrlRef = useRef('');
  // Daypart in effect at the last successful fetch; drives boundary refetch.
  const daypartRef = useRef(istDaypartKey(Date.now()));

  const fetchData = useCallback(async (force = false) => {
    const params = new URLSearchParams();
    if (sign) params.set('sign', sign);
    params.set('lang', language);
    const url = (isGeneral ? '/api/horoscope-general?' : '/api/daily-horoscope?') + params.toString();
    if (!force && url === lastUrlRef.current && data) return;
    lastUrlRef.current = url;
    daypartRef.current = istDaypartKey(Date.now());

    setIsLoading(true);
    setProfileLocationRequired(false);
    try {
      const res = await clientFetch(url);
      if (res.status === 402) {
        // Soft/hard paywall: surface partial data if any, otherwise null
        const ed = await res.json().catch(() => ({}));
        if (ed?.partial_data) setData(ed.partial_data);
        setError(null);
        return;
      }
      if (!res.ok) {
        const ed = await res.json().catch(() => ({}));
        if (ed?.profile_location_required || ed?.calculation_unavailable) {
          setProfileLocationRequired(true);
          return;
        }
        throw new Error(ed?.error || 'Failed to load horoscope');
      }
      const parsed = await res.json();
      if (parsed?.profile_location_required || parsed?.calculation_unavailable) {
        setProfileLocationRequired(true);
        setData(null);
        setError(null);
        return;
      }
      setData(parsed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      lastUrlRef.current = '';
    } finally {
      setIsLoading(false);
    }
  }, [sign, isGeneral, language, data]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when the IST daypart rolls (00:00 / 18:00) while the tab stays open.
  // A timer covers the live case; visibilitychange covers tabs that were
  // backgrounded or slept through the boundary.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const refetchIfRolled = () => {
      if (istDaypartKey(Date.now()) !== daypartRef.current) {
        fetchData(true);
      }
    };

    const schedule = () => {
      const delay = Math.max(1000, nextBoundaryMs(Date.now()) - Date.now());
      timer = setTimeout(() => {
        refetchIfRolled();
        schedule();
      }, delay);
    };

    const onVisible = () => {
      if (document.visibilityState === 'visible') refetchIfRolled();
    };

    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchData]);

  return { data, isLoading, error, profileLocationRequired, refetch: fetchData };
}
