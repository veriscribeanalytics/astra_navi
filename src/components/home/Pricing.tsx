import React from 'react';
import PricingCard from '../ui/PricingCard';

const Pricing = () => {
    const plans = [
        {
            title: 'Free',
            price: '₹0',
            period: '/forever',
            features: [
                'Daily Horoscope',
                'Basic Kundli Report',
                'Public Chat Access'
            ],
            buttonText: 'Get Started'
        },
        {
            title: 'Pro',
            price: '₹299',
            period: '/mo',
            features: [
                'Advanced Kundli PDF',
                'Priority Support Chat',
                '1 Free Question/mo',
                'Personalized Ritual Advice'
            ],
            isRecommended: true,
            variant: 'primary' as const
        },
        {
            title: 'Annual',
            price: '₹1999',
            period: '/year',
            features: [
                'Everything in Pro',
                '20% Off Consultations',
                'Lifetime Report Storage'
            ],
            buttonText: 'Go Annual'
        }
    ];

    return (
        <section className="py-12 sm:py-16 lg:py-24 bg-background dark:bg-transparent relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10 text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold text-primary mb-6">Choose Your Astrology Path</h2>
                <p className="text-primary/60 font-medium mb-10 sm:mb-16 max-w-2xl mx-auto">Get deeper insights and priority access to world-renowned astrologers with our premium plans.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => (
                        <PricingCard 
                            key={plan.title}
                            {...plan}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
