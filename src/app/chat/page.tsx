'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatPageClient from '@/components/chat/ChatPageClient';
import { Sparkles } from 'lucide-react';

function ChatContent() {
    const { isLoggedIn, isLoading } = useAuth();
    const router = useRouter();
    const redirectedRef = useRef(false);

    useEffect(() => {
        if (isLoading || isLoggedIn) return;
        if (redirectedRef.current) return;
        redirectedRef.current = true;
        // `replace` (not `push`) so the broken /chat URL doesn't sit in history
        // — otherwise hitting Back from /login would bounce the user right
        // back into the same redirect path.
        router.replace('/login?callbackUrl=/chat');

        // Safety net: if for any reason the client-side router navigation
        // doesn't complete within 2s (e.g. the proxy bounces us back, an
        // ad blocker intercepts, a service worker stalls), force a hard
        // navigation. This guarantees the user never sits frozen on a
        // "Redirecting..." screen.
        const fallback = window.setTimeout(() => {
            if (typeof window !== 'undefined' && window.location.pathname === '/chat') {
                window.location.replace('/login?callbackUrl=/chat');
            }
        }, 2000);
        return () => window.clearTimeout(fallback);
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
        // session expires mid-session show a redirect-state UI instead of a
        // blank screen (navbar is hidden on /chat, so `return null` would
        // leave the user with no UI at all). The useEffect above kicks off
        // the actual redirect and a 2s hard-navigation safety net.
        return (
            <div className="flex-grow flex flex-col items-center justify-center min-h-[60vh] gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-secondary animate-pulse" />
                </div>
                <p className="text-[14px] text-foreground/40 font-medium">Redirecting to sign in...</p>
                <a
                    href="/login?callbackUrl=/chat"
                    className="mt-2 text-[11px] uppercase tracking-widest font-bold text-secondary/70 hover:text-secondary underline-offset-4 hover:underline"
                >
                    Click here if you&apos;re not redirected
                </a>
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
