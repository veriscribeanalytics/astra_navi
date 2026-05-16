'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { Activity, ChevronDown, AlertTriangle, X, Info } from 'lucide-react';
import { clientFetch } from '@/lib/apiClient';
import { catmullRomToBezier, catmullRomArea } from '@/utils/chartCurve';
import { useTranslation } from '@/hooks';
import { LOCALE_BY_LANGUAGE } from '@/locales';

interface DayForecast {
    date: string;
    is_today: boolean;
    score: number;
    text: string;
    dominant_planet: string;
    personalized_alerts: (string | { technical: string; simple: string })[];
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

const formatDate = (dateStr: string, language?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(LOCALE_BY_LANGUAGE[language || 'en'] || 'en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
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

export default function HealthForecastPanel() {
    const { t, language } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<HealthForecastData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);

    // Invalidate cached data when language changes so next toggle refetches
    useEffect(() => {
        setData(null);
        setError(null);
    }, [language]);

    const fetchForecast = async () => {
        if (data) {
            setIsOpen(true);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const res = await clientFetch(`/api/forecast-health?days_back=3&days_forward=3&lang=${language}`);
            if (!res.ok) throw new Error('Failed to fetch health forecast');
            const result = await res.json();
            setData(result);
            setIsOpen(true);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
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
                        : 'bg-surface border-outline-variant/20 hover:border-green-500/30 hover:bg-green-500/5'
                }`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOpen ? 'bg-green-500/20' : 'bg-surface-variant/30'}`}>
                        <Activity className={`w-4.5 h-4.5 ${isOpen ? 'text-green-400' : 'text-foreground/40'}`} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-[13px] font-bold text-foreground leading-tight">{t('healthForecast.title')}</h4>
                        <p className="text-[10px] text-foreground/30 font-medium">{t('healthForecast.subtitle')}</p>
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
                        <div className="px-4 sm:px-5 py-3 sm:py-4 bg-gradient-to-r from-green-500/8 to-emerald-500/5 border-b border-green-500/10">
                            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                                <div>
                                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                                        <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400" />
                                        <h3 className="text-[10px] sm:text-[12px] font-bold text-green-400 uppercase tracking-[0.15em] sm:tracking-[0.2em]">{t('healthForecast.overviewTitle')}</h3>
                                    </div>
                                    <p className="text-[9px] sm:text-[11px] text-foreground/35 font-medium">
                                        {data.moon_sign} Moon · {data.lagna_sign} Ascendant · {data.active_dasha}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <div className="text-center">
                                        <span className="text-lg sm:text-2xl font-headline font-bold text-green-400 leading-none">{data.summary.average_score}</span>
                                        <p className="text-[7px] sm:text-[9px] text-foreground/25 font-bold uppercase tracking-widest">{t('healthForecast.avgScore')}</p>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-sm sm:text-lg leading-none">{getTrendIcon(data.summary.trend)}</span>
                                        <p className="text-[7px] sm:text-[9px] text-foreground/25 font-bold uppercase tracking-widest capitalize">{data.summary.trend}</p>
                                    </div>
                                    <button onClick={() => setIsOpen(false)} className="w-7 h-7 rounded-full bg-surface flex items-center justify-center text-foreground/30 hover:text-foreground/60 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Score Timeline - Line Graph */}
                        <div className="px-3 sm:px-5 pt-8 sm:pt-12 pb-10 sm:pb-14 border-b border-outline-variant/10 relative bg-[#0a0c10]">
                            <div className="relative h-[100px] sm:h-[130px] w-full flex">
                                {/* SVG Line Chart Area */}
                                <div className="flex-1 relative">
                                    <svg className="absolute inset-0 w-full h-full overflow-visible" viewBox="0 0 100 100">
                                        <defs>
                                            <linearGradient id="lineAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="rgba(79, 209, 237, 0.3)" />
                                                <stop offset="100%" stopColor="rgba(10, 12, 16, 0.05)" />
                                            </linearGradient>
                                        </defs>

                                        {(() => {
                                            const points = data.days.map((d, i) => ({ x: (i / (data.days.length - 1)) * 100, y: 100 - d.score }));
                                            const pathD = catmullRomToBezier(points);
                                            const areaD = catmullRomArea(points, 100);

                                            const todayIndex = data.days.findIndex(d => d.is_today);
                                            const todayX = todayIndex !== -1 ? points[todayIndex].x : 50;

                                            return (
                                                <g>
                                                    {/* Horizontal Grid Lines */}
                                                    {[25, 50, 75, 100].map((level) => (
                                                        <line 
                                                            key={level} 
                                                            x1="0" y1={100 - level} x2="100" y2={100 - level} 
                                                            stroke="rgba(255, 255, 255, 0.03)" 
                                                            strokeWidth="0.5" 
                                                        />
                                                    ))}

                                                    {/* Past / Future Demarcation */}
                                                    <rect x="0" y="0" width={todayX} height="100" fill="#4fd1ed" fillOpacity="0.02" />
                                                    <rect x={todayX} y="0" width={100 - todayX} height="100" fill="#4fd1ed" fillOpacity="0.01" />
                                                    <line x1={todayX} y1="0" x2={todayX} y2="100" stroke="#4fd1ed" strokeOpacity="0.15" strokeDasharray="2 2" strokeWidth="0.5" />
                                                    
                                                    {/* Tiny demarc labels (placed slightly below to avoid cluttering top) */}
                                                    <text x={todayX - 2} y="15" textAnchor="end" fontSize="4" fill="#4fd1ed" fillOpacity="0.3">{t('healthForecast.past')}</text>
                                                    <text x={todayX + 2} y="15" textAnchor="start" fontSize="4" fill="#4fd1ed" fillOpacity="0.3">{t('healthForecast.forecast')}</text>


                                                    {/* Area Fill */}
                                                    <path
                                                        d={areaD}
                                                        fill="url(#lineAreaGradient)"
                                                    />

                                                    {/* Main Cyan Path */}
                                                    <path
                                                        d={pathD}
                                                        fill="none"
                                                        stroke="#4fd1ed"
                                                        strokeWidth="2.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />

                                                    {/* Data Points, Labels, and Interactivity */}
                                                    {data.days.map((day, i) => {
                                                        const p = points[i];
                                                        const isExpanded = expandedDay === day.date;
                                                        
                                                        return (
                                                            <g key={day.date} 
                                                               className="cursor-pointer group outline-none" 
                                                               onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                                                               onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedDay(isExpanded ? null : day.date); }}}
                                                               role="button"
                                                               tabIndex={0}
                                                            >
                                                                {/* Invisible Hit Area (approx 44x44 proportional to viewBox) */}
                                                                <rect x={p.x - 10} y={p.y - 10} width="20" height="20" fill="transparent" />

                                                                {/* Vertical Guide Line */}
                                                                <line x1={p.x} y1="0" x2={p.x} y2="100" stroke={day.is_today ? "rgba(79, 209, 237, 0.2)" : "rgba(255, 255, 255, 0.05)"} strokeWidth="0.5" />

                                                                {/* Score Label above point */}
                                                                <text x={p.x} y={p.y - 4} textAnchor="middle" 
                                                                    fontSize="7" fontWeight="bold"
                                                                    fill={day.is_today ? '#4fd1ed' : 'currentColor'}
                                                                    fillOpacity={day.is_today ? 1 : 0.5}
                                                                    className={`transition-all ${!day.is_today && 'group-hover:fill-opacity-80'}`}
                                                                >
                                                                    {day.score}
                                                                </text>

                                                                {/* Point Circles */}
                                                                {day.is_today && <circle cx={p.x} cy={p.y} r="5" fill="rgba(79,209,237,0.15)" className="animate-pulse" />}
                                                                <circle 
                                                                    cx={p.x} cy={p.y} 
                                                                    r={day.is_today ? 2 : 1}
                                                                    fill={day.is_today ? "#4fd1ed" : "#0a0c10"}
                                                                    stroke="#4fd1ed"
                                                                    strokeWidth={day.is_today ? 0 : 0.8}
                                                                    className={`transition-all ${!day.is_today && 'group-hover:fill-[#4fd1ed] group-hover:r-[1.5]'}`}
                                                                />

                                                                {/* Bottom X-Axis Date Label */}
                                                                <text x={p.x} y="112" textAnchor="middle" 
                                                                    fontSize="6" fontWeight="bold"
                                                                    fill={day.is_today ? '#4fd1ed' : 'currentColor'}
                                                                    fillOpacity={day.is_today ? 1 : 0.4}
                                                                >
                                                                    {day.is_today ? t('healthForecast.today') : new Date(day.date + 'T00:00:00').toLocaleDateString(LOCALE_BY_LANGUAGE[language || 'en'] || 'en', { weekday: 'short' })}
                                                                </text>
                                                                <text x={p.x} y="120" textAnchor="middle" 
                                                                    fontSize="5" fontWeight="normal"
                                                                    fill="currentColor" fillOpacity="0.25"
                                                                >
                                                                    {new Date(day.date + 'T00:00:00').getDate()}
                                                                </text>
                                                            </g>
                                                        );
                                                    })}
                                                </g>
                                            );
                                        })()}
                                    </svg>
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
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-8 sm:mt-14 pt-3 sm:pt-4 border-t border-outline-variant/8">
                                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-cyan-400/5 border border-cyan-400/10">
                                    <div className="w-1 sm:w-1.5 sm:h-1.5 h-1 rounded-full bg-cyan-400 shadow-[0_0_5px_rgba(79,209,237,0.5)]" />
                                    <span className="text-[8px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{t('healthForecast.auraPeak')}</span>
                                    <span className="text-[8px] sm:text-[10px] font-bold text-cyan-400">{formatDate(data.summary.best_day, language)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-400/5 border border-amber-400/10">
                                    <div className="w-1 sm:w-1.5 sm:h-1.5 h-1 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                                    <span className="text-[8px] sm:text-[10px] font-bold text-foreground/40 uppercase tracking-widest">{t('healthForecast.vedaLull')}</span>
                                    <span className="text-[8px] sm:text-[10px] font-bold text-amber-400">{formatDate(data.summary.worst_day, language)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Day Details (Expanded) */}
                        {expandedDay && (() => {
                            const day = data.days.find(d => d.date === expandedDay);
                            if (!day) return null;
                            const colors = getScoreColor(day.score);
                            return (
                                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-outline-variant/10 bg-surface">
                                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                                        <div className="flex items-center gap-2 sm:gap-2.5">
                                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl ${colors.bg} flex items-center justify-center`}>
                                                <span className={`text-xs sm:text-sm font-bold ${colors.text}`}>{day.score}</span>
                                            </div>
                                            <div>
                                                <h5 className="text-[11px] sm:text-[13px] font-bold text-foreground leading-tight">
                                                    {formatDate(day.date, language)} {day.is_today && <span className="text-green-400 text-[9px] sm:text-[10px] ml-1">{t('healthForecast.todayLabel')}</span>}
                                                </h5>
                                                <p className="text-[9px] sm:text-[10px] text-foreground/30">{t('healthForecast.dominant')} {day.dominant_planet}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setExpandedDay(null)} className="text-foreground/20 hover:text-foreground/40">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <p className="text-[11px] sm:text-[13px] text-foreground/60 font-medium leading-relaxed mb-2 sm:mb-3">{day.text}</p>
                                    
                                    {/* Alerts */}
                                    {day.personalized_alerts.length > 0 && (
                                        <div className="flex flex-col gap-1.5 mb-3">
                                            {day.personalized_alerts.map((alert, i) => {
                                                const isObject = typeof alert === 'object' && alert !== null;
                                                const simpleText = (isObject ? alert.simple : alert) || 'Health alignment in progress';
                                                const techText = isObject ? alert.technical : null;
                                                const isWarning = simpleText.toLowerCase().includes('challenging') || simpleText.toLowerCase().includes('mindful') || simpleText.toLowerCase().includes('caution');
                                                
                                                return (
                                                    <div key={i} className="flex items-start gap-2 text-[11px] group/alert">
                                                        <Info className={`w-3 h-3 mt-0.5 shrink-0 ${isWarning ? 'text-amber-400' : 'text-green-400/70'}`} />
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-foreground/45 leading-snug">{simpleText}</span>
                                                            {techText && (
                                                                <span className="text-[9px] text-foreground/20 font-bold uppercase tracking-widest mt-0.5 opacity-0 group-hover/alert:opacity-100 transition-opacity duration-300">
                                                                    {techText}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Transit Grid */}
                                    <div className="mt-2">
                                        <p className="text-[8px] sm:text-[9px] font-bold text-foreground/20 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1.5 sm:mb-2">{t('healthForecast.planetaryTransits')}</p>
                                        <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                            {Object.entries(day.transits).map(([planet, transit]) => (
                                                <span key={planet} className="inline-flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-surface border border-outline-variant/8">
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
                                <p className="text-[12px] font-bold text-red-400">{t('healthForecast.loadError')}</p>
                                <p className="text-[11px] text-foreground/40">{error}</p>
                            </div>
                            <button onClick={fetchForecast} className="ml-auto text-[10px] font-bold text-secondary uppercase tracking-widest hover:text-white transition-colors">{t('healthForecast.retry')}</button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}
