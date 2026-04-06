"use client";

import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { Sparkles, Moon, Sun, ArrowRight, Clock, Map, Phone, MessageSquare, Compass, PlayCircle, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

    const userName = user?.email ? user.email.split('@')[0] : "Seeker";

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
            
            {/* Ambient Global Glow - Matching Landing Page */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#D4AF37]/10 rounded-full blur-[120px] pointer-events-none -translate-y-1/4 translate-x-1/4 z-0" />
            
            {/* SECTION 1: PERSONAL HERO & CONSOLE */}
            <section className="pt-28 pb-12 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                    
                    {/* Left: Welcome & Console */}
                    <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-xs font-bold font-mono tracking-widest uppercase mb-6 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5" />
                            AstraNavi Intelligence
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline mb-4 text-foreground tracking-tight leading-[1.1]">
                            Welcome back, <br className="hidden lg:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-500 capitalize">
                                {user?.name || user?.email || "Seeker"}
                            </span>.
                        </h1>

                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg3)] border border-indigo-500/20 text-[10px] text-indigo-400 font-medium mb-8 uppercase tracking-widest shadow-sm">
                            <span className="text-sm">🪐</span> Saturn Mahadasha • Mercury Antardasha • Mar–Dec 2026
                        </div>

                        <form onSubmit={handleQuickQuery} className="w-full max-w-xl group">
                            <Card padding="none" hoverable className="rounded-2xl md:rounded-full !bg-surface p-2.5 flex flex-col sm:flex-row gap-3 items-center relative z-20">
                                <Sun className="w-6 h-6 text-secondary ml-4 hidden sm:block opacity-70" />
                                <input
                                    type="text"
                                    value={quickQuery}
                                    onChange={(e) => setQuickQuery(e.target.value)}
                                    placeholder="What guidance do you seek today?"
                                    className="w-full bg-transparent text-foreground/90 placeholder:text-foreground/40 focus:outline-none px-4 py-3 text-base font-sans h-12"
                                />
                                <Button type="submit" className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-secondary to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black shadow-lg shadow-secondary/20 border-none font-bold rounded-xl md:rounded-full px-8 h-12 text-sm z-30 relative">
                                    Consult Navi
                                </Button>
                            </Card>
                        </form>
                    </div>

                    {/* Right: User's Rashi (Moon Sign) - PERFECT CIRCLE */}
                    <div className="shrink-0 flex flex-col items-center justify-center relative group w-[280px] h-[280px] rounded-full bg-surface/80 backdrop-blur-3xl border border-secondary/20 shadow-[0_0_50px_rgba(212,175,55,0.08)] overflow-hidden transition-all duration-500 hover:shadow-[0_0_80px_rgba(212,175,55,0.15)] hover:border-secondary/40 z-10">
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.15),transparent_70%)] pointer-events-none transition-opacity group-hover:opacity-100 opacity-60" />
                        
                        <p className="text-[10px] uppercase font-bold text-foreground/40 tracking-widest mb-2 relative z-10">Your Moon Sign</p>
                        
                        <div className="w-24 h-24 rounded-full bg-[#13102a] flex items-center justify-center shadow-inner mb-2 relative z-10 border border-secondary/10 group-hover:scale-110 transition-transform duration-500">
                            <span className="text-4xl">🦂</span>
                        </div>
                        
                        <h3 className="text-xl font-headline font-bold text-secondary tracking-wider uppercase mt-1 relative z-10 group-hover:text-amber-400 transition-colors">Vrishchik</h3>
                        <p className="text-[10px] font-medium text-foreground/50 mt-1 uppercase tracking-widest relative z-10">Scorpio</p>
                    </div>
                </div>
            </section>

            {/* TODAY BAND - 8 items */}
            <div className="w-full bg-surface/50 border-y border-[var(--border2)] overflow-x-auto custom-scrollbar relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between min-w-[800px] gap-2">
                    <div className="flex-1 text-center px-2 py-1 border-r border-[var(--border)] last:border-0 border-opacity-50">
                        <div className="text-[9px] text-foreground/50 tracking-widest uppercase mb-1">Energy</div>
                        <div className="text-xs font-bold text-emerald-400">Positive</div>
                    </div>
                    <div className="flex-1 text-center px-2 py-1 border-r border-[var(--border)] last:border-0 border-opacity-50">
                        <div className="text-[9px] text-foreground/50 tracking-widest uppercase mb-1">Tithi</div>
                        <div className="text-xs font-bold text-foreground">Chaturdashi</div>
                    </div>
                    <div className="flex-1 text-center px-2 py-1 border-r border-[var(--border)] last:border-0 border-opacity-50">
                        <div className="text-[9px] text-foreground/50 tracking-widest uppercase mb-1">Nakshatra</div>
                        <div className="text-xs font-bold text-foreground">U. Bhadra</div>
                    </div>
                    <div className="flex-1 text-center px-2 py-1 border-r border-[var(--border)] last:border-0 border-opacity-50">
                        <div className="text-[9px] text-foreground/50 tracking-widest uppercase mb-1">Rahu Kaal</div>
                        <div className="text-xs font-bold text-red-400">06:14–07:48</div>
                    </div>
                    <div className="flex-1 text-center px-2 py-1 border-r border-[var(--border)] last:border-0 border-opacity-50">
                        <div className="text-[9px] text-foreground/50 tracking-widest uppercase mb-1">Lucky No.</div>
                        <div className="text-xs font-bold text-secondary">8</div>
                    </div>
                    <div className="flex-1 text-center px-2 py-1 border-r border-[var(--border)] last:border-0 border-opacity-50">
                        <div className="text-[9px] text-foreground/50 tracking-widest uppercase mb-1">Lucky Colour</div>
                        <div className="text-xs font-bold text-secondary">Blue</div>
                    </div>
                    <div className="flex-1 text-center px-2 py-1 border-r border-[var(--border)] last:border-0 border-opacity-50">
                        <div className="text-[9px] text-foreground/50 tracking-widest uppercase mb-1">Sunrise</div>
                        <div className="text-xs font-bold text-foreground">06:28</div>
                    </div>
                    <div className="flex-1 text-center px-2 py-1 border-r border-[var(--border)] last:border-0 border-opacity-50">
                        <div className="text-[9px] text-foreground/50 tracking-widest uppercase mb-1">Shubh Time</div>
                        <div className="text-xs font-bold text-emerald-400">09:30–11:00</div>
                    </div>
                </div>
            </div>
            <div className="h-8 relative z-10 w-full"></div>

            {/* SECTION 1.5: THE ASTRAL ARCHIVES */}
            <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="flex justify-between items-end mb-6">
                    <h3 className="text-xl lg:text-2xl font-headline font-bold text-foreground flex items-center gap-2">
                        <Clock className="w-6 h-6 text-secondary" /> The Astral Archives
                    </h3>
                    <Link href="/chat" className="text-xs font-bold text-secondary hover:text-amber-400 transition-colors flex items-center gap-1 uppercase tracking-widest bg-secondary/5 px-3 py-1.5 rounded-full border border-secondary/20 hover:border-secondary/40">
                        View All <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Render Real Archives if they exist, otherwise show high-fidelity placeholders */}
                    {chats.length > 0 ? (
                        chats.slice(0, 2).map((chat, idx) => (
                            <Link key={chat._id} href={`/chat?id=${chat._id}`} className="block focus:outline-none">
                                <Card variant="elevated" padding="md" className="group cursor-pointer !rounded-[24px] h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-[100px] pointer-events-none transition-colors group-hover:bg-secondary/10 z-0" />
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-surface border border-secondary/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                            {idx === 0 ? <Map className="w-6 h-6 text-indigo-400" /> : <Sparkles className="w-6 h-6 text-secondary" />}
                                        </div>
                                        <div className="text-[10px] font-mono font-bold text-foreground/40 bg-foreground/5 px-2.5 py-1 rounded-md uppercase tracking-wider border border-secondary/10">
                                            {formatArchiveDate(chat.updatedAt)}
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-bold text-foreground/90 mb-1 group-hover:text-secondary transition-colors relative z-10 truncate">{chat.title}</h4>
                                    <p className="text-sm text-foreground/50 relative z-10">
                                        {idx === 0 ? 'Synthesis Analysis' : 'AI Consultation'} • {chat.averageRating ? `${chat.averageRating}★ rating` : 'Archived Path'}
                                    </p>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <>
                            {/* Discovery / Action Cards for New Users */}
                            <button onClick={() => handleQuickAsk("Analyze my Career and Wealth potential based on my birth chart.")} className="block w-full text-left focus:outline-none">
                                <Card variant="elevated" padding="md" className="group cursor-pointer !rounded-[24px] h-full relative overflow-hidden border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-500/5">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px] pointer-events-none z-0" />
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-surface border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Map className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div className="text-[10px] font-mono font-bold text-indigo-400/60 bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">Start Here</div>
                                    </div>
                                    <h4 className="text-lg font-bold text-foreground/90 mb-1 group-hover:text-indigo-400 transition-colors relative z-10">Wealth Synthesis</h4>
                                    <p className="text-xs text-foreground/50 relative z-10 font-medium">Analyze your Artha (wealth) house & career path.</p>
                                </Card>
                            </button>
                            <button onClick={() => handleQuickAsk("What does my Kundli say about my Love life and future partner?")} className="block w-full text-left focus:outline-none">
                                <Card variant="elevated" padding="md" className="group cursor-pointer !rounded-[24px] h-full relative overflow-hidden border-purple-500/20 hover:border-purple-500/40 bg-purple-500/5">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-[100px] pointer-events-none z-0" />
                                    <div className="flex justify-between items-start mb-6 relative z-10">
                                        <div className="w-12 h-12 rounded-2xl bg-surface border border-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Sparkles className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div className="text-[10px] font-mono font-bold text-purple-400/60 bg-purple-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">Discover</div>
                                    </div>
                                    <h4 className="text-lg font-bold text-foreground/90 mb-1 group-hover:text-purple-400 transition-colors relative z-10">Relationship Path</h4>
                                    <p className="text-xs text-foreground/50 relative z-10 font-medium">Understand your 7th house and Venus alignment.</p>
                                </Card>
                            </button>
                        </>
                    )}
                    
                    {/* Add New */}
                    <Link href="/chat" className="block focus:outline-none">
                        <Card variant="bordered" padding="md" className="h-full flex flex-col items-center justify-center text-center group cursor-pointer border-dashed border-secondary/30 hover:!border-secondary/60 hover:bg-secondary/5 !rounded-[24px] min-h-[160px]">
                            <div className="w-12 h-12 rounded-2xl bg-surface border border-secondary/20 group-hover:border-secondary/40 flex items-center justify-center mb-4 transition-colors">
                                <Plus className="w-5 h-5 text-foreground/50 group-hover:text-secondary" />
                            </div>
                            <h4 className="font-bold text-foreground/70 group-hover:text-secondary transition-colors">New Synthesis</h4>
                            <p className="text-xs text-foreground/40 mt-1">Generate a new chart or path</p>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* SEAMLESS DIVIDER */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-px bg-gradient-to-r from-transparent via-secondary/10 to-transparent mb-12" />
            </div>

            {/* SECTION 2: THE DASHBOARD GRID (Astrologers, Remedies, Insights) */}
            <section className="pb-24 relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col xl:flex-row gap-8">
                    
                    {/* LEFT COLUMN: Astrologers & Remedies */}
                    <div className="flex-1 flex flex-col gap-8">
                        
                        {/* TODAY HOROSCOPE */}
                        <Card variant="elevated" padding="md" className="!rounded-[32px] relative group border-indigo-500/10 hover:border-indigo-500/30">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3 relative z-10">
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <span className="text-2xl opacity-80">♏</span> Vrishchika • Today's Reading
                                </h3>
                                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-500/20 font-bold uppercase tracking-widest whitespace-nowrap">AI-Personalised</span>
                            </div>
                            <p className="text-sm text-foreground/70 leading-relaxed mb-6 relative z-10">
                                Mars aspects your 10th house — strong career momentum today. A conversation at work may open an unexpected door. Avoid conflict after 6pm as Moon enters Rahu axis.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 relative z-10">
                                <div className="flex items-center gap-3">
                                    <span className="w-14 text-[9px] text-foreground/50 uppercase font-bold tracking-widest">Career</span>
                                    <div className="flex-1 h-1.5 bg-[var(--bg)] border border-[var(--border2)] rounded-full overflow-hidden">
                                        <div className="h-full bg-secondary w-[82%] rounded-full"></div>
                                    </div>
                                    <span className="w-6 text-right text-[10px] text-secondary font-bold">82</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-14 text-[9px] text-foreground/50 uppercase font-bold tracking-widest">Love</span>
                                    <div className="flex-1 h-1.5 bg-[var(--bg)] border border-[var(--border2)] rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-400 w-[65%] rounded-full"></div>
                                    </div>
                                    <span className="w-6 text-right text-[10px] text-purple-400 font-bold">65</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-14 text-[9px] text-foreground/50 uppercase font-bold tracking-widest">Finance</span>
                                    <div className="flex-1 h-1.5 bg-[var(--bg)] border border-[var(--border2)] rounded-full overflow-hidden">
                                        <div className="h-full bg-secondary w-[74%] rounded-full"></div>
                                    </div>
                                    <span className="w-6 text-right text-[10px] text-secondary font-bold">74</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="w-14 text-[9px] text-foreground/50 uppercase font-bold tracking-widest">Health</span>
                                    <div className="flex-1 h-1.5 bg-[var(--bg)] border border-[var(--border2)] rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-400 w-[58%] rounded-full"></div>
                                    </div>
                                    <span className="w-6 text-right text-[10px] text-emerald-400 font-bold">58</span>
                                </div>
                            </div>
                        </Card>
                        
                        {/* SECTION: NAVI IS LIVE (Replaces Top Astrologers) */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl lg:text-3xl font-headline font-bold text-foreground">AI Intelligence</h2>
                            <div className="flex items-center gap-2 bg-secondary/10 px-3 py-1.5 rounded-full border border-secondary/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></div>
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Navi is Live</span>
                            </div>
                        </div>

                        <Card variant="elevated" padding="none" className="!rounded-[40px] overflow-hidden group border-secondary/20 relative min-h-[300px] flex flex-col justify-center">
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-amber-500/5 group-hover:opacity-100 opacity-60 transition-opacity duration-700 pointer-events-none" />
                            <div className="flex flex-col lg:flex-row items-center p-8 sm:p-10 gap-8 relative z-10">
                                <div className="shrink-0 relative">
                                     <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[32px] bg-surface/50 backdrop-blur-sm border-2 border-secondary/20 flex items-center justify-center text-5xl sm:text-6xl shadow-2xl shadow-secondary/10 group-hover:scale-105 transition-all duration-700">
                                        🤖
                                     </div>
                                     <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shadow-lg border-[3px] border-[var(--bg3)]">
                                        <Sparkles className="w-5 h-5 text-on-primary" />
                                     </div>
                                </div>
                                <div className="flex-1 text-center lg:text-left">
                                    <h3 className="text-2xl sm:text-3xl font-headline font-bold text-foreground mb-3 leading-tight tracking-tight">
                                        Navi is ready to <br className="hidden sm:block"/>guide your path
                                    </h3>
                                    <p className="text-foreground/60 text-sm sm:text-base max-w-xl mb-6 leading-relaxed">
                                        Connect with 5,000+ years of Vedic wisdom synthesized by cutting-edge AI. Your personal guide is waiting.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                                        <Button 
                                            variant="primary" 
                                            size="md" 
                                            onClick={() => router.push('/chat')}
                                            className="px-10 py-5 rounded-2xl text-black font-bold shadow-xl shadow-secondary/20 bg-gradient-to-r from-secondary to-amber-500 border-none hover:scale-105 active:scale-95 transition-transform"
                                        >
                                            Consult Navi Now
                                        </Button>
                                        <div className="text-[9px] uppercase font-bold tracking-[0.2em] text-foreground/30">
                                            Instant • Private • 24/7
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Weekly Planetary Remedies */}
                        <Card variant="elevated" padding="lg" allowOverflow className="!rounded-[32px] mt-2 relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none z-0" />
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 relative z-10">
                                <div className="w-12 h-12 rounded-[20px] bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center shrink-0 shadow-inner">
                                    <PlayCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-headline font-bold text-foreground mb-1">Weekly Planetary Remedies</h3>
                                    <p className="text-xs text-foreground/50">Align your physical actions with current celestial movements</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                                <Card variant="default" padding="sm" className="bg-black/20 hover:!border-white/10 !rounded-3xl hover:!shadow-none">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-secondary mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Monday: Moon
                                    </p>
                                    <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                                        Offer milk and water to Lord Shiva for emotional stability and mental peace.
                                    </p>
                                </Card>
                                <Card variant="default" padding="sm" className="bg-black/20 hover:!border-white/10 !rounded-3xl hover:!shadow-none">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-rose-400 mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Tuesday: Mars
                                    </p>
                                    <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                                        Recite Hanuman Chalisa to channel energy and overcome obstacles.
                                    </p>
                                </Card>
                                <Card variant="default" padding="sm" className="bg-black/20 hover:!border-white/10 !rounded-3xl hover:!shadow-none">
                                    <p className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Wednesday: Mercury
                                    </p>
                                    <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                                        Offer green grass to cows to enhance communication and intellectual growth.
                                    </p>
                                </Card>
                            </div>
                        </Card>

                    </div>

                    {/* RIGHT COLUMN: Vrishchika & Insights */}
                    <div className="w-full xl:w-[420px] flex flex-col gap-6 shrink-0 mt-8 xl:mt-0">
                        
                        {/* Vrishchika Today */}
                        <Card variant="elevated" padding="lg" className="!rounded-[40px] relative">
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <h3 className="text-2xl font-headline font-bold text-foreground tracking-tight">Vrishchika Today</h3>
                                <div className="w-10 h-10 rounded-full bg-secondary/5 flex items-center justify-center border border-secondary/20">
                                    <Compass className="w-5 h-5 text-secondary" />
                                </div>
                            </div>
                            <p className="text-foreground/60 text-sm leading-relaxed mb-8 relative z-10">
                                A period of transformation awaits. The Moon's alignment suggests unexpected financial gains through past investments. Focus on throat chakra today.
                            </p>
                            
                            <div className="flex gap-4 mb-10 relative z-10">
                                <Card variant="default" padding="sm" className="flex-1 flex flex-col items-center justify-center p-6 !rounded-[28px] !bg-surface shadow-inner">
                                    <span className="text-[9px] uppercase font-bold text-foreground/40 tracking-widest mb-2">Lucky No.</span>
                                    <span className="text-4xl font-headline font-bold text-secondary">8</span>
                                </Card>
                                <Card variant="default" padding="sm" className="flex-1 flex flex-col items-center justify-center p-6 !rounded-[28px] !bg-surface shadow-inner">
                                    <span className="text-[9px] uppercase font-bold text-foreground/40 tracking-widest mb-2">Lucky Color</span>
                                    <span className="text-xl font-headline font-bold text-rose-400 mt-2">Maroon</span>
                                </Card>
                            </div>

                            <div className="relative z-10">
                                <p className="text-[9px] font-bold tracking-widest uppercase text-foreground/40 mb-5 border-b border-secondary/10 pb-3">Planetary Transits</p>
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 ring-1 ring-amber-500/20">
                                                <Sun className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground/80">Sun in Meena</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-md uppercase tracking-widest border border-amber-500/20">Transit</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 ring-1 ring-indigo-500/20">
                                                <Moon className="w-4 h-4 text-indigo-400" />
                                            </div>
                                            <span className="text-sm font-medium text-foreground/80">Moon in Vrishchika</span>
                                        </div>
                                        <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase tracking-widest border border-indigo-500/20">Today</span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Celestial Insights */}
                        <Card variant="elevated" padding="lg" className="!rounded-[40px] relative">
                            <div className="flex items-center gap-3 mb-8 relative z-10 border-b border-secondary/10 pb-4">
                                <Sparkles className="w-5 h-5 text-secondary" />
                                <span className="text-xs font-bold tracking-widest uppercase text-secondary">Celestial Insights</span>
                            </div>
                            
                            <div className="space-y-6 relative z-10">
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-foreground/60">Tithi</span>
                                    <span className="text-secondary font-bold text-base">Shukla Navami</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-foreground/60">Nakshatra</span>
                                    <span className="text-secondary font-bold text-base">Anuradha</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="text-foreground/60">Yoga</span>
                                    <span className="text-secondary font-bold text-base">Saubhagya</span>
                                </div>
                            </div>
                        </Card>

                        {/* Quick Ask Navi */}
                        <Card variant="elevated" padding="md" className="!rounded-[40px] relative bg-indigo-500/5 border border-indigo-500/10">
                            <h4 className="text-sm font-bold text-indigo-400 mb-4 flex items-center gap-2">
                                🤖 Quick Ask Navi
                            </h4>
                            <div className="flex flex-col gap-2 mb-4">
                                <button onClick={() => handleQuickAsk("When will I see a breakthrough in my career or financial growth?")} className="text-left text-xs font-medium text-indigo-300 bg-background/50 border border-indigo-500/10 px-4 py-2.5 rounded-[14px] hover:border-indigo-400/40 hover:bg-background transition-all hover:-translate-y-0.5 duration-300">When will I see a breakthrough in my career or financial growth?</button>
                                <button onClick={() => handleQuickAsk("What does my birth chart reveal about my future life partner?")} className="text-left text-xs font-medium text-indigo-300 bg-background/50 border border-indigo-500/10 px-4 py-2.5 rounded-[14px] hover:border-indigo-400/40 hover:bg-background transition-all hover:-translate-y-0.5 duration-300">What does my birth chart reveal about my future life partner?</button>
                                <button onClick={() => handleQuickAsk("Which planetary Mahadasha am I currently in and what are its effects?")} className="text-left text-xs font-medium text-indigo-300 bg-background/50 border border-indigo-500/10 px-4 py-2.5 rounded-[14px] hover:border-indigo-400/40 hover:bg-background transition-all hover:-translate-y-0.5 duration-300">Which planetary Mahadasha am I currently in and what are its effects?</button>
                            </div>
                            <div className="flex gap-2 items-center bg-background border border-indigo-500/15 p-2 rounded-[16px]">
                                <input 
                                    type="text" 
                                    placeholder="Your own question..." 
                                    value={customQuestion}
                                    onChange={(e) => setCustomQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAsk(customQuestion)}
                                    className="flex-1 w-[120px] bg-transparent border-none text-xs px-2 text-foreground focus:outline-none" 
                                />
                                <button onClick={() => handleQuickAsk(customQuestion)} className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0">Ask ✦</button>
                            </div>
                        </Card>

                    </div>
                </div>
            </section>
        </div>
    );
}
