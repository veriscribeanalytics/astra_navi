import { Compass, Network, Sparkles } from "lucide-react";

export default function HowItWorks() {
    const steps = [
        {
            icon: <Compass className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />,
            title: "Enter Your Birth Details",
            desc: "Share your exact date, time, and place of birth. This is the foundation of your cosmic blueprint."
        },
        {
            icon: <Network className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />,
            title: "AI Generates Your Kundli",
            desc: "In seconds, our AI calculates your complete birth chart with all 12 houses, planetary positions, and Dashas."
        },
        {
            icon: <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />,
            title: "Get Instant Cosmic Guidance",
            desc: "Chat with Navi AI anytime. Ask about career, love, health, timing—get personalized insights powered by Vedic wisdom."
        }
    ];

    return (
        <section className="py-8 sm:py-10 md:py-16 relative overflow-hidden rounded-[24px] sm:rounded-[40px] bg-transparent mx-4 sm:mx-8 lg:mx-12" id="how-it-works">
            <div className="absolute inset-x-0 -top-40 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(200,136,10,0.06),transparent_70%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-8 sm:mb-10">
                    <div className="text-[10px] text-secondary font-bold tracking-[0.12em] uppercase mb-3 sm:mb-4">How It Works</div>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold font-headline mb-2 sm:mb-3 text-foreground/90">
                        The Mechanics of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F5D77F]">Destiny</span>
                    </h2>
                    <p className="text-sm sm:text-lg text-foreground/60 max-w-2xl mx-auto font-sans leading-relaxed">
                        A seamless fusion of ancient astronomical wisdom and real-time artificial intelligence algorithms.
                    </p>
                </div>

                <div className="relative mt-8 sm:mt-16">
                    {/* Background Line Connector - Dashed Gold */}
                    <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] border-t-2 border-dashed border-secondary/40 z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 relative z-10">
                        {steps.map((step, index) => (
                            <div key={index} className="flex flex-col items-center text-center group">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border border-secondary/20 bg-surface/50 backdrop-blur-md flex items-center justify-center mb-4 sm:mb-6 relative shadow-lg shadow-secondary/5 group-hover:border-secondary transition-all duration-300">
                                    {/* Number Badge */}
                                    <div className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-surface border border-secondary/60 flex items-center justify-center text-secondary font-bold font-mono text-[10px] sm:text-xs shadow-sm">
                                        0{index + 1}
                                    </div>
                                    <div className="transform group-hover:scale-110 transition-transform duration-500 ease-out">{step.icon}</div>
                                </div>
                                <h3 className="text-lg sm:text-xl font-headline font-semibold mb-2 sm:mb-3 text-primary group-hover:text-secondary transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-[280px] opacity-80">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
