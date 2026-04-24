'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ShieldCheck, ShieldAlert, Info } from 'lucide-react';

interface DoshaCheck {
  name: string;
  isClear: boolean;
  meaning: string;
  detail: string;
}

interface AdditionalDoshasProps {
  doshas: DoshaCheck[];
}

export default function AdditionalDoshas({ doshas = [] }: AdditionalDoshasProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="rounded-3xl border border-outline-variant/20 bg-surface overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-outline-variant/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
          <ShieldCheck className="text-secondary" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-headline font-bold text-foreground">
            Supplemental Checks
          </h3>
          <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-[0.2em]">
            Critical Doshas & Alignments
          </p>
        </div>
      </div>

      <div className="divide-y divide-outline-variant/10">
        {doshas?.map((dosha, idx) => (
          <div key={idx} className="group">
            <div 
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-surface transition-colors"
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  dosha.isClear ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {dosha.isClear ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                </div>
                <div>
                  <h4 className="text-sm font-headline font-bold text-foreground flex items-center gap-2">
                    {dosha.name}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      dosha.isClear 
                        ? 'border-green-500/20 text-green-500 bg-green-500/5' 
                        : 'border-red-500/20 text-red-500 bg-red-500/5'
                    }`}>
                      {dosha.isClear ? 'Clear' : 'Present'}
                    </span>
                  </h4>
                  <p className="text-[10px] text-foreground/30 font-medium italic mt-0.5">
                    {dosha.meaning}
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedIdx === idx ? 180 : 0 }}
                className="text-foreground/20 group-hover:text-foreground/40"
              >
                <ChevronDown size={18} />
              </motion.div>
            </div>

            <AnimatePresence>
              {expandedIdx === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="px-14 pb-5 pt-0">
                    <p className="text-xs text-foreground/60 leading-relaxed font-body">
                      {dosha.detail}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="p-4 bg-surface border-t border-outline-variant/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary/5 flex items-center justify-center shrink-0">
          <Info size={14} className="text-secondary/50" />
        </div>
        <p className="text-[10px] text-foreground/40 leading-snug">
          These checks are vital in South Indian traditions and complement the 36-point system for a safer match.
        </p>
      </div>
    </div>
  );
}
