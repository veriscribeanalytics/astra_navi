'use client';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import ScrollMorphSection from './ScrollMorphSection';
import ZodiacStrip from './ZodiacStrip';
import HowItWorksSection from './HowItWorksSection';
import OurServices from './OurServices';
import AstrologersSection from './AstrologersSection';
import FinalCtaSection from './FinalCtaSection';
import CosmicIntro from './cosmic-intro/CosmicIntro';
import { INTRO_SEEN_KEY } from './cosmic-intro/assets';

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

type IntroPhase = 'pending' | 'play' | 'done';

export default function LandingPage() {
    const [phase, setPhase] = useState<IntroPhase>('pending');
    const [revealed, setRevealed] = useState(false);

    useIsoLayoutEffect(() => {
        let seen = false;
        try {
            seen = sessionStorage.getItem(INTRO_SEEN_KEY) === '1';
        } catch {
            // sessionStorage can throw in private contexts — treat as "not seen"
        }
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (seen || reduced) {
            setRevealed(true);
            setPhase('done');
            if (typeof window !== 'undefined') {
                document.documentElement.classList.remove('intro-playing');
            }
            return;
        }

        try {
            sessionStorage.setItem(INTRO_SEEN_KEY, '1');
        } catch {
            /* ignore */
        }
        
        if (typeof window !== 'undefined') {
            (window as any).__cosmicIntroActive = true;
        }
        setPhase('play');

        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).__cosmicIntroActive;
            }
        };
    }, []);

    const showIntro = phase === 'play';
    const landingVisible = phase === 'done' || revealed;

    return (
        <>
            {phase === 'pending' && (
                <div className="fixed inset-0 z-[1500]" style={{ background: '#050716' }} aria-hidden="true" />
            )}

            {showIntro && (
                <CosmicIntro
                    onReveal={() => {
                        setRevealed(true);
                        if (typeof window !== 'undefined') {
                            (window as any).__cosmicIntroActive = false;
                            document.documentElement.classList.remove('intro-playing');
                            window.dispatchEvent(new CustomEvent('cosmic-intro-complete'));
                        }
                    }}
                    onComplete={() => setPhase('done')}
                />
            )}

            <div
                className="flex flex-col w-full bg-transparent pb-10"
                style={{
                    opacity: landingVisible ? 1 : 0,
                    transition: 'opacity 0.7s ease',
                    pointerEvents: landingVisible ? 'auto' : 'none',
                }}
            >
                {/* 1. SCROLL MORPH SECTION (Hero → Dashboard → Kundli → Forecast → Astrologers) */}
                <ScrollMorphSection />

                {/* 2. ZODIAC STRIP */}
                <ZodiacStrip />

                {/* 4. HOW IT WORKS SECTION */}
                <HowItWorksSection />

                {/* 5. SERVICES GRID (OurServices) */}
                <OurServices />

                {/* 6. VERIFIED EXPERT ASTROLOGERS */}
                <AstrologersSection />

                {/* 7. FINAL CTA */}
                <FinalCtaSection />
            </div>
        </>
    );
}
