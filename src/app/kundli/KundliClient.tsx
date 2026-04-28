"use client";

import { useAuth } from "@/context/AuthContext";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
    Sparkles, Home, Globe, Lock,
    ArrowLeft, RefreshCw, ChevronLeft,
    Activity, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PLANET_GLYPHS, PLANET_COLORS, SIGN_TO_ICON, PLANET_TO_ICON, getDignityStyle } from "@/lib/astrology";
import PlanetIcon from "@/components/ui/astrology/PlanetIcon";

// ─── Types ───────────────────────────────────────────────────
interface Occupant { planet: string; dignity: string; retrograde: boolean; }
interface HouseData { house: number; name: string; areas: string[]; sign: string; lord: string; lordHouse: number; occupants: Occupant[]; interpretation: (string | { technical: string; simple: string })[]; }
interface Yoga { name: string; effect: string; }
interface PlanetData { planet: string; sign: string; house: number; degree: number; dignity: string; shadbala: number; retrograde: boolean; conjunctions: string[]; lordOf: number[]; interpretation: (string | { technical: string; simple: string })[]; yogas: Yoga[]; }
interface DashaData { 
    active?: { type: string; planet: string; start: string; end: string }[]; 
    rows?: { planet: string; dates: string; type?: string; active?: boolean }[];
    current?: string;
    currentMahaDasha?: string;
    remaining?: string;
    explanation: (string | { technical: string; simple: string })[]; 
}
interface AnalysisData { houses: HouseData[]; planets: PlanetData[]; dasha: DashaData; }

// ─── Constants ───────────────────────────────────────────────

