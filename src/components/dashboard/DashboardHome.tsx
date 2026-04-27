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
import { useState, useEffect, useMemo, useRef } from "react";
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
    const { user, refreshUser, isLoading: userLoading } = useAuth();
    const router = useRouter();
    
    // States
    const [kundliStats, setKundliStats] = useState<KundliStats | null>(null);
    const [kundliLoading, setKundliLoading] = useState(true);
    const greeting = useGreeting();
    const hasAnalyzedRef = useRef<string | null>(null);

    // Memos
    const age = useMemo(() => calculateAge(user?.dob), [user?.dob]);
    const ageBracket = useMemo(() => getAgeBracket(age), [age]);
    const personalizedQuestions = useMemo(() => getPersonalizedQuestions(ageBracket), [ageBracket]);
    const moonSign = useMemo(() => user?.moonSign ? getRashiData(user.moonSign) : null, [user?.moonSign]);
    const sunSign = useMemo(() => user?.sunSign ? getRashiData(user.sunSign) : null, [user?.sunSign]);

    // Effects
    useEffect(() => {
        if (!user || !user.astrologyData) {
            setKundliLoading(false);
            return;
        }
        
        try {
            setKundliLoading(true);
            let analysis = user.astrologyData;
            if (typeof analysis === 'string') {
                try {
                    analysis = JSON.parse(analysis);
                } catch (e) {
                    console.error("Failed to parse analysis string", e);
                }
            }

            const stats: KundliStats = {};
            if (Array.isArray(analysis?.houses)) stats.lagnaSign = analysis.houses.find((h: { house: number; sign: string }) => h.house === 1)?.sign;
            if (typeof analysis?.nakshatra === 'string') stats.nakshatra = analysis.nakshatra;
            if (typeof analysis?.nakshatraLord === 'string') stats.nakshatraLord = analysis.nakshatraLord;
            if (analysis?.dasha) {
                // Try different formats to extract the current dasha name
                const dasha = analysis.dasha as any;
                let dashaName = dasha.currentMahaDasha || dasha.current;
                let dashaRemaining = dasha.remaining;

                // Fallback to the active array if flat strings are missing
                if (!dashaName && dasha.active?.length > 0) {
                    const maha = dasha.active.find((p: any) => p.type === 'Mahadasha') || dasha.active[0];
                    const anta = dasha.active.find((p: any) => p.type === 'Antardasha');
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
            if (typeof analysis?.moonPhase === 'string') stats.moonPhase = analysis.moonPhase;
            setKundliStats(Object.keys(stats).length > 0 ? stats : null);
        } catch (error) {
            console.error("Error setting kundli stats:", error);
            setKundliStats(null);
        } finally {
            setKundliLoading(false);
        }
    }, [user?.astrologyData]);

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
        <div className="w-full flex-grow bg-[var(--bg)] min-h-[calc(100dvh-var(--navbar-height,64px))]">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-0 lg:pt-2 pb-4 lg:pb-6">
                
                {/* ZONE 1: IDENTITY BAR */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8 sm:mb-10 pt-4 lg:pt-0">
                    {/* Left: Greeting */}
                    <div className="space-y-3 lg:-mt-2 text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start gap-3">
                            <div className="hidden sm:block h-[1px] w-8 bg-secondary/30" />
                            <p className="text-[10px] sm:text-[11px] font-bold text-foreground/40 uppercase tracking-[0.3em]">{currentDate}</p>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-bold tracking-tight leading-tight">
                            {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-amber-500 to-secondary animate-gradient-x capitalize">{user?.name || user?.email?.split('@')[0] || "Seeker"}</span>
                        </h1>
                    </div>

                    {/* Right: Sign Circles (The Identity Badges) */}
                    <div className="flex justify-center lg:justify-end gap-3 sm:gap-6 lg:gap-8 shrink-0 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                        {[
                            { label: "Moon Sign", data: moonSign, color: "text-blue-400" },
                            { label: "Sun Sign", data: sunSign, color: "text-amber-500" },
                            { label: "Ascendant", data: (user?.lagnaSign || kundliStats?.lagnaSign) ? getRashiData((user?.lagnaSign || kundliStats?.lagnaSign) as string) : null, color: "text-purple-400" }
                        ].map((sign, idx) => (
                            <Link key={idx} href={sign.data?.id ? `/rashis?sign=${sign.data.id}` : '/rashis'} className="group relative flex flex-col items-center min-w-[80px] sm:min-w-[100px]">
                                {/* The Circle */}
                                <div className="w-16 h-16 sm:w-20 lg:w-24 sm:h-20 lg:h-24 rounded-full bg-surface border border-outline-variant/20 flex flex-col items-center justify-center transition-all duration-500 group-hover:border-secondary/50 group-hover:-translate-y-1 group-hover:shadow-[0_0_30px_rgba(255,183,77,0.1)] overflow-hidden relative">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    {sign.data?.icon ? (
                                        <Image 
                                            src={sign.data.icon} 
                                            alt={sign.data.name} 
                                            width={48}
                                            height={48}
                                            className="w-8 h-8 sm:w-10 lg:w-12 object-contain transition-transform duration-500 group-hover:scale-110" 
                                        />
                                    ) : (
                                        <Sparkles className="w-5 h-5 sm:w-6 text-foreground/10" />
                                    )}
                                </div>
                                {/* Label & Name */}
                                <div className="mt-2 text-center">
                                    <p className="text-[8px] sm:text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em] leading-none mb-1">{sign.label}</p>
                                    <p className={`text-[10px] sm:text-xs lg:text-sm font-headline font-bold ${sign.color} group-hover:text-amber-500 transition-colors uppercase tracking-[0.1em] whitespace-nowrap`}>
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
                    <div className="lg:col-span-8 lg:-mt-4">
                        <DailyHoroscopeCard sign={user?.moonSign} />
                    </div>

                    {/* Sidebar: Questions & Stats */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <Card padding="none" className="!rounded-[32px] border-secondary/20 bg-surface overflow-hidden flex flex-col shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                            <div className="p-6 border-b border-white/5 bg-transparent flex items-center justify-between">
                                <h3 className="text-[12px] font-bold flex items-center gap-3 text-secondary uppercase tracking-[0.2em]"><MessageSquare className="w-5 h-5" /> Chat With Navi</h3>
                                <div className="w-1.5 h-1.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(200,136,10,0.5)]" />
                            </div>
                            <div className="p-5 space-y-3">

                                {personalizedQuestions.map((q, i) => (
                                    <button key={i} onClick={() => handleQuickAsk(q)} className="w-full text-left p-5 rounded-[24px] bg-surface-variant/40 border border-white/5 hover:border-secondary/30 hover:bg-surface group transition-all duration-300">
                                        <div className="flex justify-between items-center gap-4"><span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors truncate">{q}</span><ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-secondary transition-transform group-hover:translate-x-1 shrink-0" /></div>
                                    </button>
                                ))}
                                
                                <div className="pt-2">
                                    <Link href="/chat" className="w-full flex items-center justify-center gap-2 p-4 rounded-[24px] bg-transparent border border-secondary/30 hover:bg-secondary/10 transition-all group">
                                        <Sparkles className="w-4 h-4 text-secondary group-hover:scale-110 transition-transform" />
                                        <span className="text-[12px] font-bold text-secondary uppercase tracking-[0.1em]">Ask Your Own Question</span>
                                    </Link>
                                </div>
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

