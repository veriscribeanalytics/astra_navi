'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Star, Shield, Clock, Filter, CheckCircle, Sparkles } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

const astrologers = [
    { id: 1, name: "Acharya Vashist", exp: 18, special: ["Vedic", "Vastu"], rating: 4.9, reviews: 1240, price: 25, online: true, img: "/icons/logo.jpeg" },
    { id: 2, name: "Pandit Rahul", exp: 12, special: ["Marriage", "Career"], rating: 4.8, reviews: 850, price: 15, online: true, img: "/icons/logo.jpeg" },
    { id: 3, name: "Guru Maa Anandi", exp: 22, special: ["Healing", "KP Astrology"], rating: 5.0, reviews: 2100, price: 40, online: true, img: "/icons/logo.jpeg" },
    { id: 4, name: "Dr. S. K. Sharma", exp: 15, special: ["Medical", "Prashna"], rating: 4.7, reviews: 630, price: 20, online: false, img: "/icons/logo.jpeg" },
    { id: 5, name: "Yogi Bharat", exp: 10, special: ["Palmistry", "Face Reading"], rating: 4.6, reviews: 420, price: 12, online: true, img: "/icons/logo.jpeg" },
    { id: 6, name: "Acharya Meenakshi", exp: 14, special: ["Numerology", "Tarot"], rating: 4.8, reviews: 980, price: 18, online: true, img: "/icons/logo.jpeg" },
    { id: 7, name: "Pandit Ji Govind", exp: 30, special: ["Muhurat", "Karma"], rating: 4.9, reviews: 3400, price: 50, online: true, img: "/icons/logo.jpeg" },
    { id: 8, name: "Swami Tej", exp: 8, special: ["Nadi", "Lal Kitab"], rating: 4.5, reviews: 210, price: 10, online: true, img: "/icons/logo.jpeg" },
    { id: 9, name: "Jyotishi Priya", exp: 16, special: ["Psychological", "Vedic"], rating: 4.8, reviews: 1120, price: 22, online: false, img: "/icons/logo.jpeg" },
    { id: 10, name: "Acharya Kapil", exp: 20, special: ["Gemology", "Business"], rating: 4.9, reviews: 1560, price: 30, online: true, img: "/icons/logo.jpeg" }
];

export default function AstrologersPage() {
    const [filter, setFilter] = useState('All');
    
    return (
        <main className="min-h-screen bg-[var(--bg)] pt-24 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2200px] mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-secondary" />
                            <span className="text-[11px] font-bold text-secondary uppercase tracking-widest">Verified Experts</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-headline font-bold text-primary mb-4">
                            Consult with the <span className="text-secondary italic">Ancient Lineage</span>
                        </h1>
                        <p className="text-on-surface-variant/70 text-base">
                            Our gurus are hand-picked for their deep knowledge of Shastra, technical precision, and empathetic guidance. Log in to your celestial account to begin your consultation.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-surface p-2 rounded-2xl border border-outline-variant/20">
                        <Button href="/login" variant="ghost" size="sm" className="bg-secondary/10 text-secondary">Sign In to Consult</Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-8 overflow-x-auto hide-scrollbar pb-2">
                    <div className="p-2 bg-surface rounded-xl border border-outline-variant/20 mr-2">
                        <Filter className="w-4 h-4 text-primary/60" />
                    </div>
                    {["All", "Vedic", "Marriage", "Career", "Healing", "Vastu"].map((f) => (
                        <button 
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-6 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                                filter === f 
                                ? 'bg-primary text-white border-primary shadow-lg' 
                                : 'bg-surface text-primary/60 border-outline-variant/20 hover:border-secondary'
                            }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {astrologers.map((guru) => (
                        <motion.div key={guru.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <Card padding="none" className="h-full group hover:border-secondary/50 transition-all duration-500 overflow-hidden bg-surface flex flex-col">
                                <div className="relative h-48 w-full bg-secondary/5 overflow-hidden">
                                    <Image src={guru.img} alt={guru.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80" />
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider backdrop-blur-md border ${
                                            guru.online ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-on-surface-variant/20 text-on-surface-variant/60 border-outline-variant/20'
                                        }`}>
                                            {guru.online ? '• Online' : 'Offline'}
                                        </div>
                                    </div>
                                    {guru.id === 1 && (
                                        <div className="absolute top-4 left-4 bg-amber-500 text-white px-2 py-1 rounded text-[9px] font-bold uppercase tracking-widest shadow-lg">
                                            Expert Pick
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 flex-grow flex flex-col">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-lg font-headline font-bold text-primary group-hover:text-secondary transition-colors">{guru.name}</h3>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 text-secondary fill-secondary" />
                                            <span className="text-xs font-bold text-primary">{guru.rating}</span>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-on-surface-variant/60 font-medium mb-4 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {guru.exp} Years Exp.
                                    </p>

                                    <div className="flex flex-wrap gap-1.5 mb-6">
                                        {guru.special.map(s => (
                                            <span key={s} className="px-2 py-0.5 rounded bg-surface-variant/20 border border-outline-variant/10 text-[9px] font-bold text-primary/60">{s}</span>
                                        ))}
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-outline-variant/10 flex items-center justify-between">
                                        <div>
                                            <div className="text-[10px] text-on-surface-variant/40 font-bold uppercase">Rate</div>
                                            <div className="text-sm font-bold text-primary">₹{guru.price}<span className="text-[10px] text-on-surface-variant/40">/min</span></div>
                                        </div>
                                        <Button size="sm" className="gold-gradient text-white border-none rounded-xl px-6">
                                            Chat Now
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Trust Footer */}
                <div className="mt-20 p-8 rounded-[40px] bg-secondary/5 border border-secondary/10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-headline font-bold text-primary">Your Privacy is Sacred</h3>
                        <p className="text-sm text-on-surface-variant/70 max-w-lg">All consultations are encrypted end-to-end. Your birth details and identity are only used for your astrological calculations.</p>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                        <div className="flex flex-col items-center">
                            <Shield className="w-8 h-8 text-secondary mb-2" />
                            <span className="text-[10px] font-bold uppercase text-primary/60">Verified</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <CheckCircle className="w-8 h-8 text-secondary mb-2" />
                            <span className="text-[10px] font-bold uppercase text-primary/60">Certified</span>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
