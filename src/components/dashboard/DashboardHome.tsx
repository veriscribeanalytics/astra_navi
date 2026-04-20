"use client";

import { useAuth } from "@/context/AuthContext";
import { 
    Sparkles, MessageSquare, Globe, Heart, 
    ChevronRight, Orbit, ArrowRight, 
    Briefcase, Activity, DollarSign, Star,
    ShoppingBag, Users
} from "lucide-react";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calculateAge, getAgeBracket, getPersonalizedQuestions } from "@/utils/personalizedQuestions";

// ─── Horoscope Data Interface ─────────────────────────────
interface HoroscopeData {
    sign?: string;
    date?: string;
    overall_score?: number;
    mood?: string;
    lucky_color?: string;
    lucky_number?: number;
    career?: string;
    love?: string;
    health?: string;
    finance?: string;
    tip?: string;
    dominant_planet?: string;
}

// ─── Kundli Quick Stats Interface ─────────────────────────
interface KundliStats {
    nakshatra?: string;
    nakshatraLord?: string;
    activeDasha?: string;
    dashaRemaining?: string;
    moonPhase?: string;
    lagnaSign?: string;
}

// ─── Time-based greeting ─────────────────────────────
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "Good Night";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
};

// ─── Rashi sign mapper ─────────────────────────────
const getRashiData = (sign: string) => {
    if (!sign) return null;
    const s = sign.toLowerCase();
    if (s.includes('mesh') || s.includes('aries')) return { id: 'aries', name: 'Mesh', en: 'Aries', icon: '/icons/rashi/aries.png' };
    if (s.includes('vrish') || s.includes('taurus')) return { id: 'taurus', name: 'Vrish', en: 'Taurus', icon: '/icons/rashi/taurus.png' };
    if (s.includes('mithun') || s.includes('gemini')) return { id: 'gemini', name: 'Mithun', en: 'Gemini', icon: '/icons/rashi/gemini.png' };
    if (s.includes('kark') || s.includes('cancer')) return { id: 'cancer', name: 'Kark', en: 'Cancer', icon: '/icons/rashi/cancer.png' };
    if (s.includes('simha') || s.includes('leo')) return { id: 'leo', name: 'Simha', en: 'Leo', icon: '/icons/rashi/leo.png' };
    if (s.includes('kanya') || s.includes('virgo')) return { id: 'virgo', name: 'Kanya', en: 'Virgo', icon: '/icons/rashi/virgo.png' };
    if (s.includes('tula') || s.includes('libra')) return { id: 'libra', name: 'Tula', en: 'Libra', icon: '/icons/rashi/libra.png' };
    if (s.includes('vrishchik') || s.includes('scorpio')) return { id: 'scorpio', name: 'Vrishchik', en: 'Scorpio', icon: '/icons/rashi/scorpio.png' };
    if (s.includes('dhanu') || s.includes('sagittarius')) return { id: 'sagittarius', name: 'Dhanu', en: 'Sagittarius', icon: '/icons/rashi/sagittarius.png' };
    if (s.includes('makar') || s.includes('capricorn')) return { id: 'capricorn', name: 'Makar', en: 'Capricorn', icon: '/icons/rashi/capricorn.png' };
    if (s.includes('kumbh') || s.includes('aquarius')) return { id: 'aquarius', name: 'Kumbh', en: 'Aquarius', icon: '/icons/rashi/aquarius.png' };
    if (s.includes('meen') || s.includes('pisces')) return { id: 'pisces', name: 'Meen', en: 'Pisces', icon: '/icons/rashi/pisces.png' };
    return null;
};

// ─── Score color helper ─────────────────────────────
const getScoreColor = (score: number) => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#eab308';
    return '#f97316';
};

