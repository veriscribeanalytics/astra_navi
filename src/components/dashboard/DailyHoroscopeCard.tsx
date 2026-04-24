'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import { Sparkles, Heart, Briefcase, Activity, DollarSign, X, MessageSquare, ArrowRight, TrendingUp, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HoroscopeData {
    sign?: string; date?: string; overall_score?: number; mood?: string;
    lucky_color?: string; lucky_number?: number; career?: string; love?: string;
    health?: string; finance?: string; tip?: string; dominant_planet?: string;
}

interface ForecastDay {
    date: string; is_today: boolean; score: number; text: string;
    dominant_planet: string; personalized_alerts: string[];
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
                <line key={v} x1="0" y1={h - (v / 100) * h} x2={w} y2={h - (v / 100) * h} stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
            ))}
            <path d={areaD} fill={`url(#area-${colorHex.replace('#','')})`} />
            <path d={pathD} fill="none" stroke={colorHex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            {points.map((p, i) => {
                const d = days[i];
                const isSelected = activeDate === d.date;
                const label = d.is_today ? 'Today' : new Date(d.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
                return (
                    <g key={i}>
                        {/* Static Point Representation */}
                        {(d.is_today || isSelected) && <circle cx={p.x} cy={p.y} r="5" fill={colorHex} opacity={isSelected ? 0.15 : 0.08} />}
                        <circle cx={p.x} cy={p.y} r={d.is_today ? 3 : 1.5} 
                            fill={d.is_today || isSelected ? colorHex : 'transparent'} 
                            stroke={colorHex} strokeWidth={d.is_today || isSelected ? 0 : 1} />
                        
                        <text x={p.x} y={p.y - 10} textAnchor="middle" 
                            fill={isSelected ? colorHex : 'white'} 
                            fillOpacity={isSelected ? 1 : 0.25} 
                            fontSize="7" fontWeight="bold">{d.score}</text>
                        
                        {isSelected && <line x1={p.x} y1={p.y + 4} x2={p.x} y2={h + 50} stroke={colorHex} strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />}
                    </g>
                );
            })}
        </svg>
    );
}

