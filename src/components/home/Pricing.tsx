import React from 'react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const Pricing = () => {
    return (
        <section className="py-12 sm:py-16 lg:py-24 bg-background dark:bg-transparent relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 relative z-10 text-center">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-headline font-bold text-primary mb-6">Choose Your Astrology Path</h2>
                <p className="text-primary/60 font-medium mb-10 sm:mb-16 max-w-2xl mx-auto">Get deeper insights and priority access to world-renowned astrologers with our premium plans.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8">
                    {/* Basic */}
                    <Card padding="lg" className="flex flex-col items-center">
                        <h4 className="text-xl font-headline font-bold text-primary mb-2">Free</h4>
                        <div className="text-4xl font-bold text-primary mb-8">₹0<span className="text-sm font-normal text-primary/40">/forever</span></div>
                        
                        <ul className="space-y-4 mb-10 text-sm text-primary/70 font-medium text-left w-full">
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Daily Horoscope</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Basic Kundli Report</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Public Chat Access</li>
                        </ul>
                        
                        <Button variant="secondary" fullWidth className="mt-auto py-4 rounded-xl border-2">Get Started</Button>
                    </Card>

                    {/* Pro */}
                    <Card 
                      padding="lg" 
                      allowOverflow={true}
                      className="border-2 border-secondary relative flex flex-col items-center shadow-xl shadow-secondary/5 md:scale-105 z-20"
                    >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-lg">Recommended</div>
                        <h4 className="text-xl font-headline font-bold text-secondary mb-2">Pro</h4>
                        <div className="text-4xl font-bold text-primary mb-8">₹299<span className="text-sm font-normal text-primary/40">/mo</span></div>
                        
                        <ul className="space-y-4 mb-10 text-sm text-primary/70 font-medium text-left w-full">
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Advanced Kundli PDF</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Priority Support Chat</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> 1 Free Question/mo</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Personalized Ritual Advice</li>
                        </ul>
                        
                        <Button variant="primary" fullWidth className="mt-auto py-4 hover:scale-[1.02]">Subscribe Now</Button>
                    </Card>

                    {/* Annual */}
                    <Card padding="lg" className="flex flex-col items-center">
                        <h4 className="text-xl font-headline font-bold text-primary mb-2">Annual</h4>
                        <div className="text-4xl font-bold text-primary mb-8">₹1999<span className="text-sm font-normal text-primary/40">/year</span></div>
                        
                        <ul className="space-y-4 mb-10 text-sm text-primary/70 font-medium text-left w-full">
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Everything in Pro</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> 20% Off Consultations</li>
                            <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-lg">check_circle</span> Lifetime Report Storage</li>
                        </ul>
                        
                        <Button variant="secondary" fullWidth className="mt-auto py-4 rounded-xl border-2">Go Annual</Button>
                    </Card>
                </div>
            </div>
        </section>
    );
};

export default Pricing;
