'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import FamilyClient from './FamilyClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { Users, Heart, BookOpen, Star } from 'lucide-react';

function FamilyContent() {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-secondary animate-pulse" />
                </div>
                <p className="text-[14px] text-foreground/40 font-medium">Opening your family...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <PublicFeatureLanding
                title="Family — Your Cosmic Connections"
                subtitle="Add loved ones • Read their charts • Check compatibility"
                description="Save birth details for parents, children, your partner, and friends. Generate accurate Vedic charts for each and explore your karmic compatibility in seconds."
                hook="Relationships are governed by the synastry of your birth charts. By comparing the planetary placements of two people, Vedic astrology can reveal harmony, friction, and the soul-purpose of every bond in your life."
                icon={<Users className="w-4 h-4" />}
                ctaLabel="Open My Family"
                callbackUrl="/family"
                features={[
                    {
                        title: 'Save up to 3 free members',
                        desc: 'Mother, father, spouse, sibling, child, friend — keep their birth details safely on AstraNavi.',
                        icon: <Users className="w-5 h-5" />,
                    },
                    {
                        title: 'One-tap birth charts',
                        desc: 'Generate each member\'s Lagna, planets, and houses with no extra credits — chart viewing is always free.',
                        icon: <BookOpen className="w-5 h-5" />,
                    },
                    {
                        title: 'Vedic compatibility scoring',
                        desc: 'See your astrological fit, strengths, and challenges in the language you understand best.',
                        icon: <Heart className="w-5 h-5" />,
                    },
                ]}
                benefits={[
                    'Charts based on BPHS & classical Jyotish standards',
                    'Cached compatibility results — pay once per language',
                    'Localized verdicts in English, Hindi, Korean',
                    'Private storage — visible only to you',
                ]}
                vedicAuthority="Compatibility scoring based on Vedic synastry & Ashtakoota principles"
            />
        );
    }

    return <div className="family-page-shell"><FamilyClient /></div>;
}

export default function FamilyPage() {
    return (
        <Suspense
            fallback={
                <div className="flex-grow flex items-center justify-center min-h-[60vh]">
                    <div className="text-4xl text-secondary animate-pulse opacity-50">
                        <Star />
                    </div>
                </div>
            }
        >
            <FamilyContent />
        </Suspense>
    );
}
