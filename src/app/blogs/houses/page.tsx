'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    ArrowLeft, User, DollarSign, MessageSquare, Home, 
    Lightbulb, Shield, Heart, Eye, Compass, Briefcase, 
    TrendingUp, Sparkles, Activity, Lock, Dna, Zap, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

const houses = [
    {
        id: '1st',
        number: '1st',
        nameEn: 'Self',
        nameHi: 'Lagna',
        sanskrit: 'Tanu Bhava',
        icon: <User className="w-8 h-8" />,
        represents: 'Physical body, personality, ego, vitality, overall life direction, character.',
        karaka: 'Sun (Surya)',
        element: 'Dharma (Purpose)',
        bodyParts: 'Head, Brain, Face',
        nature: 'Kendra (Cornerstone)',
        deepDive: 'The 1st house is the most critical house in a birth chart. It signifies the start of life and the "lens" through which the soul interacts with the world. It determines how others perceive you and your physical strength.',
        traits: ['Vitality', 'Presence', 'Body', 'Persona', 'Origin']
    },
    {
        id: '2nd',
        number: '2nd',
        nameEn: 'Wealth',
        nameHi: 'Dhana',
        sanskrit: 'Dhana Bhava',
        icon: <DollarSign className="w-8 h-8" />,
        represents: 'Earned wealth, savings, speech, family, upbringing, initial education, food.',
        karaka: 'Jupiter (Guru)',
        element: 'Artha (Resources)',
        bodyParts: 'Eyes, Mouth, Speech, Neck',
        nature: 'Panapara (Succedent)',
        deepDive: 'The 2nd house represents what you possess. It is not just about money, but also about the values you hold and the family you are born into. It governs your ability to accumulate resources.',
        traits: ['Savings', 'Family', 'Speech', 'Education', 'Lineage']
    },
    {
        id: '3rd',
        number: '3rd',
        nameEn: 'Courage',
        nameHi: 'Sahaj',
        sanskrit: 'Parakrama Bhava',
        icon: <MessageSquare className="w-8 h-8" />,
        represents: 'Brotherhood, willpower, skills, communication, hearing, short travels, initiative.',
        karaka: 'Mars (Mangal)',
        element: 'Kama (Desire)',
        bodyParts: 'Hands, Ears, Arms, Shoulders',
        nature: 'Apoklima (Cadent)',
        deepDive: 'This is the house of self-effort. It shows your level of bravery and your ability to work with your hands. It also rules over your siblings and your capacity for creative expression through communication.',
        traits: ['Willpower', 'Siblings', 'Effort', 'Media', 'Travel']
    },
    {
        id: '4th',
        number: '4th',
        nameEn: 'Home',
        nameHi: 'Matrubhava',
        sanskrit: 'Sukha Bhava',
        icon: <Home className="w-8 h-8" />,
        represents: 'Mother, home comfort, property, vehicles, mental peace, formal education.',
        karaka: 'Moon (Chandra)',
        element: 'Moksha (Liberation)',
        bodyParts: 'Chest, Heart, Lungs',
        nature: 'Kendra (Angular)',
        deepDive: 'The 4th house represents the sanctuary of your heart. It shows the quality of your domestic life and the relationship with your mother. It reflects your inner stability and emotional contentment.',
        traits: ['Mother', 'Peace', 'Property', 'Inward', 'Roots']
    },
    {
        id: '5th',
        number: '5th',
        nameEn: 'Creativity',
        nameHi: 'Putra',
        sanskrit: 'Suta Bhava',
        icon: <Lightbulb className="w-8 h-8" />,
        represents: 'Children, creativity, deep intellect, romance, past life merits, speculation.',
        karaka: 'Jupiter (Guru)',
        element: 'Dharma (Purpose)',
        bodyParts: 'Upper Abdomen, Stomach',
        nature: 'Trikona (Trine)',
        deepDive: 'The 5th house is the house of Purva Punya (past live merits). It shows your creative intelligence and your ability to pass on your legacy. It governs romance and the joy one derives from creation.',
        traits: ['Intellect', 'Children', 'Karma', 'Romance', 'Creation']
    },
    {
        id: '6th',
        number: '6th',
        nameEn: 'Service',
        nameHi: 'Ripu',
        sanskrit: 'Ripu Bhava',
        icon: <Shield className="w-8 h-8" />,
        represents: 'Service, health, debts, enemies, daily routine, pets, competition.',
        karaka: 'Mars/Saturn',
        element: 'Artha (Resources)',
        bodyParts: 'Lower Abdomen, Intestines',
        nature: 'Dusthana (Difficult)',
        deepDive: 'The 6th house represents the challenges of daily existence. It shows how you deal with obstacles and enemies. It is essential for understanding your health and your capacity for selfless service.',
        traits: ['Discipline', 'Health', 'Debts', 'Labor', 'Victors']
    },
    {
        id: '7th',
        number: '7th',
        nameEn: 'Partnership',
        nameHi: 'Yuvati',
        sanskrit: 'Kalatra Bhava',
        icon: <Heart className="w-8 h-8" />,
        represents: 'Marriage, relationships, business partner, public life, legal contracts.',
        karaka: 'Venus (Shukra)',
        element: 'Kama (Desire)',
        bodyParts: 'Kidneys, Reproductive system',
        nature: 'Kendra (Angular)',
        deepDive: 'The 7th house is the mirror of the self. It shows everyone you deal with in the public sphere, especially your spouse. It represents balance and the ability to maintain harmony in relationships.',
        traits: ['Marriage', 'Others', 'Contract', 'Spouse', 'Mirror']
    },
    {
        id: '8th',
        number: '8th',
        nameEn: 'Mystery',
        nameHi: 'Ayush',
        sanskrit: 'Mrityu Bhava',
        icon: <Eye className="w-8 h-8" />,
        represents: 'Longevity, transformation, mysteries, occult, insurance, legacies.',
        karaka: 'Saturn (Shani)',
        element: 'Moksha (Liberation)',
        bodyParts: 'Private organs, Bladder',
        nature: 'Dusthana (Difficult)',
        deepDive: 'The 8th house is the house of transformation and hidden secrets. It governs research, the occult, and sudden shifts in life. It reveals your lifespan and the resources you receive from others.',
        traits: ['Change', 'Legacy', 'Secret', 'Occult', 'Long Life']
    },
    {
        id: '9th',
        number: '9th',
        nameEn: 'Fortune',
        nameHi: 'Bhagya',
        sanskrit: 'Dharma Bhava',
        icon: <Compass className="w-8 h-8" />,
        represents: 'Fortune, father, pilgrims, religion, higher education, teacher, luck.',
        karaka: 'Sun/Jupiter',
        element: 'Dharma (Purpose)',
        bodyParts: 'Hips, Thighs',
        nature: 'Trikona (Trine)',
        deepDive: 'The 9th house is the house of Grace. It shows your devotion to your Guru and God. A strong 9th house indicates divine protection and a sense of purpose that guides you through life.',
        traits: ['Luck', 'Guru', 'Wisdom', 'Ethics', 'Tirtha']
    },
    {
        id: '10th',
        number: '10th',
        nameEn: 'Career',
        nameHi: 'Karma',
        sanskrit: 'Karma Bhava',
        icon: <Briefcase className="w-8 h-8" />,
        represents: 'Career, status, power, reputation, public work, achievements.',
        karaka: 'Sun/Mer/Sat/Jup',
        element: 'Artha (Resources)',
        bodyParts: 'Knees',
        nature: 'Kendra (Angular)',
        deepDive: 'The 10th house is the highest point in your chart. It signifies your professional contribution to the world and the status you achieve. It is the house of duty and public recognition.',
        traits: ['Status', 'Career', 'Legion', 'Karma', 'Action']
    },
    {
        id: '11th',
        number: '11th',
        nameEn: 'Gains',
        nameHi: 'Labha',
        sanskrit: 'Labha Bhava',
        icon: <TrendingUp className="w-8 h-8" />,
        represents: 'Gains, fulfillment of desires, income, network, siblings (elder).',
        karaka: 'Jupiter (Guru)',
        element: 'Kama (Desire)',
        bodyParts: 'Legs, Ankles',
        nature: 'Upachaya (Growing)',
        deepDive: 'The 11th house represents the realization of your dreams. It shows what you gain from your career and the social circles you belong to. It is the most auspicious house for material growth.',
        traits: ['Wins', 'Gains', 'Network', 'Prosperity', 'DREAMS']
    },
    {
        id: '12th',
        number: '12th',
        nameEn: 'Liberation',
        nameHi: 'Vyaya',
        sanskrit: 'Vyaya Bhava',
        icon: <Sparkles className="w-8 h-8" />,
        represents: 'Losses, spiritual liberation, meditation, isolation, foreign land.',
        karaka: 'Saturn/Ketu',
        element: 'Moksha (Liberation)',
        bodyParts: 'Feet, Left Eye',
        nature: 'Dusthana (Difficult)',
        deepDive: 'The 12th house represents the end of cycles. It rules over sleep, the subconscious, and detachment. While it signify expenses, it is the ultimate house for spiritual transcendence and letting go.',
        traits: ['Release', 'Spirit', 'Abroad', 'Subconscious', 'Moksha']
    }
];

