'use client';

import React from 'react';
import Card from '../ui/Card';
import { Sparkles, Heart, Briefcase, Activity, DollarSign } from 'lucide-react';

const HoroscopeTeaser = () => {
    const categories = [
        { title: 'Career', text: 'Opportunities for advancement are appearing in your professional sky.', icon: <Briefcase className="w-4 h-4 text-orange-600" />, bg: 'bg-orange-500/10' },
        { title: 'Love', text: 'Harmony flows through your relationships as Venus shifts positions.', icon: <Heart className="w-4 h-4 text-pink-600" />, bg: 'bg-pink-500/10' },
        { title: 'Health', text: 'Vitality is on the rise. A perfect day for mindfulness and energy.', icon: <Activity className="w-4 h-4 text-green-600" />, bg: 'bg-green-500/10' },
        { title: 'Finance', text: 'Steady growth is predicted. Review your long-term wealth goals.', icon: <DollarSign className="w-4 h-4 text-yellow-600" />, bg: 'bg-yellow-500/10' },
    ];

    return (
        <section className="px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 items-center">
                {/* Text Content */}
                <div className="space-y-6 text-center lg:text-left order-2 lg:order-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20">
                        <Sparkles className="w-3.5 h-3.5 text-secondary" />
                        <span className="text-[10px] sm:text-xs font-bold text-secondary uppercase tracking-[0.15em]">Daily Insights</span>
                    </div>
                    
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-primary leading-tight">
                        Your Personal <br/><span className="text-secondary italic">Cosmic Forecast</span>
                    </h2>
                    
                    <p className="text-sm sm:text-base md:text-lg text-on-surface-variant max-w-xl leading-relaxed opacity-80 mx-auto lg:mx-0">
                        Go beyond generic horoscopes. Navi provides precise daily predictions based on your unique birth chart, mapping the shifting planets to your personal journey.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 mb-2">
                        <div className="flex items-center gap-3 bg-surface p-3 rounded-2xl border border-secondary/10">
                            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold font-headline">50</div>
                            <div className="text-left">
                                <div className="text-[10px] font-bold text-secondary uppercase tracking-widest">Score</div>
                                <div className="text-xs font-semibold text-primary">Daily Vitality</div>
                            </div>
                        </div>
                        <div className="text-sm font-semibold text-primary/60 italic">
                            Updated every sunrise ✦
                        </div>
                    </div>

                    <div className="pt-2">
                        <a href="/chat">
                            <button className="px-8 py-4 rounded-2xl gold-gradient text-white font-bold shadow-xl shadow-secondary/20 hover:scale-105 transition-all text-sm sm:text-base flex items-center gap-2">
                                Get Started with Navi ✦
                            </button>
                        </a>
                    </div>
                </div>

                {/* Visual Teaser */}
                <div className="order-1 lg:order-2 relative">
                    <Card padding="none" className="!rounded-[28px] sm:!rounded-[32px] overflow-hidden border-secondary/20 relative z-10 scale-95 sm:scale-100 transition-transform hover:scale-[1.02] duration-500">
                        {/* Mock App Header */}
                        <div className="p-4 sm:p-5 border-b border-secondary/10 bg-surface flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                            </div>
                            <div className="text-[9px] font-bold text-foreground/40 uppercase tracking-[0.2em]">Navi Dashboard</div>
                        </div>

                        {/* 2x2 Grid Preview */}
                        <div className="grid grid-cols-2">
                            {categories.map((cat, i) => (
                                <div key={i} className={`p-4 sm:p-5 border-secondary/10 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b' : ''}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`w-7 h-7 rounded-lg ${cat.bg} flex items-center justify-center`}>
                                            {cat.icon}
                                        </div>
                                        <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-widest">{cat.title}</span>
                                    </div>
                                    <p className="text-[10px] sm:text-xs font-headline font-medium leading-relaxed text-foreground/80 line-clamp-2">
                                        {cat.text}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Tip Preview */}
                        <div className="p-5 sm:p-6 bg-secondary/5 border-t border-secondary/10 text-center">
                            <div className="text-[9px] font-bold text-secondary uppercase tracking-[0.2em] mb-2">Tip of the Day</div>
                            <p className="text-xs sm:text-sm font-headline font-semibold italic text-primary leading-relaxed px-4">
                                "The universe doesn't happen to you, it happens through you."
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </section>
    );
};

export default HoroscopeTeaser;
