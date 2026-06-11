'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Users, Star, BookOpen, Award, ShieldCheck } from 'lucide-react';

/**
 * Stats bar — social-proof strip beneath the features grid.
 * EN-only copy; theme tokens only.
 */

const STATS = [
    { icon: Users, value: '50,000+', label: 'Happy Users' },
    { icon: Star, value: '4.8/5', label: 'Average Rating' },
    { icon: BookOpen, value: '1M+', label: 'Readings Generated' },
    { icon: Award, value: '500+', label: 'Expert Astrologers' },
    { icon: ShieldCheck, value: '100%', label: 'Secure & Private' },
];

const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' as const, staggerChildren: 0.07 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export default function StatsSection() {
    return (
        <section className="px-4 sm:px-6 lg:px-12 pb-6 lg:pb-10">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-50px' }}
                variants={containerVariants}
                className="max-w-6xl mx-auto rounded-[28px] border border-outline-variant/30 bg-surface/80 backdrop-blur-sm px-4 sm:px-8 py-6 sm:py-8"
            >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-y-6 gap-x-4 divide-outline-variant/15 lg:divide-x">
                    {STATS.map((s) => {
                        const Icon = s.icon;
                        return (
                            <motion.div key={s.label} variants={itemVariants} className="flex flex-col items-center text-center px-2">
                                <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center mb-2.5">
                                    <Icon className="w-5 h-5 text-secondary" />
                                </div>
                                <div className="text-xl sm:text-2xl font-bold text-primary font-headline">{s.value}</div>
                                <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-bold text-on-surface-variant/55 mt-1">
                                    {s.label}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
        </section>
    );
}
