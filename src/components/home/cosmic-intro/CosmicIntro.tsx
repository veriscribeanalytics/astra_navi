'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { PLANETS, RASHIS, type PlanetAsset, type RashiAsset } from './assets';
import { createCosmicField, type CosmicField } from './cosmicField';

interface CosmicIntroProps {
    onReveal: () => void;
    onComplete: () => void;
}

export default function CosmicIntro({ onReveal, onComplete }: CosmicIntroProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const logoGroupRef = useRef<HTMLDivElement>(null);
    const sunSymbolRef = useRef<HTMLDivElement>(null);
    const wordmarkRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLDivElement>(null);

    const planetEls = useRef<(HTMLDivElement | null)[]>([]);
    const rashiEls = useRef<(HTMLDivElement | null)[]>([]);

    const [skipVisible, setSkipVisible] = useState(false);
    const tlRef = useRef<gsap.core.Timeline | null>(null);
    const fieldRef = useRef<CosmicField | null>(null);
    const doneRef = useRef(false);

    const finish = () => {
        if (doneRef.current) return;
        doneRef.current = true;
        onComplete();
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const reduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const mobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const lowTier =
            typeof document !== 'undefined' &&
            document.documentElement.dataset.deviceTier === 'low';
        const lite = mobile || lowTier;

        const field = createCosmicField(canvas, {
            planets: PLANETS.map((p) => ({ orbit: p.orbit, angle: p.angle, speed: p.speed })),
            rashiCount: RASHIS.length,
            reduced,
            lite,
        });
        fieldRef.current = field;

        field.planets.forEach((o, i) => (o.el = planetEls.current[i] ?? null));
        field.rashi.forEach((o, i) => (o.el = rashiEls.current[i] ?? null));
        field.start();

        const onResize = () => field.resize();
        window.addEventListener('resize', onResize);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const blurAmt = lite ? 6 : 10;
        const { state } = field;
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                defaults: { overwrite: 'auto' },
                onComplete: finish,
            });
            tlRef.current = tl;

            tl.addLabel('glare', 0);
            tl.addLabel('solarExpand', 1.2);
            tl.addLabel('zodiacMorph', 3.2);
            tl.addLabel('brandReveal', 5.0);
            tl.addLabel('heroText', 5.8);
            tl.addLabel('handoff', 6.5);

            // ── initial states: everything hidden except canvas background ──
            gsap.set(sunSymbolRef.current, { scale: 0.9, opacity: 0 });
            gsap.set(wordmarkRef.current, { y: 18, opacity: 0 });
            gsap.set(heroRef.current, { y: 28, opacity: 0 });

            // ── glare (0.0s – 1.2s): center light only ──────────────────────
            tl.to(state, { glare: 1, duration: 1.2, ease: 'sine.out' }, 0)
                .to(state, { starGlow: 0.35, duration: 1.2, ease: 'sine.out' }, 0)
                .to(state, { particles: 0.3, duration: 1.2, ease: 'sine.out' }, 0);

            // ── solarExpand (1.2s – 3.2s): system expands from center ────────
            tl.to(state, { solarExpand: 1, duration: 2.0, ease: 'power3.out' }, 1.2)
                .to(state, { starGlow: 0.55, duration: 2.0, ease: 'sine.inOut' }, 1.2)
                .to(state, { particles: 0.7, duration: 1.5, ease: 'sine.out' }, 1.2)
                .to(state, { nebula: 0.45, duration: 2.0, ease: 'sine.out' }, 1.2)
                .to(state, { zoom: 1.04, duration: 2.0, ease: 'power2.inOut' }, 1.2)
                .to(
                    field.planets,
                    { enter: 1, duration: 1.5, stagger: 0.07, ease: 'sine.out' },
                    1.3,
                );

            // ── zodiacMorph (3.2s – 5.0s): solar system → zodiac wheel ──────
            tl.to(state, { morphToZodiac: 1, duration: 1.8, ease: 'sine.inOut' }, 3.2)
                .to(state, { nebula: 0.55, duration: 1.8, ease: 'sine.out' }, 3.2)
                .to(
                    field.planets,
                    { enter: 0, duration: 1.4, stagger: 0.04, ease: 'sine.out' },
                    3.2,
                )
                .to(state, { rashiReveal: 1, duration: 1.0, ease: 'sine.out' }, 4.0)
                .to(
                    field.rashi,
                    { enter: 1, duration: 1.0, stagger: 0.055, ease: 'sine.out' },
                    4.2,
                );

            // ── brandReveal (5.0s – 5.8s): logo forms from center light ──────
            tl.to(state, { brandReveal: 1, duration: 0.8, ease: 'power3.out' }, 5.0)
                .to(state, { starGlow: 1.0, duration: 0.8, ease: 'power3.out' }, 5.0)
                .fromTo(
                    sunSymbolRef.current,
                    { scale: 0.9, opacity: 0 },
                    { scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' },
                    5.0,
                )
                .fromTo(
                    wordmarkRef.current,
                    { y: 18, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
                    5.15,
                );

            // ── heroText (5.8s – 6.5s): message appears ──────────────────────
            tl.to(state, { textReveal: 1, duration: 0.7, ease: 'power3.out' }, 5.8)
                .to(
                    logoGroupRef.current,
                    { y: -42, scale: 0.72, duration: 0.65, ease: 'power2.inOut' },
                    5.8,
                )
                .fromTo(
                    heroRef.current,
                    { y: 28, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
                    5.8,
                );

            // ── handoff (6.5s – 7.2s): fade to landing ──────────────────────
            tl.add(onReveal, 6.5)
                .to(state, { handoff: 1, duration: 0.7, ease: 'power2.inOut' }, 6.5)
                .to(state, { zoom: 1.18, duration: 0.7, ease: 'power2.in' }, 6.5)
                .to(state, { fade: 0, duration: 0.7, ease: 'power2.in' }, 6.5)
                .to(contentRef.current, { filter: `blur(${blurAmt}px)`, duration: 0.65, ease: 'power2.in' }, 6.5)
                .to([logoGroupRef.current, heroRef.current], { opacity: 0, duration: 0.45, ease: 'power2.in' }, 6.55)
                .to(rootRef.current, { opacity: 0, duration: 0.5, ease: 'power2.in' }, 6.7);

            if (reduced) {
                tl.progress(1);
            }
        }, rootRef);

        const skipTimer = window.setTimeout(() => setSkipVisible(true), 1000);

        return () => {
            window.removeEventListener('resize', onResize);
            window.clearTimeout(skipTimer);
            document.body.style.overflow = prevOverflow;
            field.stop();
            ctx.revert();
        };
    }, []);

    const handleSkip = () => {
        const tl = tlRef.current;
        if (!tl) {
            finish();
            return;
        }
        onReveal();
        gsap.to(tl, {
            progress: 1,
            duration: 0.45,
            ease: 'power2.inOut',
            onComplete: finish,
        });
    };

    return (
        <div
            ref={rootRef}
            className="fixed inset-0 z-[1500] overflow-hidden"
        
            aria-hidden="true"
        >
            <div ref={contentRef} className="absolute inset-0">
                {/* Layer 1 — cosmic field */}
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

                {/* Layer 2 — planet sprites (invisible until solarExpand) */}
                {PLANETS.map((p, i) => (
                    <PlanetSprite
                        key={p.src}
                        asset={p}
                        innerRef={(el) => {
                            planetEls.current[i] = el;
                        }}
                    />
                ))}

                {/* Layer 2 — rashi ring (invisible until zodiacMorph) */}
                {RASHIS.map((r, i) => (
                    <RashiSprite
                        key={r.src}
                        asset={r}
                        innerRef={(el) => {
                            rashiEls.current[i] = el;
                        }}
                    />
                ))}

                {/* Layer 2 — logo (invisible until brandReveal at 5.0s) */}
                <div
                    ref={logoGroupRef}
                    className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                    style={{ marginTop: '-2vh' }}
                >
                    <div ref={sunSymbolRef} style={{ opacity: 0 }}>
                        <SunSymbol />
                    </div>
                    <div
                        ref={wordmarkRef}
                        className="mt-3 font-headline font-bold tracking-wide"
                        style={{
                            opacity: 0,
                            fontSize: 'clamp(2rem, 6vw, 4rem)',
                            color: 'var(--secondary)',
                            textShadow: '0 0 28px color-mix(in srgb, var(--secondary) 45%, transparent)',
                        }}
                    >
                        AstraNavi
                    </div>
                </div>

                {/* Layer 2 — hero text (invisible until heroText at 5.8s) */}
                <div
                    ref={heroRef}
                    className="pointer-events-none absolute left-1/2 top-[58%] w-full -translate-x-1/2 px-6 text-center font-headline font-bold"
                    style={{ opacity: 0 }}
                >
                    <p style={{ fontSize: 'clamp(1.6rem, 5vw, 3.4rem)', color: 'var(--flare-ivory)', lineHeight: 1.15 }}>
                        Your Cosmic Journey,
                    </p>
                    <p
                        style={{
                            fontSize: 'clamp(1.6rem, 5vw, 3.4rem)',
                            lineHeight: 1.2,
                            backgroundImage: 'linear-gradient(90deg, var(--secondary) 0%, var(--flare-lavender) 55%, var(--flare-violet) 100%)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            color: 'transparent',
                        }}
                    >
                        Finally Understood.
                    </p>
                </div>
            </div>

            {/* Layer 3 — vignette + purple ambience */}
            <div
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--background) 0%, transparent) 35%, color-mix(in srgb, var(--background) 55%, transparent) 78%, color-mix(in srgb, var(--background) 92%, transparent) 100%), radial-gradient(circle at 50% 64%, color-mix(in srgb, var(--flare-lavender) 10%, transparent), transparent 55%)',
                }}
            />

            {/* Skip control */}
            <button
                type="button"
                onClick={handleSkip}
                className="absolute bottom-6 right-6 z-[210] rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-opacity duration-300"
                style={{
                    opacity: skipVisible ? 0.7 : 0,
                    pointerEvents: skipVisible ? 'auto' : 'none',
                    color: 'var(--secondary)',
                    borderColor: 'color-mix(in srgb, var(--secondary) 35%, transparent)',
                    background: 'color-mix(in srgb, var(--background) 45%, transparent)',
                    backdropFilter: 'blur(6px)',
                }}
            >
                Skip
            </button>
        </div>
    );
}

