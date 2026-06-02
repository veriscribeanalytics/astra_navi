"use client";

import { useAuth } from "@/context/AuthContext";
import { clientFetch } from "@/lib/apiClient";
import { PaywallData } from "@/types/paywall";
import PaywallCard from "@/components/paywall/PaywallCard";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
    Sparkles, Home, Lock,
    ArrowLeft, RefreshCw, ChevronLeft, ChevronRight,
    Info, MessageSquare, X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PLANET_GLYPHS, PLANET_COLORS, SIGN_TO_ICON, PLANET_TO_ICON, getDignityStyle } from "@/lib/astrology";
import PlanetIcon from "@/components/ui/astrology/PlanetIcon";
import KundliSvg from "@/components/ui/astrology/KundliSvg";
import { Skeleton, SkeletonCircle, SkeletonText } from "@/components/ui/Skeleton";

// ─── Types ───────────────────────────────────────────────────
interface Occupant { planet: string; dignity: string; retrograde: boolean; }
interface HouseData { house: number; name: string; areas: string[]; sign: string; lord: string; lordHouse: number; occupants: Occupant[]; interpretation: (string | { technical: string; simple: string })[]; }
interface Yoga { name: string; effect: string; }
interface PlanetData { planet: string; sign: string; house: number; degree: number; dignity: string; shadbala: number; retrograde: boolean; conjunctions: string[]; lordOf: number[]; interpretation: (string | { technical: string; simple: string })[]; yogas: Yoga[]; }
interface DashaData {
    active?: { type: string; planet: string; start: string; end: string }[];
    rows?: { planet: string; dates: string; type?: string; active?: boolean }[];
    current?: string | { planet?: string; name?: string };
    currentMahaDasha?: string | { planet?: string; name?: string };
    remaining?: string;
    explanation: (string | { technical: string; simple: string })[];
}
interface AnalysisData { houses: HouseData[]; planets: PlanetData[]; dasha: DashaData; }

type InterpItem = string | { technical: string; simple: string } | undefined | null;
const simpleText = (item: InterpItem): string => (!item ? '' : typeof item === 'object' ? item.simple : item);
const techText = (item: InterpItem): string | null => (!item ? null : typeof item === 'object' ? item.technical : null);

type AccentKey = 'secondary' | 'amber' | 'emerald' | 'blue';
const ACCENT_BAR: Record<AccentKey, string> = {
    secondary: 'bg-secondary',
    amber: 'bg-amber-400',
    emerald: 'bg-emerald-400',
    blue: 'bg-blue-400',
};
const ACCENT_TEXT: Record<AccentKey, string> = {
    secondary: 'text-secondary',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
};

function SectionHeading({ title, hint, accent = 'secondary' }: { title: string; hint?: React.ReactNode; accent?: AccentKey }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <div className={`w-1 h-4 rounded-full ${ACCENT_BAR[accent]}`} />
            <h2 className={`text-[12px] font-bold ${ACCENT_TEXT[accent]} uppercase tracking-[0.2em]`}>{title}</h2>
            {hint && <div className="ml-auto">{hint}</div>}
        </div>
    );
}

