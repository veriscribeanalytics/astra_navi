'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Heart, ArrowLeft, Sparkles, Gem, Music, Flame, Stars } from 'lucide-react';
import { motion } from 'motion/react';

export default function RemediesPage() {
    return (
        <div className="min-h-screen bg-[var(--bg)] pt-24 pb-24 px-4 relative overflow-hidden text-center">
            {/* Immersive Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-[-10%] w-[50%] h-[50%] bg-pink-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-[-10%] w-[50%] h-[50%] bg-secondary/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-left"
                >
                    <Link href="/blogs" className="inline-flex items-center gap-2 text-secondary hover:text-secondary/70 transition-all mb-8 group">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">Knowledge Center</span>
                    </Link>
                </motion.div>

                <div className="mb-24">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-[10px] font-bold tracking-[0.3em] uppercase mb-8"
                    >
                        <Heart className="w-4 h-4" />
                        Sacred Solutions
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-6xl sm:text-8xl font-headline font-bold text-foreground mb-8 tracking-tighter"
                    >
                        Vedic <br />
                        <span className="text-secondary italic">Remedies</span>
                    </motion.h1>
                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="text-lg sm:text-2xl text-foreground/40 max-w-2xl mx-auto leading-relaxed font-light"
                    >
                        The ancestral art of alignment. Restoring harmony between your earthly self and the celestial masters.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    <Card padding="none" className="!rounded-[48px] border border-secondary/10 bg-surface/40 backdrop-blur-3xl overflow-hidden relative">
                        <div className="p-12 sm:p-24 relative z-10">
                            <div className="w-24 h-24 rounded-3xl bg-secondary/10 flex items-center justify-center mx-auto mb-12 border border-secondary/20 group">
                                <motion.div
                                    animate={{ 
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 10, -10, 0]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                >
                                    <Sparkles className="w-12 h-12 text-secondary" />
                                </motion.div>
                            </div>
                            
                            <h2 className="text-3xl font-headline font-bold text-foreground mb-6">
                                The Archive is Expanding
                            </h2>
                            <p className="text-lg text-foreground/50 mb-12 max-w-xl mx-auto leading-relaxed font-light">
                                Our scribes and astrologers are currently cataloging thousands of years of remedial wisdom—from gemstone science to sacred vibrations. This wing of the library will open soon.
                            </p>

                            <div className="grid grid-cols-3 gap-6 mb-16 opacity-30">
                                {[
                                    { icon: <Gem className="w-6 h-6" />, label: 'Ratna' },
                                    { icon: <Music className="w-6 h-6" />, label: 'Mantra' },
                                    { icon: <Flame className="w-6 h-6" />, label: 'Homa' },
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-foreground/10 flex items-center justify-center">
                                            {item.icon}
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col items-center gap-6">
                                <Button href="/chat" className="!rounded-2xl !px-12 !py-6 !bg-secondary !text-white !font-bold hover:!shadow-[0_15px_30px_rgba(200,136,10,0.3)] transition-all">
                                    Consult Navi for Remedies ✦
                                </Button>
                                <p className="text-xs text-foreground/30 font-medium uppercase tracking-[0.2em]">
                                    Direct guidance is always available
                                </p>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <div className="mt-12 text-center text-[10px] text-foreground/20 font-bold tracking-[0.4em] uppercase">
                    <p>AstraNavi · The Cosmic Healer</p>
                </div>
            </div>
        </div>
    );
}
