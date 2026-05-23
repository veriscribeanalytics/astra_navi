'use client';

import React, { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatPageClient from '@/components/chat/ChatPageClient';
import { Sparkles } from 'lucide-react';

function ChatContent() {
    const { isLoggedIn, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isLoggedIn) {
            router.push('/login?callbackUrl=/chat');
        }
    }, [isLoading, isLoggedIn, router]);

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
        // Middleware should have redirected before we got here, but if the
        // session expires mid-session or middleware is bypassed, show a
        // redirect-state UI instead of a blank screen (navbar is hidden on
        // /chat, so `return null` would leave the user with no UI at all).
        return (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                </div>
                <p className="text-[14px] text-foreground/40 font-medium">Redirecting to sign in...</p>
            </div>
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
