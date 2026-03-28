import { Compass, Network, Sparkles } from "lucide-react";

export default function HowItWorks() {
    const steps = [
        {
            icon: <Compass className="w-8 h-8 text-[#D4AF37]" />,
            title: "Provide Your Coordinates",
            desc: "Enter your exact moment and location of birth. AstraNavi precisely calculates your planetary alignments at the time of your incarnation."
        },
        {
            icon: <Network className="w-8 h-8 text-[#D4AF37]" />,
            title: "Generate the Astral Chart",
            desc: "Our engine maps your Kundli and computes all 12 houses, dashas, and yogas, structuring your chaotic destiny into a clear, divine mathematics."
        },
        {
            icon: <Sparkles className="w-8 h-8 text-[#D4AF37]" />,
            title: "Consult Navi AI",
            desc: "Chat with an intelligence trained on thousands of Vedic astrological texts. Ask about career, relationships, timing of events, and receive profound guidance."
        }
    ];

    return (
        <section className="py-24 relative overflow-hidden" id="how-it-works">
            <div className="absolute inset-x-0 -top-40 h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(200,136,10,0.06),transparent_70%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold font-headline mb-4 text-foreground/90">
                        The Mechanics of <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F5D77F]">Destiny</span>
                    </h2>
                    <p className="text-lg text-foreground/60 max-w-2xl mx-auto font-sans leading-relaxed">
                        A seamless fusion of ancient astronomical wisdom and real-time artificial intelligence algorithms.
                    </p>
                </div>

                <div className="relative mt-20">
                    {/* Background Line Connector */}
                    <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent z-0" />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                        {steps.map((step, index) => (
                            <div key={index} className="flex flex-col items-center text-center group">
                                <div className="w-24 h-24 rounded-full border border-[var(--border)] bg-background/50 backdrop-blur-md flex items-center justify-center mb-6 relative shadow-lg shadow-[#D4AF37]/[0.02] group-hover:border-[#D4AF37]/40 transition-all duration-300">
                                    {/* Number Badge */}
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#1a1635] to-black border border-[#D4AF37]/50 flex items-center justify-center text-[#D4AF37] font-bold font-mono text-sm shadow-md">
                                        0{index + 1}
                                    </div>
                                    <div className="transform group-hover:scale-110 transition-transform duration-500 ease-out">{step.icon}</div>
                                </div>
                                <h3 className="text-xl font-headline font-semibold mb-3 text-foreground/80 group-hover:text-foreground transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-foreground/60 leading-relaxed max-w-[280px]">
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
