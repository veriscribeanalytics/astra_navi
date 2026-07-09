'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface MatchScoreRingProps {
  score: number; // 0 to 36
  maxScore?: number; // default 36
  percentage?: number; // 0 to 100
  tier?: {
    tier: string;
    color: string;
    emoji: string;
    label: string;
  };
}

export default function MatchScoreRing({
  score,
  maxScore = 36,
  percentage,
  tier,
}: MatchScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const size = 168;
  const normalizedSize = 100;
  const radius = 42;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;

  const pct = percentage ?? Math.round((score / maxScore) * 100);

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1400;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progressRatio, 3);
      setAnimatedScore(Math.floor(easeOut * score));
      if (progressRatio < 1) requestAnimationFrame(animate);
    };
    const timer = setTimeout(() => requestAnimationFrame(animate), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const progress = circumference - (animatedScore / maxScore) * circumference;
  const color = tier?.color || (pct >= 66 ? '#22C55E' : pct >= 50 ? '#F59E0B' : '#EF4444');

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 relative z-10 p-1" viewBox={`0 0 ${normalizedSize} ${normalizedSize}`}>
          <circle
            cx={normalizedSize / 2} cy={normalizedSize / 2} r={radius}
            fill="none" stroke="currentColor" strokeWidth={strokeWidth}
            className="text-surface-variant/20"
          />
          <motion.circle
            cx={normalizedSize / 2} cy={normalizedSize / 2} r={radius}
            fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            className="transition-all duration-[1400ms] cubic-bezier(0.2, 0, 0, 1)"
            style={{ stroke: color }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 leading-none">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-headline font-bold drop-shadow-sm" style={{ color }}>
              {animatedScore}
            </span>
            <span className="text-lg font-headline font-bold text-foreground/35">/ {maxScore}</span>
          </div>
          <span className="mt-1.5 text-[11px] font-bold text-foreground/45 uppercase tracking-[0.15em]">
            {pct}%
          </span>
        </div>
      </div>

      {tier && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-surface border border-outline-variant/20 shadow-sm flex items-center gap-2"
        >
          <span className="text-base">{tier.emoji}</span>
          <span className="text-xs font-headline font-bold uppercase tracking-widest" style={{ color }}>
            {tier.label}
          </span>
        </motion.div>
      )}
    </div>
  );
}
