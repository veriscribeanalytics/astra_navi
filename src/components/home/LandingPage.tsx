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
        tag: "AstraNavi Mobile • Pocket Jyotish",
        title: <>The Universe <br/><span className="text-secondary italic">In Your Pocket</span></>,
        desc: "Download the AstraNavi App for real-time transit alerts, daily widgets, and direct connection to live gurus wherever you go.",
        stats: [{ v: "iOS/Android", l: "Support" }, { v: "Smart", l: "Widgets" }, { v: "Push", l: "Alerts" }]
    },
    {
        tag: "Guided Consultation • AI & Human",
        title: <>Expertise <br/><span className="text-secondary italic">Beyond Boundaries</span></>,
        desc: "Consult Navi, our 24/7 AI guide, or connect with verified Vedic Gurus. Precision guidance for marriage, career, and spiritual growth.",
        stats: [{ v: "AI Navi", l: "Instant" }, { v: "10+ Gurus", l: "Verified" }, { v: "Sacred", l: "Privacy" }]
    },
    {
        tag: "Jyotish Shastra • 5,000 Year Wisdom",
        title: <>The Cosmos Spoke<br/>At Your <span className="text-secondary italic">Birth</span></>,
        desc: "Revealing your complete Kundli—soul's journey, karmic patterns, and the precise timing of life's major events since the Vedic age.",
        stats: [{ v: "Authentic", l: "Calculations" }, { v: "16 Varga", l: "Charts" }, { v: "Sacred", l: "Privacy" }]
    },
    {
        tag: "Soul Journey • Personalized Flow",
        title: <>Align With <br/><span className="text-secondary italic">Your Soul Purpose</span></>,
        desc: "Beyond generic predictions. Get daily personalized horoscopes that track your specific Nakshatra transits and spiritual energy.",
        stats: [{ v: "Daily", l: "Insights" }, { v: "Nakshatra", l: "Based" }, { v: "Soul", l: "Alignment" }]
    }
];

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function LandingPage() {
    const router = useRouter();
    const [activeSlide, setActiveSlide] = useState(0);
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
        }, 6000);
        return () => clearInterval(timer);
    }, []);

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
            <section className="relative h-[650px] lg:h-[750px] flex items-center px-4 sm:px-6 md:px-8 lg:px-12 overflow-hidden border-b border-outline-variant/10">
                <motion.div 
                    initial={{ opacity: 0.1, scale: 0.8 }}
                    animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[-10%] right-[-10%] w-[250px] lg:w-[600px] h-[250px] lg:h-[600px] bg-[var(--glow-color)] blur-[100px] rounded-full -z-10 opacity-30 dark:opacity-60"
                ></motion.div>
                
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
                    
                    {/* Left: Rotating Text Content - Fixed Height Container */}
                    <div className="relative h-[450px] flex flex-col justify-center text-center lg:text-left">
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={activeSlide}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="space-y-4 sm:space-y-6 absolute inset-0 flex flex-col justify-center"
                            >
                                <div className="inline-flex w-fit mx-auto lg:mx-0 items-center space-x-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/30">
                                    <Sparkles className="text-secondary w-3.5 h-3.5" />
                                    <span className="text-[12px] sm:text-[13px] uppercase tracking-[0.15em] font-bold text-secondary font-body">
                                        {slides[activeSlide].tag}
                                    </span>
                                </div>
                                
                                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-bold text-primary leading-[1.1]">
                                    {slides[activeSlide].title}
                                </h1>
                                
                                <p className="text-base sm:text-lg md:text-xl text-on-surface-variant max-w-xl leading-relaxed font-normal font-body mx-auto lg:mx-0">
                                    {slides[activeSlide].desc}
                                </p>
                                
                                {activeSlide === 1 && (
                                    <div className="pt-2">
                                        <Button href="/chat?mode=guest" size="lg" className="gold-gradient shadow-xl px-10">Start 5-Min Guest Chat</Button>
                                    </div>
                                )}
                                
                                <div className="flex flex-wrap justify-center lg:justify-start gap-6 sm:gap-10 pt-4">
                                    {slides[activeSlide].stats.map((stat, idx) => (
                                        <div key={idx} className="flex flex-col">
                                            <div className="text-xl sm:text-2xl font-bold text-secondary font-body">{stat.v}</div>
                                            <div className="text-[11px] sm:text-[12px] uppercase tracking-[0.2em] text-on-surface-variant/60 font-bold font-body">{stat.l}</div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Right: Rotating Visuals / Mockups - Fixed Height Container */}
                    <div className="relative h-[450px] lg:h-[500px] w-full flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            {activeSlide === 0 && (
                                <motion.div 
                                    key="visual-app"
                                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                    exit={{ opacity: 0, scale: 1.1, rotate: 10 }}
                                    transition={{ duration: 0.6 }}
                                    className="relative w-[280px] h-[520px] bg-[#0b071a] rounded-[40px] border-[8px] border-outline-variant/30 shadow-[0_0_50px_rgba(200,136,10,0.2)] overflow-hidden absolute"
                                >
                                    <div className="absolute top-0 w-full h-6 bg-transparent flex justify-center items-end pb-1"><div className="w-16 h-1 rounded-full bg-white/20"></div></div>
                                    <div className="p-6 pt-10 space-y-6">
                                        <div className="h-40 w-full rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-secondary text-xs font-bold uppercase tracking-widest mb-1">Transit</div>
                                                <div className="text-white font-headline text-xl">Jupiter in Taurus</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-20 rounded-xl bg-white/5 border border-white/10"></div>
                                            <div className="h-20 rounded-xl bg-white/5 border border-white/10"></div>
                                        </div>
                                        <div className="h-32 w-full rounded-2xl bg-gradient-to-br from-secondary/20 to-transparent border border-secondary/10"></div>
                                    </div>
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-secondary flex items-center justify-center shadow-lg shadow-secondary/50"><Sparkles className="text-white w-6 h-6" /></div>
                                </motion.div>
                            )}
                            
                            {activeSlide === 1 && (
                                <motion.div 
                                    key="visual-consult"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    transition={{ duration: 0.6 }}
                                    className="relative grid grid-cols-2 gap-4 w-full max-w-[440px] absolute"
                                >
                                    {[1,2,3,4].map((i) => (
                                        <div key={i} className="bg-surface p-4 rounded-[24px] border border-secondary/20 shadow-lg flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-secondary/10 border-2 border-secondary/30 overflow-hidden relative">
                                                <Image src="/icons/logo.jpeg" alt="Guru" fill className="object-cover grayscale group-hover:grayscale-0 transition-all" />
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-primary">Guru Dev {i}</div>
                                                <div className="text-[9px] text-emerald-500 font-bold uppercase">Online</div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent flex items-end justify-center pb-4">
                                        <Button href="/astrologers" size="sm" className="gold-gradient shadow-xl">Talk for FREE</Button>
                                    </div>
                                </motion.div>
                            )}

                            {activeSlide === 2 && (
                                <motion.div 
                                    key="visual-kundli"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.1 }}
                                    transition={{ duration: 0.6 }}
                                    className="w-[300px] h-[300px] lg:w-[400px] lg:h-[400px] absolute"
                                >
                                    <div className="absolute inset-0 border border-secondary/30 rounded-full animate-spin-slow" style={{ animationDuration: '40s' }} />
                                    <div className="absolute inset-4 border border-secondary/20 rounded-full animate-spin-slow" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />
                                    <div className="absolute inset-0 flex items-center justify-center text-secondary/40">
                                        <div className="w-32 h-32 rotate-45 border border-secondary/40 flex items-center justify-center">
                                            <div className="w-full h-full border border-secondary/40 rotate-45 flex items-center justify-center">
                                                 <Star className="w-8 h-8 text-secondary animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute -top-4 -right-4 bg-surface p-4 rounded-2xl shadow-xl border border-secondary/20">
                                        <div className="text-[10px] font-bold text-secondary uppercase">Ascendant</div>
                                        <div className="text-xl font-bold text-primary">Taurus</div>
                                    </div>
                                </motion.div>
                            )}

                            {activeSlide === 3 && (
                                <motion.div 
                                    key="visual-soul"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.6 }}
                                    className="w-full max-w-[360px] bg-surface rounded-[32px] border border-outline-variant/30 shadow-2xl p-8 absolute"
                                >
                                    <div className="text-center mb-6">
                                        <div className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mb-1">Energy Alignment</div>
                                        <div className="text-3xl font-bold text-primary italic">94%</div>
                                    </div>
                                    <div className="space-y-5">
                                        {[
                                            { l: 'Intuition', v: 92, c: 'bg-indigo-400' },
                                            { l: 'Vitality', v: 78, c: 'bg-orange-400' },
                                            { l: 'Harmony', v: 88, c: 'bg-emerald-400' }
                                        ].map((s, i) => (
                                            <div key={i} className="space-y-1.5">
                                                <div className="flex justify-between text-[9px] font-bold uppercase text-on-surface-variant/50">
                                                    <span>{s.l}</span>
                                                    <span>{s.v}%</span>
                                                </div>
                                                <div className="h-1 bg-surface-variant/20 rounded-full overflow-hidden">
                                                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.v}%` }} transition={{ duration: 1, delay: i*0.1 }} className={`h-full ${s.c}`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Centered Slide Indicators - Correctly placed at the absolute bottom of Hero */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex justify-center gap-2 z-30">
                    {slides.map((_, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setActiveSlide(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${activeSlide === idx ? 'w-8 bg-secondary shadow-[0_0_8px_rgba(212,175,55,0.4)]' : 'w-2 bg-secondary/20 hover:bg-secondary/40'}`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </section>
            
            {/* 2. ZODIAC STRIP */}
            <section className="bg-surface relative overflow-hidden h-[60px] sm:h-[72px] flex items-center w-full z-20 border-b border-outline-variant/20 -mt-2">
                <LogoLoop
                    logos={logoItems}
                    speed={20}
                    direction="right"
                    logoHeight={40}
                    gap={40}
                    hoverSpeed={-2}
                    fadeOut
                    fadeOutColor="hsl(var(--surface))"
                />
            </section>

            {/* 3. INTERACTIVE PORTALS (Kundli, Match, Horoscope Forms) */}
            <motion.section 
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}
                className="max-w-[1500px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 lg:py-24"
            >
                <div className="text-center mb-12">
                    <div className="text-[12px] font-bold tracking-[0.25em] text-secondary uppercase mb-3">Your Cosmic Journey</div>
                    <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">Start Exploring Now</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
                    
                    {/* Birth Chart Form / Teaser */}
                    <Card className="border-secondary/30 flex flex-col shadow-xl shadow-secondary/5 h-[500px] relative overflow-hidden" padding="lg">
                        <AnimatePresence mode="wait">
                            {isCalculating && teaserMode.type === 'kundli' ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full space-y-4">
                                    <div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-secondary animate-pulse uppercase tracking-widest">Mapping Your Destiny...</p>
                                </motion.div>
                            ) : teaserMode.type === 'kundli' ? (
                                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col">
                                    <h3 className="text-xl font-headline font-bold text-primary mb-4">Insight for {formData.name}</h3>
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

                    {/* Horoscope Portal */}
                    <Card className="border-outline-variant/30 flex flex-col shadow-xl h-[500px]" padding="none">
                        <div className="p-6 border-b border-outline-variant/20 bg-surface">
                            <h3 className="text-xl font-headline font-bold flex items-center gap-2 text-primary">
                                <Sparkles className="text-secondary w-5 h-5" /> Today's Detail
                            </h3>
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

                    {/* Compatibility Portal */}
                    <Card className="border-outline-variant/30 flex flex-col shadow-xl relative overflow-hidden h-[500px]" padding="lg">
                        <AnimatePresence mode="wait">
                            {isCalculating && teaserMode.type === 'match' ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full space-y-4">
                                    <div className="w-16 h-16 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                                    <p className="text-sm font-bold text-rose-500 animate-pulse uppercase tracking-widest">Scanning Soul Sync...</p>
                                </motion.div>
                            ) : teaserMode.type === 'match' ? (
                                <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
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

            {/* 4. SERVICES BENTO GRID */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-7xl mx-auto py-12 lg:py-20 relative">
                <div className="absolute inset-0 bg-celestial-silk opacity-10 pointer-events-none rounded-[40px]" />
                <div className="text-center mb-12 relative z-10">
                    <div className="text-[12px] font-bold tracking-[0.25em] text-secondary uppercase mb-3">The Jyotish Toolkit</div>
                    <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-4">Ancient Wisdom, <span className="text-secondary italic">Modern Detail</span></h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {services.map((svc, idx) => (
                        <motion.div key={idx} whileHover={{ y: -5 }} className={`group relative p-8 rounded-[32px] border transition-all duration-500 flex flex-col h-full ${svc.available ? 'bg-surface border-outline-variant/30 hover:border-secondary/50 hover:shadow-2xl hover:shadow-secondary/5' : 'bg-surface/40 border-outline-variant/10 grayscale opacity-70'}`}>
                            <div className="flex justify-between items-start mb-8">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${svc.iconBg} shadow-inner`}>{svc.icon}</div>
                                <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${svc.available ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-on-surface-variant/10 text-on-surface-variant/40'}`}>{svc.badge}</span>
                            </div>
                            <h3 className="font-headline font-bold text-xl text-primary mb-3">{svc.title}</h3>
                            <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-8 flex-grow">{svc.desc}</p>
                            <div className="pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-widest text-secondary/60">{svc.detail}</span>
                                <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary group-hover:text-white transition-colors duration-300">
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.section>

            {/* 5. CELESTIAL KNOWLEDGE */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-7xl mx-auto py-12 lg:py-20">
                <div className="flex flex-col lg:flex-row justify-between items-end gap-6 mb-12">
                    <div className="max-w-2xl">
                        <div className="text-[12px] font-bold tracking-[0.25em] text-secondary uppercase mb-3">The Cosmic Archive</div>
                        <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-4">Master the <span className="text-secondary italic">Ancient Codes</span></h2>
                    </div>
                    <Link href="/blogs" className="group flex items-center gap-3 px-6 py-3 rounded-2xl bg-surface border border-outline-variant/30 hover:border-secondary transition-all">
                        <span className="text-sm font-bold uppercase tracking-widest text-primary">Library</span>
                        <ArrowRight className="w-4 h-4 text-secondary group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {knowledgeAreas.map((area, idx) => (
                        <Link key={idx} href={area.link} className="group">
                            <Card padding="none" className="h-full !rounded-[40px] border-outline-variant/20 hover:border-secondary/30 transition-all duration-500 overflow-hidden bg-surface flex flex-col">
                                <div className={`h-2 bg-gradient-to-r ${area.color}`} />
                                <div className="p-8 flex flex-col flex-grow">
                                    <div className="w-12 h-12 rounded-2xl bg-surface-variant/20 flex items-center justify-center mb-6 shadow-inner">{area.icon}</div>
                                    <h3 className="font-headline font-bold text-2xl text-primary mb-3">{area.title}</h3>
                                    <p className="text-sm text-on-surface-variant/70 leading-relaxed mb-6 flex-grow">{area.desc}</p>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </motion.section>

            {/* 6. LIVE ASTROLOGER DIRECTORY */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-7xl mx-auto py-12 lg:py-20">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <div className="max-w-2xl">
                        <div className="text-[12px] font-bold tracking-[0.25em] text-secondary uppercase mb-3">Certified Gurus</div>
                        <h2 className="font-headline text-3xl sm:text-4xl font-bold text-primary mb-4">Talk to <span className="text-secondary italic">Verified Experts</span></h2>
                        <p className="text-on-surface-variant/60 text-sm">Consult India's top Vedic practitioners. First 5 minutes are complimentary for your first consultation.</p>
                    </div>
                    <Button href="/astrologers" variant="secondary" className="border-secondary/30 text-secondary">View All 10+ Gurus</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { name: "Acharya Vashist", exp: 18, rate: 25, special: "Vedic, Vastu" },
                        { name: "Guru Maa Anandi", exp: 22, rate: 40, special: "Healing, KP" },
                        { name: "Pandit Rahul", exp: 12, rate: 15, special: "Marriage, Career" },
                        { name: "Acharya Meenakshi", exp: 14, rate: 18, special: "Numerology" }
                    ].map((guru, idx) => (
                        <Card key={idx} padding="none" className="group hover:border-secondary/40 transition-all duration-500 bg-surface overflow-hidden">
                            <div className="h-32 bg-secondary/5 relative">
                                <Image src="/icons/logo.jpeg" alt={guru.name} fill className="object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all" />
                                <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-primary text-sm mb-1">{guru.name}</h3>
                                <p className="text-[10px] text-on-surface-variant/60 mb-3">{guru.exp} Years Exp • {guru.special}</p>
                                <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                                    <div className="text-[11px] font-bold text-primary">₹{guru.rate}<span className="text-[9px] opacity-40">/min</span></div>
                                    <Link href="/login" className="text-[10px] font-bold text-secondary uppercase tracking-widest hover:underline">Consult Expert</Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </motion.section>

            {/* 7. HOW IT WORKS */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="py-12 relative overflow-hidden bg-transparent mx-4 sm:mx-6 md:mx-8 lg:mx-12">
                <div className="max-w-7xl mx-auto text-center mb-10">
                    <div className="text-[10px] text-secondary font-bold tracking-[0.12em] uppercase mb-4">How It Works</div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline mb-3 text-primary">From Birth Moment to <span className="text-secondary">Cosmic Map</span></h2>
                </div>
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center text-center group">
                            <div className="w-20 h-20 rounded-full border border-secondary/20 bg-surface flex items-center justify-center mb-5 relative shadow-lg group-hover:border-secondary transition-all">
                                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-surface border border-secondary/60 flex items-center justify-center text-secondary font-bold font-mono text-xs shadow-sm">
                                    0{index + 1}
                                </div>
                                <div className="transform group-hover:scale-110 transition-transform duration-500">{step.icon}</div>
                            </div>
                            <h3 className="text-lg font-headline font-semibold mb-3 text-primary">{step.title}</h3>
                            <p className="text-sm text-on-surface-variant leading-relaxed max-w-[280px]">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* 7. PRICING / PLANS */}
            <Pricing />

            {/* 8. TRUST & FAQ */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="py-16 relative bg-transparent px-4 lg:px-12 max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <div className="text-[10px] text-secondary font-bold tracking-[0.12em] uppercase mb-4">Our Commitment</div>
                    <h2 className="text-3xl font-headline font-bold text-primary mb-8">Guarded by Tradition</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {trustPoints.map((point, idx) => (
                            <Card key={idx} variant="bordered" padding="md" className="flex flex-col items-center text-center">
                                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">{point.icon}</div>
                                <h3 className="text-lg font-headline font-bold text-primary mb-2">{point.title}</h3>
                                <p className="text-sm text-on-surface-variant">{point.desc}</p>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="max-w-3xl mx-auto mt-20" id="faq">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold font-headline mb-3 text-primary">Questions About Jyotish</h2>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="border border-outline-variant/30 rounded-2xl bg-surface overflow-hidden">
                                <button onClick={() => toggleFAQ(idx)} className="w-full flex justify-between items-center p-4 text-left">
                                    <span className="font-headline font-semibold text-lg text-primary">{faq.question}</span>
                                    <ChevronDown className={`w-5 h-5 text-secondary transition-transform ${openFAQIndex === idx ? 'rotate-180' : ''}`} />
                                </button>
                                <div className={`transition-all overflow-hidden ${openFAQIndex === idx ? 'max-h-[500px] pb-4 px-4' : 'max-h-0'}`}>
                                    <p className="text-on-surface-variant text-sm">{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.section>

        </div>
    );
}
