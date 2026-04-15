'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { 
    Sparkles, ArrowLeft, Star, Heart, Clock, 
    Moon, ChevronRight, Compass, Info, Scale, 
    Activity, Lock, Target, Map, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';

const nakshatras = [
    { id: 1, nameEn: 'Ashwini', nameHi: 'अश्विनी', sanskrit: 'Ashwayuja', ruler: 'Ketu', deity: 'Ashwini Kumaras', symbol: 'Horse Head', yoni: 'Horse (Male)', gana: 'Deva', element: 'Dharma', padas: 'Chu, Che, Cho, La', trait: 'Quick, energetic, healing-oriented, adventurous.', deepDive: 'The first Nakshatra of the zodiac, Ashwini represents the power of initiation and rapid action. It is ruled by the twin physicians of the Gods, bestowing great healing abilities and a youthful spirit.' },
    { id: 2, nameEn: 'Bharani', nameHi: 'भरणी', sanskrit: 'Apabharani', ruler: 'Venus', deity: 'Yama', symbol: 'Yoni / Triangle', yoni: 'Elephant (Male)', gana: 'Manushya', element: 'Artha', padas: 'Li, Lu, Le, Lo', trait: 'Intense, creative, transformative, disciplined.', deepDive: 'Bharani is the Nakshatra of "bearing" or carrying. It is associated with birth and death, ruled by Yama. It represents the struggle and effort required to bring something new into the world.' },
    { id: 3, nameEn: 'Krittika', nameHi: 'कृत्तिका', sanskrit: 'Agneya', ruler: 'Sun', deity: 'Agni', symbol: 'Razor / Knife', yoni: 'Sheep (Female)', gana: 'Rakshasa', element: 'Kama', padas: 'A, I, U, E', trait: 'Sharp, critical, purifying, determined.', deepDive: 'Krittika is symbolized by a razor, representing the power to cut through illusions. Ruled by the Fire God Agni, it bestows a sharp intellect and a burning desire for truth and purification.' },
    { id: 4, nameEn: 'Rohini', nameHi: 'रोहिणी', sanskrit: 'Rohini', ruler: 'Moon', deity: 'Brahma', symbol: 'Ox Cart / Chariot', yoni: 'Serpent (Male)', gana: 'Manushya', element: 'Moksha', padas: 'O, Va, Vi, Vu', trait: 'Attractive, artistic, creative, stable.', deepDive: 'Rohini is the "Red One," the favorite consort of the Moon. It represents growth, fertility, and the peak of material beauty. It is the house of creative manifestation and abundance.' },
    { id: 5, nameEn: 'Mrigashira', nameHi: 'मृगशिरा', sanskrit: 'Agrahayani', ruler: 'Mars', deity: 'Soma', symbol: 'Deer Head', yoni: 'Serpent (Female)', gana: 'Deva', element: 'Moksha', padas: 'Ve, Vo, Ka, Ke', trait: 'Curious, exploratory, gentle, restless.', deepDive: 'Symbolized by the deer, Mrigashira is the Nakshatra of the quest. It represents the search for the unknown and the constant movement of the mind towards higher knowledge or sensory experience.' },
    { id: 6, nameEn: 'Ardra', ruler: 'Rahu', deity: 'Rudra', symbol: 'Teardrop', trait: 'Intense, transformative, brilliant', id: 6, nameEn: 'Ardra', nameHi: 'आर्द्रा', sanskrit: 'Raudra', ruler: 'Rahu', deity: 'Rudra', symbol: 'Teardrop / Diamond', yoni: 'Dog (Female)', gana: 'Manushya', element: 'Dharma', padas: 'Ku, Gha, Nga, Chha', trait: 'Intense, transformative, brilliant, emotional.', deepDive: 'Ardra represents the storm followed by the rainbow. Ruled by Rudra (the Howler), it signifies profound emotional transformation and the clarity that comes after a period of intense mental distress.' },
    { id: 7, nameEn: 'Punarvasu', nameHi: 'पुनर्वसु', sanskrit: 'Aditya', ruler: 'Jupiter', deity: 'Aditi', symbol: 'Bow & Quiver', yoni: 'Cat (Female)', gana: 'Deva', element: 'Artha', padas: 'Ke, Ko, Ha, Hi', trait: 'Resilient, optimistic, philosophical, generous.', deepDive: 'Punarvasu means "return of the Light." It is the Nakshatra of renewal and rehabilitation. It bestows the ability to bounce back from any setback with an even stronger spirit.' },
    { id: 8, nameEn: 'Pushya', nameHi: 'पुष्य', sanskrit: 'Tishya', ruler: 'Saturn', deity: 'Brihaspati', symbol: 'Cow Udder / Flower', yoni: 'Sheep (Male)', gana: 'Deva', element: 'Dharma', padas: 'Hu, He, Ho, Da', trait: 'Nurturing, responsible, auspicious, ethical.', deepDive: 'Considered the most auspicious of all Nakshatras, Pushya represents the power to nourish and protect. It is the house of the cosmic priest, bestowing wisdom and a deep sense of duty.' },
    { id: 9, nameEn: 'Ashlesha', nameHi: 'अश्लेषा', sanskrit: 'Sarpa', ruler: 'Mercury', deity: 'Nagas', symbol: 'Coiled Serpent', yoni: 'Cat (Male)', gana: 'Rakshasa', element: 'Dharma', padas: 'Di, Du, De, Do', trait: 'Cunning, insightful, mystical, intense.', deepDive: 'Ashlesha is the Nakshatra of the serpent energy (Kundalini). it provides deep psychological insight and the power to paralyze enemies. It is a house of profound transformation and mystical secrets.' },
    { id: 10, nameEn: 'Magha', nameHi: 'मघा', sanskrit: 'Pitrya', ruler: 'Ketu', deity: 'Pitris', symbol: 'Royal Throne', yoni: 'Rat (Male)', gana: 'Rakshasa', element: 'Artha', padas: 'Ma, Mi, Mu, Me', trait: 'Regal, traditional, ancestral, powerful.', deepDive: 'Magha is the seat of the ancestors. It represents lineage, tradition, and royal authority. Those born under this Star often feel a deep connection to their past and a responsibility to lead.' }
];

