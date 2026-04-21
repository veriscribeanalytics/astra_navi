'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    ArrowLeft,
    ChevronRight, Info, Shield, Scale, Activity,
    Lock, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

const LucideIcons = {
    ArrowLeft, Info, Activity, Shield, CheckCircle2, AlertCircle,
    Scale, Lock, ChevronRight, Sparkles
};

// ─── Constants from Kundli context ──────────────────────────
const PLANET_GLYPHS: Record<string, string> = {
    'Sun': '☉', 'Moon': '☽', 'Mars': '♂', 'Mercury': '☿',
    'Jupiter': '♃', 'Venus': '♀', 'Saturn': '♄', 'Rahu': '☊', 'Ketu': '☋',
};
const PLANET_COLORS: Record<string, string> = {
    'Sun': '#F59E0B', 'Moon': '#C7D2FE', 'Mars': '#EF4444',
    'Mercury': '#34D399', 'Jupiter': '#FBBF24', 'Venus': '#F472B6',
    'Saturn': '#818CF8', 'Rahu': '#9CA3AF', 'Ketu': '#A78BFA',
};
const PLANET_TO_ICON: Record<string, string> = {
    'Sun': '/icons/planets/sun.png', 'Moon': '/icons/planets/moon.png',
    'Mars': '/icons/planets/mars.png', 'Saturn': '/icons/planets/saturn.png',
    'Mercury': '/icons/planets/mercury.png', 'Jupiter': '/icons/planets/jupiter.png',
    'Venus': '/icons/planets/venus.png',
};

const PlanetIcon = ({ planet, size = "w-12 h-12", withGlow = true }: { planet: string; size?: string; withGlow?: boolean }) => (
    <div className={`${size} relative flex items-center justify-center shrink-0`}>
        {withGlow && <div className="absolute inset-[-6px] blur-[28px] opacity-35 rounded-full" style={{ backgroundColor: PLANET_COLORS[planet] || '#c8880a' }} />}
        {PLANET_TO_ICON[planet] ? (
            <Image src={PLANET_TO_ICON[planet]} alt={planet} width={64} height={64} className="w-full h-full object-contain relative z-10 drop-shadow-xl" />
        ) : (
            <span className={`${size.includes('w-32') || size.includes('w-48') ? 'text-6xl text-center' : 'text-3xl text-center'} w-full flex items-center justify-center drop-shadow-lg relative z-10`} style={{ color: PLANET_COLORS[planet] }}>{PLANET_GLYPHS[planet]}</span>
        )}
    </div>
);

