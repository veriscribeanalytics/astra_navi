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
  const h = 60, w = 220;
  const coords = points.map((p, i) => ({ x: (i / Math.max(points.length - 1, 1)) * w, y: h - (p.score / 100) * h }));
  const pathD = catmullRomToBezier(coords);
  const areaD = catmullRomArea(coords, h);
  const id = colorHex.replace('#', '');

  return (
    <div className="relative w-full h-full">
      <svg viewBox={`-10 -10 ${w + 20} ${h + 24}`} className="w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`fc-area-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={colorHex} stopOpacity="0.15" />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[25, 50, 75].map(v => {
          const gy = h - (v / 100) * h;
          return <line key={v} x1="0" y1={gy} x2={w} y2={gy} stroke="var(--color-foreground)" strokeOpacity="0.06" strokeWidth="0.5" />;
        })}

        <path d={areaD} fill={`url(#fc-area-${id})`} />
        <path d={pathD} fill="none" stroke={colorHex} strokeWidth="2" strokeLinecap="round" />

        {coords.map((c, i) => {
          const p = points[i];
          const isActive = activeLabel === p.label;
          const isCurrent = p.isCurrent;
          return (
            <g key={i}>
              {(isCurrent || isActive) && <circle cx={c.x} cy={c.y} r="5" fill={colorHex} opacity={0.12} />}
              <circle cx={c.x} cy={c.y} r={isCurrent || isActive ? 3 : 1.5} fill={isCurrent || isActive ? colorHex : 'transparent'} stroke={colorHex} strokeWidth={isCurrent || isActive ? 0 : 1} />
              <text x={c.x} y={c.y - 8} textAnchor="middle" fill={isActive ? colorHex : 'var(--color-foreground)'} fillOpacity={isActive ? 1 : isCurrent ? 0.6 : 0.3} fontSize="6.5" fontWeight="bold">{p.score}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
