"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Image from "next/image";
import {
    Sparkles, Home, Globe, Users, Briefcase, Heart, Shield,
    Zap, Eye, BookOpen, TrendingUp, DollarSign, Lock,
    ChevronDown, ChevronRight, ArrowLeft, RefreshCw,
    Sun, Moon, Flame, Star, Gem, CircleDot,
    Activity, Clock, Calendar, MapPin, Target, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ───────────────────────────────────────────────────
interface Occupant {
    planet: string;
    dignity: string;
    retrograde: boolean;
}

interface HouseData {
    house: number;
    name: string;
    areas: string[];
    sign: string;
    lord: string;
    lordHouse: number;
    occupants: Occupant[];
    interpretation: string[];
}

interface Yoga {
    name: string;
    effect: string;
}

interface PlanetData {
    planet: string;
    sign: string;
    house: number;
    degree: number;
    dignity: string;
    shadbala: number;
    retrograde: boolean;
    conjunctions: string[];
    lordOf: number[];
    interpretation: string[];
    yogas: Yoga[];
}

interface DashaData {
    active: { type: string; planet: string; start: string; end: string }[];
    explanation: string[];
}

interface AnalysisData {
    houses: HouseData[];
    planets: PlanetData[];
    dasha: DashaData;
}

// ─── Planet Glyphs (Unicode Astrological Symbols) ────────────
const PLANET_GLYPHS: Record<string, string> = {
    'Sun': '☉',
    'Moon': '☽',
    'Mars': '♂',
    'Mercury': '☿',
    'Jupiter': '♃',
    'Venus': '♀',
    'Saturn': '♄',
    'Rahu': '☊',
    'Ketu': '☋',
};

const PLANET_COLORS: Record<string, string> = {
    'Sun': '#F59E0B',
    'Moon': '#E0E7FF',
    'Mars': '#EF4444',
    'Mercury': '#34D399',
    'Jupiter': '#FBBF24',
    'Venus': '#F472B6',
    'Saturn': '#818CF8',
    'Rahu': '#6B7280',
    'Ketu': '#A78BFA',
};

const PLANET_GRADIENT: Record<string, string> = {
    'Sun': 'from-amber-500/20 to-orange-600/10',
    'Moon': 'from-indigo-300/20 to-slate-400/10',
    'Mars': 'from-red-500/20 to-rose-600/10',
    'Mercury': 'from-emerald-400/20 to-teal-500/10',
    'Jupiter': 'from-yellow-400/20 to-amber-500/10',
    'Venus': 'from-pink-400/20 to-rose-400/10',
    'Saturn': 'from-indigo-400/20 to-violet-500/10',
    'Rahu': 'from-gray-400/20 to-slate-500/10',
    'Ketu': 'from-purple-400/20 to-violet-400/10',
};

// ─── Sign to Rashi Icon Map ──────────────────────────────────
const SIGN_TO_ICON: Record<string, string> = {
    'Aries': '/icons/rashi/aries.png',
    'Taurus': '/icons/rashi/taurus.png',
    'Gemini': '/icons/rashi/gemini.png',
    'Cancer': '/icons/rashi/cancer.png',
    'Leo': '/icons/rashi/leo.png',
    'Virgo': '/icons/rashi/virgo.png',
    'Libra': '/icons/rashi/libra.png',
    'Scorpio': '/icons/rashi/scorpio.png',
    'Sagittarius': '/icons/rashi/sagittarius.png',
    'Capricorn': '/icons/rashi/capricorn.png',
    'Aquarius': '/icons/rashi/aquarius.png',
    'Pisces': '/icons/rashi/pisces.png',
};

// ─── Helper: Planet Icon ─────────────────────────────────────
const getPlanetIcon = (planet: string) => {
    const p = planet.toLowerCase();
    if (p === 'sun') return <Sun className="w-4 h-4" />;
    if (p === 'moon') return <Moon className="w-4 h-4" />;
    if (p === 'mars') return <Flame className="w-4 h-4" />;
    if (p === 'mercury') return <Zap className="w-4 h-4" />;
    if (p === 'jupiter') return <Star className="w-4 h-4" />;
    if (p === 'venus') return <Heart className="w-4 h-4" />;
    if (p === 'saturn') return <Shield className="w-4 h-4" />;
    if (p === 'rahu') return <Eye className="w-4 h-4" />;
    if (p === 'ketu') return <CircleDot className="w-4 h-4" />;
    return <Star className="w-4 h-4" />;
};

// ─── Helper: Dignity Badge ───────────────────────────────────
const getDignityStyle = (dignity: string) => {
    if (dignity === 'Exalted') return {
        bg: 'bg-emerald-500/12',
        border: 'border-emerald-500/25',
        text: 'text-emerald-400',
        dot: 'bg-emerald-400',
        label: 'Exalted',
    };
    if (dignity === 'Debilitated') return {
        bg: 'bg-red-500/12',
        border: 'border-red-500/25',
        text: 'text-red-400',
        dot: 'bg-red-400',
        label: 'Debilitated',
    };
    return {
        bg: 'bg-surface/30',
        border: 'border-outline-variant/20',
        text: 'text-foreground/50',
        dot: 'bg-foreground/30',
        label: 'Normal',
    };
};

// ─── Helper: House Icons ─────────────────────────────────────
const getHouseIcon = (house: number) => {
    const icons = [
        <Users key={1} className="w-4 h-4" />,       // 1 Self
        <DollarSign key={2} className="w-4 h-4" />,   // 2 Wealth
        <Zap key={3} className="w-4 h-4" />,          // 3 Siblings
        <Home key={4} className="w-4 h-4" />,         // 4 Home
        <Star key={5} className="w-4 h-4" />,         // 5 Creativity
        <Shield key={6} className="w-4 h-4" />,       // 6 Obstacles
        <Heart key={7} className="w-4 h-4" />,        // 7 Partnerships
        <Eye key={8} className="w-4 h-4" />,          // 8 Transformation
        <BookOpen key={9} className="w-4 h-4" />,     // 9 Spirituality
        <Briefcase key={10} className="w-4 h-4" />,   // 10 Career
        <TrendingUp key={11} className="w-4 h-4" />,  // 11 Gains
        <Globe key={12} className="w-4 h-4" />,       // 12 Losses
    ];
    return icons[(house - 1) % 12];
};

// ─── House Sanskrit Names ────────────────────────────────────
const HOUSE_SANSKRIT: Record<number, string> = {
    1: 'Tanu Bhava', 2: 'Dhana Bhava', 3: 'Sahaja Bhava',
    4: 'Sukha Bhava', 5: 'Putra Bhava', 6: 'Ari Bhava',
    7: 'Yuvati Bhava', 8: 'Randhra Bhava', 9: 'Dharma Bhava',
    10: 'Karma Bhava', 11: 'Labha Bhava', 12: 'Vyaya Bhava',
};

// ─── Tab Types ───────────────────────────────────────────────
type TabId = 'overview' | 'planets' | 'houses' | 'dasha';

// ─── Shadbala Strength Ring ──────────────────────────────────
const StrengthRing = ({ value, max = 2.0, size = 48, color }: { value: number; max?: number; size?: number; color: string }) => {
    const pct = Math.min(100, (value / max) * 100);
    const radius = (size - 6) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pct / 100) * circumference;

    return (
        <svg width={size} height={size} className="transform -rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" className="text-outline-variant/10" strokeWidth="3" />
            <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={color} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                className="transition-all duration-700"
            />
            <text
                x={size / 2} y={size / 2}
                textAnchor="middle" dominantBaseline="central"
                className="fill-foreground text-[11px] font-bold"
                transform={`rotate(90, ${size / 2}, ${size / 2})`}
            >
                {value.toFixed(1)}
            </text>
        </svg>
    );
};

