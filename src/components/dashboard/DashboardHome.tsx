"use client";

import { useAuth } from "@/context/AuthContext";
import { 
    Sparkles, MessageSquare, Globe, Heart, 
    ChevronRight, Orbit, ArrowRight, 
    Briefcase, Activity, DollarSign, Star,
    ShoppingBag, Users
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calculateAge, getAgeBracket, getPersonalizedQuestions } from "@/utils/personalizedQuestions";

// ─── Data Interfaces ─────────────────────────────
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

interface KundliStats {
    nakshatra?: string;
    nakshatraLord?: string;
    activeDasha?: string;
    dashaRemaining?: string;
    moonPhase?: string;
    lagnaSign?: string;
}

// ─── Helpers ─────────────────────────────
const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return "Good Night";
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    if (hour < 21) return "Good Evening";
    return "Good Night";
};

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

// ─── Sub-components ─────────────────────────────
function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const radius = (size / 2) - 6;
    const circumference = 2 * Math.PI * radius;

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedScore(score), 200);
        return () => clearTimeout(timer);
    }, [score]);

    const progress = circumference - (animatedScore / 100) * circumference;
    const color = score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : '#f97316';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-variant/20" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progress}
                    className="transition-all duration-[1500ms] ease-out"
                    style={{ stroke: color }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold leading-none" style={{ color }}>{animatedScore}</span>
                <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-wider mt-0.5">Score</span>
            </div>
        </div>
    );
}

