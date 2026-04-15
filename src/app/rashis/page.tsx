'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Calendar, Flame, Droplets, Wind, Mountain, Lock, ArrowLeft, Star, Info, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Vedic Astrology Rashi Data
const rashiData = [
    {
        id: 'aries',
        nameEn: 'Aries',
        nameHi: 'मेष',
        nameSanskrit: 'Mesha',
        icon: '/icons/rashi/aries.png',
        element: 'Fire',
        elementIcon: <Flame className="w-4 h-4" />,
        quality: 'Movable (Chara)',
        rulingPlanet: 'Mars (Mangal)',
        dates: 'Apr 13 - May 14',
        symbol: 'The Ram',
        description: 'Mesha Rashi represents courage, leadership, and pioneering spirit. Those born under this sign are natural warriors with strong willpower and determination.',
        traits: ['Courageous', 'Energetic', 'Pioneering', 'Independent', 'Competitive'],
        strengths: 'Natural leaders with boundless energy and enthusiasm. Excel in initiating new projects and taking bold actions.',
        challenges: 'May be impulsive and impatient. Need to learn patience and consider consequences before acting.',
        career: 'Military, sports, entrepreneurship, surgery, engineering',
        compatibility: 'Leo, Sagittarius, Gemini, Aquarius',
        luckyGem: 'Red Coral (Moonga)',
        deity: 'Lord Hanuman',
        bodyParts: 'Head, brain, face'
    },
    {
        id: 'taurus',
        nameEn: 'Taurus',
        nameHi: 'वृषभ',
        nameSanskrit: 'Vrishabha',
        icon: '/icons/rashi/taurus.png',
        element: 'Earth',
        elementIcon: <Mountain className="w-4 h-4" />,
        quality: 'Fixed (Sthira)',
        rulingPlanet: 'Venus (Shukra)',
        dates: 'May 15 - Jun 14',
        symbol: 'The Bull',
        description: 'Vrishabha Rashi embodies stability, sensuality, and material comfort. These natives value security and have a strong connection to earthly pleasures.',
        traits: ['Reliable', 'Patient', 'Practical', 'Devoted', 'Artistic'],
        strengths: 'Steadfast and dependable with excellent taste. Natural ability to accumulate wealth and create beauty.',
        challenges: 'Can be stubborn and resistant to change. May become too attached to material possessions.',
        career: 'Banking, agriculture, arts, music, luxury goods, real estate',
        compatibility: 'Virgo, Capricorn, Cancer, Pisces',
        luckyGem: 'Diamond (Heera)',
        deity: 'Goddess Lakshmi',
        bodyParts: 'Neck, throat, vocal cords'
    },
    {
        id: 'gemini',
        nameEn: 'Gemini',
        nameHi: 'मिथुन',
        nameSanskrit: 'Mithuna',
        icon: '/icons/rashi/gemini.png',
        element: 'Air',
        elementIcon: <Wind className="w-4 h-4" />,
        quality: 'Dual (Dvisvabhava)',
        rulingPlanet: 'Mercury (Budha)',
        dates: 'Jun 15 - Jul 14',
        symbol: 'The Twins',
        description: 'Mithuna Rashi represents communication, intellect, and versatility. These individuals are quick-witted and adaptable with diverse interests.',
        traits: ['Communicative', 'Intellectual', 'Adaptable', 'Curious', 'Witty'],
        strengths: 'Excellent communicators with sharp minds. Can handle multiple tasks and adapt to any situation.',
        challenges: 'May lack focus and consistency. Tendency to be superficial or scattered in approach.',
        career: 'Writing, journalism, teaching, sales, technology, media',
        compatibility: 'Libra, Aquarius, Aries, Leo',
        luckyGem: 'Emerald (Panna)',
        deity: 'Lord Krishna',
        bodyParts: 'Arms, shoulders, lungs'
    },
    {
        id: 'cancer',
        nameEn: 'Cancer',
        nameHi: 'कर्क',
        nameSanskrit: 'Karka',
        icon: '/icons/rashi/cancer.png',
        element: 'Water',
        elementIcon: <Droplets className="w-4 h-4" />,
        quality: 'Movable (Chara)',
        rulingPlanet: 'Moon (Chandra)',
        dates: 'Jul 15 - Aug 14',
        symbol: 'The Crab',
        description: 'Karka Rashi embodies emotions, nurturing, and intuition. These natives are deeply connected to family and home with strong emotional intelligence.',
        traits: ['Nurturing', 'Intuitive', 'Emotional', 'Protective', 'Loyal'],
        strengths: 'Highly empathetic and caring. Strong intuition and ability to create emotional security for others.',
        challenges: 'Can be overly sensitive and moody. May struggle with letting go of past hurts.',
        career: 'Hospitality, nursing, psychology, real estate, food industry',
        compatibility: 'Scorpio, Pisces, Taurus, Virgo',
        luckyGem: 'Pearl (Moti)',
        deity: 'Goddess Parvati',
        bodyParts: 'Chest, breasts, stomach'
    },
    {
        id: 'leo',
        nameEn: 'Leo',
        nameHi: 'सिंह',
        nameSanskrit: 'Simha',
        icon: '/icons/rashi/leo.png',
        element: 'Fire',
        elementIcon: <Flame className="w-4 h-4" />,
        quality: 'Fixed (Sthira)',
        rulingPlanet: 'Sun (Surya)',
        dates: 'Aug 15 - Sep 15',
        symbol: 'The Lion',
        description: 'Simha Rashi represents royalty, creativity, and self-expression. These individuals possess natural charisma and leadership qualities.',
        traits: ['Confident', 'Generous', 'Creative', 'Dramatic', 'Loyal'],
        strengths: 'Natural leaders with magnetic personality. Excel in creative fields and inspiring others.',
        challenges: 'Can be egotistical and domineering. Need to balance pride with humility.',
        career: 'Politics, entertainment, management, luxury brands, creative arts',
        compatibility: 'Aries, Sagittarius, Gemini, Libra',
        luckyGem: 'Ruby (Manik)',
        deity: 'Lord Narasimha',
        bodyParts: 'Heart, spine, upper back'
    },
    {
        id: 'virgo',
        nameEn: 'Virgo',
        nameHi: 'कन्या',
        nameSanskrit: 'Kanya',
        icon: '/icons/rashi/virgo.png',
        element: 'Earth',
        elementIcon: <Mountain className="w-4 h-4" />,
        quality: 'Dual (Dvisvabhava)',
        rulingPlanet: 'Mercury (Budha)',
        dates: 'Sep 16 - Oct 16',
        symbol: 'The Maiden',
        description: 'Kanya Rashi embodies purity, service, and analytical thinking. These natives are detail-oriented perfectionists with strong work ethic.',
        traits: ['Analytical', 'Practical', 'Helpful', 'Modest', 'Meticulous'],
        strengths: 'Excellent problem-solvers with keen eye for detail. Natural healers and service-oriented individuals.',
        challenges: 'Can be overly critical and perfectionist. May worry excessively about small details.',
        career: 'Healthcare, accounting, research, editing, quality control',
        compatibility: 'Taurus, Capricorn, Cancer, Scorpio',
        luckyGem: 'Emerald (Panna)',
        deity: 'Goddess Durga',
        bodyParts: 'Digestive system, intestines'
    },
    {
        id: 'libra',
        nameEn: 'Libra',
        nameHi: 'तुला',
        nameSanskrit: 'Tula',
        icon: '/icons/rashi/libra.png',
        element: 'Air',
        elementIcon: <Wind className="w-4 h-4" />,
        quality: 'Movable (Chara)',
        rulingPlanet: 'Venus (Shukra)',
        dates: 'Oct 17 - Nov 15',
        symbol: 'The Scales',
        description: 'Tula Rashi represents balance, harmony, and relationships. These individuals seek fairness and beauty in all aspects of life.',
        traits: ['Diplomatic', 'Charming', 'Fair-minded', 'Social', 'Artistic'],
        strengths: 'Natural diplomats with refined taste. Excel in creating harmony and maintaining relationships.',
        challenges: 'Can be indecisive and people-pleasing. May avoid confrontation at the cost of authenticity.',
        career: 'Law, diplomacy, fashion, interior design, counseling, arts',
        compatibility: 'Gemini, Aquarius, Leo, Sagittarius',
        luckyGem: 'Diamond (Heera)',
        deity: 'Goddess Parvati',
        bodyParts: 'Kidneys, lower back, skin'
    },
    {
        id: 'scorpio',
        nameEn: 'Scorpio',
        nameHi: 'वृश्चिक',
        nameSanskrit: 'Vrishchika',
        icon: '/icons/rashi/scorpio.png',
        element: 'Water',
        elementIcon: <Droplets className="w-4 h-4" />,
        quality: 'Fixed (Sthira)',
        rulingPlanet: 'Mars (Mangal)',
        dates: 'Nov 16 - Dec 15',
        symbol: 'The Scorpion',
        description: 'Vrishchika Rashi embodies intensity, transformation, and mystery. These natives possess deep emotional power and investigative abilities.',
        traits: ['Intense', 'Passionate', 'Resourceful', 'Mysterious', 'Determined'],
        strengths: 'Powerful transformative abilities with deep insight. Excel in research and uncovering hidden truths.',
        challenges: 'Can be secretive and vengeful. Need to learn forgiveness and trust.',
        career: 'Investigation, surgery, psychology, occult sciences, research',
        compatibility: 'Cancer, Pisces, Virgo, Capricorn',
        luckyGem: 'Red Coral (Moonga)',
        deity: 'Lord Ganesha',
        bodyParts: 'Reproductive organs, excretory system'
    },
    {
        id: 'sagittarius',
        nameEn: 'Sagittarius',
        nameHi: 'धनु',
        nameSanskrit: 'Dhanu',
        icon: '/icons/rashi/sagittarius.png',
        element: 'Fire',
        elementIcon: <Flame className="w-4 h-4" />,
        quality: 'Dual (Dvisvabhava)',
        rulingPlanet: 'Jupiter (Guru)',
        dates: 'Dec 16 - Jan 13',
        symbol: 'The Archer',
        description: 'Dhanu Rashi represents wisdom, philosophy, and expansion. These individuals are seekers of truth with optimistic outlook on life.',
        traits: ['Optimistic', 'Philosophical', 'Adventurous', 'Honest', 'Generous'],
        strengths: 'Natural teachers and philosophers with broad vision. Excel in higher learning and spiritual pursuits.',
        challenges: 'Can be tactless and over-confident. May promise more than they can deliver.',
        career: 'Teaching, law, publishing, travel, religion, philosophy',
        compatibility: 'Aries, Leo, Libra, Aquarius',
        luckyGem: 'Yellow Sapphire (Pukhraj)',
        deity: 'Lord Vishnu',
        bodyParts: 'Hips, thighs, liver'
    },
    {
        id: 'capricorn',
        nameEn: 'Capricorn',
        nameHi: 'मकर',
        nameSanskrit: 'Makara',
        icon: '/icons/rashi/capricorn.png',
        element: 'Earth',
        elementIcon: <Mountain className="w-4 h-4" />,
        quality: 'Movable (Chara)',
        rulingPlanet: 'Saturn (Shani)',
        dates: 'Jan 14 - Feb 12',
        symbol: 'The Goat',
        description: 'Makara Rashi embodies discipline, ambition, and responsibility. These natives are hardworking achievers with strong sense of duty.',
        traits: ['Disciplined', 'Ambitious', 'Responsible', 'Patient', 'Practical'],
        strengths: 'Excellent organizational skills with long-term vision. Natural ability to build lasting structures.',
        challenges: 'Can be pessimistic and rigid. May become workaholic at expense of personal life.',
        career: 'Administration, construction, mining, politics, traditional business',
        compatibility: 'Taurus, Virgo, Scorpio, Pisces',
        luckyGem: 'Blue Sapphire (Neelam)',
        deity: 'Lord Shiva',
        bodyParts: 'Knees, bones, joints'
    },
    {
        id: 'aquarius',
        nameEn: 'Aquarius',
        nameHi: 'कुम्भ',
        nameSanskrit: 'Kumbha',
        icon: '/icons/rashi/aquarius.png',
        element: 'Air',
        elementIcon: <Wind className="w-4 h-4" />,
        quality: 'Fixed (Sthira)',
        rulingPlanet: 'Saturn (Shani)',
        dates: 'Feb 13 - Mar 14',
        symbol: 'The Water Bearer',
        description: 'Kumbha Rashi represents innovation, humanitarianism, and independence. These individuals are progressive thinkers with unique perspectives.',
        traits: ['Innovative', 'Humanitarian', 'Independent', 'Intellectual', 'Unconventional'],
        strengths: 'Visionary thinking with strong social consciousness. Excel in technology and social reform.',
        challenges: 'Can be detached and rebellious. May struggle with emotional intimacy.',
        career: 'Technology, social work, science, aviation, astrology',
        compatibility: 'Gemini, Libra, Aries, Sagittarius',
        luckyGem: 'Blue Sapphire (Neelam)',
        deity: 'Lord Varuna',
        bodyParts: 'Ankles, circulatory system'
    },
    {
        id: 'pisces',
        nameEn: 'Pisces',
        nameHi: 'मीन',
        nameSanskrit: 'Meena',
        icon: '/icons/rashi/pisces.png',
        element: 'Water',
        elementIcon: <Droplets className="w-4 h-4" />,
        quality: 'Dual (Dvisvabhava)',
        rulingPlanet: 'Jupiter (Guru)',
        dates: 'Mar 15 - Apr 12',
        symbol: 'The Fish',
        description: 'Meena Rashi embodies spirituality, compassion, and imagination. These natives are deeply intuitive with strong connection to the divine.',
        traits: ['Compassionate', 'Intuitive', 'Artistic', 'Spiritual', 'Selfless'],
        strengths: 'Highly empathetic with strong spiritual inclination. Natural healers and artists.',
        challenges: 'Can be escapist and overly idealistic. May struggle with boundaries and practical matters.',
        career: 'Healing arts, music, spirituality, charity work, film, poetry',
        compatibility: 'Cancer, Scorpio, Taurus, Capricorn',
        luckyGem: 'Yellow Sapphire (Pukhraj)',
        deity: 'Lord Vishnu',
        bodyParts: 'Feet, lymphatic system'
    }
];

