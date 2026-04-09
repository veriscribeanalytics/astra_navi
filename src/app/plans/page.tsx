import React from 'react';
import Pricing from '@/components/home/Pricing';
import Card from '@/components/ui/Card';

export const metadata = {
  title: 'Premium Plans | AstraNavi',
  description: 'Unlock deeper astrological insights and priority access with our premium Vedic AI plans.',
};

export default function PlansPage() {
    return (
        <div className="min-h-screen pt-20 sm:pt-24 pb-10 sm:pb-16 flex flex-col relative z-10">
            {/* Header Section */}
            <div className="text-center px-4 max-w-3xl mx-auto mb-6 sm:mb-12 space-y-3 sm:space-y-4">
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-headline font-bold text-primary">
                    Join the Beta
                </h1>
                <p className="text-sm sm:text-lg text-primary/70 max-w-2xl mx-auto">
                    Experience unlimited access to all features while we're in testing phase.
                </p>
            </div>

            {/* The Pricing Component reused from Home */}
            <Pricing />

            {/* Beta Info Section */}
            <div className="max-w-4xl mx-auto px-4 mt-6 sm:mt-12 w-full">
                <Card padding="lg" variant="bordered" className="backdrop-blur text-center border-secondary/20 !p-5 sm:!p-8">
                    <h3 className="text-xl sm:text-2xl font-headline font-bold text-primary mb-2 sm:mb-3">Early Adopter Benefits</h3>
                    <p className="text-xs sm:text-base text-primary/70">
                        As a beta tester, you'll shape the future of AstraNavi. When we launch, early supporters will receive exclusive benefits, special pricing, and lifetime recognition as founding members.
                    </p>
                </Card>
            </div>
        </div>
    );
}
