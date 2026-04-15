'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    Brain, ArrowLeft, Crown, DollarSign, Sparkles, 
    TrendingUp, Zap, Eye, ChevronRight, Info, 
    Scale, Activity, Lock, Target, Flame, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

const yogas = [
    {
        id: 'raja',
        nameEn: 'Raja Yoga',
        nameHi: 'राज योग',
        sanskrit: 'Raja Yoga',
        icon: <Crown className="w-8 h-8" />,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        represents: 'Power, authority, royal status, success in high positions, leadership.',
        classification: 'Kendra-Trikona Union',
        keyPlanet: '9th & 10th Lords',
        potency: 'High (Activated in Dasha)',
        logic: 'Union of Kendra (Action) & Trikona (Luck)',
        traits: ['Leadership', 'Fame', 'Status', 'Prosperity', 'Dharma'],
        deepDive: 'Raja Yoga is the ultimate combination for worldly success. It is formed when the lords of the angular houses (Kendra) meet the lords of the trinal houses (Trikona). This union blends effort with divine grace, leading to an elevated social position.'
    },
    {
        id: 'dhana',
        nameEn: 'Dhana Yoga',
        nameHi: 'धन योग',
        sanskrit: 'Dhana Yoga',
        icon: <DollarSign className="w-8 h-8" />,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        represents: 'Wealth accumulation, financial stability, material success, abundance.',
        classification: 'Wealth Union',
        keyPlanet: '2nd & 11th Lords',
        potency: 'Medium to High',
        logic: 'Connection between Earnings & Savings',
        traits: ['Wealth', 'Assets', 'Family', 'Income', 'Stability'],
        deepDive: 'Dhana Yoga focuses purely on material and financial gains. It occurs when the planets ruling the 2nd (wealth) and 11th (gains) houses form a relationship with the 5th or 9th houses. It indicates a strong capacity for earnings.'
    },
    {
        id: 'gajakesari',
        nameEn: 'Gajakesari',
        nameHi: 'गजकेसरी योग',
        sanskrit: 'Gajakesari Yoga',
        icon: <Sparkles className="w-8 h-8" />,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        represents: 'Wisdom, lasting reputation, eloquence, victory over enemies, intelligence.',
        classification: 'Jup-Moon Relation',
        keyPlanet: 'Jupiter & Moon',
        potency: 'High (if unafflicted)',
        logic: 'Jupiter in Kendra from Moon',
        traits: ['Wisdom', 'Eloquence', 'Fame', 'Courage', 'Virtue'],
        deepDive: 'Represented by the Elephant (Gaja) and the Lion (Kesari), this yoga brings together the wisdom of Jupiter and the mental strength of the Moon. It makes the native deeply respected and often leads to a life of abundance and intellectual brilliance.'
    },
    {
        id: 'mahapurusha',
        nameEn: 'Mahapurusha',
        nameHi: 'महापुरुष योग',
        sanskrit: 'Pancha Mahapurusha',
        icon: <TrendingUp className="w-8 h-8" />,
        color: 'text-purple-500',
        bgColor: 'bg-purple-500/10',
        represents: 'Extraordinary personality, specialized greatness, mastery in a field.',
        classification: 'Planetary Strength',
        keyPlanet: 'Non-Luminaries',
        potency: 'Very High',
        logic: 'Planet in Own/Exalt Sign in Kendra',
        traits: ['Greatness', 'Expertise', 'Body', 'Archetype', 'Impact'],
        deepDive: 'These five "Great Person" yogas are formed by Mars (Ruchaka), Mercury (Bhadra), Jupiter (Hamsa), Venus (Malavya), and Saturn (Shasha). When these planets are exceptionally strong in an angular house, they create an individual who embodies the highest virtues of that planet.'
    },
    {
        id: 'viparita',
        nameEn: 'Viparita Raja',
        nameHi: 'विपरीत राज योग',
        sanskrit: 'Viparita Raja Yoga',
        icon: <Zap className="w-8 h-8" />,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        represents: 'Success after crisis, power through reversal, benefit from loss of others.',
        classification: 'Dusthana Alchemy',
        keyPlanet: '6th, 8th, 12th Lords',
        potency: 'Contextual',
        logic: 'Negative Planets in Negative Houses',
        traits: ['Resilience', 'Reversal', 'Strategy', 'Breakthrough', 'Victory'],
        deepDive: 'A highly strategic yoga where the lords of the "difficult houses" are placed within other difficult houses. It signifies that the native will rise to power by overcoming immense obstacles or during times of general crisis. It is the "alchemical" yoga of Vedic astrology.'
    },
    {
        id: 'neechabhanga',
        nameEn: 'Neechabhanga',
        nameHi: 'नीचभंग राज योग',
        sanskrit: 'Neechabhanga Yoga',
        icon: <Target className="w-8 h-8" />,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10',
        represents: 'Cancellation of weakness, rise from humble beginnings, extraordinary resilience.',
        classification: 'Strength Reversal',
        keyPlanet: 'Debilitated Planet',
        potency: 'High (long term)',
        logic: 'Debilitation Cancelled by Lord',
        traits: ['Struggle', 'Ascent', 'Humility', 'Transformation', 'Mastery'],
        deepDive: 'This yoga occurs when a debilitated planet (at its weakest) has its weakness cancelled by the presence of a strong supporting planet. It often represents a "rags to riches" story where early life struggles fuel massive later success.'
    },
    {
        id: 'parivartana',
        nameEn: 'Exchange',
        nameHi: 'परिवर्तन योग',
        sanskrit: 'Parivartana Yoga',
        icon: <Activity className="w-8 h-8" />,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10',
        represents: 'Mutual support, intense relationship between life areas, blended fate.',
        classification: 'Mutual Exchange',
        keyPlanet: 'Any two lords',
        potency: 'Variable',
        logic: 'Lords in each other\'s houses',
        traits: ['Union', 'Intensity', 'Exchange', 'Cooperation', 'Bond'],
        deepDive: 'When two planets sit in each other\'s signs, they exchange their energies. This creates a powerful bond between the two houses involved. If involve auspicious houses (Kendra/Trikona), it becomes a Maha Parivartana Yoga, leading to great fortune.'
    }
];

