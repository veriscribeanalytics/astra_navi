"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { AREA_COLORS } from "@/data/lifeAreaColors";
import type { ForecastArea } from "@/data/areaThemes";

interface ScoreRingProps {
    score: number;
    maxScore?: number;
    size?: number;
    tier?: {
        color?: string;
        emoji?: string;
        label?: string;
    };
    label?: string;
    animated?: boolean;
    area?: ForecastArea | "overall";
}

export default function ScoreRing({ score, maxScore = 100, size = 88, tier, label = "Score", animated = true, area }: ScoreRingProps) {
    const [animatedScore, setAnimatedScore] = useState(animated ? 0 : score);
    const normalizedSize = 100;
    const radius = 42;
    const strokeWidth = 6;
    const circumference = 2 * Math.PI * radius;
    const percentage = (score / maxScore) * 100;

    useEffect(() => {
        if (!animated) return;

        let startTime: number | null = null;
        const duration = 1500;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progressRatio = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progressRatio, 3);
            setAnimatedScore(Math.floor(easeOut * score));

            if (progressRatio < 1) {
                requestAnimationFrame(animate);
            }
        };

        const timer = setTimeout(() => requestAnimationFrame(animate), 200);
        return () => clearTimeout(timer);
    }, [score, animated]);

    const progress = circumference - (animatedScore / maxScore) * circumference;

    const getCelestialColor = () => {
        if (percentage >= 80) return '#14B8A6';
        if (percentage >= 60) return '#22C55E';
        if (percentage >= 40) return '#F59E0B';
        return '#EF4444';
    };

    const color = tier?.color || (area ? AREA_COLORS[area].main : getCelestialColor());
    const glowColor = area ? AREA_COLORS[area].glow : color;
    const isLarge = size >= 90;

    return (
        <div className={`flex flex-col items-center gap-4 sm:gap-6`}>
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
                        className="transition-all duration-[1500ms] cubic-bezier(0.2, 0, 0, 1)"
                        style={{ stroke: color }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                    <div className="flex flex-col items-center justify-center leading-none">
                        <span className={`${isLarge ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'} font-headline font-bold drop-shadow-sm`} style={{ color }}>
                            {animatedScore}
                        </span>
                        <div className="flex flex-col items-center mt-1">
                            <span className="text-[8px] sm:text-[9px] text-foreground/45 font-bold uppercase tracking-[0.15em]">
                                {label || (maxScore === 100 ? 'General' : `/ ${maxScore}`)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {tier && isLarge && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-surface border border-outline-variant/20 shadow-xl flex items-center gap-2 sm:gap-3"
                >
                    <span className="text-lg sm:text-xl">{tier.emoji}</span>
                    <span className="text-xs sm:text-sm font-headline font-bold uppercase tracking-widest" style={{ color }}>
                        {tier.label}
                    </span>
                </motion.div>
            )}
        </div>
    );
}