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
    iconBg: 'bg-red-500/10 text-red-500', // Specialized color for love
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
        <section className="px-6 lg:px-12 w-full max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-row justify-between items-end mb-6">
                <div>
                    <div className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-secondary uppercase mb-2">
                        What We Offer
                    </div>
                    <h2 className="font-headline text-2xl md:text-3xl font-bold text-primary">
                        All tools in one place
                    </h2>
                </div>
                <span className="text-sm font-semibold text-secondary hover:underline cursor-pointer hidden sm:block">
                    View all &rarr;
                </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {services.map((svc, idx) => (
                    <Card
                        key={idx}
                        variant="bordered"
                        className="!bg-surface/30 backdrop-blur p-4 flex flex-col items-start border-outline-variant/30 hover:border-secondary/40 transition-colors"
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 ${svc.iconBg}`}>
                            {svc.icon}
                        </div>
                        <h3 className="font-headline font-bold text-sm text-primary flex items-center gap-2 mb-1">
                            {svc.title}
                            {svc.badge && (
                                <span className="text-[9px] bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                    {svc.badge}
                                </span>
                            )}
                        </h3>
                        <p className="text-xs text-on-surface-variant leading-relaxed">
                            {svc.desc}
                        </p>
                    </Card>
                ))}
            </div>
        </section>
    );
};

export default Services;