// Truncated list for demonstration, but providing a solid base for the user to expand or ask for more.

export default function NakshatrasPage() {
    const [selectedNakshatra, setSelectedNakshatra] = useState(nakshatras[0]);
    const router = useRouter();
    const isLoggedIn = false; // Placeholder

    return (
        <div className="min-h-screen bg-[var(--bg)] pt-20 pb-20 px-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] bg-secondary/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[10%] left-[5%] w-[35%] h-[35%] bg-secondary/3 blur-[100px] rounded-full"></div>
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
                        <h1 className="text-3xl font-headline font-bold text-foreground tracking-tight">The 27 <span className="text-secondary italic">Nakshatras</span></h1>
                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Lunar Mansions of Destiny</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Sidebar Navigation - Scrollable */}
                    <div className="w-full lg:w-[220px] shrink-0 sticky lg:top-24 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex flex-col gap-2">
                            {nakshatras.map((nak) => (
                                <button
                                    key={nak.id}
                                    onClick={() => setSelectedNakshatra(nak)}
                                    className={`relative p-3 rounded-[20px] transition-all duration-300 flex items-center gap-3 group overflow-hidden ${
                                        selectedNakshatra.id === nak.id 
                                        ? 'bg-secondary text-white shadow-lg shadow-secondary/20' 
                                        : 'bg-surface/40 hover:bg-surface/80 text-foreground/60 border border-outline-variant/20'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedNakshatra.id === nak.id ? 'bg-white/20 text-white' : 'bg-secondary/10 text-secondary'}`}>
                                        {nak.id}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[12px] font-bold font-headline leading-none">{nak.nameEn}</p>
                                        <p className={`text-[8px] uppercase tracking-widest mt-1 ${selectedNakshatra.id === nak.id ? 'text-white/60' : 'text-foreground/30'}`}>
                                            {nak.nameHi}
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
                                key={selectedNakshatra.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4 }}
                            >
                                <Card padding="none" className="!rounded-[28px] border border-outline-variant/30 bg-surface/50 backdrop-blur-sm overflow-hidden">
                                    <div className="p-7 sm:p-10">
                                        {/* Hero Header */}
                                        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-outline-variant/20">
                                            <div className="relative shrink-0">
                                                <div className="absolute inset-0 bg-secondary/15 blur-[60px] rounded-full opacity-60"></div>
                                                <div className="w-32 h-32 rounded-[40px] bg-secondary/5 border border-secondary/10 flex items-center justify-center text-secondary relative z-10 transition-transform duration-500 hover:scale-105 shadow-inner">
                                                    <Star className="w-16 h-16 animate-spin-slow" />
                                                </div>
                                            </div>
                                            <div className="flex-1 text-center md:text-left">
                                                <div className="flex flex-wrap items-baseline justify-center md:justify-start gap-4 mb-4">
                                                    <h2 className="text-5xl lg:text-6xl font-headline font-bold text-foreground tracking-tight">
                                                        {selectedNakshatra.nameEn}
                                                    </h2>
                                                    <span className="text-2xl lg:text-3xl text-secondary font-headline italic">— {selectedNakshatra.nameHi}</span>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Lord</p>
                                                        <p className="text-sm font-bold text-secondary">{selectedNakshatra.ruler}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Symbol</p>
                                                        <p className="text-sm font-bold text-foreground/80">{selectedNakshatra.symbol}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Gana</p>
                                                        <p className="text-sm font-bold text-secondary">{selectedNakshatra.gana}</p>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Letters</p>
                                                        <p className="text-sm font-bold text-foreground italic">{selectedNakshatra.padas}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Grid */}
                                        <div className="grid md:grid-cols-2 gap-10">
                                            <div className="space-y-8">
                                                <div>
                                                    <h3 className="text-[10px] font-bold text-secondary uppercase tracking-[0.25em] mb-4 flex items-center gap-1.5">
                                                        <Info className="w-3.5 h-3.5" />
                                                        Karmic Essence
                                                    </h3>
                                                    <p className="text-[16px] text-foreground leading-[1.8] font-light italic border-l-2 border-secondary/20 pl-6">
                                                        {selectedNakshatra.deepDive}
                                                    </p>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-secondary/5 border border-outline-variant/30">
                                                    <h4 className="text-[11px] font-bold text-foreground mb-4 uppercase tracking-widest">Fundamental Trait</h4>
                                                    <p className="text-[14px] text-foreground font-medium leading-relaxed italic">
                                                        "{selectedNakshatra.trait}"
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Technical Grid */}
                                                <div className="grid grid-cols-1 gap-4">
                                                    <div className="p-5 rounded-2xl bg-surface/60 border border-outline-variant/20 flex items-center justify-between group/spec">
                                                        <div className="flex items-center gap-3">
                                                            <Activity className="w-5 h-5 text-secondary/40 group-hover/spec:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Yoni (Animal)</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedNakshatra.yoni}</span>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-surface/60 border border-outline-variant/20 flex items-center justify-between group/spec">
                                                        <div className="flex items-center gap-3">
                                                            <Compass className="w-5 h-5 text-secondary/40 group-hover/spec:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Goal (Purushartha)</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedNakshatra.element}</span>
                                                    </div>
                                                    <div className="p-5 rounded-2xl bg-surface/60 border border-outline-variant/20 flex items-center justify-between group/spec">
                                                        <div className="flex items-center gap-3">
                                                            <Shield className="w-5 h-5 text-secondary/40 group-hover/spec:text-secondary transition-colors" />
                                                            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Presiding Deity</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-foreground">{selectedNakshatra.deity}</span>
                                                    </div>
                                                </div>

                                                <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/10 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                                                            <Lock className="w-5 h-5 text-secondary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">Dasha Timeline</p>
                                                            <p className="text-[11px] font-bold text-foreground">Calculate my starting period</p>
                                                        </div>
                                                    </div>
                                                    <Button onClick={() => router.push('/chat')} className="!px-4 !py-1.5 !min-h-0 !text-[10px] !rounded-full">Analyze ✦</Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-10 pt-8 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                                    <Scale className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h3 className="text-[14px] font-headline font-bold text-foreground">Nakshatra Padas</h3>
                                                    <p className="text-[10px] text-foreground/40 tracking-wider uppercase font-bold">The 4 quarters of {selectedNakshatra.nameEn} and their influence</p>
                                                </div>
                                            </div>
                                            <Button onClick={() => router.push('/chat')} className="gold-gradient !px-8 !py-3 !rounded-2xl !font-bold">Check My Padas ✦</Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(var(--secondary-rgb), 0.05);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(var(--secondary-rgb), 0.2);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: rgba(var(--secondary-rgb), 0.4);
                    }
                `}</style>
            </div>
        </div>
    );
}
