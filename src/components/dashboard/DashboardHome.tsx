"use client";

import { useAuth } from "@/context/AuthContext";
import { 
    Sparkles, MessageSquare, Globe, Heart, 
    ChevronRight, Orbit, TrendingUp,
    Briefcase, Activity, DollarSign,
    ShoppingBag, Users, Sun, ArrowUp, Plus
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { calculateAge, getAgeBracket, getPersonalizedQuestions } from "@/utils/personalizedQuestions";
import { useGreeting } from "@/hooks/useGreeting";
import { getRashiData } from "@/lib/astrology";
import { clientFetch } from "@/lib/apiClient";
import DailyHoroscopeCard from "@/components/dashboard/DailyHoroscopeCard";
import { useChat } from "@/context/ChatContext";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "@/hooks";

function formatRelativeTime(date: Date, t: (key: string) => string) {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return t('dashboard.justNow');
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}${t('dashboard.minutesAgo')}`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}${t('dashboard.hoursAgo')}`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}${t('dashboard.daysAgo')}`;
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
import { Skeleton, SkeletonCircle } from "@/components/ui/Skeleton";

import { topicPills } from '@/data/topicPills';

const getFeatures = (t: (key: string) => string) => [
    { 
        type: 'feature',
        label: t('dashboard.janamKundli'), 
        desc: t('dashboard.janamKundliDesc'), 
        icon: <Globe className="w-5 h-5" />, 
        href: "/kundli",
        color: "text-blue-400"
    },
    { 
        type: 'feature',
        label: t('dashboard.aiGuidance'), 
        desc: t('dashboard.aiGuidanceDesc'), 
        icon: <MessageSquare className="w-5 h-5" />, 
        href: "/chat",
        color: "text-secondary"
    },
    { 
        type: 'questions',
        label: t('dashboard.quickAsk'),
        desc: t('dashboard.quickAskDesc'),
        questions: ["How is my day today?", "What's my lucky color?", "Career prediction?", "Check health score"],
        color: "text-emerald-400"
    },
    { 
        type: 'feature',
        label: t('dashboard.soulmateSync'), 
        desc: t('dashboard.soulmateSyncDesc'), 
        icon: <Heart className="w-5 h-5" />, 
        href: "/kundli/match",
        color: "text-rose-400"
    },
    { 
        type: 'feature',
        label: t('dashboard.guidedConsulting'), 
        desc: t('dashboard.guidedConsultingDesc'), 
        icon: <Sparkles className="w-5 h-5" />, 
        href: "/consult",
        color: "text-amber-400"
    },
    { 
        type: 'questions',
        label: t('dashboard.deepDive'),
        desc: t('dashboard.deepDiveDesc'),
        questions: ["Weekly forecast?", "Love compatibility?", "Wealth timing?", "Ask a secret"],
        color: "text-indigo-400"
    },
    { 
        type: 'feature',
        label: t('dashboard.cosmicArchive'), 
        desc: t('dashboard.cosmicArchiveDesc'), 
        icon: <Sun className="w-5 h-5" />, 
        href: "/blogs",
        color: "text-purple-400"
    }
];

function FeatureSlider({ onQuestion, t }: { onQuestion: (q: string) => void, t: (key: string) => string }) {
    const features = useMemo(() => getFeatures(t), [t]);
    const [idx, setIdx] = useState(0);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isHovered) return;
        const timer = setInterval(() => {
            setIdx((prev) => (prev + 1) % features.length);
        }, 6000); // Slightly slower rotation for questions
        return () => clearInterval(timer);
    }, [isHovered, features.length]);

    const current = features[idx];

    return (
        <div 
            className="w-full h-full px-8 flex items-center justify-between cursor-default group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex-1 min-w-0">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="flex items-center gap-10 w-full"
                    >
                        {current.type === 'feature' ? (
                            <>
                                <div className={`w-14 h-14 rounded-2xl bg-background border border-white/10 flex items-center justify-center shrink-0 ${current.color} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                    {current.icon}
                                </div>
                                <div className="flex flex-col min-w-0 pr-6">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${current.color} leading-none mb-3`}>{current.label}</span>
                                    <p className="text-[17px] font-bold text-foreground leading-tight tracking-tight">{current.desc}</p>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col w-full">
                                <div className="flex items-center gap-3 mb-3">
                                    <Sparkles className={`w-4 h-4 ${current.color}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-[0.4em] ${current.color} leading-none`}>{current.label}</span>
                                    <p className="text-[13px] font-bold text-foreground/40 ml-2">{current.desc}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {current.questions?.map((q, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => onQuestion(q)}
                                            className="px-4 py-2 rounded-xl bg-background border border-white/10 hover:border-secondary/40 hover:bg-secondary/5 text-[11px] font-bold text-foreground/70 hover:text-secondary transition-all"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Hover Action for Features */}
            {current.type === 'feature' && (
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="pl-6 border-l border-white/5"
                        >
                            <Link 
                                href={current.href!}
                                className="px-6 py-2.5 rounded-2xl bg-secondary text-background text-[11px] font-black uppercase tracking-[0.2em] hover:bg-amber-500 transition-all flex items-center gap-2 shadow-lg shadow-secondary/20"
                            >
                                {t('dashboard.explore')} <ChevronRight className="w-4 h-4" />
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Progress Indicators */}
            <div className="absolute bottom-2 left-8 flex gap-1.5">
                {features.map((_, i) => (
                    <div 
                        key={i} 
                        className={`h-0.5 rounded-full transition-all duration-500 ${i === idx ? 'w-6 bg-secondary' : 'w-2 bg-white/10'}`} 
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Main Component ─────────────────────────────
export default function DashboardHome() {
    const { user, refreshUser, isLoading: userLoading } = useAuth();
    const { 
        chats, loadChats, activeChat, activeChatId,
        sendMessage, createNewChat, selectChat, resetChat, isSending, 
        inputText, setInputText 
    } = useChat();
    const router = useRouter();
    const { t, language } = useTranslation();
    
    // States
    const [kundliStats, setKundliStats] = useState<KundliStats | null>(null);
    const [kundliLoading, setKundliLoading] = useState(true);
    const [sidebarTab, setSidebarTab] = useState<'chat' | 'history' | 'cosmic'>('chat');
    const greetingKey = useGreeting();
    const greeting = t(greetingKey);
    const hasAnalyzedRef = useRef<string | null>(null);

    // Memos
    const age = useMemo(() => calculateAge(user?.dob), [user?.dob]);
    const ageBracket = useMemo(() => getAgeBracket(age), [age]);
    const personalizedQuestions = useMemo(() => getPersonalizedQuestions(ageBracket), [ageBracket]);
  // Extract signs from profile fields (moonSign, sunSign, lagnaSign) with fallback
  // to astrologyData if the backend hasn't persisted them yet.
  // BACKEND DEV NOTE: The /api/user/sync-astrology endpoint does NOT extract/save
  // moonSign/sunSign/lagnaSign to the DB. Only /api/analyze-full does this (lines 1714-1725
  // of server.py). When a user saves their profile, the frontend now calls analyze-full,
  // but existing users who never visited the Kundli page will have NULL signs in the DB.
  // Please fix sync-astrology to auto-extract and persist signs from astrologyData.
  const moonSign = useMemo(() => {
    if (user?.moonSign) return getRashiData(user.moonSign);
    // Fallback: extract from astrologyData
    if (user?.astrologyData) {
      const data = typeof user.astrologyData === 'string' ? JSON.parse(user.astrologyData) : user.astrologyData;
      const planets = (data as any)?.planets;
      if (Array.isArray(planets)) {
        const moon = planets.find((p: any) => p.planet === 'Moon');
        if (moon?.sign) return getRashiData(moon.sign);
      }
    }
    return null;
  }, [user?.moonSign, user?.astrologyData]);
  const sunSign = useMemo(() => {
    if (user?.sunSign) return getRashiData(user.sunSign);
    // Fallback: extract from astrologyData
    if (user?.astrologyData) {
      const data = typeof user.astrologyData === 'string' ? JSON.parse(user.astrologyData) : user.astrologyData;
      const planets = (data as any)?.planets;
      if (Array.isArray(planets)) {
        const sun = planets.find((p: any) => p.planet === 'Sun');
        if (sun?.sign) return getRashiData(sun.sign);
      }
    }
    return null;
  }, [user?.sunSign, user?.astrologyData]);
  const ascendantSign = useMemo(() => {
    if (user?.lagnaSign) return getRashiData(user.lagnaSign);
    if (kundliStats?.lagnaSign) return getRashiData(kundliStats.lagnaSign);
    // Fallback: extract from astrologyData
    if (user?.astrologyData) {
      const data = typeof user.astrologyData === 'string' ? JSON.parse(user.astrologyData) : user.astrologyData;
      // Try ascendant.sign (backend analyze-full format)
      const ascSign = (data as any)?.ascendant?.sign;
      if (ascSign) return getRashiData(ascSign);
      // Try houses array
      const houses = (data as any)?.houses || (data as any)?.chart?.houses;
      if (Array.isArray(houses)) {
        const h1 = houses.find((h: any) => h.house === 1);
        if (h1?.sign) return getRashiData(h1.sign);
      }
    }
    return null;
  }, [user?.lagnaSign, kundliStats?.lagnaSign, user?.astrologyData]);

    const recentChats = useMemo(() => {
        return chats.slice(0, 5);
    }, [chats]);

    const handleSendMessage = useCallback((text: string) => {
        setSidebarTab('chat');
        if (activeChatId) {
            sendMessage(text);
        } else {
            createNewChat(text);
        }
    }, [activeChatId, sendMessage, createNewChat]);

    // Effects
    useEffect(() => {
        if (!user?.email || !user.astrologyData) {
            if (!userLoading) setKundliLoading(false);
            return;
        }

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
                const houses = (analysis as any)?.houses || (analysis as any)?.chart?.houses;
                if (Array.isArray(houses)) stats.lagnaSign = houses.find((h: { house: number; sign: string }) => h.house === 1)?.sign;
                
                const nak = (analysis as any)?.nakshatra;
                stats.nakshatra = typeof nak === 'object' && nak !== null ? (nak.value || nak.name) : nak;
                if (stats.nakshatra && typeof stats.nakshatra !== 'string') stats.nakshatra = String(stats.nakshatra);

                const lord = (analysis as any)?.nakshatraLord;
                stats.nakshatraLord = typeof lord === 'object' && lord !== null ? (lord.value || lord.name) : lord;
                if (stats.nakshatraLord && typeof stats.nakshatraLord !== 'string') stats.nakshatraLord = String(stats.nakshatraLord);
                
                const dasha = (analysis as any)?.dasha || (analysis as any)?.planetary?.active_dasha;
                if (dasha) {
                    if (typeof dasha === 'string') {
                        stats.activeDasha = dasha;
                    } else {
                        // Try different formats to extract the current dasha name
                        const d = dasha as any;
                        let dashaName = d.currentMahaDasha || d.current || d.value;
                        let dashaRemaining = d.remaining;

                        // Fallback to the active array if flat strings are missing
                        if ((!dashaName || typeof dashaName === 'object') && d.active?.length > 0) {
                            const maha = d.active.find((p: any) => p.type === 'Mahadasha') || d.active[0];
                            const anta = d.active.find((p: any) => p.type === 'Antardasha');
                            dashaName = anta ? `${maha.planet}-${anta.planet}` : maha.planet;
                            
                            // Calculate remaining time if end date exists
                            if (!dashaRemaining && (maha.end || maha.end_date)) {
                                const end = new Date(maha.end || maha.end_date);
                                const now = new Date();
                                const remDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
                                dashaRemaining = remDays > 365 ? `${(remDays / 365).toFixed(1)} years` : `${remDays} days`;
                            }
                        }

                        // Ensure dashaName is a string even if the API returned an object for .current or .value
                        if (dashaName && typeof dashaName === 'object') {
                            dashaName = (dashaName as any).planet || (dashaName as any).name || (dashaName as any).value || "Saturn";
                        }

                        stats.activeDasha = typeof dashaName === 'string' ? dashaName : (dashaName ? String(dashaName) : "Saturn");
                        stats.dashaRemaining = typeof dashaRemaining === 'string' ? dashaRemaining : (dashaRemaining ? String(dashaRemaining) : undefined);
                    }
                }
                
                const moonPhase = typeof (analysis as any)?.moonPhase === 'object' ? (analysis as any).moonPhase.value : (analysis as any)?.moonPhase;
                if (typeof moonPhase === 'string') stats.moonPhase = moonPhase;
                
                if (Object.keys(stats).length > 0) {
                    setKundliStats(stats);
                    setKundliLoading(false);
                    return;
                }
            } catch (error) {
                console.error("Error setting kundli stats from user object:", error);
            }
        }
    }, [user?.email, user?.astrologyData, refreshUser, userLoading]);

    // Auto-trigger sign calculation if user has birth details but no signs.
    // This handles users who completed their profile but never visited the Kundli page.
    useEffect(() => {
        if (userLoading || !user?.email || hasAnalyzedRef.current === user.email) return;
        const hasBirthDetails = user.dob && user.tob && user.pob;
        const hasSigns = user.moonSign || user.sunSign || user.lagnaSign;
        const hasAstrologyData = !!user.astrologyData;
        if (hasBirthDetails && !hasSigns && !hasAstrologyData) {
            hasAnalyzedRef.current = user.email;
            console.log('[Dashboard] User has birth details but no signs — triggering analyze-full');
            clientFetch('/api/analyze-full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force_refresh: false })
            }).then(async (res) => {
                if (res.ok) {
                    const profileRes = await clientFetch(`/api/user/profile?email=${encodeURIComponent(user.email!)}`);
                    if (profileRes.ok) {
                        const profileData = await profileRes.json();
                        if (profileData.user) {
                            refreshUser({
                                moonSign: profileData.user.moonSign,
                                sunSign: profileData.user.sunSign,
                                lagnaSign: profileData.user.lagnaSign,
                                astrologyData: profileData.user.astrologyData,
                            });
                        }
                    }
                }
            }).catch(err => {
                console.warn('[Dashboard] Auto analyze-full failed:', err);
            });
        }
    }, [user?.email, user?.dob, user?.tob, user?.pob, user?.moonSign, user?.sunSign, user?.lagnaSign, user?.astrologyData, userLoading, refreshUser]);

    // Handlers
    const handleQuickAsk = (question: string) => {
        localStorage.setItem('astranavi_pending_message', question.trim());
        router.push('/chat');
    };

    const currentDate = new Date().toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
        <div className="w-full flex-grow bg-[var(--bg)] min-h-[calc(100dvh-var(--navbar-height,64px))]">
            <div className="max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 pt-0 lg:pt-4 pb-4 lg:pb-6">
                
                {/* ZONE 1: IDENTITY BAR */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8 sm:mb-10 pt-4 lg:pt-0"
                >
                    {/* Left: Greeting & Sign Circles Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-3 text-center lg:text-left pt-4 lg:pt-0">
                            <div className="flex items-center justify-center lg:justify-start gap-3">
                                <div className="hidden sm:block h-[1px] w-8 bg-secondary/30" />
                                <p className="text-[10px] sm:text-[11px] font-bold text-foreground/40 uppercase tracking-[0.3em]">{currentDate}</p>
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold tracking-tight leading-tight flex flex-wrap items-center justify-center lg:justify-start gap-x-3">
                                {greeting}, 
                                {userLoading ? (
                                    <Skeleton height={32} width={180} className="inline-block rounded-xl" />
                                ) : (
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-amber-500 to-secondary animate-gradient-x capitalize">
                                        {user?.name || user?.email?.split('@')[0] || t('common.user')}
                                    </span>
                                )}
                            </h1>
                        </div>

                        {/* Right: Sign Circles (The Identity Badges) */}
                        <div className="flex justify-center lg:justify-end gap-3 sm:gap-6 lg:gap-8 shrink-0 overflow-x-auto no-scrollbar py-2">
                            {[
                                { label: t('dashboard.moonSign'), data: moonSign, color: "text-blue-400" },
                                { label: t('dashboard.sunSign'), data: sunSign, color: "text-amber-500" },
                                { label: t('dashboard.ascendant'), data: ascendantSign, color: "text-purple-400" }
                            ].map((sign, idx) => (
                                <Link key={idx} href={sign.data?.id ? `/rashis?sign=${sign.data.id}` : '/rashis'} className="group relative flex flex-col items-center min-w-[80px] sm:min-w-[100px]">
                                    <div className="w-16 h-16 sm:w-20 lg:w-24 sm:h-20 lg:h-24 rounded-full bg-surface border border-outline-variant/20 flex flex-col items-center justify-center transition-all duration-500 group-hover:border-secondary/50 group-hover:-translate-y-1 group-hover:shadow-[0_0_30px_rgba(255,183,77,0.1)] overflow-hidden relative">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {userLoading ? (
                                            <SkeletonCircle size={48} className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20" />
                                        ) : sign.data?.icon ? (
                                            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                                <Image 
                                                    src={sign.data.icon} 
                                                    alt={sign.data.name} 
                                                    width={48}
                                                    height={48}
                                                    className="w-8 h-8 sm:w-10 lg:w-12 object-contain transition-transform duration-500 group-hover:scale-110" 
                                                />
                                            </motion.div>
                                        ) : (
                                            <div className="w-8 h-8 sm:w-10 lg:w-12 flex items-center justify-center">
                                                <Sparkles className="w-5 h-5 sm:w-6 text-foreground/10" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-2 text-center">
                                        <p className="text-[8px] sm:text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em] leading-none mb-1">{sign.label}</p>
                                        {userLoading ? (
                                            <Skeleton height={14} width={60} className="mx-auto mt-1" />
                                        ) : (
                                            <p className={`text-[10px] sm:text-xs lg:text-sm font-headline font-bold ${sign.color} group-hover:text-amber-500 transition-colors uppercase tracking-[0.1em] whitespace-nowrap`}>
                                                {sign.data?.name || "???"}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* INTERACTIVE HUB: Full Width Ribbon Row */}
                    <div className="w-full mt-8 mb-2">
                        <div className="w-full h-[100px] relative group">
                            <div className="absolute inset-0 bg-surface border border-secondary/20 rounded-[32px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.05)] group-hover:border-secondary/40 transition-all">
                                <FeatureSlider onQuestion={handleSendMessage} t={t} />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ZONE 2: HERO DASHBOARD */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                    
                    {/* Horoscope Hero */}
                    <div className="lg:col-span-8">
                        <DailyHoroscopeCard userLoading={userLoading} onSendMessage={handleSendMessage} />
                    </div>

                    {/* Sidebar: Unified Unified Tabbed Card */}
                    <div className="lg:col-span-4 flex flex-col min-h-0">
                        <Card padding="none" className="!rounded-[32px] border-secondary/20 bg-surface overflow-hidden flex flex-col shadow-[0_0_20px_rgba(212,175,55,0.05)] h-full min-h-0">
                            {/* Tab Switcher */}
                            <div className="p-2 border-b border-white/5 flex items-center gap-1 shrink-0">
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

                            <div className="flex-1 flex flex-col min-h-0 relative">
                                <AnimatePresence mode="wait">
                                    {sidebarTab === 'chat' && (
                                        <motion.div 
                                            key="chat"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="absolute inset-0 flex flex-col"
                                        >
                                            {/* Header with New Chat Button */}
                                            {activeChat && activeChat.messages.length > 0 && (
                                                <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between shrink-0 bg-surface/50">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">{t('dashboard.liveSession')}</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => resetChat()}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary/10 text-secondary hover:bg-secondary/20 transition-all text-[10px] font-bold uppercase tracking-widest border border-secondary/20"
                                                    >
                                                        <Plus className="w-3.5 h-3.5" /> {t('dashboard.newConsultation')}
                                                    </button>
                                                </div>
                                            )}

                                            {/* Messages Area */}
                                            <div className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-hide min-h-0">
                                                {(!activeChat || activeChat.messages.length === 0) ? (
                                                    <div className="flex flex-col items-center text-center space-y-2 pt-2 pb-1">
                                                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary relative">
                                                            <Sparkles className="w-5 h-5" />
                                                            <div className="absolute inset-0 rounded-full border border-secondary/20 animate-ping opacity-20" />
                                                        </div>
                                                        <div className="space-y-1.5 mb-1">
                                                            <h3 className="text-xl font-headline font-bold text-foreground tracking-tight">{t('dashboard.consultNaviAi')}</h3>
                                                            <p className="text-xs text-foreground/40 leading-relaxed font-medium max-w-[280px] mx-auto">
                                                                {t('dashboard.vedicWisdomPowered')}
                                                            </p>
                                                        </div>

                                                        <div className="w-full px-1">
                                                            <div className="flex items-center gap-3 mb-1.5">
                                                                <div className="h-[1px] flex-1 bg-white/5" />
                                                                <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">{t('dashboard.askAbout')}</span>
                                                                <div className="h-[1px] flex-1 bg-white/5" />
                                                            </div>
                                                            {/* Topic Suggestions Grid */}
                                                            <div className="grid grid-cols-2 gap-1.5 w-full">
                                                                {topicPills.map((topic, i) => (
                                                                    <button 
                                                                        key={i} 
                                                                        onClick={() => handleSendMessage(topic.label)}
                                                                        className="flex items-center gap-2 py-2 px-3 rounded-xl bg-surface-variant/20 border border-white/5 text-xs font-bold text-foreground/70 hover:text-secondary hover:border-secondary/30 hover:bg-surface-variant/40 transition-all text-left group"
                                                                    >
                                                                        <span className="text-base shrink-0 group-hover:scale-110 transition-transform">{topic.icon}</span>
                                                                        <span className="leading-tight truncate">{topic.label}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="w-full px-1 mt-1.5">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="h-[1px] flex-1 bg-white/5" />
                                                                <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">{t('dashboard.deepDive')}</span>
                                                                <div className="h-[1px] flex-1 bg-white/5" />
                                                            </div>
                                                            <div className="flex flex-col gap-1.5 w-full">
                                                                {[
                                                                    { q: "Analyze my weekly forecast in detail", icon: <Sparkles className="w-3.5 h-3.5" /> },
                                                                    { q: "Why is my career score at its current level today?", icon: <Briefcase className="w-3.5 h-3.5" /> },
                                                                    { q: "Give me a quick remedy to boost my daily health score", icon: <Activity className="w-3.5 h-3.5" /> }
                                                                ].map((item, i) => (
                                                                    <button 
                                                                        key={i}
                                                                        onClick={() => handleSendMessage(item.q)}
                                                                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-variant/10 border border-white/5 hover:bg-secondary/[0.08] hover:border-secondary/20 transition-all text-left group/dive"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0 group-hover/dive:scale-110 transition-transform">
                                                                            {item.icon}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="text-xs text-foreground/80 leading-relaxed font-bold group-hover/dive:text-foreground">{item.q}</p>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-4">
                                                        {activeChat.messages.map((msg, i) => {
                                                            if (msg.type === 'system') return null;
                                                            return (
                                                                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                                    <div className={`max-w-[90%] p-4 rounded-[20px] text-[13px] leading-relaxed shadow-sm ${
                                                                        msg.type === 'user' 
                                                                        ? 'bg-secondary text-background font-bold rounded-tr-none' 
                                                                        : 'bg-surface-variant/40 text-foreground/80 border border-white/5 rounded-tl-none'
                                                                    }`}>
                                                                        {msg.text.replace(/<think>[\s\S]*?<\/think>/, '').trim()}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {isSending && (
                                                    <div className="flex justify-start">
                                                        <div className="bg-surface-variant/40 p-4 rounded-[20px] rounded-tl-none border border-white/5 flex items-center gap-1.5">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-secondary/60 animate-bounce" />
                                                            <div className="w-1.5 h-1.5 rounded-full bg-secondary/60 animate-bounce [animation-delay:0.2s]" />
                                                            <div className="w-1.5 h-1.5 rounded-full bg-secondary/60 animate-bounce [animation-delay:0.4s]" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chat Input Area */}
                                            <div className="px-4 pb-4 pt-2 shrink-0 border-t border-white/5 bg-surface/50 backdrop-blur-sm">
                                                <div className="relative group mb-3">
                                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/20 to-amber-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                                                    <div className="relative flex items-end gap-2 p-2.5 rounded-2xl bg-surface-variant/40 border border-white/10 group-focus-within:border-secondary/40 transition-all">
                                                        <textarea 
                                                            value={inputText}
                                                            onChange={(e) => setInputText(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                                    e.preventDefault();
                                                                    if (inputText.trim()) handleSendMessage(inputText);
                                                                    setInputText('');
                                                                }
                                                            }}
                                                            placeholder="Ask Navi anything..."
                                                            className="flex-1 bg-transparent border-none outline-none text-[12px] font-medium text-foreground placeholder:text-foreground/20 resize-none min-h-[20px] max-h-[70px] py-1 pl-1"
                                                            rows={1}
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                if (inputText.trim()) handleSendMessage(inputText);
                                                                setInputText('');
                                                            }}
                                                            disabled={!inputText.trim() || isSending}
                                                            className="shrink-0 w-7 h-7 rounded-xl bg-secondary text-background flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                                        >
                                                            <ArrowUp className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between px-1">
                                                    <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">Powered by Vedic AI</p>
                                                    <Link href={activeChat ? `/chat?id=${activeChat.id}` : "/chat"} className="text-[11px] font-bold text-secondary uppercase tracking-widest hover:text-amber-500 transition-colors flex items-center gap-1 group">
                                                        {t('dashboard.fullInterface')} <ChevronRight className="w-3 h-3 text-secondary group-hover:translate-x-0.5 transition-transform" />
                                                    </Link>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    {sidebarTab === 'history' && (
                                        <motion.div 
                                            key="history"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="p-4 space-y-2.5"
                                        >
                                            {recentChats.length > 0 ? (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                                    <div className="flex items-center gap-2 mb-4 px-1 text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">
                                                        {t('dashboard.recentConsultations')}
                                                    </div>
                                                    {recentChats.map((chat) => (
                                                        <button 
                                                            key={chat.id} 
                                                            onClick={() => {
                                                                selectChat(chat.id);
                                                                setSidebarTab('chat');
                                                            }}
                                                            className="w-full text-left block p-4 rounded-[20px] bg-surface-variant/20 border border-white/5 hover:border-secondary/20 hover:bg-surface-variant/40 transition-all group"
                                                        >
                                                            <div className="flex justify-between items-start gap-4">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[13px] font-bold text-foreground/80 group-hover:text-foreground truncate mb-1">{chat.title || t('dashboard.newConsultation')}</p>
                                                                    <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">{formatRelativeTime(new Date(chat.updatedAt), t)}</p>
                                                                </div>
                                                                <ChevronRight className="w-3.5 h-3.5 text-foreground/20 group-hover:text-secondary mt-1" />
                                                            </div>
                                                        </button>
                                                    ))}
                                                    <Link href="/chat" className="block text-center mt-6 text-[10px] font-bold text-secondary uppercase tracking-[0.3em] hover:text-amber-500 transition-colors">{t('dashboard.viewAllConversations')}</Link>
                                                </motion.div>
                                            ) : (
                                                <div className="py-20 flex flex-col items-center text-center px-6">
                                                    <div className="w-16 h-16 rounded-full bg-surface-variant/20 flex items-center justify-center mb-4">
                                                        <Users className="w-8 h-8 text-foreground/10" />
                                                    </div>
                                                    <p className="text-sm font-headline font-bold text-foreground/60 mb-1">{t('dashboard.noHistoryYet')}</p>
                                                    <p className="text-[11px] font-medium text-foreground/30 leading-relaxed">Start your first conversation with Navi to see it here.</p>
                                                    <Button onClick={() => setSidebarTab('chat')} variant="secondary" size="sm" className="mt-6 rounded-full text-[10px] font-bold uppercase tracking-widest">{t('dashboard.startChatting')}</Button>
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
                                                    {[1,2,3,4].map(i => <Skeleton key={i} height={70} className="w-full rounded-[24px]" />)}
                                                </div>
                                            ) : kundliStats ? (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                                    <div className="flex items-center gap-2 mb-4 px-1 text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">
                                                        {t('dashboard.currentTransitsDasha')}
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
                                                            <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em]">{t('dashboard.compareFullChart')}</span>
                                                            <ChevronRight className="w-3.5 h-3.5 text-secondary group-hover:translate-x-1 transition-transform" />
                                                        </Link>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                <div className="py-20 flex flex-col items-center text-center px-6">
                                                    <div className="w-16 h-16 rounded-full bg-surface-variant/20 flex items-center justify-center mb-4">
                                                        <Orbit className="w-8 h-8 text-foreground/10" />
                                                    </div>
                                                    <p className="text-sm font-headline font-bold text-foreground/60 mb-1">{t('dashboard.chartPending')}</p>
                                                    <p className="text-[11px] font-medium text-foreground/30 leading-relaxed">{t('dashboard.completeBirthDetails')}</p>
                                                    <Link href="/profile" className="mt-6">
                                                        <Button variant="secondary" size="sm" className="rounded-full text-[10px] font-bold uppercase tracking-widest">{t('dashboard.updateProfile')}</Button>
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

                {/* ZONE 3: COSMIC PORTALS (Solid SaaS Style) */}
                <div className="mt-28">
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-1 h-8 bg-gradient-to-b from-secondary to-transparent rounded-full" />
                            <span className="text-xs font-bold text-secondary uppercase tracking-[0.6em]">{t('dashboard.systemHub')}</span>
                        </div>
                        <h2 className="text-4xl font-headline font-bold text-primary tracking-tight">{t('dashboard.cosmicPortals')}</h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* 1. CONSULT NAVI */}
                        <Link href="/chat" className="group">
                            <Card className="h-[440px] bg-surface border border-outline-variant/20 overflow-hidden relative transition-all duration-700 hover:border-secondary/40 !p-0" padding="none">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-secondary/10 transition-colors" />
                                
                                <div className="p-10 flex flex-col h-full relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-10 text-secondary group-hover:scale-110 transition-transform duration-500">
                                        <MessageSquare className="w-7 h-7" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-headline font-bold text-primary mb-3 group-hover:text-secondary transition-colors">{t('landing.chatNaviTitle')}</h3>
                                    <p className="text-sm font-medium text-foreground/40 leading-relaxed mb-10">{t('landing.chatNaviDesc')}</p>
                                    
                                    <div className="space-y-3 mb-10 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <div className="h-1 w-full bg-secondary/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-secondary w-3/4" />
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-secondary/40 uppercase tracking-widest">
                                            <span>{t('dashboard.processing')}</span>
                                            <span>85% {t('dashboard.neuralSync')}</span>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center gap-3 text-xs font-bold text-secondary uppercase tracking-widest group-hover:bg-secondary/10 group-hover:border-secondary/20 transition-all duration-300 shadow-sm">
                                            {t('dashboard.consultAi')} <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        {/* 2. MY KUNDLI */}
                        <Link href="/kundli" className="group">
                            <Card className="h-[440px] bg-surface border border-outline-variant/20 overflow-hidden relative transition-all duration-700 hover:border-blue-500/40 !p-0" padding="none">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-blue-500/10 transition-colors" />
                                
                                <div className="p-10 flex flex-col h-full relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-10 text-blue-400 group-hover:scale-110 transition-transform duration-500">
                                        <Globe className="w-7 h-7" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-headline font-bold text-primary mb-3 group-hover:text-blue-400 transition-colors">{t('dashboard.janamKundli')}</h3>
                                    <p className="text-sm font-medium text-foreground/40 leading-relaxed mb-10">{t('dashboard.janamKundliDesc')}</p>
                                    
                                    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 mb-10">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">{t('dashboard.currentDasha')}</div>
                                                <div className="text-lg font-bold text-primary">
                                                    {kundliLoading ? (
                                                        <Skeleton height={24} width={80} className="mt-1" />
                                                    ) : (
                                                        (typeof kundliStats?.activeDasha === 'string' ? kundliStats.activeDasha.split('-')[0] : (kundliStats?.activeDasha || "Saturn"))
                                                    )}
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 border border-blue-400/20 rounded-lg grid grid-cols-2 gap-1 p-1 opacity-40">
                                                {[1,2,3,4].map(i => <div key={i} className="bg-blue-400 rounded-sm" />)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center gap-3 text-xs font-bold text-blue-400 uppercase tracking-widest group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all duration-300 shadow-sm">
                                            {t('dashboard.openChart')} <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        {/* 3. SOULMATE SYNC */}
                        <Link href="/kundli/match" className="group">
                            <Card className="h-[440px] bg-surface border border-outline-variant/20 overflow-hidden relative transition-all duration-700 hover:border-rose-500/40 !p-0" padding="none">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-rose-500/10 transition-colors" />
                                
                                <div className="p-10 flex flex-col h-full relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-10 text-rose-400 group-hover:scale-110 transition-transform duration-500">
                                        <Heart className="w-7 h-7" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-headline font-bold text-primary mb-3 group-hover:text-rose-400 transition-colors">{t('dashboard.soulmateSync')}</h3>
                                    <p className="text-sm font-medium text-foreground/40 leading-relaxed mb-10">{t('dashboard.soulmateSyncDesc')}</p>
                                    
                                    <div className="flex items-center justify-center gap-6 mb-10">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-primary">28</div>
                                            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Match</div>
                                        </div>
                                        <div className="w-px h-10 bg-white/10" />
                                        <div className="flex -space-x-3">
                                            <div className="w-10 h-10 rounded-full border border-rose-500/30 bg-rose-500/10 flex items-center justify-center"><Users className="w-5 h-5 text-rose-400" /></div>
                                            <div className="w-10 h-10 rounded-full border border-pink-500/30 bg-pink-500/10 flex items-center justify-center"><Users className="w-5 h-5 text-pink-400" /></div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center gap-3 text-xs font-bold text-rose-400 uppercase tracking-widest group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-all duration-300 shadow-sm">
                                            {t('dashboard.analyzeMatch')} <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        {/* 4. DAILY PANCHANG */}
                        <Link href="/chat" className="group">
                            <Card className="h-[440px] bg-surface border border-outline-variant/20 overflow-hidden relative transition-all duration-700 hover:border-emerald-500/40 !p-0" padding="none">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-emerald-500/10 transition-colors" />
                                
                                <div className="p-10 flex flex-col h-full relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-10 text-emerald-400 group-hover:scale-110 transition-transform duration-500">
                                        <Sun className="w-7 h-7" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-headline font-bold text-primary mb-3 group-hover:text-emerald-400 transition-colors">{t('dashboard.dailyPulse')}</h3>
                                    <p className="text-sm font-medium text-foreground/40 leading-relaxed mb-10">{t('dashboard.realTimeTithi')}</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-10">
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            <div className="text-[9px] text-emerald-400 uppercase font-bold mb-0.5">Tithi</div>
                                            <div className="text-xs font-bold text-primary truncate">Pratipada</div>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                            <div className="text-[9px] text-emerald-400 uppercase font-bold mb-0.5">Yoga</div>
                                            <div className="text-xs font-bold text-primary truncate">Siddha</div>
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center gap-3 text-xs font-bold text-emerald-400 uppercase tracking-widest group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition-all duration-300 shadow-sm">
                                            {t('dashboard.checkPulse')} <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                        <div className="hidden lg:block" />
                        
                        {/* 5. RASHI LIBRARY */}
                        <Link href="/rashis" className="group">
                            <Card className="h-[440px] bg-surface border border-outline-variant/20 overflow-hidden relative transition-all duration-700 hover:border-purple-500/40 !p-0" padding="none">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-purple-500/10 transition-colors" />
                                
                                <div className="p-10 flex flex-col h-full relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-10 text-purple-400 group-hover:scale-110 transition-transform duration-500">
                                        <Orbit className="w-7 h-7" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-headline font-bold text-primary mb-3 group-hover:text-purple-400 transition-colors">{t('dashboard.rashiLib')}</h3>
                                    <p className="text-sm font-medium text-foreground/40 leading-relaxed mb-10">{t('dashboard.rashiLibDesc')}</p>
                                    
                                    <div className="grid grid-cols-4 gap-2 mb-10 opacity-40 group-hover:opacity-100 transition-opacity">
                                        {['aries', 'leo', 'sagittarius', 'scorpio'].map((s, idx) => (
                                            <div key={idx} className="aspect-square rounded-lg bg-white/5 border border-white/5 flex items-center justify-center">
                                                <Image src={`/icons/rashi/${s}.png`} alt={s} width={20} height={20} className="w-5 h-5 opacity-60" />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-auto">
                                        <div className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center gap-3 text-xs font-bold text-purple-400 uppercase tracking-widest group-hover:bg-purple-500/10 group-hover:border-purple-500/20 transition-all duration-300 shadow-sm">
                                            {t('dashboard.openLibrary')} <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        {/* 6. GUIDED READING */}
                        <Link href="/consult" className="group">
                            <Card className="h-[440px] bg-surface border border-outline-variant/20 overflow-hidden relative transition-all duration-700 hover:border-amber-500/40 !p-0" padding="none">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-amber-500/10 transition-colors" />
                                
                                <div className="p-10 flex flex-col h-full relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-10 text-amber-400 group-hover:scale-110 transition-transform duration-500">
                                        <Sparkles className="w-7 h-7" />
                                    </div>
                                    
                                    <h3 className="text-2xl font-headline font-bold text-primary mb-3 group-hover:text-amber-400 transition-colors">{t('dashboard.sessions')}</h3>
                                    <p className="text-sm font-medium text-foreground/40 leading-relaxed mb-10">{t('dashboard.sessionsDesc')}</p>
                                    
                                    <div className="space-y-4 mb-10">
                                        <div className="flex items-center gap-2">
                                            {[1,2,3,4].map(s => <div key={s} className={`h-1 flex-1 rounded-full ${s <= 2 ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-white/10'}`} />)}
                                        </div>
                                        <div className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest text-center">{t('dashboard.inProgress')}</div>
                                    </div>

                                    <div className="mt-auto">
                                        <div className="h-14 w-full rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center gap-3 text-xs font-bold text-amber-400 uppercase tracking-widest group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all duration-300 shadow-sm">
                                            {t('dashboard.joinSession')} <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </Link>

                        <div className="hidden lg:block" />
                    </div>
                </div>

            </div>
        </div>
    );
}