const elementColors = {
    Fire: 'bg-secondary/10 border-secondary/20 text-secondary',
    Earth: 'bg-secondary/10 border-secondary/20 text-secondary',
    Air: 'bg-secondary/10 border-secondary/20 text-secondary',
    Water: 'bg-secondary/10 border-secondary/20 text-secondary'
};

export default function RashisPage() {
    const [selectedRashi, setSelectedRashi] = useState(rashiData[0]);
    const { isLoggedIn } = useAuth();
    const router = useRouter();

    const handleViewHoroscope = (rashiId: string) => {
        if (!isLoggedIn) {
            router.push('/login');
        } else {
            router.push(`/horoscope/${rashiId}`);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg)] pt-20 pb-12 px-4 relative overflow-hidden flex flex-col items-center">
            {/* Immersive Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-secondary/5 to-transparent"></div>
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="max-w-[1500px] w-full mx-auto relative z-10 flex flex-col lg:flex-row gap-5">
                {/* Master: Sidebar (Left) */}
                <div className="lg:w-[200px] flex-shrink-0">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="sticky top-20 space-y-3"
                    >
                        {/* Header */}
                        <div className="mb-4 px-1">
                            <Link href="/blogs" className="inline-flex items-center gap-1.5 text-secondary hover:text-secondary/70 transition-all mb-2 group">
                                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Library</span>
                            </Link>
                            <h1 className="text-2xl font-headline font-bold text-foreground leading-tight">
                                The 12 <span className="text-secondary italic">Rashis</span>
                            </h1>
                        </div>

                        {/* Button List - 2 columns with icon + name */}
                        <div className="grid grid-cols-4 lg:grid-cols-2 gap-1.5 overflow-y-auto scrollbar-hide">
                            {rashiData.map((rashi) => (
                                <button
                                    key={rashi.id}
                                    onClick={() => setSelectedRashi(rashi)}
                                    className={`group flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all duration-200 ${
                                        selectedRashi.id === rashi.id
                                            ? 'border-secondary bg-secondary/10 ring-1 ring-secondary/10'
                                            : 'border-outline-variant/20 bg-surface/40 backdrop-blur-sm hover:border-secondary/30 hover:bg-surface/60'
                                    }`}
                                >
                                    <Image
                                        src={rashi.icon}
                                        alt={rashi.nameEn}
                                        width={36}
                                        height={36}
                                        className={`w-9 h-9 object-contain transition-transform duration-300 ${selectedRashi.id === rashi.id ? 'scale-110' : 'group-hover:scale-110'}`}
                                    />
                                    <p className={`text-[9px] font-bold mt-1 truncate w-full text-center ${selectedRashi.id === rashi.id ? 'text-secondary' : 'text-foreground/50'}`}>
                                        {rashi.nameEn}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Detail: Content (Right) */}
                <div className="flex-grow min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={selectedRashi.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {/* Main Card */}
                            <Card padding="none" className="!rounded-[28px] border border-outline-variant/30 bg-surface/50 backdrop-blur-sm overflow-hidden">
                                <div className="p-7 sm:p-8">
                                    {/* Hero Header — Horizontal */}
                                    <div className="flex flex-col md:flex-row items-center md:items-center gap-6 mb-8 pb-8 border-b border-outline-variant/20">
                                        <div className="relative group shrink-0">
                                            <div className="absolute inset-0 bg-secondary/15 blur-[60px] rounded-full opacity-50"></div>
                                            <Image
                                                src={selectedRashi.icon}
                                                alt={selectedRashi.nameEn}
                                                width={140}
                                                height={140}
                                                className="w-28 h-28 lg:w-36 lg:h-36 object-contain relative z-10 transition-transform duration-500 hover:scale-105"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 text-center md:text-left">
                                            <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-3 mb-3">
                                                <h2 className="text-4xl lg:text-5xl font-headline font-bold text-foreground">
                                                    {selectedRashi.nameEn}
                                                </h2>
                                                <span className="text-xl lg:text-2xl text-secondary font-headline italic">— {selectedRashi.nameHi}</span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-4">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Sanskrit</p>
                                                    <p className="text-sm font-bold text-secondary">{selectedRashi.nameSanskrit}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Dates</p>
                                                    <p className="text-sm font-bold text-foreground/80">{selectedRashi.dates}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Element</p>
                                                    <p className="text-sm font-bold text-secondary">{selectedRashi.elementIcon} {selectedRashi.element}</p>
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Ruling Lord</p>
                                                    <p className="text-sm font-bold text-foreground italic">{selectedRashi.rulingPlanet.split(' ')[0]}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content Grid */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* Left Column — stretches to match right */}
                                        <div className="flex flex-col gap-5">
                                            <div>
                                                <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] mb-3 flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                                                    Cosmic Signature
                                                </h3>
                                                <p className="text-[15px] text-foreground leading-[1.8] font-light italic border-l-2 border-secondary/20 pl-4">
                                                    {selectedRashi.description}
                                                </p>
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] mb-3 flex items-center gap-1.5">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
                                                    Core Traits
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedRashi.traits.map((trait, idx) => (
                                                        <span key={idx} className="px-3.5 py-2 rounded-xl bg-secondary/8 border border-outline-variant/30 text-[11px] font-bold text-foreground hover:bg-secondary hover:text-white transition-all cursor-default">
                                                            {trait}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="p-5 rounded-2xl bg-secondary/5 border border-outline-variant/20">
                                                <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] mb-2">Vocation</h4>
                                                <p className="text-xs font-bold text-foreground/90 leading-relaxed italic uppercase tracking-wider">
                                                    {selectedRashi.career}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-4">
                                            {/* Strengths & Challenges */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-4 rounded-2xl bg-secondary/5 border border-outline-variant/30 hover:border-secondary/40 transition-all">
                                                    <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-2">
                                                        <Sparkles className="w-3.5 h-3.5" />
                                                    </div>
                                                    <h4 className="text-[11px] font-bold text-foreground mb-1">Strengths</h4>
                                                    <p className="text-[10px] text-foreground font-medium leading-snug">{selectedRashi.strengths}</p>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-secondary/5 border border-outline-variant/30 hover:border-secondary/40 transition-all">
                                                    <div className="w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-2">
                                                        <Info className="w-3.5 h-3.5" />
                                                    </div>
                                                    <h4 className="text-[11px] font-bold text-foreground mb-1">Karmic Hurdles</h4>
                                                    <p className="text-[10px] text-foreground font-medium leading-snug">{selectedRashi.challenges}</p>
                                                </div>
                                            </div>

                                            {/* Technical Attributes */}
                                            <div className="p-4 rounded-2xl bg-surface/60 border border-outline-variant/20">
                                                <h4 className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] mb-3">Technical Attributes</h4>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                                    <div>
                                                        <p className="text-[9px] text-foreground/50 uppercase tracking-wider font-bold">Planet</p>
                                                        <p className="text-sm font-bold text-foreground">{selectedRashi.rulingPlanet}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] text-foreground/50 uppercase tracking-wider font-bold">Quality</p>
                                                        <p className="text-sm font-bold text-foreground">{selectedRashi.quality}</p>
                                                    </div>
                                                    {!isLoggedIn ? (
                                                        <div className="col-span-2 mt-1 p-2.5 rounded-xl bg-secondary/5 border border-secondary/15 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Lock className="w-3.5 h-3.5 text-secondary/40" />
                                                                <p className="text-[9px] text-foreground/40 font-bold uppercase tracking-wider">Login for more</p>
                                                            </div>
                                                            <Button size="sm" onClick={() => router.push('/login')} className="!text-[9px] !px-4 !py-1.5 !min-h-0">Login ✦</Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div>
                                                                <p className="text-[9px] text-foreground/50 uppercase tracking-wider font-bold">Symbol</p>
                                                                <p className="text-sm font-bold text-foreground">{selectedRashi.symbol}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] text-foreground/50 uppercase tracking-wider font-bold">Affinity</p>
                                                                <p className="text-[11px] font-bold text-foreground/80 italic">{selectedRashi.compatibility}</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Integrated Footer: Today's Alignment */}
                                    <div className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center border border-foreground/10">
                                                <Calendar className="w-5 h-5 text-foreground/70" />
                                            </div>
                                            <div>
                                                <h3 className="text-[13px] font-headline font-bold text-foreground">Today's Alignment</h3>
                                                <p className="text-[9px] text-foreground/40 tracking-wider uppercase font-bold">Daily insights · {selectedRashi.nameEn}</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => handleViewHoroscope(selectedRashi.id)}
                                            className="!px-6 !py-2 !rounded-xl !bg-secondary !text-white !font-extrabold !border-none hover:!scale-105 active:!scale-95 !min-h-0 flex items-center gap-2 group/btn w-full sm:w-auto justify-center"
                                        >
                                            {isLoggedIn ? (
                                                <><span className="text-[11px]">View Horoscope</span> <ChevronRight className="w-4 h-4" /></>
                                            ) : (
                                                <><Lock className="w-3.5 h-3.5" /> <span className="text-[11px]">Unlock</span></>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </Card>


                        </motion.div>
                    </AnimatePresence>

                    <p className="text-center mt-8 text-[9px] text-foreground/15 font-bold tracking-[0.3em] uppercase">
                        Designed by the Sages of AstraNavi
                    </p>
                </div>
            </div>
        </div>
    );
}

