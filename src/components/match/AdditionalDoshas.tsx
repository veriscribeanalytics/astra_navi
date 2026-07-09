'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ShieldCheck, ShieldAlert, Info } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface DoshaCheck {
  name: string;
  isClear: boolean;
  meaning: string;
  detail: string | { technical: string; simple: string };
}

interface AdditionalDoshasProps {
  doshas: DoshaCheck[];
}

export default function AdditionalDoshas({ doshas = [] }: AdditionalDoshasProps) {
  const { t } = useTranslation();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="rounded-3xl border border-outline-variant/20 bg-surface overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-outline-variant/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center border border-secondary/20">
          <ShieldCheck className="text-secondary" size={20} />
        </div>
        <div>
          <h3 className="text-lg font-headline font-bold text-foreground">
            {t('match.additional.title')}
          </h3>
          <p className="text-[10px] text-foreground/30 font-bold uppercase tracking-[0.2em]">
            {t('match.additional.subtitle')}
          </p>
        </div>
      </div>

      <div className="divide-y divide-outline-variant/10">
        {doshas?.map((dosha, idx) => (
          <div key={idx} className="group">
            <div 
              className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-surface transition-colors"
              onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  dosha.isClear ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {dosha.isClear ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-headline font-bold text-foreground flex items-center gap-2">
                    {dosha.name}
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      dosha.isClear 
                        ? 'border-green-500/20 text-green-500 bg-green-500/5' 
                        : 'border-amber-500/20 text-amber-500 bg-amber-500/5'
                    }`}>
                      {dosha.isClear ? t('match.additional.clear') : t('match.additional.present')}
                    </span>
                  </h4>
                  <p className="text-[10px] text-foreground/30 font-medium italic mt-0.5 line-clamp-1">
                    {dosha.meaning}
                  </p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: expandedIdx === idx ? 180 : 0 }}
                className="text-foreground/20 group-hover:text-foreground/40 shrink-0"
              >
                <ChevronDown size={16} />
              </motion.div>
            </div>

            <AnimatePresence>
              {expandedIdx === idx && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="px-12 pb-4 pt-0 flex flex-col gap-1.5">
                    <p className="text-xs text-foreground/60 leading-relaxed font-body">
                      {typeof dosha.detail === 'object' ? dosha.detail.simple : dosha.detail}
                    </p>
                    {typeof dosha.detail === 'object' && dosha.detail.technical && (
                      <p className="text-[9px] text-foreground/25 font-bold uppercase tracking-widest">
                        {dosha.detail.technical}
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="p-3 bg-surface border-t border-outline-variant/10 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-secondary/5 flex items-center justify-center shrink-0">
          <Info size={13} className="text-secondary/50" />
        </div>
        <p className="text-[10px] text-foreground/40 leading-snug">
          {t('match.additional.notice')}
        </p>
      </div>
    </div>
  );
}
