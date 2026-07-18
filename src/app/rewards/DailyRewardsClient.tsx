'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion, animate } from 'motion/react';
import {
    Gift,
    Flame,
    Clock,
    CheckCircle2,
    Lock,
    Sparkles,
    Star,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { useDailyRewards } from '@/hooks/useDailyRewards';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/context/AuthContext';
import { usePaywallContext } from '@/context/PaywallContext';
import { useNotificationContext } from '@/context/NotificationContext';
import { useToast } from '@/hooks/useToast';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';

/* ─── Ringed-planet glyph (lucide has no Saturn) — mirrors the mockup's
 *  credits emblem. Inherits currentColor so it themes with its container. */
const SaturnIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden
    >
        <circle cx="11" cy="11" r="6" />
        <path d="M4.8 15.6c-1.7 1.1-2.7 2.2-2.4 2.9.5 1.2 5 .5 10.1-1.7s8.9-5 8.4-6.2c-.3-.7-1.7-.8-3.7-.4" />
    </svg>
);

/** Pure, deterministic pseudo-random in [0,1) from an index — keeps the
 *  sparkle burst varied without an impure Math.random() call during render. */
function hash01(n: number): number {
    const x = Math.sin(n * 127.1 + 11.7) * 43758.5453;
    return x - Math.floor(x);
}

function getNextUtcMidnightMs(): number {
    const now = new Date();
    const utcMidnight = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
    );
    return utcMidnight.getTime();
}

