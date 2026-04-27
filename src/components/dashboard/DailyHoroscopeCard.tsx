'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { Sparkles, Heart, Briefcase, Activity, DollarSign, X, MessageSquare, ArrowRight, TrendingUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HoroscopeData {
    sign?: string; date?: string; overall_score?: number; mood?: string;
    lucky_color?: string; lucky_number?: number; career?: string; love?: string;
    health?: string; finance?: string; tip?: string; dominant_planet?: string;
    today_scores?: Record<string, number>;
    date_display?: string;
    text?: string;
    is_personalized?: boolean;
    personalized_alerts?: (string | { technical: string; simple: string })[];
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
function MiniChart({ days, colorHex, activeDate, onSelect }: { days: ForecastDay[]; colorHex: string; activeDate?: string; onSelect?: (date: string) => void }) {
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

// ─── Module Level Cache (Persists across re-mounts) ──────────────────
const GLOBAL_FETCH_CACHE = new Set<string>();

export default function DailyHoroscopeCard({ sign, isGeneral, userLoading }: { sign?: string; isGeneral?: boolean; userLoading?: boolean }) {
    const router = useRouter();
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
    const lastSignRef = useRef<string | undefined>('');
    const lastFetchedUrlRef = useRef<string>('');

    const today = new Date();
    const dateString = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
    const dayName = today.toLocaleDateString('en-IN', { weekday: 'long' });

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
                const res = await fetch(url);
                if (!res.ok) { const ed = await res.json().catch(() => ({})); throw new Error(ed.error || 'Failed'); }
                const data = await res.json();
                
                // If sign changed, clear local scores
                if (sign !== lastSignRef.current) {
                    lastSignRef.current = sign;
                }
                
                setHoroscope(data); 
                setError(null);
            } catch (err: any) { 
                setError(err.message); 
                // Reset lastFetchedUrl on error to allow retry
                lastFetchedUrlRef.current = '';
            }
            finally { setLoading(false); }
        })();
    }, [sign, isGeneral, userLoading]);

    useEffect(() => {
        if (!horoscope?.personalized_alerts || horoscope.personalized_alerts.length <= 1) return;
        const int = setInterval(() => {
            setActiveAlertIdx(prev => (prev + 1) % horoscope.personalized_alerts!.length);
        }, 5000);
        return () => clearInterval(int);
    }, [horoscope?.personalized_alerts]);

    useEffect(() => {
        if (userLoading) return;
        if (!loading && horoscope) {
            // Set initial animated score from basic horoscope while we fetch detailed ones
            setAnimatedScore(horoscope.overall_score || 0);
            
            const t = setTimeout(() => { setShowContent(true); }, 100);
            
            return () => clearTimeout(t);
        }
    }, [loading, horoscope]);

    // Priority: 1. Real General Score, 2. Basic Horoscope Score, 3. Zero
    const score = horoscope?.today_scores?.general ?? horoscope?.overall_score ?? 0;
    const scoreHex = score >= 80 ? '#D4A017' : score >= 60 ? '#E8832A' : '#E84A2A';
    const circ = 2 * Math.PI * 32;
    const prog = circ - (animatedScore / 100) * circ;
    const scoreColor = (s: number) => s >= 75 ? 'text-green-500' : s >= 50 ? 'text-yellow-500' : 'text-orange-500';

    const metrics = useMemo(() => {
        // Fallback to deriving scores from overall_score if today_scores not present
        const baseScore = horoscope?.overall_score ?? 0;
        const deriveScore = (mod: number) => baseScore ? Math.min(100, Math.max(40, baseScore + mod)) : 0;
        const scores = horoscope?.today_scores || {};
        
        return [
            { label: "Career", score: scores.career ?? deriveScore(5), info: horoscope?.career || 'Loading career forecast...', icon: <Briefcase className="w-5 h-5" />, color: "text-orange-500", bg: "bg-orange-500/10", colorHex: "#f97316", area: "career" },
            { label: "Health", score: scores.health ?? deriveScore(-2), info: horoscope?.health || 'Loading health forecast...', icon: <Activity className="w-5 h-5" />, color: "text-green-500", bg: "bg-green-500/10", colorHex: "#22c55e", area: "health" },
            { label: "Love", score: scores.love ?? deriveScore(3), info: horoscope?.love || 'Loading love forecast...', icon: <Heart className="w-5 h-5" />, color: "text-pink-500", bg: "bg-pink-500/10", colorHex: "#ec4899", area: "love" },
            { label: "Finance", score: scores.finance ?? deriveScore(1), info: horoscope?.finance || 'Loading finance forecast...', icon: <DollarSign className="w-5 h-5" />, color: "text-amber-500", bg: "bg-amber-500/10", colorHex: "#f59e0b", area: "finance" },
        ];
    }, [horoscope]);

    const luckyColorHex = useMemo(() => {
        const lc = horoscope?.lucky_color?.toLowerCase() || '';
        if (!lc) return '#94a3b8';
        const fam = [['pink','rose','magenta','#f472b6'],['red','maroon','crimson','#dc2626'],['blue','navy','indigo','cyan','#2563eb'],['green','emerald','teal','#059669'],['yellow','saffron','gold','amber','#f59e0b'],['orange','peach','coral','#ea580c'],['purple','violet','lavender','#7c3aed'],['white','cream','ivory','#ffffff'],['black','charcoal','#111827'],['grey','gray','silver','#94a3b8']];
        const m = fam.find(f => f.slice(0, -1).some(k => lc.includes(k)));
        return m ? m[m.length - 1] : '#fbbf24';
    }, [horoscope?.lucky_color]);

    const openModal = (item: ModalData) => {
        setActiveModal(item); setForecast(null); setExpandedDay(null);
        // Auto-fetch forecast
        setForecastLoading(true);
        fetch(`/api/forecast/${item.area}?days_back=3&days_forward=3`)
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) setForecast(d); })
            .catch(() => {})
            .finally(() => setForecastLoading(false));
    };

    const handleConsult = (topic: string) => {
        localStorage.setItem('astranavi_pending_message', `Tell me more about my ${topic.toLowerCase()} forecast for today`);
        router.push('/chat');
    };

    const fmtDate = (ds: string) => new Date(ds + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    const fmtDay = (ds: string) => new Date(ds + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });

    if (loading) return <Card padding="md" className="!rounded-[24px] sm:!rounded-[32px] animate-pulse"><div className="h-64 flex items-center justify-center"><Sparkles className="w-8 h-8 text-secondary animate-spin" /></div></Card>;
    if (error || !horoscope) return <Card padding="md" className="!rounded-[24px] sm:!rounded-[32px]"><div className="h-64 flex flex-col items-center justify-center gap-4 text-center px-6"><div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center"><Sparkles className="w-8 h-8 text-orange-500" /></div><h3 className="text-lg font-headline font-bold text-foreground mb-2">Service Temporarily Unavailable</h3><p className="text-sm text-foreground/60">{error || 'Unable to load forecast.'}</p></div></Card>;

    const displayDate = horoscope.date_display || dateString;
    const firstAlert = horoscope.personalized_alerts?.[0];
    const firstAlertSimple = firstAlert ? (typeof firstAlert === 'object' ? firstAlert.simple : firstAlert) : null;
    const firstAlertTech = firstAlert && typeof firstAlert === 'object' ? firstAlert.technical : null;

    return (
        <div className="flex flex-col gap-3">
            {horoscope.personalized_alerts && horoscope.personalized_alerts.length > 0 && (
                <div className="p-6 sm:p-8 rounded-[32px] sm:rounded-[40px] bg-surface border border-secondary/20 flex items-center gap-5 overflow-hidden relative shadow-[0_15px_30px_rgba(0,0,0,0.1)]">
                    <div className="absolute left-0 top-0 w-2 h-full bg-secondary" />
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6 sm:w-8 h-8 text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center relative h-[50px] sm:h-[60px]">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">How Your Day Today</span>
                            {horoscope.personalized_alerts.length > 1 && (
                                <div className="flex gap-1">
                                    {horoscope.personalized_alerts.map((_, i) => (
                                        <div key={i} className={`w-1 h-1 rounded-full transition-colors ${i === activeAlertIdx ? 'bg-secondary' : 'bg-secondary/20'}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative flex-1">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeAlertIdx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    className="absolute inset-0 flex flex-col justify-center"
                                >
                                    {(() => {
                                        const alert = horoscope.personalized_alerts![activeAlertIdx];
                                        const simple = typeof alert === 'object' ? alert.simple : alert;
                                        const tech = typeof alert === 'object' ? alert.technical : null;
                                        return (
                                            <>
                                                <p className="text-sm sm:text-lg text-secondary font-bold leading-snug line-clamp-1">{simple}</p>
                                                {tech && (
                                                    <p className="text-[10px] sm:text-[12px] text-secondary/60 font-bold uppercase tracking-[0.2em] mt-1 truncate">
                                                        🪐 {tech}
                                                    </p>
                                                )}
                                            </>
                                        );
                                    })()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            )}

            <Card padding="none" className="!rounded-[24px] sm:!rounded-[32px] overflow-hidden relative bg-surface border-secondary/10">
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-white/5 bg-transparent">
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 sm:gap-4 relative">
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <TrendingUp className="w-3 h-3 text-secondary" />
                                <span className="text-[12px] font-bold text-secondary uppercase tracking-[0.15em]">Daily Forecast</span>
                            </div>
                            {!isGeneral && <h3 className="text-xl sm:text-2xl font-headline font-bold text-foreground leading-tight">{horoscope.sign || sign}</h3>}
                        </div>
                        <div className="hidden sm:flex flex-col items-center px-4 border-l border-r border-secondary/5">
                            <span className="text-[12px] font-bold text-secondary uppercase tracking-[0.1em] mb-0.5">{dayName}</span>
                            <span className="text-sm font-headline font-bold text-foreground/60">{displayDate}</span>
                        </div>
                        <div className="sm:hidden flex flex-col items-end text-right pr-1">
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em] leading-none mb-1">{dayName}</span>
                            <span className="text-[11px] font-headline font-bold text-foreground/50 leading-none">{displayDate}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button onClick={() => openModal({ label: "General", score, info: horoscope.tip || 'The stars guide you today.', icon: <Sparkles className="w-5 h-5" />, color: "text-secondary", bg: "bg-secondary/10", colorHex: scoreHex, area: "general" })}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-variant/20 hover:bg-surface-variant/40 border border-outline-variant/10 transition-colors">
                                <span className="text-xs font-bold text-foreground/80 uppercase tracking-widest">Full Day</span>
                                <ArrowRight className="w-3.5 h-3.5 text-secondary" />
                            </button>

                            <button onClick={() => openModal({ label: "General", score, info: horoscope.tip || 'The stars guide you today.', icon: <Sparkles className="w-5 h-5" />, color: "text-secondary", bg: "bg-secondary/10", colorHex: scoreHex, area: "general" })}
                                className="relative w-16 h-16 sm:w-18 sm:h-18 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform group">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                                    <circle cx="36" cy="36" r="32" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-variant/20" />
                                    <circle cx="36" cy="36" r="32" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={prog} className="transition-all duration-[1500ms]" style={{ stroke: scoreHex }} />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-xl font-bold leading-none ${scoreColor(score)}`}>{score}</span>
                                    <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-0.5">General</span>
                                </div>
                                <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-secondary/20 transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>

                <div className={`transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    
                    {/* 1. The Hook: Tip of the Day */}
                    <div className="p-5 sm:p-6 border-b border-white/5 bg-transparent">
                        <div className="p-5 rounded-[24px] bg-secondary/5 border border-secondary/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-secondary/10 transition-colors" />
                            <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] mb-2.5 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> Tip of the Day</h4>
                            <p className="text-sm sm:text-base font-body font-medium italic leading-relaxed text-foreground/80 relative z-10">&quot;{horoscope.tip || 'Stay mindful of your surroundings today.'}&quot;</p>
                        </div>
                    </div>

                    {/* 2. Stats Row — Quick Glance */}
                    <div className={`grid grid-cols-2 ${horoscope.dominant_planet ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} border-b border-white/5 bg-transparent`}>
                        {[{ l: 'Mood', v: horoscope.mood || 'Neutral' }, { l: 'Lucky Color', v: horoscope.lucky_color ?? '—', dot: luckyColorHex }, { l: 'Lucky #', v: String(horoscope.lucky_number ?? '—') }, ...(horoscope.dominant_planet ? [{ l: 'Dominant', v: horoscope.dominant_planet, sec: true }] : [])].map((s, i, arr) => (
                            <div key={i} className={`flex flex-col items-center justify-center p-2 sm:p-3 ${i < arr.length - 1 ? 'border-r' : ''} ${i < 2 ? 'border-b sm:border-b-0' : ''} border-white/5`}>
                                <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest mb-1 text-center leading-none">{s.l}</span>
                                <div className="flex items-center gap-1.5">
                                    {s.dot && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.dot }} />}
                                    <span className={`text-xs sm:text-sm font-headline font-bold ${s.sec ? 'text-secondary' : 'text-foreground'}`}>{s.v}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 3. Category Scores — Detailed Breakdown */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-surface">
                        {metrics.map((item, i) => (
                            <button key={i} onClick={() => openModal(item)}
                                className={`flex items-start text-left gap-4 p-5 sm:p-6 transition-all duration-300 hover:bg-surface-variant/10 cursor-pointer group relative ${i % 2 === 0 ? 'lg:border-r border-outline-variant/10' : ''} ${i < 2 ? 'border-b border-outline-variant/10' : (i < 3 ? 'border-b lg:border-b-0 border-outline-variant/10' : '')}`}>
                                <div className={`w-14 h-14 rounded-full ${item.bg} ${item.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>{item.icon}</div>
                                <div className="flex-1 min-w-0 pr-4">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className={`text-xl font-headline font-bold ${item.color}`}>{item.score}%</div>
                                        <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{item.label}</div>
                                    </div>
                                    <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">{item.info}</p>
                                </div>
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className={`w-4 h-4 ${item.color}`} />
                                </div>
                                <div className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500" style={{ backgroundColor: item.colorHex }} />
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* ─── Full Detailed Forecast Modal (Wide, No-Scroll Dashboard) ─── */}
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
                                        
                                        {/* Cosmic Orbits Loading Animation */}
                                        <div className="relative w-48 h-48 mb-8">
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 rounded-full border border-secondary/10"
                                            />
                                            <motion.div 
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-4 rounded-full border border-secondary/5"
                                            />
                                            <motion.div 
                                                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                                className="absolute inset-0 flex items-center justify-center"
                                            >
                                                <Sparkles className="w-12 h-12 text-secondary/40" />
                                            </motion.div>
                                            
                                            {/* Orbiting "Planets" */}
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0"
                                            >
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(212,160,23,0.5)]" />
                                            </motion.div>
                                            <motion.div 
                                                animate={{ rotate: -360 }}
                                                transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-4"
                                            >
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-secondary/50" />
                                            </motion.div>
                                        </div>
                                        
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center space-y-2 relative z-10"
                                        >
                                            <h4 className="text-xl font-headline font-bold text-foreground uppercase tracking-[0.2em]">Aligning the Stars</h4>
                                            <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest animate-pulse">Calculating personalized planetary transits...</p>
                                        </motion.div>

                                        {/* Shimmering Skeletons at the bottom */}
                                        <div className="absolute bottom-12 left-12 right-12 grid grid-cols-4 gap-4 opacity-10">
                                            {[1,2,3,4].map(i => (
                                                <div key={i} className="h-16 rounded-2xl bg-foreground animate-pulse" />
                                            ))}
                                        </div>
                                    </div>
                                ) : forecast && (() => {
                                    const activeDay = forecast.days.find(d => d.date === (expandedDay || forecast.days.find(today => today.is_today)?.date)) || forecast.days[0];
                                    
                                    return (
                                        <>
                                            {/* ─── LEFT PANEL: Context & Action ─── */}
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
                                                                    {activeDay.is_today ? 'Today' : fmtDay(activeDay.date)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-3xl sm:text-5xl font-headline font-bold leading-none" style={{ color: activeModal.colorHex }}>{activeDay.score}%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs sm:text-sm font-body leading-relaxed text-foreground/80 mb-4 sm:mb-8">{activeModal.info}</p>

                                                    {/* Alerts for selected Day */}
                                                    {activeDay.personalized_alerts?.length > 0 && (
                                                        <div className="mb-4 sm:mb-auto p-4 sm:p-5 rounded-2xl bg-surface-variant/10 border border-outline-variant/10 shadow-inner">
                                                            <div className="flex items-center justify-between mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-outline-variant/10">
                                                                <div className="flex items-center gap-2">
                                                                    <Info className="w-3.5 h-3.5" style={{ color: activeModal.colorHex }} />
                                                                    <span className="text-[10px] sm:text-[11px] font-bold text-foreground/50 uppercase tracking-widest">{activeDay.is_today ? 'Today' : fmtDay(activeDay.date)}&apos;s Alerts</span>
                                                                </div>
                                                                <span className="text-[9px] sm:text-[10px] font-bold text-foreground/30 px-1.5 py-0.5 rounded-md bg-surface-variant/20 border border-outline-variant/5">🪐 {activeDay.dominant_planet}</span>
                                                            </div>
                                                            <div className="space-y-2 sm:space-y-3">
                                                                {activeDay.personalized_alerts.slice(0, 4).map((alert, i) => {
                                                                    const isObject = typeof alert === 'object' && alert !== null;
                                                                    const simpleText = isObject ? alert.simple : alert;
                                                                    const techText = isObject ? alert.technical : null;
                                                                    const isWarning = simpleText.toLowerCase().includes('challenging') || simpleText.toLowerCase().includes('mindful') || simpleText.toLowerCase().includes('caution');
                                                                    
                                                                    return (
                                                                        <div key={i} className="flex items-start gap-2 sm:gap-3 group/alert">
                                                                            <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" 
                                                                                style={{ backgroundColor: isWarning ? '#fbbf24' : activeModal.colorHex }} />
                                                                            <div className="flex flex-col min-w-0">
                                                                                <span className="text-[11px] sm:text-[12px] text-foreground/60 leading-snug">{simpleText}</span>
                                                                                {techText && (
                                                                                    <span className="text-[9px] sm:text-[10px] text-foreground/25 font-bold uppercase tracking-widest mt-1 opacity-0 group-hover/alert:opacity-100 transition-opacity duration-300">
                                                                                        {techText}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button onClick={() => handleConsult(activeModal.label)}
                                                        className="w-full mt-4 sm:mt-8 flex items-center justify-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-secondary text-background font-bold text-sm sm:text-base hover:bg-secondary/90 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0 shrink-0">
                                                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" /> Consult Navi <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* ─── RIGHT PANEL: Data & Interactive Grid ─── */}
                                            <div className="w-full lg:w-[65%] flex-1 lg:shrink-0 bg-surface-variant/5 flex flex-col min-h-0 relative overflow-hidden">
                                                <>
                                                    {/* Top Chart Section */}
                                                        <div className="p-4 sm:p-8 pb-2 sm:pb-4 shrink-0">
                                                            <div className="flex items-center justify-between mb-2 sm:mb-4">
                                                                <span className="text-[10px] sm:text-[11px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-2">
                                                                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 h-4" style={{ color: activeModal.colorHex }} /> 7-Day Trajectory
                                                                </span>
                                                                <div className="flex gap-2 sm:gap-3">
                                                                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/10 text-[10px] font-bold bg-surface">
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeModal.colorHex }} />
                                                                        <span className="text-foreground/40">Peak:</span>
                                                                        <span style={{ color: activeModal.colorHex }}>{fmtDate(forecast.summary.best_day)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-outline-variant/10 text-[9px] sm:text-[10px] font-bold bg-surface">
                                                                        <span className="text-foreground/40">Trend:</span>
                                                                        <span className="text-foreground/70 capitalize">{forecast.summary.trend === 'improving' ? '📈' : forecast.summary.trend === 'declining' ? '📉' : '➡️'} {forecast.summary.trend}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="h-20 sm:h-28 w-full relative px-4 sm:px-8">
                                                                <MiniChart 
                                                                    days={forecast.days} 
                                                                    colorHex={activeModal.colorHex} 
                                                                    activeDate={activeDay.date}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="px-8 h-[1px] bg-outline-variant/5 shrink-0" />

                                                        {/* Bottom Interactive Day Details */}
                                                        <div className="flex flex-col flex-1 min-h-0 p-4 sm:p-10 pt-2 sm:pt-4">
                                                            <div className="flex items-center justify-between mb-4 sm:mb-6 px-2">
                                                                <span className="text-[10px] sm:text-[11px] font-black text-foreground/20 uppercase tracking-[0.25em]">Interactive Timeline</span>
                                                                <div className="flex gap-4">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                                                                        <span className="text-[9px] font-bold text-foreground/30 uppercase">High</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500/50" />
                                                                        <span className="text-[9px] font-bold text-foreground/30 uppercase">Low</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Day Selector Grid */}
                                                            <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-6 sm:mb-10 shrink-0">
                                                                {forecast.days.map(day => {
                                                                    const isSelected = activeDay.date === day.date;
                                                                    const dateObj = new Date(day.date + 'T00:00:00');
                                                                    const dayNum = dateObj.getDate();
                                                                    const isHigh = day.score >= 75;
                                                                    const isLow = day.score <= 45;
                                                                    
                                                                    return (
                                                                        <motion.button 
                                                                            key={day.date} 
                                                                            whileHover={{ y: -4, scale: 1.02 }}
                                                                            whileTap={{ scale: 0.96 }}
                                                                            onClick={() => setExpandedDay(day.date)}
                                                                            className={`relative group flex flex-col items-center p-2 sm:p-4 rounded-[16px] sm:rounded-[20px] border transition-all duration-500 cursor-pointer overflow-hidden ${
                                                                                isSelected 
                                                                                ? 'bg-surface shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-30' 
                                                                                : 'bg-surface/30 border-white/5 hover:border-white/20 z-10'
                                                                            }`}
                                                                            style={{ 
                                                                                borderColor: isSelected ? activeModal.colorHex + '40' : undefined,
                                                                                boxShadow: isSelected ? `0 10px 30px -10px ${activeModal.colorHex}20` : undefined
                                                                            }}>
                                                                            
                                                                            {/* Selection Glow */}
                                                                            {isSelected && (
                                                                                <motion.div 
                                                                                    layoutId="activeDayBg" 
                                                                                    className="absolute inset-0 bg-gradient-to-b from-transparent to-white/[0.03] pointer-events-none" 
                                                                                />
                                                                            )}

                                                                            <span className={`text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-1 sm:mb-2 transition-colors ${isSelected ? '' : 'text-foreground/30 group-hover:text-foreground/60'}`} 
                                                                                style={{ color: isSelected ? activeModal.colorHex : undefined }}>
                                                                                {day.is_today ? 'TODAY' : fmtDay(day.date)}
                                                                            </span>

                                                                            <span className={`text-lg sm:text-2xl font-headline font-bold mb-1 sm:mb-2 transition-all ${isSelected ? 'scale-110 text-foreground' : 'text-foreground/40'}`}>
                                                                                {dayNum}
                                                                            </span>

                                                                            {/* Score Indicator Pill */}
                                                                            <div className={`w-full h-1 rounded-full overflow-hidden bg-white/5 mt-auto relative`}>
                                                                                <motion.div 
                                                                                    initial={{ width: 0 }}
                                                                                    animate={{ width: `${day.score}%` }}
                                                                                    className="absolute inset-0 rounded-full"
                                                                                    style={{ backgroundColor: isSelected ? activeModal.colorHex : (isHigh ? '#22c55e' : isLow ? '#ef4444' : '#94a3b840') }}
                                                                                />
                                                                            </div>

                                                                            {isSelected && (
                                                                                <motion.div 
                                                                                    layoutId="bottomIndicator" 
                                                                                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-t-full"
                                                                                    style={{ backgroundColor: activeModal.colorHex }}
                                                                                />
                                                                            )}
                                                                        </motion.button>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Detailed card for selected day */}
                                                            <motion.div 
                                                                key={activeDay.date}
                                                                initial={{ opacity: 0, x: 20 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                className="flex-1 min-h-0 flex flex-col relative"
                                                            >
                                                                <div className="absolute -inset-6 bg-gradient-to-br from-secondary/5 to-transparent blur-3xl opacity-20 pointer-events-none rounded-[40px]" />
                                                                
                                                                <div className="relative flex-1 flex flex-col p-6 sm:p-10 rounded-[28px] sm:rounded-[36px] bg-surface/40 backdrop-blur-sm border border-white/5 shadow-2xl overflow-hidden group">
                                                                    {/* Background decoration */}
                                                                    <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 blur-[80px] rounded-full -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110" />
                                                                    
                                                                    <div className="relative z-10 flex flex-col h-full">
                                                                        <div className="flex items-center justify-between mb-6 sm:mb-8">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] sm:text-[11px] font-black text-secondary uppercase tracking-[0.3em] mb-1">Detailed Insight</span>
                                                                                <h4 className="text-xl sm:text-2xl font-headline font-bold text-foreground">{fmtDate(activeDay.date)}</h4>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                                                                                    <div className="flex flex-col items-end">
                                                                                        <span className="text-[8px] font-bold text-foreground/30 uppercase tracking-widest">Dominant Force</span>
                                                                                        <span className="text-xs font-bold text-foreground/80">{activeDay.dominant_planet}</span>
                                                                                    </div>
                                                                                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                                                                                        <Sparkles className="w-5 h-5 text-secondary" />
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide pr-2">
                                                                            <p className="text-sm sm:text-lg text-foreground/90 leading-relaxed font-medium mb-8 sm:mb-10 selection:bg-secondary/30">
                                                                                &ldquo;{activeDay.text}&rdquo;
                                                                            </p>
                                                                            
                                                                            {activeDay.transits && (
                                                                                <div className="space-y-4 sm:space-y-6">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <span className="text-[10px] sm:text-[11px] font-black text-foreground/20 uppercase tracking-[0.4em] whitespace-nowrap">Planetary Alignment</span>
                                                                                        <div className="h-[1px] w-full bg-white/5" />
                                                                                    </div>
                                                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                                                                        {Object.entries(activeDay.transits).map(([planet, t]) => (
                                                                                            <motion.div 
                                                                                                key={planet}
                                                                                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.05)' }}
                                                                                                className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/5 transition-colors"
                                                                                            >
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-[10px] font-black text-foreground/40 uppercase tracking-widest mb-0.5">{planet}</span>
                                                                                                    <span className="text-xs font-bold text-secondary">{(t as any).sign}</span>
                                                                                                </div>
                                                                                                <div className="flex flex-col items-end">
                                                                                                    <span className="text-[8px] font-bold text-foreground/20 uppercase">House</span>
                                                                                                    <span className="text-xs font-headline font-bold text-foreground/60">{ (t as any).house_from_lagna }</span>
                                                                                                </div>
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

                                                    </>
                                                </div>
                                            </>
                                    );
                                })()}
                            </div>

                            
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

