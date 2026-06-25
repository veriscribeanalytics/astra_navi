'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
    Sparkles,
    ArrowRight,
    MessageSquare,
    Compass,
    CalendarDays,
    ShieldCheck,
    Lock,
    Languages,
    Calculator,
    Brain,
    Scale,
    ArrowDown,
    Quote,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import LandingImage from '@/components/home/LandingImage';
import { LogoLoop } from '@/components/ui/LogoLoop';
import { languages } from '@/locales';
import { useTranslation } from '@/hooks';

interface GuideDetails {
    nameKey: string;
    roleKey: string;
    descKey: string;
    image: string;
}

const GUIDES: GuideDetails[] = [
    { nameKey: 'about.guideNaviName', roleKey: 'about.guideNaviRole', descKey: 'about.guideNaviDesc', image: '/images/avatars/NAVI_AVATAR.jpeg' },
    { nameKey: 'about.guideAryaName', roleKey: 'about.guideAryaRole', descKey: 'about.guideAryaDesc', image: '/images/avatars/ARYA_AVATAR.jpeg' },
    { nameKey: 'about.guideMeeraName', roleKey: 'about.guideMeeraRole', descKey: 'about.guideMeeraDesc', image: '/images/avatars/MEERA_AVATAR.jpeg' },
    { nameKey: 'about.guideAnandName', roleKey: 'about.guideAnandRole', descKey: 'about.guideAnandDesc', image: '/images/avatars/ANAND_AVATAR.jpeg' },
    { nameKey: 'about.guideVidyaName', roleKey: 'about.guideVidyaRole', descKey: 'about.guideVidyaDesc', image: '/images/avatars/VIDYA_AVATAR.jpeg' },
    { nameKey: 'about.guideRishiName', roleKey: 'about.guideRishiRole', descKey: 'about.guideRishiDesc', image: '/images/avatars/RISHI_AVATAR.jpeg' },
];

interface ExploreCategory {
    titleKey: string;
    image: string;
    placeholder: string;
    icon: 'kundli' | 'forecast' | 'dashboard' | 'chat';
    items: string[];
}

const EXPLORE: ExploreCategory[] = [
    {
        titleKey: 'about.exploreCat1Title',
        image: '/images/kundli-desktop.png',
        placeholder: 'Kundli & Birth Chart',
        icon: 'kundli',
        items: [
            'about.exploreCat1Item1',
            'about.exploreCat1Item2',
            'about.exploreCat1Item3',
            'about.exploreCat1Item4',
        ],
    },
    {
        titleKey: 'about.exploreCat2Title',
        image: '/images/forecast-desktop.png',
        placeholder: 'Forecasts & Timings',
        icon: 'forecast',
        items: [
            'about.exploreCat2Item1',
            'about.exploreCat2Item2',
            'about.exploreCat2Item3',
            'about.exploreCat2Item4',
        ],
    },
    {
        titleKey: 'about.exploreCat3Title',
        image: '/images/dashboard-desktop.png',
        placeholder: 'Compatibility',
        icon: 'dashboard',
        items: [
            'about.exploreCat3Item1',
            'about.exploreCat3Item2',
            'about.exploreCat3Item3',
            'about.exploreCat3Item4',
        ],
    },
    {
        titleKey: 'about.exploreCat4Title',
        image: '/images/dashboard-mobile.png',
        placeholder: 'Ask Navi',
        icon: 'chat',
        items: [
            'about.exploreCat4Item1',
            'about.exploreCat4Item2',
            'about.exploreCat4Item3',
        ],
    },
];

const STEPS = [
    { num: '01', titleKey: 'about.howStep1Title', descKey: 'about.howStep1Desc' },
    { num: '02', titleKey: 'about.howStep2Title', descKey: 'about.howStep2Desc' },
    { num: '03', titleKey: 'about.howStep3Title', descKey: 'about.howStep3Desc' },
];

const FLOW = [
    'about.howFlow1',
    'about.howFlow2',
    'about.howFlow3',
    'about.howFlow4',
];

