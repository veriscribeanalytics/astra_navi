'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, Calendar, Flame, Droplets, Wind, Mountain, Lock, ArrowLeft, Star, Info, ChevronRight, Activity, Heart, Briefcase, DollarSign, Users, Zap, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DailyHoroscopeCard from '@/components/dashboard/DailyHoroscopeCard';

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
    const [selectedRashi, setSelectedRashi] = React.useState(rashiData[0]);
    const { isLoggedIn, user } = useAuth();
    const router = useRouter();

    const handleViewHoroscope = (rashiId: string) => {
        if (!isLoggedIn) {
            router.push('/login');
        } else {
            router.push(`/horoscope/${rashiId}`);
        }
    };

    const [horoscopeData, setHoroscopeData] = React.useState<any>(null);
    const [horoscopeLoading, setHoroscopeLoading] = React.useState(false);

    React.useEffect(() => {
        const fetchHoroscope = async () => {
            setHoroscopeLoading(true);
            try {
                // Determine if we should use general or personalized horoscope
                const endpoint = isLoggedIn && user?.email ? '/api/daily-horoscope' : '/api/horoscope-general';
                const queryParams = isLoggedIn && user?.email 
                    ? `email=${encodeURIComponent(user.email)}&sign=${encodeURIComponent(selectedRashi.nameEn)}`
                    : `sign=${encodeURIComponent(selectedRashi.nameEn)}`;
                
                const res = await fetch(`${endpoint}?${queryParams}`);
                if (res.ok) {
                    const data = await res.json();
                    setHoroscopeData(data);
                }
            } catch (err) {
                console.error("Failed to fetch horoscope for rashi page:", err);
            } finally {
                setHoroscopeLoading(false);
            }
        };

        if (selectedRashi) {
            fetchHoroscope();
        }
    }, [selectedRashi.id, isLoggedIn, user?.email]);

    return (
        <div className="min-h-screen bg-[var(--bg)] pt-[95px] px-2 sm:px-4 safe-bottom-buffer relative overflow-hidden flex flex-col items-center">
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
                                <span className="text-[12px] font-bold uppercase tracking-[0.2em]">Library</span>
                            </Link>
                            <h1 className="text-xl sm:text-2xl font-headline font-bold text-foreground leading-tight">
                                The 12 <span className="text-secondary italic">Rashis</span>
                            </h1>
                        </div>

                        {/* Button List - 6 columns on mobile, 2 columns on sidebar */}
                        <div className="grid grid-cols-6 lg:grid-cols-2 gap-1.5 sm:gap-2">
                            {rashiData.map((rashi) => (
                                <motion.button
                                    key={rashi.id}
                                    onClick={() => setSelectedRashi(rashi)}
                                    whileTap={{ scale: 0.95 }}
                                    className={`group flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all duration-200 ${
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
                                        className={`w-7 h-7 sm:w-9 sm:h-9 object-contain transition-transform duration-300 ${selectedRashi.id === rashi.id ? 'scale-110' : 'group-hover:scale-110'}`}
                                    />
                                    <p className={`text-[10px] sm:text-[12px] font-bold mt-1 truncate w-full text-center ${selectedRashi.id === rashi.id ? 'text-secondary' : 'text-foreground/50'}`}>
                                        {rashi.nameEn}
                                    </p>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Detail: Content (Right) */}
                <div className="flex-grow min-w-0 lg:mt-10">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={selectedRashi.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4 lg:space-y-6"
                        >
                            {/* ─── SYMMETRICAL DUAL-PANE BENTO HUB ─── */}
                            <Card padding="none" className="glass-panel overflow-hidden border-outline-variant/30">
                                <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-outline-variant/20">
                                    
                                    {/* LEFT PANE: Rashi Identity */}
                                    <div className="flex flex-col">
                                        {/* 1. Header (Aries) */}
                                        <div className="p-6 sm:p-8 h-[100px] sm:h-[120px] flex items-center border-b border-outline-variant/20 bg-surface/10">
                                            <div className="flex items-center gap-4">
                                                <div className="relative shrink-0">
                                                    <div className="absolute inset-0 bg-secondary/15 blur-[20px] rounded-full opacity-30"></div>
                                                    <Image src={selectedRashi.icon} alt={selectedRashi.nameEn} width={64} height={64} className="w-14 h-14 sm:w-16 sm:h-16 object-contain relative z-10" />
                                                </div>
                                                <div>
                                                    <div className="flex items-baseline gap-2">
                                                        <h2 className="text-2xl sm:text-3xl font-headline font-bold text-foreground tracking-tight">{selectedRashi.nameEn}</h2>
                                                        <span className="text-base text-secondary font-headline italic">— {selectedRashi.nameHi}</span>
                                                    </div>
                                                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/40">Cosmic Archetype</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Technical Vitals */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-outline-variant/20 h-[80px] sm:h-[100px]">
                                            {[
                                                { label: 'Lord', val: selectedRashi.rulingPlanet.split(' ')[0] },
                                                { label: 'Element', val: selectedRashi.element },
                                                { label: 'Quality', val: selectedRashi.quality.split(' ')[0] },
                                                { label: 'Symbol', val: selectedRashi.symbol }
                                            ].map((stat, i) => (
                                                <div key={i} className={`flex flex-col items-center justify-center p-2 ${i < 3 ? 'border-r' : ''} border-outline-variant/10 text-center`}>
                                                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.1em] mb-1">{stat.label}</span>
                                                    <span className="text-[14px] font-headline font-bold text-secondary">{stat.val}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* 3. Celestial Signature */}
                                        <div className="p-6 sm:p-8 border-b border-outline-variant/20 hover:bg-surface/10 transition-colors flex-grow">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                                                    <Sparkles className="w-3.5 h-3.5 text-secondary" />
                                                </div>
                                                <span className="text-[11px] font-bold text-foreground/40 uppercase tracking-[0.15em]">Celestial Signature</span>
                                            </div>
                                            <p className="text-[16px] sm:text-[18px] text-foreground/90 leading-relaxed font-light italic">
                                                "{selectedRashi.description}"
                                            </p>
                                        </div>

                                        {/* 4. Traits & Spirit */}
                                        <div className="p-6 sm:p-8 border-b border-outline-variant/20 hover:bg-surface/10 transition-colors">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Users className="w-3.5 h-3.5 text-primary" />
                                                </div>
                                                <span className="text-[11px] font-bold text-foreground/40 uppercase tracking-[0.15em]">Spirit & Traits</span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedRashi.traits.map((trait, idx) => (
                                                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-surface/40 border border-outline-variant/20 text-[11px] font-bold text-foreground/70 lowercase">
                                                        #{trait}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 5. Ideal Vocation */}
                                        <div className="p-6 sm:p-8 hover:bg-surface/10 transition-colors">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                                                    <Briefcase className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <span className="text-[11px] font-bold text-foreground/40 uppercase tracking-[0.15em]">Ideal Vocation</span>
                                            </div>
                                            <p className="text-[15px] sm:text-[16px] font-headline font-bold text-foreground leading-snug">
                                                {selectedRashi.career}
                                            </p>
                                        </div>
                                    </div>

                                    {/* RIGHT PANE: Daily Guidance */}
                                    <div className="flex flex-col">
                                        {/* 1. Header (Horoscope) - Height Matched to Left */}
                                        <div className="p-6 sm:p-8 h-[100px] sm:h-[120px] flex items-center border-b border-outline-variant/20 bg-surface/5">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <Sparkles className="w-5 h-5 text-secondary" />
                                                    <div>
                                                        <h2 className="text-xl sm:text-2xl font-headline font-bold text-foreground tracking-tight uppercase">Daily Horoscope</h2>
                                                        <p className="text-[10px] sm:text-[11px] font-bold text-foreground/40 uppercase tracking-[0.2em]">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                    </div>
                                                </div>
                                                {isLoggedIn && (
                                                    <div className="text-right">
                                                        <div className="label-sm text-foreground/40 mb-1">Status</div>
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 uppercase">Personalized</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {isLoggedIn || horoscopeData ? (
                                            <>
                                                {/* 2. Horoscope Vitals - Height Matched to Left */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-outline-variant/20 h-[80px] sm:h-[100px]">
                                                    {[
                                                        { label: 'Mood', val: horoscopeData?.mood || (horoscopeLoading ? '...' : 'Balanced') },
                                                        { label: 'Lucky Color', val: horoscopeData?.lucky_color || (horoscopeLoading ? '...' : 'Gold') },
                                                        { label: 'Lucky #', val: horoscopeData?.lucky_number || (horoscopeLoading ? '...' : '7') },
                                                        { label: 'Dominant', val: horoscopeData?.dominant_planet || (horoscopeLoading ? '...' : 'Sun') }
                                                    ].map((stat, i) => (
                                                        <div key={i} className={`flex flex-col items-center justify-center p-2 ${i < 3 ? 'border-r' : ''} border-outline-variant/10 text-center bg-surface/5`}>
                                                            <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.1em] mb-1">{stat.label}</span>
                                                            <span className={`text-[14px] font-headline font-bold ${horoscopeLoading ? 'animate-pulse text-foreground/20' : 'text-secondary'}`}>
                                                                {stat.val}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* 3. Guidance Grid - Content Mapped from API */}
                                                <div className="grid grid-cols-2 divide-x divide-y divide-outline-variant/10 flex-grow">
                                                    {[
                                                        { type: 'Career', icon: <Briefcase className="w-3.5 h-3.5 text-orange-400" />, text: horoscopeData?.career },
                                                        { type: 'Love', icon: <Heart className="w-3.5 h-3.5 text-rose-400" />, text: horoscopeData?.love },
                                                        { type: 'Health', icon: <Zap className="w-3.5 h-3.5 text-emerald-400" />, text: horoscopeData?.health },
                                                        { type: 'Finance', icon: <TrendingUp className="w-3.5 h-3.5 text-amber-400" />, text: horoscopeData?.finance }
                                                    ].map((item, idx) => (
                                                        <div key={idx} className={`p-5 sm:p-6 hover:bg-surface/10 transition-colors ${idx === 1 ? 'border-t-0' : ''} ${idx >= 2 ? 'border-l-0' : ''}`}>
                                                            <div className="flex items-center gap-2 mb-3">
                                                                {item.icon}
                                                                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{item.type}</span>
                                                            </div>
                                                            {horoscopeLoading ? (
                                                                <div className="space-y-2">
                                                                    <div className="h-3 bg-foreground/10 rounded w-full animate-pulse"></div>
                                                                    <div className="h-3 bg-foreground/10 rounded w-[80%] animate-pulse"></div>
                                                                </div>
                                                            ) : (
                                                                <p className="text-[13px] sm:text-[14px] text-foreground/70 leading-relaxed font-medium">
                                                                    {item.text || 'Insights flowing...'}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* 4. Tip of the Day - Live Feed */}
                                                <div className="p-8 bg-surface/10 flex flex-col items-center justify-center text-center">
                                                    <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
                                                        <Sparkles className="w-4 h-4 text-secondary" />
                                                    </div>
                                                    {horoscopeLoading ? (
                                                        <div className="h-4 bg-foreground/10 rounded w-48 animate-pulse"></div>
                                                    ) : (
                                                        <p className="text-[14px] sm:text-[16px] font-headline font-bold text-foreground italic max-w-sm">
                                                            "{horoscopeData?.tip || 'Follow the cosmic flow today.'}"
                                                        </p>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex-grow flex flex-col items-center justify-center p-12 text-center bg-surface/5">
                                                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-6 border border-secondary/20">
                                                    <Sparkles className="w-8 h-8 text-secondary animate-pulse" />
                                                </div>
                                                <h3 className="text-xl font-headline font-bold text-foreground mb-3">Unlock Daily Forecast</h3>
                                                <Button onClick={() => router.push('/login')} variant="secondary" className="px-8 py-3 rounded-xl font-bold border-secondary/20 uppercase tracking-widest text-[11px]">
                                                    Access Guidance ✦
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </AnimatePresence>

                    <p className="text-center mt-12 text-[12px] text-foreground/15 font-bold tracking-[0.3em] uppercase">
                        Designed by the Sages of AstraNavi
                    </p>
                </div>
            </div>
        </div>
    );
}

