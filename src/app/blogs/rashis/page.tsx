'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    ArrowLeft, Flame, Mountain, Wind, Droplets, 
    Compass, Users, Activity, Eye, Info, Sparkles,
    Shield, Target, Zap, Dna
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

const rashiData = [
    {
        id: 'aries',
        nameEn: 'Aries',
        nameHi: 'मेष',
        element: 'Fire (Agni)',
        guna: 'Movable (Chara)',
        gender: 'Male / Odd',
        dosha: 'Pitta',
        drishti: 'Leo, Scorpio, Aquarius',
        ruler: 'Mars',
        nature: 'The atmospheric logic of pure action and transformation. It initiates the zodiac cycle with fiery energy.',
        shakti: 'Shidravyapani (Power to reach/heal quickly)',
        symbol: 'Ram',
        deepDive: 'Aries is the 30° grid of environmental frequency where energy is most concentrated and directed. As a movable fire sign, it represents the "Big Bang" of the zodiac, dictating a logic of initiation, courage, and self-assertion.'
    },
    {
        id: 'taurus',
        nameEn: 'Taurus',
        nameHi: 'वृषभ',
        element: 'Earth (Prithvi)',
        guna: 'Fixed (Sthira)',
        gender: 'Female / Even',
        dosha: 'Kapha',
        drishti: 'Cancer, Libra, Capricorn',
        ruler: 'Venus',
        nature: 'The logic of stability and material foundation. It sustains the energy initiated by Aries.',
        shakti: 'Rohana (Power of growth and creation)',
        symbol: 'Bull',
        deepDive: 'Taurus provides the environmental stability needed for manifestation. Its fixed earth nature makes it resistant to erratic change, focusing instead on the accumulation of resources and the enjoyment of the physical realm.'
    },
    {
        id: 'gemini',
        nameEn: 'Gemini',
        nameHi: 'मिथुन',
        element: 'Air (Vayu)',
        guna: 'Dual (Dwisvabhava)',
        gender: 'Male / Odd',
        dosha: 'Vata',
        drishti: 'Virgo, Sagittarius, Pisces',
        ruler: 'Mercury',
        nature: 'The logic of intellect, movement, and exchange. It adapts and connects different frequencies.',
        shakti: 'Prinana (Power of satisfaction/delight)',
        symbol: 'Twins',
        deepDive: 'Gemini is the atmospheric frequency of communication. Its dual air nature allows it to bridge gaps between ideas and people, constantly seeking variety and intellectual stimulation.'
    },
    {
        id: 'cancer',
        nameEn: 'Cancer',
        nameHi: 'कर्क',
        element: 'Water (Jala)',
        guna: 'Movable (Chara)',
        gender: 'Female / Even',
        dosha: 'Kapha',
        drishti: 'Taurus, Scorpio, Aquarius',
        ruler: 'Moon',
        nature: 'The logic of emotion, intuition, and adaptability. It initiates the feeling layer of the zodiac.',
        shakti: 'Vasutva (Power of wealth/substance)',
        symbol: 'Crab',
        deepDive: 'Cancer represents the subconscious layer of the environment. It is the movable water sign that initiates emotional connection and nurturing, governed by the rhythm of the Moon.'
    },
    {
        id: 'leo',
        nameEn: 'Leo',
        nameHi: 'सिंह',
        element: 'Fire (Agni)',
        guna: 'Fixed (Sthira)',
        gender: 'Male / Odd',
        dosha: 'Pitta',
        drishti: 'Aries, Libra, Capricorn',
        ruler: 'Sun',
        nature: 'The logic of royal authority and sustained radiance. It is the center of the solar environment.',
        shakti: 'Tyagekshepana (Power to leave/transcend)',
        symbol: 'Lion',
        deepDive: 'Leo is the fixed fire sign that represents the peak of individual power. It dictates an environmental logic of leadership, creativity, and the projection of the self into the world.'
    },
    {
        id: 'virgo',
        nameEn: 'Virgo',
        nameHi: 'कन्या',
        element: 'Earth (Prithvi)',
        guna: 'Dual (Dwisvabhava)',
        gender: 'Female / Even',
        dosha: 'Vata',
        drishti: 'Gemini, Sagittarius, Pisces',
        ruler: 'Mercury',
        nature: 'The logic of precision, health, and service. It refines and adapts material reality.',
        shakti: 'Chayani (Power of accumulation/merit)',
        symbol: 'Maiden',
        deepDive: 'Virgo represents the environmental frequency of detail and purification. Its dual earth nature makes it the most analytical sign, focusing on the mechanics of the world and health.'
    },
    {
        id: 'libra',
        nameEn: 'Libra',
        nameHi: 'तुला',
        element: 'Air (Vayu)',
        guna: 'Movable (Chara)',
        gender: 'Male / Odd',
        dosha: 'Vata',
        drishti: 'Taurus, Leo, Aquarius',
        ruler: 'Venus',
        nature: 'The logic of balance, harmony, and social exchange. It initiates relationship dynamics.',
        shakti: 'Pradhvamsana (Power of change/scattering)',
        symbol: 'Scales',
        deepDive: 'Libra is the movable air sign that seeks to balance the environmental frequencies. It initiates social structures and partnerships, governed by the logic of fairness and aesthetics.'
    },
    {
        id: 'scorpio',
        nameEn: 'Scorpio',
        nameHi: 'वृश्चिक',
        element: 'Water (Jala)',
        guna: 'Fixed (Sthira)',
        gender: 'Female / Even',
        dosha: 'Kapha',
        drishti: 'Aries, Cancer, Capricorn',
        ruler: 'Mars / Ketu',
        nature: 'The logic of transformation, secrets, and intensity. It sustains deep emotional force.',
        shakti: 'Vyapana (Power to pervade/penetrate)',
        symbol: 'Scorpion',
        deepDive: 'Scorpio represents the environment of profound change and hidden power. Its fixed water nature makes it intensely focused on the underlying emotional and energetic currents of life.'
    },
    {
        id: 'sagittarius',
        nameEn: 'Sagittarius',
        nameHi: 'धनु',
        element: 'Fire (Agni)',
        guna: 'Dual (Dwisvabhava)',
        gender: 'Male / Odd',
        dosha: 'Pitta',
        drishti: 'Gemini, Virgo, Pisces',
        ruler: 'Jupiter',
        nature: 'The logic of higher wisdom, philosophy, and expansion. It adapts fiery energy into truth.',
        shakti: 'Radhana (Power to worship/succeed)',
        symbol: 'Archer',
        deepDive: 'Sagittarius is the dual fire sign that seeks the ultimate goal. It dictates an environmental logic of expansion, righteousness (Dharma), and the search for higher meaning.'
    },
    {
        id: 'capricorn',
        nameEn: 'Capricorn',
        nameHi: 'मकर',
        element: 'Earth (Prithvi)',
        guna: 'Movable (Chara)',
        gender: 'Female / Even',
        dosha: 'Vata',
        drishti: 'Taurus, Leo, Scorpio',
        ruler: 'Saturn',
        nature: 'The logic of structure, career, and karmic manifestation. It initiates long-term foundation.',
        shakti: 'Apradhrisya (Power of unchallengeable victory)',
        symbol: 'Sea-Goat',
        deepDive: 'Capricorn is the movable earth sign that initiates the climb to success. It represents the structural backbone of the environment, dictating discipline and material achievement.'
    },
    {
        id: 'aquarius',
        nameEn: 'Aquarius',
        nameHi: 'कुम्भ',
        element: 'Air (Vayu)',
        guna: 'Fixed (Sthira)',
        gender: 'Male / Odd',
        dosha: 'Vata',
        drishti: 'Aries, Cancer, Libra',
        ruler: 'Saturn / Rahu',
        nature: 'The logic of innovation, network, and collective wisdom. It sustains intellectual progress.',
        shakti: 'Bheshaja (Power of healing/100 physicians)',
        symbol: 'Water Bearer',
        deepDive: 'Aquarius represents the environmental frequency of the future and the collective. Its fixed air nature makes it a sustainer of visionary ideas and social systems.'
    },
    {
        id: 'pisces',
        nameEn: 'Pisces',
        nameHi: 'मीन',
        element: 'Water (Jala)',
        guna: 'Dual (Dwisvabhava)',
        gender: 'Female / Even',
        dosha: 'Kapha',
        drishti: 'Gemini, Virgo, Sagittarius',
        ruler: 'Jupiter',
        nature: 'The logic of completion, liberation, and spiritual depth. It adapts water into the infinite.',
        shakti: 'Kshirapani (Power of nourishment/wealth)',
        symbol: 'Fish',
        deepDive: 'Pisces is the final 30° grid, representing the environmental state of dissolution and Moksha. Its dual water nature allows it to bridge the gap between the material and the spiritual.'
    }
];

