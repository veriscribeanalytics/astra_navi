'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
    Sparkles, BookOpen, User, Calendar, 
    Clock, MapPin, ArrowRight, Heart, Briefcase, Activity, 
    Compass, Network, Star, Zap, Home as HomeIcon, Lock, CheckCircle, Shield, Brain, ChevronDown, MessageSquare, Gem, Sun
} from 'lucide-react';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LogoLoop from '@/components/ui/LogoLoop';
import CardSwap, { Card as SwapCard } from '@/components/ui/CardSwap';
// Pricing is on its own /plans page
import { faqs } from "@/data/faqs";
import { useTranslation } from '@/hooks';

// Navigation functions to handle translations
const getRashiItems = () => [
    { id: 'aries', nameEn: 'Aries', nameHi: 'मेष', icon: '/icons/rashi/aries.png', href: '/rashis' },
    { id: 'taurus', nameEn: 'Taurus', nameHi: 'वृषभ', icon: '/icons/rashi/taurus.png', href: '/rashis' },
    { id: 'gemini', nameEn: 'Gemini', nameHi: 'मिथुन', icon: '/icons/rashi/gemini.png', href: '/rashis' },
    { id: 'cancer', nameEn: 'Cancer', nameHi: 'कर्क', icon: '/icons/rashi/cancer.png', href: '/rashis' },
    { id: 'leo', nameEn: 'Leo', nameHi: 'सिंह', icon: '/icons/rashi/leo.png', href: '/rashis' },
    { id: 'virgo', nameEn: 'Virgo', nameHi: 'कन्या', icon: '/icons/rashi/virgo.png', href: '/rashis' },
    { id: 'libra', nameEn: 'Libra', nameHi: 'तुला', icon: '/icons/rashi/libra.png', href: '/rashis' },
    { id: 'scorpio', nameEn: 'Scorpio', nameHi: 'वृश्चिक', icon: '/icons/rashi/scorpio.png', href: '/rashis' },
    { id: 'sagittarius', nameEn: 'Sagittarius', nameHi: 'धनु', icon: '/icons/rashi/sagittarius.png', href: '/rashis' },
    { id: 'capricorn', nameEn: 'Capricorn', nameHi: 'मकर', icon: '/icons/rashi/capricorn.png', href: '/rashis' },
    { id: 'aquarius', nameEn: 'Aquarius', nameHi: 'कुम्भ', icon: '/icons/rashi/aquarius.png', href: '/rashis' },
    { id: 'pisces', nameEn: 'Pisces', nameHi: 'मीन', icon: '/icons/rashi/pisces.png', href: '/rashis' },
];

const getServices = (t: (key: string) => string) => [
    { icon: <Compass className="w-6 h-6" />, title: t('nav.birthChart'), desc: t('nav.birthChartDesc'), iconBg: 'bg-indigo-500/10 text-indigo-400', available: true, detail: t('landing.vargaCharts') },
    { icon: <Brain className="w-6 h-6" />, title: t('landing.chatNaviTitle'), desc: t('landing.chatNaviDesc'), iconBg: 'bg-secondary/10 text-secondary', available: true, detail: t('common.onlineNow') },
    { icon: <Calendar className="w-6 h-6" />, title: t('landing.forecastTitle'), desc: t('nav.cosmicDashboardDesc'), iconBg: 'bg-emerald-500/10 text-emerald-400', available: true, detail: t('landing.nakshatraBased') },
    { icon: <Sparkles className="w-6 h-6" />, title: t('nav.guidedSessions'), desc: t('nav.guidedSessionsDesc'), iconBg: 'bg-amber-500/10 text-amber-500', available: true, detail: t('landing.strategicClarity') },
    { icon: <Briefcase className="w-6 h-6" />, title: t('landing.careerArtha'), desc: t('landing.careerArthaDesc'), iconBg: 'bg-amber-500/10 text-amber-400', available: true, detail: t('landing.wealthMapping') },
    { icon: <Heart className="w-6 h-6" />, title: t('landing.soulmateSyncTitle'), desc: t('landing.soulmateSyncDesc'), iconBg: 'bg-pink-500/10 text-pink-400', available: true, detail: t('landing.relationshipAi') },
];

