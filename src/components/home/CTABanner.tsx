import Link from "next/link";
import { Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

export default function CTABanner() {
    const { isLoggedIn, user } = useAuth();
    const firstName = user?.name ? user.name.split(' ')[0] : '';

    return (
        <section className="py-6 sm:py-8 md:py-10 lg:py-12 relative overflow-hidden" id="cta">
            <div className="absolute inset-0 bg-gradient-to-t from-background/0 via-transparent to-transparent pointer-events-none" />
            
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="relative rounded-2xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-secondary/5 border border-secondary/20 group">
                    {/* Glowing Backdrop - Theme Aware */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#fffcf8] to-[#fdf6ec] dark:from-[#0d0a1a] dark:to-[#13102a] opacity-100 transition-opacity duration-700" />
                    <div className="absolute inset-0 celestial-silk opacity-30 dark:hidden" />

                    <div className="relative z-10 p-6 sm:p-8 md:p-12 lg:p-16 xl:p-20 text-center flex flex-col items-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full bg-gradient-to-b from-secondary to-amber-600 flex items-center justify-center shadow-lg shadow-secondary/30 mb-4 sm:mb-5 md:mb-6 lg:mb-8 border-[2px] sm:border-[2px] md:border-[3px] border-secondary/40 ring-2 sm:ring-3 md:ring-4 ring-[#fffcf8] dark:ring-[#1a1635]">
                            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-8 lg:h-8 text-white" />
                        </div>
                        
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold font-headline mb-3 sm:mb-4 md:mb-5 lg:mb-6 text-primary dark:text-white drop-shadow-sm leading-tight">
                            {isLoggedIn && user?.name 
                               ? `The Planets Are Moving, ${firstName}` 
                               : <>Your <span className="text-transparent bg-clip-text bg-gradient-to-br from-secondary to-amber-400">Destiny</span> Is Written in the Stars</>}
                        </h2>
                        
                        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-on-surface-variant dark:text-white/80 max-w-2xl mx-auto font-sans leading-relaxed mb-5 sm:mb-6 md:mb-8 lg:mb-10">
                            {isLoggedIn && user?.name 
                               ? "The transits continue. Your Dashas unfold. Return to Navi for guidance on today's planetary influences."
                               : "Receive your complete Vedic birth chart—Lagna, Navamsha, Dashas, and planetary yogas. Consult Navi on career, relationships, health, and the timing of major life events."}
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full sm:w-auto">
                            <Link href="/chat" className="w-full sm:w-auto">
                                <Button 
                                    className="bg-gradient-to-r from-secondary to-amber-500 hover:from-amber-400 hover:to-amber-500 text-on-primary px-6 sm:px-8 md:px-10 lg:px-12 py-4 sm:py-5 md:py-6 lg:py-7 text-sm sm:text-base md:text-lg shadow-2xl shadow-secondary/20 font-bold border-none transition-transform hover:scale-105 w-full sm:w-auto"
                                >
                                    {isLoggedIn ? "Open Cosmic Chat" : "Consult Navi"}
                                </Button>
                            </Link>
                            <Link href="/about" className="w-full sm:w-auto">
                                <Button 
                                    variant="secondary"
                                    className="px-6 sm:px-8 md:px-9 lg:px-10 py-4 sm:py-5 md:py-6 lg:py-7 text-sm sm:text-base md:text-lg bg-surface/40 dark:bg-white/5 border-[1.5px] border-secondary text-primary dark:text-white hover:bg-surface/60 dark:hover:bg-white/10 w-full sm:w-auto"
                                >
                                    Discover Our Method
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 text-[9px] sm:text-[10px] uppercase font-bold tracking-[0.15em] sm:tracking-[0.18em] md:tracking-[0.2em] text-secondary/60 dark:text-white/40">
                            Beta Testing Phase • All Features Free
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