const elementIcons: Record<string, React.ElementType> = {
    'Fire (Agni)': Flame,
    'Earth (Prithvi)': Mountain,
    'Air (Vayu)': Wind,
    'Water (Jala)': Droplets
};

export default function RashisPage() {
    const [selectedRashi, setSelectedRashi] = useState(rashiData[0]);
    const router = useRouter();

    const Icon = elementIcons[selectedRashi.element] || Zap;

    return (
        <div className="min-h-screen bg-[var(--bg)] pt-20 pb-20 px-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-secondary/3 blur-[100px] rounded-full"></div>
            </div>

            <div className="max-w-[1500px] mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                        <Link href="/blogs" className="inline-flex items-center gap-2 group">
                            <ArrowLeft className="w-4 h-4 text-secondary group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary/60 group-hover:text-secondary transition-colors">Knowledge Center</span>
                        </Link>
                    </motion.div>
                    
                    <div className="text-right">
                        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">Rashi <span className="text-secondary italic">Frequencies</span></h1>
                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Phase 1: The Environmental Layer</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Navigation Sidebar */}
                    <div className="w-full lg:w-[240px] shrink-0 sticky lg:top-24 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-6 lg:grid-cols-2 gap-1.5 sm:gap-2">
                            {rashiData.map((rashi) => {
                                const isActive = selectedRashi.id === rashi.id;
                                const RashiIcon = elementIcons[rashi.element] || Zap;
                                return (
                                    <button
                                        key={rashi.id}
                                        onClick={() => setSelectedRashi(rashi)}
                                        className={`group flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all duration-200 ${isActive
                                                ? 'border-secondary bg-secondary/5'
                                                : 'border-transparent hover:bg-surface'
                                            }`}
                                    >
                                        <div className={`transition-transform duration-300 ${isActive ? 'scale-110 text-secondary' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`}>
                                            <RashiIcon className="w-6 h-6 sm:w-8 sm:h-8" />
                                        </div>
                                        <p className={`text-[10px] font-bold mt-1.5 truncate w-full text-center ${isActive ? 'text-secondary' : 'text-foreground/50'}`}>
                                            {rashi.nameEn}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Detail View */}
                    <div className="flex-1 w-full min-w-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={selectedRashi.id}
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
                                                    <Icon className="w-20 h-20 transition-transform duration-700 group-hover:scale-110" />
                                                    <div className="absolute bottom-0 left-0 right-0 bg-secondary/10 py-1 text-[10px] font-bold text-center uppercase tracking-widest">{selectedRashi.symbol}</div>
                                                </div>
                                            </div>

                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-4 mb-4">
                                                    <h2 className="text-6xl font-headline font-bold text-foreground">{selectedRashi.nameEn}</h2>
                                                    <span className="text-3xl text-secondary font-headline italic">— {selectedRashi.nameHi}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Ruler</p>
                                                        <p className="text-base font-bold text-secondary">{selectedRashi.ruler}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Element</p>
                                                        <p className="text-base font-bold text-foreground/80">{selectedRashi.element}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Quality</p>
                                                        <p className="text-base font-bold text-foreground/80">{selectedRashi.guna}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Dosha</p>
                                                        <p className="text-base font-bold text-secondary">{selectedRashi.dosha}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-12">
                                            <div className="space-y-8">
                                                <div>
                                                    <h3 className="text-[11px] font-bold text-secondary uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                                        <Dna className="w-4 h-4" />
                                                        Atmospheric Logic
                                                    </h3>
                                                    <p className="text-lg text-foreground/90 leading-relaxed font-light italic border-l-2 border-secondary/20 pl-6">
                                                        &quot;{selectedRashi.deepDive}&quot;
                                                    </p>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-surface border border-outline-variant/10 shadow-sm">
                                                    <h4 className="text-[10px] font-bold text-foreground/50 mb-3 uppercase tracking-widest">Fundamental Nature</h4>
                                                    <p className="text-[15px] text-foreground font-medium leading-relaxed">
                                                        {selectedRashi.nature}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="space-y-4">
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Users className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Gender / Polarity</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedRashi.gender}</span>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Zap className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Shakti (Inner Power)</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedRashi.shakti}</span>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between group">
                                                        <div className="flex items-center gap-3">
                                                            <Eye className="w-5 h-5 text-secondary/40 group-hover:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Rashi Drishti (Jaimini)</span>
                                                        </div>
                                                        <span className="text-[13px] font-bold text-foreground text-right">{selectedRashi.drishti}</span>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-3xl bg-surface border border-outline-variant/10 flex flex-col gap-4 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                                                            <Sparkles className="w-4 h-4 text-secondary" />
                                                        </div>
                                                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Integration Tip</p>
                                                    </div>
                                                    <p className="text-[13px] text-foreground/70 leading-relaxed italic">
                                                        When analyzing a chart, treat {selectedRashi.nameEn} as the environmental &quot;room&quot; where planets act. A planet in {selectedRashi.nameEn} must follow its {selectedRashi.element} and {selectedRashi.guna} logic.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-12 pt-8 border-t border-outline-variant/10 flex flex-col sm:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                    <Compass className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-headline font-bold text-foreground">Calculate Lagna (Ascendant)</h3>
                                                    <p className="text-[10px] text-foreground/40 tracking-wider uppercase font-bold">Discover your primary environmental frequency</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => router.push('/kundli')} variant="secondary" className="!px-8 !py-3 !rounded-2xl !font-bold">Generate Chart ✦</Button>
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

const ChevronRight = ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
