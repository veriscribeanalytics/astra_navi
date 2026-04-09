'use client';

import React, { useMemo } from 'react';
import LogoLoop from '@/components/ui/LogoLoop';
import Image from 'next/image';

const rashiItems = [
    { id: 'aries', nameEn: 'Aries', nameHi: 'मेष', icon: '/icons/rashi/aries.png', href: '/horoscope?sign=aries' },
    { id: 'taurus', nameEn: 'Taurus', nameHi: 'वृषभ', icon: '/icons/rashi/taurus.png', href: '/horoscope?sign=taurus' },
    { id: 'gemini', nameEn: 'Gemini', nameHi: 'मिथुन', icon: '/icons/rashi/gemini.png', href: '/horoscope?sign=gemini' },
    { id: 'cancer', nameEn: 'Cancer', nameHi: 'कर्क', icon: '/icons/rashi/cancer.png', href: '/horoscope?sign=cancer' },
    { id: 'leo', nameEn: 'Leo', nameHi: 'सिंह', icon: '/icons/rashi/leo.png', href: '/horoscope?sign=leo' },
    { id: 'virgo', nameEn: 'Virgo', nameHi: 'कन्या', icon: '/icons/rashi/virgo.png', href: '/horoscope?sign=virgo' },
    { id: 'libra', nameEn: 'Libra', nameHi: 'तुला', icon: '/icons/rashi/libra.png', href: '/horoscope?sign=libra' },
    { id: 'scorpio', nameEn: 'Scorpio', nameHi: 'वृश्चिक', icon: '/icons/rashi/scorpio.png', href: '/horoscope?sign=scorpio' },
    { id: 'sagittarius', nameEn: 'Sagittarius', nameHi: 'धनु', icon: '/icons/rashi/sagittarius.png', href: '/horoscope?sign=sagittarius' },
    { id: 'capricorn', nameEn: 'Capricorn', nameHi: 'मकर', icon: '/icons/rashi/capricorn.png', href: '/horoscope?sign=capricorn' },
    { id: 'aquarius', nameEn: 'Aquarius', nameHi: 'कुम्भ', icon: '/icons/rashi/aquarius.png', href: '/horoscope?sign=aquarius' },
    { id: 'pisces', nameEn: 'Pisces', nameHi: 'मीन', icon: '/icons/rashi/pisces.png', href: '/horoscope?sign=pisces' },
];

/**
 * ZodiacStrip: Animated Infinite Scroll with LogoLoop
 * Smooth right-to-left animation with hover deceleration
 * Optimized for low-spec devices
 */
const ZodiacStrip = () => {
    // Convert rashi items to LogoLoop format with custom render
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
                            draggable={false}
                            style={{ 
                                imageRendering: '-webkit-optimize-contrast',
                            }}
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
    []);

    return (
        <section className="bg-surface/30 backdrop-blur-md relative overflow-hidden h-[60px] sm:h-[72px] flex items-center w-full">
            <LogoLoop
                logos={logoItems}
                speed={20}
                direction="right"
                logoHeight={40}
                gap={40}
                hoverSpeed={-2}
                fadeOut
                fadeOutColor="hsl(var(--background))"
                ariaLabel="Zodiac signs - click to explore"
            />
        </section>
    );
};

export default ZodiacStrip;
