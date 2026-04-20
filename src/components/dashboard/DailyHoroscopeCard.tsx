'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { Sparkles, Heart, Briefcase, Activity, DollarSign } from 'lucide-react';

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
    dominant_planet?: string;
}

interface DailyHoroscopeCardProps {
    email?: string;
    sign?: string;
    isGeneral?: boolean;
}

export default function DailyHoroscopeCard({ email, sign, isGeneral }: DailyHoroscopeCardProps) {
    const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showContent, setShowContent] = useState(false);
    const [animatedScore, setAnimatedScore] = useState(0);

    // Get current date and day
    const today = new Date();
    const dateString = today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
    const dayName = today.toLocaleDateString('en-IN', { weekday: 'long' });

    useEffect(() => {
        const fetchHoroscope = async () => {
            try {
                setLoading(true);

                // Build query string based on available props and mode
                let url = isGeneral ? '/api/horoscope-general?' : '/api/daily-horoscope?';
                
                if (sign) {
                    url += `sign=${encodeURIComponent(sign)}`;
                } else if (email && !isGeneral) {
                    url += `email=${encodeURIComponent(email)}`;
                } else {
                    throw new Error('No identifier provided for horoscope');
                }

                // Call API directly - NO CACHING to ensure fresh data always
                const response = await fetch(url);
                
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || 'Failed to fetch horoscope');
                }

                const data = await response.json();
                setHoroscope(data);
                setError(null);
            } catch (err: any) {
                console.error('Horoscope fetch error:', err);
                setError(err.message || 'Unable to load daily horoscope. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (email || sign) {
            fetchHoroscope();
        }
    }, [email, sign, isGeneral]);


    useEffect(() => {
        if (!loading && horoscope) {
            const timer = setTimeout(() => {
                setShowContent(true);
                setAnimatedScore(horoscope.overall_score || 0);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading, horoscope]);

    if (loading) {
        return (
            <Card padding="md" className="!rounded-[28px] sm:!rounded-[40px] animate-pulse">
                <div className="h-64 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-secondary animate-spin" />
                </div>
            </Card>
        );
    }

    if (error || !horoscope) {
        return (
            <Card padding="md" className="!rounded-[28px] sm:!rounded-[40px]">
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-center px-6">
                    <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-orange-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-headline font-bold text-foreground mb-2">
                            Service Temporarily Unavailable
                        </h3>
                        <p className="text-sm text-foreground/60">
                            {error || 'Unable to load your daily horoscope. Please try again later.'}
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-orange-500';
    };

    // Get lucky color or default to grey
    const luckyColor = horoscope.lucky_color?.toLowerCase() || '';
    
    // Convert color name or description to the closest major family hex
    const getLuckyColorStyle = () => {
        if (!luckyColor) return '#94a3b8'; // Default to grey
        const searchColor = luckyColor.toLowerCase();
        
        const families = [
            { id: 'pink', keywords: ['pink', 'rose', 'magenta'], hex: '#f472b6' },
            { id: 'red', keywords: ['red', 'maroon', 'crimson', 'ruby'], hex: '#dc2626' },
            { id: 'blue', keywords: ['blue', 'navy', 'indigo', 'cyan', 'azure'], hex: '#2563eb' },
            { id: 'green', keywords: ['green', 'emerald', 'olive', 'teal'], hex: '#059669' },
            { id: 'yellow', keywords: ['yellow', 'saffron', 'gold', 'amber'], hex: '#f59e0b' },
            { id: 'orange', keywords: ['orange', 'peach', 'coral'], hex: '#ea580c' },
            { id: 'purple', keywords: ['purple', 'violet', 'lavender', 'plum'], hex: '#7c3aed' },
            { id: 'white', keywords: ['white', 'cream', 'ivory', 'pearl'], hex: '#ffffff' },
            { id: 'black', keywords: ['black', 'charcoal', 'void'], hex: '#111827' },
            { id: 'grey', keywords: ['grey', 'gray', 'silver', 'slate'], hex: '#94a3b8' },
            { id: 'brown', keywords: ['brown', 'khaki', 'chocolate', 'coffee'], hex: '#78350f' },
        ];

        const family = families.find(f => 
            f.keywords.some(kw => searchColor.includes(kw)) || searchColor === f.id
        );

        return family ? family.hex : '#fbbf24'; // Default to Solar Gold
    };

    const luckyColorHex = getLuckyColorStyle();
    
    // Visibility Arrangement: If color is black or too dark, use silver/white for visual elements
    const isTooDark = luckyColorHex.toLowerCase() === '#111827' || luckyColor.toLowerCase() === 'black';
    const displayColorHex = isTooDark ? '#e2e8f0' : luckyColorHex;

    // Calculate circle progress for score ring
    const score = horoscope.overall_score || 50;
    const circumference = 2 * Math.PI * 32; // radius = 32
    const progress = circumference - (animatedScore / 100) * circumference;

    return (
        <Card 
            padding="none" 
            className="!rounded-[24px] sm:!rounded-[32px] overflow-hidden glass-panel"
        >
            {/* Header - Compact for mobile */}
            <div className="p-3 sm:p-4 border-b border-outline-variant/30 bg-surface/10">
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 sm:gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <Sparkles className="w-3 h-3 text-secondary" />
                            <span className="text-[12px] font-bold text-secondary uppercase tracking-[0.15em] leading-tight">
                                Daily Horoscope
                            </span>
                        </div>
                        {!isGeneral && (
                            <h3 className="text-xl sm:text-2xl font-headline font-bold text-foreground leading-tight break-all sm:break-normal">
                                {horoscope.sign || 'Unknown'}
                            </h3>
                        )}
                    </div>

                    <div className="hidden sm:flex flex-col items-center px-4 border-l border-r border-secondary/5">
                        <span className="text-[12px] font-bold text-secondary uppercase tracking-[0.1em] mb-0.5">{dayName}</span>
                        <span className="text-sm font-headline font-bold text-foreground/60">{dateString}</span>
                    </div>

                    {/* Mobile Center Date - Better Spacing */}
                    <div className="sm:hidden flex flex-col items-end text-right pr-1">
                        <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.1em] leading-none mb-1">{dayName}</span>
                        <span className="text-[11px] font-headline font-bold text-foreground/50 leading-none">{dateString}</span>
                    </div>
                    {/* Circular Score Ring */}
                    <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex-shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                            {/* Background circle */}
                            <circle
                                cx="36"
                                cy="36"
                                r="32"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="6"
                                className="text-surface-variant/20"
                            />
                            {/* Progress circle */}
                            <circle
                                cx="36"
                                cy="36"
                                r="32"
                                fill="none"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={progress}
                                className="transition-all duration-[1500ms] cubic-bezier(0.2, 0, 0, 1)"
                                style={{ 
                                    stroke: score >= 80 ? '#D4A017' : score >= 60 ? '#E8832A' : '#E84A2A' 
                                }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-xl font-bold leading-none ${getScoreColor(score)}`}>
                                {score}
                            </span>
                            <span className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-0.5">
                                Overall
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`transition-all duration-700 ease-out ${showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.98]'}`}>
                    {/* Top Info Row - Dynamic Columns */}
                    <div className={`grid grid-cols-2 ${horoscope.dominant_planet ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} border-b border-outline-variant/30 bg-surface/5`}>
                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 border-r border-b sm:border-b-0 border-white/5">
                            <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest mb-1">Mood</span>
                            <span className="text-xs sm:text-sm font-headline font-bold text-foreground">
                                {horoscope.mood || 'Neutral'}
                            </span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-2 sm:p-3 sm:border-r border-b sm:border-b-0 border-white/8">
                            <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest mb-1 text-center leading-none">Lucky Color</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: luckyColorHex }}
                                />
                                <span className="text-xs sm:text-sm font-headline font-bold text-foreground">
                                    {horoscope.lucky_color ?? '—'}
                                </span>
                            </div>
                        </div>
                        <div className={`flex flex-col items-center justify-center p-2 sm:p-3 border-r sm:border-b-0 border-white/8 ${!horoscope.dominant_planet ? 'sm:border-r-0' : ''}`}>
                            <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest mb-1 text-center leading-none">Lucky #</span>
                            <span className="text-xs sm:text-sm font-headline font-bold text-foreground">
                                {horoscope.lucky_number ?? '—'}
                            </span>
                        </div>
                        {horoscope.dominant_planet && (
                            <div className="flex flex-col items-center justify-center p-2 sm:p-3">
                                <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest mb-1 text-center leading-none">Dominant</span>
                                <span className="text-xs sm:text-sm font-headline font-bold text-secondary">
                                    {horoscope.dominant_planet}
                                </span>
                            </div>
                        )}
                    </div>

                {/* Main Content Grid - Stacked on Mobile, 2x2 on Desktop */}
                <div className="grid grid-cols-1 sm:grid-cols-2">
                    {/* Career */}
                    <div className="p-3.5 sm:p-4.5 border-b sm:border-r border-outline-variant/30 hover:bg-surface/10 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                                <Briefcase className="w-3.5 h-3.5 text-orange-600" />
                            </div>
                            <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest">Career</span>
                        </div>
                        <p className="text-[15px] font-headline font-medium leading-relaxed text-foreground/90">
                            {horoscope.career || 'Keep pushing for your goals today.'}
                        </p>
                    </div>

                    {/* Love */}
                    <div className="p-3.5 sm:p-4.5 border-b border-outline-variant/30 hover:bg-surface/10 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center">
                                <Heart className="w-3.5 h-3.5 text-pink-600" />
                            </div>
                            <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest">Love</span>
                        </div>
                        <p className="text-[15px] font-headline font-medium leading-relaxed text-foreground/90">
                            {horoscope.love || 'Harmony flows through your relationships.'}
                        </p>
                    </div>

                    {/* Health */}
                    <div className="p-3.5 sm:p-4.5 border-b sm:border-b-0 sm:border-r border-outline-variant/30 hover:bg-surface/10 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <Activity className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest">Health</span>
                        </div>
                        <p className="text-[15px] font-headline font-medium leading-relaxed text-foreground/90">
                            {horoscope.health || 'Vitality and energy are on your side.'}
                        </p>
                    </div>

                    {/* Finance */}
                    <div className="p-3.5 sm:p-4.5 hover:bg-surface/10 transition-colors">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                <DollarSign className="w-3.5 h-3.5 text-yellow-600" />
                            </div>
                            <span className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest">Finance</span>
                        </div>
                        <p className="text-[15px] font-headline font-medium leading-relaxed text-foreground/90">
                            {horoscope.finance || 'Opportunities for growth are emerging.'}
                        </p>
                    </div>
                </div>

                {/* Tip of the Day - Centered Bottom */}
                <div className="p-4 sm:p-6 bg-surface/20 border-t border-outline-variant/30 flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center mb-2 border border-secondary/20">
                        <Sparkles className="w-3.5 h-3.5 text-secondary" />
                    </div>
                    <div className="text-[12px] font-bold text-secondary uppercase tracking-[0.2em] mb-2">Tip of the Day</div>
                    <p className="text-sm sm:text-base font-headline font-semibold italic leading-relaxed text-foreground max-w-md">
                        {horoscope.tip ? `"${horoscope.tip}"` : '—'}
                    </p>
                </div>
            </div>
        </Card>
    );
}
