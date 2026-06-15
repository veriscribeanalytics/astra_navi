'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform, MotionValue } from 'motion/react';
import {
    Brain, Compass, CalendarHeart, Heart, Bell, Users, ArrowRight, Sparkles
} from 'lucide-react';

/**
 * Features — "Everything You Need on Your Cosmic Journey".
 *
 * Scroll-driven STACKED CARDS (Apple-style pinned storytelling): each feature
 * is a full-viewport panel that sticks to the screen while the next one scales
 * up and stacks over it. Implemented with Framer Motion `useScroll` +
 * `useTransform` + CSS `position: sticky` — no scroll libraries needed.
 *
 * EN-only copy until i18n keys are added. Colours from theme tokens only.
 */

const FEATURES = [
    {
        icon: Brain,
        title: 'AI Astrologer',
        desc: 'Chat with Navi AI and get instant, accurate answers to all your questions — trained on classical Jyotish texts and available 24/7.',
        href: '/chat',
        tint: 'secondary',
    },
    {
        icon: Compass,
        title: 'Free Kundli',
        desc: 'Generate your detailed Janam Kundli in seconds with precise Vedic calculations across all 16 Varga charts.',
        href: '/kundli',
        tint: 'accent',
    },
    {
        icon: CalendarHeart,
        title: 'Daily Predictions',
        desc: 'Personalized daily guidance based on your exact Moon sign, Nakshatra and live planetary transits.',
        href: '/horoscope/forecast',
        tint: 'secondary',
    },
    {
        icon: Heart,
        title: 'Compatibility',
        desc: 'Check 36-point Guna compatibility with your partner and understand the destiny of your relationship.',
        href: '/kundli/match',
        tint: 'accent',
    },
    {
        icon: Bell,
        title: 'Transit Alerts',
        desc: 'Real-time planetary movement alerts and Muhurta timing so you always act at the most auspicious moment.',
        href: '/horoscope/forecast',
        tint: 'secondary',
    },
    {
        icon: Users,
        title: 'Expert Consultation',
        desc: 'Connect 1-on-1 with hand-picked, verified astrologers for deeper insights and personal remedies.',
        href: '/astrologers',
        tint: 'accent',
    },
];

const headerVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
};

export default function FeaturesSection() {
    const container = useRef<HTMLDivElement>(null);
    const bodyRef = useRef<HTMLElement | null>(null);
    if (typeof document !== 'undefined') {
        bodyRef.current = document.body;
    }
    const { scrollYProgress } = useScroll({
        target: container,
        container: bodyRef as React.RefObject<HTMLElement>,
        offset: ['start start', 'end end'],
    });

    return (
        <section className="relative">
            {/* heading */}
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={headerVariants}
                className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-12 pt-12 lg:pt-20 pb-4 text-center"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
                    <Sparkles className="w-3 h-3 text-secondary" />
                    <span className="text-[10px] font-bold tracking-[0.22em] text-secondary uppercase">Features</span>
                </div>
                <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary">
                    Everything You Need on Your <span className="text-secondary italic">Cosmic Journey</span>
                </h2>
                <p className="text-sm sm:text-base text-on-surface-variant/70 mt-3 max-w-2xl mx-auto">
                    Keep scrolling — each tool reveals itself in turn.
                </p>
            </motion.div>

            {/* stacked-cards scroll track */}
            <div ref={container} className="relative">
                {FEATURES.map((f, i) => {
                    const targetScale = 1 - (FEATURES.length - i) * 0.04;
                    const range: [number, number] = [i * (1 / FEATURES.length), 1];
                    return (
                        <FeatureCard
                            key={f.title}
                            index={i}
                            total={FEATURES.length}
                            feature={f}
                            progress={scrollYProgress}
                            range={range}
                            targetScale={targetScale}
                        />
                    );
                })}
            </div>
        </section>
    );
}

interface FeatureCardProps {
    index: number;
    total: number;
    feature: (typeof FEATURES)[number];
    progress: MotionValue<number>;
    range: [number, number];
    targetScale: number;
}

function FeatureCard({ index, total, feature, progress, range, targetScale }: FeatureCardProps) {
    const scale = useTransform(progress, range, [1, targetScale]);
    const Icon = feature.icon;
    const isAccent = feature.tint === 'accent';
    const tintText = isAccent ? 'text-accent' : 'text-secondary';
    const tintBg = isAccent ? 'bg-accent/10 border-accent/20' : 'bg-secondary/10 border-secondary/20';

    return (
        <div className="h-screen sticky top-0 flex items-center justify-center px-4 sm:px-6">
            <motion.div
                style={{ scale, top: `calc(-5vh + ${index * 28}px)` }}
                className="relative w-full max-w-4xl rounded-[32px] sm:rounded-[40px] border border-outline-variant/30 bg-surface shadow-2xl overflow-hidden origin-top"
            >
                {/* tint glow */}
                <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-[90px] ${isAccent ? 'bg-accent/20' : 'bg-secondary/20'} pointer-events-none`} />

                <div className="relative z-10 p-8 sm:p-12 lg:p-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[55vh]">
                    {/* left: copy */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-5xl sm:text-7xl font-headline font-bold text-outline-variant/30 leading-none">
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface-variant/40">
                                {index + 1} / {total}
                            </span>
                        </div>
                        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold text-primary mb-4 leading-tight">
                            {feature.title}
                        </h3>
                        <p className="text-base sm:text-lg text-on-surface-variant/75 leading-relaxed mb-8 max-w-md">
                            {feature.desc}
                        </p>
                        <Link
                            href={feature.href}
                            className={`inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-bold uppercase tracking-wider transition-transform hover:translate-x-1 ${tintBg} ${tintText}`}
                        >
                            Explore <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* right: icon visual */}
                    <div className="hidden md:flex items-center justify-center">
                        <div className="relative w-48 h-48 lg:w-60 lg:h-60">
                            <div className={`absolute inset-0 rounded-[36px] rotate-6 ${tintBg} border`} />
                            <div className="absolute inset-0 rounded-[36px] -rotate-3 bg-surface border border-outline-variant/30 flex items-center justify-center shadow-inner">
                                <Icon className={`w-20 h-20 lg:w-24 lg:h-24 ${tintText}`} strokeWidth={1.4} />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
