import React from 'react';
import Card from '../ui/Card';

const services = [
  {
    icon: '📿',
    title: 'Free Kundli',
    desc: 'Vedic birth chart with Lagna & Dashas',
    badge: 'FREE',
    iconBg: 'bg-secondary/10',
  },
  {
    icon: '🤖',
    title: 'AI Astrologer',
    desc: 'Chat 24/7 in Hindi & English',
    badge: '',
    iconBg: 'bg-primary/10 dark:bg-primary/20',
  },
  {
    icon: '🌙',
    title: 'Daily Horoscope',
    desc: 'Rashi-based daily + weekly reading',
    badge: '',
    iconBg: 'bg-secondary/10',
  },
  {
    icon: '💑',
    title: 'Kundli Matching',
    desc: '36-gun Milan + Dosha check',
    badge: 'HOT',
    iconBg: 'bg-red-500/10 text-red-500',
  },
  {
    icon: '📅',
    title: 'Panchang',
    desc: 'Tithi, Nakshatra, Muhurat daily',
    badge: '',
    iconBg: 'bg-teal-500/10 text-teal-500',
  },
  {
    icon: '💎',
    title: 'Gemstone Report',
    desc: 'Personalised gem recommendations',
    badge: '',
    iconBg: 'bg-secondary/10',
  },
];

const Services = () => {
    return (
        <section className="px-4 sm:px-6 lg:px-12 w-full max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-row justify-between items-end mb-4 sm:mb-6">
                <div>
                    <div className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-secondary uppercase mb-1.5 sm:mb-2">
                        What We Offer
                    </div>
                    <h2 className="font-headline text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                        All tools in one place
                    </h2>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-secondary hover:underline cursor-pointer hidden sm:block">
                    View all &rarr;
                </span>
            </div>

            {/* Grid with Scroll Fade Mask */}
            <div className="relative group">
                <div className="overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6">
                    <div className="flex lg:grid lg:grid-cols-6 gap-3 sm:gap-6 min-w-max lg:min-w-0 h-full">
                        {services.map((svc, idx) => (
                            <Card
                                key={idx}
                                variant="bordered"
                                className="w-[140px] sm:w-[160px] md:w-[180px] lg:w-auto h-full flex flex-col items-start transition-all"
                            >
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-3 sm:mb-5 bg-secondary/10">
                                    {svc.icon}
                                </div>
                                <h3 className="font-headline font-bold text-xs sm:text-sm text-primary flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                                    {svc.title}
                                    {svc.badge && (
                                        <span className="text-[8px] sm:text-[9px] bg-secondary/10 text-secondary px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                            {svc.badge}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[10px] sm:text-xs text-on-surface-variant leading-relaxed opacity-80 h-8 sm:h-10 overflow-hidden line-clamp-3">
                                    {svc.desc}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
                {/* Scroll Fade Overlay - visible only on mobile/touch layout when scrollable */}
                <div className="absolute top-0 right-0 bottom-4 w-10 sm:w-12 bg-gradient-to-l from-background to-transparent pointer-events-none lg:hidden" />
            </div>
        </section>
    );
};

export default Services;
