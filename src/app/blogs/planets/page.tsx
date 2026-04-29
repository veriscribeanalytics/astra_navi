'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    ArrowLeft, ChevronRight, Info, Shield, Scale, Activity,
    Lock, CheckCircle2, AlertCircle, Sparkles, Zap, Dna, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';


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

// ─── FIX 1: Glow is now tightly constrained — same size as icon, low blur radius ───
const PlanetIcon = ({ planet, size = "w-12 h-12", withGlow = true }: { planet: string; size?: string; withGlow?: boolean }) => (
    <div className={`${size} relative flex items-center justify-center shrink-0`}>
        {withGlow && (
            <div 
                className="absolute inset-0 blur-[14px] opacity-40 rounded-full animate-pulse-slow" 
                style={{ backgroundColor: PLANET_COLORS[planet] || '#c8880a' }} 
            />
        )}
        {PLANET_TO_ICON[planet] ? (
            <Image 
                src={PLANET_TO_ICON[planet]} 
                alt={planet} 
                width={400} 
                height={400} 
                className="w-full h-full object-contain relative z-10" 
            />
        ) : (
            <span 
                className="w-full h-full flex items-center justify-center text-3xl font-bold relative z-10" 
                style={{ color: PLANET_COLORS[planet] }}
            >
                {planet[0]}
            </span>
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
        exaltation: 'Aries (Mesha) 10°',
        debilitation: 'Libra (Tula) 10°',
        mooltrikona: 'Leo 0°-20°',
        bodyParts: 'Heart, Eyes, Right eye (men), Left eye (women)',
        traits: ['Leadership', 'Willpower', 'Radiance', 'Dignity', 'Command'],
        deepDive: 'Surya is the celestial King, representing the conscious self and divine spark. It governs authority, vitality, and the soul. A strong Sun bestows fame and leadership, while a weak Sun impacts confidence and health.',
        shadbala: 'Strongest in 10th House (Dik Bala). Solar energy peaks at noon.',
        avastha: 'Radiant in Aries (Exaltation), it is in "Deepta" Avastha.',
        functional: 'Benefic for Aries, Leo, Sagittarius, and Scorpio Lagna.'
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
        exaltation: 'Taurus (Vrishabha) 3°',
        debilitation: 'Scorpio (Vrishchika) 3°',
        mooltrikona: 'Taurus 4°-30°',
        bodyParts: 'Mind, Fluids, Left eye (men), Right eye (women)',
        traits: ['Nurturing', 'Intuitive', 'Sensitive', 'Adaptive', 'Calm'],
        deepDive: 'Chandra rules the subconscious and emotional stability. It reflects the Sun’s light and governs mental well-being. Its waxing and waning phases dictate the psychological fluctuations of all beings.',
        shadbala: 'Strongest in 4th House (Dik Bala). Lunar power peaks at night.',
        avastha: 'Waxing (Shukla Paksha) Moon is considered naturally Benefic.',
        functional: 'Benefic for Cancer, Aries, Scorpio, and Pisces Lagna.'
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
        exaltation: 'Capricorn (Makara) 28°',
        debilitation: 'Cancer (Karka) 28°',
        mooltrikona: 'Aries 0°-12°',
        bodyParts: 'Blood, Bone marrow, Bile, Muscles',
        traits: ['Brave', 'Assertive', 'Competitive', 'Direct', 'Protective'],
        deepDive: 'Mangal is the Commander-in-Chief, providing the drive to achieve goals and overcome obstacles. It rules action and property. Excessive Mars energy leads to anger; deficiency leads to lack of drive.',
        shadbala: 'Strongest in 10th House (Dik Bala). High strength when Retrograde.',
        avastha: 'In Capricorn (Exaltation), it reaches its "Peak" Avastha.',
        functional: 'Yogakaraka (Prime Benefic) for Cancer and Leo Lagna.'
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
        exaltation: 'Virgo (Kanya) 15°',
        debilitation: 'Pisces (Meena) 15°',
        mooltrikona: 'Virgo 16°-20°',
        bodyParts: 'Skin, Nervous system, Speech, Lungs',
        traits: ['Analytical', 'Eloquent', 'Witty', 'Logical', 'Versatile'],
        deepDive: 'Budh is the messenger, ruling intellect, speech, and logic. It is highly adaptable, processing information and facilitating trade. It takes on the nature of the planets it associates with.',
        shadbala: 'Strongest in 1st House (Dik Bala). Peaks at dawn and twilight.',
        avastha: 'Neutral nature; its state depends entirely on association.',
        functional: 'Benefic for Gemini, Virgo, Taurus, and Libra Lagna.'
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
        exaltation: 'Cancer (Karka) 5°',
        debilitation: 'Capricorn (Makara) 5°',
        mooltrikona: 'Sagittarius 0°-10°',
        bodyParts: 'Liver, Fat, Hips, Arteries',
        traits: ['Ethical', 'Optimistic', 'Magnanimous', 'Wise', 'Generous'],
        deepDive: 'Guru is the Great Benefic and priest of the Gods. It represents Dharma, wisdom, and expansion. A strong Jupiter protects the individual from chart deficiencies through divine grace.',
        shadbala: 'Strongest in 1st House (Dik Bala). Highest natural beneficence.',
        avastha: 'Gives the most "Graceful" results in Trikona (1, 5, 9) houses.',
        functional: 'Benefic for Aries, Cancer, Leo, Scorpio, Sag, and Pisces.'
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
        exaltation: 'Pisces (Meena) 27°',
        debilitation: 'Virgo (Kanya) 27°',
        mooltrikona: 'Libra 0°-15°',
        bodyParts: 'Reproductive system, Eyes, Cheeks',
        traits: ['Artistic', 'Charming', 'Sociable', 'Aesthetic', 'Harmonious'],
        deepDive: 'Shukra is the master of material arts, ruling love, beauty, and luxury. It governs our ability to enjoy life and form partnerships. It is the primary significator of worldly happiness.',
        shadbala: 'Strongest in 4th House (Dik Bala). Strong during the night.',
        avastha: 'Creates the powerful "Malavya" Yoga when in Kendras.',
        functional: 'Yogakaraka (Prime Benefic) for Capricorn and Aquarius Lagna.'
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
        exaltation: 'Libra (Tula) 20°',
        debilitation: 'Aries (Mesha) 20°',
        mooltrikona: 'Aquarius 0°-20°',
        bodyParts: 'Knees, Joints, Teeth, Bones, Legs',
        traits: ['Persistent', 'Disciplined', 'Patient', 'Practical', 'Lawful'],
        deepDive: 'Shani is the Taskmaster, ensuring everyone receives the fruits of their Karma. While associated with delays, a strong Saturn creates unmatched spiritual endurance and a solid foundation.',
        shadbala: 'Strongest in 7th House (Dik Bala). High during the dark lunar half.',
        avastha: 'In Libra (Exaltation), it is in its most "Judicious" state.',
        functional: 'Yogakaraka (Prime Benefic) for Taurus and Libra Lagna.'
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
        deepDive: 'Rahu is the North Node, representing the karmic path we are heading towards. It creates smoky illusions and insatiable material desires, leading to sudden peak success or sharp falls.',
        shadbala: 'Always Retrograde. Gains strength from its house dispositor.',
        avastha: 'Amplifies results based on the nature of its planetary host.',
        functional: 'Gives results of its dispositor; behaves like "Saturn".'
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
        deepDive: 'Ketu is the South Node, representing past life baggage. Being headless, it rules intuition and detachment. It is the primary significator of Moksha (spiritual enlightenment).',
        shadbala: 'Always Retrograde. Strongest significator of liberation.',
        avastha: 'Bestows spiritual clarity, especially when with Jupiter.',
        functional: 'Benefic for spiritual growth; behaves like "Mars".'
    }
];

export default function PlanetsPage() {
    const [selectedPlanet, setSelectedPlanet] = useState(planets[0]);
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
                <div className="lg:w-[260px] flex-shrink-0 flex flex-col">
                    <div className="mb-2 px-1">
                        <Link href="/blogs" className="inline-flex items-center gap-1.5 text-secondary hover:text-secondary/70 transition-all mb-1 group">
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Library</span>
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                            Navagraha <span className="text-secondary italic">Archetypes</span>
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

                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30 px-2 mb-2">The Nine Planets</div>
                        <div className="grid grid-cols-6 lg:grid-cols-2 gap-1.5 sm:gap-2">
                            {planets.map((p) => {
                                const isActive = viewMode === 'detail' && selectedPlanet.id === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setSelectedPlanet(p);
                                            setViewMode('detail');
                                        }}
                                        className={`group flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all duration-200 ${isActive
                                                ? 'border-secondary bg-secondary/5'
                                                : 'border-transparent hover:bg-surface'
                                            }`}
                                    >
                                        <div className={`w-6 h-6 sm:w-8 sm:h-8 transition-transform duration-300 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`}>
                                            <PlanetIcon planet={p.id} size="w-full h-full" withGlow={false} />
                                        </div>
                                        <p className={`text-[10px] font-bold mt-1.5 truncate w-full text-center ${isActive ? 'text-secondary' : 'text-foreground/50'}`}>
                                            {p.nameEn}
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
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                transition={{ duration: 0.25 }}
                                className="h-full flex flex-col items-start p-2 lg:pt-0"
                            >
                                <Card padding="md" className="w-full h-auto max-h-[90vh] !rounded-[40px] border-outline-variant/20 bg-surface flex flex-col relative overflow-hidden" hoverable={false}>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-outline-variant/20 text-foreground/60 text-[10px] font-bold tracking-[0.25em] uppercase mb-3 w-fit">
                                        <BookOpen className="w-3 h-3" /> Core Concepts
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-2">
                                        Understanding the <span className="text-secondary italic">Navagraha</span>
                                    </h2>
                                    <p className="text-sm sm:text-base text-foreground/70 leading-relaxed max-w-3xl mb-6">
                                        In Vedic Astrology, the Navagraha (Nine Planets) are the cosmic agents of karma. They act as the dynamic forces that trigger events, shape your psychology, and guide the soul&apos;s evolutionary journey through time and space.
                                    </p>

                                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 flex-grow">
                                        {/* Column 1 */}
                                        <div className="space-y-6">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                    <Activity className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground mb-1">Karmic Deliverers</h4>
                                                    <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                        Planets don&apos;t just symbolize traits; they actively deliver the fruits of your past actions. Benefics like Jupiter and Venus bring ease and grace, while Malefics like Saturn and Mars enforce necessary, often difficult, lessons.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                    <Dna className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground mb-1">Avasthas (Planetary States)</h4>
                                                    <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                        A planet&apos;s power depends on its condition. An exalted planet expresses its highest, purest potential, while a debilitated planet signifies areas where the soul must work harder to overcome innate weaknesses.
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
                                                    <h4 className="text-base font-bold text-foreground mb-1">The Shadow Nodes</h4>
                                                    <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                        Rahu and Ketu are not physical masses, but mathematical points where eclipses occur. Despite lacking bodies, these nodes are profound triggers of sudden destiny, obsession, and ultimate spiritual liberation.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                    <Scale className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground mb-1">Functional Nature</h4>
                                                    <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                        Beyond natural traits, a planet acts as a friend or foe based on your specific Ascendant (Lagna). The same Saturn that brings hardship to an Aries lagna acts as a supreme benefactor for a Taurus lagna.
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
                                key={selectedPlanet.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                transition={{ duration: 0.4 }}
                                className="h-full flex flex-col items-start p-2 lg:pt-0"
                            >
                                <Card padding="none" className="w-full h-auto max-h-[90vh] !rounded-[40px] border-outline-variant/20 flex flex-col relative overflow-hidden bg-surface">
                                    <div className="absolute top-8 right-8 z-20">
                                        <button
                                            onClick={() => router.push('/kundli')}
                                            className="h-12 px-6 bg-gradient-to-r from-secondary to-secondary/80 text-background font-bold text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl flex items-center gap-3 shadow-xl shadow-secondary/20"
                                        >
                                            <Lock className="w-4 h-4 opacity-40" /> Analyze Alignment
                                        </button>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
                                    
                                    <div className="flex-grow p-8 lg:p-10 overflow-hidden flex flex-col">
                                        {/* ── Top Section: Massive Identity ── */}
                                        <div className="flex items-center gap-12 mb-8">
                                            <div className="w-[180px] h-[180px] relative shrink-0">
                                                <PlanetIcon planet={selectedPlanet.id} size="w-full h-full" withGlow={true} />
                                            </div>
                                            <div className="flex-grow space-y-6">
                                                <div className="flex items-baseline gap-4">
                                                    <h2 className="text-7xl font-bold text-foreground tracking-tighter leading-none">{selectedPlanet.nameEn}</h2>
                                                    <span className="text-4xl font-headline font-bold text-secondary italic opacity-80">— {selectedPlanet.nameHi}</span>
                                                </div>
                                                
                                                {/* Badges */}
                                                <div className="flex gap-3">
                                                    <span className="px-5 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-bold text-secondary uppercase tracking-widest">{selectedPlanet.nameSanskrit}</span>
                                                    <span className="px-5 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-bold text-secondary uppercase tracking-widest">{selectedPlanet.element} Element</span>
                                                </div>

                                                {/* Top Metrics Grid */}
                                                <div className="grid grid-cols-4 gap-8 pt-2">
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Nature</span>
                                                        <p className="text-[14px] font-bold text-foreground/90">{selectedPlanet.nature}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Element</span>
                                                        <p className="text-[14px] font-bold text-foreground/90">{selectedPlanet.element}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Core Essence</span>
                                                        <p className="text-[14px] font-bold text-foreground/90">{selectedPlanet.shadbala.split('.')[0]}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Biological</span>
                                                        <p className="text-[14px] font-bold text-secondary uppercase">{selectedPlanet.bodyParts}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Middle Section: Bento Grid ── */}
                                        <div className="grid grid-cols-12 gap-8 flex-grow">
                                            {/* Left: Archetype & Signatures */}
                                            <div className="col-span-7 space-y-8">
                                                <div className="space-y-4">
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                                                        <Info className="w-4 h-4" /> Cosmic Archetype
                                                    </h3>
                                                    <p className="text-[17px] font-light leading-relaxed text-foreground/80 pr-6">
                                                        {selectedPlanet.deepDive}
                                                    </p>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                                                        <Zap className="w-4 h-4" /> Signatures
                                                    </h3>
                                                    <div className="flex flex-wrap gap-3">
                                                        {selectedPlanet.traits.map(t => (
                                                            <span key={t} className="px-6 py-2.5 rounded-xl bg-surface border border-outline-variant/5 text-[12px] font-bold text-foreground/60 uppercase tracking-tight">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* ── New Section: Cosmic Wisdom ── */}
                                                <div className="pt-4 space-y-4">
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/5 relative overflow-hidden group">
                                                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                                                            <Sparkles className="w-24 h-24" />
                                                        </div>
                                                        <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2 mb-2">
                                                            <Activity className="w-4 h-4" /> Functional Impact
                                                        </h3>
                                                        <p className="text-[13px] font-medium text-foreground/70 leading-relaxed relative z-10">
                                                            {selectedPlanet.functional}
                                                        </p>
                                                        <div className="mt-4 pt-4 border-t border-outline-variant/5">
                                                            <p className="text-[11px] italic text-secondary/60">
                                                                Currently in <span className="font-bold uppercase tracking-wider">{selectedPlanet.avastha.split('"')[1] || 'Standard'}</span> Avastha
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Technical Stats Stack */}
                                            <div className="col-span-5 space-y-4">
                                                <div className="bg-secondary/5 rounded-[24px] p-5 border border-secondary/5">
                                                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <Shield className="w-4 h-4" /> Planetary Governance
                                                    </h3>
                                                    <p className="text-[14px] font-medium leading-relaxed text-foreground/90">
                                                        {selectedPlanet.represents}
                                                    </p>
                                                </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/5 shadow-sm">
                                                            <div className="flex items-center gap-2 mb-2 text-emerald-500">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                <span className="text-[9px] font-bold uppercase tracking-widest">Exaltation</span>
                                                            </div>
                                                            <p className="text-[15px] font-bold text-foreground">{selectedPlanet.exaltation.split('(')[0]}</p>
                                                            <span className="text-[9px] opacity-40 uppercase">Highest Potential</span>
                                                        </div>
                                                        <div className="bg-surface rounded-2xl p-5 border border-outline-variant/5 shadow-sm">
                                                            <div className="flex items-center gap-2 mb-2 text-red-500">
                                                                <AlertCircle className="w-4 h-4" />
                                                                <span className="text-[9px] font-bold uppercase tracking-widest">Debilitation</span>
                                                            </div>
                                                            <p className="text-[15px] font-bold text-foreground">{selectedPlanet.debilitation.split('(')[0]}</p>
                                                            <span className="text-[9px] opacity-40 uppercase">Lowest Vitality</span>
                                                        </div>
                                                    </div>
                                                <div className="bg-surface rounded-2xl p-5 border border-outline-variant/5 shadow-sm">
                                                    <div className="flex items-baseline justify-between mb-2">
                                                        <div className="flex items-center gap-2 text-secondary">
                                                            <Scale className="w-4 h-4" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest">Mooltrikona</span>
                                                        </div>
                                                        <span className="text-[8px] bg-secondary/10 text-secondary px-2 py-0.5 rounded uppercase font-bold">Primary Office</span>
                                                    </div>
                                                    <p className="text-[15px] font-bold text-foreground">{selectedPlanet.mooltrikona || 'Varies by position'}</p>
                                                </div>

                                                {/* ── Bottom Info (Moved into column) ── */}
                                                <div className="pt-2 flex items-center gap-3 opacity-80">
                                                    <div className="w-8 h-8 rounded-full bg-surface border border-outline-variant/5 flex items-center justify-center p-1.5 overflow-hidden shrink-0">
                                                        <PlanetIcon planet={selectedPlanet.id} size="w-full h-full" withGlow={false} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] font-bold text-foreground">Aligning with {selectedPlanet.nameEn}</p>
                                                        <p className="text-[9px] opacity-40 uppercase tracking-widest">Discover how this planet influences your chart</p>
                                                    </div>
                                                </div>
                                            </div>
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
}