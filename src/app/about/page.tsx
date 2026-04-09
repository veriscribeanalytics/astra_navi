import React from 'react';
import Card from '@/components/ui/Card';

export const metadata = {
  title: 'About | AstraNavi',
  description: 'Learn about the mission to bridge ancient Vedic wisdom with modern AI precision.',
};

export default function AboutPage() {
    return (
        <div className="min-h-screen pt-20 sm:pt-28 pb-12 sm:pb-20 flex flex-col relative z-10 px-4 sm:px-6 max-w-6xl mx-auto space-y-12 sm:space-y-24">
            
            {/* Hero Section */}
            <section className="text-center max-w-4xl mx-auto space-y-4 sm:space-y-6">
                <span className="text-[10px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] text-secondary uppercase bg-secondary/10 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full inline-block mb-2 sm:mb-4">
                    The Tradition
                </span>
                <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-bold text-primary leading-tight">
                    5,000 Years of Cosmic Science
                </h1>
                <p className="text-base sm:text-xl text-primary/70 leading-relaxed max-w-2xl mx-auto pt-2 sm:pt-4">
                    Jyotish Shastra—the science of light—has guided kings, sages, and seekers through the cycles of time. AstraNavi preserves this ancient mathematical tradition while making it accessible to the modern world.
                </p>
            </section>

            {/* Two Column Story */}
            <section className="grid md:grid-cols-2 gap-8 sm:gap-12 lg:gap-20 items-center">
                <div className="space-y-4 sm:space-y-6">
                    <h2 className="text-2xl sm:text-3xl font-headline font-bold text-primary">More Than Sun Signs</h2>
                    <p className="text-sm sm:text-lg text-primary/70 leading-relaxed">
                        Western astrology simplifies you to a single Sun sign. Jyotish reveals the full picture: 9 Grahas (planets), 12 Bhavas (houses), 27 Nakshatras (lunar mansions), and the exact degree of your Lagna (Ascendant) at the moment of your first breath.
                    </p>
                    <p className="text-sm sm:text-lg text-primary/70 leading-relaxed">
                        Navi calculates these intricate patterns instantly—analyzing planetary yogas, Dasha periods, and transits—then interprets them through the lens of classical texts like Brihat Parashara Hora Shastra and Phaladeepika.
                    </p>
                </div>
                
                {/* Visual Data Representation */}
                <Card variant="bordered" padding="lg" hoverable={false} className="backdrop-blur border-outline-variant/30 h-full flex flex-col justify-center gap-4 sm:gap-6 relative overflow-hidden">
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-secondary/20 rounded-full blur-3xl mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
                    <div className="space-y-2">
                        <h4 className="font-headline font-bold text-secondary text-base sm:text-lg">What Navi Knows</h4>
                        <div className="flex gap-3 sm:gap-4 items-center">
                            <span className="text-2xl sm:text-3xl text-primary">☸</span>
                            <p className="text-primary/80 text-xs sm:text-sm">Mahadasha and Antardasha periods—the planetary timelines governing your life phases.</p>
                        </div>
                        <div className="flex gap-3 sm:gap-4 items-center mt-2 sm:mt-3">
                            <span className="text-2xl sm:text-3xl text-primary">☽</span>
                            <p className="text-primary/80 text-xs sm:text-sm">Classical yogas—planetary combinations that reveal wealth, spirituality, challenges, and gifts.</p>
                        </div>
                        <div className="flex gap-3 sm:gap-4 items-center mt-2 sm:mt-3">
                            <span className="text-2xl sm:text-3xl text-primary">✦</span>
                            <p className="text-primary/80 text-xs sm:text-sm">Divisional charts (Vargas)—deeper layers showing marriage, career, and spiritual evolution.</p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Core Values */}
            <section className="text-center space-y-6 sm:space-y-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-primary">Our Foundations</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                    <Card className="text-left h-full">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-4 sm:mb-6 text-xl sm:text-2xl">
                            <span className="material-symbols-outlined">calculate</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold font-headline text-primary mb-2 sm:mb-3">Astronomical Precision</h3>
                        <p className="text-primary/70 text-xs sm:text-sm leading-relaxed">
                            Navi uses Swiss Ephemeris—the same data NASA relies on. Your chart is calculated to the arc-second, not approximated.
                        </p>
                    </Card>

                    <Card className="text-left h-full">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-4 sm:mb-6 text-xl sm:text-2xl">
                            <span className="material-symbols-outlined">psychology</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold font-headline text-primary mb-2 sm:mb-3">Empowerment, Not Fatalism</h3>
                        <p className="text-primary/70 text-xs sm:text-sm leading-relaxed">
                            Jyotish shows tendencies, not certainties. Navi provides cosmic weather reports—you decide how to navigate the currents.
                        </p>
                    </Card>

                    <Card className="text-left h-full sm:col-span-2 md:col-span-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-4 sm:mb-6 text-xl sm:text-2xl">
                            <span className="material-symbols-outlined">lock</span>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold font-headline text-primary mb-2 sm:mb-3">Sacred Privacy</h3>
                        <p className="text-primary/70 text-xs sm:text-sm leading-relaxed">
                            Your birth chart is your soul's fingerprint. We encrypt all data end-to-end. Your cosmic blueprint belongs to you alone.
                        </p>
                    </Card>
                </div>
            </section>
        </div>
    );
}
