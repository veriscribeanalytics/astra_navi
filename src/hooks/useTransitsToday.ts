import { useState, useEffect, useCallback, useRef } from 'react';
import { clientFetch } from '@/lib/apiClient';

export interface Rahukaal {
  date: string;
  weekday: string;
  start: string;
  end: string;
  startIso: string;
  endIso: string;
  durationMinutes: number;
  segment: number;
  source: string;
}

export interface TransitsTodayData {
  planets: { name: string; sign: string; house: number | null; isRetrograde?: boolean }[];
  panchanga: { tithi: string; nakshatra: string; yoga: string; karana: string; vara: string; rahukaal?: Rahukaal };
  notableTransits: string[];
  suggestedQuestions: string[];
  todayEnergy: string;
}

const CACHE_DURATION = 4 * 60 * 60 * 1000;

export function useTransitsToday() {
  const [data, setData] = useState<TransitsTodayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<{ data: TransitsTodayData; timestamp: number } | null>(null);

  const fetchTransits = useCallback(async () => {
    if (cacheRef.current && Date.now() - cacheRef.current.timestamp < CACHE_DURATION) {
      setData(cacheRef.current.data);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await clientFetch('/api/transits/today');
      if (!res.ok) throw new Error('Failed to load transits');
      const json = await res.json();
      setData(json);
      cacheRef.current = { data: json, timestamp: Date.now() };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load transits';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransits();
  }, [fetchTransits]);

  return { data, isLoading, error, refetch: fetchTransits };
}