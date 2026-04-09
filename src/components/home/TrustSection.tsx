import { Lock, CheckCircle, Zap } from 'lucide-react';
import Card from '../ui/Card';

export default function TrustSection() {
    const trustPoints = [
        {
            icon: <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />,
            title: "Absolute Privacy",
            desc: "Your birth data is encrypted end-to-end. We never share your chart or personal information."
        },
        {
            icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />,
            title: "Classical Accuracy",
            desc: "Trained on authentic Jyotish texts—Brihat Parashara Hora Shastra, Phaladeepika, Jataka Parijata."
        },
        {
            icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />,
            title: "Always Available",
            desc: "Planetary transits don't wait. Consult Navi at any hour—no appointments, no delays."
        }
    ];

    return (
        <section className="py-10 sm:py-16 md:py-20 relative overflow-hidden bg-transparent dark:bg-transparent px-4 sm:px-8 lg:px-12">
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-8 sm:mb-12">
                    <div className="text-[10px] text-secondary font-bold tracking-[0.12em] uppercase mb-3 sm:mb-4">Our Commitment</div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-primary">
                        Guarded by Tradition
                    </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
                    {trustPoints.map((point, idx) => (
                        <Card 
                            key={idx}
                            variant="bordered"
                            padding="md"
                            className="flex flex-row sm:flex-row gap-3 sm:gap-4 group items-start"
                        >
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-secondary/10">
                                    {point.icon}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base sm:text-lg font-headline font-bold text-primary mb-1 sm:mb-2">
                                    {point.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                                    {point.desc}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
