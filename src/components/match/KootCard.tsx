'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Info } from 'lucide-react';

interface KootCardProps {
  name: string;
  sanskritName: string;
  meaning: string;
  obtained: number;
  max: number;
  detail: string;
  delay?: number;
}

export default function KootCard({ 
  name, sanskritName, meaning, obtained, max, detail, delay = 0 
}: KootCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const percentage = (obtained / max) * 100;

  const getColor = () => {
    if (percentage >= 75) return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (percentage >= 50) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
  };

  const getBarColor = () => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
        isExpanded ? 'bg-surface border-outline-variant/30 shadow-lg' : 'bg-surface border-outline-variant/10 hover:border-outline-variant/30'
      }`}
    >
      <div 
        className="p-4 sm:p-5 cursor-pointer flex flex-col gap-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h4 className="text-xs font-bold text-foreground/40 uppercase tracking-[0.2em]">
              {sanskritName}
            </h4>
            <h3 className="text-lg font-headline font-bold text-foreground">
              {name}
            </h3>
            <p className="text-[10px] text-foreground/30 font-medium italic">
              {meaning}
            </p>
          </div>
          <div className={`px-3 py-1.5 rounded-xl border flex flex-col items-center min-w-[60px] ${getColor()}`}>
            <span className="text-lg font-bold leading-none">{obtained}</span>
            <div className="h-[1px] w-full bg-current opacity-20 my-1" />
            <span className="text-[10px] font-bold opacity-60 leading-none">{max}</span>
          </div>
        </div>

        {/* Score Bar */}
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: delay + 0.3, duration: 1, ease: "easeOut" as const }}
            className={`h-full rounded-full ${getBarColor()}`}
          />
        </div>

        <div className="flex justify-between items-center mt-1">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
            <Info size={12} className="text-secondary" />
            {percentage >= 75 ? 'Strong' : percentage >= 50 ? 'Average' : 'Weak'} Alignment
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-foreground/30"
          >
            <ChevronDown size={18} />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-5 pb-5 pt-1 border-t border-outline-variant/10 mt-1">
              <p className="text-sm text-foreground/70 leading-relaxed font-body">
                {detail}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
