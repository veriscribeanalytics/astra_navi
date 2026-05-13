'use client';

import React from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { ChevronDown, MessageSquare } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface TrustPoint {
    icon: React.ReactNode;
    title: string;
    desc: string;
    sub: string;
}

interface Faq {
    question: string;
    answer: string;
}

interface Props {
    t: (key: string) => string;
    trustPoints: TrustPoint[];
    translatedFaqs: Faq[];
    openFAQIndex: number | null;
    toggleFAQ: (index: number) => void;
    sectionVariants: Variants;
}

export default function TrustAndFAQSection({ t, trustPoints, translatedFaqs, openFAQIndex, toggleFAQ, sectionVariants }: Props) {
    return (
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants} className="py-10 sm:py-16 lg:py-24 relative bg-transparent px-4 lg:px-12 max-w-[1680px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] mx-auto">
            <div className="text-center mb-10 sm:mb-24">
                <div className="text-[10px] sm:text-[11px] text-secondary font-bold tracking-[0.2em] sm:tracking-[0.25em] uppercase mb-3 sm:mb-5">{t('landing.trustHeadline')}</div>
                <h2 className="text-2xl sm:text-5xl md:text-6xl font-bold font-headline text-primary mb-8 sm:mb-16">{t('landing.trustTitle')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-10 lg:gap-16 max-w-[1400px] 2xl:max-w-[1800px] 3xl:max-w-[2200px] mx-auto">
                    {trustPoints.map((point, idx) => (
                        <Card key={idx} variant="bordered" padding="lg" className="flex flex-col items-center text-center relative overflow-hidden group !rounded-[20px] sm:!rounded-[32px]">
                            <div className="absolute -right-10 -bottom-10 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500 scale-150 rotate-12">
                                {point.icon}
                            </div>
                            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-[16px] sm:rounded-[24px] bg-secondary/5 flex items-center justify-center mb-4 sm:mb-6 border border-secondary/10 group-hover:scale-110 transition-transform duration-500">{point.icon}</div>
                            <h3 className="text-base sm:text-xl font-headline font-bold text-primary mb-2">{point.title}</h3>
                            <span className="text-[9px] sm:text-[10px] font-bold text-secondary uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-3 sm:mb-4">{point.sub}</span>
                            <p className="text-xs sm:text-sm text-on-surface-variant/70 leading-relaxed">{point.desc}</p>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="max-w-[1150px] 2xl:max-w-[1500px] 3xl:max-w-[1800px] mx-auto mt-16 sm:mt-40" id="faq">
                <div className="text-center mb-8 sm:mb-16">
                    <h2 className="text-2xl sm:text-5xl font-bold font-headline mb-3 sm:mb-5 text-primary">{t('landing.faqTitle')}</h2>
                    <p className="text-on-surface-variant/60 text-sm sm:text-lg">{t('landing.faqDesc')}</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-10 sm:mb-20">
                    {translatedFaqs.map((faq, idx) => (
                        <div key={idx} className="border border-outline-variant/30 rounded-[16px] sm:rounded-[32px] bg-surface overflow-hidden hover:border-secondary/30 transition-colors h-fit">
                            <button onClick={() => toggleFAQ(idx)} className="w-full flex justify-between items-center p-3 sm:p-6 text-left group">
                                <span className="font-headline font-semibold text-sm sm:text-lg text-primary group-hover:text-secondary transition-colors pr-3 sm:pr-4">{faq.question}</span>
                                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-secondary transition-transform shrink-0 ${openFAQIndex === idx ? 'rotate-180' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {openFAQIndex === idx && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <div className="pb-4 sm:pb-6 px-3 sm:px-6">
                                            <p className="text-on-surface-variant/80 text-xs sm:text-sm leading-relaxed">{faq.answer}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
                <div className="p-5 sm:p-10 rounded-[24px] sm:rounded-[48px] bg-secondary/5 border border-secondary/20 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
                    <div className="flex items-center gap-3 sm:gap-6">
                        <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-primary flex items-center justify-center text-white"><MessageSquare className="w-5 h-5 sm:w-7 sm:h-7" /></div>
                        <div className="text-center sm:text-left">
                            <h4 className="text-base sm:text-xl font-bold text-primary">{t('landing.stillHaveQuestions')}</h4>
                            <p className="text-xs sm:text-base text-on-surface-variant/60">{t('landing.askAiGuide')}</p>
                        </div>
                    </div>
                    <Button href="/chat" variant="secondary" className="border-secondary/30 text-secondary px-6 sm:px-10 h-10 sm:h-12 text-sm sm:text-base">{t('landing.chatNaviTitle')}</Button>
                </div>
            </div>
        </motion.section>
    );
}
