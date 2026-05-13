'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import Button from '../ui/Button';

interface Props {
    t: (key: string) => string;
}

export default function FinalCtaSection({ t }: Props) {
    return (
        <section className="py-10 sm:py-16 lg:py-24 relative overflow-hidden bg-surface-variant/30 border-t border-outline-variant/20">
            <div className="absolute inset-0 opacity-15 bg-celestial-silk mix-blend-overlay" />
            <motion.div 
                initial={{ opacity: 0.1, scale: 0.8 }}
                animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1] }}
                transition={{ duration: 15, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-secondary/20 blur-[150px] rounded-full"
            />
            
            <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-secondary mx-auto mb-4 sm:mb-8 animate-pulse" />
                <h2 className="text-2xl sm:text-5xl md:text-6xl font-headline font-bold text-primary mb-4 sm:mb-8">{t('landing.readyToAlign')}<span className="text-secondary italic">{t('landing.readyToAlignHighlight')}</span></h2>
                <p className="text-on-surface-variant/80 text-sm sm:text-lg mb-6 sm:mb-12 max-w-2xl mx-auto">{t('landing.finalCtaDesc')}</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center">
                    <Button href="/chat" size="sm" className="gold-gradient shadow-2xl px-8 sm:px-12 text-base sm:text-lg">{t('landing.beginJourney')}</Button>
                    <Button href="/about" size="sm" variant="ghost" className="text-primary hover:bg-primary/5 border border-outline-variant/30 px-8 sm:px-12 text-base sm:text-lg">{t('landing.learnMethod')}</Button>
                </div>
            </div>
        </section>
    );
}
