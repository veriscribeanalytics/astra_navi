'use client';

import React from 'react';
import { motion } from 'motion/react';

import { Variants } from 'motion/react';

interface Step {
    icon: React.ReactNode;
    title: string;
    desc: string;
    detail: string;
}

interface Props {
    t: (key: string) => string;
    steps: Step[];
    sectionVariants: Variants;
}

export default function HowItWorksSection({ t, steps, sectionVariants }: Props) {
    return (
        <motion.section id="how-it-works" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="py-10 sm:py-16 lg:py-24 relative overflow-hidden bg-transparent">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 1200 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 300C300 300 300 100 500 100C700 100 700 500 900 500C1100 500 1100 300 1300 300" stroke="var(--secondary)" strokeWidth="2" strokeDasharray="8 8" className="animate-[dash_20s_linear_infinite]" />
                </svg>
            </div>
            <div className="max-w-[1680px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] mx-auto px-4 text-center mb-10 sm:mb-24 relative z-10">
                <div className="text-[10px] sm:text-[11px] text-secondary font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-3 sm:mb-5">{t('landing.howItWorksHeadline')}</div>
                <h2 className="text-2xl sm:text-5xl md:text-6xl font-bold font-headline mb-4 sm:mb-6 text-primary">{t('landing.howItWorksTitle')}<span className="text-secondary italic">{t('landing.howItWorksTitleHighlight')}</span></h2>
            </div>
            
            <div className="max-w-[1600px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-8 lg:gap-12 relative z-10 px-4">
                {steps.map((step, index) => (
                    <div key={index} className="flex flex-col items-center text-center group relative">
                        <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full border border-secondary/20 bg-surface flex items-center justify-center mb-3 sm:mb-6 relative shadow-xl group-hover:border-secondary group-hover:shadow-secondary/20 transition-all duration-500">
                            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-surface border border-secondary/60 flex items-center justify-center text-secondary font-bold font-mono text-[8px] sm:text-[10px] shadow-md z-20">
                                0{index + 1}
                            </div>
                            <div className="absolute inset-0 rounded-full bg-secondary/0 group-hover:bg-secondary/5 transition-colors duration-500" />
                            <div className="transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 z-10 [&_svg]:w-5 [&_svg]:h-5 sm:[&_svg]:w-8 sm:[&_svg]:h-8">
                                {step.icon}
                            </div>
                        </div>
                        <h3 className="text-sm sm:text-lg font-headline font-bold mb-1 sm:mb-2 text-primary">{step.title}</h3>
                        <span className="text-[8px] sm:text-[10px] font-bold text-secondary/50 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1 sm:mb-3">{step.detail}</span>
                        <p className="text-[10px] sm:text-xs text-on-surface-variant/70 leading-relaxed max-w-[140px] sm:max-w-[180px]">{step.desc}</p>
                    </div>
                ))}
            </div>
        </motion.section>
    );
}
