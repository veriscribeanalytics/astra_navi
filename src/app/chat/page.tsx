'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatPageClient from '@/components/chat/ChatPageClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { Sparkles, MessageSquare, BookOpen, Brain } from 'lucide-react';

function ChatContent() {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                </div>
                <p className="text-[14px] text-foreground/40 font-medium">Opening Navi...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <PublicFeatureLanding
                title="Chat with Navi — Your Vedic AI Guide"
                subtitle="AI-powered Jyotish guidance"
                description="Navi reads your Vedic birth chart and answers questions about career, relationships, timing, remedies, and life direction — grounded in classical Jyotish, not generic advice."
                hook="Jyotish Shastra reveals what your stars set in motion at the moment of your first breath. Navi blends that ancient science with modern AI so you can ask the questions you've always wanted to ask — and get answers personal to your chart."
                icon={<MessageSquare className="w-4 h-4" />}
                ctaLabel="Sign in to Chat"
                callbackUrl="/chat"
                features={[
                    {
                        title: 'Personal to your chart',
                        desc: 'Every answer is computed against your Lagna, planets, and Dasha — not stock predictions.',
                        icon: <Sparkles className="w-5 h-5" />,
                    },
                    {
                        title: 'Classical sources',
                        desc: 'Grounded in BPHS, Phaladeepika, and other classical Jyotish texts — explainable and traceable.',
                        icon: <BookOpen className="w-5 h-5" />,
                    },
                    {
                        title: 'Multiple specialist guides',
                        desc: 'Pick a guide tuned for career, relationships, health, or deep chart analysis. Each one stays in scope.',
                        icon: <Brain className="w-5 h-5" />,
                    },
                ]}
                benefits={[
                    'Answers reference your actual planetary placements',
                    'Suggested questions update with today\'s transits',
                    'Conversations are private — encrypted end-to-end',
                    'Free credits to start — no card required',
                ]}
                vedicAuthority="Powered by BPHS-grounded chart analysis & specialist AI guides"
            />
        );
    }

    return <ChatPageClient />;
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                </div>
                <p className="text-[14px] text-foreground/40 font-medium">Opening Navi...</p>
            </div>
        }>
            <ChatContent />
        </Suspense>
    );
}
