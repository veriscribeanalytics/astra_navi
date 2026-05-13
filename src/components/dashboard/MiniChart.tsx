'use client';

import React from 'react';
import { useTranslation } from '@/hooks';
import { catmullRomToBezier, catmullRomArea } from '@/utils/chartCurve';

export interface ForecastDay {
    date: string; is_today: boolean; score: number; text: string;
    dominant_planet: string; 
    personalized_alerts: (string | { technical: string; simple: string })[];
    transits?: Record<string, { sign: string; house_from_moon: number; house_from_lagna: number }>;
}

export default function MiniChart({ days, colorHex, activeDate }: { days: ForecastDay[]; colorHex: string; activeDate?: string }) {
    const { t } = useTranslation();
    const h = 60, w = 220;
    const points = days.map((d, i) => ({ x: (i / (days.length - 1)) * w, y: h - (d.score / 100) * h }));
    const pathD = catmullRomToBezier(points);
    const areaD = catmullRomArea(points, h);

    const todayIndex = days.findIndex(d => d.is_today);
    const todayX = todayIndex !== -1 ? points[todayIndex].x : w / 2;

    const bestPoint = points[days.reduce((bestIdx, d, i) => d.score > days[bestIdx].score ? i : bestIdx, 0)];
    const worstPoint = points[days.reduce((worstIdx, d, i) => d.score < days[worstIdx].score ? i : worstIdx, 0)];

    return (
        <div className="relative">
            <svg viewBox={`-24 -14 ${w + 34} ${h + 20}`} className="w-full h-auto overflow-visible">
                <defs>
                    <linearGradient id={`area-${colorHex.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colorHex} stopOpacity="0.15" />
                        <stop offset="100%" stopColor={colorHex} stopOpacity="0.01" />
                    </linearGradient>
                    <clipPath id={`reveal-${colorHex.replace('#','')}`}>
                        <rect x="-24" y="-14" width="0" height={h + 30}>
                            <animate attributeName="width" from="0" to={w + 40} dur="1.2s" fill="freeze" begin="0.3s" />
                        </rect>
                    </clipPath>
                </defs>

                {/* Y-Axis Labels & Grid */}
                {[25, 50, 75].map(v => {
                    const gridY = h - (v / 100) * h;
                    return (
                        <g key={v}>
                            <line x1="0" y1={gridY} x2={w} y2={gridY} stroke="var(--color-foreground)" strokeOpacity="0.1" strokeWidth="0.5" />
                            <text x="-8" y={gridY + 2} textAnchor="end" fontSize="5" fill="var(--color-foreground)" fillOpacity="0.2">{v}</text>
                        </g>
                    );
                })}

                {/* Past / Future Demarcation */}
                <rect x="0" y="0" width={todayX} height={h} fill="currentColor" fillOpacity="0.02" />
                <rect x={todayX} y="0" width={w - todayX} height={h} fill="currentColor" fillOpacity="0.01" />
                <line x1={todayX} y1="0" x2={todayX} y2={h} stroke="currentColor" strokeOpacity="0.15" strokeDasharray="2 2" strokeWidth="0.5" />
                <text x={todayX - 4} y="-4" textAnchor="end" fontSize="5.5" fill="var(--color-foreground)" fillOpacity="0.2" fontWeight="bold" letterSpacing="0.5">{t('horoscope.past')}</text>
                <text x={todayX + 4} y="-4" textAnchor="start" fontSize="5.5" fill="var(--color-foreground)" fillOpacity="0.2" fontWeight="bold" letterSpacing="0.5">{t('horoscope.forecast')}</text>

                <g clipPath={`url(#reveal-${colorHex.replace('#','')})`}>
                    <path d={areaD} fill={`url(#area-${colorHex.replace('#','')})`} />
                    <path d={pathD} fill="none" stroke={colorHex} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    {(() => {
                        // Pre-compute which labels are visible (priority: selected > today > best > worst > normal)
                        // and reposition labels that would collide with a higher-priority label
                        const labelPriority = (idx: number) => {
                            const d = days[idx];
                            const p = points[idx];
                            if (activeDate === d.date) return 5;
                            if (d.is_today) return 4;
                            if (p === bestPoint) return 3;
                            if (p === worstPoint) return 2;
                            return 1; // All points are label-eligible
                        };

                        // Compute label position for each point: default above, flip below on collision
                        const LABEL_OFFSET = 10;
                        const MIN_DIST_X = 16;
                        const MIN_DIST_Y = 7;
                        const sorted = points
                            .map((_, i) => i)
                            .sort((a, b) => labelPriority(b) - labelPriority(a));
                        const placed: { x: number; y: number; idx: number }[] = [];
                        const labelPositions = new Map<number, number>(); // idx → labelY
                        for (const idx of sorted) {
                            const p = points[idx];
                            const aboveY = p.y - LABEL_OFFSET;
                            const belowY = p.y + LABEL_OFFSET + 4;
                            const collidesAbove = placed.some(pl =>
                                Math.abs(pl.x - p.x) < MIN_DIST_X && Math.abs(pl.y - aboveY) < MIN_DIST_Y
                            );
                            if (!collidesAbove) {
                                labelPositions.set(idx, aboveY);
                                placed.push({ x: p.x, y: aboveY, idx });
                            } else {
                                const collidesBelow = placed.some(pl =>
                                    Math.abs(pl.x - p.x) < MIN_DIST_X && Math.abs(pl.y - belowY) < MIN_DIST_Y
                                );
                                if (!collidesBelow) {
                                    labelPositions.set(idx, belowY);
                                    placed.push({ x: p.x, y: belowY, idx });
                                }
                                // If both above and below collide, skip this label
                            }
                        }

                        return points.map((p, i) => {
                            const d = days[i];
                            const isSelected = activeDate === d.date;
                            const isToday = d.is_today;
                            const isBest = p === bestPoint;
                            const isWorst = p === worstPoint;
                            const labelY = labelPositions.get(i);

                            return (
                                <g key={i}>
                                    {/* Static Point Representation */}
                                    {(d.is_today || isSelected) && <circle cx={p.x} cy={p.y} r="5" fill={colorHex} opacity={isSelected ? 0.15 : 0.08} />}
                                    <circle cx={p.x} cy={p.y} r={d.is_today ? 3 : 1.5} 
                                        fill={d.is_today || isSelected ? colorHex : 'transparent'} 
                                        stroke={colorHex} strokeWidth={d.is_today || isSelected ? 0 : 1} />
                                    
                                    {labelY !== undefined && (
                                        <text x={p.x} y={labelY} textAnchor="middle" 
                                            fill={isSelected ? colorHex : 'var(--color-foreground)'} 
                                            fillOpacity={isSelected ? 1 : isToday || isBest || isWorst ? 0.5 : 0.35} 
                                            fontSize="7" fontWeight="bold">{d.score}</text>
                                    )}

                                    {isSelected && <line x1={p.x} y1={p.y + 4} x2={p.x} y2={h + 20} stroke={colorHex} strokeWidth="1" strokeDasharray="3 3" opacity="0.2" />}
                                </g>
                            );
                        });
                    })()}
                </g>
            </svg>
            
            {/* Timeline connection bridge */}
            <div className="relative h-1 mt-0.5 mx-2 sm:mx-8" />
        </div>
    );
}