export default function KundliPage() {
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
    const [selectedHouse, setSelectedHouse] = useState<HouseData | null>(null);
    const [houseFilter, setHouseFilter] = useState<'active' | 'all'>('active');
    const [paywallData, setPaywallData] = useState<PaywallData | null>(null);
    const [lockedSections, setLockedSections] = useState<Set<string>>(new Set());

    const planetTrackRef = useRef<HTMLDivElement>(null);
    const insightRef = useRef<HTMLDivElement>(null);
    const [carouselEdges, setCarouselEdges] = useState({ left: false, right: true });

    const updateCarouselEdges = useCallback(() => {
        const el = planetTrackRef.current;
        if (!el) return;
        setCarouselEdges({
            left: el.scrollLeft > 4,
            right: el.scrollLeft < el.scrollWidth - el.clientWidth - 4,
        });
    }, []);

    const scrollCarousel = (dir: 'left' | 'right') => {
        const el = planetTrackRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
    };

    const handlePlanetClick = (planet: PlanetData) => {
        setSelectedHouse(null);
        if (selectedPlanet?.planet === planet.planet) {
            setSelectedPlanet(null);
            return;
        }
        setSelectedPlanet(planet);
        setTimeout(() => insightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    };

    const handleHouseClick = (house: HouseData) => {
        setSelectedPlanet(null);
        if (selectedHouse?.house === house.house) {
            setSelectedHouse(null);
            return;
        }
        setSelectedHouse(house);
        setTimeout(() => insightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    };

    const closeInsight = () => {
        setSelectedPlanet(null);
        setSelectedHouse(null);
    };

    const fetchAnalysis = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) setRefreshing(true); else setLoading(true);
            const res = await clientFetch('/api/analyze-full', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force_refresh: forceRefresh })
            });

            // ── 402 Paywall detection ──
            if (res.status === 402) {
                const errData = await res.json().catch(() => ({}));
                if (errData.paywall) {
                    setPaywallData(errData.paywall as PaywallData);
                    if (errData.partial_data) {
                        const partialPayload = errData.partial_data;
                        if (partialPayload && typeof partialPayload === 'object' && partialPayload.houses) {
                            if (!partialPayload.planets) partialPayload.planets = [];
                            setData(partialPayload);
                            setError(null);
                        }
                    }
                }
                setLoading(false);
                setRefreshing(false);
                return;
            }

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.detail || 'The stars are temporarily obscured.');
            }
            const result = await res.json();

            let payload = result.astrologyData
                || result.data?.astrologyData
                || result.insights?.astrologyData
                || result.insights
                || result.data
                || result;

            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch (e) {
                    console.error("[Kundli] Failed to parse payload string:", e);
                }
            }

            if (payload && !payload.houses && payload.astrologyData) payload = payload.astrologyData;
            if (payload && !payload.houses && payload.data) payload = payload.data;

            if (payload && typeof payload === 'object' && payload.houses) {
                if (!payload.planets) payload.planets = [];

                payload.planets = (payload.planets as Record<string, unknown>[]).map((p) => ({
                    ...p,
                    yogas: (p.yogas as Yoga[]) || [],
                    interpretation: (p.interpretation as (string | { technical: string; simple: string })[]) || [],
                    conjunctions: (p.conjunctions as string[]) || [],
                    lordOf: (p.lordOf as number[]) || []
                }));

                payload.houses = (payload.houses as Record<string, unknown>[]).map((h) => ({
                    ...h,
                    occupants: (h.occupants as Occupant[]) || [],
                    interpretation: (h.interpretation as (string | { technical: string; simple: string })[]) || [],
                    areas: (h.areas as string[]) || []
                }));

                // Dasha normalization: backend returns nested { current: { mahadasha, antardasha } }
                // but UI expects flat { active[], currentMahaDasha, remaining, explanation[] }
                if (payload.dasha && typeof payload.dasha === 'object') {
                    const rawDasha = payload.dasha as Record<string, unknown>;
                    const normalized: Record<string, unknown> = { ...rawDasha };

                    if (!rawDasha.active && !rawDasha.rows) {
                        const current = rawDasha.current as Record<string, Record<string, unknown>> | undefined;
                        if (current && typeof current === 'object' && (current.mahadasha || current.antardasha)) {
                            const activeArr: { type: string; planet: string; start: string; end: string }[] = [];
                            const explanations: (string | { technical: string; simple: string })[] = [];

                            if (current.mahadasha) {
                                const md = current.mahadasha;
                                activeArr.push({
                                    type: 'Mahadasha',
                                    planet: (md.planet as string) || '',
                                    start: (md.start as string) || '',
                                    end: (md.end as string) || ''
                                });
                                if (md.interpretation) {
                                    explanations.push(typeof md.interpretation === 'string'
                                        ? { technical: md.interpretation as string, simple: md.interpretation as string }
                                        : md.interpretation as { technical: string; simple: string });
                                }
                            }

                            if (current.antardasha) {
                                const ad = current.antardasha;
                                activeArr.push({
                                    type: 'Antardasha',
                                    planet: (ad.planet as string) || '',
                                    start: (ad.start as string) || '',
                                    end: (ad.end as string) || ''
                                });
                                if (ad.interpretation) {
                                    explanations.push(typeof ad.interpretation === 'string'
                                        ? { technical: ad.interpretation as string, simple: ad.interpretation as string }
                                        : ad.interpretation as { technical: string; simple: string });
                                }
                            }

                            normalized.active = activeArr;
                            normalized.currentMahaDasha = current.mahadasha?.planet || '';
                            normalized.current = current.antardasha?.planet || current.mahadasha?.planet || '';
                            normalized.remaining = '';

                            if (current.antardasha?.end) {
                                const endDate = new Date(current.antardasha.end as string);
                                const nowMs = Date.now();
                                const remDays = Math.max(0, Math.ceil((endDate.getTime() - nowMs) / 86400000));
                                normalized.remaining = remDays > 365 ? `${(remDays / 365).toFixed(1)} years` : `${remDays} days`;
                            }

                            normalized.explanation = (rawDasha.explanation as (string | { technical: string; simple: string })[]) || explanations;
                        }
                    }

                    if (!normalized.explanation) normalized.explanation = [];

                    payload.dasha = normalized as unknown as DashaData;
                }

                setData(payload);
                setError(null);

                // ── Detect locked premium sections ──
                const locked: Set<string> = new Set();
                const premiumKeys = ['dasha', 'ashtakavarga', 'planet_strength_ranking', 'transits', 'key_themes'];
                for (const key of premiumKeys) {
                    const section = (payload as Record<string, unknown>)[key];
                    if (section && typeof section === 'object' && (section as Record<string, unknown>).locked === true) {
                        locked.add(key);
                    }
                }
                if (locked.has('dasha') && payload.dasha) {
                    const dashaLocked = payload.dasha as Record<string, unknown>;
                    const message = (dashaLocked.message as string) || 'Dasha analysis requires a premium subscription.';
                    setPaywallData({
                        featureKey: 'kundli_premium',
                        isSoft: true,
                        title: 'Premium Dasha Analysis',
                        description: message,
                        badge: 'Premium',
                    });
                }
                setLockedSections(locked);
            }
            else {
                console.error("[Kundli] Invalid payload format. Keys found:", Object.keys(result));
                throw new Error('Your celestial blueprint is currently being drawn. Please try refreshing in a moment.');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn || !user?.email) { setLoading(false); return; }
        fetchAnalysis();
    }, [isLoggedIn, user?.email, authLoading, fetchAnalysis]);

    useEffect(() => {
        updateCarouselEdges();
        const el = planetTrackRef.current;
        if (!el) return;
        const handler = () => updateCarouselEdges();
        el.addEventListener('scroll', handler);
        window.addEventListener('resize', handler);
        return () => {
            el.removeEventListener('scroll', handler);
            window.removeEventListener('resize', handler);
        };
    }, [updateCarouselEdges, data]);

    const lagnaSign = useMemo(() => data?.houses.find(h => h.house === 1)?.sign || null, [data]);
    const sunPlanet = useMemo(() => data?.planets.find(p => p.planet === 'Sun'), [data]);
    const moonPlanet = useMemo(() => data?.planets.find(p => p.planet === 'Moon'), [data]);
    const allYogas = useMemo(() => data ? data.planets.flatMap(p => p.yogas.map(y => ({ ...y, planet: p.planet }))) : [], [data]);

    const groupedYogas = useMemo(() => {
        const groups: Record<string, { yogas: (Yoga & { planet: string })[], count: number }> = {};
        allYogas.forEach(y => {
            const baseName = y.name.split('(')[0].trim();
            if (!groups[baseName]) groups[baseName] = { yogas: [], count: 0 };
            groups[baseName].yogas.push(y);
            groups[baseName].count++;
        });
        return groups;
    }, [allYogas]);

    const filteredHouses = useMemo(() => {
        if (!data) return [];
        if (houseFilter === 'active') return data.houses.filter(h => h.occupants.length > 0);
        return data.houses;
    }, [data, houseFilter]);

    const strongHouses = useMemo(() => {
        if (!data) return [];
        return data.houses
            .filter(h => h.occupants.some(o => ['Exalted', 'Swakshetra', 'Moolatrikona'].includes(o.dignity)) || h.occupants.length >= 2)
            .map(h => h.house);
    }, [data]);

    const hasPremiumGrid = lockedSections.has('ashtakavarga')
        || lockedSections.has('planet_strength_ranking')
        || lockedSections.has('transits')
        || lockedSections.has('key_themes');

    // ─── Guard States ────────────────────────────────────────
    if (!authLoading && !isLoggedIn) {
        return (
            <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] flex items-center justify-center px-4">
                <Card className="glass-panel max-w-md w-full text-center p-8">
                    <Lock className="w-12 h-12 text-secondary mx-auto mb-4" />
                    <h2 className="text-2xl font-headline font-bold text-foreground mb-2">Sign In Required</h2>
                    <p className="text-foreground/60 text-sm mb-6">Please log in to view your Kundli.</p>
                    <Button onClick={() => router.push('/login?callbackUrl=' + encodeURIComponent('/kundli'))} className="gold-gradient text-white border-none font-bold px-8 py-3 rounded-xl">Sign In</Button>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)]">
                <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">
                    {/* Header skeleton */}
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <SkeletonCircle size={36} />
                            <div className="space-y-2">
                                <Skeleton height={24} width={180} />
                                <Skeleton height={10} width={140} />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton height={36} width={110} className="rounded-[24px]" />
                            <Skeleton height={36} width={110} className="rounded-[24px]" />
                        </div>
                    </div>

                    {/* Core Identity skeleton */}
                    <div>
                        <Skeleton height={14} width={140} className="mb-3" />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <Card key={i} padding="sm" hoverable={false} className="!rounded-[24px]">
                                    <div className="flex items-center gap-4">
                                        <SkeletonCircle size={64} />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton height={10} width={70} />
                                            <Skeleton height={24} width={120} />
                                            <Skeleton height={10} width={50} />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Carousel skeleton */}
                    <div>
                        <Skeleton height={14} width={170} className="mb-3" />
                        <Card padding="md" hoverable={false} className="!rounded-[24px]">
                            <div className="flex gap-5 overflow-hidden">
                                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                    <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                                        <SkeletonCircle size={72} />
                                        <Skeleton height={10} width={48} />
                                        <Skeleton height={10} width={60} />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Chart + Houses skeleton */}
                    <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5">
                        <Card padding="md" hoverable={false} className="!rounded-[24px]">
                            <Skeleton height={14} width={150} className="mb-4" />
                            <div className="bg-surface-variant/15 rounded-[20px] w-full aspect-square max-w-[460px] mx-auto animate-pulse" />
                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {[1, 2, 3].map(i => <Skeleton key={i} height={56} className="rounded-[14px]" />)}
                            </div>
                        </Card>
                        <Card padding="md" hoverable={false} className="!rounded-[24px]">
                            <Skeleton height={14} width={140} className="mb-4" />
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="space-y-2 p-3 border border-outline-variant/10 rounded-[16px]">
                                        <Skeleton height={16} width={120} />
                                        <Skeleton height={10} width={180} />
                                        <SkeletonText lines={2} />
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Dasha skeleton */}
                    <Card padding="md" hoverable={false} className="!rounded-[24px]">
                        <Skeleton height={14} width={140} className="mb-4" />
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <SkeletonCircle size={40} />
                                        <Skeleton height={14} width={120} />
                                        <Skeleton height={10} width={180} className="ml-auto" />
                                    </div>
                                    <Skeleton height={8} className="w-full rounded-full" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] flex items-center justify-center px-4">
                <Card className="glass-panel max-w-md w-full text-center p-8">
                    <Sparkles className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                    <h2 className="text-xl font-headline font-bold text-foreground mb-2">Analysis Unavailable</h2>
                    <p className="text-foreground/60 text-sm mb-6">{error || 'No data found.'}</p>
                    <Button onClick={() => fetchAnalysis(true)} className="gold-gradient text-white border-none font-bold px-8 py-3 rounded-xl">Generate Dashboard</Button>
                </Card>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)]"
        >
            {/* Hard paywall modal */}
            {paywallData && !paywallData.isSoft && !data && (
                <PaywallCard paywall={paywallData} variant="modal" onClose={() => setPaywallData(null)} />
            )}

            <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-5 sm:py-7 space-y-6">

                {/* ═══ 1. PAGE HEADER ═══ */}
                <header className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => router.back()}
                            className="w-9 h-9 rounded-full bg-surface/50 border border-outline-variant/20 flex items-center justify-center text-foreground/65 hover:text-foreground hover:border-secondary/40 transition-all shrink-0"
                            aria-label="Back"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl md:text-[28px] font-headline font-bold text-foreground leading-tight truncate">Cosmic Blueprint</h1>
                            <p className="text-[10px] sm:text-[11px] text-foreground/55 font-bold uppercase tracking-[0.2em] mt-0.5 truncate">
                                {user?.name ? `${user.name}'s Vedic Chart` : 'Your Vedic Chart'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => fetchAnalysis(true)}
                            disabled={refreshing}
                            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-secondary' : ''}`} />}
                        >
                            <span className="hidden sm:inline">Refresh Chart</span>
                            <span className="sm:hidden">Refresh</span>
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            href="/chat"
                            leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
                        >
                            Ask Navi
                        </Button>
                    </div>
                </header>

                {/* ═══ 2. CORE IDENTITY ═══ */}
                <section>
                    <SectionHeading title="Core Identity" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        {[
                            { label: 'Ascendant', tag: 'Lagna', sign: lagnaSign, color: 'text-secondary' },
                            { label: 'Moon Sign', tag: 'Rashi', sign: moonPlanet?.sign, color: 'text-indigo-300' },
                            { label: 'Sun Sign', tag: 'Surya', sign: sunPlanet?.sign, color: 'text-amber-400' },
                        ].map((item, i) => (
                            <Card key={i} padding="sm" hoverable={false} className="!rounded-[24px]">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 relative shrink-0">
                                        <Image
                                            src={SIGN_TO_ICON[item.sign || 'Aries'] || '/icons/rashi/aries.png'}
                                            alt={item.label}
                                            fill
                                            className="object-contain drop-shadow-[0_0_14px_rgba(200,136,10,0.22)]"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[10px] font-bold ${item.color} uppercase tracking-[0.2em]`}>{item.label}</p>
                                        <p className="text-xl sm:text-2xl font-headline font-bold text-foreground leading-tight mt-0.5">{item.sign || '—'}</p>
                                        <p className="text-[10px] text-foreground/55 font-bold uppercase tracking-wider mt-0.5">{item.tag}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* ═══ 3. PLANETARY POWERS CAROUSEL ═══ */}
                <section>
                    <SectionHeading
                        title="Planetary Powers"
                        accent="blue"
                        hint={
                            <span className="text-[10px] text-secondary/70 font-bold uppercase tracking-widest animate-pulse">
                                ✦ Click any planet
                            </span>
                        }
                    />
                    <Card padding="none" hoverable={false} allowOverflow={false} className="!rounded-[24px] relative">
                        {carouselEdges.left && (
                            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--surface)] via-[var(--surface)]/85 to-transparent pointer-events-none z-10" />
                        )}
                        {carouselEdges.right && (
                            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--surface)] via-[var(--surface)]/85 to-transparent pointer-events-none z-10" />
                        )}
                        {carouselEdges.left && (
                            <button
                                onClick={() => scrollCarousel('left')}
                                className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/95 border border-outline-variant/25 items-center justify-center text-foreground/70 hover:text-secondary hover:border-secondary/50 z-20 shadow-md transition-all"
                                aria-label="Scroll left"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}
                        {carouselEdges.right && (
                            <button
                                onClick={() => scrollCarousel('right')}
                                className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-surface/95 border border-outline-variant/25 items-center justify-center text-foreground/70 hover:text-secondary hover:border-secondary/50 z-20 shadow-md transition-all"
                                aria-label="Scroll right"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                        <div
                            ref={planetTrackRef}
                            className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth no-scrollbar px-5 sm:px-14 py-5"
                        >
                            {data.planets.map(planet => {
                                const dignity = getDignityStyle(planet.dignity);
                                const isSelected = selectedPlanet?.planet === planet.planet;
                                return (
                                    <motion.button
                                        key={planet.planet}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.94 }}
                                        onClick={() => handlePlanetClick(planet)}
                                        className={`flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group rounded-2xl px-2 py-2 transition-all ${isSelected
                                                ? 'bg-secondary/10 ring-1 ring-secondary/40'
                                                : 'hover:bg-surface-variant/15'
                                            }`}
                                    >
                                        <motion.div layoutId={`planet-fly-${planet.planet}`}>
                                            <PlanetIcon planet={planet.planet} size="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px]" />
                                        </motion.div>
                                        <p className="text-[12px] font-headline font-bold text-foreground group-hover:text-secondary transition-colors leading-none mt-1">
                                            {planet.planet}
                                        </p>
                                        <span className={`text-[8.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${dignity.bg} ${dignity.text} ${dignity.border}`}>
                                            {dignity.label}
                                        </span>
                                        <span className={`text-[8.5px] font-bold ${planet.retrograde ? 'text-orange-400' : 'invisible'}`}>
                                            ℞ Retro
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </Card>
                </section>

                {/* ═══ 4. CHART + HOUSES ═══ */}
                <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-5">
                    {/* Chart */}
                    <Card padding="sm" hoverable={false} className="!rounded-[24px]">
                        <div className="p-1 sm:p-2">
                            <SectionHeading title="Vedic Birth Chart" />
                            <div className="bg-surface-variant/15 rounded-[20px] p-4 sm:p-6 border border-outline-variant/12 flex items-center justify-center">
                                <KundliSvg className="w-full max-w-[460px] mx-auto drop-shadow-xl" />
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-2">
                                <div className="bg-surface-variant/15 rounded-[14px] p-3 border border-outline-variant/12">
                                    <p className="text-[9px] font-bold text-foreground/55 uppercase tracking-widest">Ascendant</p>
                                    <p className="text-[14px] font-headline font-bold text-foreground mt-1 leading-none">{lagnaSign || '—'}</p>
                                </div>
                                <div className="bg-surface-variant/15 rounded-[14px] p-3 border border-outline-variant/12">
                                    <p className="text-[9px] font-bold text-foreground/55 uppercase tracking-widest">Moon</p>
                                    <p className="text-[14px] font-headline font-bold text-foreground mt-1 leading-none">{moonPlanet?.sign || '—'}</p>
                                </div>
                                <div className="bg-surface-variant/15 rounded-[14px] p-3 border border-outline-variant/12">
                                    <p className="text-[9px] font-bold text-foreground/55 uppercase tracking-widest">Strong Houses</p>
                                    <p className="text-[14px] font-headline font-bold text-foreground mt-1 leading-none">
                                        {strongHouses.length ? strongHouses.slice(0, 4).map(h => `H${h}`).join(', ') : '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Houses */}
                    <Card padding="sm" hoverable={false} className="!rounded-[24px]">
                        <div className="p-1 sm:p-2">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-4 rounded-full bg-emerald-400" />
                                <h2 className="text-[12px] font-bold text-emerald-400 uppercase tracking-[0.2em]">House Analysis</h2>
                                <div className="flex gap-1.5 ml-auto">
                                    {(['active', 'all'] as const).map(f => (
                                        <button
                                            key={f}
                                            onClick={() => setHouseFilter(f)}
                                            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all ${houseFilter === f
                                                    ? 'bg-secondary/15 text-secondary border-secondary/40'
                                                    : 'text-foreground/55 border-outline-variant/15 hover:text-foreground/80'
                                                }`}
                                        >
                                            {f === 'active' ? 'Active' : 'All 12'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2.5">
                                {filteredHouses.map(house => {
                                    const hasOcc = house.occupants.length > 0;
                                    const isSelected = selectedHouse?.house === house.house;
                                    const meaning = simpleText(house.interpretation?.[0]);
                                    return (
                                        <button
                                            key={house.house}
                                            onClick={() => handleHouseClick(house)}
                                            className={`text-left rounded-[16px] p-3 border transition-all relative overflow-hidden ${isSelected
                                                    ? 'bg-secondary/10 border-secondary/45 ring-1 ring-secondary/30'
                                                    : hasOcc
                                                        ? 'bg-surface/40 border-outline-variant/20 hover:border-secondary/35'
                                                        : 'bg-surface/20 border-outline-variant/15 hover:border-outline-variant/30 opacity-80 hover:opacity-100'
                                                }`}
                                        >
                                            {hasOcc && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-secondary/55 rounded-l-[14px]" />}
                                            <div className="mb-1.5">
                                                <p className="text-[14px] font-headline font-bold text-foreground leading-tight">{house.name.split('(')[0].trim()}</p>
                                                <p className="text-[10px] text-foreground/65 font-bold uppercase tracking-wider mt-0.5">
                                                    H{house.house} · {house.sign} · Lord {house.lord}
                                                </p>
                                            </div>
                                            {hasOcc && (
                                                <div className="flex flex-wrap gap-1 mb-1.5">
                                                    {house.occupants.map((occ, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                                            style={{
                                                                color: PLANET_COLORS[occ.planet],
                                                                backgroundColor: `${PLANET_COLORS[occ.planet]}1f`,
                                                                borderColor: `${PLANET_COLORS[occ.planet]}45`,
                                                            }}
                                                        >
                                                            {PLANET_GLYPHS[occ.planet]} {occ.planet}
                                                            {occ.dignity === 'Exalted' && <span className="text-[8px] opacity-80">⬆</span>}
                                                            {occ.dignity === 'Debilitated' && <span className="text-[8px] opacity-80">⬇</span>}
                                                            {occ.retrograde && <span className="text-[8px] text-orange-400">℞</span>}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {meaning ? (
                                                <p className="text-[12px] text-foreground/72 leading-snug line-clamp-2">{meaning}</p>
                                            ) : house.areas.length > 0 ? (
                                                <p className="text-[11px] text-foreground/60 font-medium">{house.areas.slice(0, 4).join(' · ')}</p>
                                            ) : null}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </section>

                {/* ═══ 5. SELECTION INSIGHT ═══ */}
                <AnimatePresence mode="wait">
                    {(selectedPlanet || selectedHouse) && (
                        <motion.section
                            ref={insightRef}
                            key={selectedPlanet?.planet || `house-${selectedHouse?.house}`}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.25 }}
                        >
                            <SectionHeading
                                title={selectedPlanet ? 'Selected Planet' : 'Selected House'}
                                hint={
                                    <button
                                        onClick={closeInsight}
                                        className="flex items-center gap-1 text-[10px] font-bold text-foreground/55 hover:text-secondary uppercase tracking-wider transition-colors"
                                    >
                                        <X className="w-3 h-3" /> Close
                                    </button>
                                }
                            />
                            <Card padding="md" hoverable={false} className="!rounded-[24px]">
                                {selectedPlanet && <PlanetDetail planet={selectedPlanet} />}
                                {selectedHouse && <HouseDetail house={selectedHouse} />}
                            </Card>
                        </motion.section>
                    )}
                </AnimatePresence>

                {/* ═══ 6. DASHA TIMELINE ═══ */}
                <section>
                    <SectionHeading title="Current Dasha" />
                    {lockedSections.has('dasha') ? (
                        <PaywallCard
                            paywall={paywallData || {
                                featureKey: 'kundli_premium',
                                isSoft: true,
                                title: 'Premium Dasha Analysis',
                                description: (data.dasha as unknown as Record<string, unknown>)?.message as string || 'Dasha timing analysis requires a premium subscription.',
                                badge: 'Premium',
                            }}
                            variant="inline"
                        />
                    ) : (
                        <DashaTimeline dasha={data.dasha} />
                    )}
                </section>

                {/* ═══ 7. COSMIC STRENGTHS ═══ */}
                {allYogas.length > 0 && (
                    <section>
                        <SectionHeading
                            title="Cosmic Strengths"
                            accent="amber"
                            hint={
                                <span className="text-[10px] text-amber-400/75 font-bold uppercase tracking-widest">
                                    {allYogas.length} yogas
                                </span>
                            }
                        />
                        <Card padding="md" hoverable={false} className="!rounded-[24px]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {Object.entries(groupedYogas).map(([baseName, group], idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                            <h4 className="text-[13px] font-bold text-amber-400 leading-tight flex-1">{baseName}</h4>
                                            {group.count > 1 && (
                                                <span className="text-[9px] font-bold text-amber-400/80 bg-amber-500/12 px-1.5 py-0.5 rounded-full">{group.count}×</span>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            {group.yogas.map((yoga, yi) => (
                                                <div key={yi} className="flex items-start gap-2 pl-5">
                                                    <span className="text-[12px] shrink-0 leading-tight" style={{ color: PLANET_COLORS[yoga.planet] }}>
                                                        {PLANET_GLYPHS[yoga.planet]}
                                                    </span>
                                                    <p className="text-[12px] text-foreground/70 leading-snug">{yoga.effect}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </section>
                )}

                {/* ═══ 8. PREMIUM INSIGHTS ═══ */}
                {hasPremiumGrid && (
                    <section>
                        <SectionHeading
                            title="Premium Insights"
                            hint={
                                <span className="text-[10px] text-foreground/55 font-bold uppercase tracking-widest">
                                    Unlock with Pro
                                </span>
                            }
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {lockedSections.has('ashtakavarga') && (
                                <PaywallCard
                                    paywall={{
                                        featureKey: 'kundli_premium',
                                        isSoft: true,
                                        title: 'Ashtakavarga Analysis',
                                        titleHi: 'अष्टकवर्ग विश्लेषण',
                                        description: typeof ((data as unknown as Record<string, unknown>)?.ashtakavarga) === 'object'
                                            ? ((data as unknown as Record<string, Record<string, unknown>>).ashtakavarga?.message as string) || 'Unlock Ashtakavarga binding scores with a Pro plan.'
                                            : 'Unlock Ashtakavarga binding scores with a Pro plan.',
                                        icon: '🪐',
                                        badge: 'Pro',
                                    }}
                                    variant="inline"
                                />
                            )}
                            {lockedSections.has('planet_strength_ranking') && (
                                <PaywallCard
                                    paywall={{
                                        featureKey: 'kundli_premium',
                                        isSoft: true,
                                        title: 'Planet Strength Ranking',
                                        titleHi: 'ग्रह बल रैंकिंग',
                                        description: typeof ((data as unknown as Record<string, unknown>)?.planet_strength_ranking) === 'object'
                                            ? ((data as unknown as Record<string, Record<string, unknown>>).planet_strength_ranking?.message as string) || 'Unlock detailed planet strength rankings with a Pro plan.'
                                            : 'Unlock detailed planet strength rankings with a Pro plan.',
                                        icon: '💪',
                                        badge: 'Pro',
                                    }}
                                    variant="inline"
                                />
                            )}
                            {lockedSections.has('transits') && (
                                <PaywallCard
                                    paywall={{
                                        featureKey: 'kundli_premium',
                                        isSoft: true,
                                        title: 'Current Transits',
                                        titleHi: 'वर्तमान गोचर',
                                        description: typeof ((data as unknown as Record<string, unknown>)?.transits) === 'object'
                                            ? ((data as unknown as Record<string, Record<string, unknown>>).transits?.message as string) || 'Unlock current planetary transit analysis with a Pro plan.'
                                            : 'Unlock current planetary transit analysis with a Pro plan.',
                                        icon: '🔄',
                                        badge: 'Pro',
                                    }}
                                    variant="inline"
                                />
                            )}
                            {lockedSections.has('key_themes') && (
                                <PaywallCard
                                    paywall={{
                                        featureKey: 'kundli_premium',
                                        isSoft: true,
                                        title: 'Key Life Themes',
                                        titleHi: 'मुख्य जीवन विषय',
                                        description: typeof ((data as unknown as Record<string, unknown>)?.key_themes) === 'object'
                                            ? ((data as unknown as Record<string, Record<string, unknown>>).key_themes?.message as string) || 'Unlock key life theme insights with a Pro plan.'
                                            : 'Unlock key life theme insights with a Pro plan.',
                                        icon: '🎯',
                                        badge: 'Pro',
                                    }}
                                    variant="inline"
                                />
                            )}
                        </div>
                    </section>
                )}

            </div>
        </motion.div>
    );
}

// ─── Subcomponents ──────────────────────────────────────────

function PlanetDetail({ planet }: { planet: PlanetData }) {
    const dignity = getDignityStyle(planet.dignity);
    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Left: giant icon */}
            <div className="md:w-[220px] shrink-0 flex flex-col items-center text-center">
                <div className="relative mb-4">
                    <div
                        className="absolute inset-[-30px] rounded-full blur-[60px] opacity-30"
                        style={{ backgroundColor: PLANET_COLORS[planet.planet] }}
                    />
                    <motion.div
                        layoutId={`planet-fly-${planet.planet}`}
                        transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                    >
                        <PlanetIcon planet={planet.planet} size="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]" />
                    </motion.div>
                </div>
                <h3 className="text-2xl xl:text-3xl font-headline font-bold text-foreground leading-none">{planet.planet}</h3>
                <p className="text-[11px] font-bold text-secondary uppercase tracking-[0.25em] mt-2">
                    {planet.sign} · House {planet.house}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${dignity.bg} ${dignity.text} ${dignity.border}`}>
                        {dignity.label}
                    </span>
                    {planet.retrograde && (
                        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/25 px-3 py-1 rounded-full">
                            ℞ Retrograde
                        </span>
                    )}
                </div>
            </div>

            {/* Right: stats + interpretation + yogas */}
            <div className="flex-1 min-w-0 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { l: 'Degree', v: `${planet.degree.toFixed(2)}°` },
                        { l: 'Shadbala', v: planet.shadbala > 0 ? planet.shadbala.toFixed(1) : '—' },
                        { l: 'Lord Of', v: planet.lordOf?.length ? `H${planet.lordOf.join(', H')}` : '—' },
                        { l: 'Sign', v: planet.sign },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col px-3 py-2.5 bg-surface-variant/15 rounded-[12px] border border-outline-variant/12">
                            <span className="text-[9px] font-bold text-foreground/55 uppercase tracking-widest">{stat.l}</span>
                            <span className="text-[13px] font-bold text-foreground mt-0.5">{stat.v}</span>
                        </div>
                    ))}
                </div>

                {planet.conjunctions.length > 0 && (
                    <div>
                        <p className="text-[10px] font-bold text-foreground/55 uppercase tracking-widest mb-2">Conjunctions</p>
                        <div className="flex flex-wrap gap-2">
                            {planet.conjunctions.map((p, i) => (
                                <span key={i} className="px-3 py-1.5 bg-surface-variant/25 rounded-full text-[11px] font-bold text-foreground/75 border border-outline-variant/20">
                                    <span style={{ color: PLANET_COLORS[p] }}>{PLANET_GLYPHS[p]}</span> {p}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h4 className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Cosmic Interpretation
                    </h4>
                    <div className="space-y-3">
                        {planet.interpretation.map((item, i) => {
                            const simple = simpleText(item);
                            const tech = techText(item);
                            return (
                                <div key={i} className="group/int-line pl-4 border-l-2 border-secondary/30">
                                    <p className="text-[13px] text-foreground/75 leading-relaxed">{simple}</p>
                                    {tech && (
                                        <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mt-1 opacity-0 group-hover/int-line:opacity-100 transition-opacity duration-300">
                                            {tech}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {planet.yogas.length > 0 && (
                    <div>
                        <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Active Yogas
                        </h4>
                        <div className="space-y-2">
                            {planet.yogas.map((yoga, i) => (
                                <div key={i} className="bg-amber-500/[0.05] border border-amber-500/20 rounded-[14px] p-3">
                                    <h5 className="text-[12px] font-bold text-amber-400 mb-1">{yoga.name}</h5>
                                    <p className="text-[11.5px] 3xl:text-[16px] text-foreground/70 leading-relaxed">{yoga.effect}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="pt-1">
                    <Link
                        href="/chat"
                        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-secondary hover:text-secondary/80 uppercase tracking-wider transition-colors"
                    >
                        Ask Navi about {planet.planet}
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

function HouseDetail({ house }: { house: HouseData }) {
    const meanings = house.interpretation || [];
    return (
        <div className="space-y-5">
            <div className="flex items-start gap-4 flex-wrap">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                    <Home className="w-7 h-7 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-[200px]">
                    <h3 className="text-2xl font-headline font-bold text-foreground leading-tight">{house.name.split('(')[0].trim()}</h3>
                    <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-[0.2em] mt-1">
                        House {house.house} · {house.sign} · Lord {house.lord}
                    </p>
                </div>
            </div>

            {house.occupants.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-foreground/55 uppercase tracking-widest mb-2">Planets in this house</p>
                    <div className="flex flex-wrap gap-2">
                        {house.occupants.map((occ, i) => (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full border"
                                style={{
                                    color: PLANET_COLORS[occ.planet],
                                    backgroundColor: `${PLANET_COLORS[occ.planet]}1f`,
                                    borderColor: `${PLANET_COLORS[occ.planet]}50`,
                                }}
                            >
                                {PLANET_GLYPHS[occ.planet]} {occ.planet}
                                {occ.dignity === 'Exalted' && <span className="text-[9px] opacity-80">⬆</span>}
                                {occ.dignity === 'Debilitated' && <span className="text-[9px] opacity-80">⬇</span>}
                                {occ.retrograde && <span className="text-[9px] text-orange-400">℞</span>}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {house.areas.length > 0 && (
                <div>
                    <p className="text-[10px] font-bold text-foreground/55 uppercase tracking-widest mb-2">Areas of life</p>
                    <p className="text-[13px] text-foreground/75 leading-relaxed">{house.areas.join(' · ')}</p>
                </div>
            )}

            {meanings.length > 0 && (
                <div>
                    <h4 className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" /> Meaning
                    </h4>
                    <div className="space-y-3">
                        {meanings.map((item, i) => {
                            const simple = simpleText(item);
                            const tech = techText(item);
                            return (
                                <div key={i} className="group/h-int pl-4 border-l-2 border-secondary/30">
                                    <p className="text-[13px] text-foreground/75 leading-relaxed">{simple}</p>
                                    {tech && (
                                        <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest mt-1 opacity-0 group-hover/h-int:opacity-100 transition-opacity duration-300">
                                            {tech}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="pt-1">
                <Link
                    href="/chat"
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold text-secondary hover:text-secondary/80 uppercase tracking-wider transition-colors"
                >
                    Ask Navi about this house
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}

function DashaTimeline({ dasha }: { dasha: DashaData }) {
    const hasActive = (dasha.active?.length || 0) > 0;
    const hasRows = (dasha.rows?.length || 0) > 0;
    const hasCurrent = dasha.current || dasha.currentMahaDasha;
    const explanation = dasha.explanation || [];
    const theme = explanation[0];
    const rest = explanation.slice(1);

    // Compute progress against "now" inside an effect so render stays pure.
    const [progress, setProgress] = useState<{ pct: number; rem: string }[]>([]);
    useEffect(() => {
        if (!dasha.active?.length) { setProgress([]); return; }
        const now = Date.now();
        setProgress(dasha.active.map(period => {
            const start = new Date(period.start).getTime();
            const end = new Date(period.end).getTime();
            const total = end - start;
            const elapsed = now - start;
            const pct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
            const remDays = Math.max(0, Math.ceil((end - now) / 86400000));
            const rem = remDays > 365 ? `${(remDays / 365).toFixed(1)} years` : `${remDays} days`;
            return { pct, rem };
        }));
    }, [dasha.active]);

    if (!hasActive && !hasRows && !hasCurrent) {
        return (
            <Card padding="md" hoverable={false} className="!rounded-[24px]">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Info className="w-7 h-7 text-foreground/30 mb-2" />
                    <p className="text-[12px] font-bold text-foreground/60 uppercase tracking-widest">
                        Dasha timing unavailable for this profile.
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card padding="md" hoverable={false} className="!rounded-[24px]">
            <div className="space-y-5">
                {hasActive && dasha.active?.map((period, idx) => {
                    const start = new Date(period.start);
                    const end = new Date(period.end);
                    const { pct, rem } = progress[idx] || { pct: 0, rem: '—' };
                    const isMaha = period.type === 'Mahadasha';
                    return (
                        <div
                            key={idx}
                            className={idx < (dasha.active?.length || 0) - 1 ? 'pb-5 border-b border-outline-variant/12' : ''}
                        >
                            <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                                <div className="w-10 h-10 relative shrink-0 flex items-center justify-center">
                                    {PLANET_TO_ICON[period.planet] ? (
                                        <Image
                                            src={PLANET_TO_ICON[period.planet]}
                                            alt={period.planet}
                                            fill
                                            className="object-contain"
                                        />
                                    ) : (
                                        <span className="text-2xl" style={{ color: PLANET_COLORS[period.planet] }}>
                                            {PLANET_GLYPHS[period.planet]}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[15px] font-headline font-bold text-foreground">{period.planet}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isMaha ? 'bg-secondary/15 text-secondary' : 'bg-purple-500/15 text-purple-400'
                                        }`}>
                                        {isMaha ? 'Mahādashā' : 'Antardasā'}
                                    </span>
                                </div>
                                <span className="text-[10px] text-foreground/60 font-bold uppercase tracking-wider ml-auto">
                                    {start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} — {end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-surface-variant/30 overflow-hidden mb-1.5">
                                <motion.div
                                    className="h-full rounded-full bg-gradient-to-r from-secondary/85 to-amber-500/85"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                />
                            </div>
                            <div className="flex justify-between text-[11px]">
                                <span className="text-foreground/60 font-bold">{pct.toFixed(0)}% elapsed</span>
                                <span className="text-secondary font-bold">{rem} left</span>
                            </div>
                        </div>
                    );
                })}

                {!hasActive && hasRows && dasha.rows?.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-outline-variant/12 last:border-0">
                        <div className="flex items-center gap-2">
                            <span className="text-xl" style={{ color: PLANET_COLORS[row.planet] }}>
                                {PLANET_GLYPHS[row.planet] || '✦'}
                            </span>
                            <span className="text-[13px] font-bold text-foreground">{row.planet}</span>
                            {row.active && (
                                <span className="text-[8.5px] font-bold bg-secondary/15 text-secondary px-1.5 py-0.5 rounded ml-1 uppercase">Active</span>
                            )}
                        </div>
                        <span className="text-[10px] text-foreground/60 font-bold uppercase tracking-wider">{row.dates}</span>
                    </div>
                ))}

                {!hasActive && !hasRows && hasCurrent && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-foreground/55 uppercase tracking-widest">Active Period</span>
                            <span className="text-[13px] font-bold text-secondary uppercase tracking-wider">
                                {(() => {
                                    const d = dasha.currentMahaDasha || dasha.current;
                                    if (typeof d === 'object' && d !== null) return d.planet || d.name || '—';
                                    return d;
                                })()}
                            </span>
                        </div>
                        {dasha.remaining && (
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-foreground/55 uppercase tracking-widest">Time Remaining</span>
                                <span className="text-[13px] font-bold text-foreground/80">{dasha.remaining}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {theme && (
                <div className="mt-5 pt-5 border-t border-outline-variant/12 space-y-3">
                    <div>
                        <p className="text-[10px] font-bold text-foreground/55 uppercase tracking-widest mb-2">Theme</p>
                        <p className="text-[13px] text-foreground/75 leading-relaxed">{simpleText(theme)}</p>
                    </div>
                    {rest.length > 0 && (
                        <details className="group/dasha-more">
                            <summary className="text-[10px] font-bold text-secondary uppercase tracking-widest cursor-pointer list-none flex items-center gap-1 hover:text-secondary/80">
                                <ChevronRight className="w-3 h-3 group-open/dasha-more:rotate-90 transition-transform" />
                                Read more
                            </summary>
                            <div className="space-y-2 mt-3 pl-4">
                                {rest.map((item, i) => (
                                    <p key={i} className="text-[12.5px] 3xl:text-[17px] text-foreground/65 leading-relaxed">{simpleText(item)}</p>
                                ))}
                            </div>
                        </details>
                    )}
                </div>
            )}
        </Card>
    );
}
