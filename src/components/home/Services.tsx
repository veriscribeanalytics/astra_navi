import React from 'react';
import Card from '../ui/Card';

const services = [
  {
    icon: '📿',
    title: 'Complete Kundli',
    desc: 'Full birth chart with Lagna, Navamsha & Dashas',
    badge: '',
    iconBg: 'bg-secondary/10',
    available: true,
  },
  {
    icon: '🤖',
    title: 'Navi Consultation',
    desc: 'Ask anything, anytime—Hindi & English',
    badge: '',
    iconBg: 'bg-primary/10 dark:bg-primary/20',
    available: true,
  },
  {
    icon: '🌙',
    title: 'Rashi Predictions',
    desc: 'Daily & weekly forecasts for your Moon sign',
    badge: 'Coming Soon',
    iconBg: 'bg-secondary/10',
    available: false,
  },
  {
    icon: '💑',
    title: 'Compatibility',
    desc: '36-gun Milan & Dosha analysis',
    badge: 'Coming Soon',
    iconBg: 'bg-red-500/10 text-red-500',
    available: false,
  },
  {
    icon: '📅',
    title: 'Panchang',
    desc: 'Tithi, Nakshatra, auspicious timings',
    badge: 'Coming Soon',
    iconBg: 'bg-teal-500/10 text-teal-500',
    available: false,
  },
  {
    icon: '💎',
    title: 'Remedial Gems',
    desc: 'Personalized gemstone recommendations',
    badge: 'Coming Soon',
    iconBg: 'bg-secondary/10',
    available: false,
  },
];

const Services = () => {
    return (
        <section className="px-4 sm:px-6 md:px-8 lg:px-12 w-full max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-row justify-between items-end mb-4 sm:mb-5 md:mb-6">
                <div>
                    <div className="text-[10px] sm:text-[10px] md:text-xs font-bold tracking-[0.18em] sm:tracking-[0.2em] text-secondary uppercase mb-1.5 sm:mb-2">
                        What Navi Offers
                    </div>
                    <h2 className="font-headline text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-primary">
                        Your Complete Jyotish Toolkit
                    </h2>
                </div>
            </div>

            {/* Grid with Scroll Fade Mask */}
            <div className="relative group">
                <div className="overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 md:-mx-8 md:px-8">
                    <div className="flex lg:grid lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6 min-w-max lg:min-w-0 h-full">
                        {services.map((svc, idx) => (
                            <Card
                                key={idx}
                                variant="bordered"
                                className={`w-[135px] sm:w-[150px] md:w-[170px] lg:w-auto h-full flex flex-col items-start transition-all ${!svc.available ? 'opacity-60' : ''}`}
                            >
                                <div className="w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-xl md:rounded-2xl flex items-center justify-center text-xl sm:text-xl md:text-2xl mb-3 sm:mb-4 md:mb-5 bg-secondary/10">
                                    {svc.icon}
                                </div>
                                <h3 className="font-headline font-bold text-xs sm:text-sm text-primary flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 md:mb-2">
                                    {svc.title}
                                    {svc.badge && (
                                        <span className={`text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                            svc.available 
                                                ? 'bg-secondary/10 text-secondary' 
                                                : 'bg-on-surface-variant/10 text-on-surface-variant/60'
                                        }`}>
                                            {svc.badge}
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[10px] sm:text-xs text-on-surface-variant leading-relaxed opacity-80 h-8 sm:h-9 md:h-10 overflow-hidden line-clamp-3">
                                    {svc.desc}
                                </p>
                            </Card>
                        ))}
                    </div>
                </div>
                {/* Scroll Fade Overlay - visible only on mobile/touch layout when scrollable */}
                <div className="absolute top-0 right-0 bottom-4 w-8 sm:w-10 md:w-12 bg-gradient-to-l from-background to-transparent pointer-events-none lg:hidden" />
            </div>
        </section>
    );
};

export default Services;
