'use client';

import Link from 'next/link';
import Card from '@/components/ui/Card';
import { BookOpen, Sparkles, Calendar, Users, Gem, Heart, Brain, Clock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const blogCategories = [
    {
        id: 'rashis',
        title: 'The 12 Rashis',
        description: 'Explore detailed information about all 12 Vedic zodiac signs, their characteristics, and cosmic influences.',
        icon: <Sparkles className="w-6 h-6" />,
        href: '/rashis',
        status: 'available',
        color: 'from-secondary/20 to-amber-500/20 border-secondary/30',
        iconBg: 'bg-secondary/10',
        iconColor: 'text-secondary'
    },
    {
        id: 'planets',
        title: 'Navagraha - The Nine Planets',
        description: 'Understanding the influence of Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, and Ketu in Vedic astrology.',
        icon: <Calendar className="w-6 h-6" />,
        href: '/blogs/planets',
        status: 'available',
        color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
        iconBg: 'bg-blue-500/10',
        iconColor: 'text-blue-600'
    },
    {
        id: 'houses',
        title: 'The 12 Houses (Bhavas)',
        description: 'Learn about the 12 houses in your birth chart and what each house represents in your life journey.',
        icon: <Gem className="w-6 h-6" />,
        href: '/blogs/houses',
        status: 'available',
        color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
        iconBg: 'bg-purple-500/10',
        iconColor: 'text-purple-600'
    },
    {
        id: 'nakshatras',
        title: 'The 27 Nakshatras',
        description: 'Discover the lunar mansions and their profound impact on personality, destiny, and life events.',
        icon: <Sparkles className="w-6 h-6" />,
        href: '/blogs/nakshatras',
        status: 'available',
        color: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/30',
        iconBg: 'bg-indigo-500/10',
        iconColor: 'text-indigo-600'
    },
    {
        id: 'dashas',
        title: 'Dasha Systems',
        description: 'Understanding planetary periods (Mahadasha, Antardasha) and their timing of life events.',
        icon: <Clock className="w-6 h-6" />,
        href: '/blogs/dashas',
        status: 'coming-soon',
        color: 'from-orange-500/20 to-red-500/20 border-orange-500/30',
        iconBg: 'bg-orange-500/10',
        iconColor: 'text-orange-600'
    },
    {
        id: 'yogas',
        title: 'Planetary Yogas',
        description: 'Explore powerful planetary combinations that shape fortune, success, and spiritual growth.',
        icon: <Brain className="w-6 h-6" />,
        href: '/blogs/yogas',
        status: 'available',
        color: 'from-green-500/20 to-teal-500/20 border-green-500/30',
        iconBg: 'bg-green-500/10',
        iconColor: 'text-green-600'
    },
    {
        id: 'compatibility',
        title: 'Relationship Compatibility',
        description: 'Learn about Kundli matching, Guna Milan, and astrological compatibility for relationships.',
        icon: <Heart className="w-6 h-6" />,
        href: '/blogs/compatibility',
        status: 'coming-soon',
        color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
        iconBg: 'bg-pink-500/10',
        iconColor: 'text-pink-600'
    },
    {
        id: 'remedies',
        title: 'Vedic Remedies',
        description: 'Discover gemstones, mantras, rituals, and other remedies to balance planetary influences.',
        icon: <Gem className="w-6 h-6" />,
        href: '/blogs/remedies',
        status: 'coming-soon',
        color: 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30',
        iconBg: 'bg-yellow-500/10',
        iconColor: 'text-yellow-600'
    },
    {
        id: 'transits',
        title: 'Planetary Transits',
        description: 'Understanding current planetary movements and their effects on your daily life.',
        icon: <Calendar className="w-6 h-6" />,
        href: '/blogs/transits',
        status: 'coming-soon',
        color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
        iconBg: 'bg-cyan-500/10',
        iconColor: 'text-cyan-600'
    },
    {
        id: 'muhurta',
        title: 'Muhurta - Auspicious Timing',
        description: 'Learn to choose the most favorable times for important life events and decisions.',
        icon: <Clock className="w-6 h-6" />,
        href: '/blogs/muhurta',
        status: 'coming-soon',
        color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30',
        iconBg: 'bg-violet-500/10',
        iconColor: 'text-violet-600'
    },
    {
        id: 'divisional-charts',
        title: 'Divisional Charts (Vargas)',
        description: 'Explore Navamsha, Dasamsa, and other divisional charts for deeper astrological insights.',
        icon: <Brain className="w-6 h-6" />,
        href: '/blogs/divisional-charts',
        status: 'coming-soon',
        color: 'from-teal-500/20 to-green-500/20 border-teal-500/30',
        iconBg: 'bg-teal-500/10',
        iconColor: 'text-teal-600'
    },
    {
        id: 'astrologers',
        title: 'Famous Astrologers',
        description: 'Learn from the wisdom of legendary Vedic astrologers and their contributions.',
        icon: <Users className="w-6 h-6" />,
        href: '/blogs/astrologers',
        status: 'coming-soon',
        color: 'from-red-500/20 to-orange-500/20 border-red-500/30',
        iconBg: 'bg-red-500/10',
        iconColor: 'text-red-600'
    }
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.33, 1, 0.68, 1] } }
} as const;

