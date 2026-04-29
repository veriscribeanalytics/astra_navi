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
        <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)] px-2 sm:px-4 pb-4 safe-bottom-buffer relative overflow-hidden flex flex-col items-center">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-secondary/3 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1500px] 2xl:max-w-[1800px] 3xl:max-w-[2200px] w-full mx-auto relative z-10 flex flex-col xl:flex-row gap-5">
                {/* Master: Sidebar (Left) */}
                <div className="lg:w-[260px] lg:h-[calc(100vh-100px)] flex-shrink-0 flex flex-col">
                    <div className="mb-2 px-1">
                        <Link href="/blogs" className="inline-flex items-center gap-1.5 text-secondary hover:text-secondary/70 transition-all mb-1 group">
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Library</span>
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                            Planetary <span className="text-secondary italic">Yogas</span>
                        </h1>
                    </div>

                    <div className="flex-grow overflow-y-auto scrollbar-hide pb-10">
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
                </div>

                {/* Detail: Content (Right) */}
                <div className="flex-grow min-w-0 flex flex-col">
                        <AnimatePresence mode="wait">
                            {viewMode === 'encyclopedia' && (
                                <motion.div
                                    key="encyclopedia"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.4 }}
                                className="h-full flex flex-col items-start p-2 lg:pt-0"
                            >
                                    <Card padding="none" className="w-full h-auto max-h-[90vh] !rounded-[40px] border-outline-variant/20 bg-surface flex flex-col relative overflow-hidden" hoverable={false}>
                                        <div className="p-8 lg:p-10 flex-grow flex flex-col">
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
                                className="h-full flex flex-col items-start p-2 lg:pt-0"
                            >
                                <Card padding="none" className="w-full h-auto max-h-[90vh] !rounded-[40px] border-outline-variant/20 flex flex-col relative overflow-hidden bg-surface">
                                    <div className="absolute top-8 right-8 z-20">
                                        <button
                                            onClick={() => router.push('/kundli')}
                                            className="h-12 px-6 bg-gradient-to-r from-secondary to-secondary/80 text-background font-bold text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl flex items-center gap-3 shadow-xl shadow-secondary/20"
                                        >
                                            <Lock className="w-4 h-4 opacity-40" /> Analyze Yogas
                                        </button>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
                                    
                                    <div className="flex-grow p-8 lg:p-10 overflow-hidden flex flex-col">
                                        {/* ── Top Section: Massive Identity ── */}
                                        <div className="flex items-center gap-12 mb-8">
                                            <div className="w-[150px] h-[150px] bg-surface border border-secondary/20 rounded-[40px] flex items-center justify-center text-secondary relative z-10 shadow-xl shrink-0 group">
                                                <div className="scale-[2.5] transition-transform duration-700 group-hover:scale-[2.8]">{selectedYoga.icon}</div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-secondary/10 py-1 text-[9px] font-bold text-center uppercase tracking-widest">{selectedYoga.sanskrit}</div>
                                            </div>
                                            <div className="flex-grow space-y-6">
                                                <div className="flex items-baseline gap-4">
                                                    <h2 className="text-6xl font-bold text-foreground tracking-tighter leading-none">{selectedYoga.nameEn}</h2>
                                                    <span className="text-3xl font-headline font-bold text-secondary italic opacity-80">— {selectedYoga.nameHi}</span>
                                                </div>
                                                
                                                {/* Top Metrics Grid */}
                                                <div className="grid grid-cols-4 gap-8 pt-2">
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Potency</span>
                                                        <p className="text-[14px] font-bold text-foreground/90">{selectedYoga.potency}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Logic</span>
                                                        <p className="text-[14px] font-bold text-foreground/90">{selectedYoga.logic.split(' ')[0]}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Classification</span>
                                                        <p className="text-[14px] font-bold text-foreground/90 uppercase">{selectedYoga.classification.split(' ')[0]}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Key Planets</span>
                                                        <p className="text-[14px] font-bold text-secondary uppercase">{selectedYoga.keyPlanet}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Middle Section: Bento Grid ── */}
                                        <div className="grid grid-cols-12 gap-8 flex-grow">
                                            {/* Left Column */}
                                            <div className="col-span-7 space-y-8">
                                                <div className="space-y-4">
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4" /> Formation Theory
                                                    </h3>
                                                    <p className="text-[16px] font-light leading-relaxed text-foreground/80 pr-6 italic border-l-2 border-secondary/20 pl-6">
                                                        &quot;{selectedYoga.deepDive}&quot;
                                                    </p>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                                                        <Zap className="w-4 h-4" /> Archetypal Traits
                                                    </h3>
                                                    <div className="flex flex-wrap gap-3">
                                                        {selectedYoga.traits.map(t => (
                                                            <span key={t} className="px-5 py-2 rounded-xl bg-surface border border-outline-variant/5 text-[11px] font-bold text-foreground/60 uppercase tracking-tight">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="col-span-5 space-y-4">
                                                <div className="bg-secondary/5 rounded-[24px] p-5 border border-secondary/5">
                                                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <Shield className="w-4 h-4" /> Manifestation
                                                    </h3>
                                                    <p className="text-[14px] font-medium leading-relaxed text-foreground/90">
                                                        {selectedYoga.represents}
                                                    </p>
                                                </div>

                                                <div className="p-6 rounded-3xl bg-surface border border-outline-variant/10 shadow-sm flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                                        <Activity className="w-5 h-5 text-secondary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-foreground">Activation Path</p>
                                                        <p className="text-[11px] text-foreground/50 leading-tight">
                                                            Primarily triggers during major <span className="text-secondary font-bold">Dasha / Bhukti</span> periods of the involved planets.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Bottom Section ── */}
                                        <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                    <Brain className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-foreground">Yoga Analysis Scan</h3>
                                                    <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold">Discover hidden combinations in your Kundli</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => router.push('/chat')} variant="secondary" className="!px-6 !py-2.5 !rounded-xl !font-bold !text-[11px]">Scan My Chart ✦</Button>
                                        </div>
                                    </div>
                                </Card>
                                </motion.div>
                            )}
                        </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
