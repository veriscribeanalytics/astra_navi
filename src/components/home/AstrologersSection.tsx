'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, MessageSquare } from 'lucide-react';

/**
 * Connect with Verified Astrologers — horizontally-scrollable expert cards.
 * EN-only copy; avatars are initials on a theme gradient (no image assets).
 * "Chat Now" + "View All" route to the existing auth / astrologers flow.
 */

const EXPERTS = [
    { name: 'Dr. Arvind Sharma', specialty: 'Vedic Astrology Expert', exp: '15+ Yrs Exp', initials: 'AS' },
    { name: 'Meera Iyer', specialty: 'Relationship Specialist', exp: '12+ Yrs Exp', initials: 'MI' },
    { name: 'Kartik Rao', specialty: 'Career & Finance Expert', exp: '10+ Yrs Exp', initials: 'KR' },
    { name: 'Vandana Joshi', specialty: 'Vastu & Remedies Expert', exp: '8+ Yrs Exp', initials: 'VJ' },
    { name: 'Sanjay Rathore', specialty: 'KP Astrology Expert', exp: '20+ Yrs Exp', initials: 'SR' },
];

const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: 'easeOut' as const, staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' as const } },
};

export default function AstrologersSection() {
    return (
        <motion.section
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={containerVariants}
            className="max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 lg:py-20"
        >
            <div className="flex items-end justify-between mb-8 sm:mb-12 gap-4">
                <div>
                    <div className="text-[10px] sm:text-[11px] text-secondary font-bold tracking-[0.22em] uppercase mb-3">
                        Verified Experts
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-bold font-headline text-primary">
                        Connect with Verified <span className="text-secondary italic">Astrologers</span>
                    </h2>
                </div>
                <Link
                    href="/astrologers"
                    className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-secondary uppercase tracking-[0.15em] hover:translate-x-1 transition-transform shrink-0 mb-1"
                >
                    View All Experts <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
                {EXPERTS.map((e) => (
                    <motion.div
                        key={e.name}
                        variants={itemVariants}
                        whileHover={{ y: -6 }}
                        className="group rounded-[22px] border border-outline-variant/30 bg-surface p-4 sm:p-5 flex flex-col items-center text-center hover:border-secondary/45 transition-colors duration-300"
                    >
                        <div className="relative mb-3">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white text-lg font-bold shadow-md">
                                {e.initials}
                            </div>
                            <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-surface" />
                        </div>
                        <h3 className="text-sm font-bold text-primary leading-tight">{e.name}</h3>
                        <p className="text-[10px] text-on-surface-variant/60 mt-1 mb-2 leading-tight">{e.specialty}</p>
                        <div className="flex items-center justify-center text-[10px] font-bold text-on-surface-variant/60 mb-4">
                            <span>{e.exp}</span>
                        </div>
                        <Link
                            href="/login"
                            className="mt-auto w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/5 px-3 py-2 text-[11px] font-bold text-secondary uppercase tracking-wider hover:bg-secondary/10 transition-colors"
                        >
                            <MessageSquare className="w-3.5 h-3.5" /> Chat Now
                        </Link>
                    </motion.div>
                ))}
            </div>

            <div className="flex sm:hidden justify-center mt-8">
                <Link href="/astrologers" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-secondary uppercase tracking-[0.15em]">
                    View All Experts <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </motion.section>
    );
}
