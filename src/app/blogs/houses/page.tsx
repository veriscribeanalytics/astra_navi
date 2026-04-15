'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    Gem, ArrowLeft, User, DollarSign, MessageSquare, Home, 
    Lightbulb, Shield, Heart, Eye, Compass, Briefcase, 
    TrendingUp, Sparkles, Star, ChevronRight, Info, 
    Scale, Activity, Lock, Target, Map
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
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
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
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-400/10',
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
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
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
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10',
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
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
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
        color: 'text-slate-500',
        bgColor: 'bg-slate-500/10',
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
        color: 'text-pink-500',
        bgColor: 'bg-pink-500/10',
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
        color: 'text-purple-600',
        bgColor: 'bg-purple-600/10',
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
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
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
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-500/10',
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
        color: 'text-orange-600',
        bgColor: 'bg-orange-600/10',
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
        color: 'text-violet-500',
        bgColor: 'bg-violet-500/10',
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
                            <ArrowLeft className="w-4 h-4 text-secondary group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/60 group-hover:text-secondary transition-colors">Knowledge Center</span>
                        </Link>
                    </motion.div>
                    
                    <div className="text-right">
                        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">The 12 <span className="text-secondary italic">Bhavas</span></h1>
                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Foundations of Existence</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Sidebar Navigation */}
                    <div className="w-full lg:w-[180px] shrink-0 sticky lg:top-24">
                        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-1 gap-3">
                            {houses.map((house) => (
                                <button
                                    key={house.id}
                                    onClick={() => setSelectedHouse(house)}
                                    className={`relative p-4 rounded-[24px] transition-all duration-300 flex items-center lg:flex-row flex-col gap-3 group overflow-hidden ${
                                        selectedHouse.id === house.id 
                                        ? 'bg-secondary text-white shadow-xl shadow-secondary/20 scale-105' 
                                        : 'bg-surface/40 hover:bg-surface/80 text-foreground/60 border border-outline-variant/20'
                                    }`}
                                >
                                    <div className={`shrink-0 transition-transform duration-500 group-hover:scale-110 ${selectedHouse.id === house.id ? 'text-white' : house.color}`}>
                                        {house.icon}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[11px] font-bold font-headline leading-none">{house.number}</p>
                                        <p className={`text-[8px] uppercase tracking-widest mt-1 hidden lg:block ${selectedHouse.id === house.id ? 'text-white/60' : 'text-foreground/30'}`}>
                                            {house.nameEn}
                                        </p>
                                    </div>
                                    {selectedHouse.id === house.id && (
                                        <motion.div 
                                            layoutId="house-active"
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
                                key={selectedHouse.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Main House Card */}
                                <Card padding="none" className="!rounded-[28px] border border-outline-variant/30 bg-surface/50 backdrop-blur-sm overflow-hidden">
                                    <div className="p-7 sm:p-8">
                                        {/* Hero Header — Horizontal */}
                                        <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-outline-variant/20">
                                            <div className="relative group shrink-0">
                                                <div className={`absolute inset-0 ${selectedHouse.bgColor} blur-[60px] rounded-full opacity-60`}></div>
                                                <div className={`w-24 h-24 lg:w-32 lg:h-32 rounded-[32px] ${selectedHouse.bgColor} border border-current/10 flex items-center justify-center ${selectedHouse.color} relative z-10 transition-transform duration-500 hover:scale-105 shadow-inner`}>
                                                    {selectedHouse.icon}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 text-center md:text-left">
                                                <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-4 mb-3">
                                                    <h2 className="text-4xl lg:text-5xl font-headline font-bold text-foreground">
                                                        {selectedHouse.number} House
                                                    </h2>
                                                    <span className="text-xl lg:text-2xl text-secondary font-headline italic">— {selectedHouse.sanskrit}</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Significator</p>
                                                        <p className="text-sm font-bold text-secondary">{selectedHouse.karaka}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Element</p>
                                                        <p className="text-sm font-bold text-foreground/80">{selectedHouse.element}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Classification</p>
                                                        <p className="text-sm font-bold text-secondary">{selectedHouse.nature}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-bold text-foreground/45 uppercase tracking-[0.2em]">Hindi Name</p>
                                                        <p className="text-sm font-bold text-foreground italic">{selectedHouse.nameHi}</p>
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
                                                        <Info className="w-3.5 h-3.5" />
                                                        Domain Overview
                                                    </h3>
                                                    <p className="text-[15px] text-foreground leading-[1.8] font-light italic border-l-2 border-secondary/20 pl-4">
                                                        {selectedHouse.deepDive}
                                                    </p>
                                                </div>

                                                <div>
                                                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] mb-4 flex items-center gap-1.5">
                                                        <Target className="w-3.5 h-3.5" />
                                                        Core Themes
                                                    </h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedHouse.traits.map((trait, idx) => (
                                                            <span key={idx} className="px-3.5 py-2 rounded-xl bg-secondary/8 border border-outline-variant/30 text-[11px] font-bold text-foreground hover:bg-secondary hover:text-white transition-all cursor-default">
                                                                {trait}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="p-5 rounded-2xl bg-surface/60 border border-outline-variant/20">
                                                    <h4 className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] mb-3">Physiology</h4>
                                                    <p className="text-xs font-bold text-foreground/90 leading-relaxed italic uppercase tracking-wider">
                                                        {selectedHouse.bodyParts}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Right Column */}
                                            <div className="space-y-5">
                                                {/* Governance Section */}
                                                <div className="p-5 rounded-2xl bg-secondary/5 border border-outline-variant/30 relative overflow-hidden group/card">
                                                    <div className="absolute top-0 right-0 p-3 opacity-10">
                                                        <Map className="w-12 h-12 text-secondary" />
                                                    </div>
                                                    <h4 className="text-[11px] font-bold text-foreground mb-3 uppercase tracking-wider">Life Governance</h4>
                                                    <p className="text-[13px] text-foreground font-medium leading-[1.7]">
                                                        {selectedHouse.represents}
                                                    </p>
                                                </div>

                                                {/* Auspiciousness Card */}
                                                <div className="p-5 rounded-2xl bg-surface/60 border border-outline-variant/20">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="w-1.5 h-6 bg-secondary rounded-full"></div>
                                                        <h4 className="text-[11px] font-bold text-secondary uppercase tracking-widest">Theoretical Influence</h4>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center pb-3 border-b border-outline-variant/10">
                                                            <span className="text-[10px] text-foreground/50 uppercase font-bold">Kalyana (Auspiciousness)</span>
                                                            <span className="text-xs font-bold text-foreground italic">{selectedHouse.id === '6th' || selectedHouse.id === '8th' || selectedHouse.id === '12th' ? 'Neutral/Malefic' : 'Benefic Body'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] text-foreground/50 uppercase font-bold">Karmic Weight</span>
                                                            <span className="text-xs font-bold text-foreground italic">{selectedHouse.element.split(' ')[0]} Focus</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Technical Specs */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-2xl bg-secondary/5 border border-outline-variant/20">
                                                        <p className="text-[9px] text-foreground/40 uppercase font-bold mb-1">Karaka</p>
                                                        <p className="text-xs font-bold text-secondary uppercase">{selectedHouse.karaka.split(' ')[0]}</p>
                                                    </div>
                                                    <div className="p-4 rounded-2xl bg-secondary/5 border border-outline-variant/20">
                                                        <p className="text-[9px] text-foreground/40 uppercase font-bold mb-1">Purushartha</p>
                                                        <p className="text-xs font-bold text-foreground uppercase">{selectedHouse.element.split(' ')[0]}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Integrated Footer: Personalized Insight */}
                                        <div className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl ${selectedHouse.bgColor} flex items-center justify-center border border-current/10 ${selectedHouse.color}`}>
                                                    <Scale className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-[13px] font-headline font-bold text-foreground">House Strength</h3>
                                                    <p className="text-[9px] text-foreground/40 tracking-wider uppercase font-bold">See which planets occupy your {selectedHouse.number} House</p>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => router.push('/kundli')}
                                                className="!px-6 !py-2 !rounded-xl !bg-secondary !text-white !font-extrabold !border-none hover:!scale-105 active:!scale-95 !min-h-0 flex items-center gap-2 group/btn w-full sm:w-auto justify-center"
                                            >
                                                {isLoggedIn ? (
                                                    <><span className="text-[11px]">View My Bhavas</span> <ChevronRight className="w-4 h-4" /></>
                                                ) : (
                                                    <><Lock className="w-3.5 h-3.5" /> <span className="text-[11px]">Calculate Strength</span></>
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
                    <p>Ancient Bhava Theory · Verified by AstraNavi Sages</p>
                </div>
            </div>
        </div>
    );
}
