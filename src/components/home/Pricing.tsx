'use client';

import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Sparkles } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const plans = [
    { 
        title: 'Astra Seeker',
 
        price: '₹0', 
        period: '/always', 
        features: ['Complete Kundli Generation', 'Daily Rashi Predictions', 'Limited Consultations (5 min/day)', 'Basic Planetary Insights'], 
        buttonText: 'Begin Journey',
        variant: 'secondary' as const
    },
    { 
        title: 'Devotee', 
        price: '₹299', 
        period: '/mo', 
        features: ['Unlimited Navi Consultations', 'Detailed Kundli Reports (PDF)', 'Dasha Period Analysis', 'Remedial Gemstone Guidance'], 
        isRecommended: true, 
        variant: 'primary' as const, 
        badge: 'Most Chosen',
        buttonText: 'Select Devotee'
    },
    { 
        title: 'Disciple', 
        price: '₹2,999', 
        period: '/year', 
        features: ['All Devotee Features', 'Save ₹589 Annually', 'Permanent Chart Archive', 'Compatibility Analysis'], 
        buttonText: 'Commit Fully', 
        badge: 'Best Value',
        variant: 'secondary' as const
    }
];

export default function Pricing() {
    return (
        <section className="py-12 lg:py-20 bg-transparent relative overflow-hidden">
            <div className="max-w-7xl 2xl:max-w-[1800px] 3xl:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Card 
                                padding="none"
                                className={`h-full flex flex-col relative overflow-hidden transition-all duration-500 hover:shadow-2xl ${
                                    plan.isRecommended 
                                    ? 'border-secondary/50 shadow-xl shadow-secondary/5 ring-1 ring-secondary/20' 
                                    : 'border-outline-variant/20'
                                }`}
                            >
                                {plan.badge && (
                                    <div className="absolute top-0 right-0">
                                        <div className="bg-secondary text-white text-[10px] font-bold uppercase tracking-widest py-1 px-4 rounded-bl-xl shadow-lg">
                                            {plan.badge}
                                        </div>
                                    </div>
                                )}

                                <div className="p-8 border-b border-outline-variant/10">
                                    <div className="flex items-center gap-2 mb-4">
                                        {plan.isRecommended && <Sparkles className="w-4 h-4 text-secondary" />}
                                        <h3 className="text-xl font-headline font-bold text-primary">{plan.title}</h3>
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-primary">{plan.price}</span>
                                        <span className="text-sm text-on-surface-variant/60 font-medium">{plan.period}</span>
                                    </div>
                                </div>

                                <div className="p-8 flex-grow space-y-4">
                                    {plan.features.map((feature, fIdx) => (
                                        <div key={fIdx} className="flex items-start gap-3">
                                            <CheckCircle className={`w-5 h-5 shrink-0 ${plan.isRecommended ? 'text-secondary' : 'text-secondary/40'}`} />
                                            <span className="text-sm text-on-surface-variant/80 leading-snug">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-8 pt-0 mt-auto">
                                    <Button 
                                        variant={plan.variant} 
                                        fullWidth 
                                        size="lg"
                                        className={plan.isRecommended ? 'gold-gradient shadow-lg' : ''}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