const PROBLEMS = [
    'about.whyProblem1',
    'about.whyProblem2',
    'about.whyProblem3',
    'about.whyProblem4',
];

const PRINCIPLES = [
    { icon: Compass, titleKey: 'about.principle1Title', descKey: 'about.principle1Desc' },
    { icon: Brain, titleKey: 'about.principle2Title', descKey: 'about.principle2Desc' },
    { icon: Lock, titleKey: 'about.principle3Title', descKey: 'about.principle3Desc' },
    { icon: Languages, titleKey: 'about.principle4Title', descKey: 'about.principle4Desc' },
];

const TRUST = [
    { icon: Calculator, titleKey: 'about.trust1Title', descKey: 'about.trust1Desc' },
    { icon: ShieldCheck, titleKey: 'about.trust2Title', descKey: 'about.trust2Desc' },
    { icon: Scale, titleKey: 'about.trust3Title', descKey: 'about.trust3Desc' },
];

const TRUST_TECH = [
    'about.trustTech1',
    'about.trustTech2',
    'about.trustTech3',
    'about.trustTech4',
];

const fadeUp = {
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.6, ease: 'easeOut' as const },
};

/* ───────────────────────── Kundli wheel (North-Indian style) ───────────────────────── */
function KundliWheel({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden="true">
            <rect x="10" y="10" width="180" height="180" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
            <line x1="10" y1="10" x2="190" y2="190" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <line x1="190" y1="10" x2="10" y2="190" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <line x1="100" y1="10" x2="100" y2="190" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <line x1="10" y1="100" x2="190" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.4" />
            <rect x="55" y="55" width="90" height="90" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            {/* house glyphs */}
            {[
                [100, 28], [158, 56], [158, 100], [158, 144], [100, 172],
                [42, 144], [42, 100], [42, 56], [100, 72], [128, 100],
                [100, 128], [72, 100],
            ].map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="2.4" fill="currentColor" opacity="0.7" />
            ))}
        </svg>
    );
}

