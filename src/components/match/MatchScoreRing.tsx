'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface MatchScoreRingProps {
  score: number; // 0 to 36
  tier?: {
    tier: string;
    color: string;
    emoji: string;
    label: string;
  };
}

export default function MatchScoreRing({ score, tier }: MatchScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const size = 180;
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  
  const percentage = (score / 36) * 100;
  const progress = circumference - (score / 36) * circumference;

  useEffect(() => {
    let startTime: number | null = null;
    const duration = 1500; // 1.5 seconds to match ring animation
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progressRatio = Math.min(elapsed / duration, 1);
      
      // Use easeOutQuad for counter
      const currentScore = Math.floor(progressRatio * score);
      setDisplayScore(currentScore);
      
      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    const timer = setTimeout(() => {
      requestAnimationFrame(animate);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [score]);

  // Color logic based on percentage
  const getColor = () => {
    if (percentage >= 75) return '#22c55e'; // Green
    if (percentage >= 50) return '#eab308'; // Yellow
    if (percentage >= 33) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const ringColor = tier?.color || getColor();

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      <div className="relative w-[140px] h-[140px] sm:w-[180px] sm:h-[180px]">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-colors duration-1000"
          style={{ backgroundColor: ringColor }}
        />
        
        <svg className="w-full h-full -rotate-90 relative z-10" viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-surface-variant/10"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: progress }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ stroke: ringColor }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center relative z-10">
          <div className="flex items-baseline justify-center">
            <motion.span 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl sm:text-5xl font-headline font-bold text-foreground leading-none"
            >
              {displayScore}
            </motion.span>
            <span className="text-lg sm:text-xl text-foreground/40 font-body ml-1 font-medium">/ 36</span>
          </div>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-[9px] sm:text-[11px] font-bold text-foreground/30 uppercase tracking-[0.25em] mt-2"
          >
            Compatibility
          </motion.span>
        </div>
      </div>

      {tier && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-full bg-surface/40 backdrop-blur-xl border border-outline-variant/20 shadow-xl flex items-center gap-2 sm:gap-3"
        >
          <span className="text-lg sm:text-xl">{tier.emoji}</span>
          <span className="text-xs sm:text-sm font-headline font-bold uppercase tracking-widest" style={{ color: ringColor }}>
            {tier.label}
          </span>
        </motion.div>
      )}
    </div>
  );
}