function formatCountdown(ms: number): string {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

type NodeState = 'past' | 'today-claimable' | 'today-claimed' | 'future';

/* ─── A number that animates from its previous value to the new one ─────── */
const CountUp: React.FC<{ value: number; className?: string; duration?: number }> = ({
    value,
    className,
    duration = 0.8,
}) => {
    const reduce = useReducedMotion();
    const [display, setDisplay] = useState(value);
    const prev = useRef(value);

    useEffect(() => {
        if (reduce || prev.current === value) {
            setDisplay(value);
            prev.current = value;
            return;
        }
        const controls = animate(prev.current, value, {
            duration,
            ease: 'easeOut',
            onUpdate: (v) => setDisplay(Math.round(v)),
        });
        prev.current = value;
        return () => controls.stop();
    }, [value, duration, reduce]);

    return <span className={className}>{display.toLocaleString()}</span>;
};

/* ─── A single stat tile (icon left, value + label stacked) ─────────────── */
const StatTile: React.FC<{
    icon: React.ReactNode;
    value: React.ReactNode;
    label: string;
    accent?: boolean;
    flash?: boolean;
}> = ({ icon, value, label, accent, flash }) => (
    <div
        className={`relative glass-panel flex items-center gap-3 rounded-[20px] p-4 3xl:gap-4 3xl:rounded-[26px] 3xl:p-6 overflow-hidden transition-colors duration-500 ${
            accent ? 'border-secondary/30' : ''
        } ${flash ? 'bg-secondary/10' : ''}`}
    >
        <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border 3xl:h-14 3xl:w-14 ${
                accent
                    ? 'border-secondary/30 bg-secondary/10 text-secondary'
                    : 'border-outline-variant/25 bg-surface-variant/30 text-on-surface-variant/55'
            }`}
        >
            <div className="flex h-5 w-5 items-center justify-center 3xl:h-6 3xl:w-6">{icon}</div>
        </div>
        <div className="min-w-0">
            <p className="text-[11px] 3xl:text-sm font-bold uppercase tracking-[0.08em] text-on-surface-variant/50">
                {label}
            </p>
            <p
                className={`font-headline font-bold tabular-nums leading-tight ${
                    accent
                        ? 'text-xl sm:text-2xl 3xl:text-3xl text-secondary'
                        : 'text-xl sm:text-2xl 3xl:text-3xl text-primary'
                }`}
            >
                {value}
            </p>
        </div>
    </div>
);

const DailyRewardsClient: React.FC = () => {
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
        error,
        claimError,
        refetch,
        claimReward,
    } = useDailyRewards();

    const [countdown, setCountdown] = useState('');
    const [celebrating, setCelebrating] = useState(false);
    const [celebrateKey, setCelebrateKey] = useState(0);
    const [displayBalance, setDisplayBalance] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    // Live UTC-midnight countdown (the server is the source of truth for
    // claimability; this is purely a "time until next blessing" display).
    useEffect(() => {
        const update = () => setCountdown(formatCountdown(getNextUtcMidnightMs() - Date.now()));
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, []);

    // Mirror the authoritative credit balance, except while a claim is
    // celebrating — then the count-up owns the number until it settles.
    useEffect(() => {
        if (!celebrating && typeof totalCredits === 'number') setDisplayBalance(totalCredits);
    }, [totalCredits, celebrating]);

    // Stable sparkle burst vectors (only ever rendered during a celebration,
    // so they never appear in SSR output → no hydration mismatch).
    const sparkles = useMemo(
        () =>
            Array.from({ length: 16 }, (_, i) => {
                const r1 = hash01(i + 1);
                const r2 = hash01(i + 7.3);
                const r3 = hash01(i + 13.9);
                const angle = (i / 16) * Math.PI * 2 + (r1 - 0.5) * 0.5;
                const dist = 64 + r2 * 62;
                return {
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    size: 4 + r3 * 5,
                    delay: r1 * 0.12,
                    duration: 0.6 + r2 * 0.4,
                };
            }),
        []
    );

    const todaySlot = useMemo(() => status?.cycle.find((s) => s.isToday) ?? null, [status]);
    const activeDay = useMemo(() => {
        if (todaySlot) return todaySlot.day;
        if (status && status.currentStreak > 0) return ((status.currentStreak - 1) % 7) + 1;
        return 1;
    }, [todaySlot, status]);
    const todayCredits = todaySlot?.credits ?? status?.nextRewardCredits ?? 1;
    const bonusCredits = useMemo(
        () => status?.cycle.find((s) => s.day === 7)?.credits ?? 10,
        [status]
    );

    // Lit fraction of the horizontal journey connector (node 1 → activeDay).
    const litFraction = Math.min(1, Math.max(0, (activeDay - 1) / 6));

    const animateAmbient = mounted && !reduce;

    const handleClaim = useCallback(async () => {
        if (!status?.claimableToday || isClaiming || celebrating) return;
        const before = typeof totalCredits === 'number' ? totalCredits : displayBalance ?? 0;

        const result = await claimReward();
        if (!result) return; // network/server error — claimError is surfaced below

        if (result.claimed) {
            const after =
                typeof result.balanceAfter === 'number'
                    ? result.balanceAfter
                    : before + result.creditsAwarded;
            setCelebrating(true);
            setCelebrateKey((k) => k + 1);
            setDisplayBalance(after); // CountUp animates before → after
            refreshPaywall();
            refreshUnread();
            toast.success(
                t('rewards.claimSuccess', {
                    credits: result.creditsAwarded,
                    streak: result.currentStreak,
                })
            );
            window.setTimeout(() => setCelebrating(false), reduce ? 250 : 1900);
        } else if (result.reason === 'already_claimed_today') {
            // Claimed elsewhere (e.g. another device). The hook already
            // refetched; just reconcile quietly.
            toast.info(t('rewards.claimAlready'));
        }
    }, [
        status,
        isClaiming,
        celebrating,
        totalCredits,
        displayBalance,
        claimReward,
        refreshPaywall,
        refreshUnread,
        toast,
        t,
        reduce,
    ]);

    /* ─── Auth gates (all hooks above run unconditionally) ──────────────── */
    if (authLoading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 pt-[calc(var(--navbar-height,64px)+1rem)]">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-secondary/20 bg-secondary/10">
                    <Gift className="h-5 w-5 animate-pulse text-secondary" />
                </div>
                <p className="text-sm font-medium text-foreground/40">{t('rewards.title')}…</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <PublicFeatureLanding
                title="Daily Rewards — Free Credits, Every Day"
                subtitle="Claim daily • Grow your streak • Unlock the Day 7 bonus"
                description="Open AstraMitra each day and claim free credits to spend on charts, forecasts and conversations with Navi. Consecutive days build your streak and unlock bigger rewards — with a mega bonus on Day 7."
                hook="In Jyotish, devotion is daily. A small, steady ritual — returning each dawn — compounds into something far greater than any single grand gesture. Your streak is that discipline, made visible."
                icon={<Gift className="h-4 w-4" />}
                ctaLabel="Start Claiming"
                callbackUrl="/rewards"
                features={[
                    {
                        title: 'A reward every single day',
                        desc: 'Sign in and claim free credits daily — no purchase, no catch. Credits go straight to your balance.',
                        icon: <Gift className="h-5 w-5" />,
                    },
                    {
                        title: 'Streaks that compound',
                        desc: 'Each consecutive day grows your streak and unlocks larger rewards across a 7-day cycle.',
                        icon: <Flame className="h-5 w-5" />,
                    },
                    {
                        title: 'A Day 7 mega bonus',
                        desc: 'Reach the seventh day for a jackpot of 10 credits — then the cycle begins again.',
                        icon: <Star className="h-5 w-5" />,
                    },
                ]}
                benefits={[
                    'Free credits added to your balance on every claim',
                    'Spend them on kundli, forecasts, matching & chat with Navi',
                    'Resets fairly at midnight UTC — claim anytime that day',
                    'Your streak and longest run are tracked automatically',
                ]}
                vedicAuthority="A daily ritual of return — discipline rewarded, in the Vedic spirit"
            />
        );
    }

    const claimable = !!status?.claimableToday;

    return (
        <div className="relative min-h-screen overflow-hidden celestial-silk pb-20 pt-[calc(var(--navbar-height,64px)+1.5rem)]">
            {/* Ambient cosmic glow */}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/4 h-[420px] w-[620px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl"
                style={{ background: 'radial-gradient(circle, var(--brand-gold) 0%, transparent 70%)' }}
            />

            <div className="relative mx-auto max-w-[1280px] 3xl:max-w-[2400px] space-y-6 px-5 md:px-10 lg:space-y-8">
                {/* ─── Header row ─────────────────────────────────────────── */}
                <motion.header
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
                >
                    <div>
                        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/5 px-4 py-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-secondary" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                                {t('rewards.weekProgress')}
                            </span>
                        </div>
                        <h1 className="font-headline text-3xl font-bold text-primary sm:text-5xl 3xl:text-6xl">
                            {t('rewards.title')}
                        </h1>
                        <p className="mt-2 max-w-xl text-sm text-on-surface-variant/60 3xl:text-lg">
                            {t('rewards.subtitle')}
                        </p>
                    </div>

                    {/* Credits balance pill */}
                    <div className="glass-panel flex shrink-0 items-center gap-3 self-start rounded-[20px] px-5 py-3.5 3xl:rounded-[26px] 3xl:px-7 3xl:py-5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-secondary/30 bg-secondary/10 text-secondary 3xl:h-13 3xl:w-13">
                            <SaturnIcon className="h-5 w-5 3xl:h-6 3xl:w-6" />
                        </div>
                        <div className="leading-tight">
                            <p className="font-headline text-2xl font-bold tabular-nums text-primary 3xl:text-3xl">
                                {displayBalance === null ? '—' : <CountUp value={displayBalance} />}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-on-surface-variant/45 3xl:text-xs">
                                {t('rewards.balanceLabel')}
                            </p>
                        </div>
                    </div>
                </motion.header>

                {/* ─── Loading / error / content ──────────────────────────── */}
                {isLoading && !status ? (
                    <div className="space-y-6">
                        <div className="h-[150px] animate-pulse rounded-[28px] bg-surface" />
                        <div className="h-[230px] animate-pulse rounded-[28px] bg-surface" />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-[84px] animate-pulse rounded-[20px] bg-surface" />
                            ))}
                        </div>
                    </div>
                ) : error ? (
                    <div className="glass-panel mx-auto max-w-md rounded-[28px] p-8 text-center">
                        <p className="text-sm text-on-surface-variant/70">{t('rewards.loadError')}</p>
                        <button
                            onClick={refetch}
                            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-secondary/10 px-5 py-2.5 text-sm font-bold text-secondary transition-colors hover:bg-secondary/20"
                        >
                            <RefreshCw className="h-4 w-4" />
                            {t('rewards.retry')}
                        </button>
                    </div>
                ) : status ? (
                    <>
                        {/* ─── TODAY banner ───────────────────────────────── */}
                        <motion.section
                            initial={reduce ? false : { opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className="glass-panel relative overflow-hidden rounded-[28px] p-6 sm:p-8 3xl:rounded-[36px] 3xl:p-11"
                        >
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                                {/* Left zone — seal + status */}
                                <div className="flex flex-1 items-center gap-5 sm:gap-7">
                                    {/* Circular status seal */}
                                    <div className="relative flex h-24 w-24 shrink-0 items-center justify-center sm:h-28 sm:w-28 3xl:h-36 3xl:w-36">
                                        {claimable && (
                                            <div
                                                aria-hidden
                                                className={`absolute inset-0 rounded-full border border-dashed border-secondary/30 ${
                                                    animateAmbient ? 'reward-seal-halo' : ''
                                                }`}
                                            />
                                        )}
                                        <div
                                            className={`relative flex h-20 w-20 items-center justify-center rounded-full sm:h-24 sm:w-24 3xl:h-32 3xl:w-32 ${
                                                claimable && animateAmbient ? 'reward-seal-breathe' : ''
                                            }`}
                                        >
                                            <div className="absolute inset-0 rounded-full border border-secondary/40 bg-surface-variant/30 cosmic-glow" />
                                            <div className="absolute inset-[8px] rounded-full border border-secondary/25" />

                                            {/* shockwave (one-shot on claim) */}
                                            <AnimatePresence>
                                                {celebrating && !reduce && (
                                                    <motion.span
                                                        key={`shock-${celebrateKey}`}
                                                        aria-hidden
                                                        className="absolute inset-0 rounded-full border-2 border-secondary"
                                                        initial={{ scale: 0.4, opacity: 0.85 }}
                                                        animate={{ scale: 2.4, opacity: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        transition={{ duration: 0.7, ease: 'easeOut' }}
                                                    />
                                                )}
                                            </AnimatePresence>

                                            {/* sparkle burst */}
                                            <AnimatePresence>
                                                {celebrating &&
                                                    !reduce &&
                                                    sparkles.map((s, i) => (
                                                        <motion.span
                                                            key={`spark-${celebrateKey}-${i}`}
                                                            aria-hidden
                                                            className="absolute rounded-full bg-brand-gold"
                                                            style={{
                                                                width: s.size,
                                                                height: s.size,
                                                                left: '50%',
                                                                top: '50%',
                                                                marginLeft: -s.size / 2,
                                                                marginTop: -s.size / 2,
                                                            }}
                                                            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                                                            animate={{ x: s.x, y: s.y, scale: [0, 1, 0], opacity: [1, 1, 0] }}
                                                            transition={{ duration: s.duration, delay: s.delay, ease: 'easeOut' }}
                                                        />
                                                    ))}
                                            </AnimatePresence>

                                            {/* seal content */}
                                            <div className="relative z-10 flex items-center justify-center">
                                                {claimable ? (
                                                    todayCredits >= 10 ? (
                                                        <Star className="h-11 w-11 text-brand-gold 3xl:h-14 3xl:w-14" />
                                                    ) : (
                                                        <Gift className="h-10 w-10 text-secondary/80 3xl:h-13 3xl:w-13" />
                                                    )
                                                ) : (
                                                    <CheckCircle2 className="h-11 w-11 text-secondary 3xl:h-14 3xl:w-14" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status text + CTA */}
                                    <div className="min-w-0">
                                        <h2 className="font-headline text-xl font-bold text-primary sm:text-2xl 3xl:text-3xl">
                                            {claimable
                                                ? `${t('rewards.todayReward')} · ${t('rewards.dayLabel')} ${activeDay}`
                                                : t('rewards.todayClaimedTitle')}
                                        </h2>
                                        <p className="mt-1 text-sm text-on-surface-variant/60 3xl:text-base">
                                            {status.currentStreak > 0
                                                ? t('rewards.streakActive', { days: status.currentStreak })
                                                : t('rewards.noStreakYet')}
                                        </p>

                                        {claimable ? (
                                            <button
                                                onClick={handleClaim}
                                                disabled={isClaiming || celebrating}
                                                className="group relative mt-4 inline-flex items-center justify-center gap-2 overflow-hidden rounded-[16px] gold-gradient px-7 py-3 font-headline text-base font-bold text-on-primary shadow-lg shadow-secondary/25 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/35 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 3xl:px-9 3xl:py-4 3xl:text-lg"
                                            >
                                                {isClaiming ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        {t('rewards.claimingButton')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <Gift className="h-5 w-5" />
                                                        {t('rewards.claimNow')}
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-4 py-2">
                                                <CheckCircle2 className="h-4 w-4 text-secondary" />
                                                <span className="text-sm font-bold text-secondary 3xl:text-base">
                                                    {t('rewards.creditsClaimed', { credits: todayCredits })}
                                                </span>
                                            </div>
                                        )}

                                        {claimError && (
                                            <p className="mt-2 text-xs font-bold text-red-400">
                                                {t('rewards.claimError')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div
                                    aria-hidden
                                    className="hidden h-24 w-px shrink-0 bg-outline-variant/20 lg:block 3xl:h-28"
                                />

                                {/* Right zone — next-claim countdown */}
                                <div className="flex shrink-0 flex-col items-start lg:items-center lg:px-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface-variant/45 3xl:text-sm">
                                        {t('rewards.nextClaimIn')}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2 rounded-[16px] border border-outline-variant/20 bg-surface-variant/40 px-4 py-2.5 3xl:px-6 3xl:py-3.5">
                                        <Clock className="h-4 w-4 text-secondary/70 3xl:h-5 3xl:w-5" />
                                        <span className="font-mono text-xl font-bold tabular-nums tracking-wider text-secondary 3xl:text-2xl">
                                            {countdown}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-on-surface-variant/50 3xl:text-sm">
                                        {t('rewards.dayOfSeven', { day: activeDay, total: 7 })}
                                    </p>
                                </div>
                            </div>
                        </motion.section>

                        {/* ─── 7-day journey timeline ─────────────────────── */}
                        <motion.section
                            initial={reduce ? false : { opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.12 }}
                            aria-label={`${t('rewards.journeyTitle')} — ${t('rewards.dayLabel')} ${activeDay} / 7`}
                            className="glass-panel rounded-[28px] p-6 sm:p-8 3xl:rounded-[36px] 3xl:p-11"
                        >
                            <h2 className="mb-6 font-headline text-lg font-bold text-primary sm:text-xl 3xl:text-2xl 3xl:mb-8">
                                {t('rewards.journeyTitle')}
                            </h2>

                            <div className="custom-scrollbar overflow-x-auto pb-2">
                                <div className="relative min-w-[600px]">
                                    {/* Connector track — sits on the node-circle centers (h-16 → 32px) */}
                                    <div
                                        aria-hidden
                                        className="pointer-events-none absolute top-8 h-0.5 3xl:top-10"
                                        style={{ left: 'calc(100% / 14)', right: 'calc(100% / 14)' }}
                                    >
                                        {/* dim dashed full line */}
                                        <div
                                            className="absolute inset-0"
                                            style={{
                                                backgroundImage:
                                                    'repeating-linear-gradient(to right, var(--outline-variant) 0 6px, transparent 6px 13px)',
                                                opacity: 0.4,
                                            }}
                                        />
                                        {/* lit (earned) line */}
                                        <motion.div
                                            key={`lit-${celebrateKey}`}
                                            className="absolute inset-y-0 left-0 rounded-full bg-secondary"
                                            style={{ opacity: 0.85 }}
                                            initial={reduce ? { width: `${litFraction * 100}%` } : { width: 0 }}
                                            animate={{ width: `${litFraction * 100}%` }}
                                            transition={{ duration: reduce ? 0 : Math.max(0.5, activeDay * 0.16), ease: 'easeInOut' }}
                                        />
                                    </div>

                                    {/* Nodes */}
                                    <div className="relative flex items-start justify-between">
                                        {status.cycle.map((slot, i) => {
                                            const day = slot.day;
                                            const isDay7 = day === 7;
                                            const state: NodeState = slot.isToday
                                                ? claimable
                                                    ? 'today-claimable'
                                                    : 'today-claimed'
                                                : day < activeDay
                                                    ? 'past'
                                                    : 'future';

                                            const isEarned = state === 'past' || state === 'today-claimed';
                                            const isToday = state === 'today-claimable' || state === 'today-claimed';

                                            const circleSize = isDay7
                                                ? 'h-14 w-14 3xl:h-[68px] 3xl:w-[68px]'
                                                : 'h-11 w-11 3xl:h-14 3xl:w-14';

                                            return (
                                                <div key={day} className="flex flex-1 flex-col items-center">
                                                    {/* fixed-height circle row → all node centers align on the track */}
                                                    <div className="relative flex h-16 items-center justify-center 3xl:h-20">
                                                        {/* Day-7 starburst aura */}
                                                        {isDay7 && (
                                                            <div
                                                                aria-hidden
                                                                className={`absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full 3xl:h-24 3xl:w-24 ${
                                                                    animateAmbient ? 'reward-day7-rays' : 'opacity-40'
                                                                }`}
                                                                style={{
                                                                    background:
                                                                        'radial-gradient(circle, color-mix(in srgb, var(--brand-gold) 35%, transparent) 0%, transparent 68%)',
                                                                }}
                                                            />
                                                        )}

                                                        <motion.div
                                                            initial={reduce ? false : { scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            transition={{
                                                                delay: reduce ? 0 : 0.2 + i * 0.05,
                                                                type: 'spring',
                                                                stiffness: 260,
                                                                damping: 18,
                                                            }}
                                                            className={`relative flex ${circleSize} items-center justify-center rounded-full border transition-colors duration-500 ${
                                                                isToday
                                                                    ? 'border-secondary bg-secondary/15 cosmic-glow ring-2 ring-secondary/40'
                                                                    : isEarned
                                                                        ? 'border-secondary/40 gold-gradient text-on-primary shadow-md shadow-secondary/20'
                                                                        : isDay7
                                                                            ? 'border-secondary/30 bg-surface-variant/40'
                                                                            : 'border-outline-variant/40 bg-surface-variant/20'
                                                            } ${state === 'future' ? 'opacity-60' : ''}`}
                                                        >
                                                            {state === 'past' ? (
                                                                <CheckCircle2 className="h-5 w-5 text-on-primary 3xl:h-6 3xl:w-6" />
                                                            ) : state === 'today-claimed' ? (
                                                                <CheckCircle2 className="h-6 w-6 text-secondary 3xl:h-7 3xl:w-7" />
                                                            ) : isDay7 ? (
                                                                <Sparkles
                                                                    className={`h-6 w-6 3xl:h-7 3xl:w-7 ${
                                                                        isToday ? 'text-secondary' : 'text-brand-gold'
                                                                    }`}
                                                                />
                                                            ) : state === 'future' ? (
                                                                <Lock className="h-4 w-4 text-on-surface-variant/40 3xl:h-5 3xl:w-5" />
                                                            ) : (
                                                                <CheckCircle2 className="h-6 w-6 text-secondary 3xl:h-7 3xl:w-7" />
                                                            )}
                                                        </motion.div>
                                                    </div>

                                                    {/* label */}
                                                    <span
                                                        className={`mt-2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider 3xl:text-xs ${
                                                            isToday ? 'text-secondary' : 'text-on-surface-variant/45'
                                                        }`}
                                                    >
                                                        {isDay7
                                                            ? `${t('rewards.dayLabel')} 7`
                                                            : `${t('rewards.dayLabel')} ${day}`}
                                                    </span>
                                                    {isDay7 && (
                                                        <span className="text-[9px] font-bold uppercase tracking-wider text-secondary/70 3xl:text-[11px]">
                                                            {t('rewards.bonusLabel')}
                                                        </span>
                                                    )}

                                                    {/* credits */}
                                                    <span
                                                        className={`mt-1 inline-flex items-center gap-1 font-headline text-sm font-bold tabular-nums 3xl:text-base ${
                                                            isDay7 || isToday ? 'text-secondary' : 'text-on-surface-variant/60'
                                                        }`}
                                                    >
                                                        +{slot.credits}
                                                        <SaturnIcon className="h-3.5 w-3.5 text-secondary/70 3xl:h-4 3xl:w-4" />
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <p className="mt-5 text-center text-[11px] font-medium text-on-surface-variant/45 3xl:text-sm">
                                {t('rewards.journeyHint', { credits: bonusCredits })}
                            </p>
                        </motion.section>

                        {/* ─── Stat tiles ─────────────────────────────────── */}
                        <motion.section
                            initial={reduce ? false : { opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.18 }}
                            className="relative grid grid-cols-2 gap-3 sm:grid-cols-4 3xl:gap-5"
                        >
                            {/* streak +1 float */}
                            <AnimatePresence>
                                {celebrating && !reduce && (
                                    <span
                                        key={`streak-float-${celebrateKey}`}
                                        aria-hidden
                                        className="pointer-events-none absolute left-[12.5%] top-0 -translate-x-1/2"
                                    >
                                        <motion.span
                                            className="block font-headline text-xl font-black text-secondary"
                                            initial={{ y: 8, opacity: 0 }}
                                            animate={{ y: -22, opacity: [0, 1, 0] }}
                                            transition={{ duration: 1.1, ease: 'easeOut' }}
                                        >
                                            +1
                                        </motion.span>
                                    </span>
                                )}
                            </AnimatePresence>

                            <StatTile
                                icon={<Flame className="h-full w-full" />}
                                value={<CountUp value={status.currentStreak} />}
                                label={t('rewards.streakLabel')}
                            />
                            <StatTile
                                icon={<Star className="h-full w-full" />}
                                value={<CountUp value={status.longestStreak} />}
                                label={t('rewards.longestStreakLabel')}
                            />
                            <StatTile
                                icon={<CheckCircle2 className="h-full w-full" />}
                                value={<CountUp value={status.totalClaims} />}
                                label={t('rewards.totalClaimsLabel')}
                            />
                            <StatTile
                                icon={<SaturnIcon className="h-full w-full" />}
                                value={displayBalance === null ? '—' : <CountUp value={displayBalance} />}
                                label={t('rewards.balanceLabel')}
                                accent
                                flash={celebrating}
                            />
                        </motion.section>

                        {/* ─── How it works ───────────────────────────────── */}
                        <motion.section
                            initial={reduce ? false : { opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.24 }}
                            className="glass-panel rounded-[24px] p-5 sm:p-6 3xl:rounded-[32px] 3xl:p-8"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-secondary/15 bg-secondary/10 text-secondary 3xl:h-14 3xl:w-14">
                                    <Sparkles className="h-5 w-5 3xl:h-6 3xl:w-6" />
                                </div>
                                <div>
                                    <h2 className="font-headline text-base font-bold text-primary 3xl:text-xl">
                                        {t('rewards.howItWorks')}
                                    </h2>
                                    <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant/60 3xl:text-base">
                                        {t('rewards.howItWorksDesc')}
                                    </p>
                                    <p className="mt-2 text-xs text-on-surface-variant/40 3xl:text-sm">
                                        {t('rewards.streakResetNotice')}
                                    </p>
                                </div>
                            </div>
                        </motion.section>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default DailyRewardsClient;
