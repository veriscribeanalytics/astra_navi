'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { clientFetch } from '@/lib/apiClient';
import Card from '@/components/ui/Card';
import { 
    Trophy, Sun, Heart, Gem, 
    Info, Sparkles, X, 
    ArrowRight, MessageSquare, Orbit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/hooks';
import ScoreRing from '@/components/ui/ScoreRing';

interface HoroscopeArea {
    value: number;
    insight?: string;
}

interface HoroscopeData {
    user?: { sign: string; name: string };
    meta?: { date: string; date_display: string; generated_at: string };
    score?: {
        overall: number;
        areas: {
            career: HoroscopeArea;
            love: HoroscopeArea;
            health: HoroscopeArea;
            finance: HoroscopeArea;
            general: HoroscopeArea;
        };
    };
    lucky?: { color: string; number: number };
    mood?: string | { value: string; type: string };
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
    tip?: string | { text: string; type: string };
    today_scores?: Record<string, number>;
}

interface ForecastDay {
    date: string;
    score: number;
    text: string;
    dominant_planet: string;
    is_today: boolean;
    transits: Record<string, { sign: string; house_from_lagna: number }>;
    personalized_alerts: (string | { technical: string; simple: string })[];
}

interface ForecastData {
    days: ForecastDay[];
    moon_sign: string;
}

export default function DailyHoroscopeCard({ userLoading, onSendMessage }: { userLoading: boolean, onSendMessage?: (q: string) => void }) {
    const { user } = useAuth();
    const { t } = useTranslation();
    const router = useRouter();
    const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeAlertIdx, setActiveAlertIdx] = useState(0);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [showContent, setShowContent] = useState(false);
    
    // Modal states
    const [activeModal, setActiveModal] = useState<{ id: string; label: string; icon: React.ReactNode; colorHex: string; bg: string } | null>(null);
    const [forecastData, setForecastData] = useState<ForecastData | null>(null);
    const [forecastLoading, setForecastLoading] = useState(false);

    const currentSign = horoscope?.user?.sign || user?.moonSign || 'Aries';
    const translatedSign = t(`signs.${currentSign.toLowerCase()}`);

    const forecastDataCacheRef = useRef<Map<string, ForecastData>>(new Map());
    const lastSignRef = useRef<string | undefined>('');

    // ─── Fetch Data ─────────────────────────────
    useEffect(() => {
        async function fetchHoroscope() {
            if (userLoading) return;
            try {
                setLoading(true);
                const res = await clientFetch('/api/horoscope-general');
                if (res.ok) {
                    const data = await res.json();
                    setHoroscope(data);
                } else {
                    const err = await res.json();
                    setError(err.error || 'The cosmos are silent.');
                }
            } catch (err) {
                console.error("Horoscope fetch error:", err);
                setError('Unable to reach the celestial servers.');
            } finally {
                setLoading(false);
            }
        }
        fetchHoroscope();
    }, [user?.email, userLoading]);

    useEffect(() => {
        if (!loading && horoscope) {
            const score = horoscope.score?.overall ?? horoscope.today_scores?.general ?? horoscope.overall_score ?? 0;
            const timer = setTimeout(() => { setAnimatedScore(score); }, 300);
            return () => clearTimeout(timer);
        }
    }, [loading, horoscope]);

    useEffect(() => {
        if (!loading && horoscope && !userLoading) {
            const timer = setTimeout(() => { setShowContent(true); }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading, horoscope, userLoading]);

    // Cycle alerts
    useEffect(() => {
        if (!horoscope?.alerts) return;
        const total = (horoscope.alerts.secondary?.length || 0) + 1;
        if (total <= 1) return;
        
        const interval = setInterval(() => {
            setActiveAlertIdx(prev => (prev + 1) % total);
        }, 5000);
        return () => clearInterval(interval);
    }, [horoscope]);

    // ─── Score Color Logic ─────────────────────────────
    const getScoreStyle = useCallback((s: number) => {
        if (s >= 85) return { color: 'text-green-600', bg: 'bg-green-600/10', hex: '#16a34a', label: t('horoscope.excellent') };
        if (s >= 70) return { color: 'text-green-400', bg: 'bg-green-400/10', hex: '#4ade80', label: t('horoscope.good') };
        if (s >= 50) return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', hex: '#eab308', label: t('horoscope.fair') };
        return { color: 'text-red-500', bg: 'bg-red-500/10', hex: '#ef4444', label: t('horoscope.low') };
    }, [t]);

    const metrics = useMemo(() => {
        const areas = (horoscope?.score?.areas || {}) as Record<string, HoroscopeArea>;
        const areasText = (horoscope?.areas_text || {}) as Record<string, { insight: string; tone: string }>;
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
                color: scoreStyle.color,
                bg: scoreStyle.bg,
                colorHex: theme.hex
            };
        });
    }, [horoscope, getScoreStyle]);

    // ─── Modal & Forecast Logic ─────────────────────────────
    const fetchForecast = async () => {
        const sign = currentSign;
        if (!sign) return;
        
        if (forecastDataCacheRef.current.has(sign) && lastSignRef.current === sign) {
            setForecastData(forecastDataCacheRef.current.get(sign)!);
            return;
        }

        try {
            setForecastLoading(true);
            const res = await clientFetch(`/api/forecast?sign=${sign}`);
            if (res.ok) {
                const data = await res.json();
                setForecastData(data);
                forecastDataCacheRef.current.set(sign, data);
                lastSignRef.current = sign;
            }
        } catch (e) {
            console.error("Forecast error:", e);
        } finally {
            setForecastLoading(false);
        }
    };

    const handleOpenModal = (metric: { area: string; label: string; icon: React.ReactNode; colorHex: string; bg: string }) => {
        setActiveModal({ id: metric.area, label: metric.label, icon: metric.icon, colorHex: metric.colorHex, bg: metric.bg });
        fetchForecast();
    };

    const handleQuickAsk = (question: string) => {
        if (onSendMessage) {
            onSendMessage(question);
        } else {
            localStorage.setItem('astranavi_pending_message', question);
            router.push('/chat');
        }
    };

    const fmtDay = (dateStr: string) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
    const fmtDate = (dateStr: string) => new Date(dateStr + 'T00:00:00').toLocaleDateString('en', { day: 'numeric', month: 'short' });

    // ─── Rendering ─────────────────────────────
    if (loading || !showContent) return <Card padding="none" className="!rounded-[24px] sm:!rounded-[32px] overflow-hidden border-outline-variant/10 h-[380px] sm:h-[420px] animate-pulse bg-surface/30"><div className="h-full w-full flex items-center justify-center"><div className="flex flex-col items-center gap-4"><div className="w-12 h-12 rounded-full border-2 border-secondary/20 border-t-secondary animate-spin" /><p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">{t('horoscope.aligningStars')}</p></div></div></Card>;

    if (error && !horoscope) return <Card padding="md" className="!rounded-[24px] sm:!rounded-[32px]"><div className="h-64 flex flex-col items-center justify-center gap-4 text-center px-6"><div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center"><Sparkles className="w-8 h-8 text-orange-500" /></div><h3 className="text-lg font-headline font-bold text-foreground mb-2">Service Temporarily Unavailable</h3><p className="text-sm text-foreground/60">{error || 'Unable to load forecast.'}</p></div></Card>;

    return (
        <Card padding="none" className="!rounded-[24px] sm:!rounded-[32px] overflow-hidden border-outline-variant/20 bg-surface/40 backdrop-blur-xl group/card shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-secondary/5 transition-all duration-700">
            <div className="grid grid-cols-1 md:grid-cols-12 h-full">
                
                {/* Left Side: Score & Primary Info */}
                <div className="md:col-span-5 p-6 sm:p-8 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
                    
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black text-secondary uppercase tracking-[0.25em]">{t('horoscope.personalizedForecast')}</span>
                            </div>
                            <h3 className="text-2xl font-headline font-bold text-foreground flex items-center gap-2">
                                {translatedSign} <span className="text-foreground/20 font-light">/</span> <span className="text-lg text-foreground/40">{t('horoscope.today')}</span>
                            </h3>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center py-4">
                        <div className="relative group/score scale-110 sm:scale-125 mb-4">
                            <div className="absolute inset-0 rounded-full bg-secondary/5 blur-2xl group-hover/score:bg-secondary/10 transition-all duration-500" />
                            <ScoreRing score={animatedScore} tier={getScoreStyle(animatedScore)} size={110} label="" />
                        </div>
                        <p className="text-[11px] font-bold text-foreground/30 uppercase tracking-[0.2em] mt-8">{t('horoscope.yourDayToday')}</p>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-foreground/25 uppercase tracking-widest mb-1">{t('horoscope.luckyColor')}</p>
                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/5">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: horoscope?.lucky?.color || horoscope?.lucky_color || '#D4AF37' }} />
                                    <span className="text-[10px] font-bold text-foreground/70 uppercase">{horoscope?.lucky?.color || horoscope?.lucky_color || 'Gold'}</span>
                                </div>
                            </div>
                            <div className="w-px h-8 bg-white/5" />
                            <div className="text-center">
                                <p className="text-[9px] font-black text-foreground/25 uppercase tracking-widest mb-1">{t('horoscope.luckyNumber')}</p>
                                <span className="text-sm font-headline font-bold text-secondary">{horoscope?.lucky?.number || horoscope?.lucky_number || '7'}</span>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-surface-variant/30 flex items-center justify-center text-foreground/20 border border-white/5">
                             <Orbit className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Right Side: Insights & Actions */}
                <div className="md:col-span-7 bg-black/10 backdrop-blur-md p-6 sm:p-8 flex flex-col border-l border-white/5">
                    
                    {/* Insights Slider */}
                    <div className="mb-8 relative h-24 sm:h-28">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={activeAlertIdx}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.5, ease: "circOut" }}
                                className="absolute inset-0 flex flex-col justify-center"
                            >
                                {(() => {
                                    const allAlerts = [
                                        horoscope?.alerts?.primary,
                                        ...(horoscope?.alerts?.secondary || [])
                                    ].filter(Boolean);
                                    
                                    const alert = allAlerts[activeAlertIdx] || { simple: t('horoscope.alignmentNeutral') };
                                    const simple = (alert as { simple: string }).simple;
                                    const tech = (alert as { technical?: string }).technical;
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

                    {/* Quick Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
                        {metrics.map((m, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleOpenModal(m)}
                                className="group/btn flex flex-col p-3 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-secondary/30 hover:bg-secondary/5 transition-all duration-300 text-left active:scale-[0.97]"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-8 h-8 rounded-xl ${m.iconBg} flex items-center justify-center transition-transform group-hover/btn:scale-110`}>
                                        {m.icon}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xs font-headline font-bold ${m.color}`}>{m.score}</span>
                                        <div className="w-8 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                            <div className={`h-full ${m.bg.replace('/10', '')}`} style={{ width: `${m.score}%` }} />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest">{m.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tip Row */}
                    <div className="mt-auto group cursor-pointer" onClick={() => handleQuickAsk(`Explain my tip: "${typeof horoscope?.tip === 'object' ? horoscope.tip.text : (horoscope?.tip || 'Follow the cosmic flow')}"`)}>
                        <div className="p-4 sm:p-5 rounded-3xl bg-secondary/5 border border-secondary/10 hover:border-secondary/30 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                                <Sparkles className="w-8 h-8 text-secondary" />
                            </div>
                            <span className="text-[9px] font-black text-secondary uppercase tracking-[0.3em] mb-2 block">{t('horoscope.tipOfTheDay')}</span>
                            <div className="flex items-start gap-4">
                                <p className="text-[14px] sm:text-[16px] font-body font-medium italic leading-relaxed text-foreground/80 pr-6">
                                    &quot;{typeof horoscope?.tip === 'object' ? horoscope.tip.text : (horoscope?.tip || t('horoscope.alignmentNeutral'))}&quot;
                                </p>
                                <div className="mt-1 w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 group-hover:bg-secondary group-hover:text-white transition-all">
                                    <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* EXPANDED MODAL OVERLAY */}
            <AnimatePresence>
                {activeModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 lg:p-8">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)} />
                        
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-4xl bg-surface border border-outline-variant/20 rounded-[32px] sm:rounded-[48px] overflow-hidden shadow-2xl">
                            {/* Modal Header */}
                            <div className="p-6 sm:p-8 border-b border-outline-variant/10 flex items-center justify-between bg-gradient-to-b from-white/[0.03] to-transparent">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-[20px] sm:rounded-[24px] ${activeModal.bg} flex items-center justify-center shadow-lg`}>{activeModal.icon}</div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] sm:text-[11px] font-black text-secondary uppercase tracking-[0.3em]">{activeModal.label} {t('horoscope.peakLabel')}</span>
                                            <div className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-[9px] font-bold">LIVE</div>
                                        </div>
                                        <h3 className="text-2xl sm:text-4xl font-headline font-bold text-foreground tracking-tight">{t('horoscope.celestialInsights')}</h3>
                                    </div>
                                </div>
                                <button onClick={() => setActiveModal(null)} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-foreground/40 hover:text-foreground hover:bg-white/10 transition-all active:scale-90"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                                {/* Modal Left: Detailed Trend */}
                                <div className="lg:col-span-5 p-6 sm:p-8 bg-black/20 border-r border-outline-variant/10">
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4"><span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">{t('horoscope.interactiveTimeline')}</span><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-secondary" /><span className="text-[10px] font-bold text-secondary uppercase">{activeModal.label} Flow</span></div></div>
                                        
                                        <div className="relative h-48 flex items-end justify-between gap-1 sm:gap-2 px-2 pb-8 pt-4">
                                            {forecastLoading ? (
                                                <div className="absolute inset-0 flex items-center justify-center"><div className="w-8 h-8 border-2 border-secondary/20 border-t-secondary rounded-full animate-spin" /></div>
                                            ) : forecastData?.days.map((day, i) => (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                                                    <div className="relative w-full flex flex-col items-center">
                                                        <div className={`w-full max-w-[12px] sm:max-w-[16px] rounded-t-full transition-all duration-1000 ease-out delay-[${i*100}ms] ${day.is_today ? 'bg-secondary' : 'bg-white/10 group-hover/bar:bg-white/20'}`} style={{ height: day ? `${day.score}%` : '10%' }}>
                                                            {day.is_today && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff]" />}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-[9px] font-black tracking-tighter ${day.is_today ? 'text-secondary' : 'text-foreground/20'}`}>{day.is_today ? t('horoscope.today') : fmtDay(day.date)}</span>
                                                        <span className="text-[8px] font-bold text-foreground/10">{new Date(day.date + 'T00:00:00').getDate()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 group/link cursor-pointer" onClick={() => handleQuickAsk(`Tell me about my ${activeModal.label} for the next 7 days.`)}>
                                            <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">{t('horoscope.trendLabel')}</span><TrendingUp className="w-3 h-3 text-green-400" /></div>
                                            <div className="flex items-baseline gap-2"><span className="text-lg font-headline font-bold text-foreground uppercase tracking-tight">{t('horoscope.excellent')}</span><ArrowRight className="w-3 h-3 text-secondary opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-1 transition-all" /></div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 group/link cursor-pointer" onClick={() => handleQuickAsk(`What is the ${activeModal.label} dominant force for me today?`)}>
                                            <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-black text-foreground/30 uppercase tracking-widest">{t('horoscope.dominantForce')}</span><Orbit className="w-3 h-3 text-secondary" /></div>
                                            <div className="flex items-baseline gap-2"><span className="text-lg font-headline font-bold text-foreground uppercase tracking-tight">{horoscope?.planetary?.dominant_planet || 'Jupiter'}</span><ArrowRight className="w-3 h-3 text-secondary opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-1 transition-all" /></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Right: Insight Content */}
                                <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col min-h-0 max-h-[500px] sm:max-h-none">
                                    {forecastLoading ? (
                                        <div className="flex-1 flex flex-col gap-6"><div className="h-6 w-1/3 bg-white/5 rounded-full animate-pulse" /><div className="h-32 w-full bg-white/5 rounded-3xl animate-pulse" /><div className="h-40 w-full bg-white/5 rounded-3xl animate-pulse" /></div>
                                    ) : (() => {
                                        const activeDay = forecastData?.days.find(d => d.is_today);
                                        if (!activeDay) return <div className="flex-1 flex items-center justify-center text-foreground/20 italic">{t('horoscope.aligningStars')}</div>;
                                        
                                        return (
                                            <div className="flex flex-col h-full">
                                                <div className="flex items-start justify-between mb-6 sm:mb-8">
                                                    <div className="flex flex-col"><span className="text-[10px] sm:text-[11px] font-black text-secondary uppercase tracking-[0.3em] mb-1">{t('horoscope.detailedInsight')}</span><h4 className="text-xl sm:text-2xl font-headline font-bold text-foreground">{fmtDate(activeDay.date)}</h4></div>
                                                    <div className="flex items-center gap-3"><div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3"><div className="flex flex-col items-end"><span className="text-[8px] font-bold text-foreground/30 uppercase tracking-widest">{t('horoscope.dominantForce')}</span><span className="text-xs font-bold text-foreground/80">{activeDay.dominant_planet}</span></div><div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center"><Sparkles className="w-5 h-5 text-secondary" /></div></div></div>
                                                </div>
                                                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pr-2">
                                                    <p className="text-sm sm:text-lg text-foreground/90 leading-relaxed font-medium mb-8 sm:mb-10 selection:bg-secondary/30">&ldquo;{activeDay.text}&rdquo;</p>
                                                    
                                                    {/* Custom Section for Alerts */}
                                                    <div className="mb-8">
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
                                                                const simpleText = (isObject ? (alert as { simple: string }).simple : alert) || 'Cosmic alignment in progress';
                                                                const techText = isObject ? (alert as { technical?: string }).technical : null;
                                                                const isWarning = typeof simpleText === 'string' && (simpleText.toLowerCase().includes('challenging') || simpleText.toLowerCase().includes('mindful') || simpleText.toLowerCase().includes('caution'));
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

                                                    {activeDay.transits && (
                                                        <div className="space-y-4 sm:space-y-6">
                                                            <div className="flex items-center gap-4"><span className="text-[10px] sm:text-[11px] font-black text-foreground/20 uppercase tracking-[0.4em] whitespace-nowrap">{t('horoscope.planetaryAlignment')}</span><div className="h-[1px] w-full bg-white/5" /></div>
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                                                {Object.entries(activeDay.transits).map(([planet, tObj]) => (
                                                                    <motion.div key={planet} whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }} className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors">
                                                                        <div className="flex flex-col"><span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-0.5">{planet}</span><span className="text-xs font-bold text-secondary">{(tObj as { sign: string }).sign}</span></div>
                                                                        <div className="flex flex-col items-end"><span className="text-[8px] font-bold text-foreground/20 uppercase">{t('horoscope.house')}</span><span className="text-xs font-headline font-bold text-foreground/60">{(tObj as { house_from_lagna: number }).house_from_lagna}</span></div>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between gap-4">
                                                    <p className="text-[9px] sm:text-[10px] font-bold text-foreground/25 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3" /> {t('common.onlineNow')}</p>
                                                    <button onClick={() => handleQuickAsk(`Provide a deep dive into my today's ${activeModal.label} forecast.`)} className="px-6 py-2.5 rounded-xl bg-secondary text-white text-[11px] sm:text-[13px] font-bold uppercase tracking-widest hover:bg-secondary/80 transition-all flex items-center gap-3 active:scale-95 shadow-lg shadow-secondary/20">
                                                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" /> {t('horoscope.askNavi')} <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

function TrendingUp(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="22 7 13.5 16 8.5 11 2 16" />
            <polyline points="16 7 22 7 22 13" />
        </svg>
    )
}
