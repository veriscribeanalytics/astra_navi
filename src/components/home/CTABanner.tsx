import Link from "next/link";
import { Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";

export default function CTABanner() {
    return (
        <section className="py-24 relative overflow-hidden" id="cta">
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg2)] via-transparent to-transparent pointer-events-none" />
            
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#D4AF37]/[0.05] border border-[#D4AF37]/20 group">
                    {/* Glowing Backdrop */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#13102a] to-[#1a1635] opacity-90 transition-opacity duration-700 group-hover:opacity-100 dark:from-[#0d0a1a] dark:to-[#13102a]" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/20 to-[#7c6fcd]/20 blur-2xl z-0 pointer-events-none" />

                    <div className="relative z-10 p-12 lg:p-20 text-center flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-b from-[#D4AF37] to-amber-600 flex items-center justify-center shadow-lg shadow-[#D4AF37]/30 mb-8 border-[3px] border-[#D4AF37]/40 ring-4 ring-[#1a1635]">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        
                        <h2 className="text-4xl md:text-6xl font-bold font-headline mb-6 text-white drop-shadow-md">
                            Your <span className="text-transparent bg-clip-text bg-gradient-to-br from-[#D4AF37] to-yellow-200">Cosmic Blueprint</span> Awaits
                        </h2>
                        
                        <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-sans leading-relaxed mb-10">
                            Stop guessing. Decode your destiny with mathematical precision, ancient Sanskrit wisdom, and state-of-the-art AI. The universe is speaking, it's time to listen.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/login">
                                <Button 
                                    className="bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-amber-400 hover:to-amber-500 text-[#13102a] px-10 py-7 text-lg shadow-xl shadow-[#D4AF37]/20 font-bold border-none"
                                >
                                    Enter the Ascendant
                                </Button>
                            </Link>
                            <Link href="/about">
                                <Button 
                                    variant="secondary"
                                    className="px-10 py-7 text-lg bg-white/5 border-white/20 text-white hover:bg-white/10"
                                >
                                    Discover Our Method
                                </Button>
                            </Link>
                        </div>
                        <p className="mt-6 text-xs font-mono text-white/40 tracking-widest uppercase">
                            No credit card required. Free basic Kundli.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
