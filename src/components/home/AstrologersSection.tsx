'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowRight, MessageSquare, Coins } from 'lucide-react';
import { useChat } from '@/context/ChatContext';
import { getAvatarTheme } from '@/utils/avatarStyle';

/**
 * Meet your AI Astrologers — the Astra guide bots.
 * EN-only copy; avatars use the local /images/avatars/*.jpeg assets.
 * "Chat Now" selects the guide avatar and routes to /chat (same flow the
 * dashboard uses); "View All Guides" also routes to /chat.
 */

const GUIDES = [
    { avatarId: 'navi', name: 'Navi', role: 'General Vedic Guide', desc: 'Balanced Vedic guidance for love, work, timing & life.', credits: 1, img: '/images/avatars/NAVI_AVATAR.jpeg' },
    { avatarId: 'career_mentor', name: 'Arya', role: 'Career Mentor', desc: 'Guidance for jobs, skills, promotion & work decisions.', credits: 2, img: '/images/avatars/ARYA_AVATAR.jpeg' },
    { avatarId: 'relationship_guide', name: 'Meera', role: 'Relationship Guide', desc: 'Insights for love, marriage, compatibility & emotions.', credits: 2, img: '/images/avatars/MEERA_AVATAR.jpeg' },
    { avatarId: 'spiritual_guide', name: 'Anand', role: 'Health Advisor', desc: 'Understand vitality, well-being & health patterns.', credits: 2, img: '/images/avatars/ANAND_AVATAR.jpeg' },
    { avatarId: 'finance_mentor', name: 'Vidya', role: 'Financial Astrologer', desc: 'Wealth, investments & financial stability insights.', credits: 2, img: '/images/avatars/VIDYA_AVATAR.jpeg' },
    { avatarId: 'astro_sage', name: 'Rishi', role: 'Deep Chart Sage', desc: 'Advanced chart synthesis for deep spiritual insights.', credits: 3, img: '/images/avatars/RISHI_AVATAR.jpeg' },
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
    const router = useRouter();
    const { setSelectedAvatarId } = useChat();

    const handleChat = (avatarId: string) => {
        setSelectedAvatarId(avatarId);
        router.push('/chat');
    };

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
                        AI Astrologers
                    </div>
                    <h2 className="text-2xl sm:text-4xl font-bold font-headline text-primary">
                        Chat with Your AI <span className="text-secondary italic">Astrologers</span>
                    </h2>
                </div>
                <Link
                    href="/chat"
                    className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-secondary uppercase tracking-[0.15em] hover:translate-x-1 transition-transform shrink-0 mb-1"
                >
                    View All Guides <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
                {GUIDES.map((g) => {
                    const theme = getAvatarTheme(g.avatarId);
                    return (
                        <motion.div
                            key={g.avatarId}
                            variants={itemVariants}
                            whileHover={{ y: -6 }}
                            className="group rounded-[22px] border border-outline-variant/30 bg-surface p-4 sm:p-5 flex flex-col items-center text-center hover:border-secondary/45 transition-colors duration-300"
                        >
                            <div className="relative mb-2">
                                <div
                                    className="relative w-16 h-16 rounded-full overflow-hidden border-[3px] shadow-md"
                                    style={{ borderColor: theme.secondary }}
                                >
                                    <Image
                                        src={g.img}
                                        alt={g.name}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                    />
                                </div>
                                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-surface" />
                            </div>
                            <div className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/5 px-2 py-0.5 text-[9px] font-bold text-secondary mb-2">
                                <Coins className="w-2.5 h-2.5" />
                                {g.credits} {g.credits === 1 ? 'credit/msg' : 'credits/msg'}
                            </div>
                            <h3 className="text-sm font-bold text-primary leading-tight">{g.name}</h3>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-on-surface-variant/70 mt-1 mb-2 leading-tight">{g.role}</p>
                            <p className="text-[10px] text-on-surface-variant/60 mb-4 leading-relaxed line-clamp-2">{g.desc}</p>
                            <button
                                type="button"
                                onClick={() => handleChat(g.avatarId)}
                                className="mt-auto w-full inline-flex items-center justify-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/5 px-3 py-2 text-[11px] font-bold text-secondary uppercase tracking-wider hover:bg-secondary/10 transition-colors"
                            >
                                <MessageSquare className="w-3.5 h-3.5" /> Chat Now
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            <div className="flex sm:hidden justify-center mt-8">
                <Link href="/chat" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-secondary uppercase tracking-[0.15em]">
                    View All Guides <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </motion.section>
    );
}
