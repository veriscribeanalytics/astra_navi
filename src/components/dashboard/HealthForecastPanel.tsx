'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import { Activity, TrendingUp, ChevronDown, AlertTriangle, CheckCircle, Sparkles, X, Info } from 'lucide-react';

interface DayForecast {
    date: string;
    is_today: boolean;
    score: number;
    text: string;
    dominant_planet: string;
    personalized_alerts: string[];
    transits: Record<string, { sign: string; house_from_moon: number; house_from_lagna: number }>;
}

interface HealthForecastData {
    area: string;
    name: string;
    moon_sign: string;
    lagna_sign: string;
    active_dasha: string;
    today: string;
    days: DayForecast[];
    summary: {
        best_day: string;
        worst_day: string;
        average_score: number;
        trend: string;
    };
}

interface HealthForecastPanelProps {
    email: string;
}

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
};

const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-cyan-400', bg: 'bg-cyan-500/15', border: 'border-cyan-500/20', bar: 'bg-cyan-500' };
    if (score >= 65) return { text: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/20', bar: 'bg-amber-500' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/15', border: 'border-rose-500/20', bar: 'bg-rose-500' };
};

const getTrendIcon = (trend: string) => {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
};

export default function HealthForecastPanel({ email }: HealthForecastPanelProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<HealthForecastData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    const fetchForecast = async () => {
        if (data) {
            setIsOpen(true);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/forecast-health?email=${encodeURIComponent(email)}&days_back=3&days_forward=3`);
            if (!res.ok) throw new Error('Failed to fetch health forecast');
            const result = await res.json();
            setData(result);
            setIsOpen(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = () => {
        if (!isOpen) {
            fetchForecast();
        } else {
            setIsOpen(false);
        }
    };

    return (
        <div className="mt-6">
            {/* Trigger Button */}
            <button
                onClick={handleToggle}
                disabled={loading}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-[20px] border transition-all duration-300 ${
                    isOpen
                        ? 'bg-green-500/10 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)]'
                        : 'bg-surface/40 border-outline-variant/20 hover:border-green-500/30 hover:bg-green-500/5'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOpen ? 'bg-green-500/20' : 'bg-surface-variant/30'}`}>
                        <Activity className={`w-4.5 h-4.5 ${isOpen ? 'text-green-400' : 'text-foreground/40'}`} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-[13px] font-bold text-foreground leading-tight">Health Forecast</h4>
                        <p className="text-[10px] text-foreground/30 font-medium">Compare last 3 days · Today · Next 3 days</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {loading && (
                        <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                    )}
                    {data && !isOpen && (
                        <span className="text-[10px] font-bold text-green-400 bg-green-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">Avg {data.summary.average_score}</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-foreground/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Expanded Panel */}
            <div className={`overflow-hidden transition-all duration-500 ease-out ${isOpen && data ? 'max-h-[2000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
                {data && (
                    <Card padding="none" className="!rounded-[24px] overflow-hidden border-green-500/15">
                        {/* Summary Header */}
                        <div className="px-5 py-4 bg-gradient-to-r from-green-500/8 to-emerald-500/5 border-b border-green-500/10">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Activity className="w-4 h-4 text-green-400" />
                                        <h3 className="text-[12px] font-bold text-green-400 uppercase tracking-[0.2em]">7-Day Health Overview</h3>
                                    </div>
                                    <p className="text-[11px] text-foreground/35 font-medium">
                                        {data.moon_sign} Moon · {data.lagna_sign} Ascendant · {data.active_dasha}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-center">
                                        <span className="text-2xl font-headline font-bold text-green-400 leading-none">{data.summary.average_score}</span>
                                        <p className="text-[9px] text-foreground/25 font-bold uppercase tracking-widest">Avg Score</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-lg leading-none">{getTrendIcon(data.summary.trend)}</span>
                                        <p className="text-[9px] text-foreground/25 font-bold uppercase tracking-widest capitalize">{data.summary.trend}</p>
                                    </div>
                                    <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-full bg-surface/30 flex items-center justify-center text-foreground/30 hover:text-foreground/60 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Score Timeline - Line Graph */}
                        <div className="px-5 pt-12 pb-14 border-b border-outline-variant/10 relative overflow-hidden bg-[#0a0c10]/40">
                            <div className="relative h-[130px] w-full flex">
                                {/* SVG Line Chart Area */}
                                <div className="flex-1 relative">
                                    <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                                        <defs>
                                            <linearGradient id="lineAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="rgba(79, 209, 237, 0.2)" />
                                                <stop offset="100%" stopColor="rgba(10, 12, 16, 0.1)" />
                                            </linearGradient>
                                        </defs>

                                        {/* Horizontal Grid Lines */}
                                        {[25, 50, 75, 100].map((level) => (
                                            <line 
                                                key={level} 
                                                x1="0" y1={100 - level} x2="100" y2={100 - level} 
                                                stroke="rgba(255, 255, 255, 0.03)" 
                                                strokeWidth="0.5" 
                                            />
                                        ))}

                                        {/* Area Fill */}
                                        <path
                                            d={`M 0 100 ${data.days.map((day, i) => `L ${(i / (data.days.length - 1)) * 100} ${100 - day.score}`).join(' ')} L 100 100 Z`}
                                            fill="url(#lineAreaGradient)"
                                            className="transition-all duration-1000 ease-in-out"
                                        />

                                        {/* Main Cyan Path */}
                                        <path
                                            d={data.days.map((day, i) => `${i === 0 ? 'M' : 'L'} ${(i / (data.days.length - 1)) * 100} ${100 - day.score}`).join(' ')}
                                            fill="none"
                                            stroke="#4fd1ed"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="transition-all duration-[1200ms]"
                                        />
                                    </svg>

                                    {/* HTML Overlay for Points, Labels, and Vertical Guides */}
                                    <div className="absolute inset-0 w-full h-full pointer-events-none">
                                        {data.days.map((day, i) => {
                                            const left = `${(i / (data.days.length - 1)) * 100}%`;
                                            const top = `${100 - day.score}%`;
                                            const isExpanded = expandedDay === day.date;
                                            return (
                                                <div 
                                                    key={day.date} 
                                                    className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center"
                                                    style={{ left, width: '0px' }}
                                                >
                                                    {/* Vertical Guide Line */}
                                                    <div className={`absolute top-0 bottom-0 w-px ${day.is_today ? 'bg-cyan-400/20' : 'bg-white/5'}`} />

                                                    {/* Data Point Wrapper */}
                                                    <div 
                                                        className="absolute flex flex-col items-center justify-center pointer-events-auto group cursor-pointer z-20"
                                                        style={{ 
                                                            top, 
                                                            left: '0px',
                                                            transform: 'translate(-50%, -50%)',
                                                            width: '48px',
                                                            height: '48px'
                                                        }}
                                                        onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                                                    >
                                                        {/* Score Label above point */}
                                                        <span className={`absolute -top-1 text-[12px] font-bold transition-colors ${day.is_today ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(79,209,237,0.8)]' : 'text-foreground/50 group-hover:text-foreground/80'}`}>
                                                            {day.score}
                                                        </span>

                                                        {/* Dot Container */}
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            {/* Outer Aura */}
                                                            <div className={`absolute w-8 h-8 rounded-full bg-cyan-400/15 transition-all ${day.is_today ? 'opacity-100 scale-100 animate-pulse' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`} />

                                                            {/* Main Point Ring */}
                                                            <div 
                                                                className={`relative rounded-full transition-all duration-300 ${
                                                                    day.is_today 
                                                                        ? 'w-3.5 h-3.5 bg-cyan-400 shadow-[0_0_12px_rgba(79,209,237,1)] ring-[2px] ring-white/40' 
                                                                        : 'w-2.5 h-2.5 bg-[#0a0c10] border-[2px] border-cyan-400/80 group-hover:border-cyan-300 group-hover:bg-cyan-400 group-hover:scale-[1.3]'
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Bottom X-Axis Date Label */}
                                                    <div className="absolute -bottom-[36px] w-[60px] flex flex-col items-center text-center transform translate-x-[-50%]">
                                                        <div className={`text-[10px] font-bold ${day.is_today ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(79,209,237,0.5)]' : 'text-foreground/40'} uppercase tracking-tight`}>
                                                            {day.is_today ? 'Today' : new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}
                                                        </div>
                                                        <div className="text-[9px] text-foreground/25 font-medium">{new Date(day.date + 'T00:00:00').getDate()}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Y-Axis Score Labels */}
                                <div className="w-8 ml-4 flex flex-col justify-between items-end text-[8px] font-bold text-foreground/15 py-0.5">
                                    <span>100</span>
                                    <span>75</span>
                                    <span>50</span>
                                    <span>25</span>
                                    <span>0</span>
                                </div>
                            </div>

                            {/* Best / Worst Day Badges */}
                            <div className="flex flex-wrap items-center gap-3 mt-14 pt-4 border-t border-outline-variant/8">
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/5 border border-cyan-400/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(79,209,237,0.5)]" />
                                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Aura Peak:</span>
                                    <span className="text-[10px] font-bold text-cyan-400">{formatDate(data.summary.best_day)}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/5 border border-amber-400/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                                    <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Veda Lull:</span>
                                    <span className="text-[10px] font-bold text-amber-400">{formatDate(data.summary.worst_day)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Day Details (Expanded) */}
                        {expandedDay && (() => {
                            const day = data.days.find(d => d.date === expandedDay);
                            if (!day) return null;
                            const colors = getScoreColor(day.score);
                            return (
                                <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface/5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-xl ${colors.bg} flex items-center justify-center`}>
                                                <span className={`text-sm font-bold ${colors.text}`}>{day.score}</span>
                                            </div>
                                            <div>
                                                <h5 className="text-[13px] font-bold text-foreground leading-tight">
                                                    {formatDate(day.date)} {day.is_today && <span className="text-green-400 text-[10px] ml-1">· TODAY</span>}
                                                </h5>
                                                <p className="text-[10px] text-foreground/30">Dominant: {day.dominant_planet}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setExpandedDay(null)} className="text-foreground/20 hover:text-foreground/40">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-[13px] text-foreground/60 font-medium leading-relaxed mb-3">{day.text}</p>
                                    
                                    {/* Alerts */}
                                    {day.personalized_alerts.length > 0 && (
                                        <div className="flex flex-col gap-1.5 mb-3">
                                            {day.personalized_alerts.map((alert, i) => (
                                                <div key={i} className="flex items-start gap-2 text-[11px]">
                                                    <Info className={`w-3 h-3 mt-0.5 shrink-0 ${alert.includes('challenging') ? 'text-amber-400' : 'text-green-400/70'}`} />
                                                    <span className="text-foreground/45 leading-snug">{alert}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Transit Grid */}
                                    <div className="mt-2">
                                        <p className="text-[9px] font-bold text-foreground/20 uppercase tracking-[0.2em] mb-2">Planetary Transits</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(day.transits).map(([planet, transit]) => (
                                                <span key={planet} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-surface/30 border border-outline-variant/8">
                                                    <span className="text-foreground/50">{planet}</span>
                                                    <span className="text-foreground/20">·</span>
                                                    <span className="text-secondary/70">{transit.sign}</span>
                                                    <span className="text-foreground/15">H{transit.house_from_lagna}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}


                    </Card>
                )}

                {error && (
                    <Card padding="md" className="!rounded-[20px] mt-3 border-red-500/20 bg-red-500/5">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                            <div>
                                <p className="text-[12px] font-bold text-red-400">Failed to load health forecast</p>
                                <p className="text-[11px] text-foreground/40">{error}</p>
                            </div>
                            <button onClick={fetchForecast} className="ml-auto text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-white transition-colors">Retry</button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
