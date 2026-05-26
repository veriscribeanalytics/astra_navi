import { useState, useEffect, useCallback, useRef } from 'react';
import { clientFetch } from '@/lib/apiClient';
import { useTranslation } from './useTranslation';
import type { HoroscopeData } from '@/types/horoscope';

interface Options {
  sign?: string;
  isGeneral?: boolean;
}

export function useDailyHoroscope({ sign, isGeneral }: Options = {}) {
  const { language } = useTranslation();
  const [data, setData] = useState<HoroscopeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileLocationRequired, setProfileLocationRequired] = useState(false);
  const lastUrlRef = useRef('');

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (sign) params.set('sign', sign);
    params.set('lang', language);
    const url = (isGeneral ? '/api/horoscope-general?' : '/api/daily-horoscope?') + params.toString();
    if (url === lastUrlRef.current && data) return;
    lastUrlRef.current = url;

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

  return { data, isLoading, error, profileLocationRequired, refetch: fetchData };
}