const getKnowledgeAreas = (t: (key: string) => string) => [
    { title: t('nav.the27Nakshatras'), desc: t('nav.the27NakshatrasDesc'), icon: <Star className="w-6 h-6 text-secondary" />, link: "/blogs/nakshatras", count: t('landing.nakshatraDives'), detail: t('landing.lunarMatrix') },
    { title: t('nav.planetaryYogas'), desc: t('nav.planetaryYogasDesc'), icon: <Zap className="w-6 h-6 text-indigo-400" />, link: "/blogs/yogas", count: t('landing.yogasCount'), detail: t('landing.karmicCodes') },
    { title: t('nav.the12Houses'), desc: t('nav.the12HousesDesc'), icon: <HomeIcon className="w-6 h-6 text-emerald-400" />, link: "/blogs/houses", count: t('landing.housesCount'), detail: t('landing.lifeSpheres') },
    { title: t('landing.dashasTitle'), desc: t('landing.dashasDesc'), icon: <Clock className="w-6 h-6 text-rose-400" />, link: "/blogs", count: t('landing.timeMapping'), detail: t('landing.predictiveAi') },
    { title: t('landing.remediesTitle'), desc: t('landing.remediesDesc'), icon: <Gem className="w-6 h-6 text-amber-400" />, link: "/blogs", count: t('landing.vedicCure'), detail: t('landing.ratnaVigyan') },
    { title: t('landing.panchangTitle'), desc: t('landing.panchangDesc'), icon: <Sun className="w-6 h-6 text-indigo-400" />, link: "/blogs", count: t('landing.dailyFlux'), detail: t('landing.eventTiming') }
];

const getSteps = (t: (key: string) => string) => [
    { icon: <MapPin className="w-8 h-8 text-[#D4AF37]" />, title: t('landing.steps.0.title'), desc: t('landing.steps.0.desc'), detail: t('landing.steps.0.detail') },
    { icon: <Network className="w-8 h-8 text-[#D4AF37]" />, title: t('landing.steps.1.title'), desc: t('landing.steps.1.desc'), detail: t('landing.steps.1.detail') },
    { icon: <Clock className="w-8 h-8 text-[#D4AF37]" />, title: t('landing.steps.2.title'), desc: t('landing.steps.2.desc'), detail: t('landing.steps.2.detail') },
    { icon: <Brain className="w-8 h-8 text-[#D4AF37]" />, title: t('landing.steps.3.title'), desc: t('landing.steps.3.desc'), detail: t('landing.steps.3.detail') },
    { icon: <Sparkles className="w-8 h-8 text-[#D4AF37]" />, title: t('landing.steps.4.title'), desc: t('landing.steps.4.desc'), detail: t('landing.steps.4.detail') }
];

const getTrustPoints = (t: (key: string) => string) => [
    { icon: <Lock className="w-6 h-6 text-secondary" />, title: t('landing.trust.0.title'), desc: t('landing.trust.0.desc'), sub: t('landing.trust.0.sub') },
    { icon: <CheckCircle className="w-6 h-6 text-secondary" />, title: t('landing.trust.1.title'), desc: t('landing.trust.1.desc'), sub: t('landing.trust.1.sub') },
    { icon: <Shield className="w-6 h-6 text-secondary" />, title: t('landing.trust.2.title'), desc: t('landing.trust.2.desc'), sub: t('landing.trust.2.sub') }
];

const getSlides = (t: (key: string) => string) => [
    {
        tag: t('landing.slides.0.tag'),
        title: <>{t('landing.slides.0.title1')} <br/><span className="text-secondary italic">{t('landing.slides.0.titleHighlight')}</span></>,
        desc: t('landing.slides.0.desc'),
        stats: [{ v: t('landing.slides.0.stat1v'), l: t('landing.slides.0.stat1l') }, { v: t('landing.slides.0.stat2v'), l: t('landing.slides.0.stat2l') }, { v: t('landing.slides.0.stat3v'), l: t('landing.slides.0.stat3l') }],
        btn1: { label: t('landing.slides.0.btn1'), action: "portals" },
        btn2: { label: t('landing.slides.0.btn2'), href: "/chat" }
    },
    {
        tag: t('landing.slides.1.tag'),
        title: <>{t('landing.slides.1.title1')} <br/><span className="text-secondary italic">{t('landing.slides.1.titleHighlight')}</span></>,
        desc: t('landing.slides.1.desc'),
        stats: [{ v: t('landing.slides.1.stat1v'), l: t('landing.slides.1.stat1l') }, { v: t('landing.slides.1.stat2v'), l: t('landing.slides.1.stat2l') }, { v: t('landing.slides.1.stat3v'), l: t('landing.slides.1.stat3l') }],
        btn1: { label: t('landing.slides.1.btn1'), href: "/chat" },
        btn2: { label: t('landing.slides.1.btn2'), action: "how-it-works" }
    },
    {
        tag: t('landing.slides.2.tag'),
        title: <>{t('landing.slides.2.title1')} <br/><span className="text-secondary italic">{t('landing.slides.2.titleHighlight')}</span></>,
        desc: t('landing.slides.2.desc'),
        stats: [{ v: t('landing.slides.2.stat1v'), l: t('landing.slides.2.stat1l') }, { v: t('landing.slides.2.stat2v'), l: t('landing.slides.2.stat2l') }, { v: t('landing.slides.2.stat3v'), l: t('landing.slides.2.stat3l') }],
        btn1: { label: t('landing.slides.2.btn1'), action: "portals" },
        btn2: { label: t('landing.slides.2.btn2'), href: "/chat" }
    },
    {
        tag: t('landing.slides.3.tag'),
        title: <>{t('landing.slides.3.title1')} <br/><span className="text-secondary italic">{t('landing.slides.3.titleHighlight')}</span></>,
        desc: t('landing.slides.3.desc'),
        stats: [{ v: t('landing.slides.3.stat1v'), l: t('landing.slides.3.stat1l') }, { v: t('landing.slides.3.stat2v'), l: t('landing.slides.3.stat2l') }, { v: t('landing.slides.3.stat3v'), l: t('landing.slides.3.stat3l') }],
        btn1: { label: t('landing.slides.3.btn1'), href: "/chat" },
        btn2: { label: t('landing.slides.3.btn2'), action: "portals" }
    }
];

