import { motion } from "motion/react";
import { Compass, Network, Sparkles } from "lucide-react";

export default function HowItWorks() {
    const steps = [
        {
            icon: <Compass className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />,
            title: "Provide Your Birth Coordinates",
            desc: "Your exact birth moment—date, time, and location—is the seed from which your entire chart unfolds."
        },
        {
            icon: <Network className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />,
            title: "Navi Calculates Your Kundli",
            desc: "Using astronomical ephemeris data, Navi maps all 9 Grahas across 12 Bhavas, calculates your Dashas, and identifies planetary yogas."
        },
        {
            icon: <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-[#D4AF37]" />,
            title: "Receive Jyotish Guidance",
            desc: "Ask Navi about your Dharma, relationships, career timing, or remedial measures. Receive answers rooted in classical texts."
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.6, ease: "easeOut" as const }
        }
    };

    return (
        <section className="py-4 sm:py-6 md:py-8 lg:py-10 relative overflow-hidden rounded-[20px] sm:rounded-[28px] md:rounded-[36px] lg:rounded-[40px] bg-transparent mx-4 sm:mx-6 md:mx-8 lg:mx-12" id="how-it-works">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-4 sm:mb-5 md:mb-6"
                >
                    <div className="text-[10px] text-secondary font-bold tracking-[0.12em] uppercase mb-2 sm:mb-3 md:mb-4">How It Works</div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold font-headline mb-2 sm:mb-2.5 md:mb-3 text-foreground/90">
                        From Birth Moment to <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] to-[#F5D77F]">Cosmic Map</span>
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg text-foreground/60 max-w-2xl mx-auto font-sans leading-relaxed">
                        Jyotish is mathematics meeting mythology. Navi performs the calculations; the stars provide the meaning.
                    </p>
                </motion.div>

                <div className="relative mt-4 sm:mt-6 md:mt-8 lg:mt-10">
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={containerVariants}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 lg:gap-12 relative z-10"
                    >
                        {steps.map((step, index) => (
                            <motion.div key={index} variants={itemVariants} className="flex flex-col items-center text-center group">
                                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 lg:w-20 lg:h-20 rounded-full border border-secondary/20 bg-surface flex items-center justify-center mb-2 sm:mb-3 md:mb-4 lg:mb-5 relative shadow-lg shadow-secondary/5 group-hover:border-secondary transition-all duration-300">
                                    {/* Number Badge */}
                                    <div className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-surface border border-secondary/60 flex items-center justify-center text-secondary font-bold font-mono text-[10px] sm:text-xs shadow-sm">
                                        0{index + 1}
                                    </div>
                                    <div className="transform group-hover:scale-110 transition-transform duration-500 ease-out">{step.icon}</div>
                                </div>
                                <h3 className="text-base sm:text-lg md:text-xl font-headline font-semibold mb-2 sm:mb-2.5 md:mb-3 text-primary group-hover:text-secondary transition-colors">
                                    {step.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed max-w-[280px] opacity-80">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
