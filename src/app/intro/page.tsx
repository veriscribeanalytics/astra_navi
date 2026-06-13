'use client';

import React, { useState, useCallback, useEffect } from 'react';
import CosmicIntro from '@/components/home/cosmic-intro/CosmicIntro';
import { useRouter } from 'next/navigation';

/**
 * /intro — test page that always plays the CosmicIntro animation.
 * Has a reveal layer behind it so the fade-out has somewhere to land.
 * Replay button remounts the animation without clearing sessionStorage.
 */
export default function IntroTestPage() {
    const router = useRouter();
    const [key, setKey] = useState(0);
    const [revealed, setRevealed] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.classList.add('intro-playing');
        }
        return () => {
            if (typeof window !== 'undefined') {
                document.documentElement.classList.remove('intro-playing');
            }
        };
    }, []);

    const handleReveal = useCallback(() => {
        setRevealed(true);
        if (typeof window !== 'undefined') {
            document.documentElement.classList.remove('intro-playing');
        }
    }, []);
    
    const handleComplete = useCallback(() => setDone(true), []);

    const handleReplay = () => {
        setRevealed(false);
        setDone(false);
        if (typeof window !== 'undefined') {
            document.documentElement.classList.add('intro-playing');
        }
        setKey((k) => k + 1);
    };

    return (
        <div className="fixed inset-0 overflow-hidden" style={{ background: 'var(--background)' }}>

            {/* ── Behind layer — the "landing" the intro reveals into ─────── */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-center"
                style={{
                    opacity: revealed ? 1 : 0,
                    transition: 'opacity 0.8s ease',
                    background: 'radial-gradient(ellipse at 50% 60%, rgba(120,60,220,0.15) 0%, var(--background) 65%)',
                }}
            >
                {/* Decorative top label */}
                <p
                    className="text-xs font-bold uppercase tracking-[0.3em]"
                    style={{ color: 'color-mix(in srgb, var(--secondary) 55%, transparent)' }}
                >
                    Vedic AI Astrology
                </p>

                {/* Hero headline */}
                <h1
                    className="font-headline font-black leading-tight"
                    style={{
                        fontSize: 'clamp(2.8rem, 8vw, 6rem)',
                        background: 'linear-gradient(135deg, var(--brand-gold-hover) 0%, var(--flare-lavender) 45%, var(--flare-lavender) 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent',
                    }}
                >
                    Your Stars,<br />Finally Clear.
                </h1>

                {/* Subtext */}
                <p
                    className="max-w-md text-base font-medium leading-relaxed"
                    style={{ color: 'var(--text-body)' }}
                >
                    Ancient Vedic wisdom decoded by modern AI — personalised to your birth chart, not your sun sign.
                </p>

                {/* CTA */}
                <button
                    onClick={() => router.push('/')}
                    className="mt-2 rounded-full px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:scale-105"
                    style={{
                        background: 'linear-gradient(135deg, var(--brand-gold), var(--brand-gold-hover))',
                    color: 'var(--on-primary)',
                    boxShadow: '0 0 32px color-mix(in srgb, var(--secondary) 35%, transparent)',
                    }}
                >
                    Explore AstraNavi →
                </button>
            </div>

            {/* ── CosmicIntro on top ──────────────────────────────────────── */}
            <CosmicIntro
                key={key}
                onReveal={handleReveal}
                onComplete={handleComplete}
            />

            {/* ── Controls after intro finishes — sit at the bottom ───────── */}
            {done && (
                <div className="fixed bottom-8 left-1/2 z-[2000] flex -translate-x-1/2 items-center gap-3">
                    <button
                        onClick={handleReplay}
                        className="rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-100"
                        style={{
                            color: 'var(--brand-gold-hover)',
                            borderColor: 'color-mix(in srgb, var(--secondary) 50%, transparent)',
                            background: 'color-mix(in srgb, var(--background) 70%, transparent)',
                            backdropFilter: 'blur(8px)',
                            opacity: 0.9,
                        }}
                    >
                        ↺ Replay
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-widest transition-all hover:opacity-100"
                        style={{
                            color: 'var(--flare-lavender)',
                            borderColor: 'color-mix(in srgb, var(--flare-lavender) 30%, transparent)',
                            background: 'color-mix(in srgb, var(--background) 70%, transparent)',
                            backdropFilter: 'blur(8px)',
                            opacity: 0.8,
                        }}
                    >
                        Home →
                    </button>
                </div>
            )}
        </div>
    );
}
