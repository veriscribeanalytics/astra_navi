'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';

/**
 * Testimonials — "Loved by Thousands of Seekers".
 * EN-only copy; avatars are initials on a theme gradient (no image assets).
 */

const TESTIMONIALS = [
    {
        quote: "AstraNavi's AI predictions are incredibly accurate. It has helped me make better career and financial decisions.",
        name: 'Priya S.',
        role: 'Marketing Manager',
        initials: 'PS',
    },
    {
        quote: 'The best astrology app I’ve ever used. The insights are deep, practical and beautifully explained.',
        name: 'Rohit M.',
        role: 'Entrepreneur',
        initials: 'RM',
    },
    {
        quote: 'Consulting experts on AstraNavi is so easy and powerful. Highly recommended!',
        name: 'Neha K.',
        role: 'Doctor',
        initials: 'NK',
    },
];

const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: 'easeOut' as const, staggerChildren: 0.12 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export default function TestimonialsSection() {
    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={containerVariants}
            className="max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20"
        >
            <div className="text-center mb-10 sm:mb-14">
                <div className="text-[10px] sm:text-[11px] text-secondary font-bold tracking-[0.22em] uppercase mb-3">
                    Testimonials
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold font-headline text-primary">
                    Loved by Thousands of <span className="text-secondary italic">Seekers</span>
                </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                {TESTIMONIALS.map((t) => (
                    <motion.div
                        key={t.name}
                        variants={itemVariants}
                        className="relative rounded-[24px] border border-outline-variant/30 bg-surface p-6 sm:p-7 flex flex-col"
                    >
                        <Quote className="w-8 h-8 text-secondary/20 mb-3" />
                        <div className="flex mb-3">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-secondary text-secondary" />
                            ))}
                        </div>
                        <p className="text-sm text-on-surface-variant/80 leading-relaxed flex-1">{t.quote}</p>
                        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-outline-variant/15">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white text-xs font-bold shadow">
                                {t.initials}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-primary">{t.name}</div>
                                <div className="text-[11px] text-on-surface-variant/55">{t.role}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.section>
    );
}