/* ───────────────────────── Hero composite visual ───────────────────────── */
function HeroComposite() {
    const reduce = useReducedMotion();
    const orbit = reduce ? {} : { animate: { rotate: 360 }, transition: { duration: 90, repeat: Infinity, ease: 'linear' as const } };

    return (
        <div className="relative w-full aspect-square max-w-[440px] sm:max-w-[480px] mx-auto">
            {/* ambient glow */}
            <div className="absolute inset-[8%] rounded-full bg-[var(--glow-color)] blur-[70px] pointer-events-none" />
            <div className="absolute inset-[18%] rounded-full bg-accent/10 blur-[80px] pointer-events-none" />

            {/* planetary orbit rings */}
            <motion.div {...orbit} className="absolute inset-0 text-secondary/40">
                <svg viewBox="0 0 200 200" className="w-full h-full" fill="none" aria-hidden="true">
                    <circle cx="100" cy="100" r="96" stroke="currentColor" strokeWidth="0.6" opacity="0.5" />
                    <circle cx="100" cy="100" r="78" stroke="currentColor" strokeWidth="0.5" opacity="0.35" strokeDasharray="2 4" />
                    {/* planets on the outer ring */}
                    <circle cx="100" cy="4" r="3" fill="#C9972E" />
                    <circle cx="184" cy="128" r="2.4" fill="#a78bd2" />
                    <circle cx="40" cy="166" r="2" fill="#ece8f2" opacity="0.7" />
                    <circle cx="22" cy="74" r="1.8" fill="#C9972E" opacity="0.8" />
                </svg>
            </motion.div>

            {/* central kundli chart */}
            <div className="absolute inset-[24%] text-secondary/70">
                <KundliWheel className="w-full h-full drop-shadow-[0_0_18px_rgba(201,151,46,0.18)]" />
            </div>

            {/* daily insight card — top right */}
            <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="absolute -right-1 sm:-right-3 top-[6%] w-[44%] rounded-2xl border border-white/10 bg-surface/85 backdrop-blur-md p-2.5 sm:p-3 shadow-2xl"
            >
                <div className="flex items-center gap-1.5 mb-1.5">
                    <CalendarDays className="w-3 h-3 text-secondary" />
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-secondary">Daily Insight</span>
                </div>
                <div className="h-1.5 w-2/3 rounded-full bg-primary/25 mb-1" />
                <div className="h-1.5 w-full rounded-full bg-primary/15" />
                <div className="mt-2 flex items-center justify-between">
                    <span className="text-[7px] sm:text-[8px] text-on-surface-variant/60">Favourable</span>
                    <span className="text-[8px] sm:text-[9px] font-bold text-secondary">10:00–11:30</span>
                </div>
            </motion.div>

            {/* AI conversation card — bottom left */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="absolute -left-1 sm:-left-3 bottom-[8%] w-[52%] rounded-2xl border border-white/10 bg-surface/85 backdrop-blur-md p-2.5 sm:p-3 shadow-2xl"
            >
                <div className="flex items-center gap-1.5 mb-1.5">
                    <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-secondary" />
                    </div>
                    <span className="text-[8px] sm:text-[9px] font-bold text-primary">Ask Navi</span>
                    <span className="ml-auto text-[6px] sm:text-[7px] font-bold uppercase bg-secondary/15 text-secondary px-1 py-0.5 rounded">AI</span>
                </div>
                <div className="space-y-1">
                    <p className="text-[7px] sm:text-[8px] text-on-surface-variant/60 leading-tight">When should I begin my new venture?</p>
                    <p className="text-[7px] sm:text-[8px] text-primary/90 leading-tight bg-secondary/5 border border-secondary/10 rounded-lg p-1.5">
                        Your Jupiter Dasha favours initiative this week.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

/* ───────────────────────── Section heading helper ───────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/10 border border-secondary/30 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-secondary" />
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-secondary font-body">
                {children}
            </span>
        </span>
    );
}

/* ───────────────────────── Page ───────────────────────── */
const AboutPageContent = () => {
    const { t } = useTranslation();
    const reduceMotion = useReducedMotion();

    return (
        <div className="min-h-screen pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-24 flex flex-col relative z-10 px-4 sm:px-6 lg:px-8 max-w-[1760px] 2xl:max-w-[2100px] 3xl:max-w-[2400px] mx-auto scale-content">

            {/* ───────── 1. HERO ───────── */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center w-full max-w-7xl mx-auto pb-8 lg:pb-0">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left"
                >
                    <SectionLabel>{t('about.heroLabel')}</SectionLabel>
                    <h1 className="font-headline font-bold text-primary leading-[1.1] mb-5 text-4xl sm:text-5xl lg:text-[3.4rem] tracking-tight">
                        {t('about.heroTitle')}
                    </h1>
                    <p className="text-sm sm:text-base md:text-lg text-on-surface-variant/80 max-w-xl leading-relaxed font-body mb-8">
                        {t('about.heroDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <Button
                            href="/kundli"
                            size="lg"
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                            className="gold-gradient shadow-xl px-8 w-full sm:w-auto"
                        >
                            {t('about.heroPrimaryCta')}
                        </Button>
                        <Button
                            href="/chat"
                            variant="secondary"
                            size="lg"
                            leftIcon={<MessageSquare className="w-4 h-4 text-secondary" />}
                            className="px-8 w-full sm:w-auto border-outline-variant/40 text-primary hover:border-secondary/50"
                        >
                            {t('about.heroSecondaryCta')}
                        </Button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
                    className="lg:col-span-6 w-full"
                >
                    <HeroComposite />
                </motion.div>
            </section>

            {/* ───────── 2. WHY ASTRANAVI EXISTS ───────── */}
            <motion.section {...fadeUp} className="w-full max-w-5xl mx-auto pt-16 sm:pt-24">
                <div className="grid md:grid-cols-12 gap-8 lg:gap-14 items-center">
                    <div className="md:col-span-8 space-y-5">
                        <h2 className="font-headline font-bold text-primary text-2xl sm:text-3xl md:text-4xl leading-tight">
                            {t('about.whyTitle')}
                        </h2>
                        <ul className="space-y-3">
                            {PROBLEMS.map((key) => (
                                <li key={key} className="flex items-start gap-3 text-sm sm:text-base text-on-surface-variant/80 leading-relaxed">
                                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-secondary/70 shrink-0" />
                                    {t(key)}
                                </li>
                            ))}
                        </ul>
                        <blockquote className="relative pl-5 border-l-2 border-secondary/40 text-base sm:text-lg text-primary/90 font-headline italic leading-relaxed">
                            {t('about.whyPurpose')}
                        </blockquote>
                    </div>
                    <div className="md:col-span-4 flex justify-center">
                        <div className="relative w-full max-w-[220px] aspect-square text-secondary/50">
                            <div className="absolute inset-0 rounded-full bg-[var(--glow-color)] blur-[50px] opacity-70" />
                            <KundliWheel className="relative w-full h-full" />
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* ───────── 3. HOW IT WORKS ───────── */}
            <motion.section {...fadeUp} className="w-full max-w-7xl mx-auto pt-20 sm:pt-28">
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <div className="flex justify-center"><SectionLabel>{t('about.howLabel')}</SectionLabel></div>
                    <h2 className="font-headline font-bold text-primary text-3xl sm:text-4xl md:text-5xl leading-tight">
                        {t('about.howTitle')}
                    </h2>
                </div>

                {/* three-step flow */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {STEPS.map((step) => (
                        <div
                            key={step.num}
                            className="relative flex flex-col rounded-3xl border border-outline-variant/30 bg-surface-variant/10 p-6 sm:p-8"
                        >
                            <span className="font-headline text-4xl sm:text-5xl font-bold text-secondary/25 mb-4">{step.num}</span>
                            <h3 className="font-headline font-bold text-primary text-lg sm:text-xl mb-2">{t(step.titleKey)}</h3>
                            <p className="text-sm text-on-surface-variant/75 leading-relaxed">{t(step.descKey)}</p>
                        </div>
                    ))}
                </div>

                {/* vertical pipeline */}
                <div className="mt-12 sm:mt-16 mx-auto max-w-md flex flex-col items-center gap-1">
                    {FLOW.map((key, i) => (
                        <React.Fragment key={key}>
                            <div className="w-full rounded-xl border border-outline-variant/30 bg-surface/60 px-5 py-3 text-center">
                                <span className="text-sm sm:text-base font-body text-primary font-medium">{t(key)}</span>
                            </div>
                            {i < FLOW.length - 1 && (
                                <ArrowDown className="w-4 h-4 text-secondary/60 my-0.5" />
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </motion.section>

            {/* ───────── 4. WHAT USERS CAN UNDERSTAND ───────── */}
            <motion.section {...fadeUp} className="w-full max-w-7xl mx-auto pt-20 sm:pt-28">
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <h2 className="font-headline font-bold text-primary text-3xl sm:text-4xl md:text-5xl leading-tight">
                        {t('about.exploreTitle')}
                    </h2>
                    <p className="text-sm sm:text-base text-on-surface-variant/75 mt-4">{t('about.exploreIntro')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                    {EXPLORE.map((cat) => (
                        <div
                            key={cat.titleKey}
                            className="group rounded-3xl border border-outline-variant/30 bg-surface-variant/10 overflow-hidden flex flex-col"
                        >
                            <div className="relative aspect-[16/9] bg-[#070514] overflow-hidden border-b border-outline-variant/20">
                                <LandingImage
                                    src={cat.image}
                                    alt={t(cat.titleKey)}
                                    placeholderName={cat.placeholder}
                                    aspectRatio="aspect-[16/9]"
                                    type="desktop"
                                    icon={cat.icon}
                                    className="!rounded-none"
                                />
                            </div>
                            <div className="p-6 sm:p-8 flex flex-col flex-grow">
                                <h3 className="font-headline font-bold text-primary text-xl sm:text-2xl mb-4">{t(cat.titleKey)}</h3>
                                <ul className="space-y-2.5">
                                    {cat.items.map((key) => (
                                        <li key={key} className="flex items-start gap-3 text-sm sm:text-base text-on-surface-variant/80 leading-relaxed">
                                            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-secondary/60 shrink-0" />
                                            {t(key)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* ───────── 5. MEET THE GUIDES ───────── */}
            <motion.section {...fadeUp} className="w-full max-w-7xl mx-auto pt-20 sm:pt-28">
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <h2 className="font-headline font-bold text-primary text-3xl sm:text-4xl md:text-5xl leading-tight">
                        {t('about.guidesTitle')}
                    </h2>
                    <p className="text-sm sm:text-base text-on-surface-variant/75 mt-4">{t('about.guidesIntro')}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
                    {GUIDES.map((guide) => (
                        <div
                            key={guide.nameKey}
                            className="flex flex-col items-center text-center rounded-3xl border border-outline-variant/30 bg-surface-variant/10 p-5 hover:border-secondary/40 transition-colors"
                        >
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-secondary/30 mb-4 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={guide.image} alt={t(guide.nameKey)} className="w-full h-full object-cover" />
                            </div>
                            <span className="inline-block text-[9px] font-bold uppercase tracking-[0.15em] text-secondary bg-secondary/10 px-2 py-0.5 rounded-full mb-2">
                                {t('about.guidesAiLabel')}
                            </span>
                            <h3 className="font-headline font-bold text-primary text-base sm:text-lg leading-tight">{t(guide.nameKey)}</h3>
                            <p className="text-secondary text-[11px] sm:text-xs font-bold uppercase tracking-wider mt-1">{t(guide.roleKey)}</p>
                            <p className="text-on-surface-variant/70 text-xs leading-relaxed mt-2 mb-4 flex-grow">{t(guide.descKey)}</p>
                            <Button href="/chat" size="sm" variant="secondary" className="w-full border-secondary/25 text-primary hover:border-secondary/50">
                                {t('about.guidesAsk')}
                            </Button>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* ───────── 6. PRODUCT PRINCIPLES ───────── */}
            <motion.section {...fadeUp} className="w-full max-w-6xl mx-auto pt-20 sm:pt-28">
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <h2 className="font-headline font-bold text-primary text-3xl sm:text-4xl md:text-5xl leading-tight">
                        {t('about.principlesTitle')}
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                    {PRINCIPLES.map((p) => {
                        const Icon = p.icon;
                        return (
                            <div key={p.titleKey} className="rounded-3xl border border-outline-variant/30 bg-surface-variant/10 p-6 sm:p-8">
                                <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary mb-5">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <h3 className="font-headline font-bold text-primary text-lg sm:text-xl mb-2">{t(p.titleKey)}</h3>
                                <p className="text-sm text-on-surface-variant/75 leading-relaxed">{t(p.descKey)}</p>
                            </div>
                        );
                    })}
                </div>

                {/* language marquee */}
                <div className="mt-12 sm:mt-16 rounded-2xl border border-outline-variant/20 bg-surface/40 py-4 overflow-hidden">
                    <div className="flex items-center gap-3 px-5 mb-3">
                        <Languages className="w-4 h-4 text-secondary" />
                        <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] font-bold text-secondary font-body">
                            {t('about.principleLangLabel')}
                        </span>
                    </div>
                    <LogoLoop
                        logos={languages.map((l) => ({
                            node: (
                                <span className="text-sm sm:text-base font-headline text-foreground/45 hover:text-secondary transition-colors whitespace-nowrap">
                                    {l.nativeName}
                                </span>
                            ),
                            title: l.name,
                        }))}
                        speed={28}
                        direction="left"
                        logoHeight={28}
                        gap={48}
                        fadeOut
                        fadeOutColor="var(--surface)"
                        ariaLabel={t('about.principleLangLabel')}
                    />
                    <p className="text-center text-xs text-on-surface-variant/50 mt-3 px-5">{t('about.principleLangNote')}</p>
                </div>
            </motion.section>

            {/* ───────── 7. TRUST AND TRANSPARENCY ───────── */}
            <motion.section {...fadeUp} className="w-full max-w-6xl mx-auto pt-20 sm:pt-28">
                <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                    <h2 className="font-headline font-bold text-primary text-3xl sm:text-4xl md:text-5xl leading-tight">
                        {t('about.trustTitle')}
                    </h2>
                </div>

                <div className="flex flex-col gap-5">
                    {TRUST.map((block, i) => {
                        const Icon = block.icon;
                        return (
                            <div
                                key={block.titleKey}
                                className="grid sm:grid-cols-12 gap-5 sm:gap-8 items-start rounded-3xl border border-outline-variant/30 bg-surface-variant/10 p-6 sm:p-8"
                            >
                                <div className="sm:col-span-1 flex sm:block items-center gap-4">
                                    <div className="w-11 h-11 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                </div>
                                <div className="sm:col-span-11 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="font-headline text-sm font-bold text-secondary/40">0{i + 1}</span>
                                        <h3 className="font-headline font-bold text-primary text-lg sm:text-xl">{t(block.titleKey)}</h3>
                                    </div>
                                    <p className="text-sm text-on-surface-variant/75 leading-relaxed max-w-3xl">{t(block.descKey)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* technical trust row */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TRUST_TECH.map((key) => (
                        <div key={key} className="flex items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface/40 px-4 py-3">
                            <ShieldCheck className="w-4 h-4 text-secondary/80 shrink-0" />
                            <span className="text-xs sm:text-sm text-on-surface-variant/75 leading-tight">{t(key)}</span>
                        </div>
                    ))}
                </div>
            </motion.section>

            {/* ───────── 8. PRODUCT VISION ───────── */}
            <motion.section {...fadeUp} className="w-full max-w-4xl mx-auto pt-20 sm:pt-28 text-center">
                <div className="flex justify-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
                        <Quote className="w-6 h-6 text-secondary" />
                    </div>
                </div>
                <h2 className="font-headline font-bold text-primary text-3xl sm:text-4xl md:text-5xl leading-tight mb-6">
                    {t('about.visionTitle')}
                </h2>
                <p className="text-base sm:text-lg text-on-surface-variant/80 leading-relaxed font-body">
                    {t('about.visionDesc')}
                </p>
            </motion.section>

            {/* ───────── 9. FINAL CTA ───────── */}
            <motion.section {...fadeUp} className="w-full max-w-5xl mx-auto pt-20 sm:pt-28">
                <div className="relative rounded-[32px] sm:rounded-[48px] overflow-hidden border border-secondary/20 bg-surface-variant/10 text-center px-6 sm:px-12 py-16 sm:py-20">
                    <motion.div
                        initial={{ opacity: 0.1, scale: 0.9 }}
                        animate={reduceMotion ? {} : { opacity: [0.15, 0.3, 0.15], scale: [1, 1.12, 1] }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[440px] bg-secondary/15 blur-[120px] rounded-full pointer-events-none -z-10"
                    />
                    <h2 className="font-headline font-bold text-primary text-3xl sm:text-4xl md:text-5xl mb-5 leading-[1.1]">
                        {t('about.finalTitle')}
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-on-surface-variant/75 mb-9 max-w-xl mx-auto font-body">
                        {t('about.finalDesc')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto relative z-10">
                        <Button
                            href="/kundli"
                            size="lg"
                            rightIcon={<ArrowRight className="w-4 h-4" />}
                            className="gold-gradient shadow-2xl px-8 w-full sm:w-auto"
                        >
                            {t('about.finalPrimaryCta')}
                        </Button>
                        <Button
                            href="/chat"
                            variant="secondary"
                            size="lg"
                            leftIcon={<MessageSquare className="w-4 h-4 text-secondary" />}
                            className="px-8 w-full sm:w-auto border-outline-variant/40 text-primary hover:border-secondary/45"
                        >
                            {t('about.finalSecondaryCta')}
                        </Button>
                    </div>
                </div>
                <p className="text-center text-xs text-on-surface-variant/45 mt-8 font-body">
                    {t('about.finalFooterNote')}
                </p>
            </motion.section>
        </div>
    );
};

export default function AboutPage() {
    return <AboutPageContent />;
}