export default function HousesPage() {
    const [selectedHouse, setSelectedHouse] = useState(houses[0]);
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
                            The 12 <span className="text-secondary italic">Bhavas</span>
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

                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30 px-2 mb-2">The 12 Bhavas</div>
                        <div className="grid grid-cols-6 lg:grid-cols-2 gap-1.5 sm:gap-2">
                            {houses.map((house) => {
                                const isActive = viewMode === 'detail' && selectedHouse.id === house.id;
                                return (
                                    <button
                                        key={house.id}
                                        onClick={() => {
                                            setSelectedHouse(house);
                                            setViewMode('detail');
                                        }}
                                        className={`group flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all duration-200 ${isActive
                                                ? 'border-secondary bg-secondary/5'
                                                : 'border-transparent hover:bg-surface'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${isActive ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary group-hover:bg-secondary/20'}`}>
                                            {house.id}
                                        </div>
                                        <p className={`text-[10px] font-bold mt-1.5 truncate w-full text-center ${isActive ? 'text-secondary' : 'text-foreground/50'}`}>
                                            {house.nameEn}
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
                                transition={{ duration: 0.4 }}
                                className="h-full flex flex-col items-start p-2 lg:pt-0"
                            >
                                <Card padding="md" className="w-full h-auto max-h-[90vh] !rounded-[40px] border-outline-variant/20 bg-surface flex flex-col relative overflow-hidden" hoverable={false}>
                                    <div className="p-8 lg:p-10 flex-grow flex flex-col">
                                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-outline-variant/20 text-foreground/60 text-[10px] font-bold tracking-[0.25em] uppercase mb-3 w-fit">
                                            <BookOpen className="w-3 h-3" /> Core Concepts
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-2">
                                            Understanding the <span className="text-secondary italic">Bhavas</span>
                                        </h2>
                                        <p className="text-sm sm:text-base text-foreground/70 leading-relaxed max-w-3xl mb-6">
                                            In Vedic Astrology, the 12 Houses (Bhavas) represent the 12 domains of human life. While planets provide the energy and signs provide the environment, the houses are the actual fields of experience where karma is enacted.
                                        </p>

                                        <div className="grid md:grid-cols-2 gap-x-8 gap-y-6 flex-grow">
                                            {/* Column 1 */}
                                            <div className="space-y-6">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                        <Activity className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground mb-1">Kendra (Angular) Houses</h4>
                                                        <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                            Houses 1, 4, 7, and 10 form the pillars of life. They govern self, home, partnerships, and career. Planets placed here have the maximum power to shape your worldly existence and initiate massive action.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                        <Dna className="w-5 h-5 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground mb-1">Trikona (Trinal) Houses</h4>
                                                        <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                            Houses 1, 5, and 9 are the houses of Dharma and pure blessing. They represent past life merits (Purva Punya), intelligence, and divine grace. Planets here provide natural luck and spiritual evolution.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Column 2 */}
                                            <div className="space-y-6">
                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                        <Shield className="w-5 h-5 text-rose-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground mb-1">Dusthana (Difficult) Houses</h4>
                                                        <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                            Houses 6, 8, and 12 govern obstacles, transformation, and loss. While challenging for material pursuits, they are essential for burning karma, building resilience, and achieving ultimate spiritual liberation (Moksha).
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                        <TrendingUp className="w-5 h-5 text-amber-500" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-base font-bold text-foreground mb-1">Upachaya (Growing) Houses</h4>
                                                        <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                            Houses 3, 6, 10, and 11 represent areas of life that improve over time through conscious effort. Malefic planets (Saturn, Mars, Sun) placed here actually give excellent results as they provide the drive to overcome competition.
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
                                key={selectedHouse.id}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.25 }}
                            className="h-full flex flex-col items-start p-2 lg:pt-0"
                        >
                            <Card padding="none" className="w-full h-auto max-h-[90vh] !rounded-[40px] border-outline-variant/20 flex flex-col relative overflow-hidden bg-surface">
                                    <div className="absolute top-8 right-8 z-20">
                                        <button
                                            onClick={() => router.push('/kundli')}
                                            className="h-12 px-6 bg-gradient-to-r from-secondary to-secondary/80 text-background font-bold text-[11px] uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all rounded-xl flex items-center gap-3 shadow-xl shadow-secondary/20"
                                        >
                                            <Lock className="w-4 h-4 opacity-40" /> Analyze House
                                        </button>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
                                    
                                    <div className="flex-grow p-8 lg:p-10 overflow-hidden flex flex-col">
                                        {/* ── Top Section: Massive Identity ── */}
                                        <div className="flex items-center gap-12 mb-8">
                                            <div className="w-[150px] h-[150px] bg-surface border border-secondary/20 rounded-[40px] flex items-center justify-center text-secondary relative z-10 shadow-xl shrink-0 group">
                                                <div className="scale-[2.5] transition-transform duration-700 group-hover:scale-[2.8]">{selectedHouse.icon}</div>
                                            </div>
                                            <div className="flex-grow space-y-6">
                                                <div className="flex items-baseline gap-4">
                                                    <h2 className="text-6xl font-bold text-foreground tracking-tighter leading-none">{selectedHouse.nameEn}</h2>
                                                    <span className="text-3xl font-headline font-bold text-secondary italic opacity-80">— {selectedHouse.nameHi}</span>
                                                </div>
                                                
                                                {/* Top Metrics Grid */}
                                                <div className="grid grid-cols-4 gap-8 pt-2">
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Sanskrit</span>
                                                        <p className="text-[14px] font-bold text-foreground/90">{selectedHouse.sanskrit}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Significator</span>
                                                        <p className="text-[14px] font-bold text-foreground/90">{selectedHouse.karaka}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Nature</span>
                                                        <p className="text-[14px] font-bold text-foreground/90 uppercase">{selectedHouse.nature}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-[10px] opacity-40 uppercase tracking-widest mb-1 block">Body Matrix</span>
                                                        <p className="text-[14px] font-bold text-secondary uppercase">{selectedHouse.bodyParts}</p>
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
                                                        <BookOpen className="w-4 h-4" /> House Essence
                                                    </h3>
                                                    <p className="text-[16px] font-light leading-relaxed text-foreground/80 pr-6">
                                                        {selectedHouse.deepDive}
                                                    </p>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                                                        <Zap className="w-4 h-4" /> Dominions
                                                    </h3>
                                                    <div className="flex flex-wrap gap-3">
                                                        {selectedHouse.traits.map(t => (
                                                            <span key={t} className="px-5 py-2 rounded-xl bg-surface border border-outline-variant/5 text-[11px] font-bold text-foreground/60 uppercase tracking-tight">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="col-span-5 space-y-4">
                                                <div className="bg-secondary/5 rounded-[24px] p-5 border border-secondary/5">
                                                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <Shield className="w-4 h-4" /> Life Governance
                                                    </h3>
                                                    <p className="text-[14px] font-medium leading-relaxed text-foreground/90">
                                                        {selectedHouse.represents}
                                                    </p>
                                                </div>

                                                <div className="p-6 rounded-3xl bg-surface border border-outline-variant/10 shadow-sm flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                                        <Compass className="w-5 h-5 text-secondary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-bold text-foreground">Bhava Mechanics</p>
                                                        <p className="text-[11px] text-foreground/50 leading-tight">
                                                            {selectedHouse.id === '6th' || selectedHouse.id === '8th' || selectedHouse.id === '12th' ? 'Dusthana house - center of karmic clearance.' : 'Ken/Trikona - center of worldly fulfillment.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Bottom Section ── */}
                                        <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                    <Dna className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-foreground">Bhavat Bhavam Logic</h3>
                                                    <p className="text-[10px] text-foreground/40 uppercase tracking-widest font-bold">How {selectedHouse.nameEn} affects derivative life domains</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => router.push('/chat')} variant="secondary" className="!px-6 !py-2.5 !rounded-xl !font-bold !text-[11px]">Analyze Alignment ✦</Button>
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
