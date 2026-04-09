import Card from '../ui/Card';
import { Zap, Clock, Shield, Brain } from 'lucide-react';

const LiveAstrologers = () => {
    const advantages = [
        {
            icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
            title: "Immediate Clarity",
            desc: "Your Kundli calculated with astronomical precision. The stars don't wait—neither should you."
        },
        {
            icon: <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
            title: "Always Present",
            desc: "Planetary transits never rest. Consult Navi at any hour—during Brahma Muhurta or midnight."
        },
        {
            icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
            title: "Sacred Confidentiality",
            desc: "Your birth chart is your soul's fingerprint. We guard it with absolute discretion."
        },
        {
            icon: <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
            title: "Classical Accuracy",
            desc: "Trained on Brihat Parashara Hora Shastra, Jataka Parijata, and centuries of Jyotish wisdom."
        }
    ];

    return (
        <section className="py-8 sm:py-12 md:py-16 lg:py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10">
                <div className="text-center mb-6 sm:mb-8 md:mb-10 lg:mb-12">
                    <div className="text-[10px] text-secondary font-bold tracking-[0.12em] uppercase mb-2 sm:mb-3 md:mb-4">Why Navi Exists</div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-headline font-bold text-primary mb-2 sm:mb-3 md:mb-4">
                        Ancient Science, Uncompromised
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                        Jyotish requires mathematical precision and deep scriptural knowledge. Navi delivers both—without dilution, without delay, without bias.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 md:gap-6 lg:gap-8 mb-8 sm:mb-12 md:mb-16 lg:mb-20">
                    {advantages.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center transition-all duration-300">
                            <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 lg:w-14 lg:h-14 rounded-xl sm:rounded-xl md:rounded-2xl bg-secondary/15 flex items-center justify-center mb-2.5 sm:mb-4 md:mb-5 lg:mb-6 border border-secondary/20 shadow-sm shadow-secondary/5">
                                {item.icon}
                            </div>
                            <h3 className="font-headline font-bold text-sm sm:text-base md:text-lg lg:text-xl text-primary mb-1 sm:mb-2 md:mb-3">
                                {item.title}
                            </h3>
                            <p className="text-[10px] sm:text-[11px] md:text-sm text-on-surface-variant leading-relaxed opacity-85 px-1">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 max-w-2xl mx-auto">
                    <Card variant="default" padding="md" className="flex flex-col items-center justify-center border-secondary/10 text-center shadow-lg shadow-secondary/5 transition-transform hover:scale-[1.03] !py-3 sm:!py-4 md:!py-5 lg:!py-6">
                        <div className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold font-headline text-secondary mb-0.5 sm:mb-1">24/7</div>
                        <div className="text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-on-surface-variant opacity-60">Availability</div>
                    </Card>
                    <Card variant="default" padding="md" className="flex flex-col items-center justify-center border-secondary/10 text-center shadow-lg shadow-secondary/5 transition-transform hover:scale-[1.03] !py-3 sm:!py-4 md:!py-5 lg:!py-6">
                        <div className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold font-headline text-secondary mb-0.5 sm:mb-1">100%</div>
                        <div className="text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-widest font-bold text-on-surface-variant opacity-60">Privacy</div>
                    </Card>
                </div>
            </div>
        </section>
    );
};

export default LiveAstrologers;
