"use client";

import React, { useEffect, useRef } from 'react';

const SunFlares: React.FC = () => {
    const mouseRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!mouseRef.current) return;
            // Immediate, zero-transition update for absolute reactivity
            mouseRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
        };
        
        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <>
            <style>{`
                @keyframes drift-a {
                    0%, 100% { transform: translate(0, 0); }
                    33%       { transform: translate(30px, 40px); }
                    66%       { transform: translate(-15px, 20px); }
                }
                @keyframes drift-b {
                    0%, 100% { transform: translate(0, 0); }
                    40%       { transform: translate(-40px, -30px); }
                    75%       { transform: translate(20px, -50px); }
                }
                @keyframes drift-c {
                    0%, 100% { transform: translate(0, 0); }
                    50%       { transform: translate(40px, -40px); }
                }
                @keyframes drift-center {
                    0%, 100% { transform: translate(-50%, -50%); }
                    33%       { transform: translate(-47%, -53%); }
                    66%       { transform: translate(-53%, -47%); }
                }
                .flare-a      { animation: drift-a 35s ease-in-out infinite; }
                .flare-b      { animation: drift-b 40s ease-in-out infinite; }
                .flare-c      { animation: drift-c 30s ease-in-out infinite; }
                .flare-center { animation: drift-center 45s ease-in-out infinite; }
            `}</style>

            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-700 dark:opacity-45">
                {/* MOUSE FOLLOW — Ultra-Lucent tracking */}
                <div
                    ref={mouseRef}
                    className="absolute top-0 left-0 w-[550px] h-[550px] -ml-[275px] -mt-[275px] rounded-full will-change-transform pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--flare-gold) 35%, transparent) 0%, color-mix(in srgb, var(--flare-gold) 10%, transparent) 45%, transparent 70%)',
                    }}
                />

                {/* GOLD — top left - Significant Ivory Glare */}
                <div
                    className="flare-a absolute w-[1000px] h-[1000px] rounded-full blur-[110px]"
                    style={{
                        left: '-15%',
                        top: '-15%',
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--flare-gold) 45%, transparent) 0%, color-mix(in srgb, var(--flare-gold) 18%, transparent) 40%, transparent 75%)',
                    }}
                />

                {/* LAVENDER — bottom right - Atmospheric Glow */}
                <div
                    className="flare-b absolute w-[900px] h-[900px] rounded-full blur-[100px]"
                    style={{
                        right: '-15%',
                        bottom: '-15%',
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--flare-lavender) 35%, transparent) 0%, color-mix(in srgb, var(--flare-lavender) 12%, transparent) 40%, transparent 75%)',
                    }}
                />

                {/* IVORY — center right - "High Beam" luminosity */}
                <div
                    className="flare-c absolute w-[700px] h-[700px] rounded-full blur-[90px]"
                    style={{
                        right: '10%',
                        top: '15%',
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--flare-ivory) 70%, transparent) 0%, color-mix(in srgb, var(--flare-ivory) 25%, transparent) 35%, transparent 75%)',
                    }}
                />

                {/* CENTER — Anchor Glare */}
                <div
                    className="flare-center absolute w-[800px] h-[800px] rounded-full blur-[100px]"
                    style={{
                        left: '50%',
                        top: '50%',
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--flare-ivory) 45%, transparent) 0%, color-mix(in srgb, var(--flare-gold) 22%, transparent) 40%, transparent 75%)',
                    }}
                />

                {/* ADDITIONAL LIGHT-MODE EXCLUSIVE FLARES */}
                {/* AMBER — mid left - Exclusive brilliance */}
                <div
                    className="absolute w-[800px] h-[800px] rounded-full blur-[100px] dark:hidden animate-pulse duration-[8000ms]"
                    style={{
                        left: '-10%',
                        top: '40%',
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--flare-gold) 25%, transparent) 0%, color-mix(in srgb, var(--flare-gold) 8%, transparent) 50%, transparent 80%)',
                    }}
                />

                {/* TOP CENTER — High beam accent - Exclusive brilliance */}
                <div
                    className="absolute w-[600px] h-[600px] rounded-full blur-[80px] dark:hidden"
                    style={{
                        left: '40%',
                        top: '-5%',
                        background: 'radial-gradient(circle, color-mix(in srgb, var(--flare-ivory) 50%, transparent) 0%, color-mix(in srgb, var(--flare-ivory) 15%, transparent) 40%, transparent 70%)',
                    }}
                />
            </div>
        </>
    );
};

export default SunFlares;