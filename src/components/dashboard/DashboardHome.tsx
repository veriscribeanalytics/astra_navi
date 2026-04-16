"use client";

import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { Sparkles, Sun, ArrowRight, Clock, MessageSquare, Compass, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import DailyHoroscopeCard from "@/components/dashboard/DailyHoroscopeCard";
import Link from "next/link";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calculateAge, getAgeBracket, getPersonalizedQuestions, getStarterCards } from "@/utils/personalizedQuestions";

export default function DashboardHome() {
    const { user } = useAuth();
    const { chats } = useChat();
    const router = useRouter();
    const [quickQuery, setQuickQuery] = useState("");
    const [customQuestion, setCustomQuestion] = useState("");

    // Date formatting helper for archives
    const formatArchiveDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (86400000));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const getRashiData = (sign: string) => {
        const s = sign.toLowerCase();
        if (s.includes('mesh') || s.includes('aries')) return { name: 'Mesh', en: 'Aries', icon: '/icons/rashi/aries.png' };
        if (s.includes('vrish') || s.includes('taurus')) return { name: 'Vrish', en: 'Taurus', icon: '/icons/rashi/taurus.png' };
        if (s.includes('mithun') || s.includes('gemini')) return { name: 'Mithun', en: 'Gemini', icon: '/icons/rashi/gemini.png' };
        if (s.includes('kark') || s.includes('cancer')) return { name: 'Kark', en: 'Cancer', icon: '/icons/rashi/cancer.png' };
        if (s.includes('simha') || s.includes('leo')) return { name: 'Simha', en: 'Leo', icon: '/icons/rashi/leo.png' };
        if (s.includes('kanya') || s.includes('virgo')) return { name: 'Kanya', en: 'Virgo', icon: '/icons/rashi/virgo.png' };
        if (s.includes('tula') || s.includes('libra')) return { name: 'Tula', en: 'Libra', icon: '/icons/rashi/libra.png' };
        if (s.includes('vrishchik') || s.includes('scorpio')) return { name: 'Vrishchik', en: 'Scorpio', icon: '/icons/rashi/scorpio.png' };
        if (s.includes('dhanu') || s.includes('sagittarius')) return { name: 'Dhanu', en: 'Sagittarius', icon: '/icons/rashi/sagittarius.png' };
        if (s.includes('makar') || s.includes('capricorn')) return { name: 'Makar', en: 'Capricorn', icon: '/icons/rashi/capricorn.png' };
        if (s.includes('kumbh') || s.includes('aquarius')) return { name: 'Kumbh', en: 'Aquarius', icon: '/icons/rashi/aquarius.png' };
        if (s.includes('meen') || s.includes('pisces')) return { name: 'Meen', en: 'Pisces', icon: '/icons/rashi/pisces.png' };
        return null;
    };

    const rashiData = user?.moonSign ? getRashiData(user.moonSign) : null;

    // Calculate age and get personalized content
    const age = useMemo(() => calculateAge(user?.dob), [user?.dob]);
    const ageBracket = useMemo(() => getAgeBracket(age), [age]);
    const personalizedQuestions = useMemo(() => getPersonalizedQuestions(ageBracket), [ageBracket]);
    const starterCards = useMemo(() => getStarterCards(ageBracket), [ageBracket]);

    const handleQuickQuery = (e: React.FormEvent) => {
        e.preventDefault();
        if (quickQuery.trim()) {
            localStorage.setItem('astranavi_pending_message', quickQuery.trim());
        }
        router.push('/chat');
    };

    const handleQuickAsk = (question: string) => {
        if (question.trim()) {
            localStorage.setItem('astranavi_pending_message', question.trim());
        }
        router.push('/chat');
    };

    return (
        console.log(user),
        <div className="w-full flex-grow relative bg-[var(--bg)] min-h-screen overflow-hidden">
            
            
            {/* SECTION 1: PERSONAL HERO & CONSOLE */}
            <section className="pt-12 sm:pt-16 md:pt-20 lg:pt-24 xl:pt-28 pb-3 sm:pb-4 md:pb-5 lg:pb-6 xl:pb-8 relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-6 sm:gap-8 md:gap-10 lg:gap-12 lg:flex-row">
                    
                    {/* Left: Welcome & Console */}
                    <div className="flex-1 flex flex-col items-center text-center relative z-10 w-full max-w-2xl lg:max-w-none">
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-[12px] sm:text-[13px] font-bold font-mono tracking-[0.15em] sm:tracking-widest uppercase mb-2.5 sm:mb-3 md:mb-4 lg:mb-6">
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden sm:inline">AstraNavi Intelligence</span>
                            <span className="sm:hidden">AI Intelligence</span>
                        </div>
                        
                        <h1 className="text-[26px] leading-[1.15] sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-headline mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-8 text-foreground tracking-tight">
                            Welcome back,
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-500 capitalize block">
                                {user?.name || user?.email?.split('@')[0] || "Seeker"}
                            </span>
                        </h1>

                        <form onSubmit={handleQuickQuery} className="w-full group">
                            <Card padding="none" hoverable className="rounded-2xl sm:rounded-2xl md:rounded-3xl lg:rounded-full !bg-surface p-2 sm:p-2.5 flex flex-col sm:flex-row gap-2 sm:gap-2.5 items-stretch sm:items-center relative z-20 border border-outline-variant/30">
                                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-secondary ml-3 hidden sm:block opacity-70 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={quickQuery}
                                    onChange={(e) => setQuickQuery(e.target.value)}
                                    placeholder="What guidance do you seek today?"
                                    className="w-full bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none px-3 sm:px-4 py-3 text-sm sm:text-base font-sans min-h-[42px] sm:min-h-[44px] md:min-h-[48px]"
                                />
                                <Button type="submit" className="w-full sm:w-auto shrink-0 gold-gradient text-white border-none font-bold rounded-xl sm:rounded-xl md:rounded-2xl lg:rounded-full px-5 sm:px-6 md:px-8 min-h-[42px] sm:min-h-[44px] md:min-h-[48px] text-sm z-30 relative whitespace-nowrap">
                                    Consult Navi
                                </Button>
                            </Card>
                        </form>
                    </div>

                    {/* Right: Rashi Circles */}
                    <div className="flex flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-6 mt-3 sm:mt-4 lg:mt-0 w-full lg:w-auto justify-center items-center overflow-x-auto pb-2 sm:pb-0 px-1 sm:px-0 scrollbar-hide">
                        {/* Moon Sign Circle */}
                        <div 
                            onClick={() => !rashiData && handleQuickAsk("Tell me my Rashi (Moon Sign) and Sun Sign based on my birth chart.")}
                            className={`shrink-0 flex flex-col items-center justify-center relative group min-w-[140px] w-[clamp(140px,35vw,272px)] aspect-square rounded-[24px] sm:rounded-[32px] lg:rounded-full bg-surface/80 backdrop-blur-sm border border-outline-variant/30 transition-all duration-500 hover:border-secondary/60 z-10 ${!rashiData ? 'cursor-pointer active:scale-95' : ''}`}
                            style={{ maxWidth: 'min(272px, 35vw)' }}
                        >
                            
                            <p className="text-[clamp(11px,1.5vw,13px)] uppercase font-bold text-foreground/40 tracking-[0.12em] mb-[clamp(8px,2vw,24px)] relative z-10 px-[clamp(8px,2vw,24px)] text-center leading-tight">
                                {rashiData ? 'Your Moon Sign' : 'Identify your Sign'}
                            </p>
                            
                            {rashiData?.icon ? (
                                <img 
                                    src={`${rashiData.icon}?v=4`}
                                    alt={rashiData.name}
                                    className="w-[clamp(48px,12vw,112px)] h-[clamp(48px,12vw,112px)] object-contain mb-[clamp(8px,2vw,24px)] relative z-10 group-hover:scale-110 transition-transform duration-500"
                                />
                            ) : (
                                <span className="text-[clamp(2rem,8vw,3rem)] mb-[clamp(8px,2vw,24px)]">🔍</span>
                            )}
                            
                            <h3 className="text-[clamp(0.875rem,3vw,1.25rem)] font-headline font-bold text-secondary tracking-[0.08em] sm:tracking-[0.1em] uppercase relative z-10 group-hover:text-amber-400 transition-colors text-center px-[clamp(8px,2vw,16px)] mb-[clamp(2px,0.5vw,4px)]">
                                {rashiData?.name || 'Unknown'}
                            </h3>
                            
                            {!rashiData ? (
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="mt-[clamp(6px,1.5vw,16px)] relative z-10 px-[clamp(12px,3vw,24px)] py-[clamp(2px,0.5vw,4px)] rounded-full border-secondary/20 hover:border-secondary text-[clamp(11px,1.8vw,13px)] font-bold tracking-widest uppercase text-secondary"
                                >
                                    Consult ✦
                                </Button>
                            ) : (
                                <p className="text-[11px] xs:text-[12px] sm:text-[14px] font-medium text-foreground/50 uppercase tracking-[0.12em] sm:tracking-[0.15em] relative z-10">
                                    {rashiData.en}
                                </p>
                            )}
                        </div>

                        {/* Sun Sign Circle */}
                        {user?.sunSign && (() => {
                            const sunSignData = getRashiData(user.sunSign);
                            return sunSignData ? (
                                <div 
                                    className="shrink-0 flex flex-col items-center justify-center relative group min-w-[140px] w-[clamp(140px,35vw,272px)] aspect-square rounded-[24px] sm:rounded-[32px] lg:rounded-full bg-surface/80 backdrop-blur-sm border border-outline-variant/30 transition-all duration-500 hover:border-secondary/60 z-10"
                                    style={{ maxWidth: 'min(272px, 35vw)' }}
                                >
                                    
                                    <p className="text-[clamp(11px,1.5vw,13px)] uppercase font-bold text-foreground/40 tracking-[0.12em] mb-[clamp(8px,2vw,24px)] relative z-10 px-[clamp(8px,2vw,24px)] text-center leading-tight">
                                        Your Sun Sign
                                    </p>
                                    
                                    <img 
                                        src={`${sunSignData.icon}?v=4`}
                                        alt={sunSignData.name}
                                        className="w-[clamp(48px,12vw,112px)] h-[clamp(48px,12vw,112px)] object-contain mb-[clamp(8px,2vw,24px)] relative z-10 group-hover:scale-110 transition-transform duration-500"
                                    />
                                    
                                    <h3 className="text-[clamp(0.875rem,3vw,1.25rem)] font-headline font-bold text-secondary tracking-[0.08em] sm:tracking-[0.1em] uppercase relative z-10 group-hover:text-amber-400 transition-colors text-center px-[clamp(8px,2vw,16px)] mb-[clamp(2px,0.5vw,4px)]">
                                        {sunSignData.name}
                                    </h3>
                                    
                                    <p className="text-[clamp(11px,1.8vw,14px)] font-medium text-foreground/50 uppercase tracking-[0.12em] sm:tracking-[0.15em] relative z-10">
                                        {sunSignData.en}
                                    </p>
                                </div>
                            ) : null;
                        })()}
                    </div>
                </div>
            </section>

            {/* SECTION 2: THE DASHBOARD GRID */}
            <section className="pb-16 sm:pb-20 lg:pb-24 relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                    
                    {/* LEFT: HOROSCOPE COMING SOON & NAVI IS LIVE */}
                    <div className="flex-1 flex flex-col gap-6 sm:gap-8">
                        {/* Daily Horoscope */}
                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-foreground leading-none">Your Daily Cosmic Guide</h2>
                            {user?.email ? (
                                <DailyHoroscopeCard email={user.email} />
                            ) : (
                                <Card padding="md" className="!rounded-[28px] sm:!rounded-[40px] border-outline-variant/30">
                                    <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-6 text-center">
                                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-secondary/10 flex items-center justify-center mb-6 border border-secondary/20">
                                            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-secondary animate-pulse" />
                                        </div>
                                        <h3 className="text-2xl sm:text-3xl font-headline font-bold text-foreground mb-3">
                                            Personalized Predictions
                                        </h3>
                                        <p className="text-sm sm:text-base text-foreground/60 mb-6 max-w-md leading-relaxed">
                                            Complete your profile to see your personalized cosmic guide and daily horoscope.
                                        </p>
                                        <Button 
                                            href="/profile"
                                            className="px-8 py-4 rounded-xl gold-gradient text-white font-bold border-none hover:scale-105 transition-all"
                                        >
                                            Complete Profile ✦
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* ─── Explore: Rashi Library & My Kundli ─── */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <Link href="/rashis" className="group">
                                <Card padding="none" className="!rounded-[20px] sm:!rounded-[24px] border-outline-variant/30 overflow-hidden hover:border-secondary/40 transition-all h-full">
                                    <div className="p-4 sm:p-6 flex flex-col items-center text-center gap-3">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Compass className="w-6 h-6 sm:w-7 sm:h-7 text-secondary" />
                                        </div>
                                        <div>
                                            <h3 className="text-[14px] sm:text-[16px] font-headline font-bold text-foreground mb-1">Rashi Library</h3>
                                            <p className="text-[11px] sm:text-[12px] text-foreground/40 font-bold uppercase tracking-wider">General Signs</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                            <Link href="/kundli" className="group">
                                <Card padding="none" className="!rounded-[20px] sm:!rounded-[24px] border-outline-variant/30 overflow-hidden hover:border-secondary/40 transition-all h-full">
                                    <div className="p-4 sm:p-6 flex flex-col items-center text-center gap-3">
                                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Sun className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-[14px] sm:text-[16px] font-headline font-bold text-foreground mb-1">My Kundli</h3>
                                            <p className="text-[11px] sm:text-[12px] text-foreground/40 font-bold uppercase tracking-wider">Personal Chart</p>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </div>

                        {/* AstraNavi Intelligence */}
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0">
                                <h2 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-foreground leading-none">AstraNavi Intelligence</h2>
                                <div className="flex items-center gap-1.5 sm:gap-2 bg-secondary/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-secondary/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                                    <span className="text-[12px] sm:text-[13px] font-bold text-secondary uppercase tracking-widest">Navi is Live</span>
                                </div>
                            </div>
    
                            <Card padding="none" className="!rounded-[28px] sm:!rounded-[40px] overflow-hidden group border-outline-variant/30 relative min-h-[240px] sm:min-h-[280px] flex flex-col justify-center">
                                <div className="flex flex-col sm:flex-row items-center p-6 sm:p-8 lg:p-10 gap-6 sm:gap-8 lg:gap-10 relative z-10">
                                    <div className="shrink-0 relative">
                                         <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] bg-background border border-secondary/30 flex items-center justify-center group-hover:scale-105 transition-all duration-700">
                                            <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[22px] sm:rounded-[26px] lg:rounded-[30px]">
                                                <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-secondary animate-pulse" />
                                            </div>
                                         </div>
                                         <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center border-2 border-surface">
                                            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                                         </div>
                                    </div>
                                    <div className="flex-1 text-center sm:text-left">
                                        <h3 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-foreground mb-3 sm:mb-4 leading-tight tracking-tight">
                                            Navi is ready to <br className="hidden sm:block"/>guide your path
                                        </h3>
                                        <p className="text-foreground/60 text-xs sm:text-sm lg:text-base max-w-xl mb-5 sm:mb-6 lg:mb-8 leading-relaxed font-medium">
                                            Connect with 5,000+ years of Vedic wisdom synthesized by AI. Your personal guide is waiting for your next query.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
                                            <Button 
                                                onClick={() => router.push('/chat')}
                                                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl gold-gradient text-white font-bold border-none hover:scale-105 transition-all text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                                            >
                                                Consult Navi Now ✦
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* RIGHT: ARCHIVES & QUICK ASK - Shifted down on desktop for better alignment */}
                    <div className="w-full lg:w-[380px] xl:w-[400px] flex flex-col gap-5 sm:gap-6 shrink-0 lg:mt-20">
                        {/* Archives */}
                        <Card padding="sm" className="!rounded-[24px] sm:!rounded-[32px] relative border border-outline-variant/30">
                            <h4 className="text-[13px] sm:text-[14px] font-bold text-secondary mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 uppercase tracking-[0.15em] sm:tracking-[0.2em] border-b border-secondary/10 pb-2.5 sm:pb-3">
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Archives
                            </h4>
                            
                            <div className="flex flex-col gap-2 sm:gap-2.5 mb-4 sm:mb-5">
                                {chats.length > 0 ? (
                                    chats.slice(0, 3).map((chat) => (
                                        <Link 
                                            key={chat._id}
                                            href={`/chat?id=${chat._id}`}
                                            className="text-left text-[13px] sm:text-[14px] font-bold text-foreground/70 bg-surface/50 border border-secondary/10 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[12px] sm:rounded-[16px] hover:border-secondary/40 hover:bg-surface/80 transition-all hover:text-secondary active:scale-98 truncate"
                                        >
                                            {chat.title}
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-[13px] sm:text-[14px] font-bold text-foreground/40 bg-surface/30 border border-secondary/10 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[12px] sm:rounded-[16px] text-center">
                                        No conversations yet
                                    </div>
                                )}
                            </div>
                            
                            <Link href="/chat" className="block">
                                <button className="w-full gold-gradient text-white rounded-[10px] sm:rounded-[12px] px-4 sm:px-5 py-2 sm:py-2.5 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest transition-all active:scale-95 min-h-[36px] sm:min-h-[40px] flex items-center justify-center gap-2">
                                    <Plus className="w-3 h-3" />
                                    New Chat
                                </button>
                            </Link>
                        </Card>

                        {/* Quick Ask Navi */}
                        <Card padding="sm" className="!rounded-[24px] sm:!rounded-[32px] relative border border-outline-variant/30 flex flex-col">
                            <h4 className="text-[13px] sm:text-[14px] font-bold text-secondary mb-3 sm:mb-4 lg:mb-5 flex items-center gap-1.5 sm:gap-2 uppercase tracking-[0.15em] sm:tracking-[0.2em] border-b border-secondary/10 pb-2.5 sm:pb-3">
                                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Quick Ask Navi
                            </h4>
                            <div className="flex flex-col gap-2 sm:gap-2.5 mb-4 sm:mb-5 lg:mb-6">
                                {personalizedQuestions.map((question, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleQuickAsk(question)} 
                                        className="text-left text-[13px] sm:text-[14px] font-bold text-foreground/70 bg-surface/50 border border-secondary/10 px-4 sm:px-5 py-2.5 sm:py-3 rounded-[12px] sm:rounded-[16px] hover:border-secondary/40 hover:bg-surface/80 transition-all hover:text-secondary active:scale-98"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center bg-background border border-secondary/20 p-2 sm:p-2.5 rounded-[16px] sm:rounded-[20px] mt-auto">
                                <input 
                                    type="text" 
                                    placeholder="Your own question..." 
                                    value={customQuestion}
                                    onChange={(e) => setCustomQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAsk(customQuestion)}
                                    className="flex-1 min-w-0 bg-transparent border-none text-[13px] sm:text-[14px] px-2 text-foreground font-medium placeholder:text-foreground/30 focus:outline-none min-h-[36px] sm:min-h-[40px]" 
                                />
                                <button onClick={() => handleQuickAsk(customQuestion)} className="gold-gradient text-white rounded-[10px] sm:rounded-[12px] px-4 sm:px-5 py-2 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest transition-all shrink-0 active:scale-95 min-h-[36px] sm:min-h-[40px] flex items-center justify-center">Ask ✦</button>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