export default function BlogsPage() {
    return (
        <div className="min-h-screen bg-[var(--bg)] pt-24 safe-bottom-buffer px-4 relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-secondary/5 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[35%] h-[35%] bg-primary/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-16 sm:mb-24"
                >
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-secondary/20 bg-secondary/5 text-secondary text-[10px] font-bold tracking-[0.2em] uppercase mb-8 shadow-sm">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                        >
                            <BookOpen className="w-4 h-4" />
                        </motion.div>
                        The Library of Wisdom
                    </div>
                    <h1 className="text-4xl sm:text-6xl lg:text-8xl font-headline font-bold text-foreground mb-6 tracking-tight break-words">
                        Ancient Science, <br />
                        <span className="text-secondary italic">Modern</span> Insight
                    </h1>
                    <p className="text-lg sm:text-xl text-foreground/50 max-w-3xl mx-auto leading-relaxed">
                        Journey through the vast ocean of Vedic knowledge. From planetary movements to spiritual remedies, discover the keys to your cosmic existence.
                    </p>
                </motion.div>

                {/* Categories Grid */}
                <motion.div 
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-50px" }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {blogCategories.map((category) => (
                        <motion.div key={category.id} variants={item}>
                            <Link
                                href={category.status === 'available' ? category.href : '#'}
                                className={`group block h-full relative ${category.status === 'coming-soon' ? 'cursor-not-allowed opacity-70' : ''}`}
                            >
                                <Card 
                                    padding="none" 
                                    className={`!rounded-[32px] glass-panel transition-all duration-500 h-full overflow-hidden ${
                                        category.status === 'available' 
                                            ? 'hover:border-secondary/40 hover:shadow-[0_20px_50px_rgba(200,136,10,0.1)] hover:-translate-y-2' 
                                            : ''
                                    }`}
                                >
                                    <div className="p-8 flex flex-col h-full relative z-10">
                                        {/* Category Decorative Accent */}
                                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${category.color} blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                                        {/* Icon Header */}
                                        <div className="flex items-start justify-between mb-8">
                                            <div className={`w-14 h-14 rounded-2xl ${category.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                                                <div className={`${category.iconColor} group-hover:animate-pulse`}>
                                                    {category.icon}
                                                </div>
                                            </div>
                                            
                                            {category.status === 'available' ? (
                                                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                                                    <ArrowRight className="w-5 h-5" />
                                                </div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/40">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Text Content */}
                                        <div className="flex-grow">
                                            <h3 className="text-2xl font-headline font-bold text-foreground mb-3 group-hover:text-secondary transition-colors duration-300">
                                                {category.title}
                                            </h3>
                                            <p className="text-sm text-foreground/60 leading-relaxed mb-6">
                                                {category.description}
                                            </p>
                                        </div>

                                        {/* Footer / Meta */}
                                        <div className="pt-6 border-t border-secondary/5 mt-auto">
                                            <div className="flex items-center justify-between">
                                                {category.status === 'available' ? (
                                                    <span className="text-[10px] font-bold text-secondary tracking-widest uppercase flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                                                        Live Guide
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-foreground/40 tracking-widest uppercase flex items-center gap-2">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-foreground/20"></span>
                                                        In Production
                                                    </span>
                                                )}
                                                
                                                {category.status === 'available' && (
                                                    <span className="text-xs font-bold text-foreground/40 group-hover:text-foreground transition-colors">
                                                        Read Story
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Bottom CTA / Newsletter Style Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-24"
                >
                    <Card padding="none" className="!rounded-[40px] border-none bg-gradient-to-br from-[#1a1233] via-[#0b071a] to-secondary/10 overflow-hidden relative">
                        {/* Decorative Background for CTA */}
                        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>
                        <div className="absolute top-[-50%] right-[-10%] w-[60%] h-[120%] bg-secondary/10 blur-[100px] rounded-full"></div>
                        
                        <div className="p-12 sm:p-20 text-center relative z-10">
                            <div className="w-20 h-20 rounded-3xl bg-white/5 backdrop-blur-xl flex items-center justify-center mx-auto mb-8 border border-white/10 shadow-2xl">
                                <Brain className="w-10 h-10 text-secondary" />
                            </div>
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold text-white mb-6">
                                Can't find what you're <br />
                                <span className="text-secondary italic">looking for?</span>
                            </h2>
                            <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
                                Our Celestial Library is expanding every week. If you have a specific question about your chart, Navi has the answers ready for you now.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-sm mx-auto sm:max-w-none">
                                <Link href="/chat" className="w-full sm:w-auto">
                                    <button className="w-full justify-center px-6 sm:px-10 py-4 sm:py-5 rounded-2xl bg-secondary text-white font-bold hover:bg-secondary/90 transition-all shadow-[0_10px_30px_rgba(200,136,10,0.3)] hover:scale-105 active:scale-95 flex items-center gap-2">
                                        Ask Navi Anything <Sparkles className="w-5 h-5" />
                                    </button>
                                </Link>
                                <button className="w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 rounded-2xl bg-white/5 text-white font-bold border border-white/10 hover:bg-white/10 transition-all">
                                    Subscribe for Updates
                                </button>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* Footer Info */}
                <p className="text-center mt-12 text-sm text-foreground/30 font-medium tracking-wide">
                    © 2026 ASTRANAVI · THE COSMIC ARCHIVE
                </p>
            </div>
        </div>
    );
}
