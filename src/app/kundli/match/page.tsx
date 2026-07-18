'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import MatchClient from './MatchClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { Heart, Users, Sparkles, Shield } from 'lucide-react';

function MatchContent() {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-secondary animate-pulse" />
                </div>
                <p className="text-[14px] text-foreground/40 font-medium">Loading match...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <PublicFeatureLanding 
                title="Kundli Matching — 36 Guna Vedic Compatibility"
                subtitle="Ashtakoota Milan"
                description="Go beyond generic zodiac compatibility. AstraMitra uses the classical 36-point Ashtakoota system to analyze the spiritual, emotional, and biological synchronization between two charts."
                hook="Vedic compatibility analysis examines 8 critical dimensions — from Nadi (genetic health) to Bhakoot (emotional harmony). A score above 18 is traditionally considered favorable for a lasting partnership."
                icon={<Heart className="w-4 h-4" />}
                ctaLabel="Check Compatibility"
                callbackUrl="/kundli/match"
                features={[
                    {
                        title: "36-Point Ashtakoot Score",
                        desc: "Analyze 8 key dimensions — Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, and Nadi — with individual scoring.",
                        icon: <Users className="w-5 h-5" />
                    },
                    {
                        title: "Manglik Dosha Analysis",
                        desc: "Understand the influence of Mars in your chart and identify if a Dosha exists, or if it is naturally cancelled by other factors.",
                        icon: <Sparkles className="w-5 h-5" />
                    },
                    {
                        title: "Nadi & Bhakoot Check",
                        desc: "Deep focus on the two most critical Gunas that traditional Vedic families prioritize for long-term health and harmony.",
                        icon: <Shield className="w-5 h-5" />
                    }
                ]}
                benefits={[
                    "Comprehensive Ashtakoota scoring (0 to 36)",
                    "Detailed Manglik Dosha identification and remedies",
                    "Spiritual and emotional sync breakdown",
                    "Completely private — your data is never shared"
                ]}
            />
        );
    }

    return (
        <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)] py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
            <MatchClient />
        </div>
    );
}

export default function MatchPage() {
    return (
        <Suspense fallback={
            <div className="flex-grow flex items-center justify-center min-h-[60vh]">
                <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
            </div>
        }>
            <MatchContent />
        </Suspense>
    );
}
