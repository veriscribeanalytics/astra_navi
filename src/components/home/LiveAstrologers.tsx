import Card from '../ui/Card';
import { Zap, Clock, Shield, Brain } from 'lucide-react';

const LiveAstrologers = () => {
    const advantages = [
        {
            icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
            title: "Instant Answers",
            desc: "Get your Kundli and cosmic insights in seconds, not hours. No waiting for availability."
        },
        {
            icon: <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
            title: "24/7 Availability",
            desc: "Chat anytime, anywhere. Your AI Jyotish never sleeps, never takes a day off."
        },
        {
            icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
            title: "Complete Privacy",
            desc: "Your birth details and questions stay completely confidential. No human judgment."
        },
        {
            icon: <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />,
            title: "Vedic Precision",
            desc: "Trained on 5,000+ years of Vedic texts and thousands of birth charts for accuracy."
        }
    ];

    return (
        <section className="py-10 sm:py-16 lg:py-24 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
                <div className="text-center mb-8 sm:mb-12">
                    <div className="text-[10px] text-secondary font-bold tracking-[0.12em] uppercase mb-3 sm:mb-4">Why Choose AI Astrology</div>
                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-headline font-bold text-primary mb-3 sm:mb-4">
                        The Future of Vedic Wisdom
                    </h2>
                    <p className="text-sm sm:text-lg text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
                        Experience the perfect blend of ancient Vedic knowledge and modern AI technology. Faster, more accessible, and always available.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8 mb-12 sm:mb-20">
                    {advantages.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center transition-all duration-300">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-secondary/15 flex items-center justify-center mb-3 sm:mb-6 border border-secondary/20 shadow-sm shadow-secondary/5">
                                {item.icon}
                            </div>
                            <h3 className="font-headline font-bold text-sm sm:text-xl text-primary mb-1 sm:mb-3">
                                {item.title}
                            </h3>
                            <p className="text-[11px] sm:text-sm text-on-surface-variant leading-relaxed opacity-85">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Divider Line */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-secondary/10 to-transparent mb-8 sm:mb-16" />

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
                    <Card variant="default" padding="md" className="flex flex-col items-center justify-center border-secondary/10 text-center shadow-lg shadow-secondary/5 transition-transform hover:scale-[1.03] !py-4 sm:!py-6">
                        <div className="text-2xl sm:text-3xl font-bold font-headline text-secondary mb-0.5 sm:mb-1">10K+</div>
                        <div className="text-[8px] sm:text-[10px] uppercase tracking-widest font-bold text-on-surface-variant opacity-60">Generated</div>
                    </Card>
                    <Card variant="default" padding="md" className="flex flex-col items-center justify-center border-secondary/10 text-center shadow-lg shadow-secondary/5 transition-transform hover:scale-[1.03] !py-4 sm:!py-6">
                        <div className="text-2xl sm:text-3xl font-bold font-headline text-secondary mb-0.5 sm:mb-1">4.8★</div>
                        <div className="text-[8px] sm:text-[10px] uppercase tracking-widest font-bold text-on-surface-variant opacity-60">Avg Rating</div>
                    </Card>
                    <Card variant="default" padding="md" className="flex flex-col items-center justify-center border-secondary/10 text-center shadow-lg shadow-secondary/5 transition-transform hover:scale-[1.03] !py-4 sm:!py-6">
                        <div className="text-2xl sm:text-3xl font-bold font-headline text-secondary mb-0.5 sm:mb-1">24/7</div>
                        <div className="text-[8px] sm:text-[10px] uppercase tracking-widest font-bold text-on-surface-variant opacity-60">Availability</div>
                    </Card>
                    <Card variant="default" padding="md" className="flex flex-col items-center justify-center border-secondary/10 text-center shadow-lg shadow-secondary/5 transition-transform hover:scale-[1.03] !py-4 sm:!py-6">
                        <div className="text-2xl sm:text-3xl font-bold font-headline text-secondary mb-0.5 sm:mb-1">100%</div>
                        <div className="text-[8px] sm:text-[10px] uppercase tracking-widest font-bold text-on-surface-variant opacity-60">Privacy</div>
                    </Card>
                </div>
            </div>
        </section>
    );
};

export default LiveAstrologers;
