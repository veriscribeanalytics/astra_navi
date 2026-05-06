'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { clientFetch } from '@/lib/apiClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Moon, Star, Activity, Compass, Sparkles, Users, Leaf } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { rashiData } from '@/data/rashiData';
import { Skeleton } from '@/components/ui/Skeleton';

interface HoroscopeData {
    mood?: string;
    lucky_color?: string;
    lucky_number?: number;
    career?: string;
    love?: string;
    health?: string;
    finance?: string;
    tip?: string;
}

export default function RashisClient() {
    const { isLoggedIn } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Initialize from URL or defaults
    const rashiParam = searchParams.get('sign');
    const modeParam = searchParams.get('mode') as 'encyclopedia' | 'rashi' | null;

    const initialRashi = rashiParam ? rashiData.find(r => r.id === rashiParam) || rashiData[0] : rashiData[0];
    const initialMode = modeParam || (rashiParam ? 'rashi' : 'encyclopedia');

    // Manage which view is active: the global encyclopedia intro or a specific rashi
    const [viewMode, setViewMode] = React.useState<'encyclopedia' | 'rashi'>(initialMode);
    const [selectedRashi, setSelectedRashi] = React.useState(initialRashi);

    const [horoscopeData, setHoroscopeData] = React.useState<HoroscopeData | null>(null);
    const [horoscopeLoading, setHoroscopeLoading] = React.useState(false);

    // Sync state FROM URL to handle deep-linking and back/forward navigation
    React.useEffect(() => {
        const sign = searchParams.get('sign');
        const mode = searchParams.get('mode');
        
        if (sign) {
            const found = rashiData.find(r => r.id === sign);
            if (found) {
                setSelectedRashi(found);
                setViewMode('rashi');
            }
        } else if (mode === 'encyclopedia') {
            setViewMode('encyclopedia');
        }
    }, [searchParams]);

    // Sync state TO URL
    React.useEffect(() => {
        const params = new URLSearchParams();
        if (viewMode === 'rashi') {
            params.set('sign', selectedRashi.id);
        } else {
            params.set('mode', 'encyclopedia');
        }
        
        // Only update if URL actually changed to avoid unnecessary history entries
        const currentUrl = `${window.location.pathname}?${params.toString()}`;
        const actualUrl = `${window.location.pathname}${window.location.search}`;
        if (currentUrl !== actualUrl) {
            router.replace(currentUrl, { scroll: false });
        }
    }, [viewMode, selectedRashi.id, router]);

    // Only fetch horoscope when we're actually viewing a specific rashi
    React.useEffect(() => {
        if (viewMode !== 'rashi') return;

        const fetchHoroscope = async () => {
            setHoroscopeLoading(true);
            try {
                const response = await clientFetch(`/api/horoscope-general?sign=${encodeURIComponent(selectedRashi.nameEn)}`);
                if (response.ok) {
                    const data = await response.json();
                    setHoroscopeData(data);
                }
            } catch (err) {
                console.error("Failed to fetch general horoscope:", err);
            } finally {
                setHoroscopeLoading(false);
            }
        };

        fetchHoroscope();
    }, [selectedRashi.nameEn, viewMode]);

    return (
        <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)] px-2 sm:px-4 pb-4 safe-bottom-buffer relative overflow-hidden flex flex-col items-center">

            <div className="max-w-[1500px] 2xl:max-w-[1800px] 3xl:max-w-[2200px] w-full mx-auto relative z-10 flex flex-col xl:flex-row gap-5">

                {/* Master: Sidebar (Left) */}
                <div className="lg:w-[260px] flex-shrink-0 flex flex-col">
                    <div className="mb-2 px-1">
                        <Link href="/blogs" className="inline-flex items-center gap-1.5 text-secondary hover:text-secondary/70 transition-all mb-1 group">
                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em]">Library</span>
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
                            Celestial <span className="text-secondary italic">Rashis</span>
                        </h1>
                    </div>

                    <div className="flex-grow overflow-y-auto scrollbar-hide pb-10">
                        {/* Dedicated Encyclopedia Button */}
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

                        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/30 px-2 mb-2">The Zodiac</div>

                        {/* Button List Grid */}
                        <div className="grid grid-cols-6 lg:grid-cols-2 gap-1.5 sm:gap-2">
                            {rashiData.map((rashi) => {
                                const isActive = viewMode === 'rashi' && selectedRashi.id === rashi.id;
                                return (
                                    <button
                                        key={rashi.id}
                                        onClick={() => {
                                            setSelectedRashi(rashi);
                                            setViewMode('rashi');
                                        }}
                                        className={`group flex flex-col items-center justify-center py-2 px-1 rounded-xl border transition-all duration-200 ${isActive
                                                ? 'border-secondary bg-secondary/5'
                                                : 'border-transparent hover:bg-surface'
                                            }`}
                                    >
                                        <Image
                                            src={rashi.icon}
                                            alt={rashi.nameEn}
                                            width={32}
                                            height={32}
                                            className={`w-6 h-6 sm:w-8 sm:h-8 object-contain transition-transform duration-300 ${isActive ? 'scale-110' : 'opacity-70 group-hover:opacity-100 group-hover:scale-110'}`}
                                            priority={isActive}
                                        />
                                        <p className={`text-[10px] font-bold mt-1.5 truncate w-full text-center ${isActive ? 'text-secondary' : 'text-foreground/50'}`}>
                                            {rashi.nameEn}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Detail: Content (Right) */}
                <div className="flex-grow min-w-0 flex flex-col lg:pt-2.5">
                    <AnimatePresence mode="wait">

                        {/* ==== VIEW 1: ENCYCLOPEDIA INTRO ==== */}
                        {viewMode === 'encyclopedia' && (
                            <motion.div
                                key="encyclopedia"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col"
                            >
                                <Card padding="md" className="!rounded-[32px] sm:!rounded-[40px] border-outline-variant/20 bg-surface" hoverable={false}>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-outline-variant/20 text-foreground/60 text-[10px] font-bold tracking-[0.25em] uppercase mb-3 w-fit">
                                        <BookOpen className="w-3 h-3" /> Core Concepts
                                    </div>
                                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-2">
                                        Understanding the <span className="text-secondary italic">Rashis</span>
                                    </h2>
                                    <p className="text-sm sm:text-base text-foreground/70 leading-relaxed max-w-3xl mb-6">
                                        In Vedic Astrology (Jyotish), a Rashi represents a 30-degree sector of the cosmic ecliptic. It is the fundamental energetic canvas through which the planets express their psychological and karmic archetypes over our lives.
                                    </p>

                                    <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 flex-grow">
                                        {/* Column 1 */}
                                        <div className="space-y-4">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                    <Moon className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground mb-1">Sidereal Moon Matrix</h4>
                                                    <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                        Unlike Western astrology which orbits around the Sun, Jyotish places paramount importance on your Moon sign (Chandra Rashi). Furthermore, it relies on the fixed Sidereal Zodiac, factoring in the precession of the equinoxes.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                    <Compass className="w-5 h-5 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground mb-1">Tattvas (Elements)</h4>
                                                    <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                        Every sign acts as an elemental funnel. Fire signifies drive. Earth implies stability. Air dictates intellect and movement, while Water governs profound intuition and emotion.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                    <Users className="w-5 h-5 text-indigo-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground mb-1">The Lagna (Ascendant)</h4>
                                                    <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                        While the Moon sign is the mind, the Lagna is the physical self. It determines your appearance, vitality, and how you project yourself. A complete Vedic analysis always balances both signs.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Column 2 */}
                                        <div className="space-y-4">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                    <Star className="w-5 h-5 text-rose-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground mb-1">The Nakshatra Engine</h4>
                                                    <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                        A Rashi contains exactly 2¼ Nakshatras (Lunar Mansions). It is the Nakshatra within the Rashi that dictates the highly specific, microscopic psychological tendencies and life events of a person.
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                    <Activity className="w-5 h-5 text-amber-500" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground mb-1">Tri-Guna Physics</h4>
                                                    <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                        Signs vibrate across three layers (Gunas): Sattvic (Seeking purity & balance), Rajasic (Seeking action & expansion), and Tamasic (Representing inertia & grounding).
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0 border border-outline-variant/20">
                                                    <Leaf className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div>
                                                    <h4 className="text-base font-bold text-foreground mb-1">Ayurvedic Doshas</h4>
                                                    <p className="text-[13px] text-foreground/60 leading-relaxed">
                                                        Rashis are divided by their Doshic nature—Vata (Air), Pitta (Fire), and Kapha (Water/Earth). Your Rashi influences your metabolic type and predispositions to physical health and balance.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        )}


                        {/* ==== VIEW 2: SPLIT BENTO RASHI DETAILS ==== */}
                        {viewMode === 'rashi' && (
                            <motion.div
                                key={`rashi-${selectedRashi.id}`}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col"
                            >
                                <Card padding="none" className="max-w-5xl !rounded-[32px] sm:!rounded-[40px] border-outline-variant/30 flex flex-col overflow-hidden">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-outline-variant/20">

                                        {/* LEFT PANE: Rashi Identity */}
                                        <div className="flex flex-col bg-surface">
                                            {/* Row 1: Header */}
                                            <div className="p-5 h-[85px] sm:h-[95px] flex items-center border-b border-outline-variant/20 shrink-0">
                                                <div className="flex items-center gap-4 w-full">
                                                    <Image src={selectedRashi.icon} alt={selectedRashi.nameEn} width={40} height={40} className="w-10 h-10 object-contain" priority />
                                                    <div className="flex-grow">
                                                        <div className="flex flex-wrap items-baseline gap-x-2">
                                                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{selectedRashi.nameEn}</h2>
                                                            <span className="text-lg font-bold text-secondary italic">— {selectedRashi.nameHi}</span>
                                                        </div>
                                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/40">{selectedRashi.dates}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 2: Vitals (4 Blocks) */}
                                            <div className="grid grid-cols-4 border-b border-outline-variant/20 shrink-0">
                                                {[
                                                    { label: 'Lord', val: selectedRashi.rulingPlanet },
                                                    { label: 'Element', val: selectedRashi.element },
                                                    { label: 'Nature', val: selectedRashi.guna },
                                                    { label: 'Symbol', val: selectedRashi.symbol }
                                                ].map((stat, i) => (
                                                    <div key={i} className={`flex flex-col items-center justify-center p-3 text-center ${i < 3 ? 'border-r' : ''} border-outline-variant/10`}>
                                                        <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.1em] mb-1">{stat.label}</span>
                                                        <span className="text-sm font-bold text-foreground/90 truncate w-full">{stat.val}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Row 3: Advanced Vedic Properties */}
                                            <div className="grid grid-cols-2 border-b border-outline-variant/20 shrink-0">
                                                <div className="p-4 border-r border-outline-variant/10">
                                                    <div className="flex flex-col space-y-2">
                                                        <div className="flex justify-between items-center text-xs"><span className="text-foreground/50 font-semibold">Exalted</span> <span className="text-emerald-400 font-bold">{selectedRashi.exalted}</span></div>
                                                        <div className="flex justify-between items-center text-xs"><span className="text-foreground/50 font-semibold">Debilitated</span> <span className="text-rose-400 font-bold">{selectedRashi.debilitated}</span></div>
                                                        <div className="flex justify-between items-center text-xs"><span className="text-foreground/50 font-semibold">Lucky Gem</span> <span className="text-foreground/80 font-bold">{selectedRashi.luckyGem}</span></div>
                                                    </div>
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex flex-col space-y-2">
                                                        <div className="flex justify-between items-center text-xs"><span className="text-foreground/50 font-semibold">Day / Metal</span> <span className="text-foreground/80 font-bold">{selectedRashi.luckyDay} / {selectedRashi.luckyMetal}</span></div>
                                                        <div className="flex justify-between items-center text-xs"><span className="text-foreground/50 font-semibold">Deity</span> <span className="text-foreground/80 font-bold truncate max-w-[120px]" title={selectedRashi.deity}>{selectedRashi.deity}</span></div>
                                                        <div className="flex justify-between items-center text-xs"><span className="text-foreground/50 font-semibold">Body Part</span> <span className="text-foreground/80 font-bold truncate max-w-[120px]">{selectedRashi.bodyParts}</span></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Row 4: Nakshatras */}
                                            <div className="p-4 border-b border-outline-variant/20 shrink-0">
                                                <div className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.15em] mb-2 flex items-center justify-between">
                                                    Constituent Nakshatras
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedRashi.nakshatras.map((nak, idx) => (
                                                        <span key={idx} className="px-2 py-1 rounded bg-surface border border-outline-variant/20 text-xs font-bold text-foreground/70">
                                                            {nak}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Row 5: Profile & Traits */}
                                            <div className="p-5 flex flex-col border-b border-outline-variant/20">
                                                <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                                                    {selectedRashi.description}
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                    <div className="space-y-1">
                                                        <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Strengths</div>
                                                        <p className="text-xs text-foreground/60 leading-relaxed">{selectedRashi.strengths}</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Challenges</div>
                                                        <p className="text-xs text-foreground/60 leading-relaxed">{selectedRashi.challenges}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-auto">
                                                    {selectedRashi.traits.map((trait, idx) => (
                                                        <span key={idx} className="text-xs font-bold text-foreground/40 lowercase">
                                                            #{trait}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Row 6: Mantra */}
                                            <div className="p-4 shrink-0 flex items-center justify-between bg-surface/5">
                                                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.15em]">Seed Mantra</span>
                                                <span className="text-sm font-bold text-foreground/80 italic">&quot;{selectedRashi.mantra}&quot;</span>
                                            </div>
                                        </div>

                                        {/* RIGHT PANE: General Daily Guidance */}
                                        <div className="flex flex-col border-t lg:border-t-0 border-outline-variant/20 bg-surface/5 min-h-[400px]">
                                            {isLoggedIn ? (
                                                <>
                                                    <div className="p-5 h-[85px] sm:h-[95px] flex items-center border-b border-outline-variant/20 shrink-0">
                                                        <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-3">
                                                                <div>
                                                                    <h2 className="text-lg font-bold text-foreground tracking-tight uppercase">Daily Forecast</h2>
                                                                    <p className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.2em]">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="px-2 py-0.5 rounded text-foreground/60 border border-outline-variant/30 text-[9px] font-bold uppercase tracking-wider">
                                                                    General
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-3 border-b border-outline-variant/20 shrink-0">
                                                        {[
                                                            { label: 'Mood', val: horoscopeData?.mood },
                                                            { label: 'Color', val: horoscopeData?.lucky_color },
                                                            { label: 'Number', val: horoscopeData?.lucky_number }
                                                        ].map((stat, i) => (
                                                            <div key={i} className={`flex flex-col items-center justify-center p-3 border-outline-variant/10 text-center ${i < 2 ? 'border-r' : ''}`}>
                                                                <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-[0.1em] mb-1">{stat.label}</span>
                                                                <div className="h-5 flex items-center justify-center w-full px-2">
                                                                    {horoscopeLoading ? (
                                                                        <Skeleton height={14} width="100%" />
                                                                    ) : (
                                                                        <span className="text-sm font-bold text-foreground/90 truncate w-full">
                                                                            {stat.val || '—'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 lg:divide-y-0 lg:grid-cols-1 xl:grid-cols-2 xl:divide-y-0 divide-outline-variant/10">
                                                        {[
                                                            { label: 'Career', val: horoscopeData?.career, border: 'sm:border-r border-b' },
                                                            { label: 'Love', val: horoscopeData?.love, border: 'border-b' },
                                                            { label: 'Health', val: horoscopeData?.health, border: 'sm:border-r sm:border-y-0 border-b' },
                                                            { label: 'Finance', val: horoscopeData?.finance, border: '' }
                                                        ].map((item, i) => (
                                                            <div key={i} className={`${item.border} border-outline-variant/10 p-5 flex flex-col justify-center min-h-[100px]`}>
                                                                <div className="flex items-center gap-1.5 mb-2">
                                                                    <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">{item.label}</span>
                                                                </div>
                                                                {horoscopeLoading ? (
                                                                    <div className="space-y-2">
                                                                        <Skeleton height={12} width="100%" />
                                                                        <Skeleton height={12} width="80%" />
                                                                    </div>
                                                                ) : (
                                                                    <p className="text-sm text-foreground/70 leading-relaxed">{item.val || 'Cosmic energy is aligning...'}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="p-5 bg-surface/5 border-t border-outline-variant/20 flex flex-col items-center justify-center text-center shrink-0 h-[100px]">
                                                        {horoscopeLoading ? (
                                                            <Skeleton height={18} width={200} />
                                                        ) : (
                                                            <p className="text-[15px] font-bold text-foreground italic max-w-sm">
                                                                &quot;{horoscopeData?.tip || 'Follow the cosmic flow today.'}&quot;
                                                            </p>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-6">
                                                    <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20 shadow-[0_0_20px_rgba(200,136,10,0.1)]">
                                                        <Sparkles className="w-8 h-8 text-secondary" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <h3 className="text-xl font-bold text-foreground">Unlock Daily Guidance</h3>
                                                        <p className="text-sm text-foreground/50 leading-relaxed max-w-[280px] mx-auto">
                                                            Login to see daily forecasts, lucky markers, and career insights for {selectedRashi.nameEn}.
                                                        </p>
                                                    </div>
                                                    <Link
                                                        href={`/login?callbackUrl=${encodeURIComponent('/rashis?sign=' + selectedRashi.id)}`}
                                                        className="px-8 py-3 rounded-full bg-secondary text-background text-sm font-bold hover:bg-secondary/90 transition-all shadow-lg hover:shadow-secondary/20"
                                                    >
                                                        Login to AstraNavi
                                                    </Link>
                                                </div>
                                            )}
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