export default function LandingPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [activeSlide, setActiveSlide] = useState(0);
    const [interactionTick, setInteractionTick] = useState(0);
    const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);
    const [teaserMode, setTeaserMode] = useState<{ type: 'kundli' | 'match' | null, active: boolean }>({ type: null, active: false });

    // Form State
    const [formData, setFormData] = useState({ name: '', dob: '', tob: '', pob: '' });
    const [matchData, setMatchData] = useState({ name1: '', name2: '' });
    const [isCalculating, setIsCalculating] = useState(false);

    // Memoized Data
    const slides = useMemo(() => getSlides(t), [t]);
    const services = useMemo(() => getServices(t), [t]);
    const knowledgeAreas = useMemo(() => getKnowledgeAreas(t), [t]);
    const steps = useMemo(() => getSteps(t), [t]);
    const trustPoints = useMemo(() => getTrustPoints(t), [t]);
    const rashiItems = useMemo(() => getRashiItems(), []);
    const translatedFaqs = useMemo(() => {
        const rawFaqs = t('faqs');
        if (Array.isArray(rawFaqs)) {
            return (rawFaqs as {q: string, a: string}[]).map(f => ({ question: f.q, answer: f.a }));
        }
        return faqs; // Fallback to hardcoded faqs if something is wrong
    }, [t]);

    // Hero Rotation
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [interactionTick, slides.length]);

    const handleGenerateTeaser = (type: 'kundli' | 'match') => {
        setIsCalculating(true);
        setTimeout(() => {
            setIsCalculating(false);
            setTeaserMode({ type, active: true });
        }, 2000);
    };

    const toggleFAQ = (index: number) => {
        setOpenFAQIndex(openFAQIndex === index ? null : index);
    };

    const sectionVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
    };

    // Memoize the LogoLoop items
    const logoItems = useMemo(() => 
        rashiItems.map(rashi => ({
            node: (
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0 relative">
                        <Image 
                            alt={`${rashi.nameEn} Icon`} 
                            className="w-full h-full object-contain opacity-60 hover:opacity-100 transition-opacity hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]" 
                            src={rashi.icon}
                            width={24}
                            height={24}
                            style={{ width: 'auto', height: 'auto' }}
                            draggable={false}
                            priority
                        />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-headline font-bold text-foreground/40 hover:text-secondary transition-colors leading-none whitespace-nowrap">
                            {rashi.nameEn}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-foreground/30 hover:text-secondary/80 transition-colors leading-none whitespace-nowrap">
                            {rashi.nameHi}
                        </span>
                    </div>
                </div>
            ),
            title: `${rashi.nameEn} (${rashi.nameHi})`,
            href: rashi.href
        })), 
    [rashiItems]);

    return (
        <div className="flex flex-col w-full bg-transparent pb-20">
            
            {/* 1. HERO SECTION */}
            <section 
                onPointerDown={() => setInteractionTick(prev => prev + 1)}
                className="relative min-h-[600px] lg:h-[640px] flex items-center px-4 sm:px-6 md:px-8 lg:px-12 overflow-hidden border-b border-outline-variant/10 pt-20 lg:pt-0"
            >
                <motion.div 
                    initial={{ opacity: 0.1, scale: 0.8 }}
                    animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.05, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-10%] w-[250px] lg:w-[600px] h-[250px] lg:h-[600px] bg-[var(--glow-color)] blur-[60px] rounded-full -z-10 opacity-30 dark:opacity-60 will-change-transform"
                ></motion.div>
                
                <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-center relative z-10 py-10 lg:py-0 lg:-mt-[120px]">
                    
                    {/* Left: Rotating Text Content */}
                    <div className="lg:col-span-6 relative flex flex-col justify-start text-center lg:text-left min-h-[440px]">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={activeSlide}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                                className="space-y-4 sm:space-y-6 flex flex-col justify-start pt-4 lg:pt-10"
                            >
                                <div className="inline-flex w-fit mx-auto lg:mx-0 items-center space-x-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/30">
                                    <Sparkles className="text-secondary w-3.5 h-3.5" />
                                    <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.15em] font-bold text-secondary font-body">
                                        {slides[activeSlide]?.tag}
                                    </span>
                                </div>
                                
                                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-headline font-bold text-primary leading-[1.15]">
                                    {slides[activeSlide]?.title}
                                </h1>
                                
                                <p className="text-sm sm:text-base md:text-base text-on-surface-variant max-w-xl leading-relaxed font-normal font-body mx-auto lg:mx-0 opacity-80">
                                    {slides[activeSlide]?.desc}
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-1">
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
                                        className="gold-gradient shadow-xl px-10 w-full sm:w-auto"
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
                                        className="border border-outline-variant/30 px-10 w-full sm:w-auto text-primary"
                                    >
                                        {slides[activeSlide]?.btn2.label}
                                    </Button>
                                </div>

                                <div className="mt-auto pb-2 space-y-3">
                                    <div className="flex items-center justify-center lg:justify-start gap-3 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest py-2 border-t border-outline-variant/10">
                                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {t('landing.standards.bphs')}</span>
                                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {t('landing.standards.languages')}</span>
                                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {t('landing.standards.aiPrecision')}</span>
                                    </div>

                                    <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-10">
                                        {slides[activeSlide]?.stats.map((stat, idx) => (
                                            <div key={idx} className="flex flex-col">
                                                <div className="text-lg sm:text-xl font-bold text-secondary font-body">{stat.v}</div>
                                                <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-on-surface-variant/50 font-bold font-body">{stat.l}</div>
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
                                                &quot;How does Jupiter&apos;s transit affect my career this month?&quot;
                                            </div>
                                            <div className="max-w-[90%] self-end ml-auto p-3 rounded-2xl rounded-tr-none bg-blue-500/20 border border-blue-500/30 text-[10px] text-blue-100 italic">
                                                &quot;Jupiter in your 10th house brings professional expansion. Focus on leadership...&quot;
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
                                            <p className="text-[10px] text-white/60 italic leading-tight">&quot;Auspicious time for new beginnings.&quot;</p>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"><Activity className="text-white w-5 h-5" /></div>
                                </SwapCard>
                            </CardSwap>
                        </div>
                    </div>
                </div>

                {/* Hero Slider Indicators - Centered at bottom */}
                <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 flex justify-center gap-1.5 z-30">
                    {slides.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => {
                                setActiveSlide(idx);
                                setInteractionTick(prev => prev + 1);
                            }}
                            className={`h-1 rounded-full transition-all duration-300 ${activeSlide === idx ? 'w-6 bg-secondary shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'w-1.5 bg-secondary/20 hover:bg-secondary/40'}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </section>

            {/* 3. ZODIAC STRIP */}
            <section className="bg-surface relative overflow-hidden h-[60px] sm:h-[72px] flex items-center w-full z-20 border-b border-outline-variant/20">
                <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-secondary/5 animate-pulse opacity-50" />
                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(200,136,10,0.1),transparent)] bg-[length:200%_100%] animate-[shimmer_5s_infinite_linear]" />
                <LogoLoop
                    logos={logoItems}
                    speed={20}
                    direction="left"
                    logoHeight={40}
                    gap={40}
                    hoverSpeed={-2}
                    fadeOut
                    fadeOutColor="var(--surface)"
                />
            </section>

            {/* 4. MAIN CONTENT BELOW ZODIAC */}
            <motion.section 
                id="portals"
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}
                className="max-w-[1680px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 lg:py-12 relative"
            >
                {/* Section Headline */}
                <div className="text-center mb-8">
                    <div className="text-[10px] text-secondary font-bold tracking-[0.25em] uppercase mb-3">{t('landing.portalsHeadline')}</div>
                    <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{t('landing.portalsTitle')}<span className="text-secondary italic">{t('landing.portalsTitleHighlight')}</span></h2>
                </div>

                {/* 4-Column Grid: Chat Navi + 3 Portals */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Chat Navi Card */}
                    <Link href="/chat" className="group">
                        <Card className="border-outline-variant/30 hover:border-secondary/50 transition-all duration-500 h-[440px] flex flex-col relative overflow-hidden" padding="md">
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex flex-col items-center text-center justify-center h-full">
                                <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner">
                                    <MessageSquare className="w-7 h-7 text-secondary" />
                                </div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('common.onlineNow')}</span>
                                </div>
                                <h3 className="text-xl font-headline font-bold text-primary mb-3">{t('landing.chatNaviTitle')}</h3>
                                <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-6 max-w-[220px]">{t('landing.chatNaviDesc')}</p>
                                <div className="flex items-center text-[11px] font-bold text-secondary uppercase tracking-widest gap-2 group-hover:translate-x-1 transition-transform bg-secondary/5 px-4 py-2 rounded-full border border-secondary/10">
                                    {t('landing.chatNaviCta')} <ArrowRight className="w-3.5 h-3.5" />
                                </div>
                            </div>
                        </Card>
                    </Link>

                    {/* Horoscope Portal */}
                    <Card className="border-outline-variant/30 flex flex-col h-full items-center text-center justify-center" padding="md">
                        <div className="flex flex-col items-center justify-center w-full">
                            <Sparkles className="text-secondary w-10 h-10 mb-4 animate-pulse" />
                            <h3 className="text-xl font-headline font-bold text-primary mb-1 uppercase tracking-widest">{t('landing.forecastTitle')}</h3>
                            <span className="text-[8px] font-bold text-secondary px-2 py-0.5 bg-secondary/10 rounded-full border border-secondary/20 mb-6">{t('landing.liveTransit')}</span>
                            
                            <div className="w-full space-y-4 mb-6">
                                <div className="flex justify-between items-center bg-secondary/5 p-3 rounded-xl border border-secondary/10">
                                    <div className="text-left">
                                        <div className="text-[8px] font-bold text-secondary uppercase tracking-[0.2em]">{t('landing.moonSign')}</div>
                                        <div className="text-base font-bold text-primary">Pisces</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[8px] font-bold text-on-surface-variant/40 uppercase">{t('landing.nakshatra')}</div>
                                        <div className="text-[10px] font-bold text-primary">Revati</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Energy', val: 85, color: 'bg-amber-400' },
                                        { label: 'Luck', val: 62, color: 'bg-emerald-400' },
                                    ].map((s, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                                                <span>{s.label}</span><span>{s.val}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-surface-variant/20 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.val}%` }} transition={{ duration: 1, delay: i*0.1 }} className={`h-full ${s.color} rounded-full`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <Button href="/login" variant="secondary" size="sm" className="w-full text-[10px] font-bold text-secondary hover:text-secondary/80 flex items-center justify-center gap-1 h-10 border-secondary/20">
                                {t('landing.unlockFullPredictions')} <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </div>
                    </Card>

                    {/* Kundli Form Portal */}
                    <Card className="border-secondary/30 flex flex-col h-full relative overflow-hidden" padding="md">
                        <AnimatePresence mode="wait">
                            {isCalculating && teaserMode.type === 'kundli' ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full space-y-3">
                                    <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                                    <p className="text-[10px] font-bold text-secondary animate-pulse uppercase tracking-widest">{t('landing.mappingDestiny')}</p>
                                </motion.div>
                            ) : teaserMode.type === 'kundli' ? (
                                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center text-center justify-center">
                                    <span className="text-[7px] font-bold bg-secondary/20 text-secondary px-1.5 py-0.5 rounded tracking-tighter uppercase mb-2">{t('landing.samplePreview')}</span>
                                    <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/20 mb-4 w-full">
                                        <div className="text-[8px] font-bold text-secondary uppercase mb-1">{t('landing.activeMahadasha')}</div>
                                        <div className="text-base font-bold text-primary">Jupiter <span className="text-[10px] font-normal text-on-surface-variant/60">- Saturn</span></div>
                                    </div>
                                    <Button href="/login" size="sm" variant="primary" className="text-xs w-full h-10 mb-2">{t('landing.unlockFullKundli')}</Button>
                                    <button onClick={() => setTeaserMode({type:null, active:false})} className="text-[10px] text-on-surface-variant/40 hover:text-secondary transition-colors">{t('landing.backToForm')}</button>
                                </motion.div>
                            ) : (
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center text-center justify-center">
                                    <BookOpen className="text-secondary w-10 h-10 mb-4" />
                                    <h3 className="text-xl font-headline font-bold text-primary mb-2">{t('landing.janamKundliTitle')}</h3>
                                    <p className="text-sm text-on-surface-variant/70 mb-6">{t('landing.janamKundliDesc')}</p>
                                    <form onSubmit={(e) => { e.preventDefault(); handleGenerateTeaser('kundli'); }} className="space-y-2 w-full">
                                        <Input placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required className="h-9 text-xs" />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} required className="h-9 text-xs" />
                                            <Input type="time" value={formData.tob} onChange={(e) => setFormData({...formData, tob: e.target.value})} required className="h-9 text-xs" />
                                        </div>
                                        <Input placeholder="Place of Birth" value={formData.pob} onChange={(e) => setFormData({...formData, pob: e.target.value})} required className="h-9 text-xs" />
                                        <Button type="submit" fullWidth size="sm" className="h-9 text-xs mt-2">{t('landing.calculateKundli')}</Button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>

                    {/* Compatibility Portal */}
                    <Card className="border-outline-variant/30 flex flex-col h-full relative overflow-hidden" padding="md">
                        <AnimatePresence mode="wait">
                            {isCalculating && teaserMode.type === 'match' ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full space-y-3">
                                    <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                                    <p className="text-[10px] font-bold text-rose-500 animate-pulse uppercase tracking-widest">{t('landing.scanningSync')}</p>
                                </motion.div>
                            ) : teaserMode.type === 'match' ? (
                                <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 rounded-full border-4 border-rose-500 flex items-center justify-center mb-3">
                                        <div>
                                            <div className="text-xl font-bold text-primary">28<span className="text-[10px] text-on-surface-variant/40">/36</span></div>
                                            <div className="text-[8px] font-bold text-rose-500 uppercase">Gunas</div>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-headline font-bold text-primary mb-1">{t('landing.highMatch')}</h3>
                                    <Button href="/login" size="sm" className="gold-gradient w-full h-9 text-xs mt-3">{t('landing.unlockReport')}</Button>
                                    <button onClick={() => setTeaserMode({type:null, active:false})} className="text-[9px] text-on-surface-variant/40 mt-2 hover:text-rose-500">{t('common.back')}</button>
                                </motion.div>
                            ) : (
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center text-center justify-center">
                                    <Heart className="w-10 h-10 text-rose-500 mb-4 animate-pulse" />
                                    <h3 className="text-xl font-headline font-bold text-primary mb-2">{t('landing.soulmateSyncTitle')}</h3>
                                    <p className="text-sm text-on-surface-variant/70 mb-6">{t('landing.soulmateSyncDesc')}</p>
                                    <div className="w-full space-y-2 mb-3">
                                        <Input placeholder="Your Name" value={matchData.name1} onChange={(e) => setMatchData({...matchData, name1: e.target.value})} className="h-9 text-xs" />
                                        <Input placeholder="Partner's Name" value={matchData.name2} onChange={(e) => setMatchData({...matchData, name2: e.target.value})} className="h-9 text-xs" />
                                    </div>
                                    <Button onClick={() => handleGenerateTeaser('match')} variant="secondary" size="sm" className="border-rose-500/30 hover:bg-rose-500/10 text-rose-600 w-full h-9 text-xs">
                                        {t('landing.checkMatch')}
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>
                </div>
            </motion.section>

            {/* 5. 50/50 SPLIT: Ancient Wisdom + Cosmic Archive */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="max-w-[1680px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
                    {/* LEFT: Ancient Wisdom (Services in 3x2 Grid) */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 mb-3">
                                <Gem className="w-3 h-3 text-indigo-400" />
                                <span className="text-[10px] font-bold tracking-[0.25em] text-indigo-400 uppercase">{t('landing.toolkitHeadline')}</span>
                            </div>
                            <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary">{t('landing.toolkitTitle')}<span className="text-secondary italic">{t('landing.toolkitTitleHighlight')}</span></h2>
                        </div>
                        
                        <div className="grid grid-cols-2 border border-outline-variant/30 rounded-[32px] overflow-hidden bg-surface divide-x divide-y divide-outline-variant/20">
                            {services.map((svc, idx) => (
                                <Link key={idx} href="/chat" className="group p-4 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-secondary/[0.02] transition-colors relative h-full min-h-[220px]">
                                    <div className={`w-14 h-14 rounded-[20px] flex items-center justify-center ${svc.iconBg} mb-5 shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                                        {svc.icon}
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-headline font-bold text-primary mb-1 group-hover:text-secondary transition-colors">{svc.title}</h3>
                                    <span className="text-[11px] font-bold text-secondary/60 uppercase tracking-[0.2em] mb-3">{svc.detail}</span>
                                    <p className="text-sm sm:text-base text-on-surface-variant/80 leading-relaxed max-w-[90%] mx-auto">{svc.desc}</p>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-5 h-5 text-secondary" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Cosmic Archive (Library in 3x2 Grid) */}
                    <div className="flex flex-col">
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 mb-3">
                                <BookOpen className="w-3 h-3 text-emerald-500" />
                                <span className="text-[10px] font-bold tracking-[0.25em] text-emerald-500 uppercase">{t('landing.archiveHeadline')}</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary">{t('landing.archiveTitle')}<span className="text-secondary italic">{t('landing.archiveTitleHighlight')}</span></h2>
                                <Link href="/blogs" className="text-[11px] font-bold text-secondary uppercase tracking-[0.15em] flex items-center gap-1.5 hover:translate-x-1 transition-transform mb-1">
                                    {t('landing.fullArchive')} <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 border border-outline-variant/30 rounded-[32px] overflow-hidden bg-surface divide-x divide-y divide-outline-variant/20">
                            {knowledgeAreas.map((area, idx) => (
                                <Link key={idx} href={area.link} className="group p-4 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-emerald-500/[0.02] transition-colors relative h-full min-h-[220px]">
                                    <div className="w-14 h-14 rounded-[20px] bg-surface-variant/30 flex items-center justify-center mb-5 shrink-0 group-hover:scale-110 transition-transform">
                                        {area.icon}
                                    </div>
                                    <h4 className="text-lg sm:text-xl font-headline font-bold text-primary mb-1 group-hover:text-emerald-500 transition-colors">{area.title}</h4>
                                    <span className="text-[11px] font-bold text-emerald-500/60 uppercase tracking-[0.2em] mb-3">{area.detail}</span>
                                    <p className="text-sm sm:text-base text-on-surface-variant/80 leading-relaxed max-w-[90%] mx-auto">{area.desc}</p>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-5 h-5 text-emerald-500" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* FULL WIDTH PRICING CTA */}
                <div className="mt-12">
                    <Link href="/plans" className="group/p block">
                        <div className="p-8 rounded-[32px] bg-gradient-to-r from-secondary/5 via-secondary/10 to-secondary/5 border border-secondary/20 flex flex-col sm:flex-row items-center justify-between hover:border-secondary/40 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(212,175,55,0.1),transparent)]" />
                            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 text-center sm:text-left">
                                <div className="w-16 h-16 rounded-[20px] bg-secondary/10 flex items-center justify-center shadow-lg shadow-secondary/5 border border-secondary/20 group-hover:scale-110 transition-transform">
                                    <Sparkles className="w-8 h-8 text-secondary" />
                                </div>
                                <div>
                                    <h4 className="text-xl sm:text-2xl font-bold text-primary mb-1">{t('landing.premiumTitle')}</h4>
                                    <p className="text-sm sm:text-base text-on-surface-variant/70">{t('landing.premiumDesc')}</p>
                                </div>
                            </div>
                            <div className="mt-6 sm:mt-0 px-8 py-4 rounded-2xl bg-secondary text-background font-bold text-base flex items-center gap-2 group-hover:shadow-xl group-hover:shadow-secondary/20 transition-all">
                                {t('landing.viewPlans')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </div>
            </motion.section>

            {/* 8. HOW IT WORKS */}
            <motion.section id="how-it-works" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="py-16 lg:py-24 relative overflow-hidden bg-transparent">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 300C300 300 300 100 500 100C700 100 700 500 900 500C1100 500 1100 300 1300 300" stroke="var(--secondary)" strokeWidth="2" strokeDasharray="8 8" className="animate-[dash_20s_linear_infinite]" />
                    </svg>
                </div>
                <div className="max-w-[1680px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] mx-auto px-4 text-center mb-24 relative z-10">
                    <div className="text-[11px] text-secondary font-bold tracking-[0.25em] uppercase mb-5">{t('landing.howItWorksHeadline')}</div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline mb-6 text-primary">{t('landing.howItWorksTitle')}<span className="text-secondary italic">{t('landing.howItWorksTitleHighlight')}</span></h2>
                </div>
                
                <div className="max-w-[1600px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 relative z-10 px-4">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center group relative">
                            <div className="w-20 h-20 rounded-full border border-secondary/20 bg-surface flex items-center justify-center mb-6 relative shadow-xl group-hover:border-secondary group-hover:shadow-secondary/20 transition-all duration-500">
                                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-surface border border-secondary/60 flex items-center justify-center text-secondary font-bold font-mono text-[10px] shadow-md z-20">
                                    0{index + 1}
                                </div>
                                <div className="absolute inset-0 rounded-full bg-secondary/0 group-hover:bg-secondary/5 transition-colors duration-500" />
                                <div className="transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 z-10">{step.icon}</div>
                            </div>
                            <h3 className="text-lg font-headline font-bold mb-2 text-primary">{step.title}</h3>
                            <span className="text-[10px] font-bold text-secondary/50 uppercase tracking-[0.2em] mb-3">{step.detail}</span>
                            <p className="text-xs text-on-surface-variant/70 leading-relaxed max-w-[180px]">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </motion.section>




            {/* 10. TRUST & FAQ */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="py-16 lg:py-24 relative bg-transparent px-4 lg:px-12 max-w-[1680px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] mx-auto">
                <div className="text-center mb-24">
                    <div className="text-[11px] text-secondary font-bold tracking-[0.25em] uppercase mb-5">{t('landing.trustHeadline')}</div>
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-headline text-primary mb-16">{t('landing.trustTitle')}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 lg:gap-16 max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-[2200px] mx-auto">
                        {trustPoints.map((point, idx) => (
                            <Card key={idx} variant="bordered" padding="lg" className="flex flex-col items-center text-center relative overflow-hidden group !rounded-[32px]">
                                <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 scale-150 rotate-12">
                                    {point.icon}
                                </div>
                                <div className="h-16 w-16 rounded-[24px] bg-secondary/5 flex items-center justify-center mb-6 border border-secondary/10 group-hover:scale-110 transition-transform duration-500">{point.icon}</div>
                                <h3 className="text-xl font-headline font-bold text-primary mb-2">{point.title}</h3>
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-4">{point.sub}</span>
                                <p className="text-sm text-on-surface-variant/70 leading-relaxed">{point.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="max-w-[1150px] 2xl:max-w-[1500px] 3xl:max-w-[1800px] mx-auto mt-40" id="faq">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold font-headline mb-5 text-primary">{t('landing.faqTitle')}</h2>
                        <p className="text-on-surface-variant/60 text-lg">{t('landing.faqDesc')}</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-20">
                        {translatedFaqs.map((faq, idx) => (
                            <div key={idx} className="border border-outline-variant/30 rounded-[32px] bg-surface overflow-hidden hover:border-secondary/30 transition-colors h-fit">
                                <button onClick={() => toggleFAQ(idx)} className="w-full flex justify-between items-center p-6 text-left group">
                                    <span className="font-headline font-semibold text-lg text-primary group-hover:text-secondary transition-colors pr-4">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-secondary transition-transform shrink-0 ${openFAQIndex === idx ? 'rotate-180' : ''}`} />
                                </button>
                                <AnimatePresence>
                                    {openFAQIndex === idx && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="pb-6 px-6">
                                                <p className="text-on-surface-variant/80 text-sm leading-relaxed">{faq.answer}</p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                    <div className="p-10 rounded-[48px] bg-secondary/5 border border-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-white"><MessageSquare className="w-7 h-7" /></div>
                            <div className="text-center sm:text-left">
                                <h4 className="text-xl font-bold text-primary">{t('landing.stillHaveQuestions')}</h4>
                                <p className="text-base text-on-surface-variant/60">{t('landing.askAiGuide')}</p>
                            </div>
                        </div>
                        <Button href="/chat" variant="secondary" className="border-secondary/30 text-secondary px-10 h-12 text-base">{t('landing.chatNaviTitle')}</Button>
                    </div>
                </div>
            </motion.section>

            {/* 11. FINAL CTA Section */}
            <section className="py-16 lg:py-24 relative overflow-hidden bg-surface-variant/30 border-t border-outline-variant/20">
                <div className="absolute inset-0 opacity-15 bg-celestial-silk mix-blend-overlay" />
                <motion.div 
                    initial={{ opacity: 0.1, scale: 0.8 }}
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/20 blur-[150px] rounded-full"
                />
                
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <Sparkles className="w-12 h-12 text-secondary mx-auto mb-8 animate-pulse" />
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-primary mb-8">{t('landing.readyToAlign')}<span className="text-secondary italic">{t('landing.readyToAlignHighlight')}</span></h2>
                    <p className="text-on-surface-variant/80 text-lg mb-12 max-w-2xl mx-auto">{t('landing.finalCtaDesc')}</p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Button href="/chat" size="sm" className="gold-gradient shadow-2xl px-12 text-lg">{t('landing.beginJourney')}</Button>
                        <Button href="/about" size="sm" variant="ghost" className="text-primary hover:bg-primary/5 border border-outline-variant/30 px-12 text-lg">{t('landing.learnMethod')}</Button>
                    </div>
                </div>
            </section>

        </div>
    );
}
