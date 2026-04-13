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
        <div className="w-full flex-grow relative bg-[var(--bg)] min-h-screen overflow-hidden">
            
            {/* Ambient Global Glow */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3 z-0" />
            
            {/* SECTION 1: PERSONAL HERO & CONSOLE */}
            <section className="pt-12 sm:pt-16 md:pt-20 lg:pt-24 xl:pt-28 pb-5 sm:pb-7 md:pb-9 lg:pb-10 xl:pb-12 relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-6 sm:gap-8 md:gap-10 lg:gap-12 lg:flex-row">
                    
                    {/* Left: Welcome & Console */}
                    <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left relative z-10 w-full max-w-2xl lg:max-w-none">
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-[9px] sm:text-[10px] font-bold font-mono tracking-[0.15em] sm:tracking-widest uppercase mb-2.5 sm:mb-3 md:mb-4 lg:mb-6 shadow-sm">
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden sm:inline">AstraNavi Intelligence</span>
                            <span className="sm:hidden">AI Intelligence</span>
                        </div>
                        
                        <h1 className="text-[26px] leading-[1.15] sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-headline mb-3 sm:mb-4 md:mb-5 lg:mb-6 xl:mb-8 text-foreground tracking-tight">
                            Welcome back,{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-500 capitalize block sm:inline">
                                {user?.name || user?.email?.split('@')[0] || "Seeker"}
                            </span>.
                        </h1>

                        <form onSubmit={handleQuickQuery} className="w-full group">
                            <Card padding="none" hoverable className="rounded-2xl sm:rounded-2xl md:rounded-3xl lg:rounded-full !bg-surface p-2 sm:p-2.5 flex flex-col sm:flex-row gap-2 sm:gap-2.5 items-stretch sm:items-center relative z-20 border border-secondary/10 shadow-lg">
                                <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-secondary ml-3 hidden sm:block opacity-70 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={quickQuery}
                                    onChange={(e) => setQuickQuery(e.target.value)}
                                    placeholder="What guidance do you seek today?"
                                    className="w-full bg-transparent text-foreground placeholder:text-foreground/40 focus:outline-none px-3 sm:px-4 py-3 text-sm sm:text-base font-sans min-h-[42px] sm:min-h-[44px] md:min-h-[48px]"
                                />
                                <Button type="submit" className="w-full sm:w-auto shrink-0 gold-gradient text-white shadow-lg shadow-secondary/20 border-none font-bold rounded-xl sm:rounded-xl md:rounded-2xl lg:rounded-full px-5 sm:px-6 md:px-8 min-h-[42px] sm:min-h-[44px] md:min-h-[48px] text-sm z-30 relative whitespace-nowrap">
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
                            className={`shrink-0 flex flex-col items-center justify-center relative group min-w-[140px] w-[clamp(140px,35vw,272px)] aspect-square rounded-[24px] sm:rounded-[32px] lg:rounded-full bg-surface/80 backdrop-blur-3xl border border-secondary/20 shadow-[0_0_40px_rgba(200,136,10,0.06)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(200,136,10,0.12)] hover:border-secondary/40 z-10 ${!rashiData ? 'cursor-pointer active:scale-95' : ''}`}
                            style={{ maxWidth: 'min(272px, 35vw)' }}
                        >
                            
                            <p className="text-[clamp(7px,1.5vw,9px)] uppercase font-bold text-foreground/40 tracking-[0.12em] mb-[clamp(8px,2vw,24px)] relative z-10 px-[clamp(8px,2vw,24px)] text-center leading-tight">
                                {rashiData ? 'Your Moon Sign' : 'Identify your Sign'}
                            </p>
                            
                            {rashiData?.icon ? (
                                <img 
                                    src={`${rashiData.icon}?v=4`}
                                    alt={rashiData.name}
                                    className="w-[clamp(48px,12vw,112px)] h-[clamp(48px,12vw,112px)] object-contain mb-[clamp(8px,2vw,24px)] relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(218,165,32,0.5)]"
                                />
                            ) : (
                                <span className="text-[clamp(2rem,8vw,3rem)] filter drop-shadow-[0_0_10px_rgba(200,136,10,0.3)] mb-[clamp(8px,2vw,24px)]">🔍</span>
                            )}
                            
                            <h3 className="text-[clamp(0.875rem,3vw,1.25rem)] font-headline font-bold text-secondary tracking-[0.08em] sm:tracking-[0.1em] uppercase relative z-10 group-hover:text-amber-400 transition-colors text-center px-[clamp(8px,2vw,16px)] mb-[clamp(2px,0.5vw,4px)]">
                                {rashiData?.name || 'Unknown'}
                            </h3>
                            
                            {!rashiData ? (
                                <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    className="mt-[clamp(6px,1.5vw,16px)] relative z-10 px-[clamp(12px,3vw,24px)] py-[clamp(2px,0.5vw,4px)] rounded-full border-secondary/20 hover:border-secondary text-[clamp(8px,1.8vw,10px)] font-bold tracking-widest uppercase text-secondary"
                                >
                                    Consult ✦
                                </Button>
                            ) : (
                                <p className="text-[8px] xs:text-[9px] sm:text-[11px] font-medium text-foreground/50 uppercase tracking-[0.12em] sm:tracking-[0.15em] relative z-10">
                                    {rashiData.en}
                                </p>
                            )}
                        </div>

                        {/* Sun Sign Circle */}
                        {user?.sunSign && (() => {
                            const sunSignData = getRashiData(user.sunSign);
                            return sunSignData ? (
                                <div 
                                    className="shrink-0 flex flex-col items-center justify-center relative group min-w-[140px] w-[clamp(140px,35vw,272px)] aspect-square rounded-[24px] sm:rounded-[32px] lg:rounded-full bg-surface/80 backdrop-blur-3xl border border-secondary/20 shadow-[0_0_40px_rgba(200,136,10,0.06)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(200,136,10,0.12)] hover:border-secondary/40 z-10"
                                    style={{ maxWidth: 'min(272px, 35vw)' }}
                                >
                                    
                                    <p className="text-[clamp(7px,1.5vw,9px)] uppercase font-bold text-foreground/40 tracking-[0.12em] mb-[clamp(8px,2vw,24px)] relative z-10 px-[clamp(8px,2vw,24px)] text-center leading-tight">
                                        Your Sun Sign
                                    </p>
                                    
                                    <img 
                                        src={`${sunSignData.icon}?v=4`}
                                        alt={sunSignData.name}
                                        className="w-[clamp(48px,12vw,112px)] h-[clamp(48px,12vw,112px)] object-contain mb-[clamp(8px,2vw,24px)] relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_20px_rgba(218,165,32,0.5)]"
                                    />
                                    
                                    <h3 className="text-[clamp(0.875rem,3vw,1.25rem)] font-headline font-bold text-secondary tracking-[0.08em] sm:tracking-[0.1em] uppercase relative z-10 group-hover:text-amber-400 transition-colors text-center px-[clamp(8px,2vw,16px)] mb-[clamp(2px,0.5vw,4px)]">
                                        {sunSignData.name}
                                    </h3>
                                    
                                    <p className="text-[clamp(8px,1.8vw,11px)] font-medium text-foreground/50 uppercase tracking-[0.12em] sm:tracking-[0.15em] relative z-10">
                                        {sunSignData.en}
                                    </p>
                                </div>
                            ) : null;
                        })()}
                    </div>
                </div>
            </section>

            {/* SECTION 1.5: MAIN CONTENT GRID - Archives Left, Horoscope Right */}
            <section className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-8 sm:mb-12 lg:mb-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                    
                    {/* LEFT: THE ASTRAL ARCHIVES */}
                    <div className="flex flex-col">
                        <div className="flex justify-between items-center mb-3 sm:mb-4 lg:mb-6">
                            <h3 className="text-base sm:text-lg lg:text-2xl font-headline font-bold text-foreground flex items-center gap-1.5 sm:gap-2 leading-none">
                                <Clock className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-secondary" /> 
                                <span className="hidden xs:inline">The Astral Archives</span>
                                <span className="xs:hidden">Archives</span>
                            </h3>
                            <Link href="/chat" className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-secondary hover:text-amber-500 transition-colors flex items-center gap-0.5 sm:gap-1 uppercase tracking-[0.1em] sm:tracking-widest bg-secondary/5 px-2 sm:px-2.5 lg:px-3 py-1 sm:py-1.5 rounded-full border border-secondary/20 hover:border-secondary/40">
                                <span className="hidden xs:inline">View All</span>
                                <span className="xs:hidden">All</span>
                                <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 lg:w-3.5 lg:h-3.5" />
                            </Link>
                        </div>
                        
                        <div className="flex flex-col gap-3 sm:gap-4">
                            {chats.length > 0 ? (
                                chats.slice(0, 5).map((chat, idx) => (
                                    <Link key={chat._id} href={`/chat?id=${chat._id}`} className="block focus:outline-none">
                                        <Card padding="md" className="group cursor-pointer !rounded-[20px] sm:!rounded-[24px] relative overflow-hidden border border-secondary/10 hover:border-secondary/30 transition-all duration-300">
                                            <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-secondary/5 rounded-bl-[80px] sm:rounded-bl-[100px] pointer-events-none transition-colors group-hover:bg-secondary/10 z-0" />
                                            <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10">
                                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-background border border-secondary/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                                    {idx === 0 ? <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-secondary/70" /> : <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-secondary/70" />}
                                                </div>
                                                <div className="text-[9px] sm:text-[10px] font-mono font-bold text-secondary bg-secondary/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md uppercase tracking-wider border border-secondary/10">
                                                    {formatArchiveDate(chat.updatedAt)}
                                                </div>
                                            </div>
                                            <h4 className="text-base sm:text-lg font-bold text-foreground mb-1 sm:mb-1 group-hover:text-secondary transition-colors relative z-10 truncate leading-snug">{chat.title}</h4>
                                            <p className="text-[10px] sm:text-[11px] text-foreground/50 relative z-10 font-bold uppercase tracking-wider">
                                                {idx === 0 ? 'Analysis' : 'Consultation'} • {chat.averageRating ? `${chat.averageRating}★ rating` : 'Archived'}
                                            </p>
                                        </Card>
                                    </Link>
                                ))
                            ) : (
                                <>
                                    {starterCards.slice(0, 2).map((card, idx) => (
                                        <button key={idx} onClick={() => handleQuickAsk(card.question)} className="block w-full text-left focus:outline-none">
                                            <Card padding="md" className="group cursor-pointer !rounded-[20px] sm:!rounded-[24px] relative overflow-hidden border border-secondary/10 hover:border-secondary/30 transition-all duration-300">
                                                <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-secondary/5 rounded-bl-[80px] sm:rounded-bl-[100px] pointer-events-none z-0" />
                                                <div className="flex justify-between items-start mb-4 sm:mb-6 relative z-10">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-background border border-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                        {idx === 0 ? <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-secondary/70" /> : <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-secondary/70" />}
                                                    </div>
                                                    <div className="text-[9px] sm:text-[10px] font-mono font-bold text-secondary bg-secondary/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md uppercase tracking-wider border border-secondary/10">{idx === 0 ? 'Start Here' : 'Discover'}</div>
                                                </div>
                                                <h4 className="text-base sm:text-lg font-bold text-foreground mb-1 group-hover:text-secondary transition-colors relative z-10 leading-snug">{card.title}</h4>
                                                <p className="text-[10px] sm:text-[11px] text-foreground/50 relative z-10 font-bold uppercase tracking-wider">{card.description}</p>
                                            </Card>
                                        </button>
                                    ))}
                                </>
                            )}
                            
                            <Link href="/chat" className="block focus:outline-none">
                                <Card padding="md" className="min-h-[140px] sm:min-h-[160px] flex flex-col items-center justify-center text-center group cursor-pointer border-dashed border-secondary/30 hover:border-secondary/60 hover:bg-secondary/5 !rounded-[20px] sm:!rounded-[24px] transition-all">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-background border border-secondary/20 group-hover:border-secondary/40 flex items-center justify-center mb-3 sm:mb-4 transition-colors">
                                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-secondary/50 group-hover:text-secondary" />
                                    </div>
                                    <h4 className="font-bold text-sm sm:text-base text-foreground/70 group-hover:text-secondary transition-colors leading-none">New Synthesis</h4>
                                    <p className="text-[9px] sm:text-[10px] font-bold text-foreground/40 mt-1.5 sm:mt-2 uppercase tracking-widest">New chart or path</p>
                                </Card>
                            </Link>
                        </div>
                    </div>

                    {/* RIGHT: DAILY HOROSCOPE */}
                    {user?.email && user?.moonSign && (
                        <div className="flex flex-col">
                            <DailyHoroscopeCard email={user.email} />
                        </div>
                    )}
                </div>
            </section>

            {/* SECTION 2: THE DASHBOARD GRID */}
            <section className="pb-16 sm:pb-20 lg:pb-24 relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
                    
                    {/* LEFT: NAVI IS LIVE */}
                    <div className="flex-1 flex flex-col gap-4 sm:gap-6">
                        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0">
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-headline font-bold text-foreground leading-none">AstraNavi Intelligence</h2>
                            <div className="flex items-center gap-1.5 sm:gap-2 bg-secondary/10 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-secondary/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                                <span className="text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-widest">Navi is Live</span>
                            </div>
                        </div>

                        <Card padding="none" className="!rounded-[28px] sm:!rounded-[40px] overflow-hidden group border-secondary/20 relative min-h-[240px] sm:min-h-[280px] flex flex-col justify-center shadow-lg">
                            {/* Internal gradient glow removed */}
                            <div className="flex flex-col sm:flex-row items-center p-6 sm:p-8 lg:p-10 gap-6 sm:gap-8 lg:gap-10 relative z-10">
                                <div className="shrink-0 relative">
                                     <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-[24px] sm:rounded-[28px] lg:rounded-[32px] bg-background border border-secondary/30 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-all duration-700">
                                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-[22px] sm:rounded-[26px] lg:rounded-[30px]">
                                            {/* Internal gradient removed */}
                                            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-secondary animate-pulse" />
                                        </div>
                                     </div>
                                     <div className="absolute -bottom-1.5 -right-1.5 sm:-bottom-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-secondary flex items-center justify-center shadow-lg border-2 border-surface">
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
                                            className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl gold-gradient text-white font-bold shadow-xl shadow-secondary/20 border-none hover:scale-105 transition-all text-sm sm:text-base min-h-[44px] sm:min-h-[48px]"
                                        >
                                            Consult Navi Now ✦
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT: QUICK ASK */}
                    <div className="w-full lg:w-[380px] xl:w-[400px] flex flex-col gap-4 sm:gap-6 shrink-0">
                        <Card padding="md" className="!rounded-[28px] sm:!rounded-[40px] relative border border-secondary/20 h-full flex flex-col">
                            <h4 className="text-[11px] sm:text-[12px] font-bold text-secondary mb-5 sm:mb-6 lg:mb-8 flex items-center gap-1.5 sm:gap-2 uppercase tracking-[0.15em] sm:tracking-[0.2em] border-b border-secondary/10 pb-3 sm:pb-4">
                                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Quick Ask Navi
                            </h4>
                            <div className="flex flex-col gap-2.5 sm:gap-3 mb-5 sm:mb-6 lg:mb-8">
                                {personalizedQuestions.map((question, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleQuickAsk(question)} 
                                        className="text-left text-[11px] sm:text-xs font-bold text-foreground/70 bg-surface/50 border border-secondary/10 px-4 sm:px-5 py-3 sm:py-4 rounded-[16px] sm:rounded-[20px] hover:border-secondary/40 hover:bg-surface/80 transition-all hover:text-secondary active:scale-98"
                                    >
                                        {question}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2 items-center bg-background border border-secondary/20 p-2 sm:p-2.5 rounded-[18px] sm:rounded-[22px] mt-auto">
                                <input 
                                    type="text" 
                                    placeholder="Your own question..." 
                                    value={customQuestion}
                                    onChange={(e) => setCustomQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAsk(customQuestion)}
                                    className="flex-1 min-w-0 bg-transparent border-none text-xs px-2 sm:px-3 text-foreground font-medium placeholder:text-foreground/30 focus:outline-none min-h-[40px] sm:min-h-[44px]" 
                                />
                                <button onClick={() => handleQuickAsk(customQuestion)} className="gold-gradient text-white rounded-[12px] sm:rounded-[14px] px-4 sm:px-5 py-2.5 sm:py-3 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all shadow-md shrink-0 active:scale-95 min-h-[40px] sm:min-h-[44px] flex items-center justify-center">Ask ✦</button>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
