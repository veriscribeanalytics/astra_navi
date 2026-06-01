import { useState, useEffect, useCallback, useRef } from "react";
import { clientFetch } from "@/lib/apiClient";
import type { WeeklyForecastResponse } from "@/types/forecast";
import { parseForecastError, todayISO, type OutOfRangeInfo } from "@/utils/forecastError";

const CACHE_DURATION = 5 * 60 * 1000;

interface CacheEntry {
    data: WeeklyForecastResponse;
    timestamp: number;
    key: string;
}

export function useWeeklyForecast(area: string, date?: string, lang?: string) {
    const [data, setData] = useState<WeeklyForecastResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outOfRange, setOutOfRange] = useState<OutOfRangeInfo | null>(null);
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
    const abortRef = useRef<AbortController | null>(null);

    const effectiveDate = date || todayISO();

    const fetchForecast = useCallback(async () => {
        const cacheKey = `${area}:${lang || "en"}:${effectiveDate}`;
        const cached = cacheRef.current.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            setData(cached.data);
            setError(null);
            setOutOfRange(null);
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsLoading(true);
        setError(null);
        setOutOfRange(null);
        try {
            const params = new URLSearchParams();
            params.set("date", effectiveDate);
            if (lang) params.set("lang", lang);
            const res = await clientFetch(`/api/forecast/${area}/weekly?${params.toString()}`, { signal: controller.signal });
            if (controller.signal.aborted) return;
            const json = await res.json();
            if (controller.signal.aborted) return;
            if (!res.ok) {
                const parsed = parseForecastError(json);
                if (parsed.outOfRange) {
                    setOutOfRange(parsed);
                } else {
                    throw new Error(json?.error || json?.detail?.message || "Failed to load weekly forecast");
                }
                return;
            }
            setData(json as WeeklyForecastResponse);
            cacheRef.current.set(cacheKey, { data: json, timestamp: Date.now(), key: cacheKey });
        } catch (err: unknown) {
            if (controller.signal.aborted) return;
            if (err instanceof Error && err.name === 'AbortError') return;
            const msg = err instanceof Error ? err.message : "Failed to load weekly forecast";
            setError(msg);
        } finally {
            if (abortRef.current === controller) {
                setIsLoading(false);
                abortRef.current = null;
            }
        }
    }, [area, lang, effectiveDate]);

    useEffect(() => {
        fetchForecast();
        return () => {
            abortRef.current?.abort();
        };
    }, [fetchForecast]);

    return { data, isLoading, error, outOfRange, refetch: fetchForecast };
}