export default function DailyHoroscopeCard({ sign, isGeneral }: { sign?: string; isGeneral?: boolean }) {
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
    const [realScores, setRealScores] = useState<Record<string, number>>({});

    const today = new Date();
    const dateString = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
    const dayName = today.toLocaleDateString('en-IN', { weekday: 'long' });

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                let url = isGeneral ? '/api/horoscope-general' : '/api/daily-horoscope';
                if (sign) url += `?sign=${encodeURIComponent(sign)}`;
                const res = await fetch(url);
                if (!res.ok) { const ed = await res.json().catch(() => ({})); throw new Error(ed.error || 'Failed'); }
                setHoroscope(await res.json()); setError(null);
            } catch (err: any) { setError(err.message); }
            finally { setLoading(false); }
        })();
    }, [sign, isGeneral]);

    useEffect(() => {
        if (!loading && horoscope) {
            const t = setTimeout(() => { setShowContent(true); setAnimatedScore(horoscope.overall_score || 0); }, 100);
            
            // Fetch real scores for metrics in parallel
            const areas = ['career', 'health', 'love', 'finance'];
            areas.forEach(area => {
                fetch(`/api/forecast/${area}`)
                    .then(r => r.ok ? r.json() : null)
                    .then(data => {
                        if (data?.days) {
                            const todayScore = data.days.find((d: any) => d.is_today)?.score;
                            if (todayScore !== undefined) {
                                setRealScores(prev => ({ ...prev, [area]: todayScore }));
                            }
                        }
                    })
                    .catch(() => {});
            });

            return () => clearTimeout(t);
        }
    }, [loading, horoscope]);


    const score = horoscope?.overall_score || 50;
    const scoreHex = score >= 80 ? '#D4A017' : score >= 60 ? '#E8832A' : '#E84A2A';
    const circ = 2 * Math.PI * 32;
    const prog = circ - (animatedScore / 100) * circ;
    const scoreColor = (s: number) => s >= 75 ? 'text-green-500' : s >= 50 ? 'text-yellow-500' : 'text-orange-500';

    const metrics = useMemo(() => [
        { label: "Career", score: realScores.career ?? Math.min(100, Math.max(0, score + 5)), info: horoscope?.career || 'Keep pushing for your goals.', icon: <Briefcase className="w-5 h-5" />, color: "text-orange-500", bg: "bg-orange-500/10", colorHex: "#f97316", area: "career" },
        { label: "Health", score: realScores.health ?? Math.min(100, Math.max(0, score - 3)), info: horoscope?.health || 'Vitality is on your side.', icon: <Activity className="w-5 h-5" />, color: "text-green-500", bg: "bg-green-500/10", colorHex: "#22c55e", area: "health" },
        { label: "Love", score: realScores.love ?? Math.min(100, Math.max(0, score + 8)), info: horoscope?.love || 'Harmony flows through relationships.', icon: <Heart className="w-5 h-5" />, color: "text-pink-500", bg: "bg-pink-500/10", colorHex: "#ec4899", area: "love" },
        { label: "Finance", score: realScores.finance ?? Math.min(100, Math.max(0, score - 5)), info: horoscope?.finance || 'Growth opportunities emerging.', icon: <DollarSign className="w-5 h-5" />, color: "text-amber-500", bg: "bg-amber-500/10", colorHex: "#f59e0b", area: "finance" },
    ], [score, horoscope, realScores]);

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

    return (
        <>
            <Card padding="none" className="!rounded-[24px] sm:!rounded-[32px] overflow-hidden">
                {/* Header */}
                <div className="p-3 sm:p-4 border-b border-outline-variant/30 bg-surface">
                    <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 sm:gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <TrendingUp className="w-3 h-3 text-secondary" />
                                <span className="text-[12px] font-bold text-secondary uppercase tracking-[0.15em]">Daily Forecast</span>
                            </div>
                            {!isGeneral && <h3 className="text-xl sm:text-2xl font-headline font-bold text-foreground leading-tight">{horoscope.sign || sign}</h3>}
                        </div>
                        <div className="hidden sm:flex flex-col items-center px-4 border-l border-r border-secondary/5">
                            <span className="text-[12px] font-bold text-secondary uppercase tracking-[0.1em] mb-0.5">{dayName}</span>
                            <span className="text-sm font-headline font-bold text-foreground/60">{dateString}</span>
                        </div>
                        <div className="sm:hidden flex flex-col items-end text-right pr-1">
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em] leading-none mb-1">{dayName}</span>
                            <span className="text-[11px] font-headline font-bold text-foreground/50 leading-none">{dateString}</span>
                        </div>
                        <button onClick={() => openModal({ label: "Overall", score, info: horoscope.tip || 'The stars guide you today.', icon: <Sparkles className="w-5 h-5" />, color: "text-secondary", bg: "bg-secondary/10", colorHex: scoreHex, area: "general" })}
                            className="relative w-16 h-16 sm:w-18 sm:h-18 flex-shrink-0 cursor-pointer hover:scale-105 transition-transform group">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                                <circle cx="36" cy="36" r="32" fill="none" stroke="currentColor" strokeWidth="6" className="text-surface-variant/20" />
                                <circle cx="36" cy="36" r="32" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={prog} className="transition-all duration-[1500ms]" style={{ stroke: scoreHex }} />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-xl font-bold leading-none ${scoreColor(score)}`}>{score}</span>
                                <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-0.5">Overall</span>
                            </div>
                            <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-secondary/20 transition-colors" />
                        </button>
                    </div>
                </div>

                <div className={`transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    {/* Stats Row */}
                    <div className={`grid grid-cols-2 ${horoscope.dominant_planet ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} border-b border-outline-variant/30 bg-surface`}>
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

                    {/* How Your Day Will Be */}
                    <div className="p-6 sm:p-8 border-b border-outline-variant/30 bg-surface">
                        <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] mb-3 flex items-center gap-2"><Sparkles className="w-3 h-3" /> How your day will be</h4>
                        <p className="text-base sm:text-lg font-body font-medium italic leading-relaxed text-foreground/80">&quot;{horoscope.tip}&quot;</p>
                    </div>

                    {/* Forecast Score Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 bg-surface">
                        {metrics.map((item, i) => (
                            <button key={i} onClick={() => openModal(item)}
                                className={`flex flex-col items-center gap-3 p-5 sm:p-6 transition-all duration-300 hover:bg-surface-variant/10 cursor-pointer group relative ${i < 3 ? 'border-r border-outline-variant/10' : ''} ${i < 2 ? 'border-b sm:border-b-0 border-outline-variant/10' : ''}`}>
                                <div className={`w-11 h-11 rounded-full ${item.bg} ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>{item.icon}</div>
                                <div className="text-center">
                                    <div className={`text-2xl font-headline font-bold ${item.color}`}>{item.score}%</div>
                                    <div className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest mt-0.5">{item.label}</div>
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] group-hover:w-8 transition-all duration-300 rounded-full" style={{ backgroundColor: item.colorHex }} />
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
                                            <div className="w-full lg:w-[35%] shrink-0 p-8 lg:p-10 flex flex-col relative overflow-y-auto scrollbar-hide lg:border-r border-outline-variant/10">
                                                <div className="absolute top-0 left-0 w-[150%] h-64 blur-[100px] opacity-10 pointer-events-none" style={{ backgroundColor: activeModal.colorHex }} />
                                                
                                                <div className="relative z-10 flex flex-col h-full">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className={`w-16 h-16 rounded-2xl ${activeModal.bg} flex items-center justify-center shrink-0 shadow-lg shadow-black/20`} style={{ color: activeModal.colorHex }}>
                                                            {activeModal.icon}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h3 className="text-[12px] font-bold text-foreground/40 uppercase tracking-[0.3em]">{activeModal.label} Forecast</h3>
                                                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-variant/20 border border-outline-variant/5 text-foreground/30 uppercase tracking-tighter">
                                                                    {activeDay.is_today ? 'Today' : fmtDay(activeDay.date)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-5xl font-headline font-bold leading-none" style={{ color: activeModal.colorHex }}>{activeDay.score}%</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <p className="text-sm sm:text-base font-body leading-relaxed text-foreground/80 mb-8">{activeModal.info}</p>

                                                    {/* Alerts for selected Day */}
                                                    {activeDay.personalized_alerts?.length > 0 && (
                                                        <div className="mb-auto p-5 rounded-2xl bg-[#0a0c10] border border-outline-variant/10 shadow-inner">
                                                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/10">
                                                                <div className="flex items-center gap-2">
                                                                    <Info className="w-4 h-4" style={{ color: activeModal.colorHex }} />
                                                                    <span className="text-[11px] font-bold text-foreground/50 uppercase tracking-widest">{activeDay.is_today ? 'Today' : fmtDay(activeDay.date)}&apos;s Alerts</span>
                                                                </div>
                                                                <span className="text-[10px] font-bold text-foreground/30 px-2 py-1 rounded-md bg-surface-variant/20 border border-outline-variant/5">🪐 {activeDay.dominant_planet}</span>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {activeDay.personalized_alerts.slice(0, 4).map((alert, i) => (
                                                                    <div key={i} className="flex items-start gap-3">
                                                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: alert.includes('challenging') || alert.includes('mindful') ? '#fbbf24' : activeModal.colorHex }} />
                                                                        <span className="text-[12px] text-foreground/60 leading-snug">{alert}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button onClick={() => handleConsult(activeModal.label)}
                                                        className="w-full mt-8 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-secondary text-background font-bold text-base hover:bg-secondary/90 transition-all duration-300 hover:shadow-xl hover:shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0 shrink-0">
                                                        <MessageSquare className="w-5 h-5" /> Consult Navi for details <ArrowRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* ─── RIGHT PANEL: Data & Interactive Grid ─── */}
                                            <div className="w-full lg:w-[65%] shrink-0 bg-[#06080a] flex flex-col min-h-0 relative">
                                                <>
                                                    {/* Top Chart Section */}
                                                        <div className="p-8 pb-4 shrink-0">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest flex items-center gap-2">
                                                                    <TrendingUp className="w-4 h-4" style={{ color: activeModal.colorHex }} /> 7-Day Trajectory
                                                                </span>
                                                                <div className="flex gap-3">
                                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/10 text-[10px] font-bold bg-surface">
                                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeModal.colorHex }} />
                                                                        <span className="text-foreground/40">Peak:</span>
                                                                        <span style={{ color: activeModal.colorHex }}>{fmtDate(forecast.summary.best_day)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant/10 text-[10px] font-bold bg-surface">
                                                                        <span className="text-foreground/40">Trend:</span>
                                                                        <span className="text-foreground/70 capitalize">{forecast.summary.trend === 'improving' ? '📈' : forecast.summary.trend === 'declining' ? '📉' : '➡️'} {forecast.summary.trend}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="h-28 w-full relative px-6 sm:px-8">
                                                                <MiniChart 
                                                                    days={forecast.days} 
                                                                    colorHex={activeModal.colorHex} 
                                                                    activeDate={activeDay.date}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div className="px-8 h-[1px] bg-outline-variant/5 shrink-0" />

                                                        {/* Bottom Interactive Day Details */}
                                                        <div className="flex flex-col flex-1 min-h-0 p-8 pt-6">
                                                            <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-4 px-2">Select Day for Details</span>
                                                            
                                                            {/* Day Selector Row */}
                                                            <div className="grid grid-cols-7 gap-2 mb-6 shrink-0 px-1">
                                                                {forecast.days.map(day => {
                                                                    const isSelected = activeDay.date === day.date;
                                                                    return (
                                                                        <motion.button 
                                                                            key={day.date} 
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={() => {
                                                                                setExpandedDay(day.date);
                                                                            }}
                                                                            className={`relative z-20 flex flex-col items-center justify-center py-3 px-1 rounded-xl border transition-all duration-300 cursor-pointer ${isSelected ? 'bg-surface-variant/15 shadow-lg' : 'bg-surface border-outline-variant/10 hover:border-outline-variant/30 hover:bg-surface-variant/5'}`}
                                                                            style={{ borderColor: isSelected ? activeModal.colorHex + '60' : undefined }}>
                                                                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors" style={{ color: isSelected ? activeModal.colorHex : 'rgba(255,255,255,0.4)' }}>
                                                                                {day.is_today ? 'Today' : fmtDay(day.date)}
                                                                            </span>
                                                                            {isSelected && <motion.div layoutId="activeDayGlow" className="absolute inset-0 rounded-xl bg-current opacity-5 pointer-events-none" style={{ color: activeModal.colorHex }} />}
                                                                        </motion.button>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Detailed card for selected day */}
                                                            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide p-6 rounded-2xl bg-surface border border-outline-variant/10">
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <div className="px-3 py-1 rounded-md bg-surface-variant/20 border border-outline-variant/10 text-[11px] font-bold text-foreground/60">
                                                                        {fmtDate(activeDay.date)}
                                                                    </div>
                                                                    {activeDay.is_today && <div className="px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest" style={{ backgroundColor: activeModal.colorHex + '20', color: activeModal.colorHex }}>Current</div>}
                                                                    <div className="ml-auto flex items-center gap-2 text-[11px] font-bold text-foreground/40">
                                                                        <span>Dominant:</span>
                                                                        <span className="text-foreground/80">{activeDay.dominant_planet}</span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-foreground/70 leading-relaxed mb-6">{activeDay.text}</p>
                                                                
                                                                {activeDay.transits && (
                                                                    <div className="mt-auto">
                                                                        <span className="text-[9px] font-bold text-foreground/30 uppercase tracking-widest mb-3 block">Key Transits</span>
                                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                            {Object.entries(activeDay.transits).map(([planet, t]) => (
                                                                                <div key={planet} className="flex items-center justify-between p-2 rounded-lg bg-[#0a0c10] border border-outline-variant/10">
                                                                                    <span className="text-[10px] font-bold text-foreground/60">{planet}</span>
                                                                                    <div className="flex items-center gap-1 text-[9px]">
                                                                                        <span className="text-secondary/80 font-medium">{(t as any).sign}</span>
                                                                                        <span className="text-foreground/20">|</span>
                                                                                        <span className="text-foreground/40">H{(t as any).house_from_lagna}</span>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
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
        </>
    );
}

