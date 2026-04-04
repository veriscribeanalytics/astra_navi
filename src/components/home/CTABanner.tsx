import Link from "next/link";
import { Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function CTABanner() {
    const { isLoggedIn, user } = useAuth();
    const firstName = user?.name ? user.name.split(' ')[0] : '';

    return (
        <section className="py-8 sm:py-12 relative overflow-hidden" id="cta">
            <div className="absolute inset-0 bg-gradient-to-t from-background/0 via-transparent to-transparent pointer-events-none" />
            
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-secondary/5 border border-secondary/20 group">
                    {/* Glowing Backdrop - Theme Aware */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#fffcf8] to-[#fdf6ec] dark:from-[#0d0a1a] dark:to-[#13102a] opacity-100 transition-opacity duration-700" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-secondary/10 to-primary/5 blur-2xl z-0 pointer-events-none" />
                    <div className="absolute inset-0 celestial-silk opacity-30 dark:hidden" />

                    <div className="relative z-10 p-6 sm:p-10 md:p-12 lg:p-20 text-center flex flex-col items-center">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-b from-secondary to-amber-600 flex items-center justify-center shadow-lg shadow-secondary/30 mb-5 sm:mb-8 border-[2px] sm:border-[3px] border-secondary/40 ring-2 sm:ring-4 ring-[#fffcf8] dark:ring-[#1a1635]">
                            <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                        </div>
                        
                        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-headline mb-4 sm:mb-6 text-primary dark:text-white drop-shadow-sm leading-tight">
                            {isLoggedIn && user?.name 
                               ? `Your Stars are Calling, ${firstName}` 
                               : <>Your <span className="text-transparent bg-clip-text bg-gradient-to-br from-secondary to-amber-400">Cosmic Blueprint</span> Awaits</>}
                        </h2>
                        
                        <p className="text-sm sm:text-lg md:text-xl text-on-surface-variant dark:text-white/80 max-w-2xl mx-auto font-sans leading-relaxed mb-6 sm:mb-10">
                            {isLoggedIn && user?.name 
                               ? "Ready to dive deeper into your daily alignment? Your personalized Vedic insights are waiting."
                               : "Get your personalized Kundli and cosmic guidance instantly. Available 24/7, completely private, and powered by AI trained on 5,000+ years of Vedic wisdom."}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 w-full sm:w-auto">
                            <Link href="/chat" className="w-full sm:w-auto">
                                <Button 
                                    className="bg-gradient-to-r from-secondary to-amber-500 hover:from-amber-400 hover:to-amber-500 text-on-primary px-8 sm:px-12 py-5 sm:py-7 text-base sm:text-lg shadow-2xl shadow-secondary/20 font-bold border-none transition-transform hover:scale-105 w-full sm:w-auto"
                                >
                                    {isLoggedIn ? "Open Cosmic Chat" : "Consult Navi"}
                                </Button>
                            </Link>
                            <Link href="/about" className="w-full sm:w-auto">
                                <Button 
                                    variant="secondary"
                                    className="px-8 sm:px-10 py-5 sm:py-7 text-base sm:text-lg bg-surface/40 dark:bg-white/5 border-[1.5px] border-secondary text-primary dark:text-white hover:bg-surface/60 dark:hover:bg-white/10 w-full sm:w-auto"
                                >
                                    Discover Our Method
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-4 sm:mt-6 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.15em] sm:tracking-[0.2em] text-secondary/60 dark:text-white/40">
                            No credit card required. Free basic Kundli.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