const planets = [
    {
        id: 'Sun',
        nameEn: 'Sun',
        nameHi: 'Surya',
        nameSanskrit: 'Ravi',
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
        id: 'Moon',
        nameEn: 'Moon',
        nameHi: 'Chandra',
        nameSanskrit: 'Soma',
        color: 'text-indigo-300',
        bgColor: 'bg-indigo-300/10',
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
        id: 'Mars',
        nameEn: 'Mars',
        nameHi: 'Mangal',
        nameSanskrit: 'Kuja',
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
        id: 'Mercury',
        nameEn: 'Mercury',
        nameHi: 'Budh',
        nameSanskrit: 'Saumya',
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
        id: 'Jupiter',
        nameEn: 'Jupiter',
        nameHi: 'Guru',
        nameSanskrit: 'Brihaspati',
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
        id: 'Venus',
        nameEn: 'Venus',
        nameHi: 'Shukra',
        nameSanskrit: 'Bhrigu',
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
        id: 'Saturn',
        nameEn: 'Saturn',
        nameHi: 'Shani',
        nameSanskrit: 'Manda',
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
        id: 'Rahu',
        nameEn: 'Rahu',
        nameHi: 'Rahu',
        nameSanskrit: 'Swarbhanu',
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
        id: 'Ketu',
        nameEn: 'Ketu',
        nameHi: 'Ketu',
        nameSanskrit: 'Shikhi',
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

            <div className="max-w-[1500px] mx-auto relative z-10 flex flex-col h-full">
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

                <div className="flex flex-col lg:flex-row gap-8 items-start min-h-[600px]">
                    {/* Sidebar Navigation */}
                    <div className="w-full lg:w-[260px] shrink-0 sticky lg:top-24">
                        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-1 gap-3">
                            {planets.map((planet) => (
                                <button
                                    key={planet.id}
                                    onClick={() => setSelectedPlanet(planet)}
                                    className={`relative p-3 rounded-[24px] transition-all duration-300 flex items-center flex-col lg:flex-row gap-3 group overflow-hidden border ${
                                        selectedPlanet.id === planet.id 
                                        ? 'bg-surface border-secondary shadow-lg scale-100 z-10'  
                                        : 'bg-surface/40 hover:bg-surface/80 text-foreground/60 border-outline-variant/10 hover:border-outline-variant/30 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    {selectedPlanet.id === planet.id && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-secondary rounded-r-full" />
                                    )}
                                    
                                    <div className="shrink-0 transition-transform duration-500 group-hover:scale-110 pl-1">
                                        <PlanetIcon planet={planet.id} size="w-10 h-10 lg:w-12 lg:h-12" withGlow={selectedPlanet.id === planet.id} />
                                    </div>
                                    <div className="text-center lg:text-left">
                                        <p className="text-[14px] font-headline font-bold leading-tight" style={{ color: selectedPlanet.id === planet.id ? PLANET_COLORS[planet.id] : '' }}>{planet.nameEn}</p>
                                        <p className={`text-[9px] uppercase font-bold tracking-widest mt-0.5 hidden lg:block ${selectedPlanet.id === planet.id ? 'text-foreground/80' : 'text-foreground/40'}`}>
                                            {planet.nameHi}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="flex-1 w-full min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedPlanet.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full"
                            >
                                {/* Main Planet Card */}
                                <Card padding="none" className="!rounded-[32px] border border-outline-variant/20 bg-surface/80 backdrop-blur-md overflow-hidden shadow-2xl shadow-black/5">
                                    <div className="p-8 sm:p-10">
                                        {/* Hero Header — Split with Planet Icon */}
                                        <div className="flex flex-col md:flex-row items-center gap-10 mb-10 pb-10 border-b border-outline-variant/10">
                                            
                                            {/* Giant Planet Icon */}
                                            <div className="relative group shrink-0 flex items-center justify-center w-40 h-40 lg:w-48 lg:h-48">
                                                <div className="absolute inset-[-40px] rounded-full blur-[70px] opacity-40 transition-all duration-1000"
                                                    style={{ backgroundColor: PLANET_COLORS[selectedPlanet.id] }} />
                                                    
                                                <motion.div
                                                    initial={{ scale: 0.8, rotate: -10 }}
                                                    animate={{ scale: 1, rotate: 0 }}
                                                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                                >
                                                    <PlanetIcon planet={selectedPlanet.id} size="w-32 h-32 lg:w-48 lg:h-48" withGlow={false} />
                                                </motion.div>
                                            </div>

                                            <div className="flex-1 min-w-0 text-center md:text-left">
                                                <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3 mb-4">
                                                    <h2 className="text-5xl lg:text-6xl font-headline font-bold text-foreground">
                                                        {selectedPlanet.nameEn}
                                                    </h2>
                                                    <span className="text-xl lg:text-2xl font-headline font-bold italic" style={{ color: PLANET_COLORS[selectedPlanet.id] }}>
                                                        — {selectedPlanet.nameHi}
                                                    </span>
                                                </div>
                                                
                                                <div className="inline-flex flex-wrap gap-2 mb-6 justify-center md:justify-start">
                                                    <span className="px-3 py-1 rounded-full bg-surface-variant/50 border border-outline-variant/10 text-[10px] font-bold text-foreground/60 uppercase tracking-widest">
                                                        {selectedPlanet.nameSanskrit}
                                                    </span>
                                                    <span className="px-3 py-1 rounded-full bg-surface-variant/50 border border-outline-variant/10 text-[10px] font-bold text-foreground/60 uppercase tracking-widest">
                                                        {selectedPlanet.element} Element
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.2em]">Nature</p>
                                                        <p className="text-[13px] font-bold text-foreground/90">{selectedPlanet.nature}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.2em]">Core Essence</p>
                                                        <p className="text-[13px] font-bold text-foreground/90">{selectedPlanet.traits[0]}, {selectedPlanet.traits[1]}</p>
                                                    </div>
                                                    <div className="space-y-1 col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-outline-variant/10 pt-4 md:pt-0 md:pl-6">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.2em]">Biological</p>
                                                        <p className="text-[11px] font-bold leading-tight text-foreground/70 uppercase tracking-wider">{selectedPlanet.bodyParts}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Grid */}
                                        <div className="grid md:grid-cols-2 gap-10">
                                            {/* Left Column */}
                                            <div className="flex flex-col gap-8">
                                                <div>
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                                                        <LucideIcons.Info className="w-4 h-4" />
                                                        Cosmic Archetype
                                                    </h3>
                                                    <p className="text-[15px] text-foreground/80 leading-[1.8] font-medium border-l-2 border-secondary/30 pl-4">
                                                        {selectedPlanet.deepDive}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-[0.25em] mb-4 flex items-center gap-2">
                                                        <LucideIcons.Activity className="w-4 h-4" />
                                                        Signatures
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {selectedPlanet.traits.map((trait, idx) => (
                                                            <span key={idx} className="px-4 py-2 rounded-xl bg-surface-variant/30 border border-outline-variant/10 text-[12px] font-bold text-foreground/80">
                                                                {trait}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-6">
                                                {/* Significance Section */}
                                                <div className="p-6 rounded-[20px] bg-secondary/5 border border-secondary/10 relative overflow-hidden group/card shadow-inner">
                                                    <div className="absolute -right-4 -top-4 p-3 opacity-[0.03] scale-150 transform transition-transform group-hover/card:rotate-12 duration-700">
                                                        <LucideIcons.Shield className="w-32 h-32 text-secondary" />
                                                    </div>
                                                    <h4 className="text-[11px] font-bold text-secondary mb-3 uppercase tracking-wider flex items-center gap-1.5">
                                                        <LucideIcons.Sparkles className="w-3.5 h-3.5" /> Planetary Governance
                                                    </h4>
                                                    <p className="text-[14px] text-foreground/90 font-medium leading-[1.7] relative z-10">
                                                        {selectedPlanet.represents}
                                                    </p>
                                                </div>

                                                {/* Technical Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <LucideIcons.CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                            <h4 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Exaltation</h4>
                                                        </div>
                                                        <p className="text-[14px] font-bold text-foreground">{selectedPlanet.exaltation}</p>
                                                        <p className="text-[9px] text-foreground/40 mt-1.5 uppercase font-bold tracking-wider">Highest potential</p>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/15">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <LucideIcons.AlertCircle className="w-4 h-4 text-rose-500" />
                                                            <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Debilitation</h4>
                                                        </div>
                                                        <p className="text-[14px] font-bold text-foreground">{selectedPlanet.debilitation}</p>
                                                        <p className="text-[9px] text-foreground/40 mt-1.5 uppercase font-bold tracking-wider">Lowest vitality</p>
                                                    </div>
                                                </div>

                                                {/* Mooltrikona */}
                                                <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <LucideIcons.Scale className="w-4 h-4 text-amber-500" />
                                                            <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Mooltrikona</h4>
                                                        </div>
                                                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[9px] font-bold text-amber-600 uppercase tracking-wider">Primary Office</span>
                                                    </div>
                                                    <p className="text-[14px] font-bold text-foreground">{selectedPlanet.mooltrikona}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Integrated Footer: Personalized Insight */}
                                        <div className="mt-10 pt-6 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-surface border border-outline-variant/10 flex items-center justify-center p-2 shadow-sm">
                                                    <PlanetIcon planet={selectedPlanet.id} size="w-8 h-8" withGlow={false} />
                                                </div>
                                                <div>
                                                    <h3 className="text-[14px] font-headline font-bold text-foreground">Aligning with {selectedPlanet.nameEn}</h3>
                                                    <p className="text-[10px] text-foreground/40 tracking-wider uppercase font-bold mt-0.5">Discover how this planet influences your Kundli chart</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => router.push('/kundli')}
                                                className="!px-6 !py-3 !rounded-[14px] !bg-secondary !text-white !font-bold !border-none hover:!scale-[1.02] active:!scale-95 !min-h-0 flex items-center gap-2 group/btn w-full sm:w-auto justify-center transition-all shadow-md shadow-secondary/20"
                                            >
                                                {isLoggedIn ? (
                                                    <><span className="text-[12px] uppercase tracking-wider">Check My Chart</span> <LucideIcons.ChevronRight className="w-4 h-4" /></>
                                                ) : (
                                                    <><LucideIcons.Lock className="w-3.5 h-3.5" /> <span className="text-[12px] uppercase tracking-wider">Analyze Alignment</span></>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <div className="mt-12 text-center text-[10px] text-foreground/20 font-bold tracking-[0.4em] uppercase pb-8 border-t border-outline-variant/5 pt-12">
                    <p>Verified AstraNavi Cosmic Research Center</p>
                </div>
            </div>
        </div>
    );
}
