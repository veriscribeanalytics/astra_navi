'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    Calendar, ArrowLeft, Sun, Moon, Flame, Zap, 
    Sparkles, Heart, Clock, Eclipse, Star, 
    ChevronRight, Info, Shield, Scale, Activity,
    Lock, CheckCircle2, AlertCircle
} from 'lucide-center';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

// Replace lucide-center with lucide-react (correcting my typo)
import * as LucideIcons from 'lucide-react';

const planets = [
    {
        id: 'sun',
        nameEn: 'Sun',
        nameHi: 'Surya',
        nameSanskrit: 'Ravi',
        icon: <LucideIcons.Sun className="w-8 h-8" />,
        color: 'text-orange-500',
        bgColor: 'bg-orange-500/10',
        nature: 'Sattvic / Royal',
        element: 'Fire',
        represents: 'The Soul (Atma), Ego, Vitality, Authority, Father, Health, Government.',
        exaltation: 'Aries (Mesha)',
        debilitation: 'Libra (Tula)',
        mooltrikona: 'Leo',
        bodyParts: 'Heart, Eyes, Right eye (men), Left eye (women)',
        traits: ['Leadership', 'Willpower', 'Radiance', 'Dignity', 'Command'],
        deepDive: 'Surya is the King of the celestial cabinet. It represents the conscious self and the divine spark within. A strong Sun bestows immense power and fame, while a weak Sun leads to low confidence and health issues.'
    },
    {
        id: 'moon',
        nameEn: 'Moon',
        nameHi: 'Chandra',
        nameSanskrit: 'Soma',
        icon: <LucideIcons.Moon className="w-8 h-8" />,
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        nature: 'Sattvic / Motherly',
        element: 'Water',
        represents: 'The Mind (Manas), Emotions, Mother, Peace, Intuition, Fluids, Fertility.',
        exaltation: 'Taurus (Vrishabha)',
        debilitation: 'Scorpio (Vrishchika)',
        mooltrikona: 'Taurus',
        bodyParts: 'Mind, Fluids, Left eye (men), Right eye (women)',
        traits: ['Nurturing', 'Intuitive', 'Sensitive', 'Adaptive', 'Calm'],
        deepDive: 'Chandra rules over the subconscious and emotional stability. It reflects the light of the Sun and governs our psychological well-being. Its phases dictate the mental fluctuations of all beings.'
    },
    {
        id: 'mars',
        nameEn: 'Mars',
        nameHi: 'Mangal',
        nameSanskrit: 'Kuja',
        icon: <LucideIcons.Flame className="w-8 h-8" />,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        nature: 'Tamasic / Warrior',
        element: 'Fire',
        represents: 'Energy, Courage, Aggression, Brothers, Action, Property, Engineering.',
        exaltation: 'Capricorn (Makara)',
        debilitation: 'Cancer (Karka)',
        mooltrikona: 'Aries',
        bodyParts: 'Blood, Bone marrow, Bile, Muscles',
        traits: ['Brave', 'Assertive', 'Competitive', 'Direct', 'Protective'],
        deepDive: 'Mangal is the Commander-in-Chief. It provides the drive to achieve goals and the strength to fight obstacles. Excessive Mars energy leads to anger, while deficiency leads to cowardice.'
    },
    {
        id: 'mercury',
        nameEn: 'Mercury',
        nameHi: 'Budh',
        nameSanskrit: 'Saumya',
        icon: <LucideIcons.Zap className="w-8 h-8" />,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        nature: 'Rajasic / Prince',
        element: 'Earth',
        represents: 'Intellect, Communication, Speech, Logic, Business, Mathematics, Youth.',
        exaltation: 'Virgo (Kanya)',
        debilitation: 'Pisces (Meena)',
        mooltrikona: 'Virgo',
        bodyParts: 'Skin, Nervous system, Speech, Lungs',
        traits: ['Analytical', 'Eloquent', 'Witty', 'Logical', 'Versatile'],
        deepDive: 'Budh is the messenger of God. It rules over how we process information and communicate it to the world. It is the most adaptable planet, taking on the nature of planets it associates with.'
    },
    {
        id: 'jupiter',
        nameEn: 'Jupiter',
        nameHi: 'Guru',
        nameSanskrit: 'Brihaspati',
        icon: <LucideIcons.Sparkles className="w-8 h-8" />,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        nature: 'Sattvic / Teacher',
        element: 'Ether (Akasha)',
        represents: 'Wisdom, Wealth, Spirituality, Knowledge, Children, Fortune, Expansion.',
        exaltation: 'Cancer (Karka)',
        debilitation: 'Capricorn (Makara)',
        mooltrikona: 'Sagittarius',
        bodyParts: 'Liver, Fat, Hips, Arteries',
        traits: ['Ethical', 'Optimistic', 'Magnanimous', 'Wise', 'Generous'],
        deepDive: 'Guru is the Great Benefic. He is the priest of the Gods and represents the path of Dharma. A strong Jupiter protects the individual from many chart deficiencies through divine grace.'
    },
    {
        id: 'venus',
        nameEn: 'Venus',
        nameHi: 'Shukra',
        nameSanskrit: 'Bhrigu',
        icon: <LucideIcons.Heart className="w-8 h-8" />,
        color: 'text-pink-500',
        bgColor: 'bg-pink-500/10',
        nature: 'Rajasic / Minister',
        element: 'Water',
        represents: 'Love, Beauty, Luxury, Art, Comfort, Marriage, Vehicles, Aesthetics.',
        exaltation: 'Pisces (Meena)',
        debilitation: 'Virgo (Kanya)',
        mooltrikona: 'Libra',
        bodyParts: 'Reproductive system, Eyes, Cheeks',
        traits: ['Artistic', 'Charming', 'Sociable', 'Aesthetic', 'Harmonious'],
        deepDive: 'Shukra is the teacher of the Asuras and master of all material arts. It represents our ability to enjoy life and form meaningful partnerships. It is the Karaka for worldly happiness.'
    },
    {
        id: 'saturn',
        nameEn: 'Saturn',
        nameHi: 'Shani',
        nameSanskrit: 'Manda',
        icon: <LucideIcons.Clock className="w-8 h-8" />,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
        nature: 'Tamasic / Servant',
        element: 'Air',
        represents: 'Karma, Discipline, Longevity, Grief, Hard work, Delays, Justice, Reality.',
        exaltation: 'Libra (Tula)',
        debilitation: 'Aries (Mesha)',
        mooltrikona: 'Aquarius',
        bodyParts: 'Knees, Joints, Teeth, Bones, Legs',
        traits: ['Persistent', 'Disciplined', 'Patient', 'Practical', 'Lawful'],
        deepDive: 'Shani is the Great Taskmaster. He ensures that everyone receives the fruits of their past actions. While often feared, a strong Saturn creates great spiritual endurance and worldly foundation.'
    },
    {
        id: 'rahu',
        nameEn: 'Rahu',
        nameHi: 'Rahu',
        nameSanskrit: 'Swarbhanu',
        icon: <LucideIcons.Eclipse className="w-8 h-8" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-600/10',
        nature: 'Mlechha / Outcast',
        element: 'Shadow (Chhaya)',
        represents: 'Obsession, Illusion, Foreigners, Sudden Events, Innovation, Insatiable Desire.',
        exaltation: 'Taurus / Gemini',
        debilitation: 'Scorpio / Sagittarius',
        mooltrikona: 'Virgo',
        bodyParts: 'Lungs, Breathing system, Intestines',
        traits: ['Ambitious', 'Unconventional', 'Experimental', 'Driven', 'Obsessive'],
        deepDive: 'Rahu is the North Node of the Moon. It represents the karmic path we are heading towards. It creates a smoky illusion that makes material desires seem irresistible, leading to both peak success and sudden falls.'
    },
    {
        id: 'ketu',
        nameEn: 'Ketu',
        nameHi: 'Ketu',
        nameSanskrit: 'Shikhi',
        icon: <LucideIcons.Star className="w-8 h-8" />,
        color: 'text-slate-500',
        bgColor: 'bg-slate-500/10',
        nature: 'Spiritual / Ascetic',
        element: 'Shadow (Chhaya)',
        represents: 'Detachment, Spirituality, Moksha, Intuition, Past Karma, Separation.',
        exaltation: 'Scorpio / Sagittarius',
        debilitation: 'Taurus / Gemini',
        mooltrikona: 'Pisces',
        bodyParts: 'Abdomen, Hair, Nails',
        traits: ['Detached', 'Introverted', 'Mystical', 'Spiritual', 'Sharp-witted'],
        deepDive: 'Ketu is the South Node of the Moon. It represents the baggage of our past lives. Being headless, it rules over the subconscious and intuition. It is the primary significator of spiritual enlightenment (Moksha).'
    }
];

