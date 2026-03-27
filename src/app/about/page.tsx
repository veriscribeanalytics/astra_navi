import React from 'react';
import Card from '@/components/ui/Card';

export const metadata = {
  title: 'About | AstraNavi',
  description: 'Learn about the mission to bridge ancient Vedic wisdom with modern AI precision.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-28 pb-20 flex flex-col relative z-10 px-6 max-w-6xl mx-auto space-y-24">
            
            {/* Hero Section */}
            <section className="text-center max-w-4xl mx-auto space-y-6">
                <span className="text-xs font-bold tracking-[0.2em] text-secondary uppercase bg-secondary/10 px-4 py-1.5 rounded-full inline-block mb-4">
                    Our Mission
                </span>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-headline font-bold text-primary leading-tight">
                    Ancient Wisdom.<br/>Modern Intelligence.
                </h1>
                <p className="text-xl text-primary/70 leading-relaxed max-w-2xl mx-auto pt-4">
                    For 5,000 years, Vedic Astrology (Jyotish) has been humanity&apos;s map of time and karma. Today, AstraNavi brings that vast mathematical science to your fingertips using next-generation AI.
                </p>
            </section>

            {/* Two Column Story */}
            <section className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl font-headline font-bold text-primary">Beyond Sun Signs</h2>
                    <p className="text-primary/70 leading-relaxed text-lg">
                        Western pop-astrology reduces human complexity to a single Sun sign. But you are far more intricate than that. 
                        Your true cosmic fingerprint involves the precise placement of 9 planets across 12 houses and 27 Nakshatras (lunar mansions) at the exact millisecond of your birth.
                    </p>
                    <p className="text-primary/70 leading-relaxed text-lg">
                        We built AstraNavi to calculate these deeply complex algorithms in milliseconds, translating classical Sanskrit aphorisms into actionable, highly personalized guidance for the modern world.
                    </p>
                </div>
                
                {/* Visual Data Representation */}
                <Card variant="bordered" padding="lg" hoverable={false} className="!bg-surface/50 backdrop-blur border-outline-variant/30 h-full flex flex-col justify-center gap-6 relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
                    <div className="space-y-2">
                        <h4 className="font-headline font-bold text-secondary text-lg">The AI Advantage</h4>
                        <div className="flex gap-4 items-center">
                            <span className="text-3xl text-primary">☸</span>
                            <p className="text-primary/80 text-sm">Calculates complex Dasha timelines and Mahadashas instantly.</p>
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <span className="text-3xl text-primary">☽</span>
                            <p className="text-primary/80 text-sm">Synthesizes thousands of classical texts to provide precise interpretations.</p>
                        </div>
                        <div className="flex gap-4 items-center mt-3">
                            <span className="text-3xl text-primary">✦</span>
                            <p className="text-primary/80 text-sm">Maintains pure objectiveness, removing the bias of traditional psychic readings.</p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Core Values */}
            <section className="text-center space-y-12">
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-primary">Our Pillars of Practice</h2>
                
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <Card className="text-left h-full">
                        <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6 text-2xl">
                            <span className="material-symbols-outlined">calculate</span>
                        </div>
                        <h3 className="text-xl font-bold font-headline text-primary mb-3">Mathematical Accuracy</h3>
                        <p className="text-primary/70 text-sm leading-relaxed">
                            AstraNavi&apos;s core engine is built on precise astronomical ephemeris data. We don&apos;t guess; we calculate.
                        </p>
                    </Card>

                    <Card className="text-left h-full">
                        <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6 text-2xl">
                            <span className="material-symbols-outlined">psychology</span>
                        </div>
                        <h3 className="text-xl font-bold font-headline text-primary mb-3">Empowering Insights</h3>
                        <p className="text-primary/70 text-sm leading-relaxed">
                            We don&apos;t believe in fatalism. Our AI provides you with cosmic weather reports—so you can navigate the storm or sail the winds.
                        </p>
                    </Card>

                    <Card className="text-left h-full">
                        <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6 text-2xl">
                            <span className="material-symbols-outlined">lock</span>
                        </div>
                        <h3 className="text-xl font-bold font-headline text-primary mb-3">Extreme Privacy</h3>
                        <p className="text-primary/70 text-sm leading-relaxed">
                            Your birth details and personal charts are encrypted. You control your data. We never sell your spiritual blueprint.
                        </p>
                    </Card>
                </div>
            </section>
        </div>
    );
}
