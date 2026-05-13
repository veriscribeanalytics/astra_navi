'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { 
    Sparkles, Compass, Brain, MessageSquare, Heart, Activity, CheckCircle, User 
} from 'lucide-react';
import Button from '../ui/Button';
import CardSwap, { Card as SwapCard } from '@/components/ui/CardSwap';

export interface HeroSectionProps {
    slides: {
        tag: string;
        title: React.ReactNode;
        desc: string;
        stats: { v: string; l: string }[];
        btn1: { label: string; action?: string; href?: string };
        btn2: { label: string; action?: string; href?: string };
    }[];
    activeSlide: number;
    setActiveSlide: React.Dispatch<React.SetStateAction<number>>;
    setInteractionTick: React.Dispatch<React.SetStateAction<number>>;
    t: (key: string) => string;
}

export default function HeroSection({
    slides,
    activeSlide,
    setActiveSlide,
    setInteractionTick,
    t
}: HeroSectionProps) {
    const router = useRouter();

    return (
        <section 
            onPointerDown={() => setInteractionTick(prev => prev + 1)}
            className="relative min-h-[500px] sm:min-h-[600px] lg:h-[640px] flex items-center px-4 sm:px-6 md:px-8 lg:px-12 overflow-hidden border-b border-outline-variant/10 pt-24 sm:pt-20 lg:pt-0"
        >
            <motion.div 
                initial={{ opacity: 0.1, scale: 0.8 }}
                animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.05, 1] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[-10%] right-[-10%] w-[250px] lg:w-[600px] h-[250px] lg:h-[600px] bg-[var(--glow-color)] blur-[60px] rounded-full -z-10 opacity-30 dark:opacity-60 will-change-transform"
            ></motion.div>
            
            <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-12 lg:gap-12 items-center relative z-10 py-6 sm:py-10 lg:py-0 lg:-mt-[120px]">
                
                {/* Left: Rotating Text Content */}
                <div className="lg:col-span-6 relative flex flex-col justify-start text-center lg:text-left min-h-[360px] sm:min-h-[440px]">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={activeSlide}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.5, ease: "easeInOut" }}
                            className="space-y-3 sm:space-y-6 flex flex-col justify-start pt-0 sm:pt-4 lg:pt-10"
                        >
                            <div className="inline-flex w-fit mx-auto lg:mx-0 items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary/10 border border-secondary/30">
                                <Sparkles className="text-secondary w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span className="text-[9px] sm:text-[12px] uppercase tracking-[0.15em] font-bold text-secondary font-body">
                                    {slides[activeSlide]?.tag}
                                </span>
                            </div>
                            
                            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-5xl font-headline font-bold text-primary leading-[1.15]">
                                {slides[activeSlide]?.title}
                            </h1>
                            
                            <p className="text-xs sm:text-base md:text-base text-on-surface-variant max-w-xl leading-relaxed font-normal font-body mx-auto lg:mx-0 opacity-80">
                                {slides[activeSlide]?.desc}
                            </p>
                            
                            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-0 sm:pt-1">
                                <Button 
                                    onClick={() => {
                                        const action = slides[activeSlide]?.btn1.action;
                                        if (action) {
                                            document.getElementById(action)?.scrollIntoView({behavior:'smooth'});
                                        } else {
                                            router.push(slides[activeSlide]?.btn1.href || '/chat');
                                        }
                                    }} 
                                    size="lg" 
                                    className="gold-gradient shadow-xl px-6 sm:px-10 w-full sm:w-auto text-sm sm:text-base"
                                >
                                    {slides[activeSlide]?.btn1.label}
                                </Button>
                                <Button 
                                    onClick={() => {
                                        const action = slides[activeSlide]?.btn2.action;
                                        if (action) {
                                            document.getElementById(action)?.scrollIntoView({behavior:'smooth'});
                                        } else {
                                            router.push(slides[activeSlide]?.btn2.href || '/chat');
                                        }
                                    }}
                                    variant="ghost" 
                                    size="lg" 
                                    className="border border-outline-variant/30 px-6 sm:px-10 w-full sm:w-auto text-primary text-sm sm:text-base"
                                >
                                    {slides[activeSlide]?.btn2.label}
                                </Button>
                            </div>

                            <div className="mt-auto pb-2 space-y-2 sm:space-y-3">
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3 text-[8px] sm:text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-wider sm:tracking-widest py-2 border-t border-outline-variant/10">
                                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {t('landing.standards.bphs')}</span>
                                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {t('landing.standards.languages')}</span>
                                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {t('landing.standards.aiPrecision')}</span>
                                </div>

                                <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-10">
                                    {slides[activeSlide]?.stats.map((stat, idx) => (
                                        <div key={idx} className="flex flex-col">
                                            <div className="text-base sm:text-xl font-bold text-secondary font-body">{stat.v}</div>
                                            <div className="text-[8px] sm:text-[11px] uppercase tracking-[0.15em] sm:tracking-[0.2em] text-on-surface-variant/50 font-bold font-body">{stat.l}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Right: Permanent Visuals - Synced with activeSlide */}
                <div className="hidden lg:flex lg:col-span-6 relative h-[480px] w-full items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center">
                        
                        <CardSwap 
                            width={300} 
                            height={480} 
                            cardDistance={40} 
                            verticalDistance={55} 
                            activeIndex={activeSlide}
                        >
                            {/* CARD 1: KUNDLI DECODED */}
                            <SwapCard className="bg-[#12122b] border-[8px] border-outline-variant/30 overflow-hidden relative">
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="px-3 py-1.5 rounded-lg bg-secondary/90 backdrop-blur-sm border border-white/20 shadow-lg">
                                        <span className="text-[8px] font-bold text-white uppercase tracking-widest">BPHS Certified</span>
                                    </div>
                                </div>
                                <div className="absolute top-0 w-full h-6 bg-transparent flex justify-center items-end pb-1"><div className="w-16 h-1 rounded-full bg-white/20"></div></div>
                                <div className="p-6 pt-10 space-y-6">
                                    <div className="h-28 w-full rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                                        <div className="text-center px-4">
                                            <div className="text-secondary text-[10px] font-bold uppercase tracking-widest mb-1">Authentic Jyotish</div>
                                            <div className="text-white font-headline text-lg">{t('landing.janamKundliTitle')}</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[1,2,3,4,5,6].map(i => (
                                            <div key={i} className="h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-secondary/40 font-bold">Bhava {i}</div>
                                        ))}
                                    </div>
                                    <div className="h-20 w-full rounded-2xl bg-gradient-to-br from-secondary/20 to-transparent border border-secondary/10 p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Scriptural Insight</span>
                                        </div>
                                        <p className="text-[10px] text-white/50 leading-tight">Accurate Dasha & Varga calculations based on Brihat Parashara Hora Shastra.</p>
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-secondary flex items-center justify-center shadow-lg"><Compass className="text-white w-5 h-5" /></div>
                            </SwapCard>

                            {/* CARD 2: AI NAVI CHAT */}
                            <SwapCard className="bg-[#0a1824] border-[8px] border-outline-variant/30 overflow-hidden">
                                <div className="absolute top-0 w-full h-6 bg-transparent flex justify-center items-end pb-1"><div className="w-16 h-1 rounded-full bg-white/20"></div></div>
                                <div className="p-6 pt-10 space-y-4">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20"><Brain className="text-white w-5 h-5" /></div>
                                        <div>
                                            <div className="text-white text-xs font-bold">{t('landing.chatNaviTitle')}</div>
                                            <div className="text-blue-400 text-[9px] flex items-center gap-1 font-bold"><div className="w-1 h-1 rounded-full bg-blue-400" /> {t('common.online')}</div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="max-w-[85%] self-start p-3 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 text-[10px] text-white/70">
                                            {"\"How does Jupiter's transit affect my career this month?\""}
                                        </div>
                                        <div className="max-w-[90%] self-end ml-auto p-3 rounded-2xl rounded-tr-none bg-blue-500/20 border border-blue-500/30 text-[10px] text-blue-100 italic">
                                            {"\"Jupiter in your 10th house brings professional expansion. Focus on leadership...\""}
                                        </div>
                                    </div>
                                    <div className="mt-auto h-9 w-full rounded-full bg-white/5 border border-white/10 flex items-center px-4 justify-between">
                                        <span className="text-[10px] text-white/30">Ask Navi...</span>
                                        <MessageSquare className="w-3 h-3 text-blue-400" />
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg"><MessageSquare className="text-white w-5 h-5" /></div>
                            </SwapCard>

                            {/* CARD 3: SOULMATE SYNC */}
                            <SwapCard className="bg-[#240a12] border-[8px] border-outline-variant/30 overflow-hidden">
                                <div className="absolute top-4 right-4 z-20">
                                    <div className="px-3 py-1.5 rounded-lg bg-rose-500/90 backdrop-blur-sm border border-white/20 shadow-lg">
                                        <span className="text-[8px] font-bold text-white uppercase tracking-widest">Ashtakoot Milan</span>
                                    </div>
                                </div>
                                <div className="absolute top-0 w-full h-6 bg-transparent flex justify-center items-end pb-1"><div className="w-16 h-1 rounded-full bg-white/20"></div></div>
                                <div className="p-6 pt-10 space-y-6">
                                    <div className="h-28 w-full rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                        <div className="text-center px-4">
                                            <div className="text-rose-400 text-[9px] font-bold uppercase tracking-widest mb-1">Guna Matching</div>
                                            <div className="text-white font-headline text-xl">28/36 Gunas</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-around items-center py-2">
                                        <div className="w-14 h-14 rounded-full border border-rose-500/30 flex items-center justify-center relative">
                                            <User className="text-rose-400 w-6 h-6" />
                                        </div>
                                        <div className="w-8 h-px bg-rose-500/20" />
                                        <div className="w-14 h-14 rounded-full border border-rose-500/30 flex items-center justify-center relative">
                                            <User className="text-pink-400 w-6 h-6" />
                                        </div>
                                    </div>
                                    <div className="h-16 w-full rounded-2xl bg-gradient-to-br from-rose-500/20 to-transparent border border-rose-500/10 flex flex-col items-center justify-center text-center p-2">
                                        <div className="text-[11px] font-bold text-rose-300 uppercase tracking-widest mb-0.5">High Compatibility</div>
                                        <p className="text-[9px] text-white/40 leading-tight">Strong emotional & spiritual bond.</p>
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-lg"><Heart className="text-white w-5 h-5" /></div>
                            </SwapCard>

                            {/* CARD 4: DAILY ENERGY */}
                            <SwapCard className="bg-[#0a2414] border-[8px] border-outline-variant/30 overflow-hidden">
                                <div className="absolute top-0 w-full h-6 bg-transparent flex justify-center items-end pb-1"><div className="w-16 h-1 rounded-full bg-white/20"></div></div>
                                <div className="p-6 pt-10 space-y-6">
                                    <div className="h-28 w-full rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
                                        <div className="text-emerald-400 text-2xl font-headline font-bold">85%</div>
                                        <div className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-widest">Daily Alignment</div>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { l: 'Energy', v: 'High', c: 'bg-emerald-400' },
                                            { l: 'Focus', v: 'Sharp', c: 'bg-blue-400' },
                                        ].map((s, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <span className="text-[10px] text-white/50">{s.l}</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1 rounded-full bg-white/5 overflow-hidden">
                                                        <div className={`h-full ${s.c} w-[80%]`} />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-white">{s.v}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-16 w-full rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/10 p-3">
                                        <div className="text-[9px] text-emerald-300 uppercase font-bold mb-0.5">Transit Tip</div>
                                        <p className="text-[10px] text-white/60 italic leading-tight">{"\"Auspicious time for new beginnings.\""}</p>
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"><Activity className="text-white w-5 h-5" /></div>
                            </SwapCard>
                        </CardSwap>
                    </div>
                </div>
            </div>

            {/* Hero Slider Indicators - Centered at bottom */}
            <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 flex justify-center gap-0 sm:gap-0 z-30">
                {slides.map((_, idx) => (
                    <button 
                        key={idx}
                        onClick={() => {
                            setActiveSlide(idx);
                            setInteractionTick(prev => prev + 1);
                        }}
                        className="flex items-center justify-center w-[44px] h-[44px] bg-transparent"
                        aria-label={`Go to slide ${idx + 1}`}
                    >
                        <span 
                            className={`block rounded-full ${activeSlide === idx 
                                ? 'w-5 h-[6px] bg-secondary shadow-[0_0_8px_rgba(212,175,55,0.4)]' 
                                : 'w-[6px] h-[6px] bg-secondary/20 hover:bg-secondary/40'
                            }`} 
                        />
                    </button>
                ))}
            </div>
        </section>
    );
}
