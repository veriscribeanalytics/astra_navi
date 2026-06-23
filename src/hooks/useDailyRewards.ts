'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { clientFetch } from '@/lib/apiClient';
import { useAuth } from '@/context/AuthContext';
import type { DailyRewardStatus, DailyRewardClaimResult } from '@/types/rewards';

const REWARD_CYCLE = [1, 1, 2, 2, 3, 3, 10];

function normalizeCycle(raw: unknown): DailyRewardStatus['cycle'] {
    if (!Array.isArray(raw)) {
        return REWARD_CYCLE.map((credits, i) => ({
            day: i + 1,
            credits,
            isToday: false,
        }));
    }
    return raw.map((slot: Record<string, unknown>) => ({
        day: typeof slot.day === 'number' ? slot.day : 1,
        credits: typeof slot.credits === 'number' ? slot.credits : 0,
        isToday: !!slot.isToday,
    }));
}

function normalizeStatus(raw: Record<string, unknown>): DailyRewardStatus {
    return {
        currentStreak: typeof raw.currentStreak === 'number' ? raw.currentStreak : 0,
        longestStreak: typeof raw.longestStreak === 'number' ? raw.longestStreak : 0,
        totalClaims: typeof raw.totalClaims === 'number' ? raw.totalClaims : 0,
        claimableToday: !!raw.claimableToday,
        lastClaimDate: typeof raw.lastClaimDate === 'string' ? raw.lastClaimDate : null,
        nextRewardCredits: typeof raw.nextRewardCredits === 'number' ? raw.nextRewardCredits : 1,
        cycle: normalizeCycle(raw.cycle),
    };
}

export function useDailyRewards() {
    const { isLoggedIn } = useAuth();
    const [status, setStatus] = useState<DailyRewardStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [claimResult, setClaimResult] = useState<DailyRewardClaimResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [claimError, setClaimError] = useState<string | null>(null);
    const fetchedRef = useRef(false);

    const fetchStatus = useCallback(async () => {
        if (!isLoggedIn) return;
        setIsLoading(true);
        setError(null);
        try {
            const res = await clientFetch('/api/rewards/daily');
            if (!res.ok) {
                const ed = await res.json().catch(() => ({}));
                throw new Error(ed.error || ed.detail || 'Failed to load daily rewards');
            }
            const raw = await res.json();
            setStatus(normalizeStatus(raw));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
            fetchedRef.current = true;
        }
    }, [isLoggedIn]);

    const claimReward = useCallback(async () => {
        if (!isLoggedIn) return null;
        setIsClaiming(true);
        setClaimError(null);
        setClaimResult(null);
        try {
            const res = await clientFetch('/api/rewards/daily/claim', { method: 'POST' });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || data.detail || 'Failed to claim reward');
            }
            const result: DailyRewardClaimResult = {
                claimed: !!data.claimed,
                reason: typeof data.reason === 'string' ? data.reason : undefined,
                currentStreak: typeof data.currentStreak === 'number' ? data.currentStreak : 0,
                longestStreak: typeof data.longestStreak === 'number' ? data.longestStreak : 0,
                creditsAwarded: typeof data.creditsAwarded === 'number' ? data.creditsAwarded : 0,
                dayInCycle: typeof data.dayInCycle === 'number' ? data.dayInCycle : 0,
                nextRewardCredits: typeof data.nextRewardCredits === 'number' ? data.nextRewardCredits : 1,
                balanceAfter: typeof data.balanceAfter === 'number' ? data.balanceAfter : undefined,
            };
            setClaimResult(result);
            if (result.claimed) {
                await fetchStatus();
            }
            return result;
        } catch (err) {
            setClaimError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        } finally {
            setIsClaiming(false);
        }
    }, [isLoggedIn, fetchStatus]);

    useEffect(() => {
        if (isLoggedIn && !fetchedRef.current) {
            fetchStatus();
        }
        if (!isLoggedIn) {
            setStatus(null);
            setClaimResult(null);
            setError(null);
            setClaimError(null);
            fetchedRef.current = false;
        }
    }, [isLoggedIn, fetchStatus]);

    return {
        status,
        isLoading,
        isClaiming,
        claimResult,
        error,
        claimError,
        refetch: fetchStatus,
        claimReward,
    };
}

export type UseDailyRewardsReturn = ReturnType<typeof useDailyRewards>;
