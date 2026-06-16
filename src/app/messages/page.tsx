'use client';

import React, { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import MessagesClient from './MessagesClient';
import PublicFeatureLanding from '@/components/layout/PublicFeatureLanding';
import { MessageCircle, Users, Shield, Star } from 'lucide-react';

function MessagesContent() {
    const { isLoggedIn, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-secondary animate-pulse" />
                </div>
                <p className="text-[14px] text-foreground/40 font-medium">Opening your messages...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <PublicFeatureLanding
                title="Messages — Talk to Your Connections"
                subtitle="Private 1:1 chat with the people you're connected to"
                description="Message anyone you've connected with on AstraNavi. Conversations stay private between the two of you, separate from your Navi AI chats."
                hook="Astrology is best explored together. Compare charts, plan around transits, and stay close to the people whose cosmic journeys are tied to yours."
                icon={<MessageCircle className="w-4 h-4" />}
                ctaLabel="Open Messages"
                callbackUrl="/messages"
                features={[
                    {
                        title: 'Private 1:1 conversations',
                        desc: 'Chat directly with family and friends you\'re connected to — no one else can see it.',
                        icon: <MessageCircle className="w-5 h-5" />,
                    },
                    {
                        title: 'Built on your connections',
                        desc: 'Message anyone you have an active connection with, family or friend.',
                        icon: <Users className="w-5 h-5" />,
                    },
                    {
                        title: 'You stay in control',
                        desc: 'Blocking or disconnecting stops new messages instantly.',
                        icon: <Shield className="w-5 h-5" />,
                    },
                ]}
                benefits={[
                    'Private storage — visible only to the two of you',
                    'Works with every active connection',
                    'Separate from your Navi AI chats',
                ]}
                vedicAuthority="Stay connected with the people who share your cosmic path"
            />
        );
    }

    return <MessagesClient />;
}

export default function MessagesPage() {
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
            <MessagesContent />
        </Suspense>
    );
}
