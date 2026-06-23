'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, MessageSquare } from 'lucide-react';
import Button from '../ui/Button';
import LandingImage from './LandingImage';

export default function HeroSection() {
    return (
        <section className="relative flex flex-col items-center overflow-hidden px-4 sm:px-8 lg:px-16 pt-28 sm:pt-32 lg:pt-36 pb-16 lg:pb-24 max-w-[1440px] mx-auto w-full">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
                
                {/* LEFT COLUMN — Copy (on Desktop) / TOP (on Mobile) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="lg:col-span-6 flex flex-col text-center lg:text-left items-center lg:items-start"
                >
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/35 mb-6">
                        <Sparkles className="text-secondary w-3.5 h-3.5" />
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-secondary font-body">
                            AI-Powered Vedic Astrology
                        </span>
                    </div>

                    {/* Headline */}
                    <h1 className="font-headline font-bold text-primary leading-[1.1] mb-5 text-4xl sm:text-5xl lg:text-[3.5rem] tracking-tight">
                        Your Cosmic Journey,<br />
                        <span className="text-secondary italic">Finally Understood.</span>
                    </h1>

                    {/* Short Text */}
                    <p className="text-sm sm:text-base md:text-lg text-on-surface-variant/80 max-w-xl leading-relaxed font-body mb-8">
                        AI-powered Vedic astrology for daily guidance, Kundli insights, forecasts, and personal questions.
                    </p>

                    {/* Desktop CTA Buttons */}
                    <div className="hidden lg:flex flex-row items-center gap-4 w-full">
                        <Button
                            href="/login?action=register"
                            size="lg"
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                            className="gold-gradient shadow-xl px-8"
                        >
                            Let&apos;s get started
                        </Button>
                        <Button
                            href="/chat"
                            variant="secondary"
                            size="lg"
                            leftIcon={<MessageSquare className="w-4 h-4 text-secondary" />}
                            className="px-8 border-outline-variant/40 text-primary hover:border-secondary/50"
                        >
                            Ask Navi
                        </Button>
                    </div>
                </motion.div>

                {/* RIGHT COLUMN — Stacked Screenshots (on Desktop) / MIDDLE (on Mobile) */}
                <div className="lg:col-span-6 relative flex items-center justify-center min-h-[360px] sm:min-h-[460px] lg:min-h-[520px] w-full mt-4 lg:mt-0">
                    <div className="relative w-full max-w-[320px] sm:max-w-[420px] lg:max-w-[480px] h-[340px] sm:h-[440px] lg:h-[500px] flex items-center justify-center">
                        {/* Glow specifically behind the images */}
                        <div className="absolute w-[220px] sm:w-[320px] h-[220px] sm:h-[320px] bg-[var(--glow-color)] blur-[80px] rounded-full -z-20 pointer-events-none opacity-90" />
                        <div className="absolute w-[180px] sm:w-[260px] h-[180px] sm:h-[260px] bg-accent/15 blur-[90px] rounded-full -z-20 pointer-events-none opacity-70 animate-pulse" />
                        
                        {/* 1. Left Peek (Kundli) */}
                        <motion.div
                            initial={{ opacity: 0, x: -30, rotate: -10 }}
                            animate={{ opacity: 0.85, x: -95, rotate: -16 }}
                            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                            className="absolute left-[15%] top-[8%] w-[130px] sm:w-[170px] lg:w-[200px] rounded-[24px] sm:rounded-[32px] border-[4px] border-surface-variant/80 bg-[#070514] shadow-2xl overflow-hidden -z-10 aspect-[1170/2532] select-none pointer-events-none hidden sm:block"
                        >
                            <div className="absolute top-0 inset-x-0 h-3 bg-[#070514] flex justify-center items-center z-20">
                                <div className="w-8 h-0.5 rounded-full bg-on-surface-variant/20" />
                            </div>
                            <div className="w-full h-full pt-3">
                                <LandingImage
                                    src="/images/kundli-mobile.png"
                                    alt="Kundli Peek"
                                    placeholderName="Kundli Chart"
                                    aspectRatio="aspect-[1170/2532]"
                                    type="mobile"
                                    icon="kundli"
                                />
                            </div>
                        </motion.div>

                        {/* 2. Right Peek (Forecast) */}
                        <motion.div
                            initial={{ opacity: 0, x: 30, rotate: 10 }}
                            animate={{ opacity: 0.85, x: 95, rotate: 16 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                            className="absolute right-[15%] top-[8%] w-[130px] sm:w-[170px] lg:w-[200px] rounded-[24px] sm:rounded-[32px] border-[4px] border-surface-variant/80 bg-[#070514] shadow-2xl overflow-hidden -z-10 aspect-[1170/2532] select-none pointer-events-none hidden lg:block"
                        >
                            <div className="absolute top-0 inset-x-0 h-3 bg-[#070514] flex justify-center items-center z-20">
                                <div className="w-8 h-0.5 rounded-full bg-on-surface-variant/20" />
                            </div>
                            <div className="w-full h-full pt-3 relative flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,rgba(200,136,10,0.15)_0%,rgba(14,10,32,1)_70%)]">
                                <div className="w-8 h-8 rounded-full bg-secondary/15 flex items-center justify-center border border-secondary/35 mb-2 animate-pulse">
                                    <Sparkles className="w-4 h-4 text-secondary" />
                                </div>
                                <div className="text-[9px] font-bold text-primary/45 uppercase tracking-[0.2em] font-body">Transit Forecast</div>
                                <div className="text-[8px] text-on-surface-variant/35 mt-1 font-body">Coming Soon</div>
                            </div>
                        </motion.div>

                        {/* 3. Main Phone Screenshot (Dashboard) */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
                            className="relative z-10 w-[180px] sm:w-[230px] lg:w-[260px] rounded-[32px] sm:rounded-[42px] border-[6px] sm:border-[8px] border-surface-variant/80 bg-[#070514] shadow-2xl overflow-hidden aspect-[1170/2532]"
                        >
                            <div className="absolute top-0 inset-x-0 h-4 bg-[#070514] flex justify-center items-center z-20">
                                <div className="w-16 h-1 rounded-full bg-on-surface-variant/20" />
                            </div>
                            <div className="w-full h-full pt-4">
                                <LandingImage
                                    src="/images/dashboard-mobile.png"
                                    alt="AstraNavi Dashboard"
                                    placeholderName="Dashboard UI"
                                    aspectRatio="aspect-[1170/2532]"
                                    type="mobile"
                                    icon="dashboard"
                                />
                            </div>
                        </motion.div>
                        
                        {/* Single subtle peek behind the phone on mobile/small viewports */}
                        <div className="absolute inset-0 flex items-center justify-center sm:hidden -z-10">
                            <div className="w-[150px] aspect-[1170/2532] border-[4px] border-surface-variant/80 bg-[#070514]/90 rounded-[24px] rotate-[-16deg] -translate-x-12 opacity-40 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* BOTTOM COLUMN — CTA Buttons (on Mobile only) */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="flex lg:hidden flex-col sm:flex-row items-center gap-3 w-full mt-4"
                >
                    <Button
                        href="/login?action=register"
                        size="lg"
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        className="gold-gradient shadow-xl px-8 w-full sm:w-1/2"
                    >
                        Let&apos;s get started
                    </Button>
                    <Button
                        href="/chat"
                        variant="secondary"
                        size="lg"
                        leftIcon={<MessageSquare className="w-4 h-4 text-secondary" />}
                        className="px-8 w-full sm:w-1/2 border-outline-variant/40 text-primary"
                    >
                        Ask Navi
                    </Button>
                </motion.div>

            </div>
        </section>
    );
}
