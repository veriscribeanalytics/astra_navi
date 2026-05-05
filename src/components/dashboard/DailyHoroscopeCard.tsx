'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetch } from '@/lib/apiClient';
import Card from '@/components/ui/Card';
import { Sparkles, Heart, Trophy, Sun, Gem, X, MessageSquare, ArrowRight, TrendingUp, Info, Orbit, Briefcase, Activity, DollarSign, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from '@/hooks';

interface HoroscopeData {
    user?: { sign: string; name: string };
    meta?: { date: string; date_display: string; generated_at: string };
    score?: {
        overall: number;
        areas: {
            career: { value: number };
            love: { value: number };
            health: { value: number };
            finance: { value: number };
            general: { value: number };
        };
    };
    lucky?: { color: string; number: number };
    mood?: any; // Handles both { value, type } and string
    planetary?: { dominant_planet: string; active_dasha: string };
    areas_text?: {
        career: { insight: string; tone: string };
        love: { insight: string; tone: string };
        health: { insight: string; tone: string };
        finance: { insight: string; tone: string };
    };
    alerts?: {
        primary: { technical: string; simple: string; type: string; importance: string };
        secondary: Array<{ technical: string; simple: string; type: string; importance: string }>;
    };
    time_triggers?: Array<{ start: string; end: string; type: string; label: string; advice: string }>;
    astro_explanations?: {
        enabled: boolean;
        items: Array<{ technical: string; simple: string; importance: string }>;
    };
    system?: { is_personalized: boolean; language: string };
    // Compatibility fields (optional, if any old code still needs them)
    sign?: string;
    date_display?: string;
    overall_score?: number;
    lucky_color?: string;
    lucky_number?: number;
    dominant_planet?: string;
    tip?: any; // Handles both { text, type } and string
    today_scores?: Record<string, any>;
}

interface ForecastDay {
    date: string; is_today: boolean; score: number; text: string;
    dominant_planet: string; 
    personalized_alerts: (string | { technical: string; simple: string })[];
    transits?: Record<string, { sign: string; house_from_moon: number; house_from_lagna: number }>;
}

interface ForecastData {
    area: string; days: ForecastDay[];
    summary: { best_day: string; worst_day: string; average_score: number; trend: string; };
}

interface ModalData {
    label: string; score: number; info: string; icon: React.ReactNode;
    color: string; bg: string; colorHex: string; area: string;
}

// Mini sparkline SVG
function MiniChart({ days, colorHex, activeDate }: { days: ForecastDay[]; colorHex: string; activeDate?: string }) {
    const h = 60, w = 220;
    const points = days.map((d, i) => ({ x: (i / (days.length - 1)) * w, y: h - (d.score / 100) * h }));
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD = `M 0 ${h} ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${w} ${h} Z`;

    return (
        <svg viewBox={`-10 -10 ${w + 20} ${h + 40}`} className="w-full h-auto overflow-visible">
            <defs>
                <linearGradient id={`area-${colorHex.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={colorHex} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={colorHex} stopOpacity="0.02" />
                </linearGradient>
            </defs>
            {[25, 50, 75].map(v => (
                <line key={v} x1="0" y1={h - (v / 100) * h} x2={w} y2={h - (v / 100) * h} stroke="var(--color-foreground)" strokeOpacity="0.1" strokeWidth="0.5" />
            ))}
            <path d={areaD} fill={`url(#area-${colorHex.replace('#','')})`} />
            <path d={pathD} fill="none" stroke={colorHex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => {
                const d = days[i];
                const isSelected = activeDate === d.date;
                return (
                    <g key={i}>
                        {/* Static Point Representation */}
                        {(d.is_today || isSelected) && <circle cx={p.x} cy={p.y} r="5" fill={colorHex} opacity={isSelected ? 0.15 : 0.08} />}
                        <circle cx={p.x} cy={p.y} r={d.is_today ? 3 : 1.5} 
                            fill={d.is_today || isSelected ? colorHex : 'transparent'} 
                            stroke={colorHex} strokeWidth={d.is_today || isSelected ? 0 : 1} />
                        
                        <text x={p.x} y={p.y - 10} textAnchor="middle" 
                            fill={isSelected ? colorHex : 'var(--color-foreground)'} 
                            fillOpacity={isSelected ? 1 : 0.4} 
                            fontSize="7" fontWeight="bold">{d.score}</text>
                        
                        {isSelected && <line x1={p.x} y1={p.y + 4} x2={p.x} y2={h + 50} stroke={colorHex} strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />}
                    </g>
                );
            })}
        </svg>
    );
}

// ─── Skeleton Sub-component ─────────────────────────────
import { Skeleton, SkeletonCircle, SkeletonBlock, SkeletonText } from '@/components/ui/Skeleton';

function DailyHoroscopeCardSkeleton() {
    return (
        <div className="flex flex-col h-full">
            {/* Highlight Banner Skeleton */}
            <div className="bg-secondary/5 border-b border-secondary/10 px-6 py-2">
                <Skeleton height={14} className="w-2/3 mx-auto sm:mx-0" />
            </div>

            {/* HERO SECTION Skeleton */}
            <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-secondary/[0.03] border-b border-white/5">
                <div className="lg:col-span-8 flex items-center gap-5">
                    <SkeletonBlock height={64} className="w-16 h-16 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-3">
                        <Skeleton height={14} width={120} />
                        <SkeletonText lines={2} className="text-xl" />
                    </div>
                </div>
                <div className="lg:col-span-4 flex items-center justify-center lg:justify-end gap-6 lg:border-l border-white/5 lg:pl-8">
                    <div className="relative">
                        <SkeletonCircle size={96} className="sm:w-24 sm:h-24" />
                        <div className="absolute inset-[-10%] rounded-full bg-secondary/5 blur-xl animate-pulse" />
                    </div>
                    <div className="hidden lg:flex flex-col gap-2">
                        <SkeletonBlock height={40} className="w-32 rounded-xl" />
                    </div>
                </div>
            </div>

            {/* HEADER & STATS Skeleton (Unified) */}
            <div className="px-6 sm:px-8 py-5 border-b border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 flex flex-col justify-between">
                    <div>
                        <Skeleton height={12} width={140} className="mb-2" />
                        <Skeleton height={32} width={200} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <Skeleton height={10} width={40} />
                            <Skeleton height={16} width={80} />
                        </div>
                        <div className="space-y-2">
                            <Skeleton height={10} width={40} />
                            <Skeleton height={16} width={80} />
                        </div>
                        <div className="space-y-2">
                            <Skeleton height={10} width={40} />
                            <Skeleton height={16} width={80} />
                        </div>
                        <div className="space-y-2">
                            <Skeleton height={10} width={40} />
                            <Skeleton height={16} width={80} />
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2">
                    <SkeletonBlock height={140} className="w-full rounded-[20px]" />
                </div>
            </div>

            {/* CATEGORY SCORES Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-5 p-5 sm:p-7 border-outline-variant/10 border-b md:border-r last:border-r-0">
                        <SkeletonBlock height={80} className="w-20 rounded-[28px] shrink-0" />
                        <div className="flex-1 space-y-3">
                            <Skeleton height={32} width={80} />
                            <SkeletonText lines={2} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


export default function DailyHoroscopeCard({ 
    sign, 
    isGeneral, 
    userLoading, 
    onSendMessage 
}: { 
    sign?: string; 
    isGeneral?: boolean; 
    userLoading?: boolean;
    onSendMessage?: (msg: string) => void;
}) {
    const router = useRouter();
    const { t, language } = useTranslation();
    const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showContent, setShowContent] = useState(false);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [activeModal, setActiveModal] = useState<ModalData | null>(null);
    const [forecast, setForecast] = useState<ForecastData | null>(null);
    const [forecastLoading, setForecastLoading] = useState(false);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [activeAlertIdx, setActiveAlertIdx] = useState(0);
    
    // Optimization Refs
    const currentSign = horoscope?.sign || sign || 'Aries';
    
    const translatedSign = t(`signs.${currentSign.toLowerCase()}`);

    const fetchedAreasRef = useRef<Set<string>>(new Set());
    const forecastDataCacheRef = useRef<Map<string, ForecastData>>(new Map());
    const lastSignRef = useRef<string | undefined>('');
    const lastFetchedUrlRef = useRef<string>('');

    const today = new Date();
    const dateString = today.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long' });

    useEffect(() => {
        if (userLoading) return;

        (async () => {
            try {
                let url = isGeneral ? '/api/horoscope-general' : '/api/daily-horoscope';
                if (sign) url += `?sign=${encodeURIComponent(sign)}`;
                
                // Prevent duplicate fetches for same URL
                if (url === lastFetchedUrlRef.current && horoscope) return;
                lastFetchedUrlRef.current = url;

                setLoading(true);
                const res = await clientFetch(url);
                if (!res.ok) { const ed = await res.json().catch(() => ({})); throw new Error(ed.error || 'Failed'); }
                const data = await res.json();
                
                if (sign !== lastSignRef.current) {
                    lastSignRef.current = sign;
                }
                
                setHoroscope(data); 
                setError(null);
            } catch (err: unknown) { 
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                setError(errorMessage); 
                lastFetchedUrlRef.current = '';
            }
            finally { setLoading(false); }
        })();
    }, [sign, isGeneral, userLoading]);

    // Rotation for personalized alerts
    useEffect(() => {
        const allAlertsCount = (horoscope?.alerts?.primary ? 1 : 0) + (horoscope?.alerts?.secondary?.length || 0);
        if (allAlertsCount <= 1) return;
        
        const int = setInterval(() => {
            setActiveAlertIdx(prev => (prev + 1) % allAlertsCount);
        }, 5000);
        return () => clearInterval(int);
    }, [horoscope?.alerts]);

    // Initial content show and score animation
    useEffect(() => {
        if (userLoading) return;
        if (!loading && horoscope) {
            setAnimatedScore(horoscope.score?.overall ?? horoscope.overall_score ?? 0);
            const t = setTimeout(() => { setShowContent(true); }, 100);
            return () => clearTimeout(t);
        }
    }, [loading, horoscope, userLoading]);

    // ─── Score Color Logic ─────────────────────────────
    const getScoreStyle = useCallback((s: number) => {
        if (s >= 85) return { color: 'text-green-600', bg: 'bg-green-600/10', hex: '#16a34a', label: t('horoscope.excellent') };
        if (s >= 70) return { color: 'text-green-400', bg: 'bg-green-400/10', hex: '#4ade80', label: t('horoscope.good') };
        if (s >= 50) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', hex: '#eab308', label: t('horoscope.fair') };
        return { color: 'text-red-500', bg: 'bg-red-500/10', hex: '#ef4444', label: t('horoscope.low') };
    }, [t]);

    const score = horoscope?.score?.overall ?? horoscope?.today_scores?.general ?? horoscope?.overall_score ?? 0;
    const currentScoreStyle = getScoreStyle(score);
    const scoreHex = currentScoreStyle.hex;
    const circ = 2 * Math.PI * 32;
    const prog = circ - (animatedScore / 100) * circ;

    const metrics = useMemo(() => {
        const areas = (horoscope?.score?.areas || {}) as any;
        const areasText = (horoscope?.areas_text || {}) as any;
        const CATEGORY_THEMES = {
            career: { color: "text-orange-500", bg: "bg-orange-500/10", hex: "#f97316" },
            health: { color: "text-green-500", bg: "bg-green-500/10", hex: "#22c55e" },
            love: { color: "text-pink-500", bg: "bg-pink-500/10", hex: "#ec4899" },
            finance: { color: "text-amber-500", bg: "bg-amber-500/10", hex: "#f59e0b" }
        };
        
        return [
            { label: "Career", score: areas.career?.value ?? 0, info: areasText.career?.insight || '---', icon: <Trophy className="w-5 h-5" />, area: "career" },
            { label: "Health", score: areas.health?.value ?? 0, info: areasText.health?.insight || '---', icon: <Sun className="w-5 h-5" />, area: "health" },
            { label: "Love", score: areas.love?.value ?? 0, info: areasText.love?.insight || '---', icon: <Heart className="w-5 h-5" />, area: "love" },
            { label: "Finance", score: areas.finance?.value ?? 0, info: areasText.finance?.insight || '---', icon: <Gem className="w-5 h-5" />, area: "finance" },
        ].map(item => {
            const scoreStyle = getScoreStyle(item.score);
            const theme = CATEGORY_THEMES[item.area as keyof typeof CATEGORY_THEMES];
            return { 
                ...item, 
                iconColor: theme.color,
                iconBg: theme.bg,
                iconHex: theme.hex,
                scoreColor: scoreStyle.color,
                scoreBg: scoreStyle.bg,
                scoreHex: scoreStyle.hex
            };
        });
    }, [horoscope, getScoreStyle]);

    const luckyColorHex = useMemo(() => {
        const lc = (horoscope?.lucky?.color || horoscope?.lucky_color || '').toLowerCase();
        if (!lc) return '#94a3b8';
        const fam = [['pink','rose','magenta','#f472b6'],['red','maroon','crimson','#dc2626'],['blue','navy','indigo','cyan','#2563eb'],['green','emerald','teal','#059669'],['purple','violet','lavender','#7c3aed'],['orange','peach','coral','#ea580c'],['purple','violet','lavender','#7c3aed'],['white','cream','ivory','#ffffff'],['black','charcoal','#111827'],['grey','gray','silver','#94a3b8']];
        const m = fam.find(f => f.slice(0, -1).some(k => lc.includes(k)));
        return m ? m[m.length - 1] : '#fbbf24';
    }, [horoscope?.lucky?.color, horoscope?.lucky_color]);

    const openModal = (item: ModalData) => {
        setActiveModal(item); setForecast(null); setExpandedDay(null);
        
        const cached = forecastDataCacheRef.current.get(item.area);
        if (cached) {
            setForecast(cached);
            return;
        }
        setForecastLoading(true);
        clientFetch(`/api/forecast/${item.area}?days_back=3&days_forward=3`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setForecast(d); })
            .catch(() => {})
            .finally(() => setForecastLoading(false));
    };

    const handleConsult = (topic: string) => {
        localStorage.setItem('astranavi_pending_message', `Tell me more about my ${topic.toLowerCase()} forecast for today`);
        router.push('/chat');
    };

    const fmtDate = (ds: string) => {
        if (!ds) return '—';
        const d = new Date(ds.includes('T') ? ds : ds + 'T00:00:00');
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    };
    const fmtDay = (ds: string) => {
        if (!ds) return '—';
        const d = new Date(ds.includes('T') ? ds : ds + 'T00:00:00');
        return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short' });
    };

    if (error && !horoscope) return <Card padding="md" className="!rounded-[24px] sm:!rounded-[32px]"><div className="h-64 flex flex-col items-center justify-center gap-4 text-center px-6"><div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center"><Sparkles className="w-8 h-8 text-orange-500" /></div><h3 className="text-lg font-headline font-bold text-foreground mb-2">Service Temporarily Unavailable</h3><p className="text-sm text-foreground/60">{error || 'Unable to load forecast.'}</p></div></Card>;

    const displayDate = horoscope?.meta?.date_display || horoscope?.date_display || dateString;
    
    const highlightMetric = [...metrics].sort((a,b) => b.score - a.score)[0];

    return (
        <Card padding="none" className="!rounded-[32px] sm:!rounded-[40px] overflow-hidden relative bg-surface border-secondary/10 flex flex-col h-full min-h-[600px]">
            {loading || userLoading ? (
                <DailyHoroscopeCardSkeleton />
            ) : (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ duration: 0.5 }}
                    className="flex flex-col h-full"
                >
                    {/* Highlight Banner */}
                    {highlightMetric.score > 70 && (
                        <div className={`${highlightMetric.iconBg} border-b border-white/5 px-6 py-2 flex items-center gap-2.5`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${highlightMetric.iconColor} animate-pulse`} />
                            <span className={`text-[10px] font-bold ${highlightMetric.scoreColor} uppercase tracking-[0.2em]`}>
                                ⭐ {t('horoscope.todaysHighlight')}: Your {highlightMetric.label} score is at an impressive {highlightMetric.score}%
                            </span>
                        </div>
                    )}

                    {/* HERO SECTION */}
                    <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-secondary/[0.03] border-b border-white/5">
                        {/* Alert Side */}
                        <div className="lg:col-span-8 flex items-center gap-5">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(200,136,10,0.1)]">
                                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-secondary" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center relative h-[120px]">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[12px] sm:text-[13px] font-bold text-secondary uppercase tracking-[0.2em]">{t('horoscope.yourDayToday')}</span>
                                    {horoscope?.alerts?.secondary && horoscope.alerts.secondary.length > 0 && (
                                        <div className="flex gap-1">
                                            <div key="p" className={`w-1 h-1 rounded-full transition-all duration-500 ${activeAlertIdx === 0 ? 'bg-secondary w-3' : 'bg-secondary/20'}`} />
                                            {horoscope.alerts.secondary.map((_, i) => (
                                                <div key={i} className={`w-1 h-1 rounded-full transition-all duration-500 ${i + 1 === activeAlertIdx ? 'bg-secondary w-3' : 'bg-secondary/20'}`} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeAlertIdx}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.4, ease: "easeOut" }}
                                            className="flex flex-col justify-center py-1"
                                        >
                                            {(() => {
                                                const allAlerts = [
                                                    horoscope?.alerts?.primary,
                                                    ...(horoscope?.alerts?.secondary || [])
                                                ].filter(Boolean);
                                                
                                                const alert = (allAlerts[activeAlertIdx] || { simple: t('horoscope.alignmentNeutral') }) as any;
                                                const simple = alert.simple;
                                                const tech = alert.technical;
                                                return (
                                                    <>
                                                        <p className="text-base sm:text-xl text-foreground font-headline font-bold leading-relaxed line-clamp-2">{simple}</p>
                                                        <div className="flex flex-wrap items-center gap-3 mt-3">
                                                            {tech && (
                                                                <p className="text-[9px] sm:text-[10px] text-secondary font-bold uppercase tracking-[0.12em] flex items-center gap-1.5 opacity-80">
                                                                    <Orbit className="w-2.5 h-2.5" /> {tech}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Score Side */}
                        <div className="lg:col-span-4 flex items-center justify-center lg:justify-end lg:border-l border-white/5 lg:pl-8">
                            <div className="relative group/score">
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="absolute inset-[-15%] rounded-full bg-secondary/15 blur-[30px]" 
                                />
                                
                                <button onClick={() => openModal({ label: "General", score, info: horoscope?.tip?.text || horoscope?.tip || t('horoscope.alignmentNeutral'), icon: <Sparkles className="w-5 h-5" />, color: currentScoreStyle.color, bg: currentScoreStyle.bg, colorHex: scoreHex, area: "general" })}
                                    className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 cursor-pointer hover:scale-105 transition-all duration-500">
                                    <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(200,136,10,0.15)]" viewBox="0 0 72 72">
                                        <circle cx="36" cy="36" r="32" fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-variant/20" />
                                        <circle cx="36" cy="36" r="32" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={prog} className="transition-all duration-[1500ms]" style={{ stroke: scoreHex }} />
                                    </svg>
                                    
                                    <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 group-hover/score:opacity-0 group-hover/score:scale-95">
                                        <span className={`text-3xl sm:text-4xl font-bold leading-none ${currentScoreStyle.color}`}>{score}</span>
                                        <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider mt-1">General</span>
                                    </div>

                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 scale-110 group-hover/score:opacity-100 group-hover/score:scale-100 transition-all duration-500">
                                        <div className="bg-secondary/10 border border-secondary/20 p-3 rounded-full mb-1">
                                            <TrendingUp className="w-5 h-5 text-secondary" />
                                        </div>
                                        <span className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] text-center leading-tight">Weekly<br/>Forecast</span>
                                    </div>

                                    <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover/score:border-secondary/30 transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* UNIFIED HEADER & STATS */}
                    <div className="px-6 sm:px-8 py-6 border-b border-white/5 grid grid-cols-1 md:grid-cols-4 gap-6 items-stretch">
                        {/* LEFT: Sign & Cramped Stats */}
                        <div className="md:col-span-2 flex flex-col justify-between">
                            <div className="mb-4 group/sign cursor-pointer overflow-hidden relative" onClick={() => onSendMessage?.(`Tell me more about ${horoscope?.user?.sign || horoscope?.sign || sign} characteristics and what they mean for me.`)}>
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-secondary" />
                                    <span className="text-[12px] font-bold text-secondary uppercase tracking-[0.2em]">{t('horoscope.personalizedForecast')}</span>
                                </div>
                                <div className="relative">
                                    <h3 className="text-2xl sm:text-4xl font-headline font-bold text-foreground leading-tight transition-all duration-500 group-hover/sign:opacity-0 group-hover/sign:-translate-y-2 flex items-baseline gap-3">
                                        <span>{translatedSign}</span>
                                    </h3>
                                    <div className="absolute inset-0 flex items-center opacity-0 translate-y-2 transition-all duration-500 group-hover/sign:opacity-100 group-hover/sign:translate-y-0">
                                        <span className="text-sm font-bold text-secondary uppercase tracking-[0.3em] flex items-center gap-2">
                                            {t('horoscope.learnMore')} <ChevronRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* CRAMPED STATS GRID */}
                            <div className="grid grid-cols-2 gap-y-3 gap-x-2 pt-4 border-t border-white/5">
                                {[
                                    { l: t('horoscope.mood'), v: horoscope?.mood?.value || horoscope?.mood || 'Neutral' }, 
                                    { l: t('horoscope.luckyColor'), v: (horoscope?.lucky?.color || horoscope?.lucky_color) ?? '—', dot: luckyColorHex }, 
                                    { l: t('horoscope.luckyNumber'), v: String((horoscope?.lucky?.number || horoscope?.lucky_number) ?? '—') }, 
                                    ...(horoscope?.planetary?.dominant_planet || horoscope?.dominant_planet ? [{ l: t('horoscope.dominant'), v: horoscope?.planetary?.dominant_planet || horoscope?.dominant_planet, sec: true }] : [])
                                ].map((s, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => onSendMessage?.(`My ${s.l} today is ${s.v}. What does this mean for my day and how should I use it?`)}
                                        className="flex flex-col gap-0.5 text-left group/stat hover:bg-white/[0.03] p-2.5 -m-2 rounded-xl transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="relative h-9">
                                            <div className="absolute inset-0 flex flex-col transition-all duration-300 group-hover/stat:-translate-y-full group-hover/stat:opacity-0">
                                                <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-[0.2em] leading-none mb-1">{s.l}</span>
                                                <div className="flex items-center gap-2">
                                                    {s.dot && <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />}
                                                    <span className={`text-[15px] sm:text-[16px] font-black ${s.sec ? 'text-secondary' : 'text-foreground/80'} truncate`}>{s.v}</span>
                                                </div>
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-between opacity-0 translate-y-full group-hover/stat:translate-y-0 group-hover/stat:opacity-100 transition-all duration-300">
                                                <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">{t('horoscope.analyze')}</span>
                                                <Sparkles className="w-4 h-4 text-secondary" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Tip of the Day (Spans Height) */}
                        <button onClick={() => handleConsult("Tip")}
                                className="md:col-span-2 p-6 sm:p-8 flex items-center gap-6 group hover:bg-secondary/[0.04] transition-all duration-500 relative overflow-hidden bg-secondary/[0.02] rounded-[24px] border border-secondary/10">
                                <div className="absolute inset-0 border-l-4 border-transparent group-hover:border-secondary transition-all duration-500" />
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 relative z-10">
                                    <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-secondary" />
                                </div>
                                <div className="flex-1 relative z-10 text-left">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="text-[12px] font-black text-secondary uppercase tracking-[0.3em] flex items-center gap-2">
                                            {t('horoscope.tipOfTheDay')}
                                        </h4>
                                        <div className="h-[1px] flex-1 bg-secondary/10" />
                                        <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">{t('horoscope.askNavi')} →</span>
                                    </div>
                                    <p className="text-[17px] sm:text-[20px] font-body font-medium italic leading-relaxed text-foreground/90 pr-4 group-hover:text-foreground transition-colors">
                                        &quot;{horoscope?.tip?.text || horoscope?.tip || t('horoscope.alignmentNeutral')}&quot;
                                    </p>
                                </div>
                        </button>
                    </div>

                    {/* NEW SECTION: Cosmic Timing & Explanations */}
                    {(horoscope?.time_triggers || horoscope?.astro_explanations?.items) && (
                        <div className="px-6 sm:px-8 py-6 border-b border-white/5 bg-secondary/[0.01]">
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Time Triggers */}
                                {horoscope?.time_triggers && horoscope.time_triggers.length > 0 && (
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1 h-3 bg-secondary rounded-full" />
                                            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">{t('horoscope.cosmicTiming')}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {horoscope.time_triggers.map((trigger, i) => (
                                                <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                                                    <div className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${trigger.type === 'growth' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                                        {trigger.start} - {trigger.end}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-foreground/90 mb-0.5">{trigger.label}</p>
                                                        <p className="text-[11px] text-foreground/40 leading-tight truncate">{trigger.advice}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Astro Explanations */}
                                {horoscope?.astro_explanations?.items && horoscope.astro_explanations.items.length > 0 && (
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="w-1 h-3 bg-secondary rounded-full" />
                                            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">{t('horoscope.celestialInsights')}</span>
                                        </div>
                                        <div className="space-y-3">
                                            {horoscope.astro_explanations.items.map((item, i) => (
                                                <div key={i} className="group/item">
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-secondary/30 mt-1.5 shrink-0 group-hover/item:bg-secondary transition-colors" />
                                                        <div className="flex flex-col">
                                                            <p className="text-xs font-medium text-foreground/70 leading-relaxed group-hover/item:text-foreground transition-colors">{item.simple}</p>
                                                            <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest mt-1 opacity-0 group-hover/item:opacity-100 transition-opacity">{item.technical}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className={`transition-all duration-700 ease-out flex-1 flex flex-col ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 flex-1">
                            {metrics.map((item, i) => (
                                <div key={i} className={`flex items-center text-left gap-6 p-6 sm:p-8 h-full transition-all duration-500 hover:bg-secondary/[0.05] relative group ${i % 2 === 0 ? 'md:border-r border-outline-variant/10' : ''} ${i < 2 ? 'border-b border-outline-variant/10' : (i < 3 ? 'border-b md:border-b-0 border-outline-variant/10' : '')}`}>
                                    
                                    {/* Subtle Gradient Background on Hover */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-secondary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                    
                                    {/* Icon: Smaller (10% reduction) and stays visible */}
                                    <div className={`w-[72px] h-[72px] sm:w-[86px] sm:h-[86px] rounded-[28px] ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 group-hover:scale-95 transition-all duration-500 relative z-10`}>
                                        {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "w-8 h-8 sm:w-10 sm:h-10" })}
                                    </div>

                                    <div className="flex-1 min-w-0 relative z-10">
                                        <div className="flex items-center justify-between mb-2 transition-all duration-500 group-hover:-translate-y-1">
                                            <span className="text-[13px] sm:text-[14px] font-black text-foreground/30 uppercase tracking-[0.25em] group-hover:text-secondary transition-colors">{item.label}</span>
                                            <div className={`text-xl sm:text-2xl font-black ${item.scoreColor} group-hover:scale-105 transition-transform`}>
                                                {item.score > 0 ? `${item.score}%` : '--'}
                                            </div>
                                        </div>

                                        <div className="relative h-[60px]">
                                            {/* Original Info - Slides up and out on hover */}
                                            <p className="text-[15px] sm:text-[17px] text-foreground/60 leading-relaxed line-clamp-2 font-medium transition-all duration-500 group-hover:-translate-y-4 group-hover:opacity-0">
                                                {item.info}
                                            </p>

                                            {/* Hover Actions: ONLY THESE ARE CLICKABLE */}
                                            <div className="absolute inset-0 flex items-center gap-4 opacity-0 translate-y-4 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none group-hover:pointer-events-auto">
                                                <button 
                                                    onClick={() => openModal({ label: item.label, score: item.score, info: item.info, icon: item.icon, color: item.iconColor, bg: item.iconBg, colorHex: item.scoreHex, area: item.area })}
                                                    className="flex-1 px-4 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-foreground font-black text-[11px] uppercase tracking-wider hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {t('horoscope.detailedForecast')} <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => onSendMessage?.(`${t('horoscope.askNaviAboutToday')} ${item.label}`)}
                                                    className="flex-[1.5] px-6 py-3.5 rounded-2xl bg-secondary text-background font-black text-[11px] uppercase tracking-widest hover:scale-105 hover:bg-amber-500 transition-all flex items-center justify-center gap-2"
                                                >
                                                    {t('horoscope.askNaviAboutToday')} {item.label} <MessageSquare className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8" onClick={() => setActiveModal(null)}>
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }} onClick={e => e.stopPropagation()}
                            className="relative w-full max-w-6xl h-full max-h-[92dvh] sm:max-h-[85vh] bg-surface rounded-[24px] sm:rounded-[32px] border border-outline-variant/20 shadow-2xl overflow-hidden flex flex-col">

                            {/* Close */}
                            <button onClick={() => setActiveModal(null)} className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-variant/30 flex items-center justify-center hover:bg-surface-variant/50 transition-colors z-[100] group">
                                <X className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-foreground/70 group-hover:text-foreground transition-colors" />
                            </button>

                            <div className="flex flex-col lg:flex-row w-full h-full min-h-0">
                                {forecastLoading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-surface via-surface-variant/5 to-surface pointer-events-none" />
                                        
                                        <div className="relative w-48 h-48 mb-8">
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-secondary/10" />
                                            <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-4 rounded-full border border-secondary/5" />
                                            <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="absolute inset-0 flex items-center justify-center">
                                                <Sparkles className="w-12 h-12 text-secondary/40" />
                                            </motion.div>
                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-0">
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(212,160,23,0.5)]" />
                                            </motion.div>
                                            <motion.div animate={{ rotate: -360 }} transition={{ duration: 7, repeat: Infinity, ease: "linear" }} className="absolute inset-4">
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-secondary/50" />
                                            </motion.div>
                                        </div>
                                        
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2 relative z-10">
                                            <h4 className="text-xl font-headline font-bold text-foreground uppercase tracking-[0.2em]">{t('horoscope.aligningStars')}</h4>
                                            <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest animate-pulse">{t('horoscope.calculatingTransits')}</p>
                                        </motion.div>
                                    </div>
                                ) : forecast && (() => {
                                    const activeDay = forecast.days.find(d => d.date === (expandedDay || forecast.days.find(today => today.is_today)?.date)) || forecast.days[0];
                                    
                                    return (
                                        <>
                                            <div className="w-full lg:w-[35%] lg:shrink-0 p-6 sm:p-8 lg:p-10 flex flex-col relative overflow-y-auto scrollbar-hide lg:border-r border-outline-variant/10 max-h-[40%] lg:max-h-full">
                                                <div className="absolute top-0 left-0 w-[150%] h-64 blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: activeModal.colorHex }} />
                                                <div className="relative z-10 flex flex-col h-full">
                                                    <div className="flex items-center gap-4 mb-4 sm:mb-6">
                                                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl ${activeModal.bg} flex items-center justify-center shrink-0 shadow-lg shadow-black/20`} style={{ color: activeModal.colorHex }}>
                                                            {activeModal.icon}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                                                                <h3 className="text-[10px] sm:text-[12px] font-bold text-foreground/40 uppercase tracking-[0.3em]">{activeModal.label}</h3>
                                                                <span className="text-[8px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-variant/20 border border-outline-variant/5 text-foreground/30 uppercase tracking-tighter">
                                                                    {activeDay.is_today ? t('horoscope.today') : fmtDay(activeDay.date)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-3xl sm:text-5xl font-headline font-bold leading-none" style={{ color: activeModal.colorHex }}>{activeDay.score}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs sm:text-sm font-body leading-relaxed text-foreground/80 mb-4 sm:mb-8">{activeModal.info}</p>
                                                    {activeDay.personalized_alerts?.length > 0 && (
                                                        <div className="mb-4 sm:mb-auto p-4 sm:p-5 rounded-2xl bg-surface-variant/10 border border-outline-variant/10 shadow-inner">
                                                            <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-outline-variant/10">
                                                                <div className="flex items-center gap-2">
                                                                    <Info className="w-3.5 h-3.5" style={{ color: activeModal.colorHex }} />
                                                                    <span className="text-[10px] sm:text-[11px] font-bold text-foreground/50 uppercase tracking-widest">{activeDay.is_today ? t('horoscope.today') : fmtDay(activeDay.date)}&apos;s Alerts</span>
                                                                </div>
                                                                <span className="text-[9px] sm:text-[10px] font-bold text-foreground/30 px-1.5 py-0.5 rounded-md bg-surface-variant/20 border border-outline-variant/5">🪐 {activeDay.dominant_planet}</span>
                                                            </div>
                                                            <div className="space-y-2 sm:space-y-3">
                                                                {activeDay.personalized_alerts.slice(0, 4).map((alert, i) => {
                                                                    const isObject = typeof alert === 'object' && alert !== null;
                                                                    const simpleText = (isObject ? (alert as any).simple : alert) || 'Cosmic alignment in progress';
                                                                    const techText = isObject ? (alert as any).technical : null;
                                                                    const isWarning = simpleText.toLowerCase().includes('challenging') || simpleText.toLowerCase().includes('mindful') || simpleText.toLowerCase().includes('caution');
                                                                    return (
                                                                        <div key={i} className="flex items-start gap-2 sm:gap-3 group/alert">
                                                                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: isWarning ? '#fbbf24' : activeModal.colorHex }} />
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className="text-[11px] sm:text-[12px] text-foreground/60 leading-snug">{simpleText}</span>
                                                                                {techText && <span className="text-[9px] sm:text-[10px] text-foreground/25 font-bold uppercase tracking-widest mt-1 opacity-0 group-hover/alert:opacity-100 transition-opacity duration-300">{techText}</span>}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    <button onClick={() => handleConsult(activeModal.label)} className="w-full mt-4 sm:mt-8 flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-secondary text-background font-bold text-sm sm:text-base hover:bg-secondary/90 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0 shrink-0">
                                                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" /> {t('horoscope.askNavi')} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="w-full lg:w-[65%] flex-1 lg:shrink-0 bg-surface-variant/5 flex flex-col min-h-0 relative overflow-hidden">
                                                <div className="p-4 sm:p-8 pb-2 sm:pb-4 shrink-0">
                                                    <div className="flex items-center justify-between mb-2 sm:mb-4">
                                                        <span className="text-[10px] sm:text-[11px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 sm:w-4 h-4" style={{ color: activeModal.colorHex }} /> 7-Day Trajectory</span>
                                                        <div className="flex gap-2 sm:gap-3">
                                                            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/10 text-[10px] font-bold bg-surface"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeModal.colorHex }} /><span className="text-foreground/40">{t('horoscope.peakLabel')}:</span><span style={{ color: activeModal.colorHex }}>{fmtDate(forecast.summary.best_day)}</span></div>
                                                            <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-outline-variant/10 text-[9px] sm:text-[10px] font-bold bg-surface"><span className="text-foreground/40">{t('horoscope.trendLabel')}:</span><span className="text-foreground/70 capitalize">{forecast.summary.trend === 'improving' ? '📈' : forecast.summary.trend === 'declining' ? '📉' : '➡️'} {forecast.summary.trend}</span></div>
                                                        </div>
                                                    </div>
                                                    <div className="h-20 sm:h-28 w-full relative px-4 sm:px-8"><MiniChart days={forecast.days} colorHex={activeModal.colorHex} activeDate={activeDay.date} /></div>
                                                </div>
                                                <div className="px-8 h-[1px] bg-outline-variant/5 shrink-0" />
                                                <div className="flex flex-col flex-1 min-h-0 p-4 sm:p-10 pt-2 sm:pt-4">
                                                    <div className="flex items-center justify-between mb-4 sm:mb-6 px-2"><span className="text-[10px] sm:text-[11px] font-black text-foreground/20 uppercase tracking-[0.25em]">{t('horoscope.interactiveTimeline')}</span><div className="flex gap-4"><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500/50" /><span className="text-[9px] font-bold text-foreground/30 uppercase">{t('horoscope.high')}</span></div><div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-500/50" /><span className="text-[9px] font-bold text-foreground/30 uppercase">{t('horoscope.lowLabel')}</span></div></div></div>
                                                    <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-6 sm:mb-10 shrink-0">
                                                        {forecast.days.map(day => {
                                                            const isSelected = activeDay.date === day.date;
                                                            const dateObj = new Date(day.date + 'T00:00:00');
                                                            const dayNum = dateObj.getDate();
                                                            const isHigh = day.score >= 75;
                                                            const isLow = day.score <= 45;
                                                            return (
                                                                <motion.button key={day.date} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={() => setExpandedDay(day.date)} className={`relative group flex flex-col items-center p-2 sm:p-4 rounded-[16px] sm:rounded-[20px] border transition-all duration-500 cursor-pointer overflow-hidden ${isSelected ? 'bg-surface shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-30' : 'bg-surface/30 border-white/5 hover:border-white/20 z-10'}`} style={{ borderColor: isSelected ? activeModal.colorHex + '40' : undefined, boxShadow: isSelected ? `0 10px 30px -10px ${activeModal.colorHex}20` : undefined }}>
                                                                    {isSelected && <motion.div layoutId="activeDayBg" className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.03] pointer-events-none" />}
                                                                    <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1 sm:mb-2 transition-colors ${isSelected ? '' : 'text-foreground/30 group-hover:text-foreground/60'}`} style={{ color: isSelected ? activeModal.colorHex : undefined }}>{day.is_today ? 'TODAY' : fmtDay(day.date)}</span>
                                                                    <span className={`text-lg sm:text-2xl font-headline font-bold mb-1 sm:mb-2 transition-all ${isSelected ? 'scale-110 text-foreground' : 'text-foreground/40'}`}>{dayNum}</span>
                                                                    <div className={`w-full h-1 rounded-full overflow-hidden bg-white/5 mt-auto relative`}><motion.div initial={{ width: 0 }} animate={{ width: `${day.score}%` }} className="absolute inset-0 rounded-full" style={{ backgroundColor: isSelected ? activeModal.colorHex : (isHigh ? '#22c55e' : isLow ? '#ef4444' : '#94a3b840') }} /></div>
                                                                    {isSelected && <motion.div layoutId="bottomIndicator" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full" style={{ backgroundColor: activeModal.colorHex }} />}
                                                                </motion.button>
                                                            );
                                                        })}
                                                    </div>
                                                    <motion.div key={activeDay.date} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 min-h-0 flex flex-col relative">
                                                        <div className="absolute -inset-6 bg-gradient-to-br from-secondary/5 to-transparent blur-3xl opacity-20 pointer-events-none rounded-[40px]" />
                                                        <div className="relative flex-1 flex flex-col p-6 sm:p-10 rounded-[28px] sm:rounded-[36px] bg-surface/40 backdrop-blur-sm border border-white/5 shadow-2xl overflow-hidden group">
                                                            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-[80px] rounded-full -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" />
                                                            <div className="relative z-10 flex flex-col h-full">
                                                                <div className="flex items-center justify-between mb-6 sm:mb-8">
                                                                    <div className="flex flex-col"><span className="text-[10px] sm:text-[11px] font-black text-secondary uppercase tracking-[0.3em] mb-1">{t('horoscope.detailedInsight')}</span><h4 className="text-xl sm:text-2xl font-headline font-bold text-foreground">{fmtDate(activeDay.date)}</h4></div>
                                                                    <div className="flex items-center gap-3"><div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3"><div className="flex flex-col items-end"><span className="text-[8px] font-bold text-foreground/30 uppercase tracking-widest">{t('horoscope.dominantForce')}</span><span className="text-xs font-bold text-foreground/80">{activeDay.dominant_planet}</span></div><div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-secondary" /></div></div></div>
                                                                </div>
                                                                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pr-2">
                                                                    <p className="text-sm sm:text-lg text-foreground/90 leading-relaxed font-medium mb-8 sm:mb-10 selection:bg-secondary/30">&ldquo;{activeDay.text}&rdquo;</p>
                                                                    {activeDay.transits && (
                                                                        <div className="space-y-4 sm:space-y-6">
                                                                            <div className="flex items-center gap-4"><span className="text-[10px] sm:text-[11px] font-black text-foreground/20 uppercase tracking-[0.4em] whitespace-nowrap">{t('horoscope.planetaryAlignment')}</span><div className="h-[1px] w-full bg-white/5" /></div>
                                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                                                                {Object.entries(activeDay.transits).map(([planet, tObj]) => (
                                                                                    <motion.div key={planet} whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors">
                                                                                        <div className="flex flex-col"><span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-0.5">{planet}</span><span className="text-xs font-bold text-secondary">{(tObj as { sign: string }).sign}</span></div>
                                                                                        <div className="flex flex-col items-end"><span className="text-[8px] font-bold text-foreground/20 uppercase">{t('horoscope.house')}</span><span className="text-xs font-headline font-bold text-foreground/60">{ (tObj as { house_from_lagna: number }).house_from_lagna }</span></div>
                                                                                    </motion.div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}
