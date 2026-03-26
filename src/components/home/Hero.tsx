import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const Hero = () => {
    return (
        <section className="relative min-h-[600px] lg:min-h-[800px] flex items-center px-4 sm:px-8 lg:px-12 py-12 lg:py-20 overflow-hidden">
            {/* Background glowing orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[var(--glow-color)] blur-[120px] rounded-full -z-10 opacity-30 dark:opacity-60"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 blur-[100px] rounded-full -z-10 opacity-20"></div>
            
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
                <div className="space-y-8">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-surface-variant/40 border border-secondary/20">
                        <span className="material-symbols-outlined text-secondary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                        <span className="text-xs uppercase tracking-[0.15em] font-bold text-primary font-body">The Celestial Cartographer</span>
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-bold leading-[1.1] text-primary">
                        Your personal <span className="text-secondary italic drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]">Jyotish</span> is one tap away
                    </h1>
                    
                    <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed font-normal font-body">
                        Unlock the secrets of the cosmos with AI-powered Vedic insights and verified expert consultations. Your destiny, mapped by stars, interpreted by wisdom.
                    </p>
                    
                    <div className="flex flex-wrap gap-6 sm:gap-10 py-6 border-y border-secondary/10">
                        <div>
                            <div className="text-2xl font-bold text-primary font-body">Ai</div>
                            <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-body">Driven Astrology</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-secondary font-body">FREE</div>
                            <div className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-body">First 5 Min</div>
                        </div>
                    </div>
                </div>

                {/* Kundli Widget */}
                <Card 
                  className="shadow-2xl cosmic-glow border-secondary/10"
                  padding="md"
                >
                    <h3 className="text-2xl font-headline font-bold mb-8 flex items-center gap-3 text-primary">
                        <span className="material-symbols-outlined text-secondary">menu_book</span>
                        Generate Free Kundli
                    </h3>
                    
                    <form className="space-y-6">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 font-body">Full Name</label>
                                <input 
                                    className="w-full bg-background/50 border border-secondary/10 rounded-xl px-4 py-4 text-primary placeholder:text-primary/40 focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body backdrop-blur-sm" 
                                    placeholder="Enter your full name" 
                                    type="text"
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 font-body">Date of Birth</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">calendar_month</span>
                                    <input 
                                        className="w-full bg-background/50 border border-secondary/10 rounded-xl pl-12 pr-4 py-4 text-primary focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body backdrop-blur-sm" 
                                        type="date"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 font-body">Time of Birth</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">schedule</span>
                                    <input 
                                        className="w-full bg-background/50 border border-secondary/10 rounded-xl pl-12 pr-4 py-4 text-primary focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body backdrop-blur-sm" 
                                        type="time"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-primary font-bold ml-1 font-body">Place of Birth</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">location_on</span>
                                <input 
                                    className="w-full bg-background/50 border border-secondary/10 rounded-xl pl-12 pr-4 py-4 text-primary placeholder:text-primary/40 focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-body backdrop-blur-sm" 
                                    placeholder="City, Country" 
                                    type="text"
                                />
                            </div>
                        </div>
                        
                        <Button 
                            type="button"
                            fullWidth
                            size="lg"
                        >
                            View Detailed Kundli
                        </Button>
                    </form>
                </Card>
            </div>
        </section>
    );
};

export default Hero;