// ─── Score ring component ─────────────────────────────
function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const radius = (size / 2) - 6;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference - (animatedScore / 100) * circumference;

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedScore(score), 200);
        return () => clearTimeout(timer);
    }, [score]);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="currentColor" strokeWidth="5"
                    className="text-surface-variant/20"
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progress}
                    className="transition-all duration-[1500ms] ease-out"
                    style={{ stroke: getScoreColor(score) }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold leading-none" style={{ color: getScoreColor(score) }}>
                    {animatedScore}
                </span>
                <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-wider mt-0.5">
                    Score
                </span>
            </div>
        </div>
    );
}

// ─── Skeleton loader ─────────────────────────────
function SkeletonPulse({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse bg-surface-variant/20 rounded-xl ${className}`} />;
}


export default function DashboardHome() {
    const { user } = useAuth();
    const router = useRouter();
    const [quickQuery, setQuickQuery] = useState("");
    const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
    const [horoscopeLoading, setHoroscopeLoading] = useState(true);
    const [horoscopeError, setHoroscopeError] = useState(false);
    const [kundliStats, setKundliStats] = useState<KundliStats | null>(null);
    const [kundliLoading, setKundliLoading] = useState(true);
    const [greeting, setGreeting] = useState(getGreeting());

    const age = useMemo(() => calculateAge(user?.dob), [user?.dob]);
    const ageBracket = useMemo(() => getAgeBracket(age), [age]);
    const personalizedQuestions = useMemo(() => getPersonalizedQuestions(ageBracket), [ageBracket]);

    // Update greeting every minute
    useEffect(() => {
        const interval = setInterval(() => setGreeting(getGreeting()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch horoscope
    useEffect(() => {
        if (!user?.email) return;
        setHoroscopeLoading(true);
        setHoroscopeError(false);

        fetch(`/api/daily-horoscope?email=${encodeURIComponent(user.email)}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                return res.json();
            })
            .then(data => {
                setHoroscope(data);
                setHoroscopeError(false);
            })
            .catch(() => setHoroscopeError(true))
            .finally(() => setHoroscopeLoading(false));
    }, [user?.email]);

    // Fetch kundli quick stats
    useEffect(() => {
        if (!user?.email) return;
        setKundliLoading(true);

        fetch('/api/analyze-full', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, force_refresh: false }),
        })
            .then(res => res.ok ? res.json() : null)
            .then(result => {
                if (!result) { setKundliStats(null); return; }
                const analysis = result.data?.astrologyData || result.data || result;

                const stats: KundliStats = {};
                if (analysis?.houses) {
                    const lagna = analysis.houses.find((h: any) => h.house === 1)?.sign;
                    if (lagna) stats.lagnaSign = lagna;
                }
                if (analysis?.nakshatra) stats.nakshatra = analysis.nakshatra;
                if (analysis?.nakshatraLord) stats.nakshatraLord = analysis.nakshatraLord;
                if (analysis?.dasha) {
                    stats.activeDasha = analysis.dasha.currentMahaDasha || analysis.dasha.current;
                    stats.dashaRemaining = analysis.dasha.remaining;
                }
                if (analysis?.moonPhase) stats.moonPhase = analysis.moonPhase;

                // Only set if we got something meaningful
                if (Object.keys(stats).length > 0) {
                    setKundliStats(stats);
                }
            })
            .catch(() => setKundliStats(null))
            .finally(() => setKundliLoading(false));
    }, [user?.email]);

    // Sign data from user profile
    const moonSignData = user?.moonSign ? getRashiData(user.moonSign) : null;
    const sunSignData = user?.sunSign ? getRashiData(user.sunSign) : null;
    const ascSignRaw = (user as any)?.ascendantSign || kundliStats?.lagnaSign;
    const ascendantSignData = ascSignRaw ? getRashiData(ascSignRaw) : null;

    const handleQuickQuery = (e: React.FormEvent) => {
        e.preventDefault();
        if (quickQuery.trim()) {
            localStorage.setItem('astranavi_pending_message', quickQuery.trim());
        }
        router.push('/chat');
    };

    const handleQuickAsk = (question: string) => {
        localStorage.setItem('astranavi_pending_message', question.trim());
        router.push('/chat');
    };

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Horoscope helper: get lucky color hex
    const getLuckyColorHex = (color: string) => {
        const c = color.toLowerCase();
        const map: Record<string, string> = {
            pink: '#f472b6', rose: '#f472b6', red: '#dc2626', maroon: '#dc2626',
            blue: '#2563eb', navy: '#2563eb', indigo: '#2563eb',
            green: '#059669', emerald: '#059669', teal: '#059669',
            yellow: '#f59e0b', gold: '#f59e0b', amber: '#f59e0b', saffron: '#f59e0b',
            orange: '#ea580c', peach: '#ea580c',
            purple: '#7c3aed', violet: '#7c3aed', lavender: '#7c3aed',
            white: '#e2e8f0', cream: '#e2e8f0', ivory: '#e2e8f0',
            black: '#94a3b8', grey: '#94a3b8', gray: '#94a3b8', silver: '#94a3b8',
        };
        return Object.entries(map).find(([k]) => c.includes(k))?.[1] || '#fbbf24';
    };

    // ─── Services data ─────────────────────────────
    const services = [
        { title: "My Kundli", desc: "Complete birth chart analysis", href: "/kundli", icon: <Globe className="w-7 h-7" />, color: "from-blue-500/15 to-indigo-500/10", iconColor: "text-blue-400", border: "hover:border-blue-500/30" },
        { title: "Rashi Library", desc: "Explore all 12 zodiac signs", href: "/rashis", icon: <Orbit className="w-7 h-7" />, color: "from-amber-500/15 to-orange-500/10", iconColor: "text-amber-500", border: "hover:border-amber-500/30" },
        { title: "Daily Horoscope", desc: "Predictions for any sign", href: "/horoscope", icon: <Sparkles className="w-7 h-7" />, color: "from-purple-500/15 to-violet-500/10", iconColor: "text-purple-400", border: "hover:border-purple-500/30" },
        { title: "Consult Navi AI", desc: "AI astrology consultation", href: "/chat", icon: <MessageSquare className="w-7 h-7" />, color: "from-secondary/15 to-amber-500/10", iconColor: "text-secondary", border: "hover:border-secondary/30" },
        { title: "Talk to Expert", desc: "Live astrologer consultation", href: "/astrologers", icon: <Users className="w-7 h-7" />, color: "from-green-500/15 to-emerald-500/10", iconColor: "text-green-400", border: "hover:border-green-500/30" },
        { title: "Remedy Shop", desc: "Vedic gems, rituals & more", href: "/shop", icon: <ShoppingBag className="w-7 h-7" />, color: "from-emerald-500/15 to-teal-500/10", iconColor: "text-emerald-400", border: "hover:border-emerald-500/30" },
    ];

    return (
        <div className="w-full flex-grow relative bg-[var(--bg)] min-h-screen overflow-x-hidden">
            <div className="max-w-[1400px] mx-auto w-full relative z-10 px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-12 pb-12">
                
                {/* ═══════════════════════════════════════════════
                    ZONE 1: IDENTITY BAR
                    ═══════════════════════════════════════════════ */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
                    {/* Left: Greeting */}
                    <div>
                        <p className="text-[11px] font-bold text-foreground/30 uppercase tracking-[0.25em] mb-1">{currentDate}</p>
                        <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground leading-tight">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-500 capitalize">{user?.name || user?.email?.split('@')[0] || "Seeker"}</span>
                        </h1>
                    </div>

                    {/* Right: Sign Badges */}
                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                        {[
                            { label: "Moon", data: moonSignData },
                            { label: "Sun", data: sunSignData },
                            { label: "Ascendant", data: ascendantSignData },
                        ].map((sign, idx) => (
                            <div key={idx} className="flex items-center gap-2.5 bg-surface/40 backdrop-blur-md border border-outline-variant/20 rounded-full px-4 py-2 hover:border-secondary/30 transition-colors">
                                {sign.data?.icon ? (
                                    <img src={`${sign.data.icon}?v=4`} alt={sign.label} className="w-8 h-8 object-contain" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-surface-variant/30 flex items-center justify-center text-sm">✨</div>
                                )}
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-foreground/35 font-bold uppercase tracking-widest leading-none">{sign.label}</span>
                                    <span className="text-sm font-headline font-bold text-secondary leading-tight">{sign.data?.name || '—'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>


                {/* ═══════════════════════════════════════════════
                    ZONE 2: TODAY'S DASHBOARD (THE HERO)
                    ═══════════════════════════════════════════════ */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-10">
                    
                    {/* ── LEFT: Today's Horoscope (Real Data) ── */}
                    <div className="lg:col-span-7 xl:col-span-8">
                        <Card padding="none" className="!rounded-[28px] border-outline-variant/15 bg-surface/30 backdrop-blur-md h-full">
                            
                            {horoscopeLoading ? (
                                /* Skeleton loader */
                                <div className="p-6 sm:p-8 space-y-6">
                                    <div className="flex items-center gap-4">
                                        <SkeletonPulse className="w-20 h-20 !rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <SkeletonPulse className="h-4 w-40" />
                                            <SkeletonPulse className="h-3 w-28" />
                                            <SkeletonPulse className="h-3 w-36" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <SkeletonPulse className="h-24" />
                                        <SkeletonPulse className="h-24" />
                                        <SkeletonPulse className="h-24" />
                                        <SkeletonPulse className="h-24" />
                                    </div>
                                    <SkeletonPulse className="h-16" />
                                </div>
                            ) : horoscopeError || !horoscope ? (
                                /* Error state */
                                <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[300px] gap-4">
                                    <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-headline font-bold text-foreground mb-1">Horoscope Unavailable</h3>
                                        <p className="text-sm text-foreground/40 mb-4">We couldn't load your daily reading. Try again in a moment.</p>
                                    </div>
                                    <button
                                        onClick={() => { setHoroscopeError(false); setHoroscopeLoading(true); 
                                            fetch(`/api/daily-horoscope?email=${encodeURIComponent(user?.email || '')}`)
                                                .then(r => r.ok ? r.json() : null)
                                                .then(d => { if (d) { setHoroscope(d); setHoroscopeError(false); } else { setHoroscopeError(true); } })
                                                .catch(() => setHoroscopeError(true))
                                                .finally(() => setHoroscopeLoading(false));
                                        }}
                                        className="text-[11px] font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-5 py-2.5 rounded-full hover:bg-secondary/20 transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                /* Real horoscope data */
                                <>
                                    {/* Header: Score + Sign info + Meta badges */}
                                    <div className="p-5 sm:p-6 pb-4 flex flex-col sm:flex-row items-start sm:items-center gap-5">
                                        <ScoreRing score={horoscope.overall_score || 50} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <Sparkles className="w-4 h-4 text-secondary" />
                                                <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em]">Today's Horoscope</span>
                                            </div>
                                            <h2 className="text-xl sm:text-2xl font-headline font-bold text-foreground leading-tight mb-2">
                                                {horoscope.sign || 'Your Sign'}
                                            </h2>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {horoscope.mood && (
                                                    <span className="text-[10px] font-bold text-foreground/50 bg-surface-variant/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                        Mood: {horoscope.mood}
                                                    </span>
                                                )}
                                                {horoscope.lucky_color && (
                                                    <span className="text-[10px] font-bold text-foreground/50 bg-surface-variant/30 px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getLuckyColorHex(horoscope.lucky_color) }} />
                                                        {horoscope.lucky_color}
                                                    </span>
                                                )}
                                                {horoscope.lucky_number && (
                                                    <span className="text-[10px] font-bold text-foreground/50 bg-surface-variant/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                        Lucky #{horoscope.lucky_number}
                                                    </span>
                                                )}
                                                {horoscope.dominant_planet && (
                                                    <span className="text-[10px] font-bold text-secondary/80 bg-secondary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                                        {horoscope.dominant_planet}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 4-tile grid: Career, Love, Health, Finance */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-outline-variant/10">
                                        {[
                                            { label: "Career", text: horoscope.career, icon: <Briefcase className="w-4 h-4 text-orange-500" />, bg: "bg-orange-500/8" },
                                            { label: "Love", text: horoscope.love, icon: <Heart className="w-4 h-4 text-pink-500" />, bg: "bg-pink-500/8" },
                                            { label: "Health", text: horoscope.health, icon: <Activity className="w-4 h-4 text-green-500" />, bg: "bg-green-500/8" },
                                            { label: "Finance", text: horoscope.finance, icon: <DollarSign className="w-4 h-4 text-amber-500" />, bg: "bg-amber-500/8" },
                                        ].map((tile, idx) => (
                                            <div key={idx} className={`p-4 sm:p-5 hover:bg-surface/10 transition-colors ${idx < 2 ? 'border-b border-outline-variant/10' : ''} ${idx % 2 === 0 ? 'sm:border-r border-outline-variant/10' : ''}`}>
                                                <div className="flex items-center gap-2.5 mb-2">
                                                    <div className={`w-7 h-7 rounded-lg ${tile.bg} flex items-center justify-center`}>
                                                        {tile.icon}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest">{tile.label}</span>
                                                </div>
                                                <p className="text-[13px] sm:text-sm font-medium leading-relaxed text-foreground/70">
                                                    {tile.text || 'Insights loading...'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tip + CTA */}
                                    <div className="p-4 sm:p-5 bg-surface/10 border-t border-outline-variant/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                <Star className="w-3.5 h-3.5 text-secondary" />
                                            </div>
                                            <p className="text-sm font-medium italic text-foreground/60 leading-relaxed">
                                                &ldquo;{horoscope.tip || 'Follow your heart today.'}&rdquo;
                                            </p>
                                        </div>
                                        <Link href="/horoscope" className="text-[10px] font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-4 py-2 rounded-full hover:bg-secondary/20 transition-colors whitespace-nowrap shrink-0">
                                            Full Horoscope →
                                        </Link>
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>

                    {/* ── RIGHT: Ask Navi AI + Quick Stats ── */}
                    <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
                        
                        {/* Navi AI Prompt */}
                        <Card padding="none" className="!rounded-[28px] border-outline-variant/15 bg-surface/30 backdrop-blur-md overflow-visible">
                            <div className="p-5 sm:p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl gold-gradient flex items-center justify-center">
                                        <MessageSquare className="w-4.5 h-4.5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-[15px] font-bold text-foreground leading-tight">Consult Navi AI</h3>
                                        <p className="text-[10px] text-foreground/30 font-medium">Ask anything about your chart</p>
                                    </div>
                                </div>

                                {/* Search bar */}
                                <form onSubmit={handleQuickQuery} className="mb-4">
                                    <div className="flex items-center bg-surface/50 border border-outline-variant/20 rounded-full p-1 focus-within:border-secondary/40 transition-colors">
                                        <Sparkles className="w-3.5 h-3.5 text-secondary/40 ml-3.5 shrink-0" />
                                        <input
                                            type="text"
                                            value={quickQuery}
                                            onChange={(e) => setQuickQuery(e.target.value)}
                                            placeholder="Ask about your chart..."
                                            className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground/25 px-3 py-2 outline-none font-medium"
                                        />
                                        <button type="submit" className="gold-gradient text-white rounded-full px-5 py-2 text-[10px] font-bold uppercase tracking-widest shrink-0 hover:scale-[1.02] transition-transform">
                                            Ask
                                        </button>
                                    </div>
                                </form>

                                {/* Suggested questions */}
                                <div className="flex flex-col gap-1.5">
                                    {personalizedQuestions.map((q, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleQuickAsk(q)}
                                            className="text-left w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-surface/30 border border-outline-variant/10 hover:border-secondary/25 hover:bg-secondary/5 transition-all group"
                                        >
                                            <span className="text-[11px] font-medium text-foreground/50 group-hover:text-foreground/70 truncate transition-colors">{q}</span>
                                            <ChevronRight className="w-3 h-3 text-foreground/20 group-hover:text-secondary/60 shrink-0 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Cosmic Profile (Quick Stats from real API) */}
                        <Card padding="none" className="!rounded-[28px] border-outline-variant/15 bg-surface/30 backdrop-blur-md flex-1">
                            <div className="p-5 sm:p-6">
                                <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] flex items-center gap-2 mb-4">
                                    <Orbit className="w-3.5 h-3.5" /> Your Cosmic Profile
                                </h4>

                                {kundliLoading ? (
                                    <div className="space-y-3">
                                        <SkeletonPulse className="h-8" />
                                        <SkeletonPulse className="h-8" />
                                        <SkeletonPulse className="h-8" />
                                    </div>
                                ) : kundliStats ? (
                                    <div className="flex flex-col gap-2">
                                        {([
                                            kundliStats.nakshatra ? { label: "Nakshatra", value: kundliStats.nakshatra } : null,
                                            kundliStats.activeDasha ? { label: "Active Dasha", value: `${kundliStats.activeDasha}${kundliStats.dashaRemaining ? ` (${kundliStats.dashaRemaining})` : ''}` } : null,
                                            kundliStats.nakshatraLord ? { label: "Nakshatra Lord", value: kundliStats.nakshatraLord } : null,
                                            kundliStats.moonPhase ? { label: "Moon Phase", value: kundliStats.moonPhase } : null,
                                            kundliStats.lagnaSign ? { label: "Lagna", value: kundliStats.lagnaSign } : null,
                                        ] as ({ label: string; value: string } | null)[]).filter((s): s is { label: string; value: string } => s !== null).map((stat, idx) => (
                                            <div key={idx} className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface/20 border border-outline-variant/8">
                                                <span className="text-[10px] font-bold text-foreground/35 uppercase tracking-widest">{stat.label}</span>
                                                <span className="text-[13px] font-bold text-foreground">{stat.value}</span>
                                            </div>
                                        ))}
                                        <Link href="/kundli" className="mt-2 text-center text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-foreground transition-colors">
                                            View Full Kundli →
                                        </Link>
                                    </div>
                                ) : (
                                    /* No data — CTA to generate chart */
                                    <div className="flex flex-col items-center text-center py-4 gap-3">
                                        <Globe className="w-8 h-8 text-foreground/15" />
                                        <div>
                                            <p className="text-sm font-bold text-foreground/60 mb-0.5">Birth chart not generated yet</p>
                                            <p className="text-[11px] text-foreground/30">Unlock your full cosmic profile</p>
                                        </div>
                                        <Link 
                                            href="/kundli" 
                                            className="gold-gradient text-white rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] transition-transform flex items-center gap-2"
                                        >
                                            Generate My Kundli <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>


                {/* ═══════════════════════════════════════════════
                    ZONE 3: SERVICES HUB ("Where Do I Go?")
                    ═══════════════════════════════════════════════ */}
                <div>
                    <h2 className="text-lg font-headline font-bold text-foreground flex items-center gap-3 mb-5 px-1">
                        <span className="text-secondary">✦</span> Explore AstraNavi
                    </h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {services.map((service, idx) => (
                            <Link key={idx} href={service.href} className="group">
                                <div className={`relative flex flex-col gap-3 sm:gap-4 p-5 sm:p-6 rounded-[24px] bg-gradient-to-br ${service.color} backdrop-blur-md border border-outline-variant/10 ${service.border} transition-all h-full group-hover:-translate-y-0.5`}>
                                    <div className={`w-12 h-12 rounded-2xl bg-surface/40 flex items-center justify-center shrink-0 ${service.iconColor} group-hover:scale-[1.05] transition-transform`}>
                                        {service.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <h3 className="text-[14px] sm:text-[15px] font-bold text-foreground group-hover:text-secondary transition-colors">{service.title}</h3>
                                            <ChevronRight className="w-4 h-4 text-foreground/10 group-hover:text-secondary/40 transition-colors" />
                                        </div>
                                        <p className="text-[11px] text-foreground/30 font-medium leading-relaxed">{service.desc}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
