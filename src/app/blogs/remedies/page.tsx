'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    Heart, ArrowLeft, ChevronRight, Info, Scale, 
    Activity, Lock, Zap, Dna, Sparkles, Gem, Music, Flame, Stars, Target, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

const remedies = [
    {
        id: 'ratna',
        nameEn: 'Gemstones',
        nameHi: 'रत्न विज्ञान',
        sanskrit: 'Ratna Vigyan',
        icon: <Gem className="w-8 h-8" />,
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-400/10',
        represents: 'Amplifying planetary rays through the prism of natural crystals to strengthen weak planets.',
        classification: 'Physical Shield',
        keyEntity: 'Natural Crystals',
        potency: 'Direct & Sustained',
        logic: 'Refraction & Vibration',
        traits: ['Ruby (Sun)', 'Pearl (Moon)', 'Emerald (Mer)', 'Yellow Saph. (Jup)', 'Diamond (Ven)'],
        deepDive: 'Gemstones act as "cosmic prisms." Each planet emits a specific frequency of light. When a planet is weak in a chart, wearing its corresponding gemstone on the skin allows the body to absorb more of that specific planetary radiation, effectively "tuning" the physical and energetic body to that celestial frequency.'
    },
    {
        id: 'mantra',
        nameEn: 'Mantras',
        nameHi: 'मंत्र विज्ञान',
        sanskrit: 'Mantra Shastra',
        icon: <Music className="w-8 h-8" />,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        represents: 'Transforming subconscious patterns through sacred sound frequencies and focused intention.',
        classification: 'Subconscious Alchemy',
        keyEntity: 'Sound Vibrations',
        potency: 'Deep & Permanent',
        logic: 'Resonance & Repetition',
        traits: ['Beeja Mantras', 'Gayatri', 'Stotras', 'Japa', 'Dhyana'],
        deepDive: 'Mantras are the sound-bodies of the deities (planets). By repeating a specific sound frequency (Japa), we create a resonance in our mental field that dissolves karmic knots (Granthis). It is considered the most powerful remedy as it works directly on the mind, the source of all karma.'
    },
    {
        id: 'daana',
        nameEn: 'Charity',
        nameHi: 'दान',
        sanskrit: 'Daana',
        icon: <Heart className="w-8 h-8" />,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10',
        represents: 'Releasing karmic debts by giving to specific entities related to the malefic planet.',
        classification: 'Karmic Release',
        keyEntity: 'Selfless Giving',
        potency: 'Karmic Weight Shift',
        logic: 'Sacrifice & Detachment',
        traits: ['Food', 'Clothes', 'Service', 'Knowledge', 'Time'],
        deepDive: 'Charity (Daana) is the act of letting go. When a planet is causing suffering, it often indicates a "karmic debt" in that area. By giving away items associated with that planet (e.g., black sesame for Saturn) to those in need, we consciously release the attachment and the debt, neutralizing the negative impact.'
    },
    {
        id: 'vrat',
        nameEn: 'Fasting',
        nameHi: 'व्रत',
        sanskrit: 'Vrat',
        icon: <Flame className="w-8 h-8" />,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        represents: 'Purifying the biological system and disciplining the will to align with planetary days.',
        classification: 'Biological Tuning',
        keyEntity: 'Self-Discipline',
        potency: 'Willpower Boost',
        logic: 'Tattva Purification',
        traits: ['Monday (Moon)', 'Tuesday (Mars)', 'Thursday (Jup)', 'Saturday (Sat)', 'Ekadashi'],
        deepDive: 'Fasting is not just about avoiding food; it is a "Vrat" or a sacred vow. By choosing to restrict intake on a planet\'s specific day, we strengthen our "Agni" (digestive fire) and demonstrate mental control. This aligns our biological rhythm with the planetary cycles, reducing friction.'
    },
    {
        id: 'yantra',
        nameEn: 'Yantras',
        nameHi: 'यंत्र',
        sanskrit: 'Yantra',
        icon: <Target className="w-8 h-8" />,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10',
        represents: 'Geometric maps of cosmic energy used as focal points for planetary installation.',
        classification: 'Spatial Alignment',
        keyEntity: 'Sacred Geometry',
        potency: 'Environmental Stability',
        logic: 'Form & Proportion',
        traits: ['Shree Yantra', 'Surya Yantra', 'Mahamrityunjaya', 'Vastu Yantras', 'Protection'],
        deepDive: 'Yantras are the geometric equivalents of Mantras. They represent the "architecture" of a planet\'s energy. Placing a consecrated Yantra in one\'s environment creates a stable energy field that continuously radiates the planet\'s positive qualities into the space.'
    }
];

