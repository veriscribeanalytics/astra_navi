'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
    Sparkles, BookOpen, User, Calendar, 
    Clock, MapPin, ArrowRight, Heart, Briefcase, Activity, DollarSign,
    Compass, Network, Star, Zap, Home as HomeIcon, Lock, CheckCircle, Shield, Brain, ChevronDown, MessageSquare, Gem
} from 'lucide-react';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Button from '../ui/Button';
import LogoLoop from '@/components/ui/LogoLoop';
import CardSwap, { Card as SwapCard } from '@/components/ui/CardSwap';
import Pricing from './Pricing';
import { faqs } from "@/data/faqs";

// ═══════════════════════════════════════════════════════════
// DATA ARRAYS
// ═══════════════════════════════════════════════════════════
const rashiItems = [
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

const services = [
    { icon: '📿', title: 'Complete Kundli', desc: 'Lagna, Navamsha & 16 Varga charts.', badge: 'Standard', iconBg: 'bg-secondary/10', available: true, detail: "16+ Varga Charts" },
    { icon: '🤖', title: 'Navi AI Guide', desc: 'Conversational AI trained on classical Jyotish.', badge: 'AI Powered', iconBg: 'bg-primary/10 dark:bg-primary/20', available: true, detail: "Instant Answers" },
    { icon: '💑', title: 'Match Making', desc: '36-Guna Milan plus deep planetary sync.', badge: 'Coming Soon', iconBg: 'bg-rose-500/10 text-rose-500', available: false, detail: "Ashtakoot Milan" },
    { icon: '🌙', title: 'Daily Forecast', desc: 'Personalized transit analysis based on your Moon.', badge: 'Personalized', iconBg: 'bg-secondary/10', available: true, detail: "Nakshatra Based" },
    { icon: '🏥', title: 'Health Forecast', desc: 'Vedic wellness timing and Ayurvedic analysis.', badge: 'Health', iconBg: 'bg-emerald-500/10 text-emerald-500', available: true, detail: "Transit Health" },
    { icon: '💎', title: 'Remedial Shop', desc: 'Authentic gemstones prescribed by strengths.', badge: 'Shop', iconBg: 'bg-amber-500/10 text-amber-500', available: false, detail: "Ratna Vigyan" },
];

const knowledgeAreas = [
    { title: "The 27 Nakshatras", desc: "Deep dive into the lunar mansions.", icon: <Star className="w-6 h-6 text-secondary" />, link: "/blogs/nakshatras", count: "27 Deep Dives", color: "from-amber-500/10 to-transparent" },
    { title: "Planetary Yogas", desc: "Specific planetary combinations that trigger massive life shifts.", icon: <Zap className="w-6 h-6 text-indigo-400" />, link: "/blogs/yogas", count: "100+ Combinations", color: "from-indigo-500/10 to-transparent" },
    { title: "The 12 Bhavas", desc: "Master the 12 domains of human experience.", icon: <HomeIcon className="w-6 h-6 text-emerald-400" />, link: "/blogs/houses", count: "Complete Guide", color: "from-emerald-500/10 to-transparent" }
];

const steps = [
    { icon: <Compass className="w-8 h-8 text-[#D4AF37]" />, title: "Provide Coordinates", desc: "Your exact birth moment is the seed from which your chart unfolds." },
    { icon: <Network className="w-8 h-8 text-[#D4AF37]" />, title: "Navi Calculates", desc: "Mapping 9 Grahas across 12 Bhavas to identify karmic patterns." },
    { icon: <Sparkles className="w-8 h-8 text-[#D4AF37]" />, title: "Receive Guidance", desc: "Ask Navi about your Dharma, relationships, or career timing." }
];

const trustPoints = [
    { icon: <Lock className="w-6 h-6 text-secondary" />, title: "Absolute Privacy", desc: "Your birth data is encrypted end-to-end." },
    { icon: <CheckCircle className="w-6 h-6 text-secondary" />, title: "Classical Accuracy", desc: "Trained on authentic Jyotish texts—BPHS, Phaladeepika." },
    { icon: <Shield className="w-6 h-6 text-secondary" />, title: "Always Available", desc: "Planetary transits don't wait. Consult Navi at any hour." }
];



const horoscopeCategories = [
    { title: 'Career', text: 'Shani transit suggests discipline in communication.', icon: <Briefcase className="w-4 h-4 text-orange-600" />, bg: 'bg-orange-500/10' },
    { title: 'Love', text: 'Venus alignment favors deep soulmate connection.', icon: <Heart className="w-4 h-4 text-pink-600" />, bg: 'bg-pink-500/10' },
    { title: 'Healing', text: 'Ketu transit favors meditation and spiritual detox.', icon: <Activity className="w-4 h-4 text-green-600" />, bg: 'bg-green-500/10' },
    { title: 'Wealth', text: 'Jupiter aspects your 11th house of permanent gains.', icon: <DollarSign className="w-4 h-4 text-yellow-600" />, bg: 'bg-yellow-500/10' },
];

const slides = [
    {
        tag: "Free Kundli • Instant Result",
        title: <>Your Life, <br/><span className="text-secondary italic">Decoded in 30s</span></>,
        desc: "Get your precise Vedic Kundli instantly. Unlock your life's purpose and karmic patterns with 5,000 years of astronomical wisdom.",
        stats: [{ v: "30 Sec", l: "Free Kundli" }, { v: "16 Varga", l: "Charts" }, { v: "Precise", l: "AI Jyotish" }],
        btn1: { label: "Get Free Kundli", action: "portals" },
        btn2: { label: "Explore AI Guide", href: "/chat" }
    },
    {
        tag: "AI Astro Guidance",
        title: <>Wisdom <br/><span className="text-secondary italic">Beyond Boundaries</span></>,
        desc: "Get instant, deep clarity from Navi, our specialized AI trained on thousands of classical Vedic texts. Available 24/7 for your path.",
        stats: [{ v: "AI Navi", l: "24/7 Chat" }, { v: "Classical", l: "Logic" }, { v: "100%", l: "Private" }],
        btn1: { label: "Chat with Navi AI", href: "/chat" },
        btn2: { label: "How it Works", action: "how-it-works" }
    },
    {
        tag: "Soulmate Matchmaking",
        title: <>Discover Your <br/><span className="text-secondary italic">Perfect Alignment</span></>,
        desc: "Advanced 36-point Guna Milan plus deep planetary sync analysis. Understand your relationship's spiritual and karmic destiny.",
        stats: [{ v: "36 Gunas", l: "Milan" }, { v: "Dosha", l: "Check" }, { v: "Soul", l: "Sync" }],
        btn1: { label: "Check Compatibility", action: "portals" },
        btn2: { label: "Sync Souls", href: "/chat" }
    },
    {
        tag: "Daily Personalized Flow",
        title: <>Align With <br/><span className="text-secondary italic">Your Soul Purpose</span></>,
        desc: "Your daily horoscope is calculated down to your exact Moon sign and Nakshatra. Stop following generic, sun-sign predictions.",
        stats: [{ v: "Personal", l: "Insights" }, { v: "Nakshatra", l: "Based" }, { v: "Daily", l: "Guidance" }],
        btn1: { label: "Get Daily Guide", href: "/chat" },
        btn2: { label: "Explore Transits", action: "portals" }
    }
];

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function LandingPage() {
    const router = useRouter();
    const [activeSlide, setActiveSlide] = useState(0);
    const [interactionTick, setInteractionTick] = useState(0);
    const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);
    const [teaserMode, setTeaserMode] = useState<{ type: 'kundli' | 'match' | null, active: boolean }>({ type: null, active: false });

    // Form State
    const [formData, setFormData] = useState({ name: '', dob: '', tob: '', pob: '' });
    const [matchData, setMatchData] = useState({ name1: '', name2: '' });
    const [errors, setErrors] = useState({ name: '', dob: '', tob: '', pob: '' });
    const [isCalculating, setIsCalculating] = useState(false);

    // Hero Rotation
    useEffect(() => {
        const timer = setInterval(() => {
            setActiveSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [interactionTick]);

    const handleGenerateTeaser = (type: 'kundli' | 'match') => {
        setIsCalculating(true);
        setTimeout(() => {
            setIsCalculating(false);
            setTeaserMode({ type, active: true });
        }, 2000);
    };

    // Form Validation
    const validateField = (field: keyof typeof formData, value: string) => {
        let error = '';
        switch (field) {
            case 'name':
                if (value.trim().length < 2) error = 'Name must be at least 2 characters';
                else if (!/^[a-zA-Z\s]+$/.test(value)) error = 'Name can only contain letters';
                break;
            case 'dob':
                if (value) {
                    const dob = new Date(value);
                    if (dob > new Date()) error = 'Birth date cannot be in the future';
                }
                break;
            case 'pob':
                if (value.trim().length < 2) error = 'Please enter a valid place';
                break;
        }
        return error;
    };

    const validateForm = () => {
        const newErrors = {
            name: validateField('name', formData.name),
            dob: validateField('dob', formData.dob),
            tob: '',
            pob: validateField('pob', formData.pob)
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (typeof window !== 'undefined') {
            localStorage.setItem('astranavi_pending_birth_details', JSON.stringify(formData));
        }
        router.push('/chat');
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
                            draggable={false}
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
    []);

    return (
        <div className="flex flex-col w-full bg-transparent pb-20">
            
            {/* 1. HERO SECTION */}
            <section 
                onPointerDown={() => setInteractionTick(prev => prev + 1)}
                className="relative min-h-[600px] lg:h-[720px] flex items-center px-4 sm:px-6 md:px-8 lg:px-12 overflow-hidden border-b border-outline-variant/10"
            >
                <motion.div 
                    initial={{ opacity: 0.1, scale: 0.8 }}
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-10%] w-[250px] lg:w-[600px] h-[250px] lg:h-[600px] bg-[var(--glow-color)] blur-[100px] rounded-full -z-10 opacity-30 dark:opacity-60"
                ></motion.div>
                
                <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 py-10 lg:py-0 lg:-mt-[150px]">
                    
                    {/* Left: Rotating Text Content (50% span) */}
                    <div className="lg:col-span-6 relative h-[480px] flex flex-col justify-start text-center lg:text-left">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={activeSlide}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="space-y-4 sm:space-y-6 absolute inset-0 flex flex-col justify-start pt-10 lg:pt-12"
                            >
                                <div className="inline-flex w-fit mx-auto lg:mx-0 items-center space-x-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30">
                                    <Sparkles className="text-secondary w-3.5 h-3.5" />
                                    <span className="text-[12px] sm:text-[13px] uppercase tracking-[0.15em] font-bold text-secondary font-body">
                                        {slides[activeSlide].tag}
                                    </span>
                                </div>
                                
                                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl font-headline font-bold text-primary leading-[1.1]">
                                    {slides[activeSlide].title}
                                </h1>
                                
                                <p className="text-base sm:text-lg md:text-lg text-on-surface-variant max-w-xl leading-relaxed font-normal font-body mx-auto lg:mx-0">
                                    {slides[activeSlide].desc}
                                </p>
                                
                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                                    <Button 
                                        onClick={() => {
                                            if (slides[activeSlide].btn1.action) {
                                                document.getElementById(slides[activeSlide].btn1.action)?.scrollIntoView({behavior:'smooth'});
                                            } else {
                                                router.push(slides[activeSlide].btn1.href || '/chat');
                                            }
                                        }} 
                                        size="lg" 
                                        className="gold-gradient shadow-xl px-10 w-full sm:w-auto"
                                    >
                                        {slides[activeSlide].btn1.label}
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                            if (slides[activeSlide].btn2.action) {
                                                document.getElementById(slides[activeSlide].btn2.action)?.scrollIntoView({behavior:'smooth'});
                                            } else {
                                                router.push(slides[activeSlide].btn2.href || '/chat');
                                            }
                                        }}
                                        variant="ghost" 
                                        size="lg" 
                                        className="border border-outline-variant/30 px-10 w-full sm:w-auto text-primary"
                                    >
                                        {slides[activeSlide].btn2.label}
                                    </Button>
                                </div>

                                <div className="mt-auto pb-4 space-y-4">
                                    <div className="flex items-center justify-center lg:justify-start gap-4 text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest py-2 border-t border-outline-variant/10">
                                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> English & Hindi</span>
                                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> AI Precision</span>
                                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> 100% Private</span>
                                    </div>

                                    <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-10">
                                        {slides[activeSlide].stats.map((stat, idx) => (
                                            <div key={idx} className="flex flex-col">
                                                <div className="text-xl sm:text-2xl font-bold text-secondary font-body">{stat.v}</div>
                                                <div className="text-[11px] sm:text-[12px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-bold font-body">{stat.l}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Indicators Moved to Bottom-Left for Desktop */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0 flex justify-center lg:justify-start gap-2 z-30">
                            {slides.map((_, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => {
                                        setActiveSlide(idx);
                                        setInteractionTick(prev => prev + 1);
                                    }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === idx ? 'w-8 bg-secondary shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'w-2 bg-secondary/20 hover:bg-secondary/40'}`}
                                    aria-label={`Go to slide ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right: Permanent Visuals (50% span) - Hidden on Mobile */}
                    <div className="hidden lg:flex lg:col-span-6 relative h-[500px] w-full items-center justify-center">
                        <div className="relative w-full h-full flex items-center justify-center">
                            {/* App Coming Soon Badge */}
                            <div className="absolute top-10 right-10 z-20 rotate-12 animate-float">
                                <div className="px-4 py-2 rounded-xl bg-secondary shadow-[0_0_20px_rgba(212,175,55,0.4)] border border-white/20">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest whitespace-nowrap">App Coming Soon</span>
                                </div>
                            </div>

                            <CardSwap width={320} height={500} cardDistance={40} verticalDistance={60} delay={5000}>
                                {/* CARD 1: KUNDLI DECODED */}
                                <SwapCard className="bg-[#0b0a1a] border-[8px] border-outline-variant/30 overflow-hidden">
                                    <div className="absolute top-0 w-full h-6 bg-transparent flex justify-center items-end pb-1"><div className="w-16 h-1 rounded-full bg-white/20"></div></div>
                                    <div className="p-6 pt-10 space-y-6">
                                        <div className="h-32 w-full rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                                            <div className="text-center px-4">
                                                <div className="text-secondary text-[10px] font-bold uppercase tracking-widest mb-1">Your Life Decoded</div>
                                                <div className="text-white font-headline text-lg">Birth Chart Analysis</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[1,2,3,4,5,6].map(i => (
                                                <div key={i} className="h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] text-secondary/40 font-bold">H{i}</div>
                                            ))}
                                        </div>
                                        <div className="h-24 w-full rounded-2xl bg-gradient-to-br from-secondary/20 to-transparent border border-secondary/10 p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                                                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Karmic Pattern</span>
                                            </div>
                                            <p className="text-[11px] text-white/50 leading-snug">Rahu in 10th house suggests a career in innovation and leadership.</p>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-secondary flex items-center justify-center shadow-lg shadow-secondary/50"><Compass className="text-white w-6 h-6" /></div>
                                </SwapCard>

                                {/* CARD 2: AI NAVI CHAT */}
                                <SwapCard className="bg-[#07111a] border-[8px] border-outline-variant/30 overflow-hidden">
                                    <div className="absolute top-0 w-full h-6 bg-transparent flex justify-center items-end pb-1"><div className="w-16 h-1 rounded-full bg-white/20"></div></div>
                                    <div className="p-6 pt-10 space-y-4">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20"><Brain className="text-white w-5 h-5" /></div>
                                            <div>
                                                <div className="text-white text-sm font-bold">Navi AI</div>
                                                <div className="text-blue-400 text-[10px] flex items-center gap-1 font-bold"><div className="w-1 h-1 rounded-full bg-blue-400" /> Online</div>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="max-w-[80%] self-start p-3 rounded-2xl rounded-tl-none bg-white/5 border border-white/10 text-[11px] text-white/70">
                                                "How does Jupiter's transit affect my career this month?"
                                            </div>
                                            <div className="max-w-[85%] self-end ml-auto p-3 rounded-2xl rounded-tr-none bg-blue-500/20 border border-blue-500/30 text-[11px] text-blue-100 italic">
                                                "Jupiter in your 10th house brings massive professional expansion. Focus on..."
                                            </div>
                                        </div>
                                        <div className="mt-auto h-10 w-full rounded-full bg-white/5 border border-white/10 flex items-center px-4 justify-between">
                                            <span className="text-[10px] text-white/30">Ask Navi anything...</span>
                                            <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/50"><MessageSquare className="text-white w-6 h-6" /></div>
                                </SwapCard>

                                {/* CARD 3: SOULMATE SYNC */}
                                <SwapCard className="bg-[#1a070e] border-[8px] border-outline-variant/30 overflow-hidden">
                                    <div className="absolute top-0 w-full h-6 bg-transparent flex justify-center items-end pb-1"><div className="w-16 h-1 rounded-full bg-white/20"></div></div>
                                    <div className="p-6 pt-10 space-y-6">
                                        <div className="h-32 w-full rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                            <div className="text-center px-4">
                                                <div className="text-rose-400 text-[10px] font-bold uppercase tracking-widest mb-1">Compatibility</div>
                                                <div className="text-white font-headline text-2xl">28/36 Gunas</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-around items-center py-2">
                                            <div className="w-16 h-16 rounded-full border-2 border-rose-500/30 flex items-center justify-center relative">
                                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-[10px] flex items-center justify-center font-bold text-white shadow-lg">M</div>
                                                <User className="text-rose-400 w-8 h-8" />
                                            </div>
                                            <div className="w-10 h-px bg-rose-500/20" />
                                            <div className="w-16 h-16 rounded-full border-2 border-rose-500/30 flex items-center justify-center relative">
                                                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pink-500 text-[10px] flex items-center justify-center font-bold text-white shadow-lg">F</div>
                                                <User className="text-pink-400 w-8 h-8" />
                                            </div>
                                        </div>
                                        <div className="h-20 w-full rounded-2xl bg-gradient-to-br from-rose-500/20 to-transparent border border-rose-500/10 flex flex-col items-center justify-center text-center p-2">
                                            <div className="text-[12px] font-bold text-rose-300 uppercase tracking-widest mb-1">High Compatibility</div>
                                            <p className="text-[10px] text-white/40 leading-tight">Strong emotional & spiritual bond detected.</p>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/50"><Heart className="text-white w-6 h-6" /></div>
                                </SwapCard>

                                {/* CARD 4: DAILY ENERGY */}
                                <SwapCard className="bg-[#071a0e] border-[8px] border-outline-variant/30 overflow-hidden">
                                    <div className="absolute top-0 w-full h-6 bg-transparent flex justify-center items-end pb-1"><div className="w-16 h-1 rounded-full bg-white/20"></div></div>
                                    <div className="p-6 pt-10 space-y-6">
                                        <div className="h-32 w-full rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center">
                                            <div className="text-emerald-400 text-3xl font-headline font-bold">85%</div>
                                            <div className="text-[10px] text-emerald-400/60 font-bold uppercase tracking-widest">Today's Alignment</div>
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                { l: 'Energy', v: 'High', c: 'bg-emerald-400' },
                                                { l: 'Focus', v: 'Sharp', c: 'bg-blue-400' },
                                                { l: 'Mood', v: 'Spiritual', c: 'bg-purple-400' }
                                            ].map((s, i) => (
                                                <div key={i} className="flex items-center justify-between">
                                                    <span className="text-[11px] text-white/50">{s.l}</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 h-1.5 rounded-full bg-white/5 overflow-hidden">
                                                            <div className={`h-full ${s.c} w-[80%]`} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-white">{s.v}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="h-20 w-full rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/10 p-4">
                                            <div className="text-[10px] text-emerald-300 uppercase font-bold mb-1">Transit Tip</div>
                                            <p className="text-[11px] text-white/60 italic leading-tight">"Auspicious time for new beginnings."</p>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50"><Activity className="text-white w-6 h-6" /></div>
                                </SwapCard>
                            </CardSwap>
                        </div>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div 
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer z-20 group hidden lg:flex"
                    onClick={() => document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <motion.div 
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="flex flex-col items-center gap-2"
                    >
                        <span className="text-[9px] font-bold text-secondary/40 group-hover:text-secondary uppercase tracking-[0.3em] transition-colors">Explore</span>
                        <div className="w-5 h-8 rounded-full border border-secondary/20 group-hover:border-secondary/40 flex justify-center p-1.5 transition-colors">
                            <div className="w-1 h-1.5 bg-secondary/40 group-hover:bg-secondary rounded-full" />
                        </div>
                    </motion.div>
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
                    fadeOutColor="hsl(var(--surface))"
                />
            </section>

            {/* 4. INTERACTIVE PORTALS (Horoscope, Kundli, Match) */}
            <motion.section 
                id="portals"
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}
                className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-16"
            >
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/5 border border-secondary/10 mb-4">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                        </span>
                        <span className="text-[10px] font-bold tracking-[0.25em] text-secondary uppercase">Your Cosmic Journey</span>
                    </div>
                    <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">Start Exploring Now</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                    
                    {/* 1. Horoscope Portal */}
                    <Card className="border-outline-variant/30 flex flex-col shadow-xl h-[520px]" padding="none">
                        <div className="p-6 border-b border-outline-variant/20 bg-surface flex justify-between items-center">
                            <h3 className="text-xl font-headline font-bold flex items-center gap-2 text-primary">
                                <Sparkles className="text-secondary w-5 h-5" /> Today's Detail
                            </h3>
                            <span className="text-[9px] font-bold text-secondary px-2 py-0.5 bg-secondary/10 rounded-full border border-secondary/20">LIVE TRANSIT</span>
                        </div>
                        <div className="p-6 space-y-6 flex-grow overflow-y-auto hide-scrollbar">
                            <div className="flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">Moon Sign</div>
                                    <div className="text-2xl font-bold text-primary">Pisces (Meen)</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-bold text-on-surface-variant/40 uppercase">Nakshatra</div>
                                    <div className="text-sm font-bold text-primary">Revati ✦✦✦</div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                {[
                                    { label: 'Energy', val: 85, color: 'bg-amber-400' },
                                    { label: 'Luck', val: 62, color: 'bg-emerald-400' },
                                    { label: 'Emotion', val: 40, color: 'bg-blue-400' }
                                ].map((s, i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                                            <span>{s.label}</span>
                                            <span>{s.val}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-surface-variant/20 rounded-full overflow-hidden shadow-inner">
                                            <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.val}%` }} transition={{ duration: 1, delay: i*0.1 }} className={`h-full ${s.color} rounded-full`} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                {horoscopeCategories.slice(0, 2).map((cat, i) => (
                                    <div key={i} className="p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-6 h-6 rounded-md ${cat.bg} flex items-center justify-center`}>{cat.icon}</div>
                                            <span className="text-[9px] font-bold text-foreground/60 uppercase">{cat.title}</span>
                                        </div>
                                        <p className="text-[10px] leading-relaxed text-foreground/80 line-clamp-2">{cat.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 border-t border-outline-variant/20 bg-secondary/5 text-center mt-auto">
                            <Link href="/login" className="text-sm font-bold text-secondary hover:text-secondary/80 flex items-center justify-center gap-2">
                                Unlock 12 House Predictions <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </Card>

                    {/* 2. Birth Chart Form */}
                    <Card className="border-secondary/30 flex flex-col shadow-xl shadow-secondary/5 h-[520px] relative overflow-hidden" padding="lg">
                        <AnimatePresence mode="wait">
                            {isCalculating && teaserMode.type === 'kundli' ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full space-y-4">
                                    <div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-secondary animate-pulse uppercase tracking-widest">Mapping Your Destiny...</p>
                                </motion.div>
                            ) : teaserMode.type === 'kundli' ? (
                                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-headline font-bold text-primary">Insight for {formData.name}</h3>
                                        <span className="text-[8px] font-bold bg-secondary/20 text-secondary px-1.5 py-0.5 rounded tracking-tighter uppercase">Sample Preview</span>
                                    </div>
                                    <div className="space-y-4 flex-grow">
                                        <div className="p-4 bg-secondary/5 rounded-2xl border border-secondary/20">
                                            <div className="text-[10px] font-bold text-secondary uppercase mb-1">Active Mahadasha</div>
                                            <div className="text-2xl font-bold text-primary">Jupiter <span className="text-sm font-normal text-on-surface-variant/60">- Saturn</span></div>
                                            <div className="text-[11px] text-on-surface-variant/70 mt-1">Expansion meets discipline. A period of structural growth.</div>
                                        </div>
                                        <div className="relative h-32 w-full rounded-2xl border border-outline-variant/20 overflow-hidden bg-surface-variant/10">
                                            <div className="absolute inset-0 backdrop-blur-md z-10 flex items-center justify-center">
                                                <Button href="/login" size="sm" variant="primary">Unlock Full Chart</Button>
                                            </div>
                                            <div className="p-4 grid grid-cols-3 gap-2 opacity-30 grayscale">
                                                {[...Array(9)].map((_, i) => <div key={i} className="h-6 bg-secondary/20 rounded" />)}
                                            </div>
                                        </div>
                                    </div>
                                    <Button onClick={() => setTeaserMode({type:null, active:false})} variant="ghost" size="sm" className="mt-4">Back to Search</Button>
                                </motion.div>
                            ) : (
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col">
                                    <h3 className="text-xl font-headline font-bold mb-6 flex items-center gap-2 text-primary">
                                        <BookOpen className="text-secondary w-5 h-5" /> Generate Kundli
                                    </h3>
                                    <form onSubmit={(e) => { e.preventDefault(); handleGenerateTeaser('kundli'); }} className="space-y-4">
                                        <Input placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} required />
                                            <Input type="time" value={formData.tob} onChange={(e) => setFormData({...formData, tob: e.target.value})} required />
                                        </div>
                                        <Input placeholder="Place of Birth" value={formData.pob} onChange={(e) => setFormData({...formData, pob: e.target.value})} required />
                                        <Button type="submit" fullWidth size="lg" className="mt-4">Calculate Chart</Button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>

                    {/* 3. Compatibility Portal */}
                    <Card className="border-outline-variant/30 flex flex-col shadow-xl relative overflow-hidden h-[520px]" padding="lg">
                        <AnimatePresence mode="wait">
                            {isCalculating && teaserMode.type === 'match' ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full space-y-4">
                                    <div className="w-16 h-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-rose-500 animate-pulse uppercase tracking-widest">Scanning Soul Sync...</p>
                                </motion.div>
                            ) : teaserMode.type === 'match' ? (
                                <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                                    <span className="text-[8px] font-bold bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded tracking-tighter uppercase mb-4">Sample Preview</span>
                                    <div className="w-32 h-32 rounded-full border-4 border-rose-500 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
                                        <div>
                                            <div className="text-3xl font-bold text-primary">28<span className="text-sm text-on-surface-variant/40">/36</span></div>
                                            <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Gunas</div>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-headline font-bold text-primary mb-2">High Compatibility</h3>
                                    <p className="text-sm text-on-surface-variant/70 mb-8 px-4">
                                        Strong Bhakoot and Nadi Koot connection. Great potential for long-term spiritual growth.
                                    </p>
                                    <div className="w-full p-4 bg-rose-500/5 rounded-2xl border border-rose-500/20 mb-6">
                                        <div className="text-[10px] font-bold text-rose-500 uppercase mb-2">Manglik Analysis</div>
                                        <div className="text-xs italic text-on-surface-variant/60 flex items-center justify-center gap-2">
                                            <Lock className="w-3 h-3" /> Login to reveal Dosha report
                                        </div>
                                    </div>
                                    <Button href="/login" size="lg" className="gold-gradient w-full">Unlock Soul Report</Button>
                                    <button onClick={() => setTeaserMode({type:null, active:false})} className="text-xs text-on-surface-variant/40 mt-4 hover:text-rose-500">Back</button>
                                </motion.div>
                            ) : (
                                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center text-center justify-center">
                                    <Heart className="w-12 h-12 text-rose-500 mb-6 animate-pulse" />
                                    <h3 className="text-2xl font-headline font-bold text-primary mb-2">Soulmate Sync</h3>
                                    <p className="text-sm text-on-surface-variant/70 mb-8 max-w-xs">
                                        Discover compatibility with our advanced 36-point system.
                                    </p>
                                    <div className="w-full space-y-4 mb-6">
                                        <Input placeholder="Your Name" value={matchData.name1} onChange={(e) => setMatchData({...matchData, name1: e.target.value})} />
                                        <Input placeholder="Partner's Name" value={matchData.name2} onChange={(e) => setMatchData({...matchData, name2: e.target.value})} />
                                    </div>
                                    <Button onClick={() => handleGenerateTeaser('match')} variant="secondary" size="lg" className="border-rose-500/30 hover:bg-rose-500/10 text-rose-600 w-full">
                                        Analyze Connection
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Card>

                </div>
            </motion.section>

            {/* 5. SERVICES BENTO GRID */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-7xl mx-auto py-12 lg:py-16 relative">
                <div className="absolute inset-0 bg-celestial-silk opacity-10 pointer-events-none rounded-[40px]" />
                <div className="text-center mb-16 relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 mb-4">
                        <Gem className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[10px] font-bold tracking-[0.25em] text-indigo-400 uppercase">The Jyotish Toolkit</span>
                    </div>
                    <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">Ancient Wisdom, <span className="text-secondary italic">Modern Detail</span></h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6 relative z-10">
                    {services.map((svc, idx) => {
                        const isHero = idx < 2;
                        const isComingSoon = !svc.available;
                        return (
                            <motion.div 
                                key={idx} 
                                whileHover={{ y: -5 }} 
                                className={`group relative p-8 rounded-[40px] border transition-all duration-500 flex flex-col h-full 
                                    ${isHero ? 'md:col-span-3 lg:col-span-6' : 'md:col-span-2 lg:col-span-4'}
                                    ${svc.available ? 'bg-surface border-outline-variant/30 hover:border-secondary/50 hover:shadow-2xl hover:shadow-secondary/5' : 'bg-surface/40 border-outline-variant/10 grayscale opacity-70'}`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${svc.iconBg} shadow-inner group-hover:scale-110 transition-transform`}>{svc.icon}</div>
                                    <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${svc.available ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-on-surface-variant/10 text-on-surface-variant/40'}`}>{svc.badge}</span>
                                </div>
                                <h3 className={`font-headline font-bold text-primary mb-3 ${isHero ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>{svc.title}</h3>
                                <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-8 flex-grow">{svc.desc}</p>
                                <div className="pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-secondary/60">{svc.detail}</span>
                                    {isComingSoon ? (
                                        <button className="flex items-center gap-2 text-[10px] font-bold text-primary/40 hover:text-secondary transition-colors px-3 py-1.5 rounded-full border border-transparent hover:border-secondary/20">
                                            <Sparkles className="w-3.5 h-3.5" /> Notify Me
                                        </button>
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-all duration-300">
                                            {isHero ? <ArrowRight className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.section>

            {/* 6. CELESTIAL KNOWLEDGE */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-7xl mx-auto py-12 lg:py-16">
                <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-16">
                    <div className="max-w-2xl text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10 mb-4">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-bold tracking-[0.25em] text-emerald-500 uppercase">The Cosmic Archive</span>
                        </div>
                        <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">Master the <span className="text-secondary italic">Ancient Codes</span></h2>
                    </div>
                    <Link href="/blogs" className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-surface border border-outline-variant/30 hover:border-secondary transition-all shadow-sm">
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">Explore Library</span>
                        <ArrowRight className="w-4 h-4 text-secondary group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {knowledgeAreas.map((area, idx) => (
                        <Link key={idx} href={area.link} className="group">
                            <Card padding="none" className="h-full !rounded-[48px] border-outline-variant/20 group-hover:border-secondary/30 group-hover:bg-secondary/[0.02] transition-all duration-500 overflow-hidden bg-surface flex flex-col relative">
                                <div className={`h-32 w-full bg-gradient-to-br ${area.color} relative overflow-hidden flex items-center justify-center`}>
                                    <div className="absolute inset-0 opacity-10 bg-celestial-silk" />
                                    <div className="w-16 h-16 rounded-3xl bg-surface/90 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 z-10">{area.icon}</div>
                                    <span className="absolute top-6 right-8 text-[9px] font-bold text-primary/40 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">{area.count}</span>
                                </div>
                                <div className="p-10 flex flex-col flex-grow">
                                    <h3 className="font-headline font-bold text-2xl text-primary mb-4">{area.title}</h3>
                                    <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-6 flex-grow">{area.desc}</p>
                                    <div className="flex items-center text-xs font-bold text-secondary uppercase tracking-widest gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Read Deep Dive <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </motion.section>

            {/* 7. AI SPECIALIZED INSIGHTS */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-7xl mx-auto py-12 lg:py-16">
                <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-secondary/5 border border-secondary/10 mb-6">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-primary/60 uppercase">Navi AI Specialized Models</span>
                            </span>
                        </div>
                        <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">Deep Vedic <span className="text-secondary italic">Intelligence</span></h2>
                        <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-2xl w-fit border border-secondary/20">
                            <Sparkles className="w-4 h-4 text-secondary" />
                            <p className="text-primary font-bold text-sm">Experience precision across every domain of life with our dedicated AI engines.</p>
                        </div>
                    </div>
                    <Button href="/chat" variant="secondary" className="border-secondary/30 text-secondary px-8">Start AI Chat</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { name: "Marriage AI", exp: "5000+ Texts", rate: "Instant", special: "Compatibility, Timing", initial: "M" },
                        { name: "Career AI", exp: "Artha Shastra", rate: "Instant", special: "Success, Wealth", initial: "C" },
                        { name: "Health AI", exp: "Ayurvedic Logic", rate: "Instant", special: "Wellness, Vitality", initial: "H" },
                        { name: "Spiritual AI", exp: "Soul Purpose", rate: "Instant", special: "Karma, Moksha", initial: "S" }
                    ].map((guru, idx) => (
                        <Card key={idx} padding="none" className="group hover:border-secondary/40 transition-all duration-500 bg-surface overflow-hidden !rounded-[32px]">
                            <div className="h-40 bg-secondary/5 relative flex items-center justify-center">
                                <div className="absolute inset-0 bg-celestial-silk opacity-10" />
                                <div className="w-20 h-20 rounded-full bg-surface border-4 border-white shadow-xl flex items-center justify-center text-3xl font-headline font-bold text-secondary/40 group-hover:text-secondary group-hover:scale-110 transition-all duration-500">{guru.initial}</div>
                                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-1 bg-white/80 backdrop-blur-sm rounded-full border border-emerald-500/20">
                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] font-bold text-emerald-600 uppercase">Active</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="font-bold text-primary text-base mb-1">{guru.name}</h3>
                                <p className="text-[11px] text-on-surface-variant/60 mb-4">{guru.exp} • {guru.special}</p>
                                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                                    <div className="text-sm font-bold text-primary">{guru.rate}</div>
                                    <Link href="/chat" className="text-[11px] font-bold text-secondary uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">Ask Navi <ArrowRight className="w-3 h-3" /></Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </motion.section>

            {/* 8. HOW IT WORKS */}
            <motion.section id="how-it-works" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="py-12 lg:py-16 relative overflow-hidden bg-transparent">
                <div className="absolute inset-0 opacity-5 pointer-events-none">
                    <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 300C300 300 300 100 500 100C700 100 700 500 900 500C1100 500 1100 300 1300 300" stroke="var(--secondary)" strokeWidth="2" strokeDasharray="8 8" className="animate-[dash_20s_linear_infinite]" />
                    </svg>
                </div>
                <div className="max-w-7xl mx-auto px-4 text-center mb-20 relative z-10">
                    <div className="text-[10px] text-secondary font-bold tracking-[0.25em] uppercase mb-4">The Path to Clarity</div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline mb-4 text-primary">From Birth Moment to <span className="text-secondary italic">Cosmic Map</span></h2>
                </div>
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20 relative z-10 px-8">
                    {steps.map((step, index) => (
                        <div key={index} className={`flex flex-col items-center text-center group relative ${index === 1 ? 'md:translate-y-12' : ''}`}>
                            <div className="w-24 h-24 rounded-full border border-secondary/20 bg-surface flex items-center justify-center mb-8 relative shadow-xl group-hover:border-secondary group-hover:shadow-secondary/20 transition-all duration-500">
                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-surface border border-secondary/60 flex items-center justify-center text-secondary font-bold font-mono text-xs shadow-md z-20">
                                    0{index + 1}
                                </div>
                                <div className="absolute inset-0 rounded-full bg-secondary/0 group-hover:bg-secondary/5 transition-colors duration-500" />
                                <div className="transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 z-10">{step.icon}</div>
                            </div>
                            <h3 className="text-xl font-headline font-bold mb-4 text-primary">{step.title}</h3>
                            <p className="text-sm text-on-surface-variant/70 leading-relaxed max-w-[280px]">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* 9. PRICING / PLANS */}
            <Pricing />

            {/* 10. TRUST & FAQ */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="py-12 lg:py-16 relative bg-transparent px-4 lg:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <div className="text-[10px] text-secondary font-bold tracking-[0.25em] uppercase mb-4">Our Commitment</div>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-headline text-primary mb-12">Guarded by Tradition</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
                        {trustPoints.map((point, idx) => (
                            <Card key={idx} variant="bordered" padding="lg" className="flex flex-col items-center text-center relative overflow-hidden group">
                                <div className="absolute -right-8 -bottom-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 scale-150 rotate-12">
                                    {point.icon}
                                </div>
                                <div className="h-16 w-16 rounded-2xl bg-secondary/5 flex items-center justify-center mb-6 border border-secondary/10 group-hover:scale-110 transition-transform duration-500">{point.icon}</div>
                                <h3 className="text-xl font-headline font-bold text-primary mb-3">{point.title}</h3>
                                <p className="text-sm text-on-surface-variant/70 leading-relaxed">{point.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="max-w-4xl mx-auto mt-32" id="faq">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold font-headline mb-4 text-primary">Questions About Jyotish</h2>
                        <p className="text-on-surface-variant/60 text-sm">Everything you need to know about our authentic Vedic approach.</p>
                    </div>
                    <div className="space-y-4 mb-16">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="border border-outline-variant/30 rounded-3xl bg-surface overflow-hidden hover:border-secondary/30 transition-colors">
                                <button onClick={() => toggleFAQ(idx)} className="w-full flex justify-between items-center p-6 text-left group">
                                    <span className="font-headline font-semibold text-lg text-primary group-hover:text-secondary transition-colors">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-secondary transition-transform ${openFAQIndex === idx ? 'rotate-180' : ''}`} />
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
                    <div className="p-8 rounded-[40px] bg-secondary/5 border border-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white"><MessageSquare className="w-6 h-6" /></div>
                            <div className="text-center sm:text-left">
                                <h4 className="font-bold text-primary">Still have questions?</h4>
                                <p className="text-sm text-on-surface-variant/60">Ask Navi, our AI guide, anything about Jyotish.</p>
                            </div>
                        </div>
                        <Button href="/chat" variant="secondary" className="border-secondary/30 text-secondary px-8">Chat with Navi</Button>
                    </div>
                </div>
            </motion.section>

            {/* 11. FINAL CTA Section */}
            <section className="py-12 lg:py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary z-0" />
                <div className="absolute inset-0 opacity-10 bg-celestial-silk mix-blend-overlay" />
                <motion.div 
                    initial={{ opacity: 0.1, scale: 0.8 }}
                    animate={{ opacity: [0.2, 0.3, 0.2], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/20 blur-[150px] rounded-full"
                />
                
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <Sparkles className="w-12 h-12 text-secondary mx-auto mb-8 animate-pulse" />
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-white mb-8">Ready to Align with the <span className="text-secondary italic">Cosmos?</span></h2>
                    <p className="text-white/60 text-lg mb-12 max-w-2xl mx-auto">Join thousands who have discovered clarity through the ancient codes of Vedic astrology.</p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Button href="/chat" size="sm" className="gold-gradient shadow-2xl px-12 text-lg">Begin Your Journey</Button>
                        <Button href="/about" size="sm" variant="ghost" className="text-white hover:bg-white/5 border border-white/10 px-12 text-lg">Learn Our Method</Button>
                    </div>
                </div>
            </section>

        </div>
    );
}