function SkeletonPulse({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse bg-surface-variant/20 rounded-xl ${className}`} />;
}

// ─── Main Component ─────────────────────────────
export default function DashboardHome() {
    const { user } = useAuth();
    const router = useRouter();
    
    // States
    const [quickQuery, setQuickQuery] = useState("");
    const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
    const [horoscopeLoading, setHoroscopeLoading] = useState(true);
    const [horoscopeError, setHoroscopeError] = useState(false);
    const [kundliStats, setKundliStats] = useState<KundliStats | null>(null);
    const [kundliLoading, setKundliLoading] = useState(true);
    const [greeting, setGreeting] = useState(getGreeting());

    // Memos
    const age = useMemo(() => calculateAge(user?.dob), [user?.dob]);
    const ageBracket = useMemo(() => getAgeBracket(age), [age]);
    const personalizedQuestions = useMemo(() => getPersonalizedQuestions(ageBracket), [ageBracket]);
    const moonSign = useMemo(() => user?.moonSign ? getRashiData(user.moonSign) : null, [user?.moonSign]);
    const sunSign = useMemo(() => user?.sunSign ? getRashiData(user.sunSign) : null, [user?.sunSign]);

    // Effects
    useEffect(() => {
        const interval = setInterval(() => setGreeting(getGreeting()), 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user?.email) return;
        setHoroscopeLoading(true);
        fetch(`/api/daily-horoscope?email=${encodeURIComponent(user.email)}`)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => { setHoroscope(data); setHoroscopeError(false); })
            .catch(() => setHoroscopeError(true))
            .finally(() => setHoroscopeLoading(false));
    }, [user?.email]);

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
                if (!result) return;
                const analysis = result.data?.astrologyData || result.data || result;
                const stats: KundliStats = {};
                if (analysis?.houses) stats.lagnaSign = analysis.houses.find((h: any) => h.house === 1)?.sign;
                if (analysis?.nakshatra) stats.nakshatra = analysis.nakshatra;
                if (analysis?.nakshatraLord) stats.nakshatraLord = analysis.nakshatraLord;
                if (analysis?.dasha) {
                    stats.activeDasha = analysis.dasha.currentMahaDasha || analysis.dasha.current;
                    stats.dashaRemaining = analysis.dasha.remaining;
                }
                if (analysis?.moonPhase) stats.moonPhase = analysis.moonPhase;
                setKundliStats(Object.keys(stats).length > 0 ? stats : null);
            })
            .catch(() => setKundliStats(null))
            .finally(() => setKundliLoading(false));
    }, [user?.email]);

    // Handlers
    const handleQuickAsk = (question: string) => {
        localStorage.setItem('astranavi_pending_message', question.trim());
        router.push('/chat');
    };

    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Services
    const services = [
        { title: "My Kundli", desc: "Complete birth chart analysis", href: "/kundli", icon: <Globe className="w-7 h-7" />, color: "from-blue-500/15 to-indigo-500/10", iconColor: "text-blue-400", border: "hover:border-blue-500/30" },
        { title: "Rashi Library", desc: "Explore all 12 zodiac signs", href: "/rashis", icon: <Orbit className="w-7 h-7" />, color: "from-amber-500/15 to-orange-500/10", iconColor: "text-amber-500", border: "hover:border-amber-500/30" },
        { title: "Daily Horoscope", desc: "Predictions for any sign", href: "/horoscope", icon: <Sparkles className="w-7 h-7" />, color: "from-purple-500/15 to-violet-500/10", iconColor: "text-purple-400", border: "hover:border-purple-500/30" },
        { title: "Consult Navi AI", desc: "AI astrology consultation", href: "/chat", icon: <MessageSquare className="w-7 h-7" />, color: "from-secondary/15 to-amber-500/10", iconColor: "text-secondary", border: "hover:border-secondary/30" },
        { title: "Talk to Expert", desc: "Live astrologer consultation", href: "/astrologers", icon: <Users className="w-7 h-7" />, color: "from-green-500/15 to-emerald-500/10", iconColor: "text-green-400", border: "hover:border-green-500/30" },
        { title: "Remedy Shop", desc: "Vedic gems, rituals & more", href: "/shop", icon: <ShoppingBag className="w-7 h-7" />, color: "from-emerald-500/15 to-teal-500/10", iconColor: "text-emerald-400", border: "hover:border-emerald-500/30" },
    ];

    return (
        <div className="w-full flex-grow bg-[var(--bg)] min-h-screen">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                
                {/* ZONE 1: IDENTITY BAR */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16">
                    {/* Left: Greeting */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="h-[1px] w-8 bg-secondary/30" />
                            <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-[0.3em]">{currentDate}</p>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold tracking-tight">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-amber-500 to-secondary animate-gradient-x capitalize">{user?.name || user?.email?.split('@')[0] || "Seeker"}</span>
                        </h1>
                        <p className="text-[13px] text-foreground/30 font-medium max-w-md leading-relaxed italic">
                            &quot;The alignment of the stars on your birth continues to guide your journey today.&quot;
                        </p>
                    </div>

                    {/* Right: Sign Circles (The Identity Badges) */}
                    <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 flex-wrap">
                        {[
                            { label: "Moon Sign", data: moonSign, color: "text-blue-400" },
                            { label: "Sun Sign", data: sunSign, color: "text-amber-500" },
                            { label: "Ascendant", data: kundliStats?.lagnaSign ? getRashiData(kundliStats.lagnaSign) : null, color: "text-purple-400" }
                        ].map((sign, idx) => (
                            <div key={idx} className="group relative flex flex-col items-center">
                                {/* The Circle */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface/40 backdrop-blur-xl border border-outline-variant/20 flex flex-col items-center justify-center transition-all duration-500 group-hover:border-secondary/50 group-hover:-translate-y-1 group-hover:shadow-[0_0_30px_rgba(255,183,77,0.1)] overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {sign.data?.icon ? (
                                        <img 
                                            src={`${sign.data.icon}?v=4`} 
                                            alt={sign.data.name} 
                                            className="w-10 h-10 sm:w-12 sm:h-12 object-contain transition-transform duration-500 group-hover:scale-110" 
                                        />
                                    ) : (
                                        <Sparkles className="w-6 h-6 text-foreground/10" />
                                    )}
                                </div>
                                {/* Label & Name */}
                                <div className="mt-3 text-center">
                                    <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em] leading-none mb-1.5">{sign.label}</p>
                                    <p className={`text-[13px] sm:text-sm font-headline font-bold ${sign.color} group-hover:text-amber-500 transition-colors uppercase tracking-[0.1em]`}>
                                        {sign.data?.name || "???"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ZONE 2: HERO DASHBOARD */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
                    
                    {/* Horoscope Hero */}
                    <div className="lg:col-span-8">
                        <Card padding="none" className="!rounded-[32px] border-outline-variant/15 bg-surface/30 backdrop-blur-md overflow-hidden h-full">
                            {horoscopeLoading ? (
                                <div className="p-8 space-y-6">
                                    <div className="flex gap-6 items-center"><SkeletonPulse className="w-24 h-24 rounded-full" /><div className="flex-1 space-y-3"><SkeletonPulse className="h-6 w-1/3" /><SkeletonPulse className="h-4 w-1/2" /></div></div>
                                    <div className="grid grid-cols-2 gap-4"><SkeletonPulse className="h-28" /><SkeletonPulse className="h-28" /><SkeletonPulse className="h-28" /><SkeletonPulse className="h-28" /></div>
                                </div>
                            ) : horoscopeError || !horoscope ? (
                                <div className="p-12 flex flex-col items-center text-center gap-4">
                                    <Sparkles className="w-10 h-10 text-orange-500 opacity-20" />
                                    <p className="text-foreground/40 font-medium">Daily reading currently unavailable.</p>
                                    <button onClick={() => window.location.reload()} className="text-xs font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-6 py-2.5 rounded-full">Retry</button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center">
                                        <ScoreRing score={horoscope.overall_score || 50} />
                                        <div className="flex-1 text-center sm:text-left">
                                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2"><Sparkles className="w-4 h-4 text-secondary" /><span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Today's Energy</span></div>
                                            <h2 className="text-2xl font-headline font-bold mb-3">{horoscope.sign}</h2>
                                            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                                {horoscope.mood && <span className="px-3 py-1 bg-surface-variant/20 rounded-full text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Mood: {horoscope.mood}</span>}
                                                {horoscope.lucky_color && <span className="px-3 py-1 bg-surface-variant/20 rounded-full text-[10px] font-bold text-foreground/40 uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: horoscope.lucky_color }} /> {horoscope.lucky_color}</span>}
                                                {horoscope.lucky_number && <span className="px-3 py-1 bg-surface-variant/20 rounded-full text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Lucky: {horoscope.lucky_number}</span>}
                                            </div>
                                        </div>
                                        <Link href="/horoscope" className="sm:ml-auto group flex items-center gap-2 text-xs font-bold text-foreground/30 hover:text-secondary transition-colors uppercase tracking-widest">Full View <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></Link>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 border-t border-outline-variant/10">
                                        {[
                                            { label: "Career", val: horoscope.career, icon: <Briefcase className="w-4 h-4" />, color: "text-orange-500", bg: "bg-orange-500/5" },
                                            { label: "Health", val: horoscope.health, icon: <Activity className="w-4 h-4" />, color: "text-green-500", bg: "bg-green-500/5" },
                                            { label: "Love", val: horoscope.love, icon: <Heart className="w-4 h-4" />, color: "text-pink-500", bg: "bg-pink-500/5" },
                                            { label: "Finance", val: horoscope.finance, icon: <DollarSign className="w-4 h-4" />, color: "text-amber-500", bg: "bg-amber-500/5" }
                                        ].map((item, i) => (
                                            <div key={i} className="p-6 border-outline-variant/10 group hover:bg-surface/10 transition-colors [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-r">
                                                <div className="flex items-center gap-3 mb-3"><div className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center`}>{item.icon}</div><p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.15em]">{item.label}</p></div>
                                                <p className="text-sm font-medium leading-relaxed text-foreground/70">{item.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar: Questions & Stats */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <Card className="!rounded-[32px] border-outline-variant/15 bg-surface/30 backdrop-blur-md p-6">
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-4"><MessageSquare className="w-4 h-4 text-secondary" /> Guidance from Navi</h3>
                            <div className="space-y-2">
                                {personalizedQuestions.map((q, i) => (
                                    <button key={i} onClick={() => handleQuickAsk(q)} className="w-full text-left p-3 rounded-xl bg-surface/50 border border-outline-variant/20 hover:border-secondary/40 hover:bg-secondary/5 group transition-all">
                                        <div className="flex justify-between items-center gap-3"><span className="text-xs font-medium text-foreground/60 group-hover:text-foreground/90 transition-colors line-clamp-1">{q}</span><ChevronRight className="w-3.5 h-3.5 text-foreground/20 group-hover:text-secondary transition-colors" /></div>
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <Card className="!rounded-[32px] border-outline-variant/15 bg-surface/30 backdrop-blur-md p-6 flex-1">
                            <h3 className="text-sm font-bold flex items-center gap-2 mb-5"><Orbit className="w-4 h-4 text-secondary" /> Cosmic Profile</h3>
                            {kundliLoading ? (
                                <div className="space-y-3"><SkeletonPulse className="h-10" /><SkeletonPulse className="h-10" /><SkeletonPulse className="h-10" /></div>
                            ) : kundliStats ? (
                                <div className="space-y-2">
                                    {[
                                        { l: "Nakshatra", v: kundliStats.nakshatra },
                                        { l: "Lord", v: kundliStats.nakshatraLord },
                                        { l: "Dasha", v: kundliStats.activeDasha },
                                        { l: "Lagna", v: kundliStats.lagnaSign }
                                    ].map((s, i) => s.v && (
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-surface/40 border border-outline-variant/10"><span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{s.l}</span><span className="text-xs font-bold text-foreground/90">{s.v}</span></div>
                                    ))}
                                    <Link href="/kundli" className="block text-center mt-4 text-[10px] font-bold text-secondary uppercase tracking-[0.2em] hover:text-amber-500 transition-colors">Compare Full Chart →</Link>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center gap-4 py-4">
                                    <Globe className="w-8 h-8 text-foreground/10" />
                                    <p className="text-[11px] font-bold text-foreground/30 uppercase tracking-widest">Chart data pending</p>
                                    <Link href="/kundli"><Button size="sm" variant="primary" className="rounded-full px-6 text-[10px] font-bold uppercase tracking-widest">Explore Chart</Button></Link>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>

                {/* ZONE 3: SERVICES HUB */}
                <div>
                    <h2 className="text-lg font-headline font-bold flex items-center gap-3 mb-6"><div className="w-2 h-2 rounded-full bg-secondary" /> Explore AstraNavi Services</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {services.map((item, i) => (
                            <Link key={i} href={item.href} className="group">
                                <div className={`h-full p-6 sm:p-8 rounded-[32px] bg-gradient-to-br ${item.color} border border-outline-variant/10 ${item.border} backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1`}>
                                    <div className={`w-14 h-14 rounded-2xl bg-surface/40 flex items-center justify-center mb-6 ${item.iconColor} group-hover:scale-110 transition-transform duration-500`}>{item.icon}</div>
                                    <div className="flex justify-between items-start">
                                        <div><h3 className="text-base sm:text-lg font-headline font-bold mb-1 group-hover:text-secondary transition-colors">{item.title}</h3><p className="text-xs font-medium text-foreground/30 leading-relaxed line-clamp-2">{item.desc}</p></div>
                                        <div className="w-8 h-8 rounded-full bg-surface/40 flex items-center justify-center shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all"><ChevronRight className="w-4 h-4 text-secondary" /></div>
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