export default function KundliPage() {
    const { user, isLoggedIn, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<AnalysisData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
    const [planetDetails, setPlanetDetails] = useState<any>(null);
    const [planetLoading, setPlanetLoading] = useState(false);
    const [houseFilter, setHouseFilter] = useState<'active' | 'all'>('active');

    const handlePlanetClick = async (planet: PlanetData) => {
        if (selectedPlanet?.planet === planet.planet) { setSelectedPlanet(null); setPlanetDetails(null); return; }
        setSelectedPlanet(planet);
        setPlanetDetails(null);
        setPlanetLoading(true);
        try {
            const res = await fetch(`/api/planets/${planet.planet}`);
            const result = await res.json();
            if (result.success && result.details) setPlanetDetails(result.details);
        } catch (err) { console.error("Failed to fetch planet details", err); }
        finally { setPlanetLoading(false); }
    };

    const fetchAnalysis = useCallback(async (forceRefresh = false) => {
        try {
            if (forceRefresh) setRefreshing(true); else setLoading(true);
            const res = await fetch('/api/analyze-full', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ force_refresh: forceRefresh }) 
            });
            if (!res.ok) { 
                const errData = await res.json().catch(() => ({})); 
                throw new Error(errData.error || errData.detail || 'The stars are temporarily obscured.'); 
            }
            const result = await res.json();
            
            // Try to extract the core astrology data from various possible response formats
            let payload = result.astrologyData 
                || result.data?.astrologyData 
                || result.insights?.astrologyData 
                || result.insights 
                || result.data 
                || result;

            // Handle potential stringified JSON within the payload
            if (typeof payload === 'string') {
                try {
                    payload = JSON.parse(payload);
                } catch (e) {
                    console.error("[Kundli] Failed to parse payload string:", e);
                }
            }

            // Sometimes the data is double-nested in a 'data' or 'astrologyData' key inside the payload
            if (payload && !payload.houses && payload.astrologyData) {
                payload = payload.astrologyData;
            }
            if (payload && !payload.houses && payload.data) {
                payload = payload.data;
            }

            if (payload && typeof payload === 'object' && payload.houses) {                 
                // Ensure planets exists as an array to avoid rendering crashes
                if (!payload.planets) payload.planets = [];
                
                // Defensive check: ensure every planet has the required arrays
                payload.planets = payload.planets.map((p: any) => ({
                    ...p,
                    yogas: p.yogas || [],
                    interpretation: p.interpretation || [],
                    conjunctions: p.conjunctions || [],
                    lordOf: p.lordOf || []
                }));

                // Defensive check for houses
                payload.houses = payload.houses.map((h: any) => ({
                    ...h,
                    occupants: h.occupants || [],
                    interpretation: h.interpretation || [],
                    areas: h.areas || []
                }));

                setData(payload); 
                setError(null); 
            }
            else {
                console.error("[Kundli] Invalid payload format. Keys found:", Object.keys(result));
                throw new Error('Your celestial blueprint is currently being drawn. Please try refreshing in a moment.'); 
            }
        } catch (err: any) { setError(err.message); }
        finally { setLoading(false); setRefreshing(false); }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!isLoggedIn || !user?.email) { setLoading(false); return; }
        fetchAnalysis();
    }, [isLoggedIn, user?.email, authLoading, fetchAnalysis]);

    const lagnaSign = useMemo(() => data?.houses.find(h => h.house === 1)?.sign || null, [data]);
    const sunPlanet = useMemo(() => data?.planets.find(p => p.planet === 'Sun'), [data]);
    const moonPlanet = useMemo(() => data?.planets.find(p => p.planet === 'Moon'), [data]);
    const allYogas = useMemo(() => data ? data.planets.flatMap(p => p.yogas.map(y => ({ ...y, planet: p.planet }))) : [], [data]);

    // Group yogas by name pattern
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

    // ─── Guard States ────────────────────────────────────────
    if (!authLoading && !isLoggedIn) {
        return (<div className="min-h-[calc(100dvh-var(--navbar-height,64px))] flex items-center justify-center px-4"><Card className="glass-panel max-w-md w-full text-center p-8">
            <Lock className="w-12 h-12 text-secondary mx-auto mb-4" /><h2 className="text-2xl font-headline font-bold text-foreground mb-2">Sign In Required</h2>
            <p className="text-foreground/60 text-sm mb-6">Please log in to view your Kundli.</p>
            <Button onClick={() => router.push('/login')} className="gold-gradient text-white border-none font-bold px-8 py-3 rounded-xl">Sign In</Button>
        </Card></div>);
    }
    if (loading) {
        return (
            <div className="h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)] flex flex-col overflow-hidden">
                <div className="flex-1 max-w-[1600px] w-full mx-auto px-3 py-2 flex flex-col gap-4 min-h-0 animate-pulse">
                    <div className="flex justify-between items-center h-10">
                        <div className="w-48 h-8 bg-surface-variant/20 rounded-xl" />
                        <div className="w-24 h-8 bg-surface-variant/20 rounded-xl" />
                    </div>
                    <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                        <div className="w-full lg:w-[300px] xl:w-[330px] flex flex-col gap-4">
                            <div className="h-40 bg-surface-variant/10 rounded-[20px]" />
                            <div className="h-48 bg-surface-variant/10 rounded-[20px]" />
                            <div className="h-64 bg-surface-variant/10 rounded-[20px]" />
                        </div>
                        <div className="flex-1 bg-surface-variant/10 rounded-[20px]" />
                    </div>
                </div>
            </div>
        );
    }
    if (error || !data) {
        return (<div className="min-h-[calc(100dvh-var(--navbar-height,64px))] flex items-center justify-center px-4"><Card className="glass-panel max-w-md w-full text-center p-8">
            <Sparkles className="w-12 h-12 text-orange-500 mx-auto mb-4" /><h2 className="text-xl font-headline font-bold text-foreground mb-2">Analysis Unavailable</h2>
            <p className="text-foreground/60 text-sm mb-6">{error || 'No data found.'}</p>
            <Button onClick={() => fetchAnalysis(true)} className="gold-gradient text-white border-none font-bold px-8 py-3 rounded-xl">Generate Dashboard</Button>
        </Card></div>);
    }

    // ═══════════════════════════════════════════════════════════
    return (
        <div className="h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)] flex flex-col overflow-hidden">
            <div className="flex-1 max-w-[1600px] w-full mx-auto px-3 py-2 flex flex-col gap-2 min-h-0">

                {/* ═══ HEADER ═══ */}
                <div className="flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2.5">
                        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-surface/30 border border-outline-variant/10 flex items-center justify-center text-foreground/40 hover:text-foreground transition-all">
                            <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                        <div>
                            <h1 className="text-lg font-headline font-bold text-foreground leading-none">Cosmic Blueprint</h1>
                            <p className="text-[9px] text-foreground/30 font-bold uppercase tracking-[0.15em]">{user?.name}&apos;s Vedic Chart</p>
                        </div>
                    </div>
                    <button onClick={() => fetchAnalysis(true)} disabled={refreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface/30 border border-outline-variant/10 text-[10px] font-bold text-foreground/40 uppercase tracking-widest hover:text-secondary hover:border-secondary/20 transition-all">
                        <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin text-secondary' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* ═══ TWO-COLUMN LAYOUT ═══ */}
                <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-0 lg:overflow-hidden overflow-y-auto scrollbar-hide">

                    {/* ─── LEFT SIDEBAR ─── */}
                    <div className="w-full lg:w-[300px] xl:w-[330px] shrink-0 flex flex-col gap-2.5 lg:overflow-y-auto scrollbar-hide pr-0 lg:pr-3 border-b lg:border-b-0 lg:border-r border-outline-variant/10 pb-4 lg:pb-0">

                        {/* ── Core Identity ── */}
                        <div>
                            <div className="flex items-center gap-2 mb-2.5">
                                <div className="w-1 h-4 rounded-full bg-secondary" />
                                <h2 className="text-[12px] font-bold text-secondary uppercase tracking-[0.2em]">Core Identity</h2>
                            </div>
                            <Card padding="sm" variant="default" hoverable={false} className="!rounded-[20px]">
                                <div className="space-y-3">
                                    {[
                                        { label: 'Ascendant (Lagna)', sign: lagnaSign, color: 'text-secondary', accent: 'border-secondary/20' },
                                        { label: 'Moon Sign (Rashi)', sign: moonPlanet?.sign, color: 'text-indigo-300', accent: 'border-indigo-400/20' },
                                        { label: 'Sun Sign (Surya)', sign: sunPlanet?.sign, color: 'text-amber-400', accent: 'border-amber-500/20' },
                                    ].map((item, i) => (
                                        <div key={i} className={`flex items-center gap-3 pb-3 ${i < 2 ? 'border-b border-outline-variant/10' : ''}`}>
                                            <div className="w-14 h-14 relative shrink-0">
                                                <Image src={SIGN_TO_ICON[item.sign || 'Aries'] || '/icons/rashi/aries.png'} alt={item.label} fill className="object-contain drop-shadow-[0_0_12px_rgba(200,136,10,0.15)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[10px] font-bold ${item.color} uppercase tracking-[0.2em]`}>{item.label}</p>
                                                <p className="text-lg font-headline font-bold text-foreground leading-tight">{item.sign}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* ── Current Dasha ── */}
                        <div>
                            <div className="flex items-center gap-2 mb-2.5">
                                <div className="w-1 h-4 rounded-full bg-secondary" />
                                <h2 className="text-[12px] font-bold text-secondary uppercase tracking-[0.2em]">Current Dasha</h2>
                            </div>
                            <Card padding="sm" variant="default" hoverable={false} className="!rounded-[20px]">
                                { ((data.dasha?.active?.length || 0) > 0) || ((data.dasha?.rows?.length || 0) > 0) || data.dasha?.current || data.dasha?.currentMahaDasha ? (
                                    <>
                                        <div className="space-y-3">
                                            {/* Format 1: Active periods with start/end */}
                                            {data.dasha?.active?.map((period, idx) => {
                                            const start = new Date(period.start);
                                            const end = new Date(period.end);
                                            const now = Date.now();
                                            const total = end.getTime() - start.getTime();
                                            const elapsed = now - start.getTime();
                                            const pct = total > 0 ? Math.min(100, Math.max(0, (elapsed / total) * 100)) : 0;
                                            const remDays = Math.max(0, Math.ceil((end.getTime() - now) / 86400000));
                                            const rem = remDays > 365 ? `${(remDays / 365).toFixed(1)} years` : `${remDays} days`;
                                            const isMaha = period.type === 'Mahadasha';
                                            return (
                                                <div key={idx} className={idx < (data.dasha?.active?.length || 0) - 1 ? 'pb-3 border-b border-outline-variant/10' : ''}>
                                                    <div className="flex items-center gap-2.5 mb-1.5">
                                                        <div className="w-8 h-8 relative shrink-0 flex items-center justify-center">
                                                            {PLANET_TO_ICON[period.planet] ? (
                                                                <Image src={PLANET_TO_ICON[period.planet]} alt={period.planet} fill className="object-contain" />
                                                            ) : (
                                                                <span className="text-lg" style={{ color: PLANET_COLORS[period.planet] }}>{PLANET_GLYPHS[period.planet]}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[13px] font-bold text-foreground">{period.planet}
                                                                    <span className={`ml-1.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                                                        isMaha ? 'bg-secondary/10 text-secondary' : 'bg-purple-500/10 text-purple-400'
                                                                    }`}>{isMaha ? 'Mahādashā' : 'Antardasā'}</span>
                                                                </span>
                                                            </div>
                                                            <p className="text-[9px] text-foreground/40 font-bold mt-0.5 uppercase tracking-wider">
                                                                {start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} — {end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-surface-variant/30 overflow-hidden mb-1">
                                                        <motion.div className="h-full rounded-full bg-gradient-to-r from-secondary/80 to-amber-500/80"
                                                            initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
                                                    </div>
                                                    <div className="flex justify-between text-[11px]">
                                                        <span className="text-foreground/30 font-bold">{pct.toFixed(0)}% elapsed</span>
                                                        <span className="text-secondary font-bold">{rem} left</span>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Format 2: Rows (Chat format) */}
                                        {!data.dasha?.active?.length && data.dasha?.rows?.map((row, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-2 border-b border-outline-variant/10 last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg" style={{ color: PLANET_COLORS[row.planet] }}>{PLANET_GLYPHS[row.planet] || '✦'}</span>
                                                    <span className="text-xs font-bold text-foreground">{row.planet}</span>
                                                    {row.active && <span className="text-[8px] font-bold bg-secondary/10 text-secondary px-1 py-0.5 rounded ml-1 uppercase">Active</span>}
                                                </div>
                                                <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider">{row.dates}</span>
                                            </div>
                                        ))}

                                        {/* Format 3: Single current string (Dashboard format) */}
                                        {!data.dasha?.active?.length && !data.dasha?.rows?.length && (data.dasha?.current || data.dasha?.currentMahaDasha) && (
                                            <div className="py-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Active Period</span>
                                                    <span className="text-xs font-bold text-secondary uppercase tracking-wider">{data.dasha?.currentMahaDasha || data.dasha?.current}</span>
                                                </div>
                                                {data.dasha?.remaining && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest">Time Remaining</span>
                                                        <span className="text-xs font-bold text-foreground/60">{data.dasha.remaining}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-outline-variant/10 space-y-3">
                                            {data.dasha.explanation?.map((item, idx) => {
                                                const isObject = typeof item === 'object' && item !== null;
                                                const simpleText = isObject ? item.simple : item;
                                                const techText = isObject ? item.technical : null;
                                                return (
                                                    <div key={idx} className="group/dasha-exp">
                                                        <p className="text-[12px] text-foreground/40 leading-relaxed">
                                                            {simpleText}
                                                        </p>
                                                        {techText && (
                                                            <p className="text-[10px] text-foreground/20 font-bold uppercase tracking-widest mt-1 opacity-0 group-hover/dasha-exp:opacity-100 transition-opacity duration-300">
                                                                {techText}
                                                            </p>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                                        <Info className="w-6 h-6 text-foreground/20 mb-2" />
                                        <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest leading-relaxed">
                                            Dasha timing unavailable for this profile.
                                        </p>
                                    </div>
                                )}
                            </Card>
                        </div>

                        {/* ── Cosmic Strengths (Yogas) — Grouped ── */}
                        {allYogas.length > 0 && (
                            <div className="flex-1 min-h-0">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <div className="w-1 h-4 rounded-full bg-amber-400" />
                                    <h2 className="text-[12px] font-bold text-amber-400 uppercase tracking-[0.2em]">Cosmic Strengths</h2>
                                    <span className="text-[10px] text-foreground/20 font-bold ml-auto">{allYogas.length} yogas</span>
                                </div>
                                <Card padding="sm" variant="default" hoverable={false} className="!rounded-[20px]">
                                    <div className="space-y-2.5">
                                        {Object.entries(groupedYogas).map(([baseName, group], idx) => (
                                            <div key={idx} className={idx < Object.keys(groupedYogas).length - 1 ? 'pb-2.5 border-b border-outline-variant/10' : ''}>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                                                    <h4 className="text-[12px] font-bold text-amber-400 leading-tight flex-1">{baseName}</h4>
                                                    {group.count > 1 && (
                                                        <span className="text-[8px] font-bold text-amber-400/60 bg-amber-500/10 px-1.5 py-0.5 rounded-full">{group.count}×</span>
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    {group.yogas.map((yoga, yi) => (
                                                        <div key={yi} className="flex items-start gap-1.5 pl-4">
                                                            <span className="text-[10px] shrink-0 mt-0.5" style={{ color: PLANET_COLORS[yoga.planet] }}>{PLANET_GLYPHS[yoga.planet]}</span>
                                                            <p className="text-[11px] text-foreground/40 leading-snug">{yoga.effect}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>

                    {/* ─── RIGHT MAIN ─── */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2.5 lg:min-h-0 pl-0 lg:pl-3 w-full">

                        <Card padding="sm" variant="default" hoverable={false} className="!rounded-[20px] flex flex-col flex-1 lg:min-h-0 overflow-hidden">

                            {/* ── HEADER — always visible ── */}
                            <div className="flex items-center gap-2 mb-2 shrink-0">
                                {selectedPlanet ? (
                                    <button onClick={() => { setSelectedPlanet(null); setPlanetDetails(null); }}
                                        className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/30 uppercase tracking-widest hover:text-secondary transition-colors">
                                        <ChevronLeft className="w-4 h-4" /> Back
                                    </button>
                                ) : null}
                                <div className="flex-1" />
                                <Globe className="w-4 h-4 text-blue-400" />
                                <h2 className="text-[12px] font-bold uppercase text-foreground tracking-wider">Planetary Powers</h2>
                                {!selectedPlanet && (
                                    <span className="text-[10px] text-secondary/60 font-bold ml-2 uppercase tracking-widest animate-pulse">
                                        ✦ Click any planet
                                    </span>
                                )}
                            </div>

                            {/* ── PLANET STRIP — collapses when a planet is selected ── */}
                            <motion.div
                                animate={{
                                    height: selectedPlanet ? 0 : 'auto',
                                    opacity: selectedPlanet ? 0 : 1,
                                    marginBottom: selectedPlanet ? 0 : 12,
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="shrink-0 overflow-hidden"
                            >
                                <div className="flex justify-start lg:justify-center items-start gap-3 sm:gap-4 lg:gap-5 pb-3 overflow-x-auto scrollbar-hide px-1">
                                    {data.planets.map(planet => {
                                        const dignity = getDignityStyle(planet.dignity);
                                        return (
                                            <motion.div
                                                key={planet.planet}
                                                whileHover={{ scale: 1.08 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => handlePlanetClick(planet)}
                                                className="flex flex-col items-center gap-1 cursor-pointer group relative h-[140px] sm:h-[155px] lg:h-[170px] justify-start shrink-0"
                                            >
                                                <motion.div layoutId={`planet-fly-${planet.planet}`}>
                                                    <PlanetIcon planet={planet.planet} size="w-[56px] h-[56px] sm:w-[72px] sm:h-[72px] lg:w-[96px] lg:h-[96px]" />
                                                </motion.div>

                                                <p className="text-[11px] sm:text-[12px] font-headline font-bold text-foreground group-hover:text-secondary transition-colors leading-none relative z-10">
                                                    {planet.planet}
                                                </p>

                                                <div className="flex flex-col items-center gap-0.5">
                                                    <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${dignity.bg} ${dignity.text} ${dignity.border}`}>
                                                        {dignity.label}
                                                    </span>
                                                    {planet.retrograde ? (
                                                        <span className="text-[8px] font-bold text-orange-400">℞ Retro</span>
                                                    ) : (
                                                        <span className="text-[8px] invisible">℞ Retro</span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>

                            {/* ── CONTENT AREA — planet detail or houses ── */}
                            <div className="flex-1 min-h-0 overflow-hidden">
                                {selectedPlanet ? (
                                    /* ═══ PLANET DETAIL: Giant icon left + details right ═══ */
                                    <motion.div
                                        key={`detail-${selectedPlanet.planet}`}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.2 }}
                                        className="h-full flex flex-col md:flex-row gap-6 md:gap-8 lg:overflow-y-auto"
                                    >
                                        {/* LEFT: Giant planet — flies here via layoutId */}
                                        <div className="w-full md:w-[240px] xl:w-[280px] shrink-0 flex flex-col items-center justify-center pt-8 md:pt-0">
                                            <div className="relative mb-6">
                                                <motion.div
                                                    className="absolute inset-[-40px] rounded-full blur-[70px] opacity-25"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 0.25 }}
                                                    transition={{ delay: 0.3 }}
                                                    style={{ backgroundColor: PLANET_COLORS[selectedPlanet.planet] }}
                                                />
                                                <motion.div
                                                    layoutId={`planet-fly-${selectedPlanet.planet}`}
                                                    transition={{ type: "spring", stiffness: 180, damping: 24 }}
                                                >
                                                    <PlanetIcon planet={selectedPlanet.planet} size="w-[180px] h-[180px] xl:w-[220px] xl:h-[220px]" />
                                                </motion.div>
                                            </div>

                                            <motion.div
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.25 }}
                                                className="text-center"
                                            >
                                                <h3 className="text-3xl xl:text-4xl font-headline font-bold text-foreground leading-none mb-2">
                                                    {selectedPlanet.planet}
                                                </h3>
                                                <p className="text-[12px] font-bold text-secondary uppercase tracking-[0.3em] mb-3">
                                                    {selectedPlanet.sign} · House {selectedPlanet.house}
                                                </p>
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${getDignityStyle(selectedPlanet.dignity).bg} ${getDignityStyle(selectedPlanet.dignity).text} ${getDignityStyle(selectedPlanet.dignity).border}`}>
                                                        {selectedPlanet.dignity}
                                                    </span>
                                                    {selectedPlanet.retrograde && (
                                                        <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full">℞ Retrograde</span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>

                                        {/* RIGHT: Details */}
                                        <motion.div
                                            initial={{ opacity: 0, x: 40 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.15, type: "spring", stiffness: 250, damping: 28 }}
                                            className="flex-1 min-w-0 space-y-5 overflow-y-auto pr-1"
                                        >
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { l: "Degree", v: `${selectedPlanet.degree.toFixed(2)}°` },
                                                    { l: "Shadbala", v: selectedPlanet.shadbala > 0 ? selectedPlanet.shadbala.toFixed(1) : '—' },
                                                    { l: "Lord Of", v: selectedPlanet.lordOf?.length ? `H${selectedPlanet.lordOf.join(', H')}` : '—' },
                                                    { l: "Sign", v: selectedPlanet.sign },
                                                ].map((stat, i) => (
                                                    <motion.div key={i}
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.2 + i * 0.04 }}
                                                        className="flex justify-between items-center px-3 py-2.5 bg-surface-variant/20 rounded-[12px] border border-outline-variant/5">
                                                        <span className="text-[10px] font-bold text-foreground/25 uppercase tracking-widest">{stat.l}</span>
                                                        <span className="text-[13px] font-bold text-foreground">{stat.v}</span>
                                                    </motion.div>
                                                ))}
                                            </div>

                                            {selectedPlanet.conjunctions.length > 0 && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                                                    <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest block mb-2">Conjunctions</span>
                                                    <div className="flex flex-wrap gap-2">
                                                        {selectedPlanet.conjunctions.map((p, i) => (
                                                            <span key={i} className="px-3 py-1.5 bg-surface-variant/30 rounded-full text-[11px] font-bold text-foreground/50 border border-outline-variant/10">
                                                                <span style={{ color: PLANET_COLORS[p] }}>{PLANET_GLYPHS[p]}</span> {p}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}

                                            <div>
                                                <h4 className="text-[11px] font-bold text-secondary uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                                                    <Info className="w-3.5 h-3.5" /> Cosmic Interpretation
                                                </h4>
                                                {planetLoading ? (
                                                    <div className="space-y-3 animate-pulse">
                                                        <div className="h-4 bg-surface-variant/20 rounded w-full" />
                                                        <div className="h-4 bg-surface-variant/20 rounded w-4/5" />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {(planetDetails?.interpretation || selectedPlanet.interpretation).map((item: any, i: number) => {
                                                            const isObject = typeof item === 'object' && item !== null;
                                                            const simpleText = isObject ? item.simple : item;
                                                            const techText = isObject ? item.technical : null;
                                                            return (
                                                                <div key={i} className="group/int-line pl-4 border-l-2 border-secondary/20">
                                                                    <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                                                                        className="text-[13px] text-foreground/55 leading-relaxed">
                                                                        {simpleText}
                                                                    </motion.p>
                                                                    {techText && (
                                                                        <p className="text-[10px] text-foreground/20 font-bold uppercase tracking-widest mt-1 opacity-0 group-hover/int-line:opacity-100 transition-opacity duration-300">
                                                                            {techText}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>

                                            {(planetDetails?.yogas?.length > 0 || selectedPlanet.yogas?.length > 0) && (
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
                                                        <Sparkles className="w-3.5 h-3.5" /> Active Yogas
                                                    </h4>
                                                    <div className="space-y-2">
                                                        {(planetDetails?.yogas || selectedPlanet.yogas).map((yoga: Yoga, i: number) => (
                                                            <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.06 }}
                                                                className="bg-amber-500/[0.04] border border-amber-500/15 rounded-[14px] p-3">
                                                                <h5 className="text-[12px] font-bold text-amber-400 mb-1">{yoga.name}</h5>
                                                                <p className="text-[11px] text-foreground/40 leading-relaxed">{yoga.effect}</p>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    </motion.div>
                                ) : (
                                    /* ═══ HOUSES GRID ═══ */
                                    <div className="h-full overflow-y-auto border-t border-outline-variant/10 pt-3">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Home className="w-4 h-4 text-emerald-400" />
                                            <h3 className="text-[12px] font-bold text-foreground uppercase tracking-wider">Houses</h3>
                                            <div className="w-12 h-px bg-gradient-to-r from-secondary/30 to-transparent" />
                                            <div className="flex gap-1.5 ml-auto">
                                                {(['active', 'all'] as const).map(f => (
                                                    <button key={f} onClick={() => setHouseFilter(f)}
                                                        className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border transition-all ${
                                                            houseFilter === f
                                                                ? 'bg-secondary/15 text-secondary border-secondary/30'
                                                                : 'text-foreground/25 border-outline-variant/10 hover:text-foreground/40'
                                                        }`}>
                                                        {f === 'active' ? 'Active Houses' : 'All 12 Houses'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {filteredHouses.map(house => {
                                                const hasOcc = house.occupants.length > 0;
                                                return (
                                                    <div key={house.house} className={`rounded-[16px] p-3 border transition-all relative overflow-hidden ${
                                                        hasOcc
                                                            ? 'bg-surface/40 border-secondary/15 hover:border-secondary/30'
                                                            : 'bg-surface border-outline-variant/8 opacity-70 hover:opacity-90'
                                                    }`}>
                                                        {hasOcc && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-secondary/40 rounded-l-[14px]" />}
                                                        <div className="mb-1.5">
                                                            <p className="text-[14px] font-headline font-bold text-foreground leading-tight">{house.name.split('(')[0].trim()}</p>
                                                            <p className="text-[10px] text-foreground/30 font-bold">H{house.house} · {house.sign} · Lord: {house.lord}</p>
                                                        </div>
                                                        {hasOcc && (
                                                            <div className="flex flex-wrap gap-1 mb-1.5">
                                                                {house.occupants.map((occ, i) => (
                                                                    <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                                                        style={{
                                                                            color: PLANET_COLORS[occ.planet],
                                                                            backgroundColor: `${PLANET_COLORS[occ.planet]}15`,
                                                                            borderColor: `${PLANET_COLORS[occ.planet]}30`,
                                                                        }}>
                                                                        {PLANET_GLYPHS[occ.planet]} {occ.planet}
                                                                        {occ.dignity !== 'Normal' && <span className="text-[7px] opacity-70">{occ.dignity === 'Exalted' ? '⬆' : '⬇'}</span>}
                                                                        {occ.retrograde && <span className="text-[7px] text-orange-400">℞</span>}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {house.interpretation?.[0] && (() => {
                                                            const item = house.interpretation[0];
                                                            const isObject = typeof item === 'object' && item !== null;
                                                            const simpleText = isObject ? (item as any).simple : item;
                                                            return (
                                                                <p className="text-[11px] text-foreground/40 leading-snug line-clamp-2">{simpleText}</p>
                                                            );
                                                        })()}
                                                        {!house.interpretation?.[0] && house.areas.length > 0 && (
                                                            <div className="flex flex-wrap gap-0.5">
                                                                {house.areas.slice(0, 3).map((a, i) => (
                                                                    <span key={i} className="text-[9px] text-foreground/25 font-bold">{a}{i < 2 && house.areas.length > 1 ? ' · ' : ''}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