export default function YogasPage() {
    const [selectedYoga, setSelectedYoga] = useState(yogas[0]);
    const router = useRouter();
    const isLoggedIn = false; // Placeholder

    return (
        <div className="min-h-screen bg-[var(--bg)] pt-20 pb-20 px-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[30%] h-[30%] bg-secondary/3 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1500px] mx-auto relative z-10">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <Link href="/blogs" className="inline-flex items-center gap-2 group">
                            <ArrowLeft className="w-4 h-4 text-secondary group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/60 group-hover:text-secondary transition-colors">Knowledge Center</span>
                        </Link>
                    </motion.div>
                    
                    <div className="text-right">
                        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Celestial <span className="text-secondary italic">Yogas</span></h1>
                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Sacred Planetary Unions</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Sidebar Navigation */}
                    <div className="w-full lg:w-[180px] shrink-0 sticky lg:top-24">
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-1 gap-3">
                            {yogas.map((yoga) => (
                                <button
                                    key={yoga.id}
                                    onClick={() => setSelectedYoga(yoga)}
                                    className={`relative p-4 rounded-[24px] transition-all duration-300 flex items-center lg:flex-row flex-col gap-3 group overflow-hidden ${
                                        selectedYoga.id === yoga.id 
                                        ? 'bg-secondary text-white shadow-xl shadow-secondary/20 scale-105' 
                                        : 'bg-surface/40 hover:bg-surface/80 text-foreground/60 border border-outline-variant/20'
                                    }`}
                                >
                                    <div className={`shrink-0 transition-transform duration-500 group-hover:scale-110 ${selectedYoga.id === yoga.id ? 'text-white' : yoga.color}`}>
                                        {yoga.icon}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] font-bold font-headline leading-none">{yoga.nameEn}</p>
                                        <p className={`text-[8px] uppercase tracking-widest mt-1 hidden lg:block ${selectedYoga.id === yoga.id ? 'text-white/60' : 'text-foreground/30'}`}>
                                            {yoga.nameHi}
                                        </p>
                                    </div>
                                    {selectedYoga.id === yoga.id && (
                                        <motion.div 
                                            layoutId="yoga-active"
                                            className="absolute inset-0 bg-white/10 pointer-events-none"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="flex-1 w-full min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedYoga.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Main Yoga Card */}
                                <Card padding="none" className="!rounded-[28px] border border-outline-variant/30 bg-surface/50 backdrop-blur-sm overflow-hidden">
                                    <div className="p-7 sm:p-8">
                                        {/* Hero Header — Horizontal */}
                                        <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-outline-variant/20">
                                            <div className="relative group shrink-0">
                                                <div className={`absolute inset-0 ${selectedYoga.bgColor} blur-[60px] rounded-full opacity-60`}></div>
                                                <div className={`w-24 h-24 lg:w-32 lg:h-32 rounded-[32px] ${selectedYoga.bgColor} border border-current/10 flex items-center justify-center ${selectedYoga.color} relative z-10 transition-transform duration-500 hover:scale-105 shadow-inner`}>
                                                    {selectedYoga.icon}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 text-center md:text-left">
                                                <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-4 mb-3">
                                                    <h2 className="text-4xl lg:text-5xl font-headline font-bold text-foreground">
                                                        {selectedYoga.nameEn}
                                                    </h2>
                                                    <span className="text-xl lg:text-2xl text-secondary font-headline italic">— {selectedYoga.sanskrit}</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Core Logic</p>
                                                        <p className="text-sm font-bold text-secondary">{selectedYoga.logic.split(' ')[0]}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Potency</p>
                                                        <p className="text-sm font-bold text-foreground/80">{selectedYoga.potency}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Classification</p>
                                                        <p className="text-sm font-bold text-secondary break-words">{selectedYoga.classification.split(' ')[0]}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Hindi</p>
                                                        <p className="text-sm font-bold text-foreground italic">{selectedYoga.nameHi}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Grid */}
                                        <div className="grid md:grid-cols-2 gap-8">
                                            {/* Left Column */}
                                            <div className="flex flex-col gap-6">
                                                <div>
                                                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] mb-4 flex items-center gap-1.5">
                                                        <Info className="w-3.5 h-3.5" />
                                                        Formation Theory
                                                    </h3>
                                                    <p className="text-[15px] text-foreground leading-[1.8] font-light italic border-l-2 border-secondary/20 pl-4">
                                                        {selectedYoga.deepDive}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] mb-4 flex items-center gap-1.5">
                                                        <Activity className="w-3.5 h-3.5" />
                                                        Manifestations
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedYoga.traits.map((trait, idx) => (
                                                            <span key={idx} className="px-3.5 py-2 rounded-xl bg-secondary/8 border border-outline-variant/30 text-[11px] font-bold text-foreground hover:bg-secondary hover:text-white transition-all cursor-default">
                                                                {trait}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="p-5 rounded-2xl bg-surface/60 border border-outline-variant/20">
                                                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] mb-3">Mathematical Logic</h4>
                                                    <p className="text-xs font-bold text-foreground/90 leading-relaxed italic uppercase tracking-wider">
                                                        {selectedYoga.logic}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-5">
                                                {/* Governance Section */}
                                                <div className="p-5 rounded-2xl bg-secondary/5 border border-outline-variant/30 relative overflow-hidden group/card">
                                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                                        <Flame className="w-12 h-12 text-secondary" />
                                                    </div>
                                                    <h4 className="text-[11px] font-bold text-foreground mb-3 uppercase tracking-wider">Planetary Governance</h4>
                                                    <p className="text-[13px] text-foreground font-medium leading-[1.7]">
                                                        {selectedYoga.represents}
                                                    </p>
                                                </div>

                                                {/* Theory Card */}
                                                <div className="p-5 rounded-2xl bg-surface/60 border border-outline-variant/20">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                                                        <h4 className="text-[11px] font-bold text-secondary uppercase tracking-widest">Theoretical Breakdown</h4>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
                                                            <span className="text-[10px] text-foreground/50 uppercase font-bold">Category</span>
                                                            <span className="text-xs font-bold text-foreground italic">{selectedYoga.classification}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] text-foreground/50 uppercase font-bold">Activation Path</span>
                                                            <span className="text-xs font-bold text-foreground italic">Dasha/Bhukti</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Key Entities */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-2xl bg-secondary/5 border border-outline-variant/20">
                                                        <p className="text-[9px] text-foreground/40 uppercase font-bold mb-1">Key Planets</p>
                                                        <p className="text-xs font-bold text-secondary uppercase">{selectedYoga.keyPlanet}</p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-secondary/5 border border-outline-variant/20">
                                                        <p className="text-[9px] text-foreground/40 uppercase font-bold mb-1">Impact Scale</p>
                                                        <p className="text-xs font-bold text-foreground uppercase">{selectedYoga.potency}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Integrated Footer: Personalized Insight */}
                                        <div className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl ${selectedYoga.bgColor} flex items-center justify-center border border-current/10 ${selectedYoga.color}`}>
                                                    <Scale className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-[13px] font-headline font-bold text-foreground">Yoga Scan</h3>
                                                    <p className="text-[9px] text-foreground/40 tracking-wider uppercase font-bold">Discover hidden combinations in your chart</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => router.push('/chat')}
                                                className="!px-6 !py-2 !rounded-xl !bg-secondary !text-white !font-extrabold !border-none hover:!scale-105 active:!scale-95 !min-h-0 flex items-center gap-2 group/btn w-full sm:w-auto justify-center"
                                            >
                                                {isLoggedIn ? (
                                                    <><span className="text-[11px]">View My Yogas</span> <ChevronRight className="w-4 h-4" /></>
                                                ) : (
                                                    <><Lock className="w-3.5 h-3.5" /> <span className="text-[11px]">Analyze Alignments</span></>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <div className="mt-12 text-center text-[10px] text-foreground/20 font-bold tracking-[0.4em] uppercase">
                    <p>Verified Yoga Theory · AstraNavi Advanced Analytics</p>
                </div>
            </div>
        </div>
    );
}
