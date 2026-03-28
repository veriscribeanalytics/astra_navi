"use client";

import { useAuth } from "@/context/AuthContext";
import { Sparkles, Moon, Sun, ArrowRight, Clock, Map, Phone, MessageSquare, Compass, PlayCircle, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardHome() {
    const { user } = useAuth();
    const router = useRouter();
    const [quickQuery, setQuickQuery] = useState("");

    const userName = user?.email ? user.email.split('@')[0] : "Seeker";

    const handleQuickQuery = (e: React.FormEvent) => {
        e.preventDefault();
        if (quickQuery.trim()) {
            router.push('/chat');
        }
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
                        
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline mb-8 text-foreground tracking-tight leading-[1.1]">
                            Welcome back, <br className="hidden lg:block" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-amber-500 capitalize">
                                {userName}
                            </span>.
                        </h1>

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

            {/* SEAMLESS DIVIDER */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-px bg-gradient-to-r from-transparent via-secondary/10 to-transparent my-10" />
            </div>

            {/* SECTION 1.5: THE ASTRAL ARCHIVES */}
            <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
                <div className="flex justify-between items-end mb-6">
                    <h3 className="text-xl lg:text-2xl font-headline font-bold text-foreground flex items-center gap-2">
                        <Clock className="w-6 h-6 text-secondary" /> The Astral Archives
                    </h3>
                    <Link href="/birth-chart" className="text-xs font-bold text-secondary hover:text-amber-400 transition-colors flex items-center gap-1 uppercase tracking-widest bg-secondary/5 px-3 py-1.5 rounded-full border border-secondary/20 hover:border-secondary/40">
                        View All <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Chart Item */}
                    <Card variant="elevated" padding="md" className="group cursor-pointer !rounded-[24px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-[100px] pointer-events-none transition-colors group-hover:bg-secondary/10 z-0" />
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-surface border border-secondary/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <Map className="w-6 h-6 text-indigo-400" />
                            </div>
                            <div className="text-[10px] font-mono font-bold text-foreground/40 bg-foreground/5 px-2.5 py-1 rounded-md uppercase tracking-wider border border-secondary/10">Yesterday</div>
                        </div>
                        <h4 className="text-lg font-bold text-foreground/90 mb-1 group-hover:text-indigo-400 transition-colors relative z-10">Personal Kundli</h4>
                        <p className="text-sm text-foreground/50 relative z-10">Vedic Chart • Aries Ascendant</p>
                    </Card>

                    {/* Chat Item */}
                    <Card variant="elevated" padding="md" className="group cursor-pointer !rounded-[24px]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-[100px] pointer-events-none transition-colors group-hover:bg-secondary/10 z-0" />
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-2xl bg-surface border border-secondary/20 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500">
                                <Sparkles className="w-6 h-6 text-secondary" />
                            </div>
                            <div className="text-[10px] font-mono font-bold text-foreground/40 bg-foreground/5 px-2.5 py-1 rounded-md uppercase tracking-wider border border-secondary/10">Mar 22</div>
                        </div>
                        <h4 className="text-lg font-bold text-foreground/90 mb-1 group-hover:text-secondary transition-colors relative z-10">Career Trajectory 2026</h4>
                        <p className="text-sm text-foreground/50 relative z-10">AI Consultation • 14 messages</p>
                    </Card>
                    
                    {/* Add New */}
                    <Link href="/birth-chart" className="block focus:outline-none">
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
                        
                        {/* Live Now Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl lg:text-3xl font-headline font-bold text-foreground">Live Now - Top Astrologers</h2>
                            <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">AI Experts Online</span>
                            </div>
                        </div>

                        {/* Astrologer Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Pandit Ramesh */}
                            <Card variant="elevated" padding="md" className="group !rounded-[32px]">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-[20px] overflow-hidden bg-surface shrink-0 relative flex flex-col items-center justify-end border border-secondary/10">
                                        <div className="w-full h-full bg-orange-500/10 absolute inset-0 mix-blend-screen"></div>
                                        <div className="text-4xl mb-2 z-10">👳🏽‍♂️</div>
                                        <div className="absolute -bottom-2.5 text-[9px] font-bold bg-[#110f22] text-secondary px-2 py-0.5 rounded-md z-20 whitespace-nowrap border border-secondary/20 tracking-wider shadow-md">EXP 15YRS</div>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-headline font-bold text-lg text-foreground leading-tight">Pandit<br/>Ramesh Sharma</h3>
                                            <div className="flex items-center text-xs font-bold text-[#facc15] bg-[#facc15]/10 px-2 py-0.5 rounded-md">
                                                <Sparkles className="w-3 h-3 mr-1" /> 4.9
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-foreground/50 mt-2 font-mono uppercase tracking-widest">Vedic, Vastu, Palmistry</p>
                                        <p className="font-bold text-secondary mt-2 text-lg">₹35 <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">/ Min</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="secondary" className="flex-1 bg-surface border-transparent text-foreground/80 hover:bg-secondary/5 py-2.5 rounded-2xl text-sm font-bold shadow-none">
                                        <Phone className="w-4 h-4 mr-2 opacity-70" /> Call
                                    </Button>
                                    <Button variant="primary" className="flex-1 py-2.5 rounded-2xl text-sm font-bold bg-gradient-to-br from-secondary to-amber-600 border-none text-black shadow-lg shadow-amber-500/10">
                                        <MessageSquare className="w-4 h-4 mr-2" /> Chat Now
                                    </Button>
                                </div>
                            </Card>

                            {/* Sadhvi Ananya */}
                            <Card variant="elevated" padding="md" className="group !rounded-[32px]">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-[20px] overflow-hidden bg-surface shrink-0 relative flex flex-col items-center justify-end border border-secondary/10">
                                        <div className="w-full h-full bg-green-500/10 absolute inset-0 mix-blend-screen"></div>
                                        <div className="text-4xl mb-2 z-10">🧘‍♀️</div>
                                        <div className="absolute -bottom-2.5 text-[9px] font-bold bg-[#110f22] text-secondary px-2 py-0.5 rounded-md z-20 whitespace-nowrap border border-secondary/20 tracking-wider shadow-md">EXP 8YRS</div>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="font-headline font-bold text-lg text-foreground leading-tight">Sadhvi<br/>Ananya Devi</h3>
                                            <div className="flex items-center text-xs font-bold text-[#facc15] bg-[#facc15]/10 px-2 py-0.5 rounded-md">
                                                <Sparkles className="w-3 h-3 mr-1" /> 5.0
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-foreground/50 mt-2 font-mono uppercase tracking-widest line-clamp-1">KP System, Nadi, Face</p>
                                        <p className="font-bold text-secondary mt-2 text-lg">₹45 <span className="text-[9px] text-foreground/40 font-bold uppercase tracking-widest">/ Min</span></p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button variant="secondary" className="flex-1 bg-surface border-transparent text-foreground/80 hover:bg-secondary/5 py-2.5 rounded-2xl text-sm font-bold shadow-none">
                                        <Phone className="w-4 h-4 mr-2 opacity-70" /> Call
                                    </Button>
                                    <Button variant="primary" className="flex-1 py-2.5 rounded-2xl text-sm font-bold bg-gradient-to-br from-secondary to-amber-600 border-none text-black shadow-lg shadow-amber-500/10">
                                        <MessageSquare className="w-4 h-4 mr-2" /> Chat Now
                                    </Button>
                                </div>
                            </Card>
                        </div>

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

                    </div>
                </div>
            </section>
        </div>
    );
}
