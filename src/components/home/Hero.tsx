import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '../ui/Input';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '@/context/AuthContext';

const Hero = () => {
    const router = useRouter();
    const { isLoggedIn, user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        dob: '',
        tob: '',
        pob: ''
    });
    const [errors, setErrors] = useState({
        name: '',
        dob: '',
        tob: '',
        pob: ''
    });

    const validateForm = () => {
        const newErrors = { name: '', dob: '', tob: '', pob: '' };
        let isValid = true;

        // Validate name
        if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
            isValid = false;
        }

        // Validate date of birth
        if (formData.dob) {
            const dob = new Date(formData.dob);
            const today = new Date();
            const hundredYearsAgo = new Date();
            hundredYearsAgo.setFullYear(today.getFullYear() - 120);

            if (dob > today) {
                newErrors.dob = 'Birth date cannot be in the future';
                isValid = false;
            } else if (dob < hundredYearsAgo) {
                newErrors.dob = 'Please enter a valid birth date';
                isValid = false;
            }
        }

        // Validate place of birth
        if (formData.pob.trim().length < 2) {
            newErrors.pob = 'Please enter a valid place';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        // Save to local storage to "Claim" after login/register
        localStorage.setItem('astranavi_pending_birth_details', JSON.stringify(formData));
        
        // Redirect to login/register to finish the journey
        router.push('/chat');
    };

    return (
        <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center px-4 sm:px-8 lg:px-12 pt-28 sm:pt-32 lg:pt-40 pb-12 sm:pb-20 overflow-hidden">
            {/* Background glowing orbs */}
            <div className="absolute top-[-10%] right-[-10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-[var(--glow-color)] blur-[80px] sm:blur-[120px] rounded-full -z-10 opacity-30 dark:opacity-60"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-secondary/10 blur-[60px] sm:blur-[100px] rounded-full -z-10 opacity-20"></div>
            
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-14 lg:gap-20 items-center relative z-10">
                <div className="space-y-5 sm:space-y-8 text-center lg:text-left">
                    <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-secondary/10 border border-secondary/30">
                        <span className="material-symbols-outlined text-secondary text-xs sm:text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                        <span className="text-[10px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.15em] font-bold text-secondary font-body">AI-Powered Vedic Astrology</span>
                    </div>
                    
                    <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-headline font-bold leading-[1.1] text-primary">
                        Your personal <span className="text-secondary italic drop-shadow-sm dark:drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]">Jyotish</span> is one tap away
                    </h1>
                    
                    <p className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed font-normal font-body mx-auto lg:mx-0">
                        Instant Vedic insights, 24/7 availability, and zero waiting. Get your personalized Kundli and cosmic guidance powered by AI trained on 5,000+ years of Vedic wisdom.
                    </p>
                    
                    <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 md:gap-10 py-4 sm:py-6 border-y border-secondary/10">
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-secondary font-body">24/7</div>
                            <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-body">Always Available</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-primary font-body">FREE</div>
                            <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-body">Kundli & Chat</div>
                        </div>
                        <div>
                            <div className="text-xl sm:text-2xl font-bold text-primary font-body">Instant</div>
                            <div className="text-[9px] sm:text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-body">No Waiting</div>
                        </div>
                    </div>
                </div>

                {/* Kundli Widget / Welcome Back Card */}
                <Card 
                  className="shadow-2xl shadow-secondary/10 cosmic-glow border-secondary/30 min-h-[320px] sm:min-h-[400px] flex flex-col justify-center"
                  padding="lg"
                >
                    {isLoggedIn && user?.name ? (
                        <div className="text-center space-y-4 sm:space-y-6 py-2 sm:py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                             <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary/10 border border-secondary/30 flex items-center justify-center mb-4 sm:mb-6">
                                <span className="text-2xl sm:text-3xl font-headline font-bold text-secondary">
                                    {(user?.name?.[0] || user?.email?.[0] || 'S').toUpperCase()}
                                </span>
                             </div>
                             
                             <div className="space-y-2">
                                <h3 className="text-xs sm:text-sm font-body font-bold text-secondary tracking-widest uppercase mb-1">Authenticated Seeker</h3>
                                <h2 className="text-2xl sm:text-4xl font-headline font-bold text-primary">Welcome back, {user?.name.split(' ')[0]}</h2>
                                <p className="text-xs sm:text-sm text-on-surface-variant font-body">The stars have moved 1.2 degrees since your last alignment.</p>
                             </div>

                             <div className="pt-4 sm:pt-6">
                                <Button 
                                    href="/chat"
                                    fullWidth
                                    size="lg"
                                    className="shadow-lg shadow-secondary/20"
                                >
                                    Explore Your Cosmos
                                </Button>
                                <p className="mt-3 sm:mt-4 text-[9px] sm:text-[10px] uppercase tracking-widest text-on-surface-variant/60 font-bold font-body">
                                    Born: {user?.dob} • {user?.pob}
                                </p>
                             </div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-xl sm:text-2xl font-headline font-bold mb-5 sm:mb-8 flex items-center gap-2 sm:gap-3 text-primary">
                                <span className="material-symbols-outlined text-secondary text-xl sm:text-2xl">menu_book</span>
                                Generate Free Kundli
                            </h3>
                            
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                                    <div>
                                        <Input 
                                            label="Full Name"
                                            placeholder="Enter your full name" 
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => {
                                                setFormData({...formData, name: e.target.value});
                                                setErrors({...errors, name: ''});
                                            }}
                                            required
                                        />
                                        {errors.name && (
                                            <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <div>
                                        <Input 
                                            label="Date of Birth"
                                            type="date"
                                            icon="calendar_month"
                                            value={formData.dob}
                                            onChange={(e) => {
                                                setFormData({...formData, dob: e.target.value});
                                                setErrors({...errors, dob: ''});
                                            }}
                                            required
                                        />
                                        {errors.dob && (
                                            <p className="text-xs text-red-500 mt-1">{errors.dob}</p>
                                        )}
                                    </div>
                                    <Input 
                                        label="Time of Birth"
                                        type="time"
                                        icon="schedule"
                                        value={formData.tob}
                                        onChange={(e) => setFormData({...formData, tob: e.target.value})}
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <Input 
                                        label="Place of Birth"
                                        placeholder="City, Country" 
                                        type="text"
                                        icon="location_on"
                                        value={formData.pob}
                                        onChange={(e) => {
                                            setFormData({...formData, pob: e.target.value});
                                            setErrors({...errors, pob: ''});
                                        }}
                                        required
                                    />
                                    {errors.pob && (
                                        <p className="text-xs text-red-500 mt-1">{errors.pob}</p>
                                    )}
                                </div>
                                
                                <Button 
                                    type="submit"
                                    fullWidth
                                    size="lg"
                                >
                                    Consult Navi
                                </Button>
                            </form>
                        </>
                    )}
                </Card>
            </div>
        </section>
    );
};

export default Hero;
