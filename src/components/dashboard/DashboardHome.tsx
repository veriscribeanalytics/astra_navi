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
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calculateAge, getAgeBracket, getPersonalizedQuestions } from "@/utils/personalizedQuestions";
import { useGreeting } from "@/hooks/useGreeting";
import { getRashiData } from "@/lib/astrology";
import ScoreRing from "@/components/ui/ScoreRing";

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

const getLuckyColorHex = (luckyColor?: string) => {
    if (!luckyColor) return '#94a3b8'; // Default to grey
    const searchColor = luckyColor.toLowerCase();
    
    const families = [
        { id: 'pink', keywords: ['pink', 'rose', 'magenta'], hex: '#f472b6' },
        { id: 'red', keywords: ['red', 'maroon', 'crimson', 'ruby'], hex: '#dc2626' },
        { id: 'blue', keywords: ['blue', 'navy', 'indigo', 'cyan', 'azure'], hex: '#2563eb' },
        { id: 'green', keywords: ['green', 'emerald', 'olive', 'teal'], hex: '#059669' },
        { id: 'yellow', keywords: ['yellow', 'saffron', 'gold', 'amber'], hex: '#f59e0b' },
        { id: 'orange', keywords: ['orange', 'peach', 'coral'], hex: '#ea580c' },
        { id: 'purple', keywords: ['purple', 'violet', 'lavender', 'plum'], hex: '#7c3aed' },
        { id: 'white', keywords: ['white', 'cream', 'ivory', 'pearl'], hex: '#ffffff' },
        { id: 'black', keywords: ['black', 'charcoal', 'void'], hex: '#111827' },
        { id: 'grey', keywords: ['grey', 'gray', 'silver', 'slate'], hex: '#94a3b8' },
        { id: 'brown', keywords: ['brown', 'khaki', 'chocolate', 'coffee'], hex: '#78350f' },
    ];

    const family = families.find(f => 
        f.keywords.some(kw => searchColor.includes(kw)) || searchColor === f.id
    );

    return family ? family.hex : '#fbbf24'; // Default to Solar Gold
};

interface KundliStats {
    nakshatra?: string;
    nakshatraLord?: string;
    activeDasha?: string;
    dashaRemaining?: string;
    moonPhase?: string;
    lagnaSign?: string;
}

