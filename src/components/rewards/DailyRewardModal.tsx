'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Gift, Flame, CheckCircle2, Lock, Sparkles, X, Loader2 } from 'lucide-react';
import { useDailyRewards } from '@/hooks/useDailyRewards';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { usePaywallContext } from '@/context/PaywallContext';
import { useNotificationContext } from '@/context/NotificationContext';
import { useToast } from '@/hooks/useToast';
import { useFocusTrap } from '@/hooks';

const REWARD_CYCLE = [1, 1, 2, 2, 3, 3, 10];

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getCalendarGrid(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    return grid;
}

function dayCredits(dayInCycle: number): number {
    return REWARD_CYCLE[(dayInCycle - 1) % 7];
}

const DailyRewardModal: React.FC = () => {
    const { t } = useTranslation();
    const toast = useToast();
    const { isLoggedIn, isLoading: authLoading } = useAuth();
    const { totalCredits, refresh: refreshPaywall } = usePaywallContext();
    const { refreshUnread } = useNotificationContext();
    const reduce = useReducedMotion();

    const {
        status,
        isLoading,
        isClaiming,
        claimReward,
        refetch,
    } = useDailyRewards();

    const [isOpen, setIsOpen] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const overflowRef = useRef(false);
    const dialogRef = useFocusTrap<HTMLDivElement>(isOpen);

    // Auto-open when claimable reward is detected
    useEffect(() => {
        if (!authLoading && isLoggedIn && status?.claimableToday && !dismissed && !isLoading) {
            setIsOpen(true);
        }
    }, [authLoading, isLoggedIn, status?.claimableToday, dismissed, isLoading]);

    // Close on successful claim
    const handleClaim = useCallback(async () => {
        if (!status?.claimableToday || isClaiming) return;
        const result = await claimReward();
        if (!result) return;

        if (result.claimed) {
            refreshPaywall();
            refreshUnread();
            toast.success(
                t('rewards.claimSuccess', {
                    credits: result.creditsAwarded,
                    streak: result.currentStreak,
                })
            );
            setIsOpen(false);
            setDismissed(true);
        } else if (result.reason === 'already_claimed_today') {
            toast.info(t('rewards.claimAlready'));
            setIsOpen(false);
            setDismissed(true);
        }
    }, [status, isClaiming, claimReward, refreshPaywall, refreshUnread, toast, t]);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setDismissed(true);
    }, []);

    // Reset dismissed state at next UTC midnight so the modal can reappear tomorrow
    useEffect(() => {
        const msUntilMidnight =
            new Date(Date.UTC(
                new Date().getUTCFullYear(),
                new Date().getUTCMonth(),
                new Date().getUTCDate() + 1
            )).getTime() - Date.now();
        const timer = window.setTimeout(() => setDismissed(false), msUntilMidnight);
        return () => window.clearTimeout(timer);
    }, []);

    // Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            overflowRef.current = true;
        }
        return () => {
            if (overflowRef.current) {
                document.body.style.overflow = '';
                overflowRef.current = false;
            }
        };
    }, [isOpen]);

    // Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen && !isClaiming) handleClose();
        };
        if (isOpen) document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, isClaiming, handleClose]);

    // Calendar data
    const now = useMemo(() => new Date(), []);
    const year = now.getFullYear();
    const month = now.getMonth();
    const today = now.getDate();
    const grid = useMemo(() => getCalendarGrid(year, month), [year, month]);

    // Determine streak position
    const currentStreak = status?.currentStreak ?? 0;
    const lastClaimDate = status?.lastClaimDate;

    // Map each calendar day to its reward state
    const dayStates = useMemo(() => {
        const map = new Map<number, { credits: number; state: 'claimed' | 'claimable' | 'future' | 'missed' }>();

        if (!status) return map;

        // If user has a streak, mark claimed days going back from today
        // The streak tells us how many consecutive days ending today (or yesterday) were claimed
        // If claimableToday, streak hasn't been extended yet for today
        const streakBase = status.claimableToday ? currentStreak : currentStreak;

        for (let i = 0; i < streakBase; i++) {
            const d = today - i;
            if (d >= 1 && d <= 31) {
                const dayInCycle = ((currentStreak - i - 1) % 7) + 1;
                map.set(d, { credits: dayCredits(dayInCycle), state: 'claimed' });
            }
        }

        // Today is claimable
        if (status.claimableToday) {
            const dayInCycle = ((currentStreak) % 7) + 1;
            map.set(today, { credits: dayCredits(dayInCycle), state: 'claimable' });
        } else if (currentStreak > 0) {
            // Today already claimed — streak includes today
            const dayInCycle = ((currentStreak - 1) % 7) + 1;
            map.set(today, { credits: dayCredits(dayInCycle), state: 'claimed' });
        }

        // Days after today are future
        for (let d = today + 1; d <= 31; d++) {
            const futureStreak = currentStreak + (d - today);
            const dayInCycle = ((futureStreak - 1) % 7) + 1;
            map.set(d, { credits: dayCredits(dayInCycle), state: 'future' });
        }

        // Days before the streak that aren't in the streak are missed (or pre-start)
        for (let d = 1; d < today - streakBase; d++) {
            map.set(d, { credits: 0, state: 'missed' });
        }

        return map;
    }, [status, currentStreak, today]);

    const claimable = !!status?.claimableToday;

    // Don't render for non-authenticated users or during auth loading
    if (!isLoggedIn || authLoading) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={dialogRef}
                    key="reward-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduce ? 0.1 : 0.25 }}
                    className="fixed inset-0 z-[1050] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isClaiming) handleClose();
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reward-modal-title"
                >
                    <motion.div
                        key="reward-modal-card"
                        initial={reduce ? false : { scale: 0.92, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { scale: 0.92, opacity: 0, y: 12 }}
                        transition={reduce ? { duration: 0.1 } : { type: 'spring', stiffness: 340, damping: 24 }}
                        className="relative w-full max-w-[380px] sm:max-w-[420px] glass-panel overflow-hidden rounded-[32px] p-5 sm:p-6"
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            disabled={isClaiming}
                            className="absolute top-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-surface-variant/40 text-on-surface-variant/60 transition-colors hover:bg-surface-variant/70 hover:text-primary"
                            aria-label={t('common.cancel')}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Header */}
                        <div className="text-center mb-4">
                            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-secondary/15 bg-secondary/5 px-3 py-1">
                                <Sparkles className="h-3 w-3 text-secondary" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary">
                                    {t('rewards.weekProgress')}
                                </span>
                            </div>
                            <h2
                                id="reward-modal-title"
                                className="font-headline text-xl font-bold text-primary sm:text-2xl"
                            >
                                {t('rewards.title')}
                            </h2>
                            {claimable && (
                                <p className="mt-1 text-sm text-on-surface-variant/60">
                                    {t('rewards.todayReward')} · {t('rewards.dayLabel')} {((currentStreak) % 7) + 1}
                                </p>
                            )}
                        </div>

                        {/* Claim seal (mini) */}
                        {claimable && (
                            <div className="flex justify-center mb-4">
                                <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center">
                                    <div className="absolute inset-0 rounded-full border border-secondary/30 reward-seal-breathe" />
                                    <div className="relative flex h-[88px] w-[88px] sm:h-[104px] sm:w-[104px] items-center justify-center rounded-full border border-secondary/40 bg-surface-variant/30 cosmic-glow">
                                        <div className="absolute inset-[8px] rounded-full border border-secondary/25" />
                                        <div className="relative z-10 flex flex-col items-center">
                                            {dayCredits(((currentStreak) % 7) + 1) >= 10 ? (
                                                <Sparkles className="h-5 w-5 text-brand-gold mb-0.5" />
                                            ) : (
                                                <Gift className="h-4 w-4 text-secondary/80 mb-0.5" />
                                            )}
                                            <span className="font-headline text-3xl font-black leading-none text-secondary sm:text-4xl">
                                                {dayCredits(((currentStreak) % 7) + 1)}
                                            </span>
                                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant/50">
                                                {t('rewards.creditsLabel')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mini calendar */}
                        <div className="mb-4">
                            {/* Month header */}
                            <div className="flex items-center justify-between mb-2 px-1">
                                <span className="text-sm font-bold text-primary">
                                    {now.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant/50">
                                    <Flame className="h-3.5 w-3.5 text-secondary" />
                                    <span>{currentStreak}-day streak</span>
                                </div>
                            </div>

                            {/* Day-of-week headers */}
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {DAYS_SHORT.map((d) => (
                                    <div key={d} className="text-center text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {grid.map((dayNum, idx) => {
                                    if (dayNum === null) {
                                        return <div key={`empty-${idx}`} className="h-9 sm:h-10" />;
                                    }

                                    const ds = dayStates.get(dayNum);
                                    const isToday = dayNum === today;

                                    let cellClass = 'h-9 sm:h-10 rounded-[12px] flex items-center justify-center text-xs font-bold transition-colors';
                                    let icon: React.ReactNode = null;

                                    if (isToday && ds?.state === 'claimable') {
                                        cellClass += ' border-2 border-secondary bg-secondary/15 text-secondary cosmic-glow reward-seal-breathe cursor-pointer';
                                        icon = <Gift className="h-3.5 w-3.5" />;
                                    } else if (isToday && ds?.state === 'claimed') {
                                        cellClass += ' bg-secondary/20 text-secondary';
                                        icon = <CheckCircle2 className="h-3.5 w-3.5" />;
                                    } else if (ds?.state === 'claimed') {
                                        cellClass += ' bg-secondary/10 text-secondary/70';
                                    } else if (ds?.state === 'future') {
                                        cellClass += ' bg-surface-variant/20 text-on-surface-variant/30';
                                        icon = <Lock className="h-3 w-3 opacity-40" />;
                                    } else if (ds?.state === 'missed') {
                                        cellClass += ' bg-surface-variant/15 text-on-surface-variant/20';
                                    } else {
                                        cellClass += ' bg-surface-variant/10 text-on-surface-variant/25';
                                    }

                                    if (isToday && ds?.state !== 'claimable') {
                                        cellClass += ' ring-1 ring-secondary/30';
                                    }

                                    return (
                                        <div
                                            key={`day-${dayNum}`}
                                            className={cellClass}
                                            title={
                                                ds?.state === 'claimable'
                                                    ? `${ds.credits} credits — Claim now!`
                                                    : ds?.state === 'claimed'
                                                    ? `${ds.credits} credits — Claimed ✓`
                                                    : ds?.state === 'future'
                                                    ? `${ds.credits} credits — Upcoming`
                                                    : undefined
                                            }
                                        >
                                            {icon || dayNum}
                                        </div>
                                    );
                                })}
                            </div>

                        </div>

                        {/* Claim button */}
                        {claimable && (
                            <button
                                onClick={handleClaim}
                                disabled={isClaiming}
                                className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-[20px] gold-gradient px-6 py-3 font-headline text-sm font-bold text-on-primary shadow-lg shadow-secondary/25 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/35 active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isClaiming ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Gift className="h-5 w-5" />
                                )}
                                {isClaiming ? t('rewards.claimingButton') : t('rewards.claimNow')}
                            </button>
                        )}

                        {!claimable && status && (
                            <div className="text-center">
                                <div className="inline-flex items-center gap-2 rounded-2xl bg-secondary/10 px-4 py-2 text-sm font-bold text-secondary">
                                    <CheckCircle2 className="h-4 w-4" />
                                    {t('rewards.claimedButton')}
                                </div>
                            </div>
                        )}

                        {/* View full rewards page link */}
                        <div className="mt-3 text-center">
                            <a
                                href="/rewards"
                                className="text-[11px] font-medium text-on-surface-variant/50 hover:text-secondary transition-colors"
                            >
                                {t('rewardsModal.viewFullPage')} →
                            </a>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default DailyRewardModal;
