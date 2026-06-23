'use client';

import React, { useState } from 'react';
import { catmullRomToBezier, catmullRomArea } from '@/utils/chartCurve';

export interface ChartPoint {
  label: string;
  score: number;
  isCurrent?: boolean;
  displayLabel?: string;
}

export default function ForecastChart({
  points,
  colorHex,
  activeLabel,
  onSelect,
  showStabilityHint = true,
}: {
  points: ChartPoint[];
  colorHex: string;
  activeLabel?: string;
  onSelect?: (label: string) => void;
  showStabilityHint?: boolean;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!points.length) return null;
  const h = 80, w = 240;
  const coords = points.map((p, i) => ({ x: (i / Math.max(points.length - 1, 1)) * w, y: h - (p.score / 100) * h }));
  const scoreRange = Math.max(...points.map(p => p.score)) - Math.min(...points.map(p => p.score));
  const subtleMovement = scoreRange <= 8;
  const pathD = catmullRomToBezier(coords);
  const areaD = catmullRomArea(coords, h);
  const id = colorHex.replace('#', '');
  // Dense (monthly day-by-day) charts can't fit 30 score labels — only show the
  // active, today, and hovered points. Weekly (7) and yearly (12) still fit.
  const dense = points.length > 14;

  return (
    <div className="relative w-full h-full">
      {showStabilityHint && subtleMovement && (
        <div className="absolute top-0 right-0 px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.02] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorHex }} />
          <span className="text-[9px] sm:text-[10px] font-bold text-foreground/55 uppercase tracking-wider">Mostly stable</span>
        </div>
      )}
      <svg viewBox="-12 -14 264 114" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={`fc-area-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorHex} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0.01" />
          </linearGradient>
          {/* Cosmic energy glow filter */}
          <filter id={`fc-glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {[25, 50, 75].map(v => {
          const gy = h - (v / 100) * h;
          return (
            <g key={v}>
              <line x1="0" y1={gy} x2={w} y2={gy} stroke="var(--color-foreground)" strokeOpacity="0.06" strokeWidth="0.5" />
              {dense && (
                <text x="-10" y={gy + 2.5} textAnchor="middle" fill="var(--color-foreground)" fillOpacity="0.35" fontSize="6.5" fontWeight="bold">{v}</text>
              )}
            </g>
          );
        })}

        <path d={areaD} fill={`url(#fc-area-${id})`} />
        {/* Glow path behind for vibrant cosmic effect */}
        <path d={pathD} fill="none" stroke={colorHex} strokeWidth="3" strokeLinecap="round" opacity="0.3" filter={`url(#fc-glow-${id})`} />
        <path d={pathD} fill="none" stroke={colorHex} strokeWidth="1.75" strokeLinecap="round" />

        {coords.map((c, i) => {
          const p = points[i];
          const isActive = activeLabel === p.label;
          const isCurrent = !!p.isCurrent;
          const isHovered = hoveredIdx === i;
          const highlight = isActive || isCurrent || isHovered;

          // In dense charts only highlighted points show a label/dot;
          // sparse charts (7d, yearly) show every label like before.
          const showLabel = dense ? highlight : true;
          const dotRadius = highlight ? 3.5 : dense ? 0 : 1.8;
          const strokeWidth = highlight ? 0 : dense ? 0 : 1;

          return (
            <g key={i}>
              {highlight && (
                <circle
                  cx={c.x}
                  cy={c.y}
                  r="6"
                  fill={colorHex}
                  opacity={0.2}
                  filter={`url(#fc-glow-${id})`}
                />
              )}
              <circle
                cx={c.x}
                cy={c.y}
                r={dotRadius}
                fill={highlight ? colorHex : 'var(--bg-surface, #1e1b29)'}
                stroke={colorHex}
                strokeWidth={strokeWidth}
              />
              {showLabel && (
                <text
                  x={c.x}
                  y={c.y - (highlight ? 9 : 7)}
                  textAnchor="middle"
                  fill={isActive || isHovered ? colorHex : 'var(--color-foreground)'}
                  fillOpacity={isActive || isHovered ? 1 : isCurrent ? 0.8 : 0.4}
                  fontSize={highlight ? '8.5' : '7.5'}
                  fontWeight={highlight ? 'bold' : 'medium'}
                >
                  {p.score}
                </text>
              )}
              {p.displayLabel && (
                <text
                  x={c.x}
                  y="95"
                  textAnchor="middle"
                  fill={isActive || isHovered ? colorHex : 'var(--color-foreground)'}
                  fillOpacity={isActive || isHovered ? 0.9 : 0.3}
                  fontSize="7.2"
                  fontWeight={isActive || isHovered ? 'bold' : 'medium'}
                >
                  {p.displayLabel}
                </text>
              )}
              {/* Invisible hit-area so dense charts respond to hover/touch
                  even though the underlying dot is r=0. */}
              <circle
                cx={c.x}
                cy={c.y}
                r={dense ? 4 : 6}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(prev => (prev === i ? null : prev))}
                onClick={() => onSelect?.(p.label)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
