'use client';

import React, { useEffect, useRef, useState } from 'react';
import { catmullRomToBezier, catmullRomArea, type Point } from '@/utils/chartCurve';
import type { FamilyDashboardWeeklyResponse } from '@/types/familyDashboard';

/**
 * Weekly bond curve — the relationship counterpart of the personal dashboard's
 * weekly outlook chart.
 *
 * Differences from the personal chart, per the Family Dashboard spec:
 *  - Height ~320px (not full-screen tall; values only move a few points/day).
 *  - Past days render a solid line; future days render a dashed line. Today is
 *    the divider and carries the larger highlighted marker.
 *  - A small legend ("Past ——  Forecast – – –") replaces the giant
 *    PAST/FORECAST overlay text.
 *  - Score labels sit above each point but smaller; weekday + day-of-month sit
 *    under every point.
 *  - The Y-axis uses a sensible visible range with a MINIMUM 20-point span
 *    (e.g. 65–85) computed from the data with padding, so flat weeks don't
 *    squash the curve to a flat line at the chart's midline.
 *
 * The parent renders the "Stable week" reassurance line and the four compact
 * summary cards (best/toughest/average/trend) — this component is just the
 * graph itself.
 */
export default function BondWeeklyChart({
    data,
    colorHex,
    stable,
    locale = 'en-IN',
}: {
    data: FamilyDashboardWeeklyResponse;
    colorHex: string;
    /** When the week barely moves, the parent passes a "Stable week…" caption
     *  to render as a subtle band label so flat curves still communicate. */
    stable?: string;
    /** BCP-47 locale for weekday + day-month labels under each point. */
    locale?: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [W, setW] = useState(640);

    useEffect(() => {
        if (!containerRef.current) return;
        const obs = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const width = entry.contentRect.width;
                if (width > 0) setW(width);
            }
        });
        obs.observe(containerRef.current);
        return () => obs.disconnect();
    }, []);

    const H = 320;
    const PAD = { top: 26, right: 16, bottom: 44, left: 34 };
    const plotW = Math.max(10, W - PAD.left - PAD.right);
    const plotH = Math.max(10, H - PAD.top - PAD.bottom);

    const days = data.days;
    const scores = days.map((d) => d.score);
    const rawMin = Math.min(...scores);
    const rawMax = Math.max(...scores);
    // Pad the range so points aren't clipped, and enforce a minimum 20-pt span
    // so a flat week (76–78) still reads as a gentle curve, not a flat line.
    const pad = Math.max(3, Math.ceil((rawMax - rawMin) * 0.25));
    let yMin = Math.max(0, Math.floor(rawMin - pad));
    let yMax = Math.min(100, Math.ceil(rawMax + pad));
    if (yMax - yMin < 20) {
        const mid = (yMin + yMax) / 2;
        yMin = Math.max(0, Math.floor(mid - 10));
        yMax = Math.min(100, Math.ceil(mid + 10));
    }
    const ySpan = Math.max(1, yMax - yMin);

    const xOf = (i: number) => PAD.left + (days.length <= 1 ? plotW / 2 : (i / (days.length - 1)) * plotW);
    const yOf = (s: number) => PAD.top + (1 - (s - yMin) / ySpan) * plotH;

    const todayIdx = days.findIndex((d) => d.is_today);
    const split = todayIdx === -1 ? days.length : todayIdx;
    const pastPts: Point[] = days.slice(0, split + 1).map((d, i) => ({ x: xOf(i), y: yOf(d.score) }));
    const futurePts: Point[] =
        split < days.length - 1
            ? days.slice(split).map((d, i) => ({ x: xOf(split + i), y: yOf(d.score) }))
            : [];

    const pastLine = catmullRomToBezier(pastPts);
    const futureLine = catmullRomToBezier(futurePts.length ? futurePts : pastPts.slice(-1));

    const gid = colorHex.replace('#', '');
    const dt = (s: string) => new Date(s + 'T00:00:00');

    // 4 nice gridlines across the visible Y range.
    const gridVals = [yMin, yMin + ySpan / 3, yMin + (2 * ySpan) / 3, yMax].map((v) => Math.round(v));

    return (
        <div ref={containerRef} className="w-full">
            <svg
                role="img"
                aria-label="Weekly bond trend chart"
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                style={{ height: H }}
            >
                <defs>
                    <linearGradient id={`bondwk-${gid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colorHex} stopOpacity="0.16" />
                        <stop offset="100%" stopColor={colorHex} stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                {/* Y gridlines + labels */}
                {gridVals.map((v) => {
                    const y = yOf(v);
                    return (
                        <g key={v}>
                            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="var(--foreground)" strokeOpacity="0.07" strokeWidth="1" />
                            <text x={PAD.left - 8} y={y + 4} textAnchor="end" fontSize="11" fontWeight="700" fill="var(--foreground)" opacity="0.5">{v}</text>
                        </g>
                    );
                })}

                {/* Today divider */}
                {todayIdx !== -1 && (
                    <line x1={xOf(todayIdx)} y1={PAD.top} x2={xOf(todayIdx)} y2={PAD.top + plotH} stroke={colorHex} strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
                )}

                {/* Area fill (past only, so the forecast reads as a line) */}
                {pastPts.length > 1 && <path d={catmullRomArea(pastPts, PAD.top + plotH)} fill={`url(#bondwk-${gid})`} />}

                {/* Past: solid line */}
                {pastPts.length > 1 && (
                    <path d={pastLine} fill="none" stroke={colorHex} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" style={{ filter: `drop-shadow(0 3px 8px ${colorHex}22)` }} />
                )}
                {/* Future: dashed line */}
                {futurePts.length > 1 && (
                    <path d={futureLine} fill="none" stroke={colorHex} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 5" opacity="0.7" />
                )}

                {/* Stable-week band caption */}
                {stable && (
                    <text x={PAD.left + plotW / 2} y={PAD.top + 14} textAnchor="middle" fontSize="12" fontWeight="700" fill={colorHex} opacity="0.85">
                        {stable.length > 52 ? stable.slice(0, 50) + '…' : stable}
                    </text>
                )}

                {/* Points + labels */}
                {days.map((d, i) => {
                    const x = xOf(i);
                    const y = yOf(d.score);
                    const isToday = i === todayIdx;
                    const date = dt(d.date);
                    return (
                        <g key={d.date}>
                            {isToday && <circle cx={x} cy={y} r="8" fill={colorHex} opacity="0.18" />}
                            <circle cx={x} cy={y} r={isToday ? 4.5 : 3} fill={isToday ? colorHex : 'var(--surface)'} stroke={colorHex} strokeWidth={isToday ? 0 : 1.6} />
                            <text x={x} y={y - 11} textAnchor="middle" fontSize="12" fontWeight="800" fill={isToday ? colorHex : 'var(--foreground)'} opacity={isToday ? 1 : 0.7}>
                                {d.score}
                            </text>
                            <text x={x} y={H - 24} textAnchor="middle" fontSize="11" fontWeight="800" letterSpacing="0.4" fill={isToday ? colorHex : 'var(--foreground)'} opacity={isToday ? 1 : 0.6}>
                                {date.toLocaleDateString(locale, { weekday: 'short' }).toUpperCase()}
                            </text>
                            <text x={x} y={H - 9} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--foreground)" opacity="0.5">
                                {date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Legend */}
            <div className="mt-1 flex items-center justify-center gap-5 text-[12px] font-semibold text-foreground/55">
                <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-[3px] w-7 rounded-full" style={{ background: colorHex, opacity: 0.9 }} />
                    Past
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <svg width="28" height="3"><line x1="0" y1="1.5" x2="28" y2="1.5" stroke={colorHex} strokeWidth="3" strokeDasharray="6 5" opacity="0.7" /></svg>
                    Forecast
                </span>
            </div>
        </div>
    );
}
