'use client';

import React, { useEffect, useState, ReactElement } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Sparkles, ArrowLeft, Lock, Calendar, Flame, Droplets, Wind, Mountain } from 'lucide-react';

// Rashi metadata
const rashiMetadata: Record<string, { nameEn: string; nameHi: string; icon: string; element: string }> = {
    aries: { nameEn: 'Aries', nameHi: 'मेष', icon: '/icons/rashi/aries.png', element: 'Fire' },
    taurus: { nameEn: 'Taurus', nameHi: 'वृषभ', icon: '/icons/rashi/taurus.png', element: 'Earth' },
    gemini: { nameEn: 'Gemini', nameHi: 'मिथुन', icon: '/icons/rashi/gemini.png', element: 'Air' },
    cancer: { nameEn: 'Cancer', nameHi: 'कर्क', icon: '/icons/rashi/cancer.png', element: 'Water' },
    leo: { nameEn: 'Leo', nameHi: 'सिंह', icon: '/icons/rashi/leo.png', element: 'Fire' },
    virgo: { nameEn: 'Virgo', nameHi: 'कन्या', icon: '/icons/rashi/virgo.png', element: 'Earth' },
    libra: { nameEn: 'Libra', nameHi: 'तुला', icon: '/icons/rashi/libra.png', element: 'Air' },
    scorpio: { nameEn: 'Scorpio', nameHi: 'वृश्चिक', icon: '/icons/rashi/scorpio.png', element: 'Water' },
    sagittarius: { nameEn: 'Sagittarius', nameHi: 'धनु', icon: '/icons/rashi/sagittarius.png', element: 'Fire' },
    capricorn: { nameEn: 'Capricorn', nameHi: 'मकर', icon: '/icons/rashi/capricorn.png', element: 'Earth' },
    aquarius: { nameEn: 'Aquarius', nameHi: 'कुम्भ', icon: '/icons/rashi/aquarius.png', element: 'Air' },
    pisces: { nameEn: 'Pisces', nameHi: 'मीन', icon: '/icons/rashi/pisces.png', element: 'Water' }
};

const elementIcons: Record<string, ReactElement> = {
    Fire: <Flame className="w-4 h-4" />,
    Earth: <Mountain className="w-4 h-4" />,
    Air: <Wind className="w-4 h-4" />,
    Water: <Droplets className="w-4 h-4" />
};

interface HoroscopeData {
    sign?: string;
    date?: string;
    overall_score?: number;
    mood?: string;
    lucky_color?: string;
    lucky_number?: number;
    career?: string;
    love?: string;
    health?: string;
    finance?: string;
    tip?: string;
}

