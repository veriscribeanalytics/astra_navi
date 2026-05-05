'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import { Calculator, Brain, Lock } from 'lucide-react';
import { useTranslation } from '@/hooks';

const AboutPageContent = () => {
    const { t } = useTranslation();
    
    return (
        <div className="min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-20 flex flex-col relative z-10 px-4 sm:px-6 max-w-6xl 2xl:max-w-[1600px] 3xl:max-w-[2000px] mx-auto space-y-12 sm:space-y-24 scale-content">
            
            {/* Hero Section */}
            <section className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6">
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-secondary uppercase bg-secondary/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full inline-block mb-2 sm:mb-4">
                    {t('about.theTradition')}
                </span>
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-bold text-primary leading-tight">
                    {t('about.scienceTitle')}
                </h1>
                <p className="text-base sm:text-xl text-primary/70 leading-relaxed max-w-2xl mx-auto pt-2 sm:pt-4">
                    {t('about.traditionDesc')}
                </p>
            </section>

            {/* Two Column Story */}
            <section className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
                <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-headline font-bold text-primary">{t('about.moreThanSigns')}</h2>
                    <p className="text-sm sm:text-lg text-primary/70 leading-relaxed">
                        {t('about.signsDesc1')}
                    </p>
                    <p className="text-sm sm:text-lg text-primary/70 leading-relaxed">
                        {t('about.signsDesc2')}
                    </p>
                </div>
                
                {/* Visual Data Representation */}
                <Card variant="bordered" padding="lg" hoverable={false} className="border-outline-variant/30 h-full flex flex-col justify-center gap-4 sm:gap-6 relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
                    <div className="space-y-2">
                        <h4 className="font-headline font-bold text-secondary text-base sm:text-lg">{t('about.whatNaviKnows')}</h4>
                        <div className="flex gap-3 sm:gap-4 items-center">
                            <span className="text-2xl sm:text-3xl text-primary">☸</span>
                            <p className="text-primary/80 text-xs sm:text-sm">{t('about.naviKnows1')}</p>
                        </div>
                        <div className="flex gap-3 sm:gap-4 items-center mt-2 sm:mt-3">
                            <span className="text-2xl sm:text-3xl text-primary">☽</span>
                            <p className="text-primary/80 text-xs sm:text-sm">{t('about.naviKnows2')}</p>
                        </div>
                        <div className="flex gap-3 sm:gap-4 items-center mt-2 sm:mt-3">
                            <span className="text-2xl sm:text-3xl text-primary">✦</span>
                            <p className="text-primary/80 text-xs sm:text-sm">{t('about.naviKnows3')}</p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Core Values */}
            <section className="text-center space-y-6 sm:space-y-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-primary">{t('about.ourFoundations')}</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="text-left h-full">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-4 sm:mb-6 text-xl sm:text-2xl">
                            <Calculator className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold font-headline text-primary mb-2 sm:mb-3">{t('about.precisionTitle')}</h3>
                        <p className="text-primary/70 text-xs sm:text-sm leading-relaxed">
                            {t('about.precisionDesc')}
                        </p>
                    </Card>

                    <Card className="text-left h-full">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-4 sm:mb-6 text-xl sm:text-2xl">
                            <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold font-headline text-primary mb-2 sm:mb-3">{t('about.empowermentTitle')}</h3>
                        <p className="text-primary/70 text-xs sm:text-sm leading-relaxed">
                            {t('about.empowermentDesc')}
                        </p>
                    </Card>

                    <Card className="text-left h-full sm:col-span-2 md:col-span-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-4 sm:mb-6 text-xl sm:text-2xl">
                            <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold font-headline text-primary mb-2 sm:mb-3">{t('about.privacyTitle')}</h3>
                        <p className="text-primary/70 text-xs sm:text-sm leading-relaxed">
                            {t('about.privacyDesc')}
                        </p>
                    </Card>
                </div>
            </section>
        </div>
    );
};

export default function AboutPage() {
    return <AboutPageContent />;
}
