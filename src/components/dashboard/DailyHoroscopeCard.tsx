'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import { Sparkles, Heart, Briefcase, Activity, DollarSign, Lightbulb } from 'lucide-react';

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

interface DailyHoroscopeCardProps {
    email: string;
}

export default function DailyHoroscopeCard({ email }: DailyHoroscopeCardProps) {
    const [horoscope, setHoroscope] = useState<HoroscopeData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHoroscope = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/daily-horoscope?email=${encodeURIComponent(email)}`);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch horoscope');
                }

                const data = await response.json();
                setHoroscope(data);
                setError(null);
            } catch (err) {
                console.error('Horoscope fetch error:', err);
                setError('Unable to load daily horoscope');
            } finally {
                setLoading(false);
            }
        };

        if (email) {
            fetchHoroscope();
        }
    }, [email]);

    if (loading) {
        return (
            <Card padding="md" className="!rounded-[28px] sm:!rounded-[40px] border border-secondary/20 animate-pulse">
                <div className="h-64 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-secondary animate-spin" />
                </div>
            </Card>
        );
    }

    if (error || !horoscope) {
        return null;
    }

    const getScoreColor = (score: number) => {
        if (score >= 75) return 'text-green-500';
        if (score >= 50) return 'text-yellow-500';
        return 'text-orange-500';
    };

    return (
        <Card padding="none" className="!rounded-[28px] sm:!rounded-[40px] overflow-hidden border border-secondary/20 relative">
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent p-6 sm:p-8 border-b border-secondary/10">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-5 h-5 text-secondary" />
                            <h3 className="text-lg sm:text-xl font-headline font-bold text-foreground">
                                Daily Horoscope
                            </h3>
                        </div>
                        <p className="text-sm text-foreground/60 font-medium">
                            {horoscope.sign || 'Unknown'} • {horoscope.date ? new Date(horoscope.date).toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric' 
                            }) : 'Today'}
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <div className={`text-3xl font-bold ${getScoreColor(horoscope.overall_score || 50)}`}>
                            {horoscope.overall_score || 50}
                        </div>
                        <div className="text-xs text-foreground/50 font-medium">Overall</div>
                    </div>
                </div>

                {/* Mood and Lucky Info */}
                <div className="flex gap-3 mt-4">
                    <div className="flex-1 bg-surface/50 backdrop-blur-sm rounded-2xl p-3 border border-secondary/10">
                        <div className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider mb-1">
                            Mood
                        </div>
                        <div className="text-sm font-bold text-secondary">{horoscope.mood || 'Balanced'}</div>
                    </div>
                    <div className="flex-1 bg-surface/50 backdrop-blur-sm rounded-2xl p-3 border border-secondary/10">
                        <div className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider mb-1">
                            Lucky Color
                        </div>
                        <div className="flex items-center gap-2">
                            <div 
                                className="w-4 h-4 rounded-full border-2 border-white/20" 
                                style={{ backgroundColor: horoscope.lucky_color?.toLowerCase() || '#c8880a' }}
                            />
                            <div className="text-sm font-bold text-foreground">{horoscope.lucky_color || 'Gold'}</div>
                        </div>
                    </div>
                    <div className="flex-1 bg-surface/50 backdrop-blur-sm rounded-2xl p-3 border border-secondary/10">
                        <div className="text-[10px] text-foreground/50 font-bold uppercase tracking-wider mb-1">
                            Lucky #
                        </div>
                        <div className="text-sm font-bold text-secondary">{horoscope.lucky_number || 7}</div>
                    </div>
                </div>
            </div>

            {/* Content sections */}
            <div className="p-6 sm:p-8 space-y-4">
                {/* Career */}
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1">
                            Career
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{horoscope.career || 'Focus on your goals today.'}</p>
                    </div>
                </div>

                {/* Love */}
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                        <Heart className="w-5 h-5 text-pink-500" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1">
                            Love
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{horoscope.love || 'Good day for relationships.'}</p>
                    </div>
                </div>

                {/* Health */}
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1">
                            Health
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{horoscope.health || 'Take care of your wellbeing.'}</p>
                    </div>
                </div>

                {/* Finance */}
                <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-foreground/70 uppercase tracking-wider mb-1">
                            Finance
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed">{horoscope.finance || 'Be mindful of expenses.'}</p>
                    </div>
                </div>

                {/* Tip of the day */}
                <div className="mt-6 p-4 bg-secondary/5 rounded-2xl border border-secondary/20">
                    <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                        <div>
                            <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">
                                Tip of the Day
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                                {horoscope.tip || 'Trust your intuition.'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}
