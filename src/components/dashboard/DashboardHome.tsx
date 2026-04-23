"use client";

import { useAuth } from "@/context/AuthContext";
import { 
    Sparkles, MessageSquare, Globe, Heart, 
    ChevronRight, Orbit, TrendingUp,
    Briefcase, Activity, DollarSign,
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
import DailyHoroscopeCard from "@/components/dashboard/DailyHoroscopeCard";

// ─── Data Interfaces ─────────────────────────────
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
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    
    // States
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
                    // Try different formats to extract the current dasha name
                    let dashaName = analysis.dasha.currentMahaDasha || analysis.dasha.current;
                    let dashaRemaining = analysis.dasha.remaining;

                    // Fallback to the active array if flat strings are missing
                    if (!dashaName && analysis.dasha.active?.length > 0) {
                        const maha = analysis.dasha.active.find((p: any) => p.type === 'Mahadasha') || analysis.dasha.active[0];
                        const anta = analysis.dasha.active.find((p: any) => p.type === 'Antardasha');
                        dashaName = anta ? `${maha.planet}-${anta.planet}` : maha.planet;
                        
                        // Calculate remaining time if end date exists
                        if (!dashaRemaining && maha.end) {
                            const end = new Date(maha.end);
                            const now = Date.now();
                            const remDays = Math.max(0, Math.ceil((end.getTime() - now) / 86400000));
                            dashaRemaining = remDays > 365 ? `${(remDays / 365).toFixed(1)} years` : `${remDays} days`;
                        }
                    }

                    stats.activeDasha = dashaName;
                    stats.dashaRemaining = dashaRemaining;
                }
                if (analysis?.moonPhase) stats.moonPhase = analysis.moonPhase;
                setKundliStats(Object.keys(stats).length > 0 ? stats : null);

                // After successful analysis, re-fetch profile to get updated signs
                fetch('/api/user/profile')
                    .then(r => r.json())
                    .then(d => { if (d.user) refreshUser(d.user); })
                    .catch(() => {});
            })
            .catch(() => setKundliStats(null))
            .finally(() => setKundliLoading(false));
    }, [user?.email, refreshUser]);

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
        { title: "Consult Navi AI", desc: "Direct chat with Navi", href: "/chat", icon: <MessageSquare className="w-7 h-7" />, color: "from-secondary/15 to-amber-500/10", iconColor: "text-secondary", border: "hover:border-secondary/30" },
        { title: "Guided Reading", desc: "Step-by-step AI insights", href: "/consult", icon: <Sparkles className="w-7 h-7" />, color: "from-amber-500/15 to-orange-500/10", iconColor: "text-amber-500", border: "hover:border-amber-500/30" },
        { title: "Remedy Shop", desc: "Vedic gems, rituals & more", href: "/shop", icon: <ShoppingBag className="w-7 h-7" />, color: "from-emerald-500/15 to-teal-500/10", iconColor: "text-emerald-400", border: "hover:border-emerald-500/30" },
    ];

    return (
        <div className="w-full flex-grow bg-[var(--bg)] min-h-screen">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
                
                {/* ZONE 1: IDENTITY BAR */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
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
                            <Link key={idx} href={sign.data?.id ? `/rashis?sign=${sign.data.id}` : '/rashis'} className="group relative flex flex-col items-center">
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
                            </Link>
                        ))}
                    </div>
                </div>

                {/* ZONE 2: HERO DASHBOARD */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                    
                    {/* Horoscope Hero */}
                    <div className="lg:col-span-8">
                        <DailyHoroscopeCard sign={user?.moonSign} />
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
                                <div className="space-y-2 p-5">
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
                                <div className="flex flex-col items-center text-center gap-4 py-8">
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

