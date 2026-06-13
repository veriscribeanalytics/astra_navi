'use client';

import React from 'react';
import ScrollMorphSection from './ScrollMorphSection';
import ZodiacStrip from './ZodiacStrip';
import HowItWorksSection from './HowItWorksSection';
import OurServices from './OurServices';
import AstrologersSection from './AstrologersSection';
import FinalCtaSection from './FinalCtaSection';

export default function LandingPage() {
    return (
        <div className="flex flex-col w-full bg-transparent pb-10">
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
    );
}