// ─── Sub-components ─────────────────────────────
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
    const greeting = useGreeting();

    // Memos
    const age = useMemo(() => calculateAge(user?.dob), [user?.dob]);
    const ageBracket = useMemo(() => getAgeBracket(age), [age]);
    const personalizedQuestions = useMemo(() => getPersonalizedQuestions(ageBracket), [ageBracket]);
    const moonSign = useMemo(() => user?.moonSign ? getRashiData(user.moonSign) : null, [user?.moonSign]);
    const sunSign = useMemo(() => user?.sunSign ? getRashiData(user.sunSign) : null, [user?.sunSign]);

    // Effects
    useEffect(() => {
        setHoroscopeLoading(true);
        fetch(`/api/daily-horoscope${user?.moonSign ? `?sign=${encodeURIComponent(user.moonSign)}` : ''}`)
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => { setHoroscope(data); setHoroscopeError(false); })
            .catch(() => setHoroscopeError(true))
            .finally(() => setHoroscopeLoading(false));
    }, []);

    useEffect(() => {
        setKundliLoading(true);
        fetch('/api/analyze-full', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ force_refresh: false }),
        })
            .then(res => res.ok ? res.json() : null)
            .then(result => {
                if (!result) return;
                
                let analysis = result.astrologyData || result.data?.astrologyData || result.insights?.astrologyData || result.data || result;
                if (typeof analysis === 'string') {
                    try {
                        analysis = JSON.parse(analysis);
                    } catch (e) {
                        console.error("Failed to parse analysis string", e);
                    }
                }

                const stats: KundliStats = {};
                if (analysis?.houses) stats.lagnaSign = analysis.houses.find((h: { house: number; sign: string }) => h.house === 1)?.sign;
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
        { title: "Kundli Match", desc: "Vedic compatibility (36 pts)", href: "/kundli/match", icon: <Heart className="w-7 h-7" />, color: "from-pink-500/15 to-rose-500/10", iconColor: "text-pink-400", border: "hover:border-pink-500/30" },
        { title: "Rashi Library", desc: "Explore all 12 zodiac signs", href: "/rashis", icon: <Orbit className="w-7 h-7" />, color: "from-amber-500/15 to-orange-500/10", iconColor: "text-amber-500", border: "hover:border-amber-500/30" },
        { title: "Daily Horoscope", desc: "Predictions for any sign", href: "/horoscope", icon: <Sparkles className="w-7 h-7" />, color: "from-purple-500/15 to-violet-500/10", iconColor: "text-purple-400", border: "hover:border-purple-500/30" },
        { title: "Guided Reading", desc: "Step-by-step AI insights", href: "/consult", icon: <Sparkles className="w-7 h-7" />, color: "from-amber-500/15 to-orange-500/10", iconColor: "text-amber-500", border: "hover:border-amber-500/30" },
        { title: "Consult Navi AI", desc: "Direct chat with Navi", href: "/chat", icon: <MessageSquare className="w-7 h-7" />, color: "from-secondary/15 to-amber-500/10", iconColor: "text-secondary", border: "hover:border-secondary/30" },
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
                    <div className="grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8 shrink-0">
                        {[
                            { label: "Moon Sign", data: moonSign, color: "text-blue-400" },
                            { label: "Sun Sign", data: sunSign, color: "text-amber-500" },
                            { label: "Ascendant", data: (user?.lagnaSign || kundliStats?.lagnaSign) ? getRashiData((user?.lagnaSign || kundliStats?.lagnaSign) as string) : null, color: "text-purple-400" }
                        ].map((sign, idx) => (
                            <div key={idx} className="group relative flex flex-col items-center">
                                {/* The Circle */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-surface border border-outline-variant/20 flex flex-col items-center justify-center transition-all duration-500 group-hover:border-secondary/50 group-hover:-translate-y-1 group-hover:shadow-[0_0_30px_rgba(255,183,77,0.1)] overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {sign.data?.icon ? (
                                        <Image 
                                            src={sign.data.icon} 
                                            alt={sign.data.name} 
                                            width={48}
                                            height={48}
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
                        <Card padding="none" className="!rounded-[32px] border-outline-variant/15 overflow-hidden h-full">
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
                                    <div className="p-3 sm:p-4 border-b border-outline-variant/30 bg-surface">
                                        <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 sm:gap-4 relative">
                                            {/* Sign Info */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <Sparkles className="w-3 h-3 text-secondary" />
                                                    <span className="text-[12px] font-bold text-secondary uppercase tracking-[0.15em] leading-tight">
                                                        Daily Horoscope
                                                    </span>
                                                </div>
                                                <h3 className="text-xl sm:text-2xl font-headline font-bold text-foreground leading-tight break-all sm:break-normal">
                                                    {horoscope.sign}
                                                </h3>
                                            </div>

                                            {/* Date Block - Desktop Centered */}
                                            <div className="hidden sm:flex flex-col items-center px-6 border-l border-r border-outline-variant/10 absolute left-1/2 -translate-x-1/2">
                                                <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.1em] mb-0.5">
                                                    {new Date().toLocaleDateString('en-IN', { weekday: 'long' })}
                                                </span>
                                                <span className="text-sm font-headline font-bold text-foreground/60">
                                                    {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}
                                                </span>
                                            </div>

                                            {/* Right Section: Link + Custom Score Circle */}
                                            <div className="flex items-center gap-4 ml-auto">
                                                <Link href="/horoscope" className="hidden lg:flex items-center gap-1 text-[10px] font-bold text-foreground/30 hover:text-secondary transition-colors uppercase tracking-widest mr-2">
                                                    Full View <ArrowRight className="w-4 h-4" />
                                                </Link>
                                                
                                                <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex-shrink-0">
                                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                                                        <circle cx="36" cy="36" r="32" fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-variant/20" />
                                                        <circle
                                                            cx="36" cy="36" r="32" fill="none" strokeWidth="5" strokeLinecap="round"
                                                            strokeDasharray={2 * Math.PI * 32}
                                                            strokeDashoffset={(2 * Math.PI * 32) - ((horoscope.overall_score || 0) / 100) * (2 * Math.PI * 32)}
                                                            className="transition-all duration-1000 ease-out"
                                                            style={{ stroke: (horoscope.overall_score || 0) >= 80 ? '#D4A017' : (horoscope.overall_score || 0) >= 60 ? '#E8832A' : '#E84A2A' }}
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                        <span className="text-xl font-bold leading-none text-foreground">
                                                            {horoscope.overall_score || 0}
                                                        </span>
                                                        <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-wider mt-0.5">
                                                            Overall
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Top Info Row - Grid style */}
                                    <div className={`grid grid-cols-2 sm:grid-cols-3 border-b border-outline-variant/30 bg-surface`}>
                                        <div className="flex flex-col items-center justify-center p-3 sm:p-4 border-r border-b sm:border-b-0 border-white/5">
                                            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Mood</span>
                                            <span className="text-xs sm:text-sm font-headline font-bold text-foreground">
                                                {horoscope.mood || '—'}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-center justify-center p-3 sm:p-4 sm:border-r border-b sm:border-b-0 border-white/5">
                                            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1 text-center leading-none">Lucky Color</span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {horoscope.lucky_color ? (
                                                    <div 
                                                        className="w-2.5 h-2.5 rounded-full shadow-inner" 
                                                        style={{ backgroundColor: getLuckyColorHex(horoscope.lucky_color) }}
                                                    />
                                                ) : null}
                                                <span className="text-xs sm:text-sm font-headline font-bold text-foreground">
                                                    {horoscope.lucky_color || '—'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`flex flex-col items-center justify-center p-3 sm:p-4 sm:border-b-0 border-white/5`}>
                                            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mb-1 text-center leading-none">Lucky #</span>
                                            <span className="text-xs sm:text-sm font-headline font-bold text-secondary">
                                                {horoscope.lucky_number ?? '—'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 bg-outline-variant/5">
                                        {[
                                            { label: "Career", val: horoscope.career, icon: <Briefcase className="w-3.5 h-3.5" />, color: "text-orange-500", bg: "bg-orange-500/10", glow: "shadow-orange-500/5" },
                                            { label: "Health", val: horoscope.health, icon: <Activity className="w-3.5 h-3.5" />, color: "text-green-500", bg: "bg-green-500/10", glow: "shadow-green-500/5" },
                                            { label: "Love", val: horoscope.love, icon: <Heart className="w-3.5 h-3.5" />, color: "text-pink-500", bg: "bg-pink-500/10", glow: "shadow-pink-500/5" },
                                            { label: "Finance", val: horoscope.finance, icon: <DollarSign className="w-3.5 h-3.5" />, color: "text-amber-500", bg: "bg-amber-500/10", glow: "shadow-amber-500/5" }
                                        ].map((item, i) => (
                                            <div 
                                                key={i} 
                                                className={`p-6 sm:p-7 md:p-8 bg-surface transition-all duration-300 hover:bg-surface-variant/5 group/item relative overflow-hidden flex flex-col gap-4 border-outline-variant/10 [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-r`}
                                            >
                                                <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover/item:bg-gradient-to-b group-hover/item:from-secondary/40 group-hover/item:to-transparent transition-all duration-500" />
                                                <div className="flex items-center gap-3.5">
                                                    <div className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center transition-all duration-500 group-hover/item:scale-110 group-hover/item:shadow-lg ${item.glow}`}>
                                                        {item.icon}
                                                    </div>
                                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.25em] transition-colors group-hover/item:text-foreground/60">{item.label}</p>
                                                </div>
                                                <p className="text-[13px] sm:text-[14px] font-medium leading-relaxed text-foreground/75 tracking-tightest group-hover/item:text-foreground transition-colors duration-300">
                                                    {item.val}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Card>
                    </div>

                    {/* Sidebar: Questions & Stats */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <Card padding="none" className="!rounded-[32px] border-outline-variant/15 overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-outline-variant/10 bg-secondary/5 flex items-center justify-between">
                                <h3 className="text-[11px] font-bold flex items-center gap-2.5 text-secondary uppercase tracking-[0.2em]"><MessageSquare className="w-4 h-4" /> Guidance From Navi</h3>
                                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shadow-[0_0_8px_rgba(200,136,10,0.5)]" />
                            </div>
                            <div className="p-5 space-y-2.5">
                                {personalizedQuestions.map((q, i) => (
                                    <button key={i} onClick={() => handleQuickAsk(q)} className="w-full text-left p-4 rounded-2xl bg-surface border border-outline-variant/20 hover:border-secondary/40 hover:bg-secondary/5 group transition-all duration-300">
                                        <div className="flex justify-between items-center gap-4"><span className="text-[12px] font-medium text-foreground/60 group-hover:text-foreground/90 transition-colors line-clamp-1 leading-relaxed">{q}</span><ChevronRight className="w-3.5 h-3.5 text-foreground/20 group-hover:text-secondary transition-transform group-hover:translate-x-0.5" /></div>
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <Card padding="none" className="!rounded-[32px] border-outline-variant/15 overflow-hidden flex-1 flex flex-col">
                            <div className="p-6 border-b border-outline-variant/10 bg-secondary/5">
                                <h3 className="text-[11px] font-bold flex items-center gap-2.5 text-secondary uppercase tracking-[0.2em]"><Orbit className="w-4 h-4" /> Cosmic Overview</h3>
                            </div>
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
                                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-surface border border-outline-variant/10"><span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{s.l}</span><span className="text-xs font-bold text-foreground/90">{s.v}</span></div>
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
                                <div className={`h-full p-6 sm:p-8 rounded-[32px] bg-gradient-to-br ${item.color} border border-outline-variant/10 ${item.border} transition-all duration-300 group-hover:-translate-y-1`}>
                                    <div className={`w-14 h-14 rounded-2xl bg-surface flex items-center justify-center mb-6 ${item.iconColor} group-hover:scale-110 transition-transform duration-500`}>{item.icon}</div>
                                    <div className="flex justify-between items-start">
                                        <div><h3 className="text-base sm:text-lg font-headline font-bold mb-1 group-hover:text-secondary transition-colors">{item.title}</h3><p className="text-xs font-medium text-foreground/30 leading-relaxed line-clamp-2">{item.desc}</p></div>
                                        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-all"><ChevronRight className="w-4 h-4 text-secondary" /></div>
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
