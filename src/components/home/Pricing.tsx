import React from 'react';
import PricingCard from '../ui/PricingCard';

const Pricing = () => {
    const plans = [
        {
            title: 'Free',
            price: '₹0',
            period: '/forever',
            features: [
                'Free Kundli Generation',
                'Daily Horoscope',
                'Basic AI Chat (5 min/day)',
                'Zodiac Insights'
            ],
            buttonText: 'Start Free'
        },
        {
            title: 'Pro',
            price: '₹299',
            period: '/mo',
            features: [
                'Unlimited AI Chat',
                'Advanced Kundli Reports (PDF)',
                'Personalized Predictions',
                'Gemstone Recommendations',
                'Priority Support'
            ],
            isRecommended: true,
            variant: 'primary' as const,
            badge: 'Most Popular'
        },
        {
            title: 'Annual',
            price: '₹2,999',
            period: '/year',
            features: [
                'Everything in Pro',
                'Save 17% vs Monthly',
                'Lifetime Report Storage',
                'Early Access to Features',
                'Kundli Matching Tool'
            ],
            buttonText: 'Best Value',
            badge: 'Save 17%'
        }
    ];

    return (
        <section className="py-8 sm:py-16 lg:py-24 bg-transparent relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10 text-center">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-headline font-bold text-primary mb-3 sm:mb-6">Choose Your Astrology Path</h2>
                <p className="text-sm sm:text-base text-primary/60 font-medium mb-8 sm:mb-16 max-w-2xl mx-auto">Get deeper insights and priority access to world-renowned astrologers with our premium plans.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
                    {plans.map((plan) => (
                        <div key={plan.title} className="h-full">
                            <PricingCard 
                                {...plan}
                            />
                        </div>
                    ))}
                </div>

                <div className="mt-8 sm:mt-12 text-center">
                    <span className="text-xs sm:text-sm font-semibold text-secondary hover:underline cursor-pointer opacity-70">
                        View Detailed Comparison &rarr;
                    </span>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