export default function PlanetsPage() {
    const [selectedPlanet, setSelectedPlanet] = useState(planets[0]);
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
                            <LucideIcons.ArrowLeft className="w-4 h-4 text-secondary group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/60 group-hover:text-secondary transition-colors">Knowledge Center</span>
                        </Link>
                    </motion.div>
                    
                    <div className="text-right">
                        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Navagraha <span className="text-secondary italic">Theory</span></h1>
                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">The Nine Celestial Influencers</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Sidebar Navigation */}
                    <div className="w-full lg:w-[180px] shrink-0 sticky lg:top-24">
                        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-1 gap-3">
                            {planets.map((planet) => (
                                <button
                                    key={planet.id}
                                    onClick={() => setSelectedPlanet(planet)}
                                    className={`relative p-4 rounded-[24px] transition-all duration-300 flex items-center lg:flex-row flex-col gap-3 group overflow-hidden ${
                                        selectedPlanet.id === planet.id 
                                        ? 'bg-secondary text-white shadow-xl shadow-secondary/20 scale-105' 
                                        : 'bg-surface/40 hover:bg-surface/80 text-foreground/60 border border-outline-variant/20'
                                    }`}
                                >
                                    <div className={`shrink-0 transition-transform duration-500 group-hover:scale-110 ${selectedPlanet.id === planet.id ? 'text-white' : planet.color}`}>
                                        {planet.icon}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] font-bold font-headline leading-none">{planet.nameEn}</p>
                                        <p className={`text-[8px] uppercase tracking-widest mt-1 hidden lg:block ${selectedPlanet.id === planet.id ? 'text-white/60' : 'text-foreground/30'}`}>
                                            {planet.nameHi}
                                        </p>
                                    </div>
                                    {selectedPlanet.id === planet.id && (
                                        <motion.div 
                                            layoutId="planet-active"
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
                                key={selectedPlanet.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Main Planet Card */}
                                <Card padding="none" className="!rounded-[28px] border border-outline-variant/30 bg-surface/50 backdrop-blur-sm overflow-hidden">
                                    <div className="p-7 sm:p-8">
                                        {/* Hero Header — Horizontal */}
                                        <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-outline-variant/20">
                                            <div className="relative group shrink-0">
                                                <div className={`absolute inset-0 ${selectedPlanet.bgColor} blur-[60px] rounded-full opacity-60`}></div>
                                                <div className={`w-28 h-28 lg:w-36 lg:h-36 rounded-[40px] ${selectedPlanet.bgColor} border border-current/10 flex items-center justify-center ${selectedPlanet.color} relative z-10 transition-transform duration-500 hover:scale-105 shadow-inner`}>
                                                    {selectedPlanet.icon}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 text-center md:text-left">
                                                <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-4 mb-3">
                                                    <h2 className="text-4xl lg:text-5xl font-headline font-bold text-foreground">
                                                        {selectedPlanet.nameEn}
                                                    </h2>
                                                    <span className="text-xl lg:text-2xl text-secondary font-headline italic">— {selectedPlanet.nameHi}</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Sanskrit</p>
                                                        <p className="text-sm font-bold text-secondary">{selectedPlanet.nameSanskrit}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Nature</p>
                                                        <p className="text-sm font-bold text-foreground/80">{selectedPlanet.nature}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Element</p>
                                                        <p className="text-sm font-bold text-secondary">{selectedPlanet.element}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Exaltation</p>
                                                        <p className="text-sm font-bold text-foreground italic">{selectedPlanet.exaltation.split(' ')[0]}</p>
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
                                                        <LucideIcons.Info className="w-3.5 h-3.5" />
                                                        Cosmic Archetype
                                                    </h3>
                                                    <p className="text-[15px] text-foreground leading-[1.8] font-light italic border-l-2 border-secondary/20 pl-4">
                                                        {selectedPlanet.deepDive}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] mb-4 flex items-center gap-1.5">
                                                        <LucideIcons.Activity className="w-3.5 h-3.5" />
                                                        Signatures
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedPlanet.traits.map((trait, idx) => (
                                                            <span key={idx} className="px-3.5 py-2 rounded-xl bg-secondary/8 border border-outline-variant/30 text-[11px] font-bold text-foreground hover:bg-secondary hover:text-white transition-all cursor-default">
                                                                {trait}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="p-5 rounded-2xl bg-surface/60 border border-outline-variant/20">
                                                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] mb-3">Biological Influence</h4>
                                                    <p className="text-xs font-bold text-foreground/90 leading-relaxed italic uppercase tracking-wider">
                                                        {selectedPlanet.bodyParts}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-5">
                                                {/* Significance Section */}
                                                <div className="p-5 rounded-2xl bg-secondary/5 border border-outline-variant/30 relative overflow-hidden group/card">
                                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                                        <LucideIcons.Shield className="w-12 h-12 text-secondary" />
                                                    </div>
                                                    <h4 className="text-[11px] font-bold text-foreground mb-3 uppercase tracking-wider">Planetary Governance</h4>
                                                    <p className="text-[13px] text-foreground font-medium leading-[1.7]">
                                                        {selectedPlanet.represents}
                                                    </p>
                                                </div>

                                                {/* Technical Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 transition-all hover:bg-emerald-500/10">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <LucideIcons.CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                            <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Exaltation</h4>
                                                        </div>
                                                        <p className="text-[13px] font-bold text-foreground">{selectedPlanet.exaltation}</p>
                                                        <p className="text-[9px] text-foreground/40 mt-1 uppercase">Highest potential</p>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 transition-all hover:bg-rose-500/10">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <LucideIcons.AlertCircle className="w-4 h-4 text-rose-500" />
                                                            <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Debilitation</h4>
                                                        </div>
                                                        <p className="text-[13px] font-bold text-foreground">{selectedPlanet.debilitation}</p>
                                                        <p className="text-[9px] text-foreground/40 mt-1 uppercase">Lowest vitality</p>
                                                    </div>
                                                </div>

                                                {/* Mooltrikona */}
                                                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <LucideIcons.Scale className="w-4 h-4 text-amber-500" />
                                                            <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Mooltrikona</h4>
                                                        </div>
                                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[8px] font-bold text-amber-600 uppercase">Primary Office</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-foreground">{selectedPlanet.mooltrikona}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Integrated Footer: Personalized Insight */}
                                        <div className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl ${selectedPlanet.bgColor} flex items-center justify-center border border-current/10 ${selectedPlanet.color}`}>
                                                    <LucideIcons.Sparkles className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-[13px] font-headline font-bold text-foreground">Planetary Strength</h3>
                                                    <p className="text-[9px] text-foreground/40 tracking-wider uppercase font-bold">Discover how {selectedPlanet.nameEn} influences Your Chart</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => router.push('/kundli')}
                                                className="!px-6 !py-2 !rounded-xl !bg-secondary !text-white !font-extrabold !border-none hover:!scale-105 active:!scale-95 !min-h-0 flex items-center gap-2 group/btn w-full sm:w-auto justify-center"
                                            >
                                                {isLoggedIn ? (
                                                    <><span className="text-[11px]">Check My Chart</span> <LucideIcons.ChevronRight className="w-4 h-4" /></>
                                                ) : (
                                                    <><LucideIcons.Lock className="w-3.5 h-3.5" /> <span className="text-[11px]">Analyze Alignment</span></>
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
                    <p>Verified AstraNavi Cosmic Research Center</p>
                </div>
            </div>
        </div>
    );
}
