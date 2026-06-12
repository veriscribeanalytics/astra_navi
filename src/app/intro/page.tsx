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
        <div className="fixed inset-0 overflow-hidden" style={{ background: '#050716' }}>

            {/* ── Behind layer — the "landing" the intro reveals into ─────── */}
            <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6 text-center"
                style={{
                    opacity: revealed ? 1 : 0,
                    transition: 'opacity 0.8s ease',
                    background: 'radial-gradient(ellipse at 50% 60%, rgba(120,60,220,0.15) 0%, #050716 65%)',
                }}
            >
                {/* Decorative top label */}
                <p
                    className="text-xs font-bold uppercase tracking-[0.3em]"
                    style={{ color: 'rgba(244,210,122,0.55)' }}
                >
                    Vedic AI Astrology
                </p>

                {/* Hero headline */}
                <h1
                    className="font-headline font-black leading-tight"
                    style={{
                        fontSize: 'clamp(2.8rem, 8vw, 6rem)',
                        background: 'linear-gradient(135deg, #f4d27a 0%, #e8b4f8 45%, #9b7fe8 100%)',
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
                    style={{ color: 'rgba(220,210,255,0.6)' }}
                >
                    Ancient Vedic wisdom decoded by modern AI — personalised to your birth chart, not your sun sign.
                </p>

                {/* CTA */}
                <button
                    onClick={() => router.push('/')}
                    className="mt-2 rounded-full px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all hover:scale-105"
                    style={{
                        background: 'linear-gradient(135deg, #c8880a, #f4d27a)',
                        color: '#050716',
                        boxShadow: '0 0 32px rgba(200,136,10,0.35)',
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
                            color: '#f4d27a',
                            borderColor: 'rgba(200,136,10,0.5)',
                            background: 'rgba(5,7,22,0.7)',
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
                            color: '#c4a8ff',
                            borderColor: 'rgba(196,168,255,0.3)',
                            background: 'rgba(5,7,22,0.7)',
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
