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
import { useChat } from "@/context/ChatContext";
import { motion, AnimatePresence } from "framer-motion";

function formatRelativeTime(date: Date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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
    const { chats, loadChats } = useChat();
    const router = useRouter();
    
    // States
    const [kundliStats, setKundliStats] = useState<KundliStats | null>(null);
    const [kundliLoading, setKundliLoading] = useState(true);
    const [sidebarTab, setSidebarTab] = useState<'chat' | 'history' | 'cosmic'>('chat');
    const greeting = useGreeting();
    const hasAnalyzedRef = useRef<string | null>(null);

    // Memos
    const age = useMemo(() => calculateAge(user?.dob), [user?.dob]);
    const ageBracket = useMemo(() => getAgeBracket(age), [age]);
    const personalizedQuestions = useMemo(() => getPersonalizedQuestions(ageBracket), [ageBracket]);
    const moonSign = useMemo(() => user?.moonSign ? getRashiData(user.moonSign) : null, [user?.moonSign]);
    const sunSign = useMemo(() => user?.sunSign ? getRashiData(user.sunSign) : null, [user?.sunSign]);

    const recentChats = useMemo(() => {
        return chats.slice(0, 5);
    }, [chats]);

    // Effects
    useEffect(() => {
        if (!user?.email) return;

        // 1. Try to use data already in user object (from AuthContext sync)
        if (user.astrologyData) {
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
                
                if (Object.keys(stats).length > 0) {
                    setKundliStats(stats);
                    setKundliLoading(false);
                    return;
                }
            } catch (error) {
                console.error("Error setting kundli stats from user object:", error);
            }
        }

        // 2. Fallback to SessionStorage cache
        const todayStr = new Date().toISOString().split('T')[0];
        const sessionKey = `analyzed_${user?.email}_${todayStr}`;
        const statsKey = `stats_${user?.email}_${todayStr}`;
        
        const sessionAnalyzed = sessionStorage.getItem(sessionKey);
        const cachedStats = sessionStorage.getItem(statsKey);
        
        if (sessionAnalyzed && cachedStats) {
            try {
                setKundliStats(JSON.parse(cachedStats));
                setKundliLoading(false);
                return;
            } catch (e) {
                console.error("Failed to parse cached stats", e);
            }
        }

        // 3. Last resort: Fetch fresh analysis
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
                // Using the more robust parsing logic from upstream
                if (Array.isArray(analysis?.houses)) stats.lagnaSign = analysis.houses.find((h: { house: number; sign: string }) => h.house === 1)?.sign;
                if (typeof analysis?.nakshatra === 'string') stats.nakshatra = analysis.nakshatra;
                if (typeof analysis?.nakshatraLord === 'string') stats.nakshatraLord = analysis.nakshatraLord;
                if (analysis?.dasha) {
                    const dasha = analysis.dasha as any;
                    let dashaName = dasha.currentMahaDasha || dasha.current;
                    let dashaRemaining = dasha.remaining;

                    if (!dashaName && dasha.active?.length > 0) {
                        const maha = dasha.active.find((p: any) => p.type === 'Mahadasha') || dasha.active[0];
                        const anta = dasha.active.find((p: any) => p.type === 'Antardasha');
                        dashaName = anta ? `${maha.planet}-${anta.planet}` : maha.planet;
                        
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
                
                if (Object.keys(stats).length > 0) {
                    setKundliStats(stats);
                    sessionStorage.setItem(statsKey, JSON.stringify(stats));
                    sessionStorage.setItem(sessionKey, 'true');
                }

                // After successful analysis, re-fetch profile to get updated signs if needed
                fetch('/api/user/profile')
                    .then(r => r.json())
                    .then(d => { if (d.user) refreshUser(d.user); })
                    .catch(() => {});
            })
            .catch(() => setKundliStats(null))
            .finally(() => setKundliLoading(false));
    }, [user?.email, user?.astrologyData, refreshUser]);

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
                        <DailyHoroscopeCard userLoading={userLoading} />
                    </div>

                    {/* Sidebar: Unified Unified Tabbed Card */}
                    <div className="lg:col-span-4 flex flex-col">
                        <Card padding="none" className="!rounded-[32px] border-secondary/20 bg-surface overflow-hidden flex flex-col shadow-[0_0_20px_rgba(212,175,55,0.05)] h-full">
                            {/* Tab Switcher */}
                            <div className="p-2 border-b border-white/5 flex items-center gap-1">
                                {[
                                    { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
                                    { id: 'history', label: 'History', icon: <Users className="w-4 h-4" /> },
                                    { id: 'cosmic', label: 'Cosmic', icon: <Orbit className="w-4 h-4" /> }
                                ].map((tab) => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setSidebarTab(tab.id as any)}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[20px] text-[11px] font-bold uppercase tracking-widest transition-all ${
                                            sidebarTab === tab.id 
                                            ? 'bg-secondary/10 text-secondary border border-secondary/20 shadow-inner' 
                                            : 'text-foreground/40 hover:text-foreground/60 hover:bg-white/5'
                                        }`}
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto scrollbar-hide min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {sidebarTab === 'chat' && (
                                        <motion.div 
                                            key="chat"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="p-5 space-y-3"
                                        >
                                            <div className="flex items-center justify-between mb-4 px-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">Navi AI Online</span>
                                                </div>
                                            </div>

                                            {personalizedQuestions.map((q, i) => (
                                                <button key={i} onClick={() => handleQuickAsk(q)} className="w-full text-left p-5 rounded-[24px] bg-surface-variant/40 border border-white/5 hover:border-secondary/30 hover:bg-surface group transition-all duration-300">
                                                    <div className="flex justify-between items-center gap-4">
                                                        <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground transition-colors line-clamp-1">{q}</span>
                                                        <ChevronRight className="w-4 h-4 text-foreground/40 group-hover:text-secondary transition-transform group-hover:translate-x-1 shrink-0" />
                                                    </div>
                                                </button>
                                            ))}
                                            
                                            <div className="pt-2">
                                                <Link href="/chat" className="w-full flex items-center justify-center gap-3 p-5 rounded-[24px] bg-secondary text-background font-bold text-[13px] uppercase tracking-widest hover:bg-secondary/90 transition-all shadow-[0_10px_20px_rgba(212,175,55,0.2)] hover:-translate-y-0.5 active:translate-y-0">
                                                    <MessageSquare className="w-4.5 h-4.5" />
                                                    Open Full Chat
                                                </Link>
                                                <p className="text-center mt-4 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                                                    AI analysis based on your birth chart
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}

                                    {sidebarTab === 'history' && (
                                        <motion.div 
                                            key="history"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="p-5 space-y-3"
                                        >
                                            {recentChats.length > 0 ? (
                                                <>
                                                    <div className="flex items-center gap-2 mb-4 px-1 text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">
                                                        Recent Consultations
                                                    </div>
                                                    {recentChats.map((chat) => (
                                                        <Link key={chat.id} href={`/chat?id=${chat.id}`} className="block p-4 rounded-[20px] bg-surface-variant/20 border border-white/5 hover:border-secondary/20 hover:bg-surface-variant/40 transition-all group">
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[13px] font-bold text-foreground/80 group-hover:text-foreground truncate mb-1">{chat.title || "New Consultation"}</p>
                                                                    <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{formatRelativeTime(new Date(chat.updatedAt))}</p>
                                                                </div>
                                                                <ChevronRight className="w-3.5 h-3.5 text-foreground/20 group-hover:text-secondary mt-1" />
                                                            </div>
                                                        </Link>
                                                    ))}
                                                    <Link href="/chat" className="block text-center mt-6 text-[10px] font-bold text-secondary uppercase tracking-[0.3em] hover:text-amber-500 transition-colors">View All Conversations →</Link>
                                                </>
                                            ) : (
                                                <div className="py-20 flex flex-col items-center text-center px-6">
                                                    <div className="w-16 h-16 rounded-full bg-surface-variant/20 flex items-center justify-center mb-4">
                                                        <Users className="w-8 h-8 text-foreground/10" />
                                                    </div>
                                                    <p className="text-sm font-headline font-bold text-foreground/60 mb-1">No History Yet</p>
                                                    <p className="text-[11px] font-medium text-foreground/30 leading-relaxed">Start your first conversation with Navi to see it here.</p>
                                                    <Button onClick={() => setSidebarTab('chat')} variant="secondary" size="sm" className="mt-6 rounded-full text-[10px] font-bold uppercase tracking-widest">Start Chatting</Button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {sidebarTab === 'cosmic' && (
                                        <motion.div 
                                            key="cosmic"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="p-5 flex flex-col h-full"
                                        >
                                            {kundliLoading ? (
                                                <div className="space-y-4 pt-4">
                                                    <SkeletonPulse className="h-14" />
                                                    <SkeletonPulse className="h-14" />
                                                    <SkeletonPulse className="h-14" />
                                                    <SkeletonPulse className="h-14" />
                                                </div>
                                            ) : kundliStats ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-4 px-1 text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">
                                                        Current Transits & Dasha
                                                    </div>
                                                    {[
                                                        { 
                                                            l: "Nakshatra", 
                                                            v: kundliStats.nakshatra, 
                                                            icon: kundliStats.nakshatra ? (
                                                                <div className="relative w-full h-full overflow-hidden rounded-lg">
                                                                    <Image 
                                                                        src={`/icons/nakshatras/${kundliStats.nakshatra.toLowerCase()}.jpeg`}
                                                                        alt={kundliStats.nakshatra}
                                                                        fill
                                                                        className="object-cover"
                                                                        onError={(e) => {
                                                                            // Fallback to hidden if image doesn't exist, 
                                                                            // the parent bg-secondary/10 will still show
                                                                            (e.target as HTMLImageElement).style.opacity = '0';
                                                                        }}
                                                                    />
                                                                </div>
                                                            ) : <Sparkles className="w-3.5 h-3.5" />
                                                        },
                                                        { l: "Lord", v: kundliStats.nakshatraLord, icon: <Orbit className="w-3.5 h-3.5" /> },
                                                        { l: "Active Dasha", v: kundliStats.activeDasha, icon: <TrendingUp className="w-3.5 h-3.5" />, sub: kundliStats.dashaRemaining },
                                                        { l: "Lagna", v: kundliStats.lagnaSign, icon: <Globe className="w-3.5 h-3.5" /> }
                                                    ].map((s, i) => s.v && (
                                                        <div key={i} className="flex items-center gap-4 p-4 rounded-[24px] bg-surface-variant/20 border border-white/5">
                                                            <div className="w-10 h-10 rounded-xl bg-transparent flex items-center justify-center text-secondary shrink-0 overflow-hidden">
                                                                {s.icon}
                                                            </div>
                                                            <div className="flex-1 flex justify-between items-center">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mb-0.5">{s.l}</span>
                                                                    <span className="text-xs font-bold text-foreground/90">{s.v}</span>
                                                                </div>
                                                                {s.sub && (
                                                                    <div className="px-2.5 py-1 rounded-lg bg-surface/40 border border-white/5">
                                                                        <span className="text-[9px] font-bold text-secondary uppercase tracking-tighter">{s.sub}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <div className="pt-4">
                                                        <Link href="/kundli" className="w-full flex items-center justify-center gap-2 p-4 rounded-[24px] border border-secondary/20 hover:bg-secondary/5 transition-all group">
                                                            <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em]">Compare Full Chart</span>
                                                            <ChevronRight className="w-3.5 h-3.5 text-secondary group-hover:translate-x-1 transition-transform" />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-20 flex flex-col items-center text-center px-6">
                                                    <div className="w-16 h-16 rounded-full bg-surface-variant/20 flex items-center justify-center mb-4">
                                                        <Orbit className="w-8 h-8 text-foreground/10" />
                                                    </div>
                                                    <p className="text-sm font-headline font-bold text-foreground/60 mb-1">Chart Pending</p>
                                                    <p className="text-[11px] font-medium text-foreground/30 leading-relaxed">Please complete your birth details to unlock cosmic insights.</p>
                                                    <Link href="/profile" className="mt-6">
                                                        <Button variant="secondary" size="sm" className="rounded-full text-[10px] font-bold uppercase tracking-widest">Update Profile</Button>
                                                    </Link>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
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

