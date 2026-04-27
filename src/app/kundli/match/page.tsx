'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import MatchClient from './MatchClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { Heart, Users, Sparkles, Shield } from 'lucide-react';

export default function MatchPage() {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        return (
            <PublicFeatureLanding 
                title="Kundli Matching — 36 Guna Vedic Compatibility"
                subtitle="Ashtakoota Milan"
                description="Go beyond generic zodiac compatibility. AstraNavi uses the classical 36-point Ashtakoota system to analyze the spiritual, emotional, and biological synchronization between two charts."
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
        <div className="min-h-[calc(100dvh-var(--navbar-height,64px))] bg-[var(--bg)] py-10 sm:py-20 px-4">
            <MatchClient />
        </div>
    );
}