export default function RemediesPage() {
    const [selectedRemedy, setSelectedRemedy] = useState(remedies[0]);
    const router = useRouter();

    return (
        <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)] px-4 relative overflow-hidden flex flex-col items-center">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-secondary/3 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1500px] 2xl:max-w-[1800px] 3xl:max-w-[2200px] mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <Link href="/blogs" className="inline-flex items-center gap-2 group">
                            <ArrowLeft className="w-4 h-4 text-secondary group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/60 group-hover:text-secondary transition-colors">Knowledge Center</span>
                        </Link>
                    </motion.div>
                    
                    <div className="text-right">
                        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Sacred <span className="text-secondary italic">Remedies</span></h1>
                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">The Science of Alignment</p>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-8 items-start">
                    {/* Navigation Sidebar */}
                    <div className="w-full lg:w-[240px] shrink-0 sticky lg:top-24 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex flex-col gap-2">
                            {remedies.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setSelectedRemedy(item)}
                                    className={`relative p-3 rounded-[20px] transition-all duration-300 flex items-center gap-3 group border ${
                                        selectedRemedy.id === item.id 
                                        ? 'bg-secondary text-white shadow-lg border-secondary' 
                                        : 'bg-surface hover:bg-surface text-foreground/60 border-outline-variant/10'
                                    } shadow-sm`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedRemedy.id === item.id ? 'text-white' : item.color}`}>
                                        {item.icon}
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-[13px] font-bold font-headline">{item.nameEn}</p>
                                        <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${selectedRemedy.id === item.id ? 'text-white/60' : 'text-foreground/30'}`}>
                                            {item.nameHi}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedRemedy.id === item.id ? 'translate-x-1' : 'opacity-0'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="flex-1 w-full min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedRemedy.id}
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
                                                        {selectedRemedy.icon}
                                                    </div>
                                                    <div className="absolute bottom-0 left-0 right-0 bg-secondary/10 py-1 text-[10px] font-bold text-center uppercase tracking-widest">{selectedRemedy.sanskrit}</div>
                                                </div>
                                            </div>

                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-4 mb-4">
                                                    <h2 className="text-6xl font-headline font-bold text-foreground">{selectedRemedy.nameEn}</h2>
                                                    <span className="text-3xl text-secondary font-headline italic">— {selectedRemedy.nameHi}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Logic</p>
                                                        <p className="text-base font-bold text-secondary">{selectedRemedy.logic}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Target</p>
                                                        <p className="text-base font-bold text-foreground/80">{selectedRemedy.classification}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Intensity</p>
                                                        <p className="text-base font-bold text-foreground/80">{selectedRemedy.potency}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Entity</p>
                                                        <p className="text-base font-bold text-secondary">{selectedRemedy.keyEntity}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-12">
                                            <div className="space-y-8">
                                                <div>
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                        <Dna className="w-4 h-4" />
                                                        Remedial Theory
                                                    </h3>
                                                    <p className="text-lg text-foreground/90 leading-relaxed font-light italic border-l-2 border-secondary/20 pl-6">
                                                        &quot;{selectedRemedy.deepDive}&quot;
                                                    </p>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-surface border border-outline-variant/10 shadow-sm">
                                                    <h4 className="text-[10px] font-bold text-foreground/50 mb-3 uppercase tracking-widest">Operational Role</h4>
                                                    <p className="text-[15px] text-foreground font-medium leading-relaxed">
                                                        {selectedRemedy.represents}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Activity className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Efficacy Scale</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedRemedy.potency}</span>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Zap className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Primary Logic</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedRemedy.logic}</span>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Shield className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Safety Level</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">High (Non-Invasive)</span>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-3xl bg-surface border border-outline-variant/10 flex flex-col gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                                                            <Sparkles className="w-4 h-4 text-secondary" />
                                                        </div>
                                                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Key Examples</p>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedRemedy.traits.map((trait, idx) => (
                                                            <span key={idx} className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-bold text-secondary uppercase tracking-wider">{trait}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                    <Stars className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-headline font-bold text-foreground">Personalized Remedy Scan</h3>
                                                    <p className="text-[10px] text-foreground/40 tracking-wider uppercase font-bold">Discover specific alignments needed for your chart</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => router.push('/chat')} variant="secondary" className="!px-8 !py-3 !rounded-2xl !font-bold">Consult Navi ✦</Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}