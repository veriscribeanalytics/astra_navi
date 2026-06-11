'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import LogoLoop from '@/components/ui/LogoLoop';

const getRashiItems = () => [
    { id: 'aries', nameEn: 'Aries', nameHi: 'मेष', icon: '/icons/rashi/aries.png', href: '/rashis' },
    { id: 'taurus', nameEn: 'Taurus', nameHi: 'वृषभ', icon: '/icons/rashi/taurus.png', href: '/rashis' },
    { id: 'gemini', nameEn: 'Gemini', nameHi: 'मिथुन', icon: '/icons/rashi/gemini.png', href: '/rashis' },
    { id: 'cancer', nameEn: 'Cancer', nameHi: 'कर्क', icon: '/icons/rashi/cancer.png', href: '/rashis' },
    { id: 'leo', nameEn: 'Leo', nameHi: 'सिंह', icon: '/icons/rashi/leo.png', href: '/rashis' },
    { id: 'virgo', nameEn: 'Virgo', nameHi: 'कन्या', icon: '/icons/rashi/virgo.png', href: '/rashis' },
    { id: 'libra', nameEn: 'Libra', nameHi: 'तुला', icon: '/icons/rashi/libra.png', href: '/rashis' },
    { id: 'scorpio', nameEn: 'Scorpio', nameHi: 'वृश्चिक', icon: '/icons/rashi/scorpio.png', href: '/rashis' },
    { id: 'sagittarius', nameEn: 'Sagittarius', nameHi: 'धनु', icon: '/icons/rashi/sagittarius.png', href: '/rashis' },
    { id: 'capricorn', nameEn: 'Capricorn', nameHi: 'मकर', icon: '/icons/rashi/capricorn.png', href: '/rashis' },
    { id: 'aquarius', nameEn: 'Aquarius', nameHi: 'कुम्भ', icon: '/icons/rashi/aquarius.png', href: '/rashis' },
    { id: 'pisces', nameEn: 'Pisces', nameHi: 'मीन', icon: '/icons/rashi/pisces.png', href: '/rashis' },
];

export default function ZodiacStrip() {
    const rashiItems = useMemo(() => getRashiItems(), []);

    const logoItems = useMemo(() => 
        rashiItems.map(rashi => ({
            node: (
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center shrink-0 relative">
                        <Image 
                            alt={`${rashi.nameEn} Icon`} 
                            className="w-full h-full object-contain opacity-60 hover:opacity-100 transition-opacity hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]" 
                            src={rashi.icon}
                            width={24}
                            height={24}
                            style={{ width: 'auto', height: 'auto' }}
                            draggable={false}
                            priority
                        />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-headline font-bold text-foreground/40 hover:text-secondary transition-colors leading-none whitespace-nowrap">
                            {rashi.nameEn}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-semibold text-foreground/30 hover:text-secondary/80 transition-colors leading-none whitespace-nowrap">
                            {rashi.nameHi}
                        </span>
                    </div>
                </div>
            ),
            title: `${rashi.nameEn} (${rashi.nameHi})`,
            href: rashi.href
        })), 
    [rashiItems]);

    return (
        <section className="bg-surface relative overflow-hidden h-[60px] sm:h-[72px] flex items-center w-full border-b border-outline-variant/20">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-transparent to-secondary/5 animate-pulse opacity-50" />
            <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(200,136,10,0.1),transparent)] bg-[length:200%_100%] animate-[shimmer_5s_infinite_linear]" />
            <LogoLoop
                logos={logoItems}
                speed={20}
                direction="left"
                logoHeight={40}
                gap={40}
                hoverSpeed={-2}
                fadeOut
                fadeOutColor="var(--surface)"
            />
        </section>
    );
}
