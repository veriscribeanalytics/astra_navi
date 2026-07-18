'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import KundliClient from './KundliClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { BookOpen, Compass, Star } from 'lucide-react';

function KundliContent() {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-secondary animate-pulse" />
                </div>
                <p className="text-[14px] text-foreground/40 font-medium">Opening your kundli...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <PublicFeatureLanding 
                title="Janam Kundli — Your Complete Vedic Birth Chart"
                subtitle="Free Kundli • Instant Result"
                description="AstraMitra uses precise astronomical data to calculate your divisional charts, planetary strengths, and Dasha timelines. Understand your karmic blueprint in seconds."
                hook="The positions of the Grahas at the moment of your birth encode the trajectory of your entire life. Your Kundli is the master key to understanding your Dharma, relationships, and career timing."
                icon={<BookOpen className="w-4 h-4" />}
                ctaLabel="Generate My Kundli"
                callbackUrl="/kundli"
                features={[
                    {
                        title: "16 Varga Charts",
                        desc: "Go beyond the Lagna chart. Explore D9 (Navamsha) for marriage potential, D10 for career, and D60 for past-life Karma.",
                        icon: <BookOpen className="w-5 h-5" />
                    },
                    {
                        title: "Dasha Timeline",
                        desc: "Identify your current Mahadasha and Antardasha periods to understand the planetary forces active in your life right now.",
                        icon: <Compass className="w-5 h-5" />
                    },
                    {
                        title: "Shadbala & Ashtakvarga",
                        desc: "Deep mathematical analysis of planetary strength scores to identify your true power sources and weak spots.",
                        icon: <Star className="w-5 h-5" />
                    }
                ]}
                benefits={[
                    "Calculations based on BPHS & Phaladeepika standards",
                    "Ayanamsha selection — Lahiri / Chitra Paksha",
                    "Complete Nakshatra, Pada, and Tatva breakdown",
                    "Instant PDF export for your personal records"
                ]}
            />
        );
    }

    return (
      <>
        <KundliClient />
        <div className="max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <p className="text-[10px] text-primary/25 leading-relaxed text-center">
            Your birth chart is processed using AES-256 encrypted computation. Chart data is shared with AI/LLM providers for analysis only, in accordance with our{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-secondary/50 hover:text-secondary underline underline-offset-2 transition-colors">
              Privacy Policy
            </a>
            {' '}under India&apos;s DPDP Act, 2023.
          </p>
        </div>
      </>
    );
}

export default function KundliPage() {
    return (
        <Suspense fallback={
            <div className="flex-grow flex items-center justify-center min-h-[60vh]">
                <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
            </div>
        }>
            <KundliContent />
        </Suspense>
    );
}
