'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    Gem, ArrowLeft, User, DollarSign, MessageSquare, Home, 
    Lightbulb, Shield, Heart, Eye, Compass, Briefcase, 
    TrendingUp, Sparkles, ChevronRight, Info, 
    Scale, Activity, Lock, Target, Map, Dna, Zap, BookOpen,
    CheckCircle2, AlertCircle
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
        <div className="h-screen bg-[var(--bg)] pt-16 lg:pt-20 pb-4 px-4 overflow-hidden flex flex-col items-center">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-secondary/3 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1700px] w-full mx-auto relative z-10 flex flex-col lg:flex-row gap-4 h-full">
                {/* ── Sidebar ── */}
                <div className="lg:w-[220px] flex-shrink-0 flex flex-col h-full border-r border-outline-variant/10 pr-3">
                    <div className="mb-4 px-1 shrink-0">
                        <Link href="/blogs" className="inline-flex items-center gap-1.5 text-secondary hover:text-secondary/70 transition-all mb-1 group">
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            <span className="label-sm">Knowledge Center</span>
                        </Link>
                        <h1 className="text-2xl font-bold text-foreground leading-tight">
                            The 12 <span className="text-secondary italic">Bhavas</span>
                        </h1>
                    </div>

                    <div className="flex-grow overflow-y-auto scrollbar-hide pb-6">
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
                        <div className="flex flex-col gap-2">
                            {houses.map((house) => {
                                const isActive = viewMode === 'detail' && selectedHouse.id === house.id;
                                return (
                                    <button
                                        key={house.id}
                                        onClick={() => {
                                            setSelectedHouse(house);
                                            setViewMode('detail');
                                        }}
                                        className={`relative p-3 rounded-[20px] transition-all duration-300 flex items-center gap-3 group border ${
                                            isActive 
                                            ? 'bg-secondary text-white shadow-lg border-secondary' 
                                            : 'bg-surface hover:bg-surface text-foreground/60 border-outline-variant/10'
                                        } shadow-sm`}
                                    >
                                        <div className="text-left flex-1">
                                            <p className="text-[13px] font-bold font-headline">{house.nameEn}</p>
                                            <p className={`text-[9px] uppercase tracking-widest mt-0.5 ${isActive ? 'text-white/60' : 'text-foreground/30'}`}>
                                                {house.nameHi}
                                            </p>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'translate-x-1' : 'opacity-0'}`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Detail Panel ── */}
                <div className="flex-grow min-w-0 h-full overflow-hidden">
                    <AnimatePresence mode="wait">
                        {viewMode === 'encyclopedia' && (
                            <motion.div
                                key="encyclopedia"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                transition={{ duration: 0.25 }}
                                className="h-full flex items-start justify-center p-2 lg:pt-10"
                            >
                                <Card padding="md" className="w-full h-auto max-h-[90vh] !rounded-[40px] border-outline-variant/20 bg-surface flex flex-col relative overflow-hidden" hoverable={false}>
                                    <div className="p-6 lg:p-8 flex-grow flex flex-col">
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
                            className="h-full flex items-center justify-center p-4 lg:p-6"
                        >
                            <Card padding="none" className="w-full h-full max-h-[820px] !rounded-[40px] border-outline-variant/30 flex flex-col relative overflow-hidden bg-surface">                                <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
                                
                                <div className="flex-grow p-6 lg:p-8 overflow-hidden">
                                    <div className="max-w-[1400px] mx-auto space-y-4 lg:space-y-6">
                                        
                                        {/* ── Top Header: Identity (Tightened) ── */}
                                        <div className="flex items-center gap-8 border-b border-outline-variant/10 pb-4">
                                            <div className="w-[100px] h-[100px] bg-surface/40 rounded-3xl flex items-center justify-center text-secondary border border-outline-variant/10 relative shrink-0">
                                                <div className="scale-[2]">{selectedHouse.icon}</div>
                                            </div>
                                            <div className="flex-grow space-y-1.5">
                                                <div className="flex items-baseline gap-4">
                                                    <h2 className="text-5xl font-bold text-foreground tracking-tighter leading-none">{selectedHouse.nameEn}</h2>
                                                    <span className="text-2xl font-headline font-bold text-secondary italic opacity-80">— {selectedHouse.nameHi}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-6 gap-y-1">
                                                    {[
                                                        { label: 'Sanskrit', val: selectedHouse.sanskrit },
                                                        { label: 'Element', val: selectedHouse.element },
                                                        { label: 'Nature', val: selectedHouse.nature.split(' ')[0] },
                                                        { label: 'Body Matrix', val: selectedHouse.bodyParts }
                                                    ].map((item, i) => (
                                                        <div key={i} className="flex flex-col">
                                                            <span className="text-[8px] opacity-40 uppercase tracking-widest">{item.label}</span>
                                                            <span className="text-[12px] font-bold text-foreground/90">{item.val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Main Bento Grid ── */}
                                        <div className="grid grid-cols-12 gap-4 lg:gap-6">
                                            
                                            {/* Left Column: Narrative & Signatures */}
                                            <div className="col-span-7 space-y-4">
                                                <div className="space-y-2">
                                                    <h3 className="label-sm text-secondary flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> House Essence</h3>
                                                    <p className="text-[15px] lg:text-[16px] font-light leading-snug text-foreground/80 pr-6">
                                                        {selectedHouse.deepDive}
                                                    </p>
                                                </div>

                                                <div className="space-y-3 pt-2">
                                                    <h3 className="label-sm opacity-40 flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Dominions</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedHouse.traits.map(t => (
                                                            <span key={t} className="text-[10px] font-bold px-3.5 py-1.5 rounded-lg bg-surface text-foreground/60 border border-outline-variant/10 uppercase tracking-tight">{t}</span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-4 border-t border-outline-variant/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                                            <Info className="w-4 h-4 text-secondary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[13px] font-bold text-foreground">Analyzing Bhavat Bhavam</p>
                                                            <p className="text-[10px] opacity-40 uppercase tracking-widest">How {selectedHouse.nameEn} affects derivative life domains</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Column: Technical Specials */}
                                            <div className="col-span-5 space-y-3">
                                                <div className="bg-surface/30 rounded-[20px] p-5 border border-outline-variant/10">
                                                    <h3 className="label-sm mb-3 text-secondary/70 uppercase tracking-widest flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> Life Governance</h3>
                                                    <p className="text-[14px] font-medium leading-tight text-foreground/90">{selectedHouse.represents}</p>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
                                                        <div className="flex items-center gap-2 mb-1.5 text-emerald-500">
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span className="text-[9px] font-bold uppercase">Karaka</span>
                                                        </div>
                                                        <p className="text-[13px] font-bold text-foreground">{selectedHouse.karaka}</p>
                                                        <span className="text-[9px] opacity-40 leading-none">Significator</span>
                                                    </div>
                                                    <div className="bg-secondary/5 rounded-xl p-4 border border-secondary/20">
                                                        <div className="flex items-center gap-2 mb-1.5 text-secondary">
                                                            <Activity className="w-3.5 h-3.5" />
                                                            <span className="text-[9px] font-bold uppercase">Classification</span>
                                                        </div>
                                                        <p className="text-[13px] font-bold text-foreground">{selectedHouse.nature}</p>
                                                        <span className="text-[9px] opacity-40 leading-none">Category</span>
                                                    </div>
                                                </div>

                                                <div className="bg-surface/40 rounded-xl p-4 border border-outline-variant/10 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity">
                                                        <Zap className="w-10 h-10" />
                                                    </div>
                                                    <div className="flex items-center gap-2 mb-1.5 text-secondary">
                                                        <Zap className="w-3.5 h-3.5" />
                                                        <span className="text-[9px] font-bold uppercase">Mechanics</span>
                                                    </div>
                                                    <p className="text-[12px] font-bold text-foreground">
                                                        {selectedHouse.id === '6th' || selectedHouse.id === '8th' || selectedHouse.id === '12th' ? 'Dusthana house - center of karmic clearance.' : 'Ken/Trikona - center of worldly fulfillment.'}
                                                    </p>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>

                                {/* ── Bottom Footer (Slim & Anchored) ── */}
                                <div className="px-8 py-4 bg-surface border-t border-outline-variant/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-7 h-7 rounded bg-surface flex items-center justify-center border border-outline-variant/10">
                                            <Dna className="w-3.5 h-3.5 text-secondary/60" />
                                        </div>
                                        <p className="text-[11px] font-medium text-foreground/40 italic">
                                            Synthesizing the potential of {selectedHouse.nameEn} in your chart...
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => router.push('/kundli')}
                                        className="h-11 px-8 bg-secondary text-background font-bold text-[12px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all rounded-xl flex items-center gap-3 shadow-xl shadow-secondary/20"
                                    >
                                        Analyze Potentials <ChevronRight className="w-4 h-4" />
                                    </button>
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
