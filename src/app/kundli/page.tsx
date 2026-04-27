'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import KundliClient from './KundliClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { BookOpen, Sparkles, Compass, Star } from 'lucide-react';

export default function KundliPage() {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        return (
            <PublicFeatureLanding 
                title="Janam Kundli — Your Complete Vedic Birth Chart"
                subtitle="Free Kundli • Instant Result"
                description="AstraNavi uses precise astronomical data to calculate your divisional charts, planetary strengths, and Dasha timelines. Understand your karmic blueprint in seconds."
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

    return <KundliClient />;
}