export default function RashiHoroscopePage() {
    const params = useParams();
    const router = useRouter();
    const { isLoggedIn, user } = useAuth();
    const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const rashiId = params.rashi as string;
    const rashiInfo = rashiMetadata[rashiId];

    useEffect(() => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        if (!rashiInfo) {
            router.push('/rashis');
            return;
        }

        // Fetch horoscope for this rashi
        const fetchHoroscope = async () => {
            try {
                setLoading(true);
                // For now, we'll use the user's email but specify the rashi
                // You'll need to update the API to accept a rashi parameter
                const response = await fetch(`/api/daily-horoscope?email=${encodeURIComponent(user?.email || '')}&rashi=${rashiInfo.nameEn}`);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to fetch horoscope');
                }

                const data = await response.json();
                setHoroscope(data);
                setError(null);
            } catch (err: any) {
                console.error('Horoscope fetch error:', err);
                setError(err.message || 'Unable to load horoscope. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchHoroscope();
    }, [rashiId, isLoggedIn, user, router, rashiInfo]);

    if (!isLoggedIn) {
        return null; // Will redirect
    }

    if (!rashiInfo) {
        return null; // Will redirect
    }

    const today = new Date();
    const dateString = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const dayName = today.toLocaleDateString('en-IN', { weekday: 'long' });

    return (
        <div className="min-h-screen bg-[var(--bg)] py-20 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 sm:mb-12">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-sm text-foreground/60 hover:text-secondary transition-colors mb-6 font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Rashis
                    </button>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                            <Image
                                src={rashiInfo.icon}
                                alt={rashiInfo.nameEn}
                                width={80}
                                height={80}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold text-foreground leading-tight">
                                {rashiInfo.nameEn} Daily Horoscope
                            </h1>
                            <p className="text-sm sm:text-base text-foreground/60 mt-1">
                                {rashiInfo.nameHi} • {dayName}, {dateString}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <Card padding="lg" className="!rounded-[32px] animate-pulse">
                        <div className="h-96 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-secondary animate-spin" />
                        </div>
                    </Card>
                )}

                {/* Error State */}
                {error && !loading && (
                    <Card padding="lg" className="!rounded-[32px]">
                        <div className="h-64 flex flex-col items-center justify-center gap-4 text-center px-6">
                            <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-orange-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-headline font-bold text-foreground mb-2">
                                    Service Temporarily Unavailable
                                </h3>
                                <p className="text-sm text-foreground/60">
                                    {error}
                                </p>
                            </div>
                            <Button 
                                onClick={() => window.location.reload()}
                                variant="secondary"
                                className="mt-4"
                            >
                                Try Again
                            </Button>
                        </div>
                    </Card>
                )}

                {/* Horoscope Content */}
                {horoscope && !loading && !error && (
                    <>
                        {/* Main Horoscope Card */}
                        <Card padding="none" className="!rounded-[32px] overflow-hidden border-outline-variant/30 mb-6">
                            {/* Header */}
                            <div className="p-6 border-b border-outline-variant/30 bg-surface/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center border border-secondary/20">
                                            {elementIcons[rashiInfo.element]}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-headline font-bold text-foreground">
                                                Overall Score
                                            </h3>
                                            <p className="text-sm text-foreground/60">{rashiInfo.element} Sign</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-4xl font-bold text-secondary">{horoscope.overall_score || 0}</div>
                                        <p className="text-xs text-foreground/50">out of 100</p>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Info */}
                            <div className="grid grid-cols-3 border-b border-outline-variant/30 bg-surface/5">
                                <div className="flex flex-col items-center justify-center p-4 border-r border-secondary/10">
                                    <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1">Mood</span>
                                    <span className="text-base font-headline font-bold text-foreground">{horoscope.mood || 'Neutral'}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-4 border-r border-secondary/10">
                                    <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1">Lucky Color</span>
                                    <span className="text-base font-headline font-bold text-foreground">{horoscope.lucky_color || 'Gold'}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-4">
                                    <span className="text-xs font-bold text-foreground/40 uppercase tracking-wider mb-1">Lucky #</span>
                                    <span className="text-base font-headline font-bold text-foreground">{horoscope.lucky_number || 8}</span>
                                </div>
                            </div>

                            {/* Detailed Predictions */}
                            <div className="p-6 space-y-6">
                                <div>
                                    <h4 className="text-sm font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider mb-2">Career</h4>
                                    <p className="text-base text-foreground/80 leading-relaxed">{horoscope.career}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-2">Love</h4>
                                    <p className="text-base text-foreground/80 leading-relaxed">{horoscope.love}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider mb-2">Health</h4>
                                    <p className="text-base text-foreground/80 leading-relaxed">{horoscope.health}</p>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider mb-2">Finance</h4>
                                    <p className="text-base text-foreground/80 leading-relaxed">{horoscope.finance}</p>
                                </div>
                            </div>

                            {/* Tip of the Day */}
                            <div className="p-8 bg-surface/20 border-t border-outline-variant/30 flex flex-col items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4 border border-secondary/20">
                                    <Sparkles className="w-6 h-6 text-secondary" />
                                </div>
                                <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Tip of the Day</div>
                                <p className="text-lg font-headline font-semibold italic leading-relaxed text-foreground max-w-md">
                                    "{horoscope.tip}"
                                </p>
                            </div>
                        </Card>

                        {/* Info Footer */}
                        <Card padding="md" className="!rounded-[24px] border-outline-variant/30 bg-surface/50">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                    <Calendar className="w-5 h-5 text-secondary" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground mb-2">About This Horoscope</h3>
                                    <p className="text-xs text-foreground/60 leading-relaxed">
                                        This daily horoscope for {rashiInfo.nameEn} is based on Vedic astrology principles and planetary transits. 
                                        Predictions are updated daily at 3 AM IST.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
