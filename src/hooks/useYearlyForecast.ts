import { useState, useEffect, useCallback, useRef } from 'react';
import { clientFetch } from '@/lib/apiClient';

export interface YearlyMonthSummary {
    month: string;
    score: number;
    text: string;
    alerts: (string | { technical: string; simple: string })[];
    transits: Record<string, { sign: string; house_from_moon: number; house_from_lagna: number }>;
    is_current: boolean;
}

export interface YearlySummary {
    best_month: string;
    worst_month: string;
    average_score: number;
    trend: string;
}

export interface YearlyForecastData {
    area: string;
    months: YearlyMonthSummary[];
    summary: YearlySummary;
}

const CACHE_DURATION = 6 * 60 * 60 * 1000;

export function useYearlyForecast(area: string, lang?: string) {
    const [data, setData] = useState<YearlyForecastData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const cacheRef = useRef<{ data: YearlyForecastData; timestamp: number; key: string } | null>(null);

    const fetchForecast = useCallback(async () => {
        const cacheKey = `${area}:${lang || 'en'}`;

        if (cacheRef.current && cacheRef.current.key === cacheKey && Date.now() - cacheRef.current.timestamp < CACHE_DURATION) {
            setData(cacheRef.current.data);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (lang) params.set('lang', lang);
            const res = await clientFetch(`/api/forecast/${area}/yearly?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to load yearly forecast');
            const json: YearlyForecastData = await res.json();
            setData(json);
            cacheRef.current = { data: json, timestamp: Date.now(), key: cacheKey };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to load yearly forecast';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [area, lang]);

    useEffect(() => {
        fetchForecast();
    }, [fetchForecast]);

    return { data, isLoading, error, refetch: fetchForecast };
}