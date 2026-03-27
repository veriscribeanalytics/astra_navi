import React from 'react';
import Pricing from '@/components/home/Pricing';
import Card from '@/components/ui/Card';

export const metadata = {
  title: 'Premium Plans | AstraNavi',
  description: 'Unlock deeper astrological insights and priority access with our premium Vedic AI plans.',
};

export default function PlansPage() {
    return (
        <div className="min-h-screen pt-24 pb-16 flex flex-col relative z-10">
            {/* Header Section */}
            <div className="text-center px-4 max-w-3xl mx-auto mb-8 sm:mb-12 space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-primary">
                    Invest in Your Destiny
                </h1>
                <p className="text-lg text-primary/70 max-w-2xl mx-auto">
                    Choose the AstraNavi tier that aligns with your spiritual journey. From daily guidance to comprehensive life forecasting, our Vedic AI scales with your needs.
                </p>
            </div>

            {/* The Pricing Component reused from Home */}
            <Pricing />

            {/* FAQ or Guarantee Section below pricing */}
            <div className="max-w-4xl mx-auto px-4 mt-8 sm:mt-12 w-full">
                <Card padding="lg" variant="bordered" className="!bg-surface/50 backdrop-blur text-center border-secondary/20">
                    <h3 className="text-2xl font-headline font-bold text-primary mb-3">14-Day Spiritual Alignment Guarantee</h3>
                    <p className="text-primary/70">
                        If you don&apos;t feel greater clarity and direction within two weeks of upgrading to Pro or Annual, we&apos;ll refund your subscription—no questions asked. 
                        We believe true astrological guidance speaks for itself.
                    </p>
                </Card>
            </div>
        </div>
    );
}
