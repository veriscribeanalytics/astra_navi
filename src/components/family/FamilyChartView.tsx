'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Home, Globe, Sparkles, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import PlanetIcon from '@/components/ui/astrology/PlanetIcon';
import {
    PLANET_COLORS,
    PLANET_GLYPHS,
    SIGN_TO_ICON,
    getDignityStyle,
} from '@/lib/astrology';
import type { FamilyChart, FamilyHouse, FamilyPlanet } from '@/types/family';

interface FamilyChartViewProps {
    chart: FamilyChart;
}

const PLANET_ORDER = [
    'Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu',
];

function motionBadge(motion?: string | null, combust?: boolean) {
    if (combust) {
        return { label: 'COMBUST', classes: 'text-red-300 bg-red-500/10 border-red-500/20' };
    }
    const retro = motion && motion.toLowerCase() !== 'direct';
    if (retro) {
        return { label: 'RETROGRADE', classes: 'text-amber-300 bg-amber-500/10 border-amber-500/20' };
    }
    return { label: 'NORMAL', classes: 'text-[#B1AABE] bg-[rgba(196,181,253,0.10)] border-[rgba(196,181,253,0.20)]' };
}

export default function FamilyChartView({ chart }: FamilyChartViewProps) {
    const planetNames = useMemo(() => {
        const keys = Object.keys(chart.planets || {});
        return keys.sort((a, b) => {
            const ai = PLANET_ORDER.indexOf(a);
            const bi = PLANET_ORDER.indexOf(b);
            if (ai === -1 && bi === -1) return a.localeCompare(b);
            if (ai === -1) return 1;
            if (bi === -1) return -1;
            return ai - bi;
        });
    }, [chart.planets]);

    const houseEntries = useMemo(() => {
        const entries = Object.entries(chart.houses || {});
        return entries
            .map(([num, data]) => ({ num: Number(num), data }))
            .sort((a, b) => a.num - b.num);
    }, [chart.houses]);

    const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
    const [selectedHouse, setSelectedHouse] = useState<{ num: number; data: FamilyHouse } | null>(null);
    const [houseFilter, setHouseFilter] = useState<'active' | 'all'>('active');

    if (planetNames.length === 0 || houseEntries.length === 0) {
        return (
            <div className="rounded-2xl border border-outline-variant/30 p-6 text-center">
                <Sparkles className="w-5 h-5 text-secondary/40 mx-auto mb-2" />
                <p className="text-sm text-on-surface-variant/75">
                    Chart is being prepared. Try refreshing in a moment.
                </p>
            </div>
        );
    }

    const lagnaSign = chart.lagna?.sign || '';
    const moonSign = chart.planets?.Moon?.sign || '';
    const sunSign = chart.planets?.Sun?.sign || '';
    const lagnaSubtitle = [
        chart.lagna?.nakshatra,
        chart.lagna?.pada ? `Pada ${chart.lagna.pada}` : null,
    ].filter(Boolean).join(' · ');

    const selected = selectedPlanet ? chart.planets[selectedPlanet] : null;

    const filteredHouses = houseFilter === 'active'
        ? houseEntries.filter(({ data }) => (data.occupants?.length ?? 0) > 0)
        : houseEntries;

    return (
        <div className="space-y-5">
            {/* Core Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <IdentityCard
                    label="Ascendant (Lagna)"
                    sign={lagnaSign}
                    subtitle={lagnaSubtitle}
                    accent="text-secondary"
                />
                <IdentityCard
                    label="Moon Sign (Rashi)"
                    sign={moonSign}
                    subtitle={chart.planets?.Moon?.nakshatra}
                    accent="text-indigo-300"
                />
                <IdentityCard
                    label="Sun Sign (Surya)"
                    sign={sunSign}
                    subtitle={chart.planets?.Sun?.nakshatra}
                    accent="text-amber-400"
                />
            </div>

            {/* Planet strip */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Globe className="w-4 h-4 text-blue-400" />
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/85">
                        Planets
                    </h4>
                    {!selectedPlanet && (
                        <span className="ml-2 text-[10px] text-secondary/80 font-bold uppercase tracking-widest">
                            ✦ Tap any planet
                        </span>
                    )}
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-4 lg:grid-cols-9">
                    {planetNames.map((name) => {
                        const p = chart.planets[name];
                        const isSelected = selectedPlanet === name;
                        const motion = motionBadge(p.motion);
                        return (
                            <button
                                key={name}
                                onClick={() => {
                                    setSelectedHouse(null);
                                    setSelectedPlanet(isSelected ? null : name);
                                }}
                                className={`flex min-w-0 flex-col items-center gap-1 px-2 py-1.5 rounded-2xl transition-all ${
                                    isSelected
                                        ? 'bg-secondary/10 ring-1 ring-secondary/40'
                                        : 'hover:bg-secondary/5'
                                }`}
                                aria-pressed={isSelected}
                            >
                                <PlanetIcon planet={name} size="w-12 h-12 sm:w-14 sm:h-14" glow={isSelected} />
                                <p className="text-[11px] font-bold text-primary leading-none">{name}</p>
                                <span
                                    className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${motion.classes}`}
                                >
                                    {motion.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Detail OR Houses */}
            {selected && selectedPlanet ? (
                <PlanetDetail
                    planet={selectedPlanet}
                    data={selected}
                    onBack={() => setSelectedPlanet(null)}
                />
            ) : (
                <HousesGrid
                    houses={filteredHouses}
                    filter={houseFilter}
                    onFilterChange={setHouseFilter}
                    selectedHouse={selectedHouse}
                    onSelect={(h) => {
                        setSelectedPlanet(null);
                        setSelectedHouse(h.num === selectedHouse?.num ? null : h);
                    }}
                />
            )}
        </div>
    );
}

function IdentityCard({
    label,
    sign,
    subtitle,
    accent,
}: {
    label: string;
    sign: string;
    subtitle?: string;
    accent: string;
}) {
    const iconSrc = sign ? SIGN_TO_ICON[sign] : null;
    return (
        <div
            className="rounded-2xl border border-[rgba(196,181,253,0.10)] hover:border-[rgba(201,151,46,0.25)] bg-[#190F33] p-3 flex items-center gap-3 transition-all duration-300 group"
        >
            <div className="w-12 h-12 relative shrink-0">
                {iconSrc ? (
                    <Image
                        src={iconSrc}
                        alt={sign}
                        fill
                        className="object-contain drop-shadow-[0_0_12px_rgba(200,136,10,0.18)]"
                    />
                ) : (
                    <div className="w-full h-full rounded-xl bg-surface-variant/30" />
                )}
            </div>
            <div className="min-w-0">
                <p className={`text-[9px] font-bold uppercase tracking-[0.2em] ${accent}`}>{label}</p>
                <p className="text-base font-headline font-bold text-primary truncate">
                    {sign || '—'}
                </p>
                {subtitle && (
                    <p className="text-[10px] text-[#B1AABE] truncate">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

function PlanetDetail({
    planet,
    data,
    onBack,
}: {
    planet: string;
    data: FamilyPlanet;
    onBack: () => void;
}) {
    const dignity = getDignityStyle(data.dignity);
    const motion = motionBadge(data.motion);
    const stats = [
        { l: 'Sign', v: data.sign || '—' },
        { l: 'House', v: data.house ? `H${data.house}` : '—' },
        { l: 'Degree', v: typeof data.sign_degree === 'number' ? `${data.sign_degree.toFixed(2)}°` : '—' },
        { l: 'Pada', v: data.pada ? `${data.pada}` : '—' },
        { l: 'Lord Of', v: data.lord_of?.length ? `H${data.lord_of.join(', H')}` : '—' },
    ];

    return (
        <div className="rounded-2xl border border-outline-variant/30 p-4">
            <button
                onClick={onBack}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/65 hover:text-secondary transition-colors mb-3"
            >
                <ChevronLeft className="w-3.5 h-3.5" /> Back to Houses
            </button>

            <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex flex-col items-center gap-2 sm:w-40 shrink-0">
                    <PlanetIcon planet={planet} size="w-24 h-24 sm:w-28 sm:h-28" glow />
                    <h3 className="text-xl font-headline font-bold text-primary">{planet}</h3>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary/90">
                        {data.sign} · H{data.house}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                        <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${dignity.bg} ${dignity.text} ${dignity.border}`}
                        >
                            {dignity.label}
                        </span>
                        <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${motion.classes}`}
                        >
                            {motion.label}
                        </span>
                    </div>
                </div>

                <div className="flex-1 min-w-0 space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        {stats.map((s) => (
                            <div
                                key={s.l}
                                className="flex justify-between items-center px-3 py-2 bg-surface-variant/20 rounded-xl border border-outline-variant/10"
                            >
                                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/65">
                                    {s.l}
                                </span>
                                <span className="text-[12px] font-bold text-primary truncate ml-2">{s.v}</span>
                            </div>
                        ))}
                    </div>

                    {data.nakshatra && (
                        <div className="px-3 py-2 bg-surface-variant/20 rounded-xl border border-outline-variant/10">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-0.5 flex items-center gap-1">
                                <Info className="w-3 h-3" /> Nakshatra
                            </p>
                            <p className="text-[12px] font-bold text-primary">{data.nakshatra}</p>
                        </div>
                    )}

                    {data.conjuncts && data.conjuncts.length > 0 && (
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/65 mb-1.5">
                                Conjunctions
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {data.conjuncts.map((c) => (
                                    <span
                                        key={c}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border"
                                        style={{
                                            color: PLANET_COLORS[c],
                                            backgroundColor: `${PLANET_COLORS[c] ?? '#888'}20`,
                                            borderColor: `${PLANET_COLORS[c] ?? '#888'}40`,
                                        }}
                                    >
                                        <span>{PLANET_GLYPHS[c] ?? '✦'}</span> {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function HousesGrid({
    houses,
    filter,
    onFilterChange,
    selectedHouse,
    onSelect,
}: {
    houses: Array<{ num: number; data: { sign: string; lord: string; occupants: string[] } }>;
    filter: 'active' | 'all';
    onFilterChange: (f: 'active' | 'all') => void;
    selectedHouse: { num: number; data: { sign: string; lord: string; occupants: string[] } } | null;
    onSelect: (h: { num: number; data: { sign: string; lord: string; occupants: string[] } }) => void;
}) {
    return (
        <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <Home className="w-4 h-4 text-emerald-400" />
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/85">
                    Houses
                </h4>
                <div className="flex gap-1.5">
                    {(['active', 'all'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => onFilterChange(f)}
                            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition-all ${
                                filter === f
                                    ? 'bg-secondary/15 text-secondary border-secondary/30'
                                    : 'text-on-surface-variant/65 border-outline-variant/20 hover:text-on-surface-variant/90'
                            }`}
                        >
                            {f === 'active' ? 'Occupied Houses' : 'All 12 Houses'}
                        </button>
                    ))}
                </div>
            </div>

            {houses.length === 0 ? (
                <p className="text-xs text-on-surface-variant/70 italic">
                    No occupied houses in this chart.
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {houses.map(({ num, data }) => {
                            const hasOcc = (data.occupants?.length ?? 0) > 0;
                            const isSelected = selectedHouse?.num === num;
                            return (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => onSelect({ num, data })}
                                    className={`text-left rounded-2xl p-3 border transition-all relative overflow-hidden ${
                                        isSelected
                                            ? 'bg-surface border-secondary/45 ring-1 ring-secondary/30'
                                            : hasOcc
                                                ? 'bg-surface border-secondary/20 hover:border-secondary/40'
                                                : 'bg-surface border-outline-variant/15 opacity-70 hover:opacity-100'
                                    }`}
                                    aria-pressed={isSelected}
                                >
                                    {hasOcc && (
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-secondary/55 rounded-l-2xl" />
                                    )}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-headline font-bold text-primary">
                                                H{num}
                                                <span className="text-[10px] font-bold text-on-surface-variant/80 ml-1.5">
                                                    {data.sign}
                                                </span>
                                            </p>
                                            <p className="text-[10px] text-on-surface-variant/70 font-bold mt-0.5">
                                                Lord: {data.lord || '—'}
                                            </p>
                                            {hasOcc && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {data.occupants.map((p) => (
                                                        <span
                                                            key={p}
                                                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border"
                                                            style={{
                                                                color: PLANET_COLORS[p],
                                                                backgroundColor: `${PLANET_COLORS[p] ?? '#888'}1A`,
                                                                borderColor: `${PLANET_COLORS[p] ?? '#888'}40`,
                                                            }}
                                                        >
                                                            <span>{PLANET_GLYPHS[p] ?? '✦'}</span> {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span
                                                className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                                    hasOcc
                                                        ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                                                        : 'text-on-surface-variant/70 bg-surface-variant/20 border-outline-variant/20'
                                                }`}
                                            >
                                                {hasOcc ? `Occupied · ${data.occupants.length}` : 'Empty'}
                                            </span>
                                            <ChevronRight
                                                className={`w-4 h-4 text-on-surface-variant/60 transition-transform ${
                                                    isSelected ? 'rotate-90 text-secondary' : ''
                                                }`}
                                            />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {selectedHouse && (
                        <div className="mt-4">
                            <HouseDetail house={selectedHouse} onBack={() => onSelect(selectedHouse)} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function HouseDetail({
    house,
    onBack,
}: {
    house: { num: number; data: { sign: string; lord: string; occupants: string[] } };
    onBack: () => void;
}) {
    const { num, data } = house;
    return (
        <div className="rounded-2xl border border-outline-variant/30 p-4">
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/65 hover:text-secondary transition-colors mb-3"
            >
                <ChevronLeft className="w-3.5 h-3.5" /> Close house details
            </button>
            <div className="flex flex-col sm:flex-row gap-5">
                <div className="flex flex-col items-center gap-1.5 sm:w-40 shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-surface-variant/20 border border-outline-variant/20 flex items-center justify-center text-secondary font-headline font-bold text-3xl">
                        H{num}
                    </div>
                    <p className="text-lg font-headline font-bold text-primary">{data.sign}</p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary/90">Lord: {data.lord || '—'}</p>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant/65 mb-2">Occupants</p>
                    {data.occupants?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {data.occupants.map((p) => (
                                <span
                                    key={p}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border"
                                    style={{
                                        color: PLANET_COLORS[p],
                                        backgroundColor: `${PLANET_COLORS[p] ?? '#888'}1A`,
                                        borderColor: `${PLANET_COLORS[p] ?? '#888'}40`,
                                    }}
                                >
                                    <span>{PLANET_GLYPHS[p] ?? '✦'}</span> {p}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-on-surface-variant/70 italic">No planets occupy this house.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
