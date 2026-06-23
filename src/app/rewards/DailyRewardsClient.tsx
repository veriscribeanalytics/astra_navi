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
    Coins,
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

/* ════════════════════════════════════════════════════════════════════════
   Geometry — the 7-day "constellation arc"
   Nodes live in a 720×260 viewBox and rise left→right so Day 7 (the jackpot)
   sits at the apex. The same fractional coordinates drive both the SVG thread
   (preserveAspectRatio="none", so it stretches to fill) and the HTML nodes
   positioned over it — keeping them pixel-aligned at every width.
   ════════════════════════════════════════════════════════════════════════ */
const VB_W = 720;
const VB_H = 260;
const ARC: { x: number; y: number }[] = Array.from({ length: 7 }, (_, i) => {
    const x = 56 + (i * (VB_W - 112)) / 6;
    const t = i / 6;
    const y = 214 - (214 - 54) * Math.pow(t, 0.85);
    return { x, y };
});

/** Smooth quadratic path through the given points (passes through endpoints). */
function smoothPath(points: { x: number; y: number }[]): string {
    if (points.length < 2) return '';
    let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
        const cur = points[i];
        const nxt = points[i + 1];
        const mx = (cur.x + nxt.x) / 2;
        const my = (cur.y + nxt.y) / 2;
        d += ` Q ${cur.x.toFixed(1)} ${cur.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
    return d;
}

const FULL_THREAD = smoothPath(ARC);

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

/* ─── A single stat pill ────────────────────────────────────────────────── */
const StatTile: React.FC<{
    icon: React.ReactNode;
    value: React.ReactNode;
    label: string;
    accent?: boolean;
    flash?: boolean;
}> = ({ icon, value, label, accent, flash }) => (
    <div
        className={`relative glass-panel rounded-[22px] 3xl:rounded-[28px] p-3.5 sm:p-4 3xl:p-6 text-center overflow-hidden transition-colors duration-500 ${
            accent ? 'border-secondary/30' : ''
        } ${flash ? 'bg-secondary/10' : ''}`}
    >
        <div
            className={`mx-auto mb-1.5 flex h-7 w-7 3xl:h-9 3xl:w-9 items-center justify-center ${
                accent ? 'text-secondary' : 'text-on-surface-variant/55'
            }`}
        >
            {icon}
        </div>
        <p
            className={`font-headline font-bold tabular-nums leading-none ${
                accent
                    ? 'text-2xl sm:text-3xl 3xl:text-4xl text-secondary'
                    : 'text-xl sm:text-2xl 3xl:text-3xl text-primary'
            }`}
        >
            {value}
        </p>
        <p className="mt-1.5 text-[10px] 3xl:text-xs font-bold uppercase tracking-[0.14em] text-on-surface-variant/45">
            {label}
        </p>
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
                const dist = 78 + r2 * 76;
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

    const litPath = useMemo(() => smoothPath(ARC.slice(0, Math.max(1, activeDay))), [activeDay]);

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
                description="Open AstraNavi each day and claim free credits to spend on charts, forecasts and conversations with Navi. Consecutive days build your streak and unlock bigger rewards — with a mega bonus on Day 7."
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
                className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl"
                style={{ background: 'radial-gradient(circle, var(--brand-gold) 0%, transparent 70%)' }}
            />

            <div className="relative mx-auto max-w-[1100px] 3xl:max-w-[1600px] space-y-9 px-5 md:px-10 lg:space-y-12">
                {/* ─── Header ─────────────────────────────────────────────── */}
                <motion.header
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center"
                >
                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/5 px-4 py-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-secondary" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                            {t('rewards.weekProgress')}
                        </span>
                    </div>
                    <h1 className="font-headline text-3xl font-bold text-primary sm:text-4xl 3xl:text-6xl">
                        {t('rewards.title')}
                    </h1>
                    <p className="mx-auto mt-2 max-w-xl text-sm text-on-surface-variant/60 3xl:text-lg">
                        {t('rewards.subtitle')}
                    </p>
                </motion.header>

                {/* ─── Loading / error / content ──────────────────────────── */}
                {isLoading && !status ? (
                    <div className="space-y-8">
                        <div className="mx-auto h-[300px] max-w-[560px] animate-pulse rounded-[32px] bg-surface" />
                        <div className="mx-auto h-[180px] max-w-[680px] animate-pulse rounded-[28px] bg-surface" />
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="h-[104px] animate-pulse rounded-[22px] bg-surface" />
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
                        {/* ─── HERO: the celestial seal ───────────────────── */}
                        <motion.section
                            initial={reduce ? false : { opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.05 }}
                            className={`glass-panel relative mx-auto flex max-w-[560px] flex-col items-center gap-6 overflow-hidden rounded-[32px] p-7 sm:p-9 3xl:rounded-[40px] 3xl:p-12 ${
                                claimable ? '' : 'border-secondary/20'
                            }`}
                        >
                            {/* faint inner gold ring */}
                            <div
                                aria-hidden
                                className="pointer-events-none absolute inset-3 rounded-[26px] border border-secondary/10 3xl:rounded-[34px]"
                            />

                            {/* Seal */}
                            <div className="relative flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52 3xl:h-72 3xl:w-72">
                                {/* rotating dotted halo (claimable only) */}
                                {claimable && (
                                    <div
                                        aria-hidden
                                        className={`absolute inset-0 rounded-full border border-dashed border-secondary/30 ${
                                            animateAmbient ? 'reward-seal-halo' : ''
                                        }`}
                                    />
                                )}

                                {/* breathing seal body */}
                                <div
                                    className={`relative flex h-36 w-36 items-center justify-center rounded-full sm:h-44 sm:w-44 3xl:h-60 3xl:w-60 ${
                                        claimable && animateAmbient ? 'reward-seal-breathe' : ''
                                    }`}
                                >
                                    {/* outer ring + glow */}
                                    <div className="absolute inset-0 rounded-full border border-secondary/40 bg-surface-variant/30 cosmic-glow" />
                                    {/* inner gold hairline */}
                                    <div className="absolute inset-[10px] rounded-full border border-secondary/25" />

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
                                    <div className="relative z-10 flex flex-col items-center justify-center text-center">
                                        {claimable ? (
                                            <motion.div
                                                initial={reduce ? false : { scale: 0.85, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                                className="flex flex-col items-center"
                                            >
                                                {todayCredits >= 10 ? (
                                                    <Star className="mb-1 h-7 w-7 text-brand-gold" />
                                                ) : (
                                                    <Gift className="mb-1 h-6 w-6 text-secondary/80" />
                                                )}
                                                <span className="font-headline text-5xl font-black leading-none text-secondary sm:text-6xl 3xl:text-7xl">
                                                    {todayCredits}
                                                </span>
                                                <span className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/50">
                                                    {t('rewards.creditsLabel')}
                                                </span>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                initial={reduce ? false : { scale: 0.7, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                                                className="flex flex-col items-center"
                                            >
                                                <CheckCircle2 className="h-14 w-14 text-secondary 3xl:h-20 3xl:w-20" />
                                                <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant/50">
                                                    {t('rewards.claimedButton')}
                                                </span>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Headline + CTA */}
                            <div className="flex w-full flex-col items-center gap-3">
                                <p className="text-center font-headline text-lg font-bold text-primary 3xl:text-2xl">
                                    {claimable
                                        ? `${t('rewards.todayReward')} · ${t('rewards.dayLabel')} ${activeDay}`
                                        : t('rewards.claimAlready')}
                                </p>

                                {claimable ? (
                                    <button
                                        onClick={handleClaim}
                                        disabled={isClaiming || celebrating}
                                        className="group relative flex w-full max-w-xs items-center justify-center gap-2 overflow-hidden rounded-[20px] gold-gradient px-8 py-3.5 font-headline text-base font-bold text-on-primary shadow-lg shadow-secondary/25 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/35 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 3xl:py-5 3xl:text-xl"
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
                                    <div className="flex items-center gap-2 rounded-[20px] border border-outline-variant/20 bg-surface-variant/40 px-6 py-3 text-sm font-bold text-on-surface-variant/60">
                                        <Clock className="h-4 w-4 text-secondary/70" />
                                        <span>
                                            {t('rewards.nextRewardIn')}{' '}
                                            <span className="font-mono tabular-nums text-secondary">{countdown}</span>
                                        </span>
                                    </div>
                                )}

                                {claimable && status.currentStreak === 0 && (
                                    <p className="text-xs text-on-surface-variant/50">{t('rewards.noStreakYet')}</p>
                                )}
                                {claimError && (
                                    <p className="text-xs font-bold text-red-400">{t('rewards.claimError')}</p>
                                )}
                            </div>
                        </motion.section>

                        {/* ─── 7-day constellation arc ────────────────────── */}
                        <motion.section
                            initial={reduce ? false : { opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.12 }}
                            aria-label={`${t('rewards.weekProgress')} — ${t('rewards.dayLabel')} ${activeDay} / 7`}
                            className="glass-panel rounded-[28px] p-5 sm:p-7 3xl:rounded-[36px] 3xl:p-10"
                        >
                            <div className="custom-scrollbar overflow-x-auto pb-2">
                                <div className="relative mx-auto aspect-[720/260] w-full min-w-[540px] max-w-[700px] 3xl:max-w-[920px]">
                                    {/* SVG thread */}
                                    <svg
                                        viewBox={`0 0 ${VB_W} ${VB_H}`}
                                        preserveAspectRatio="none"
                                        className="absolute inset-0 h-full w-full"
                                        aria-hidden
                                    >
                                        {/* dim full thread */}
                                        <path
                                            d={FULL_THREAD}
                                            fill="none"
                                            stroke="var(--outline-variant)"
                                            strokeOpacity="0.4"
                                            strokeWidth="2"
                                            strokeDasharray="4 7"
                                            strokeLinecap="round"
                                        />
                                        {/* lit (earned) thread — draws on mount & re-sweeps on claim */}
                                        {activeDay >= 2 && (
                                            <motion.path
                                                key={`lit-${celebrateKey}`}
                                                d={litPath}
                                                fill="none"
                                                stroke="var(--secondary)"
                                                strokeOpacity="0.85"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                                                animate={{ pathLength: 1 }}
                                                transition={{
                                                    duration: reduce ? 0 : Math.max(0.6, activeDay * 0.16),
                                                    ease: 'easeInOut',
                                                }}
                                            />
                                        )}
                                    </svg>

                                    {/* Nodes */}
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
                                        const pos = ARC[i] ?? ARC[0];

                                        const isEarned = state === 'past' || state === 'today-claimed';
                                        const isToday = state === 'today-claimable' || state === 'today-claimed';

                                        const baseSize = isDay7
                                            ? 'h-14 w-14 sm:h-16 sm:w-16 3xl:h-20 3xl:w-20'
                                            : 'h-11 w-11 sm:h-12 sm:w-12 3xl:h-16 3xl:w-16';

                                        return (
                                            <div
                                                key={day}
                                                className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                                                style={{
                                                    left: `${(pos.x / VB_W) * 100}%`,
                                                    top: `${(pos.y / VB_H) * 100}%`,
                                                }}
                                            >
                                                {/* Day-7 starburst aura */}
                                                {isDay7 && (
                                                    <div
                                                        aria-hidden
                                                        className={`absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-28 sm:w-28 ${
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
                                                    className={`relative flex ${baseSize} items-center justify-center rounded-full border transition-colors duration-500 ${
                                                        isToday
                                                            ? 'border-secondary bg-secondary/15 cosmic-glow ring-2 ring-secondary/40'
                                                            : isEarned
                                                                ? 'border-secondary/40 gold-gradient text-on-primary shadow-md shadow-secondary/20'
                                                                : isDay7
                                                                    ? 'border-secondary/30 bg-surface-variant/40'
                                                                    : 'border-outline-variant/40 bg-surface-variant/20'
                                                    } ${state === 'past' ? 'opacity-80' : state === 'future' ? 'opacity-55' : ''}`}
                                                >
                                                    {state === 'past' ? (
                                                        <CheckCircle2 className="h-5 w-5 text-on-primary 3xl:h-7 3xl:w-7" />
                                                    ) : state === 'today-claimed' ? (
                                                        <CheckCircle2 className="h-6 w-6 text-secondary 3xl:h-8 3xl:w-8" />
                                                    ) : isDay7 ? (
                                                        <div className="flex flex-col items-center leading-none">
                                                            <Star
                                                                className={`h-4 w-4 3xl:h-5 3xl:w-5 ${
                                                                    isToday ? 'text-secondary' : 'text-brand-gold/80'
                                                                }`}
                                                            />
                                                            <span
                                                                className={`mt-0.5 font-headline text-sm font-black tabular-nums 3xl:text-lg ${
                                                                    isToday ? 'text-secondary' : 'text-brand-gold'
                                                                }`}
                                                            >
                                                                {slot.credits}
                                                            </span>
                                                        </div>
                                                    ) : state === 'future' ? (
                                                        <Lock className="h-4 w-4 text-on-surface-variant/40 3xl:h-5 3xl:w-5" />
                                                    ) : (
                                                        <span className="font-headline text-lg font-black tabular-nums text-secondary 3xl:text-2xl">
                                                            {slot.credits}
                                                        </span>
                                                    )}
                                                </motion.div>

                                                {/* label */}
                                                <span
                                                    className={`mt-2 whitespace-nowrap text-[9px] font-bold uppercase tracking-wider 3xl:text-xs ${
                                                        isToday ? 'text-secondary' : 'text-on-surface-variant/40'
                                                    }`}
                                                >
                                                    {isDay7 ? t('rewards.bonusLabel') : `${t('rewards.dayLabel')} ${day}`}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <p className="mt-3 text-center text-[11px] font-medium text-on-surface-variant/45 3xl:text-sm">
                                {t('rewards.cycleComplete')} · {t('rewards.day7Hint')}
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
                                icon={<Coins className="h-full w-full" />}
                                value={
                                    displayBalance === null ? '—' : <CountUp value={displayBalance} />
                                }
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
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-secondary/15 bg-secondary/10 text-secondary">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="font-headline text-base font-bold text-primary 3xl:text-xl">
                                        {t('rewards.howItWorks')}
                                    </h2>
                                    <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant/60 3xl:text-base">
                                        {t('rewards.howItWorksDesc')}
                                    </p>
                                    <p className="mt-2 text-xs text-on-surface-variant/40">
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
