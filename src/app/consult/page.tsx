'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import ConsultClient from './ConsultClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { Compass, Sparkles, MapPin, Shield } from 'lucide-react';

export default function ConsultPage() {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        return (
            <PublicFeatureLanding 
                title="Guided Consultation — A Structured Life Reading"
                subtitle="Step-by-Step Analysis"
                description="Instead of asking random questions, this guided flow takes you through a structured analysis of your chart's key houses — Career, Wealth, Health, and Relationships — for a complete 360° view."
                hook="A structured reading examines your chart house by house, identifying the exact Yogas and Dasha interactions responsible for the patterns you're experiencing. This is precision Jyotish, not fortune-telling."
                icon={<Compass className="w-4 h-4" />}
                ctaLabel="Start Consultation"
                callbackUrl="/consult"
                features={[
                    {
                        title: "Domain-Specific Focus",
                        desc: "Choose between Career (10th house), Health (6th house), or Love (7th house) for a targeted deep-dive reading.",
                        icon: <Sparkles className="w-5 h-5" />
                    },
                    {
                        title: "Dasha-Aware Timing",
                        desc: "Understand how your current Mahadasha and Antardasha are activating specific sectors of your birth chart right now.",
                        icon: <MapPin className="w-5 h-5" />
                    },
                    {
                        title: "Actionable Remedies",
                        desc: "Every reading concludes with specific Vedic Upayas — mantras, gemstones, and behavioral adjustments — to strengthen weak areas.",
                        icon: <Shield className="w-5 h-5" />
                    }
                ]}
                benefits={[
                    "Interactive step-by-step reading flow",
                    "Focus on 10th (Career) & 7th (Marriage) house analysis",
                    "Gemstone and Mantra prescriptions with rationale",
                    "Downloadable consultation summary (PDF)"
                ]}
            />
        );
    }

    return (
        <div className="h-[calc(100vh-70px)] bg-[var(--bg)] pt-2 overflow-hidden px-4">
            <ConsultClient />
        </div>
    );
}
