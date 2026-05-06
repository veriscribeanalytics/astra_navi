'use client';

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle, Shield, Star, Zap, Lock, Clock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface PublicFeatureLandingProps {
    title: string;
    subtitle: string;
    description: string;
    hook: string;
    icon: React.ReactNode;
    features: { title: string; desc: string; icon: React.ReactNode }[];
    benefits: string[];
    ctaLabel: string;
    callbackUrl: string;
    image?: string;
    vedicAuthority?: string;
}

const PublicFeatureLanding: React.FC<PublicFeatureLandingProps> = ({
    title,
    subtitle,
    description,
    hook,
    icon,
    features,
    benefits,
    ctaLabel,
    callbackUrl,
    vedicAuthority = "Based on Brihat Parashara Hora Shastra (BPHS)"
}) => {
    return (
        <div className="min-h-screen pt-[calc(var(--navbar-height,64px)+1rem)]">

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* HERO — Full-width with side stats                         */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="w-full px-4 sm:px-8 lg:px-12 max-w-[1600px] 2xl:max-w-[1900px] 3xl:max-w-[2200px] mx-auto mb-10 sm:mb-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    
                    {/* Left stat column */}
                    <div className="hidden lg:flex lg:col-span-2 flex-col gap-4 items-end pr-4">
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="text-right">
                            <p className="text-2xl font-headline font-bold text-secondary">5,000+</p>
                            <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold">Years of Wisdom</p>
                        </motion.div>
                        <div className="w-px h-8 bg-outline-variant/15" />
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="text-right">
                            <p className="text-2xl font-headline font-bold text-primary">16+</p>
                            <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold">Varga Charts</p>
                        </motion.div>
                        <div className="w-px h-8 bg-outline-variant/15" />
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="text-right">
                            <p className="text-2xl font-headline font-bold text-primary">100%</p>
                            <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold">Private & Secure</p>
                        </motion.div>
                    </div>

                    {/* Center hero content */}
                    <div className="lg:col-span-8 text-center py-6 sm:py-10">
                        <motion.div 
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/5 border border-secondary/15 mb-5"
                        >
                            <span className="text-secondary">{icon}</span>
                            <span className="text-[10px] font-bold tracking-[0.2em] text-secondary uppercase font-body">{subtitle}</span>
                        </motion.div>
                        
                        <motion.h1 
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-primary mb-4 leading-tight"
                        >
                            {title}
                        </motion.h1>
                        
                        <motion.p 
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-sm sm:text-base text-on-surface-variant/70 leading-relaxed mb-8 max-w-2xl mx-auto"
                        >
                            {description}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="flex flex-col sm:flex-row gap-3 justify-center items-center"
                        >
                            <Button 
                                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                                size="lg" 
                                className="gold-gradient shadow-lg shadow-secondary/20 px-8 text-sm group"
                            >
                                {ctaLabel} <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                            <span className="text-[11px] text-on-surface-variant/40 uppercase tracking-widest font-bold">Free • No Credit Card</span>
                        </motion.div>
                    </div>

                    {/* Right stat column */}
                    <div className="hidden lg:flex lg:col-span-2 flex-col gap-4 items-start pl-4">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="text-left">
                            <p className="text-2xl font-headline font-bold text-secondary">30s</p>
                            <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold">Instant Result</p>
                        </motion.div>
                        <div className="w-px h-8 bg-outline-variant/15" />
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="text-left">
                            <p className="text-2xl font-headline font-bold text-primary">24/7</p>
                            <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold">Always Available</p>
                        </motion.div>
                        <div className="w-px h-8 bg-outline-variant/15" />
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="text-left">
                            <p className="text-2xl font-headline font-bold text-primary">BPHS</p>
                            <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold">Classical Standard</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* VEDIC HOOK + QUICK STATS — Full-width band                */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="w-full border-y border-outline-variant/10 bg-surface-variant/5 mb-10 sm:mb-14">
                <div className="max-w-[1600px] 2xl:max-w-[1900px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        {/* Quote */}
                        <div className="lg:col-span-7 relative">
                            <div className="absolute -top-2 -left-1 text-secondary/15 text-5xl font-serif select-none leading-none">&quot;</div>
                            <div className="pl-8">
                                <p className="text-sm sm:text-base text-primary/80 leading-relaxed font-body italic">
                                    {hook}
                                </p>
                                <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-[0.15em] font-bold mt-3">
                                    {vedicAuthority}
                                </p>
                            </div>
                        </div>
                        {/* Quick trust stats */}
                        <div className="lg:col-span-5 grid grid-cols-3 gap-4">
                            <div className="text-center p-4 rounded-2xl bg-surface border border-outline-variant/15">
                                <Lock className="w-5 h-5 text-secondary mx-auto mb-2" />
                                <p className="text-lg font-headline font-bold text-primary">256-bit</p>
                                <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold mt-0.5">Encryption</p>
                            </div>
                            <div className="text-center p-4 rounded-2xl bg-surface border border-outline-variant/15">
                                <Clock className="w-5 h-5 text-secondary mx-auto mb-2" />
                                <p className="text-lg font-headline font-bold text-primary">&lt; 30s</p>
                                <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold mt-0.5">Generation</p>
                            </div>
                            <div className="text-center p-4 rounded-2xl bg-surface border border-outline-variant/15">
                                <Star className="w-5 h-5 text-secondary mx-auto mb-2" />
                                <p className="text-lg font-headline font-bold text-primary">Free</p>
                                <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold mt-0.5">Beta Access</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* FEATURE BENTO GRID — Full-width with side labels          */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="w-full px-4 sm:px-8 lg:px-12 max-w-[1600px] 2xl:max-w-[1900px] 3xl:max-w-[2200px] mx-auto mb-10 sm:mb-14">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left label */}
                    <div className="hidden lg:flex lg:col-span-2 flex-col justify-start pt-4">
                        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                            <p className="text-[10px] text-secondary uppercase tracking-[0.2em] font-bold mb-2">Core Features</p>
                            <h2 className="text-xl font-headline font-bold text-primary leading-tight">What You&apos;ll Unlock</h2>
                            <div className="w-12 h-0.5 bg-secondary/30 rounded-full mt-3" />
                        </motion.div>
                    </div>

                    {/* Feature cards grid */}
                    <div className="lg:col-span-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                        {features.map((feature, idx) => (
                            <motion.div 
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                viewport={{ once: true }}
                            >
                                <Card className="h-full border-outline-variant/20 hover:border-secondary/30 transition-all duration-300 group !p-5 sm:!p-6">
                                    <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/10 flex items-center justify-center text-secondary mb-4 group-hover:scale-105 transition-transform">
                                        {feature.icon}
                                    </div>
                                    <h4 className="text-base font-headline font-bold text-primary mb-2">{feature.title}</h4>
                                    <p className="text-xs sm:text-sm text-on-surface-variant/60 leading-relaxed">{feature.desc}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TRUST + BENEFITS — Full-width with 3-column layout        */}
            {/* ═══════════════════════════════════════════════════════════ */}
            <section className="w-full border-t border-outline-variant/10 pt-10 sm:pt-14 pb-16">
                <div className="max-w-[1600px] 2xl:max-w-[1900px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-8 lg:px-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        
                        {/* Privacy card — left */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="lg:col-span-4"
                        >
                            <Card className="border-outline-variant/20 !p-6 sm:!p-8 text-center h-full flex flex-col items-center justify-center">
                                <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/10 flex items-center justify-center mb-4">
                                    <Shield className="w-7 h-7 text-secondary/60" />
                                </div>
                                <h4 className="text-base font-headline font-bold text-primary mb-2">100% Private & Secure</h4>
                                <p className="text-xs text-on-surface-variant/50 leading-relaxed max-w-xs">
                                    Your birth data and conversations are encrypted end-to-end and never shared with third parties.
                                </p>
                                <div className="flex items-center gap-6 mt-5 pt-4 border-t border-outline-variant/10 w-full justify-center">
                                    <div className="text-center">
                                        <p className="text-lg font-headline font-bold text-secondary">0</p>
                                        <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold">Data Shared</p>
                                    </div>
                                    <div className="w-px h-8 bg-outline-variant/10" />
                                    <div className="text-center">
                                        <p className="text-lg font-headline font-bold text-secondary">E2E</p>
                                        <p className="text-[9px] text-on-surface-variant/40 uppercase tracking-wider font-bold">Encrypted</p>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Benefits list — center */}
                        <div className="lg:col-span-4 space-y-5">
                            <div>
                                <p className="text-[10px] text-secondary uppercase tracking-[0.2em] font-bold mb-2">What You Get</p>
                                <h2 className="text-xl sm:text-2xl font-headline font-bold text-primary">Why Users Trust AstraNavi</h2>
                            </div>
                            <div className="space-y-3">
                                {benefits.map((benefit, idx) => (
                                    <motion.div 
                                        key={idx} 
                                        initial={{ opacity: 0, x: -10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.06 }}
                                        viewport={{ once: true }}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-surface-variant/5 border border-outline-variant/10 hover:border-secondary/20 transition-all"
                                    >
                                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                        <p className="text-sm text-on-surface-variant/80">{benefit}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* CTA card — right */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="lg:col-span-4"
                        >
                            <Card className="border-secondary/20 !p-6 sm:!p-8 text-center h-full flex flex-col items-center justify-center bg-gradient-to-br from-secondary/5 via-transparent to-secondary/5">
                                <div className="w-14 h-14 rounded-2xl bg-secondary/15 border border-secondary/20 flex items-center justify-center mb-4">
                                    <Zap className="w-7 h-7 text-secondary" />
                                </div>
                                <h4 className="text-base font-headline font-bold text-primary mb-2">Ready to Begin?</h4>
                                <p className="text-xs text-on-surface-variant/50 leading-relaxed mb-5 max-w-xs">
                                    Create your free account and unlock the full power of Vedic AI analysis in under 30 seconds.
                                </p>
                                <Button 
                                    href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                                    size="sm"
                                    className="gold-gradient shadow-md shadow-secondary/20 text-xs w-full group"
                                >
                                    {ctaLabel} <ArrowRight className="ml-2 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <div className="flex items-center gap-2 mt-4">
                                    <div className="flex -space-x-2">
                                        {['S', 'A', 'R', 'V'].map((letter, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-secondary/20 border-2 border-surface flex items-center justify-center text-[8px] font-bold text-secondary">
                                                {letter}
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-on-surface-variant/40 font-bold">Join 1,200+ users</p>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default PublicFeatureLanding;
