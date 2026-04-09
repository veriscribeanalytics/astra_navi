import React from 'react';
import PricingCard from '../ui/PricingCard';

const Pricing = () => {
    const plans = [
        {
            title: 'Seeker',
            price: '₹0',
            period: '/always',
            features: [
                'Complete Kundli Generation',
                'Daily Rashi Predictions',
                'Limited Consultations (5 min/day)',
                'Basic Planetary Insights'
            ],
            buttonText: 'Begin Journey'
        },
        {
            title: 'Devotee',
            price: '₹299',
            period: '/mo',
            features: [
                'Unlimited Navi Consultations',
                'Detailed Kundli Reports (PDF)',
                'Dasha Period Analysis',
                'Remedial Gemstone Guidance',
                'Priority Access'
            ],
            isRecommended: true,
            variant: 'primary' as const,
            badge: 'Most Chosen'
        },
        {
            title: 'Disciple',
            price: '₹2,999',
            period: '/year',
            features: [
                'All Devotee Features',
                'Save ₹589 Annually',
                'Permanent Chart Archive',
                'Advanced Transit Alerts',
                'Compatibility Analysis'
            ],
            buttonText: 'Commit Fully',
            badge: 'Best Value'
        }
    ];

    return (
        <section className="py-6 sm:py-10 md:py-16 lg:py-24 bg-transparent relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 relative z-10 text-center">
                <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-headline font-bold text-primary mb-2 sm:mb-3 md:mb-4 lg:mb-6">Beta Testing Phase</h2>
                <p className="text-sm sm:text-base text-primary/60 font-medium mb-6 sm:mb-10 md:mb-12 lg:mb-16 max-w-2xl mx-auto">All features are completely free while we gather feedback and perfect the experience.</p>
                
                {/* Coming Soon Placeholder */}
                <div className="max-w-3xl mx-auto">
                    <div className="relative rounded-2xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-secondary/5 border border-secondary/20 bg-gradient-to-br from-surface/50 to-surface/30 backdrop-blur-sm p-8 sm:p-12 md:p-16 lg:p-20">
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
                        
                        <div className="relative z-10 space-y-4 sm:space-y-6">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-secondary/10 flex items-center justify-center border-2 border-secondary/30 overflow-hidden">
                                <img 
                                    src="/icons/logo.jpeg" 
                                    alt="AstraNavi" 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            
                            <div className="space-y-2 sm:space-y-3">
                                <div className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/30">
                                    <span className="text-xs sm:text-sm font-bold text-secondary uppercase tracking-wider">Coming Soon</span>
                                </div>
                                
                                <h3 className="text-2xl sm:text-3xl md:text-4xl font-headline font-bold text-primary">
                                    Pricing Plans in Development
                                </h3>
                                
                                <p className="text-sm sm:text-base md:text-lg text-on-surface-variant max-w-xl mx-auto leading-relaxed">
                                    We're currently testing AstraNavi with early users. Enjoy unlimited access to all features during this phase. Pricing will be announced at official launch.
                                </p>
                            </div>
                            
                            <div className="pt-4 sm:pt-6">
                                <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant/70">
                                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                                    <span>Early users will receive exclusive benefits at launch</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12 text-center">
                    <p className="text-[10px] sm:text-xs text-on-surface-variant/60">
                        Join now and be part of shaping the future of AI Jyotish
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
