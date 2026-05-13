'use client';

import React, { useState, useMemo } from 'react';
import { 
    Sparkles, Calendar, 
    Clock, MapPin, Heart, Briefcase, 
    Compass, Network, Star, Zap, Home as HomeIcon, Lock, CheckCircle, Shield, Brain, Gem, Sun
} from 'lucide-react';
import HeroSection from './HeroSection';
import ZodiacStrip from './ZodiacStrip';
import PortalsSection from './PortalsSection';
import KnowledgeSection from './KnowledgeSection';
import HowItWorksSection from './HowItWorksSection';
import TrustAndFAQSection from './TrustAndFAQSection';
import FinalCtaSection from './FinalCtaSection';
// Pricing is on its own /plans page
import { faqs } from "@/data/faqs";
import { useTranslation } from '@/hooks';

// Navigation functions to handle translations
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
    const { t } = useTranslation();
    const [activeSlide, setActiveSlide] = useState(0);
    const [_interactionTick, setInteractionTick] = useState(0);
    const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);

    // Memoized Data
    const slides = useMemo(() => getSlides(t), [t]);
    const services = useMemo(() => getServices(t), [t]);
    const knowledgeAreas = useMemo(() => getKnowledgeAreas(t), [t]);
    const steps = useMemo(() => getSteps(t), [t]);
    const trustPoints = useMemo(() => getTrustPoints(t), [t]);
    const translatedFaqs = useMemo(() => {
        const rawFaqs = t('faqs');
        if (Array.isArray(rawFaqs)) {
            return (rawFaqs as {q: string, a: string}[]).map(f => ({ question: f.q, answer: f.a }));
        }
        return faqs; // Fallback to hardcoded faqs if something is wrong
    }, [t]);

    const toggleFAQ = (index: number) => {
        setOpenFAQIndex(openFAQIndex === index ? null : index);
    };

    const sectionVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
    };

    return (
        <div className="flex flex-col w-full bg-transparent pb-20">
            {/* 1. HERO SECTION */}
            <HeroSection 
                slides={slides} 
                activeSlide={activeSlide} 
                setActiveSlide={setActiveSlide} 
                setInteractionTick={setInteractionTick} 
                t={t} 
            />

            {/* 3. ZODIAC STRIP */}
            <ZodiacStrip />

            {/* 4. MAIN CONTENT BELOW ZODIAC */}
            <PortalsSection t={t} sectionVariants={sectionVariants} />

            {/* 5. 50/50 SPLIT: Ancient Wisdom + Cosmic Archive */}
            <KnowledgeSection 
                t={t} 
                services={services} 
                knowledgeAreas={knowledgeAreas} 
                sectionVariants={sectionVariants} 
            />

            {/* 8. HOW IT WORKS */}
            <HowItWorksSection 
                t={t} 
                steps={steps} 
                sectionVariants={sectionVariants} 
            />

            {/* 10. TRUST & FAQ */}
            <TrustAndFAQSection 
                t={t} 
                trustPoints={trustPoints} 
                translatedFaqs={translatedFaqs} 
                openFAQIndex={openFAQIndex} 
                toggleFAQ={toggleFAQ} 
                sectionVariants={sectionVariants} 
            />

            {/* 11. FINAL CTA Section */}
            <FinalCtaSection t={t} />
        </div>
    );
}
