'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    Brain, ArrowLeft, Crown, DollarSign, Sparkles, 
    TrendingUp, Zap, Eye, ChevronRight, Info, 
    Scale, Activity, Lock, Target, Flame, Star, Dna, Shield, BookOpen,
    CheckCircle2, AlertCircle
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
    const [viewMode, setViewMode] = useState<'encyclopedia' | 'detail'>('encyclopedia');
    const router = useRouter();

    return (
        <div className="min-h-screen bg-[var(--bg)] pt-20 pb-20 px-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-secondary/3 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1500px] mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <Link href="/blogs" className="inline-flex items-center gap-2 group">
                            <ArrowLeft className="w-4 h-4 text-secondary group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/60 group-hover:text-secondary transition-colors">Knowledge Center</span>
                        </Link>
                    </motion.div>
                    
                    <div className="text-right">
                        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Planetary <span className="text-secondary italic">Yogas</span></h1>
                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Sacred Cosmic Unions</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Navigation Sidebar */}
                    <div className="w-full lg:w-[240px] shrink-0 sticky lg:top-24 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <button
                            onClick={() => setViewMode('encyclopedia')}
                            className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-xl border transition-all duration-300 text-left mb-3 ${viewMode === 'encyclopedia'
                                    ? 'border-secondary bg-secondary/10'
                                    : 'border-transparent hover:bg-surface'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${viewMode === 'encyclopedia' ? 'bg-secondary/20' : 'bg-surface border border-outline-variant/20'}`}>
                                <BookOpen className={`w-4 h-4 ${viewMode === 'encyclopedia' ? 'text-secondary' : 'text-foreground/50'}`} />
                            </div>
                            <div>
                                <h3 className={`text-sm font-bold ${viewMode === 'encyclopedia' ? 'text-secondary' : 'text-foreground/70'}`}>Encyclopedia</h3>
                                <p className="text-[9px] text-foreground/40 mt-0.5 uppercase tracking-widest">Introduction</p>
                            </div>
                        </button>
                        
                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30 px-2 mb-2">Sacred Unions</div>
                        <div className="grid grid-cols-6 lg:grid-cols-2 gap-1.5 sm:gap-2">
                            {yogas.map((yoga) => {
                                const isActive = viewMode === 'detail' && selectedYoga.id === yoga.id;
                                return (
                                    <button
                                        key={yoga.id}
                                        onClick={() => {
                                            setSelectedYoga(yoga);
                                            setViewMode('detail');
                                        }}
                                        className={`group flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all duration-200 ${isActive
                                                ? 'border-secondary bg-secondary/5'
                                                : 'border-transparent hover:bg-surface'
                                            }`}
                                    >
                                        <div className={`transition-transform duration-300 [&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-8 sm:[&>svg]:h-8 ${isActive ? 'scale-110 text-secondary' : `opacity-70 group-hover:opacity-100 group-hover:scale-110 ${yoga.color}`}`}>
                                            {yoga.icon}
                                        </div>
                                        <p className={`text-[10px] font-bold mt-1.5 truncate w-full text-center ${isActive ? 'text-secondary' : 'text-foreground/50'}`}>
                                            {yoga.nameEn}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="flex-1 w-full min-w-0">
                        <AnimatePresence mode="wait">
                            {viewMode === 'encyclopedia' && (
                                <motion.div
                                    key="encyclopedia"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <Card padding="md" className="!rounded-[32px] border border-outline-variant/30 bg-surface overflow-hidden" hoverable={false}>
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-outline-variant/20 text-foreground/60 text-[10px] font-bold tracking-[0.25em] uppercase mb-3 w-fit">
                                            <BookOpen className="w-3 h-3" /> Core Concepts
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-2">
                                            Understanding <span className="text-secondary italic">Yogas</span>
                                        </h2>
                                        <p className="text-sm sm:text-base text-foreground/70 leading-relaxed max-w-3xl mb-6">
                                            In Vedic Astrology, a "Yoga" means union. It refers to specific planetary combinations and alignments that lock together to create powerful, destined effects. These cosmic signatures dictate the heights of wealth, power, and spiritual liberation in a chart.
                                        </p>

                                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 flex-grow">
                                            {/* Column 1 */}
                                            <div className="space-y-6">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                        <Activity className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground mb-1">Raja Yogas</h4>
                                                        <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                            The kings of combinations. Formed when the lords of Kendra (action) houses unite with lords of Trikona (luck) houses. They guarantee status, authority, and massive success when activated.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                        <Dna className="w-5 h-5 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground mb-1">Dhana Yogas</h4>
                                                        <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                            Combinations for absolute wealth. When the houses of earnings (2nd) and gains (11th) connect deeply with the houses of destiny (5th, 9th), the native is destined for immense financial prosperity.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 2 */}
                                            <div className="space-y-6">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                        <Zap className="w-5 h-5 text-rose-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground mb-1">Activation (Dashas)</h4>
                                                        <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                            Yogas lie dormant in a chart until their planetary lords are activated by the Vimshottari Dasha (time period). When the dasha of a Yoga-causing planet begins, the effects manifest drastically in reality.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                        <Shield className="w-5 h-5 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground mb-1">Cancellation (Bhanga)</h4>
                                                        <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                            Not all bad yogas are permanent. Neechabhanga occurs when a debilitated (weak) planet is supported by strong alignments, cancelling the weakness and often turning massive struggle into great success.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )}

                            {viewMode === 'detail' && (
                                <motion.div
                                    key={selectedYoga.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Card padding="none" className="!rounded-[32px] border border-outline-variant/30 bg-surface overflow-hidden">
                                    <div className="p-8 sm:p-12">
                                        <div className="flex flex-col md:flex-row items-center gap-10 mb-10 pb-10 border-b border-outline-variant/10">
                                            <div className="relative">
                                                <div className="absolute inset-[-20px] bg-secondary/10 blur-[40px] rounded-full opacity-60"></div>
                                                <div className="w-40 h-40 rounded-[48px] bg-surface border border-secondary/20 flex items-center justify-center text-secondary relative z-10 shadow-xl overflow-hidden group">
                                                    <div className="transition-transform duration-700 group-hover:scale-110">
                                                        {selectedYoga.icon}
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-secondary/10 py-1 text-[10px] font-bold text-center uppercase tracking-widest">{selectedYoga.sanskrit}</div>
                                                </div>
                                            </div>

                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-4 mb-4">
                                                    <h2 className="text-6xl font-headline font-bold text-foreground">{selectedYoga.nameEn}</h2>
                                                    <span className="text-3xl text-secondary font-headline italic">— {selectedYoga.nameHi}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Logic</p>
                                                        <p className="text-base font-bold text-secondary">{selectedYoga.logic.split(' ')[0]}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Potency</p>
                                                        <p className="text-base font-bold text-foreground/80">{selectedYoga.potency}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Class</p>
                                                        <p className="text-base font-bold text-foreground/80">{selectedYoga.classification.split(' ')[0]}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Key Planets</p>
                                                        <p className="text-base font-bold text-secondary">{selectedYoga.keyPlanet}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-12">
                                            <div className="space-y-8">
                                                <div>
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                        <Dna className="w-4 h-4" />
                                                        Formation Theory
                                                    </h3>
                                                    <p className="text-lg text-foreground/90 leading-relaxed font-light italic border-l-2 border-secondary/20 pl-6">
                                                        &quot;{selectedYoga.deepDive}&quot;
                                                    </p>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-surface border border-outline-variant/10">
                                                    <h4 className="text-[10px] font-bold text-foreground/50 mb-3 uppercase tracking-widest">Planetary Manifestation</h4>
                                                    <p className="text-[15px] text-foreground font-medium leading-relaxed">
                                                        {selectedYoga.represents}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Activity className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Classification</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedYoga.classification}</span>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Zap className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Activation Path</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">Dasha / Bhukti</span>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Shield className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Impact Scale</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedYoga.potency}</span>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-3xl bg-surface border border-outline-variant/10 flex flex-col gap-4 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                                                            <Sparkles className="w-4 h-4 text-secondary" />
                                                        </div>
                                                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Archetypal Traits</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedYoga.traits.map((trait, idx) => (
                                                            <span key={idx} className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-bold text-secondary uppercase tracking-wider">{trait}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                    <Brain className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-headline font-bold text-foreground">Yoga Analysis Scan</h3>
                                                    <p className="text-[10px] text-foreground/40 tracking-wider uppercase font-bold">Discover hidden combinations in your Kundli</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => router.push('/chat')} variant="secondary" className="!px-8 !py-3 !rounded-2xl !font-bold">Scan My Chart ✦</Button>
                                        </div>
                                    </div>
                                </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