const SPRITE_BASE: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    opacity: 0,
    pointerEvents: 'none',
    transformOrigin: 'center',
    willChange: 'transform, opacity, filter',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

function PlanetSprite({
    asset,
    innerRef,
}: {
    asset: PlanetAsset;
    innerRef: (el: HTMLDivElement | null) => void;
}) {
    const [broken, setBroken] = useState(false);
    return (
        <div ref={innerRef} style={{ ...SPRITE_BASE, width: asset.size, height: asset.size }}>
            {broken ? (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        background: asset.gradient,
                        boxShadow: '0 0 12px color-mix(in srgb, var(--secondary) 30%, transparent), 0 0 24px color-mix(in srgb, var(--flare-lavender) 15%, transparent)',
                    }}
                />
            ) : (
                <img
                    src={asset.src}
                    alt=""
                    draggable={false}
                    onError={() => setBroken(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />
            )}
        </div>
    );
}

function RashiSprite({
    asset,
    innerRef,
}: {
    asset: RashiAsset;
    innerRef: (el: HTMLDivElement | null) => void;
}) {
    const [broken, setBroken] = useState(false);
    const SIZE = 32;
    return (
        <div ref={innerRef} style={{ ...SPRITE_BASE, width: SIZE, height: SIZE }}>
            {broken ? (
                <span
                    style={{
                        fontSize: SIZE * 0.8,
                        lineHeight: 1,
                        color: 'var(--secondary)',
                        textShadow: '0 0 10px color-mix(in srgb, var(--secondary) 50%, transparent), 0 0 20px color-mix(in srgb, var(--flare-lavender) 20%, transparent)',
                    }}
                >
                    {asset.glyph}
                </span>
            ) : (
                <img
                    src={asset.src}
                    alt=""
                    draggable={false}
                    onError={() => setBroken(true)}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                    }}
                />
            )}
        </div>
    );
}

function SunSymbol() {
    return (
        <svg width="84" height="84" viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <defs>
                <radialGradient id="cosmic-sun-core" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="var(--flare-ivory)" />
                    <stop offset="55%" stopColor="var(--secondary)" />
                    <stop offset="100%" stopColor="var(--brand-gold-dark)" />
                </radialGradient>
            </defs>
            <circle cx="50" cy="50" r="20" fill="url(#cosmic-sun-core)" />
            <circle cx="50" cy="50" r="27" stroke="var(--secondary)" strokeWidth="2" opacity="0.8" />
            {Array.from({ length: 12 }).map((_, i) => {
                const a = (i / 12) * Math.PI * 2;
                const r1 = 33;
                const r2 = 44;
                return (
                    <line
                        key={i}
                        x1={50 + Math.cos(a) * r1}
                        y1={50 + Math.sin(a) * r1}
                        x2={50 + Math.cos(a) * r2}
                        y2={50 + Math.sin(a) * r2}
                        stroke="var(--secondary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        opacity="0.7"
                    />
                );
            })}
        </svg>
    );
}