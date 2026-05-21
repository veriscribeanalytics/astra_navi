'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'motion/react';
import Link from 'next/link';
import { Sparkles, BookOpen, ArrowRight, Heart, MessageSquare } from 'lucide-react';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface PortalsSectionProps {
    t: (key: string) => string;
    sectionVariants: Variants;
}

export default function PortalsSection({ t, sectionVariants }: PortalsSectionProps) {
    const router = useRouter();

    const [teaserMode, setTeaserMode] = useState<{ type: 'kundli' | 'match' | null, active: boolean }>({ type: null, active: false });
    const [formData, setFormData] = useState({ name: '', dob: '', tob: '', pob: '' });
    const [errors, setErrors] = useState({ name: '', dob: '', tob: '', pob: '' });
    const [matchData, setMatchData] = useState({ name1: '', name2: '' });
    const [isCalculating, setIsCalculating] = useState(false);

    const handleGenerateTeaser = (type: 'kundli' | 'match') => {
        setIsCalculating(true);
        setTimeout(() => {
            setIsCalculating(false);
            setTeaserMode({ type, active: true });
        }, 2000);
    };

    const validateField = (field: keyof typeof formData, value: string) => {
        let error = '';
        switch (field) {
            case 'name':
                if (value.trim().length < 2) error = t('home.portals.validation.nameLength');
                else if (!/^[a-zA-Z\s]+$/.test(value)) error = t('home.portals.validation.nameLetters');
                break;
            case 'dob':
                if (value) {
                    const dob = new Date(value);
                    if (dob > new Date()) error = t('home.portals.validation.dobFuture');
                }
                break;
            case 'pob':
                if (value.trim().length < 2) error = t('home.portals.validation.pobInvalid');
                break;
        }
        return error;
    };

    const validateForm = () => {
        const newErrors = {
            name: validateField('name', formData.name),
            dob: validateField('dob', formData.dob),
            tob: '',
            pob: validateField('pob', formData.pob)
        };
        setErrors(newErrors);
        return !Object.values(newErrors).some(error => error !== '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (typeof window !== 'undefined') {
            localStorage.setItem('astranavi_pending_birth_details', JSON.stringify(formData));
        }
        router.push('/chat');
    };

    return (
        <motion.section 
            id="portals"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={sectionVariants}
            className="max-w-[1680px] 2xl:max-w-[2000px] 3xl:max-w-[2400px] mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 lg:py-12 relative"
        >
            {/* Section Headline */}
            <div className="text-center mb-8">
                <div className="text-[10px] text-secondary font-bold tracking-[0.25em] uppercase mb-3">{t('landing.portalsHeadline')}</div>
                <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold text-primary">{t('landing.portalsTitle')}<span className="text-secondary italic">{t('landing.portalsTitleHighlight')}</span></h2>
            </div>

            {/* 4-Column Grid: Chat Navi + 3 Portals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {/* Chat Navi Card */}
                <Link href="/chat" className="group">
                    <Card className="border-outline-variant/30 hover:border-secondary/50 transition-all duration-500 h-[340px] sm:h-[440px] flex flex-col relative overflow-hidden" padding="md">
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 flex flex-col items-center text-center justify-center h-full">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-secondary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform shadow-inner">
                                <MessageSquare className="w-5 h-5 sm:w-7 sm:h-7 text-secondary" />
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('common.onlineNow')}</span>
                            </div>
                            <h3 className="text-lg sm:text-xl font-headline font-bold text-primary mb-2 sm:mb-3">{t('landing.chatNaviTitle')}</h3>
                            <p className="text-xs sm:text-sm text-on-surface-variant/70 leading-relaxed mb-4 sm:mb-6 max-w-[220px]">{t('landing.chatNaviDesc')}</p>
                            <div className="flex items-center text-[11px] font-bold text-secondary uppercase tracking-widest gap-2 group-hover:translate-x-1 transition-transform bg-secondary/5 px-4 py-2 rounded-full border border-secondary/10">
                                {t('landing.chatNaviCta')} <ArrowRight className="w-3.5 h-3.5" />
                            </div>
                        </div>
                    </Card>
                </Link>

                {/* Horoscope Portal */}
                <Card className="border-outline-variant/30 flex flex-col h-[340px] sm:h-full items-center text-center justify-center" padding="md">
                    <div className="flex flex-col items-center justify-center w-full">
                        <Sparkles className="text-secondary w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4 animate-pulse" />
                        <h3 className="text-base sm:text-xl font-headline font-bold text-primary mb-1 uppercase tracking-wider sm:tracking-widest">{t('landing.forecastTitle')}</h3>
                        <span className="text-[8px] font-bold text-secondary px-2 py-0.5 bg-secondary/10 rounded-full border border-secondary/20 mb-6">{t('landing.liveTransit')}</span>
                        
                        <div className="w-full space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                            <div className="flex justify-between items-center bg-secondary/5 p-2.5 sm:p-3 rounded-xl border border-secondary/10">
                                <div className="text-left">
                                    <div className="text-[8px] font-bold text-secondary uppercase tracking-[0.2em]">{t('landing.moonSign')}</div>
                                    <div className="text-base font-bold text-primary">Pisces</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[8px] font-bold text-on-surface-variant/40 uppercase">{t('landing.nakshatra')}</div>
                                    <div className="text-[10px] font-bold text-primary">Revati</div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Energy', val: 85, color: 'bg-amber-400' },
                                    { label: 'Luck', val: 62, color: 'bg-emerald-400' },
                                ].map((s, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                                            <span>{s.label}</span><span>{s.val}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-surface-variant/20 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} whileInView={{ width: `${s.val}%` }} transition={{ duration: 1, delay: i*0.1 }} className={`h-full ${s.color} rounded-full`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <Button href="/login" variant="secondary" size="sm" className="w-full text-[10px] font-bold text-secondary hover:text-secondary/80 flex items-center justify-center gap-1 h-10 border-secondary/20">
                            {t('landing.unlockFullPredictions')} <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </Card>

                {/* Kundli Form Portal */}
                <Card className="border-secondary/30 flex flex-col h-[340px] sm:h-full relative overflow-hidden" padding="md">
                    <AnimatePresence mode="wait">
                        {isCalculating && teaserMode.type === 'kundli' ? (
                            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full space-y-3">
                                <div className="w-10 h-10 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                                <p className="text-[10px] font-bold text-secondary animate-pulse uppercase tracking-widest">{t('landing.mappingDestiny')}</p>
                            </motion.div>
                        ) : teaserMode.type === 'kundli' ? (
                            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center text-center justify-center">
                                <span className="text-[7px] font-bold bg-secondary/20 text-secondary px-1.5 py-0.5 rounded tracking-tighter uppercase mb-2">{t('landing.samplePreview')}</span>
                                <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/20 mb-4 w-full">
                                    <div className="text-[8px] font-bold text-secondary uppercase mb-1">{t('landing.activeMahadasha')}</div>
                                    <div className="text-base font-bold text-primary">Jupiter <span className="text-[10px] font-normal text-on-surface-variant/60">- Saturn</span></div>
                                </div>
                                <Button href="/login" size="sm" variant="primary" className="text-xs w-full h-10 mb-2">{t('landing.unlockFullKundli')}</Button>
                                <button onClick={() => setTeaserMode({type:null, active:false})} className="text-[10px] text-on-surface-variant/40 hover:text-secondary transition-colors">{t('landing.backToForm')}</button>
                            </motion.div>
                        ) : (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center text-center justify-center">
                                <BookOpen className="text-secondary w-8 h-8 sm:w-10 sm:h-10 mb-3 sm:mb-4" />
                                <h3 className="text-base sm:text-xl font-headline font-bold text-primary mb-1 sm:mb-2">{t('landing.janamKundliTitle')}</h3>
                                <p className="text-xs sm:text-sm text-on-surface-variant/70 mb-4 sm:mb-6">{t('landing.janamKundliDesc')}</p>
                                <form onSubmit={handleSubmit} className="space-y-2 w-full">
                                    <Input placeholder={t('home.portals.placeholders.fullName')} value={formData.name} onChange={(e) => { setFormData({...formData, name: e.target.value}); setErrors({...errors, name: validateField('name', e.target.value)}); }} required className="h-9 text-xs" />
                                    {errors.name && <p className="text-[10px] text-red-400 text-left">{errors.name}</p>}
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="date" value={formData.dob} onChange={(e) => { setFormData({...formData, dob: e.target.value}); setErrors({...errors, dob: validateField('dob', e.target.value)}); }} required className="h-9 text-xs" />
                                        <Input type="time" value={formData.tob} onChange={(e) => setFormData({...formData, tob: e.target.value})} required className="h-9 text-xs" />
                                    </div>
                                    {errors.dob && <p className="text-[10px] text-red-400 text-left">{errors.dob}</p>}
                                    <Input placeholder={t('home.portals.placeholders.pob')} value={formData.pob} onChange={(e) => { setFormData({...formData, pob: e.target.value}); setErrors({...errors, pob: validateField('pob', e.target.value)}); }} required className="h-9 text-xs" />
                                    {errors.pob && <p className="text-[10px] text-red-400 text-left">{errors.pob}</p>}
                                    <Button type="submit" fullWidth size="sm" className="h-9 text-xs mt-2">{t('landing.calculateKundli')}</Button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>

                {/* Compatibility Portal */}
                <Card className="border-outline-variant/30 flex flex-col h-[340px] sm:h-full relative overflow-hidden" padding="md">
                    <AnimatePresence mode="wait">
                        {isCalculating && teaserMode.type === 'match' ? (
                            <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full space-y-3">
                                <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" />
                                <p className="text-[10px] font-bold text-rose-500 animate-pulse uppercase tracking-widest">{t('landing.scanningSync')}</p>
                            </motion.div>
                        ) : teaserMode.type === 'match' ? (
                            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-full border-4 border-rose-500 flex items-center justify-center mb-3">
                                    <div>
                                        <div className="text-xl font-bold text-primary">28<span className="text-[10px] text-on-surface-variant/40">/36</span></div>
                                        <div className="text-[8px] font-bold text-rose-500 uppercase">Gunas</div>
                                    </div>
                                </div>
                                <h3 className="text-sm font-headline font-bold text-primary mb-1">{t('landing.highMatch')}</h3>
                                <Button href="/login" size="sm" className="gold-gradient w-full h-9 text-xs mt-3">{t('landing.unlockReport')}</Button>
                                <button onClick={() => setTeaserMode({type:null, active:false})} className="text-[9px] text-on-surface-variant/40 mt-2 hover:text-rose-500">{t('common.back')}</button>
                            </motion.div>
                        ) : (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center text-center justify-center">
                                <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500 mb-3 sm:mb-4 animate-pulse" />
                                <h3 className="text-base sm:text-xl font-headline font-bold text-primary mb-1 sm:mb-2">{t('landing.soulmateSyncTitle')}</h3>
                                <p className="text-xs sm:text-sm text-on-surface-variant/70 mb-4 sm:mb-6">{t('landing.soulmateSyncDesc')}</p>
                                <div className="w-full space-y-2 mb-3">
                                    <Input placeholder={t('home.portals.placeholders.yourName')} value={matchData.name1} onChange={(e) => setMatchData({...matchData, name1: e.target.value})} className="h-9 text-xs" />
                                    <Input placeholder={t('home.portals.placeholders.partnerName')} value={matchData.name2} onChange={(e) => setMatchData({...matchData, name2: e.target.value})} className="h-9 text-xs" />
                                </div>
                                <Button onClick={() => handleGenerateTeaser('match')} variant="secondary" size="sm" className="border-rose-500/30 hover:bg-rose-500/10 text-rose-600 w-full h-9 text-xs">
                                    {t('landing.checkMatch')}
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>
        </motion.section>
    );
}
