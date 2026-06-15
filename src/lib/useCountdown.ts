'use client';

import { useEffect, useState } from 'react';

export interface CountdownState {
    /** True once the target time has passed (or no target was given). */
    expired: boolean;
    /** Human-readable remaining time, e.g. "4h 12m" or "45s". Empty when expired. */
    label: string;
    /** Whole seconds remaining (0 when expired). */
    secondsRemaining: number;
}

/** Format a positive millisecond remainder as a compact "Xh Ym" / "Ym Zs" / "Zs". */
function formatRemaining(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

/**
 * Live countdown to an absolute ISO-8601 timestamp. Re-renders once per second
 * until the target elapses. Pass `null` (or an unparseable value) to get an
 * immediately-expired state — handy for "no cooldown active".
 */
export function useCountdown(target: string | null | undefined): CountdownState {
    const targetMs = target ? new Date(target).getTime() : NaN;
    const valid = Number.isFinite(targetMs);

    const compute = (): CountdownState => {
        if (!valid) return { expired: true, label: '', secondsRemaining: 0 };
        const remaining = targetMs - Date.now();
        if (remaining <= 0) return { expired: true, label: '', secondsRemaining: 0 };
        return {
            expired: false,
            label: formatRemaining(remaining),
            secondsRemaining: Math.ceil(remaining / 1000),
        };
    };

    const [state, setState] = useState<CountdownState>(compute);

    useEffect(() => {
        if (!valid) {
            setState({ expired: true, label: '', secondsRemaining: 0 });
            return;
        }
        // Re-sync immediately (target may have changed), then tick each second.
        setState(compute());
        const id = setInterval(() => {
            const next = compute();
            setState(next);
            if (next.expired) clearInterval(id);
        }, 1000);
        return () => clearInterval(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetMs, valid]);

    return state;
}
