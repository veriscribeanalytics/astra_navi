'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatPageClient from '@/components/chat/ChatPageClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { MessageSquare, Brain, Zap, Shield } from 'lucide-react';

function ChatContent() {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        return (
            <PublicFeatureLanding 
                title="Chat with Navi — Your AI Vedic Astrologer"
                subtitle="AI-Powered Jyotish"
                description="Navi is a specialized AI trained on classical Vedic texts. Get instant, private, and chart-aware answers to your life's most pressing questions — career, love, health, or timing."
                hook="Unlike generic astrology apps, Navi reads YOUR specific planetary positions. Her guidance is calibrated to your Lagna, current Dasha, and active transits — not your Sun sign."
                icon={<MessageSquare className="w-4 h-4" />}
                ctaLabel="Start a Session"
                callbackUrl="/chat"
                features={[
                    {
                        title: "Chart-Aware Intelligence",
                        desc: "Navi references your specific birth chart positions. Her answers factor in your Lagna lord, Moon Nakshatra, and current Dasha period.",
                        icon: <Brain className="w-5 h-5" />
                    },
                    {
                        title: "24/7 Instant Guidance",
                        desc: "Planetary transits don't follow a schedule. Get clarity at any hour — no appointments, no waiting rooms, no judgment.",
                        icon: <Zap className="w-5 h-5" />
                    },
                    {
                        title: "Private & Judgment-Free",
                        desc: "Ask about love, finances, health, or spiritual questions without any social pressure. Your conversations are fully encrypted.",
                        icon: <Shield className="w-5 h-5" />
                    }
                ]}
                benefits={[
                    "Trained on BPHS, Phaladeepika, and Jataka Parijata",
                    "Contextual memory of your previous conversations",
                    "Real-time transit overlay on your natal chart",
                    "Specific Upaya (remedy) recommendations"
                ]}
            />
        );
    }

    return <ChatPageClient />;
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="flex-grow flex items-center justify-center min-h-[60vh]">
                <div className="text-4xl text-secondary animate-pulse opacity-50">✦</div>
            </div>
        }>
            <ChatContent />
        </Suspense>
    );
}
