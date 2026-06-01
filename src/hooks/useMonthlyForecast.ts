import { useState, useEffect, useCallback, useRef } from "react";
import { clientFetch } from "@/lib/apiClient";
import type { MonthlyForecastResponse } from "@/types/forecast";
import { parseForecastError, currentMonthISO, type OutOfRangeInfo } from "@/utils/forecastError";

const CACHE_DURATION = 5 * 60 * 1000;

interface CacheEntry {
    data: MonthlyForecastResponse;
    timestamp: number;
    key: string;
}

export function useMonthlyForecast(area: string, month?: string, lang?: string) {
    const [data, setData] = useState<MonthlyForecastResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outOfRange, setOutOfRange] = useState<OutOfRangeInfo | null>(null);
    const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
    const abortRef = useRef<AbortController | null>(null);

    const effectiveMonth = month || currentMonthISO();

    const fetchForecast = useCallback(async () => {
        const cacheKey = `${area}:${lang || "en"}:${effectiveMonth}`;
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
            params.set("month", effectiveMonth);
            if (lang) params.set("lang", lang);
            const res = await clientFetch(`/api/forecast/${area}/monthly?${params.toString()}`, { signal: controller.signal });
            if (controller.signal.aborted) return;
            const json = await res.json();
            if (controller.signal.aborted) return;
            if (!res.ok) {
                const parsed = parseForecastError(json);
                if (parsed.outOfRange) {
                    setOutOfRange(parsed);
                } else {
                    throw new Error(json?.error || json?.detail?.message || "Failed to load monthly forecast");
                }
                return;
            }
            setData(json as MonthlyForecastResponse);
            cacheRef.current.set(cacheKey, { data: json, timestamp: Date.now(), key: cacheKey });
        } catch (err: unknown) {
            if (controller.signal.aborted) return;
            if (err instanceof Error && err.name === 'AbortError') return;
            const msg = err instanceof Error ? err.message : "Failed to load monthly forecast";
            setError(msg);
        } finally {
            if (abortRef.current === controller) {
                setIsLoading(false);
                abortRef.current = null;
            }
        }
    }, [area, lang, effectiveMonth]);

    useEffect(() => {
        fetchForecast();
        return () => {
            abortRef.current?.abort();
        };
    }, [fetchForecast]);

    return { data, isLoading, error, outOfRange, refetch: fetchForecast };
}
