'use client';

import React from 'react';
import { motion, Variants } from 'motion/react';
import Link from 'next/link';
import { Gem, ArrowRight, BookOpen } from 'lucide-react';

interface Service {
    icon: React.ReactNode;
    title: string;
    desc: string;
    iconBg: string;
    available?: boolean;
    detail: string;
}

interface KnowledgeArea {
    title: string;
    desc: string;
    icon: React.ReactNode;
    link: string;
    count: string;
    detail: string;
}

interface Props {
    t: (key: string) => string;
    services: Service[];
    knowledgeAreas: KnowledgeArea[];
    sectionVariants: Variants;
}

export default function KnowledgeSection({ t, services, knowledgeAreas, sectionVariants }: Props) {
    return (
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="max-w-[1680px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 lg:gap-16">
                {/* LEFT: Ancient Wisdom */}
                <div className="flex flex-col">
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 mb-3">
                            <Gem className="w-3 h-3 text-indigo-400" />
                            <span className="text-[10px] font-bold tracking-[0.25em] text-indigo-400 uppercase">{t('landing.toolkitHeadline')}</span>
                        </div>
                        <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary">{t('landing.toolkitTitle')}<span className="text-secondary italic">{t('landing.toolkitTitleHighlight')}</span></h2>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 border border-outline-variant/30 rounded-[20px] sm:rounded-[32px] overflow-hidden bg-surface divide-x divide-y divide-outline-variant/20">
                        {services.map((svc, idx) => (
                            <Link key={idx} href="/chat" className="group p-3 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-secondary/[0.02] transition-colors relative h-full min-h-[160px] sm:min-h-[220px]">
                                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-[14px] sm:rounded-[20px] flex items-center justify-center ${svc.iconBg} mb-3 sm:mb-5 shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>
                                    {svc.icon}
                                </div>
                                <h3 className="text-base sm:text-xl font-headline font-bold text-primary mb-1 group-hover:text-secondary transition-colors">{svc.title}</h3>
                                <span className="text-[9px] sm:text-[11px] font-bold text-secondary/60 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">{svc.detail}</span>
                                <p className="text-xs sm:text-base text-on-surface-variant/80 leading-relaxed max-w-[90%] mx-auto">{svc.desc}</p>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-5 h-5 text-secondary" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Cosmic Archive */}
                <div className="flex flex-col">
                    <div className="mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10 mb-3">
                            <BookOpen className="w-3 h-3 text-emerald-500" />
                            <span className="text-[10px] font-bold tracking-[0.25em] text-emerald-500 uppercase">{t('landing.archiveHeadline')}</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <h2 className="font-headline text-2xl sm:text-4xl font-bold text-primary">{t('landing.archiveTitle')}<span className="text-secondary italic">{t('landing.archiveTitleHighlight')}</span></h2>
                            <Link href="/blogs" className="text-[11px] font-bold text-secondary uppercase tracking-[0.15em] flex items-center gap-1.5 hover:translate-x-1 transition-transform mb-1">
                                {t('landing.fullArchive')} <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 border border-outline-variant/30 rounded-[20px] sm:rounded-[32px] overflow-hidden bg-surface divide-x divide-y divide-outline-variant/20">
                        {knowledgeAreas.map((area, idx) => (
                            <Link key={idx} href={area.link} className="group p-3 sm:p-5 flex flex-col items-center justify-center text-center hover:bg-emerald-500/[0.02] transition-colors relative h-full min-h-[160px] sm:min-h-[220px]">
                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-[14px] sm:rounded-[20px] bg-surface-variant/30 flex items-center justify-center mb-3 sm:mb-5 shrink-0 group-hover:scale-110 transition-transform">
                                    {area.icon}
                                </div>
                                <h4 className="text-base sm:text-xl font-headline font-bold text-primary mb-1 group-hover:text-emerald-500 transition-colors">{area.title}</h4>
                                <span className="text-[9px] sm:text-[11px] font-bold text-emerald-500/60 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3">{area.detail}</span>
                                <p className="text-xs sm:text-base text-on-surface-variant/80 leading-relaxed max-w-[90%] mx-auto">{area.desc}</p>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-5 h-5 text-emerald-500" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
