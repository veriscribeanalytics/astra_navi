'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Users, Sparkles, MessagesSquare, CalendarHeart, ArrowRight } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/hooks';
import { useAuth } from '@/context/AuthContext';

export default function CommunityClient() {
    const { t } = useTranslation();
    const { isLoggedIn } = useAuth();

    const features = [
        {
            icon: <Users className="w-6 h-6" />,
            title: t('community.feature1Title'),
            desc: t('community.feature1Desc'),
        },
        {
            icon: <MessagesSquare className="w-6 h-6" />,
            title: t('community.feature2Title'),
            desc: t('community.feature2Desc'),
        },
        {
            icon: <CalendarHeart className="w-6 h-6" />,
            title: t('community.feature3Title'),
            desc: t('community.feature3Desc'),
        },
    ];

    return (
        <main className="min-h-screen bg-[var(--bg)] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto">

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
                        <Sparkles className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-[11px] font-bold text-secondary uppercase tracking-widest">
                            {t('community.comingSoon')}
                        </span>
                    </div>

                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-secondary/10 border border-secondary/20 text-secondary mb-6">
                        <Users className="w-8 h-8" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary mb-5">
                        {t('community.title')}
                    </h1>
                    <p className="text-on-surface-variant/70 text-base sm:text-lg leading-relaxed">
                        {t('community.subtitle')}
                    </p>
                </motion.div>

                {/* Feature teaser cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                    {features.map((f, i) => (
                        <motion.div
                            key={f.title}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                        >
                            <Card padding="lg" hoverable={false} className="h-full text-center flex flex-col items-center">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-secondary/10 border border-secondary/15 text-secondary mb-4">
                                    {f.icon}
                                </div>
                                <h3 className="text-lg font-headline font-bold text-primary mb-2">{f.title}</h3>
                                <p className="text-sm text-on-surface-variant/60 leading-relaxed">{f.desc}</p>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.45 }}
                    className="max-w-3xl mx-auto p-8 sm:p-10 rounded-[40px] bg-secondary/5 border border-secondary/10 text-center"
                >
                    <h2 className="text-2xl font-headline font-bold text-primary mb-3">
                        {t('community.notifyTitle')}
                    </h2>
                    <p className="text-sm text-on-surface-variant/70 max-w-lg mx-auto mb-6">
                        {t('community.notifyDesc')}
                    </p>
                    {isLoggedIn ? (
                        <Button href="/" variant="secondary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                            {t('community.ctaSignedIn')}
                        </Button>
                    ) : (
                        <Button
                            href="/login?callbackUrl=%2Fcommunity"
                            variant="primary"
                            size="md"
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                        >
                            {t('community.cta')}
                        </Button>
                    )}
                </motion.div>

            </div>
        </main>
    );
}
