'use client';

import React, { Suspense, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ConversationClient from './ConversationClient';
import { MessageCircle, Star } from 'lucide-react';

function ConversationGate({ threadId }: { threadId: number }) {
    const { isLoggedIn, isLoading } = useAuth();
    const router = useRouter();

    if (isLoading) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-secondary animate-pulse" />
                </div>
                <p className="text-[14px] text-foreground/40 font-medium">Opening conversation...</p>
            </div>
        );
    }

    if (!isLoggedIn) {
        router.replace('/login?callbackUrl=/messages');
        return null;
    }

    if (!Number.isFinite(threadId) || threadId <= 0) {
        router.replace('/messages');
        return null;
    }

    return <ConversationClient threadId={threadId} />;
}

export default function ConversationPage({ params }: { params: Promise<{ threadId: string }> }) {
    const { threadId } = use(params);
    const numericId = Number(threadId);

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
            <ConversationGate threadId={numericId} />
        </Suspense>
    );
}
