'use client';

import React from 'react';
import { catmullRomToBezier, catmullRomArea } from '@/utils/chartCurve';

export interface ChartPoint {
  label: string;
  score: number;
  isCurrent?: boolean;
}

export default function ForecastChart({ points, colorHex, activeLabel }: { points: ChartPoint[]; colorHex: string; activeLabel?: string }) {
  if (!points.length) return null;
  const h = 80, w = 240;
  const coords = points.map((p, i) => ({ x: (i / Math.max(points.length - 1, 1)) * w, y: h - (p.score / 100) * h }));
  const pathD = catmullRomToBezier(coords);
  const areaD = catmullRomArea(coords, h);
  const id = colorHex.replace('#', '');

  return (
    <div className="relative w-full h-full">
      <svg viewBox="-12 -14 264 108" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
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
          return <line key={v} x1="0" y1={gy} x2={w} y2={gy} stroke="var(--color-foreground)" strokeOpacity="0.06" strokeWidth="0.5" />;
        })}

        <path d={areaD} fill={`url(#fc-area-${id})`} />
        {/* Glow path behind for vibrant cosmic effect */}
        <path d={pathD} fill="none" stroke={colorHex} strokeWidth="3" strokeLinecap="round" opacity="0.3" filter={`url(#fc-glow-${id})`} />
        <path d={pathD} fill="none" stroke={colorHex} strokeWidth="1.75" strokeLinecap="round" />

        {coords.map((c, i) => {
          const p = points[i];
          const isActive = activeLabel === p.label;
          const isCurrent = p.isCurrent;
          
          // Prevent overlapping: only show labels for weekly view (<= 10 points)
          // or specifically highlight the currently active or today's point in dense views
          const showLabel = points.length <= 10 || isActive || isCurrent;
          const dotRadius = isCurrent || isActive ? 3.5 : (points.length > 15 ? 0.8 : 1.8);
          const strokeWidth = isCurrent || isActive ? 0 : (points.length > 15 ? 0.5 : 1);

          return (
            <g key={i}>
              {(isCurrent || isActive) && (
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
                fill={isCurrent || isActive ? colorHex : 'var(--bg-surface, #1e1b29)'} 
                stroke={colorHex} 
                strokeWidth={strokeWidth} 
              />
              {showLabel && (
                <text 
                  x={c.x} 
                  y={c.y - (isCurrent || isActive ? 9 : 7)} 
                  textAnchor="middle" 
                  fill={isActive ? colorHex : 'var(--color-foreground)'} 
                  fillOpacity={isActive ? 1 : isCurrent ? 0.8 : 0.4} 
                  fontSize={isCurrent || isActive ? "8.5" : "7.5"} 
                  fontWeight={isCurrent || isActive ? "bold" : "medium"}
                >
                  {p.score}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