export default function KundliPage() {
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [expandedHouse, setExpandedHouse] = useState<number | null>(null);
    const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn || !user?.email) {
            setLoading(false);
            return;
        }
        fetchAnalysis();
    }, [isLoggedIn, user?.email, authLoading]);

    const fetchAnalysis = async (forceRefresh = false) => {
        if (!user?.email) return;
        try {
            if (forceRefresh) setRefreshing(true);
            else setLoading(true);

            const res = await fetch('/api/analyze-full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email, force_refresh: forceRefresh }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to fetch analysis');
            }

            const result = await res.json();
            // The data might be nested under result.data or result.data.astrologyData
            const analysisPayload = result.data?.astrologyData || result.data || result;
            
            if (analysisPayload.houses && analysisPayload.planets) {
                setData({
                    houses: analysisPayload.houses,
                    planets: analysisPayload.planets,
                    dasha: analysisPayload.dasha,
                });
                setError(null);
            } else {
                throw new Error('No chart analysis data found. Please generate your chart first.');
            }
        } catch (err: any) {
            console.error('Analysis fetch error:', err);
            setError(err.message || 'Unable to load analysis.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // ─── Derived data ────────────────────────────────────────
    const lagnaSign = useMemo(() => {
        if (!data) return null;
        const h1 = data.houses.find(h => h.house === 1);
        return h1?.sign || null;
    }, [data]);

    const sunPlanet = useMemo(() => data?.planets.find(p => p.planet === 'Sun'), [data]);
    const moonPlanet = useMemo(() => data?.planets.find(p => p.planet === 'Moon'), [data]);

    const totalYogas = useMemo(() => {
        if (!data) return 0;
        return data.planets.reduce((acc, p) => acc + p.yogas.length, 0);
    }, [data]);

    const exaltedCount = useMemo(() => data?.planets.filter(p => p.dignity === 'Exalted').length || 0, [data]);
    const debilitatedCount = useMemo(() => data?.planets.filter(p => p.dignity === 'Debilitated').length || 0, [data]);
    const retrogradeCount = useMemo(() => data?.planets.filter(p => p.retrograde).length || 0, [data]);

    // ─── Auth Gate ────────────────────────────────────────────
    if (!authLoading && !isLoggedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <Card className="glass-panel max-w-md w-full text-center p-8">
                    <Lock className="w-12 h-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-2xl font-headline font-bold text-foreground mb-2">Sign In Required</h2>
                    <p className="text-foreground/60 text-sm mb-6">Please log in to view your personalized Kundli analysis.</p>
                    <Button onClick={() => router.push('/login')} className="gold-gradient text-white border-none font-bold px-8 py-3 rounded-xl">
                        Sign In
                    </Button>
                </Card>
            </div>
        );
    }

    // ─── Loading State ────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-2 border-secondary/20 flex items-center justify-center">
                            <Sparkles className="w-7 h-7 text-secondary animate-pulse" />
                        </div>
                        <div className="absolute inset-0 w-16 h-16 rounded-full border-2 border-transparent border-t-secondary animate-spin" />
                    </div>
                    <div className="text-center">
                        <p className="text-[13px] text-foreground/60 font-bold uppercase tracking-[0.2em]">Decoding Your Kundli</p>
                        <p className="text-[11px] text-foreground/30 mt-1">Analyzing planetary positions...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ─── Error State ──────────────────────────────────────────
    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <Card className="glass-panel max-w-md w-full text-center p-8">
                    <Sparkles className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <h2 className="text-xl font-headline font-bold text-foreground mb-2">Analysis Unavailable</h2>
                    <p className="text-foreground/60 text-sm mb-6">{error || 'No analysis data found.'}</p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => router.push('/')} variant="secondary" className="px-6 py-3 rounded-xl font-bold">
                            Go Home
                        </Button>
                        <Button onClick={() => fetchAnalysis(true)} className="gold-gradient text-white border-none font-bold px-6 py-3 rounded-xl">
                            Generate Analysis
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    const tabs: { id: TabId; label: string; count?: number }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'planets', label: 'Grahas', count: data.planets.length },
        { id: 'houses', label: 'Bhavas', count: data.houses.length },
        { id: 'dasha', label: 'Dasha', count: data.dasha?.active?.length || 0 },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg)] relative">
            <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-24">

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    HERO IDENTITY SECTION
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <div className="mb-8">
                    {/* Back & Refresh */}
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-foreground/40 hover:text-secondary text-[12px] font-bold uppercase tracking-widest transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Back
                        </button>
                        <button
                            onClick={() => fetchAnalysis(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface/60 border border-outline-variant/20 text-[12px] font-bold text-foreground/50 uppercase tracking-widest hover:border-secondary/30 hover:text-secondary transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>

                    {/* Identity Card */}
                    <Card padding="none" className="glass-panel overflow-hidden">
                        <div className="relative p-5 sm:p-7 lg:p-8">
                            {/* Subtle gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-br from-secondary/[0.04] via-transparent to-purple-500/[0.03] pointer-events-none" />
                            
                            <div className="relative flex flex-col lg:flex-row lg:items-start gap-6">
                                {/* Left: Title + Birth Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-headline font-bold text-foreground tracking-tight">
                                            {user?.name ? `${user.name}'s` : 'Your'} Kundli
                                        </h1>
                                    </div>
                                    <p className="text-[12px] text-foreground/35 font-bold uppercase tracking-[0.2em] mb-5">
                                        Personalized Vedic Birth Chart Analysis
                                    </p>

                                    {/* Birth Details Row */}
                                    {(user?.dob || user?.tob || user?.pob) && (
                                        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12px] text-foreground/45 font-bold">
                                            {user?.dob && (
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5 text-secondary/60" />
                                                    {new Date(user.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </span>
                                            )}
                                            {user?.tob && (
                                                <span className="flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-secondary/60" />
                                                    {user.tob}
                                                </span>
                                            )}
                                            {user?.pob && (
                                                <span className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-secondary/60" />
                                                    {user.pob}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Right: Key Signs — Lagna, Sun, Moon */}
                                <div className="flex gap-3 sm:gap-4 shrink-0">
                                    {/* Lagna */}
                                    {lagnaSign && (
                                        <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl bg-surface/40 border border-outline-variant/15">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 relative">
                                                <Image src={SIGN_TO_ICON[lagnaSign] || '/icons/rashi/aries.png'} alt={lagnaSign} fill className="object-contain opacity-80" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Lagna</p>
                                                <p className="text-[13px] font-headline font-bold text-foreground">{lagnaSign}</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Sun Sign */}
                                    {sunPlanet && (
                                        <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl bg-surface/40 border border-outline-variant/15">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 relative">
                                                <Image src={SIGN_TO_ICON[sunPlanet.sign] || '/icons/rashi/aries.png'} alt={sunPlanet.sign} fill className="object-contain opacity-80" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Sun</p>
                                                <p className="text-[13px] font-headline font-bold text-foreground">{sunPlanet.sign}</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Moon Sign */}
                                    {moonPlanet && (
                                        <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-2xl bg-surface/40 border border-outline-variant/15">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 relative">
                                                <Image src={SIGN_TO_ICON[moonPlanet.sign] || '/icons/rashi/aries.png'} alt={moonPlanet.sign} fill className="object-contain opacity-80" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Moon</p>
                                                <p className="text-[13px] font-headline font-bold text-foreground">{moonPlanet.sign}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    TAB BAR
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <div className="flex gap-1.5 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide pb-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.08em] transition-all whitespace-nowrap border ${
                                activeTab === tab.id
                                    ? 'bg-secondary/15 border-secondary/30 text-secondary'
                                    : 'bg-surface/30 border-outline-variant/15 text-foreground/45 hover:border-outline-variant/30 hover:text-foreground/65'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== undefined && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                    activeTab === tab.id ? 'bg-secondary/20 text-secondary' : 'bg-surface/50 text-foreground/25'
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    TAB CONTENT
                ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* ══════════════════════════════════════════
                            OVERVIEW TAB
                        ══════════════════════════════════════════ */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* ── Quick Stats Row ── */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-4 rounded-2xl bg-surface/40 border border-outline-variant/15 text-center">
                                        <p className="text-[22px] sm:text-[26px] font-headline font-bold text-emerald-400">{exaltedCount}</p>
                                        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-1">Exalted</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-surface/40 border border-outline-variant/15 text-center">
                                        <p className="text-[22px] sm:text-[26px] font-headline font-bold text-red-400">{debilitatedCount}</p>
                                        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-1">Debilitated</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-surface/40 border border-outline-variant/15 text-center">
                                        <p className="text-[22px] sm:text-[26px] font-headline font-bold text-orange-400">{retrogradeCount}</p>
                                        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-1">Retrograde</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-surface/40 border border-outline-variant/15 text-center">
                                        <p className="text-[22px] sm:text-[26px] font-headline font-bold text-secondary">{totalYogas}</p>
                                        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-1">Active Yogas</p>
                                    </div>
                                </div>

                                {/* ── Planet Overview Grid ── */}
                                <div>
                                    <h2 className="text-[12px] font-bold text-foreground/30 uppercase tracking-[0.2em] mb-3">Graha Positions</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {data.planets.map((planet) => {
                                            const dignity = getDignityStyle(planet.dignity);
                                            const color = PLANET_COLORS[planet.planet] || '#c8880a';
                                            return (
                                                <motion.div
                                                    key={planet.planet}
                                                    whileHover={{ scale: 1.01 }}
                                                    transition={{ duration: 0.15 }}
                                                    onClick={() => { setActiveTab('planets'); setExpandedPlanet(planet.planet); }}
                                                    className="cursor-pointer group"
                                                >
                                                    <div className={`relative p-4 rounded-2xl bg-surface/40 border border-outline-variant/15 hover:border-secondary/25 transition-all overflow-hidden`}>
                                                        {/* Gradient accent */}
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${PLANET_GRADIENT[planet.planet] || 'from-secondary/10 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity`} />
                                                        
                                                        <div className="relative flex items-center gap-3">
                                                            {/* Glyph */}
                                                            <div className="flex flex-col items-center gap-1 shrink-0">
                                                                <span className="text-[28px] leading-none" style={{ color }}>{PLANET_GLYPHS[planet.planet] || '★'}</span>
                                                                <StrengthRing value={planet.shadbala} color={color} size={40} />
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <h3 className="text-[15px] font-headline font-bold text-foreground">{planet.planet}</h3>
                                                                    {planet.retrograde && (
                                                                        <span className="text-[9px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wider">℞</span>
                                                                    )}
                                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border ${dignity.bg} ${dignity.border} ${dignity.text}`}>
                                                                        {dignity.label}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[12px] text-foreground/40 font-bold">
                                                                    {planet.sign} · H{planet.house} · {planet.degree.toFixed(1)}°
                                                                </p>
                                                                {/* Lord Of */}
                                                                {planet.lordOf.length > 0 && (
                                                                    <p className="text-[11px] text-foreground/25 font-bold mt-0.5">
                                                                        Lord of {planet.lordOf.map(h => `H${h}`).join(', ')}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* Rashi icon */}
                                                            {SIGN_TO_ICON[planet.sign] && (
                                                                <div className="w-8 h-8 relative opacity-30 group-hover:opacity-50 transition-opacity shrink-0">
                                                                    <Image src={SIGN_TO_ICON[planet.sign]} alt={planet.sign} fill className="object-contain" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* ── Active Dasha Summary ── */}
                                {data.dasha?.active?.length > 0 && (
                                    <div>
                                        <h2 className="text-[12px] font-bold text-foreground/30 uppercase tracking-[0.2em] mb-3">Current Dasha Period</h2>
                                        <Card padding="none" className="glass-panel overflow-hidden">
                                            <div className="divide-y divide-outline-variant/10">
                                                {data.dasha.active.map((period, idx) => {
                                                    const startDate = new Date(period.start);
                                                    const endDate = new Date(period.end);
                                                    const now = Date.now();
                                                    const totalDuration = endDate.getTime() - startDate.getTime();
                                                    const elapsed = now - startDate.getTime();
                                                    const pct = Math.min(100, Math.max(2, (elapsed / totalDuration) * 100));
                                                    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now) / (1000 * 60 * 60 * 24)));
                                                    const remainingYears = (remainingDays / 365).toFixed(1);
                                                    const color = PLANET_COLORS[period.planet] || '#c8880a';

                                                    return (
                                                        <div key={idx} className="p-5 sm:p-6">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-[24px]" style={{ color }}>{PLANET_GLYPHS[period.planet] || '★'}</span>
                                                                    <div>
                                                                        <h4 className="text-[16px] font-headline font-bold text-foreground">{period.planet} {period.type}</h4>
                                                                        <p className="text-[11px] text-foreground/35 font-bold uppercase tracking-wider">
                                                                            {period.type === 'Mahadasha' ? 'Major Period' : 'Sub-Period'} · {remainingYears}y remaining
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                                                                    period.type === 'Mahadasha'
                                                                        ? 'bg-secondary/10 text-secondary border border-secondary/20'
                                                                        : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                                }`}>
                                                                    Active
                                                                </span>
                                                            </div>

                                                            {/* Progress Bar */}
                                                            <div className="relative">
                                                                <div className="flex items-center gap-3 text-[11px] text-foreground/35 font-bold mb-2">
                                                                    <span>{startDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                                                    <div className="flex-1" />
                                                                    <span>{endDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                                                </div>
                                                                <div className="h-2 rounded-full bg-surface/60 border border-outline-variant/10 overflow-hidden">
                                                                    <motion.div
                                                                        className="h-full rounded-full"
                                                                        style={{ backgroundColor: color }}
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${pct}%` }}
                                                                        transition={{ duration: 1, ease: 'easeOut' }}
                                                                    />
                                                                </div>
                                                                <p className="text-[10px] text-foreground/25 font-bold mt-1.5 text-right">{pct.toFixed(0)}% complete</p>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Card>
                                    </div>
                                )}

                                {/* ── All Yogas Summary ── */}
                                {totalYogas > 0 && (
                                    <div>
                                        <h2 className="text-[12px] font-bold text-foreground/30 uppercase tracking-[0.2em] mb-3">Active Yogas</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {data.planets.filter(p => p.yogas.length > 0).map(planet => (
                                                planet.yogas.map((yoga, yIdx) => (
                                                    <div key={`${planet.planet}-${yIdx}`} className="p-4 rounded-2xl bg-surface/40 border border-outline-variant/15">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-[18px]" style={{ color: PLANET_COLORS[planet.planet] }}>{PLANET_GLYPHS[planet.planet]}</span>
                                                            <h4 className="text-[14px] font-headline font-bold text-foreground">{yoga.name}</h4>
                                                        </div>
                                                        <p className="text-[13px] text-foreground/55 leading-relaxed">{yoga.effect}</p>
                                                    </div>
                                                ))
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* ── House Occupancy Visual ── */}
                                <div>
                                    <h2 className="text-[12px] font-bold text-foreground/30 uppercase tracking-[0.2em] mb-3">Bhava Map</h2>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                        {data.houses.map(house => (
                                            <button
                                                key={house.house}
                                                onClick={() => { setActiveTab('houses'); setExpandedHouse(house.house); }}
                                                className={`p-3 rounded-xl border text-center transition-all hover:border-secondary/25 ${
                                                    house.occupants.length > 0
                                                        ? 'bg-secondary/[0.06] border-secondary/15'
                                                        : 'bg-surface/30 border-outline-variant/12'
                                                }`}
                                            >
                                                <p className="text-[10px] font-bold text-foreground/25 uppercase tracking-wider">H{house.house}</p>
                                                <p className="text-[12px] font-headline font-bold text-foreground mt-0.5">{house.sign}</p>
                                                {house.occupants.length > 0 && (
                                                    <div className="flex justify-center gap-0.5 mt-1.5">
                                                        {house.occupants.map((occ, i) => (
                                                            <span key={i} className="text-[12px]" style={{ color: PLANET_COLORS[occ.planet] }}>{PLANET_GLYPHS[occ.planet]}</span>
                                                        ))}
                                                    </div>
                                                )}
                                                {house.occupants.length === 0 && (
                                                    <p className="text-[10px] text-foreground/15 mt-1.5">—</p>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ══════════════════════════════════════════
                            PLANETS TAB
                        ══════════════════════════════════════════ */}
                        {activeTab === 'planets' && (
                            <div className="space-y-3">
                                {data.planets.map((planet) => {
                                    const dignity = getDignityStyle(planet.dignity);
                                    const color = PLANET_COLORS[planet.planet] || '#c8880a';
                                    const isExpanded = expandedPlanet === planet.planet;

                                    return (
                                        <Card
                                            key={planet.planet}
                                            padding="none"
                                            className="glass-panel overflow-hidden"
                                        >
                                            {/* Planet Header (always visible) */}
                                            <button
                                                onClick={() => setExpandedPlanet(isExpanded ? null : planet.planet)}
                                                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-surface/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border bg-gradient-to-br ${PLANET_GRADIENT[planet.planet] || ''} ${dignity.border}`}>
                                                        <span className="text-[26px] sm:text-[30px]" style={{ color }}>{PLANET_GLYPHS[planet.planet] || '★'}</span>
                                                    </div>
                                                    <div className="text-left min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="text-[16px] sm:text-[18px] font-headline font-bold text-foreground">{planet.planet}</h3>
                                                            {planet.retrograde && (
                                                                <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded-md uppercase tracking-wider">℞ Retro</span>
                                                            )}
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border ${dignity.bg} ${dignity.border} ${dignity.text}`}>
                                                                {dignity.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-[12px] text-foreground/40 font-bold mt-0.5">
                                                            {planet.sign} · House {planet.house} · {planet.degree.toFixed(1)}°
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    {SIGN_TO_ICON[planet.sign] && (
                                                        <div className="w-7 h-7 relative opacity-25 hidden sm:block">
                                                            <Image src={SIGN_TO_ICON[planet.sign]} alt={planet.sign} fill className="object-contain" />
                                                        </div>
                                                    )}
                                                    <ChevronDown className={`w-4 h-4 text-foreground/30 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </button>

                                            {/* Planet Details (expanded) */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="border-t border-outline-variant/20">
                                                            {/* Stats Row */}
                                                            <div className="grid grid-cols-2 sm:grid-cols-4 bg-surface/5">
                                                                <div className="p-3 sm:p-4 border-r border-b sm:border-b-0 border-outline-variant/10 text-center">
                                                                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider block mb-1">Shadbala</span>
                                                                    <StrengthRing value={planet.shadbala} color={color} size={44} />
                                                                </div>
                                                                <div className="p-3 sm:p-4 sm:border-r border-b sm:border-b-0 border-outline-variant/10 text-center">
                                                                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider block mb-1">Lord Of</span>
                                                                    <span className="text-[14px] font-headline font-bold text-secondary">
                                                                        {planet.lordOf.length > 0 ? planet.lordOf.map(h => `H${h}`).join(', ') : '—'}
                                                                    </span>
                                                                </div>
                                                                <div className="p-3 sm:p-4 border-r border-outline-variant/10 text-center">
                                                                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider block mb-1">Conjunct</span>
                                                                    <span className="text-[14px] font-headline font-bold text-secondary">
                                                                        {planet.conjunctions.length > 0 ? planet.conjunctions.join(', ') : '—'}
                                                                    </span>
                                                                </div>
                                                                <div className="p-3 sm:p-4 text-center">
                                                                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider block mb-1">Degree</span>
                                                                    <span className="text-[14px] font-headline font-bold text-secondary">{planet.degree.toFixed(2)}°</span>
                                                                </div>
                                                            </div>

                                                            {/* Interpretations */}
                                                            {planet.interpretation.length > 0 && (
                                                                <div className="p-5 sm:p-6 border-t border-outline-variant/10">
                                                                    <span className="text-[11px] font-bold text-foreground/25 uppercase tracking-[0.15em] block mb-3">Interpretation</span>
                                                                    {planet.interpretation.map((text, idx) => (
                                                                        <p key={idx} className="text-[14px] sm:text-[15px] text-foreground/75 leading-relaxed mb-2 last:mb-0">{text}</p>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Yogas */}
                                                            {planet.yogas.length > 0 && (
                                                                <div className="p-5 sm:p-6 border-t border-outline-variant/10 bg-secondary/[0.03]">
                                                                    <span className="text-[11px] font-bold text-secondary uppercase tracking-[0.15em] block mb-3">Active Yogas</span>
                                                                    <div className="space-y-3">
                                                                        {planet.yogas.map((yoga, idx) => (
                                                                            <div key={idx}>
                                                                                <h4 className="text-[14px] font-bold text-foreground mb-1">{yoga.name}</h4>
                                                                                <p className="text-[13px] text-foreground/55 leading-relaxed">{yoga.effect}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* ══════════════════════════════════════════
                            HOUSES TAB
                        ══════════════════════════════════════════ */}
                        {activeTab === 'houses' && (
                            <div className="space-y-3">
                                {data.houses.map((house) => {
                                    const isExpanded = expandedHouse === house.house;
                                    return (
                                        <Card
                                            key={house.house}
                                            padding="none"
                                            className="glass-panel overflow-hidden"
                                        >
                                            {/* House Header */}
                                            <button
                                                onClick={() => setExpandedHouse(isExpanded ? null : house.house)}
                                                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-surface/10 transition-colors"
                                            >
                                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-surface/50 border border-outline-variant/20 flex flex-col items-center justify-center shrink-0">
                                                        <span className="text-[18px] sm:text-[20px] font-headline font-bold text-secondary leading-none">{house.house}</span>
                                                        <span className="text-[8px] font-bold text-foreground/25 uppercase tracking-wider leading-none mt-0.5">Bhava</span>
                                                    </div>
                                                    <div className="text-left min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="text-[15px] sm:text-[17px] font-headline font-bold text-foreground truncate">{house.name}</h3>
                                                        </div>
                                                        <p className="text-[11px] text-foreground/30 font-bold mt-0.5 italic">{HOUSE_SANSKRIT[house.house]}</p>
                                                        <p className="text-[12px] text-foreground/40 font-bold mt-0.5">
                                                            {house.sign} · Lord: {house.lord}
                                                            {house.occupants.length > 0 && ` · ${house.occupants.length} graha${house.occupants.length > 1 ? 's' : ''}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {house.occupants.length > 0 && (
                                                        <div className="flex -space-x-0.5">
                                                            {house.occupants.slice(0, 4).map((occ, idx) => (
                                                                <span key={idx} className="text-[14px]" style={{ color: PLANET_COLORS[occ.planet] }}>{PLANET_GLYPHS[occ.planet]}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {SIGN_TO_ICON[house.sign] && (
                                                        <div className="w-7 h-7 relative opacity-20 hidden sm:block">
                                                            <Image src={SIGN_TO_ICON[house.sign]} alt={house.sign} fill className="object-contain" />
                                                        </div>
                                                    )}
                                                    <ChevronDown className={`w-4 h-4 text-foreground/30 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                                </div>
                                            </button>

                                            {/* House Details */}
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.25 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="border-t border-outline-variant/20">
                                                            {/* Areas */}
                                                            <div className="p-4 sm:p-5 bg-surface/5">
                                                                <span className="text-[10px] font-bold text-foreground/25 uppercase tracking-[0.15em] block mb-2">Life Areas</span>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {house.areas.map((area, idx) => (
                                                                        <span key={idx} className="px-2.5 py-1 rounded-lg bg-surface/50 border border-outline-variant/15 text-[11px] font-bold text-foreground/50">
                                                                            {area}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Stats */}
                                                            <div className="grid grid-cols-3 border-t border-outline-variant/10 bg-surface/5">
                                                                <div className="p-3 sm:p-4 border-r border-outline-variant/10 text-center">
                                                                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider block mb-1">Sign</span>
                                                                    <div className="flex items-center justify-center gap-1.5">
                                                                        {SIGN_TO_ICON[house.sign] && (
                                                                            <div className="w-5 h-5 relative opacity-60">
                                                                                <Image src={SIGN_TO_ICON[house.sign]} alt={house.sign} fill className="object-contain" />
                                                                            </div>
                                                                        )}
                                                                        <span className="text-[14px] font-headline font-bold text-secondary">{house.sign}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 sm:p-4 border-r border-outline-variant/10 text-center">
                                                                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider block mb-1">Lord</span>
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <span className="text-[14px]" style={{ color: PLANET_COLORS[house.lord] }}>{PLANET_GLYPHS[house.lord]}</span>
                                                                        <span className="text-[14px] font-headline font-bold text-secondary">{house.lord}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="p-3 sm:p-4 text-center">
                                                                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider block mb-1">Lord In</span>
                                                                    <span className="text-[14px] font-headline font-bold text-secondary">H{house.lordHouse}</span>
                                                                </div>
                                                            </div>

                                                            {/* Occupants */}
                                                            {house.occupants.length > 0 && (
                                                                <div className="p-4 sm:p-5 border-t border-outline-variant/10">
                                                                    <span className="text-[11px] font-bold text-foreground/30 uppercase tracking-[0.15em] block mb-3">Occupying Grahas</span>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {house.occupants.map((occ, idx) => {
                                                                            const occDignity = getDignityStyle(occ.dignity);
                                                                            return (
                                                                                <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${occDignity.bg} ${occDignity.border}`}>
                                                                                    <span className="text-[16px]" style={{ color: PLANET_COLORS[occ.planet] }}>{PLANET_GLYPHS[occ.planet]}</span>
                                                                                    <span className={`text-[13px] font-bold ${occDignity.text}`}>{occ.planet}</span>
                                                                                    {occ.retrograde && <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1 rounded font-bold">℞</span>}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Interpretations */}
                                                            {house.interpretation.length > 0 && (
                                                                <div className="p-5 sm:p-6 border-t border-outline-variant/10">
                                                                    <span className="text-[11px] font-bold text-foreground/25 uppercase tracking-[0.15em] block mb-3">Interpretation</span>
                                                                    {house.interpretation.map((text, idx) => (
                                                                        <p key={idx} className="text-[14px] sm:text-[15px] text-foreground/75 leading-relaxed mb-2 last:mb-0">{text}</p>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        {/* ══════════════════════════════════════════
                            DASHA TAB
                        ══════════════════════════════════════════ */}
                        {activeTab === 'dasha' && data.dasha && (
                            <div className="space-y-4">
                                {/* Active Periods */}
                                <Card padding="none" className="glass-panel overflow-hidden">
                                    <div className="p-4 sm:p-5 border-b border-outline-variant/20 bg-surface/10">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                                                <Activity className="w-4 h-4 text-secondary" />
                                            </div>
                                            <div>
                                                <span className="text-[13px] font-bold text-foreground block">Active Periods</span>
                                                <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider">Current Vimshottari Dasha</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="divide-y divide-outline-variant/10">
                                        {data.dasha.active.map((period, idx) => {
                                            const startDate = new Date(period.start);
                                            const endDate = new Date(period.end);
                                            const now = Date.now();
                                            const totalDuration = endDate.getTime() - startDate.getTime();
                                            const elapsed = now - startDate.getTime();
                                            const pct = Math.min(100, Math.max(2, (elapsed / totalDuration) * 100));
                                            const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now) / (1000 * 60 * 60 * 24)));
                                            const totalYearsRemain = (remainingDays / 365).toFixed(1);
                                            const color = PLANET_COLORS[period.planet] || '#c8880a';

                                            return (
                                                <div key={idx} className="p-5 sm:p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                                                                period.type === 'Mahadasha' ? 'bg-secondary/10 border-secondary/20' : 'bg-purple-500/10 border-purple-500/20'
                                                            }`}>
                                                                <span className="text-[22px]" style={{ color }}>{PLANET_GLYPHS[period.planet] || '★'}</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[16px] font-headline font-bold text-foreground">{period.planet} {period.type}</h4>
                                                                <p className="text-[11px] text-foreground/35 font-bold">
                                                                    {period.type === 'Mahadasha' ? 'Major Period' : 'Sub-Period'} · ~{totalYearsRemain} years remaining
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                                                            period.type === 'Mahadasha' ? 'bg-secondary/10 text-secondary border border-secondary/20' : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                        }`}>
                                                            Active
                                                        </span>
                                                    </div>

                                                    {/* Timeline Bar */}
                                                    <div>
                                                        <div className="flex items-center justify-between text-[11px] text-foreground/35 font-bold mb-2">
                                                            <span>{startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                            <span>{endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                        <div className="h-2.5 rounded-full bg-surface/60 border border-outline-variant/10 overflow-hidden">
                                                            <motion.div
                                                                className="h-full rounded-full"
                                                                style={{ backgroundColor: color }}
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${pct}%` }}
                                                                transition={{ duration: 1, ease: 'easeOut' }}
                                                            />
                                                        </div>
                                                        <p className="text-[10px] text-foreground/25 font-bold mt-1.5 text-center">{pct.toFixed(0)}% of period elapsed</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>

                                {/* Explanations */}
                                {data.dasha.explanation.length > 0 && (
                                    <Card padding="none" className="glass-panel overflow-hidden">
                                        <div className="p-4 sm:p-5 border-b border-outline-variant/20 bg-surface/10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                                    <BookOpen className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <span className="text-[13px] font-bold text-foreground block">Period Analysis</span>
                                                    <span className="text-[10px] text-foreground/30 font-bold uppercase tracking-wider">What this means for you</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-5 sm:p-6 space-y-4">
                                            {data.dasha.explanation.map((text, idx) => (
                                                <p key={idx} className="text-[14px] sm:text-[15px] text-foreground/75 leading-relaxed">{text}</p>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                <p className="text-center mt-12 text-[11px] text-foreground/12 font-bold tracking-[0.3em] uppercase">
                    Decoded by AstraNavi Intelligence
                </p>
            </div>
        </div>
    );
}
